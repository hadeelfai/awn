import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  getDoseRecordsForDate, getMedications,
  type MedicationDoseRecord,
  type MedicationRecord,
} from '../../src/services/medications';
import { AppText, Card, Screen, StatusPill, useUi } from '../../src/ui';

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
function shiftDate(key: string, days: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

type HistoryEntry = {
  key: string;
  medicationName: string;
  dosage: string;
  scheduledAt: string;
  status: 'taken' | 'skipped' | 'pending';
  actualRecord: boolean;
};

function makeHistory(
  medications: MedicationRecord[],
  records: MedicationDoseRecord[],
  selectedDate: string
): HistoryEntry[] {
  const byId = new Map(medications.map((m) => [m.id, m]));
  const entries = new Map<string, HistoryEntry>();

  // Actual recorded actions are the source of truth, including archived medications.
  for (const record of records) {
    const med = byId.get(record.medication_id);
    const timestamp = new Date(record.scheduled_at).getTime();
    if (!Number.isFinite(timestamp)) continue;
    const key = `${record.medication_id}|${timestamp}`;
    entries.set(key, {
      key,
      medicationName: med?.name ?? 'Medication',
      dosage: med?.dosage ?? '',
      scheduledAt: record.scheduled_at,
      status: record.status,
      actualRecord: true,
    });
  }

  // Pending entries are estimates based on today's saved schedule, not historical snapshots.
  for (const med of medications) {
    if (med.start_date > selectedDate || (med.end_date && med.end_date < selectedDate)) continue;
    if (med.frequency === 'as_needed') continue;
    if (med.frequency === 'weekly' && !med.days_of_week.includes(dateFromKey(selectedDate).getDay())) continue;
    for (const time of med.scheduled_times) {
      const [hour, minute] = time.split(':').map(Number);
      if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) continue;
      const at = dateFromKey(selectedDate);
      at.setHours(hour, minute, 0, 0);
      const key = `${med.id}|${at.getTime()}`;
      if (!entries.has(key)) {
        entries.set(key, {
          key,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledAt: at.toISOString(),
          status: 'pending',
          actualRecord: false,
        });
      }
    }
  }
  return [...entries.values()].sort((a, b) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

export default function MedicationHistory() {
  const router = useRouter();
  const { locale, palette, row } = useUi();
  const ar = locale === 'ar';
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [records, setRecords] = useState<MedicationDoseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([getMedications(), getDoseRecordsForDate(selectedDate)])
      .then(([meds, doses]) => {
        if (active) { setMedications(meds); setRecords(doses); }
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedDate]));

  const entries = makeHistory(medications, records, selectedDate);
  const taken = entries.filter((item) => item.status === 'taken').length;
  const skipped = entries.filter((item) => item.status === 'skipped').length;
  const pending = entries.filter((item) => item.status === 'pending').length;
  const isToday = selectedDate >= dateKey(new Date());

  return (
    <Screen scroll>
      <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/medications'); }} style={{ marginTop: 12, marginBottom: 20 }}>
        <AppText style={{ color: palette.tealDark }}>{ar ? '→ رجوع' : '← Back'}</AppText>
      </Pressable>
      <AppText size={23} weight="700" style={{ marginBottom: 16 }}>
        {ar ? 'سجل الجرعات' : 'Dose history'}
      </AppText>
      <Card style={{ marginBottom: 16 }}>
        <View style={[row, { justifyContent: 'space-between', alignItems: 'center', gap: 12 }]}>
          <Pressable accessibilityRole="button" onPress={() => setSelectedDate((value) => shiftDate(value, -1))} style={{ padding: 12 }}>
            <Ionicons name={ar ? 'chevron-forward' : 'chevron-back'} size={23} color={palette.tealDark} />
          </Pressable>
          <AppText weight="700" size={16}>
            {dateFromKey(selectedDate).toLocaleDateString(ar ? 'ar-SA-u-ca-gregory' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </AppText>
          <Pressable accessibilityRole="button" disabled={isToday} onPress={() => setSelectedDate((value) => shiftDate(value, 1))} style={{ padding: 12, opacity: isToday ? 0.3 : 1 }}>
            <Ionicons name={ar ? 'chevron-back' : 'chevron-forward'} size={23} color={palette.tealDark} />
          </Pressable>
        </View>
      </Card>
      {loading ? (
        <ActivityIndicator size="large" color={palette.teal} />
      ) : error ? (
        <Card><AppText weight="700">{ar ? 'تعذر تحميل السجل' : 'Unable to load history'}</AppText><AppText muted>{error}</AppText></Card>
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <View style={[row, { justifyContent: 'space-around', gap: 8 }]}>
              {[
                { count: taken, label: ar ? 'تم التناول' : 'Taken' },
                { count: skipped, label: ar ? 'تم التخطي' : 'Skipped' },
                { count: pending, label: ar ? 'غير مسجلة' : 'Pending' },
              ].map((item) => (
                <View key={item.label} style={{ alignItems: 'center', flex: 1, gap: 4 }}>
                  <AppText weight="700" size={22}>{item.count}</AppText>
                  <AppText muted size={12}>{item.label}</AppText>
                </View>
              ))}
            </View>
          </Card>
          <Card>
            {entries.length === 0 ? (
              <AppText muted>{ar ? 'لا توجد جرعات لهذا اليوم.' : 'No doses for this day.'}</AppText>
            ) : entries.map((item) => (
              <View key={item.key} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: palette.border }}>
                <View style={[row, { alignItems: 'center', justifyContent: 'space-between', gap: 8 }]}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <AppText weight="700">{item.medicationName}</AppText>
                    <AppText muted size={12}>
                      {item.dosage}{item.dosage ? ' · ' : ''}{new Date(item.scheduledAt).toLocaleTimeString(ar ? 'ar-SA' : 'en-US', { hour: 'numeric', minute: '2-digit' })}
                    </AppText>
                  </View>
                  <StatusPill
                    label={item.status === 'taken' ? (ar ? 'تم التناول' : 'Taken') : item.status === 'skipped' ? (ar ? 'تم التخطي' : 'Skipped') : (ar ? 'غير مسجلة' : 'Pending')}
                    tone={item.status === 'taken' ? 'success' : item.status === 'skipped' ? 'neutral' : 'info'}
                  />
                </View>
              </View>
            ))}
          </Card>
          <AppText muted size={12} style={{ marginTop: 14, marginBottom: 24 }}>
            {ar
              ? 'الحالات المسجلة مستمدة من سجل الجرعات الفعلي. الجرعات غير المسجلة تقديرية بناءً على جدول الدواء الحالي، وقد لا تعكس أي تعديلات سابقة. لا تعني «غير مسجلة» أن الجرعة فاتت.'
              : 'Taken and skipped statuses come from saved dose records. Pending doses are estimated from current medication schedules and may not reflect past edits. Pending does not mean missed.'}
          </AppText>
        </>
      )}
    </Screen>
  );
}
