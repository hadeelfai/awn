import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMedications, type MedicationRecord } from './medications';

// iOS permits a limited number of pending local notifications. Keep a rolling
// window and refresh when the app is opened or a medication changes.
const DAYS_AHEAD = 14;
const MAX_REMINDERS = 50;
const TAG = 'awon-medication-v1';
let pendingSync: Promise<number> = Promise.resolve(0);

function dateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function reminderTimes(medications: MedicationRecord[]): { medication: MedicationRecord; date: Date }[] {
  const now = new Date();
  const events: { medication: MedicationRecord; date: Date }[] = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayText = dateOnly(day);
    for (const medication of medications) {
      if (medication.status !== 'active' || medication.reminder_enabled === false || medication.frequency === 'as_needed') continue;
      if (dayText < medication.start_date || (medication.end_date && dayText > medication.end_date)) continue;
      if (medication.frequency === 'weekly' && !medication.days_of_week.includes(day.getDay())) continue;
      for (const time of medication.scheduled_times) {
        const match = /^(\d{1,2}):(\d{2})$/.exec(time);
        if (!match) continue;
        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        if (hours > 23 || minutes > 59) continue;
        const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
        if (date.getTime() > now.getTime() + 1000) events.push({ medication, date });
      }
    }
  }
  return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, MAX_REMINDERS);
}

async function syncNow(askPermission: boolean): Promise<number> {
  if (Platform.OS === 'web') return 0;
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && askPermission && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  // Do not disturb existing reminders if the app cannot schedule replacements.
  if (!permission.granted) {
    if (askPermission) throw new Error('Notification permission is disabled. Enable notifications for Expo Go in iPhone Settings.');
    return 0;
  }

  const medications = await getMedications();
  const events = reminderTimes(medications);
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const ours = existing.filter((item) => item.content.data?.awonTag === TAG);
  for (const item of ours) await Notifications.cancelScheduledNotificationAsync(item.identifier);

  let count = 0;
  for (const { medication, date } of events) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'عون | تذكير بالدواء',
        body: `${medication.name} — ${medication.dosage}`,
        sound: 'default',
        data: { awonTag: TAG, medicationId: medication.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
    count++;
  }
  return count;
}

// Serialize reschedules to avoid edits/archive actions racing each other.
export function syncMedicationReminders(askPermission = false): Promise<number> {
  pendingSync = pendingSync.catch(() => 0).then(() => syncNow(askPermission));
  return pendingSync;
}

export async function clearMedicationReminders(): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of existing) {
    if (item.content.data?.awonTag === TAG) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}
