import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, View } from 'react-native';

import { syncMedicationReminders } from '../../src/services/medication-reminders';
import {
  archiveMedication,
  deleteMedication,
  getMedications,
  restoreMedication,
  setMedicationReminderEnabled,
  type MedicationRecord,
} from '../../src/services/medications';
import { AppText, Card, PrimaryButton, Screen, useUi } from '../../src/ui';

const weekdaysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const weekdaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function displayDate(value: string, ar: boolean) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString(
    ar ? 'ar-SA-u-ca-gregory' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { row, palette } = useUi();
  return (
    <View style={[row, {
      justifyContent: 'space-between', alignItems: 'flex-start',
      paddingVertical: 13, borderBottomWidth: 1,
      borderBottomColor: palette.border, gap: 12,
    }]}>
      <AppText muted size={13} style={{ flex: 1 }}>{label}</AppText>
      <AppText weight="700" size={14} style={{ flex: 1, textAlign: 'auto' }}>{value}</AppText>
    </View>
  );
}

export default function MedicationDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale, palette, row } = useUi();
  const ar = locale === 'ar';

  const [medication, setMedication] = useState<MedicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const records = await getMedications();
        const found = records.find((item) => item.id === id);
        if (mounted) setMedication(found ?? null);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [id]));

  async function changeReminder(enabled: boolean) {
    if (!medication || busy || medication.status === 'archived' || medication.frequency === 'as_needed') return;
    setBusy(true);
    try {
      const updated = await setMedicationReminderEnabled(medication.id, enabled);
      setMedication(updated);
      try {
        await syncMedicationReminders(enabled);
      } catch (syncError) {
        Alert.alert(
          ar ? 'تعذر تحديث الإشعارات' : 'Notifications not updated',
          ar
            ? 'تم حفظ اختيارك، لكن تعذر تحديث إشعارات الجهاز. تأكد من السماح بالإشعارات ثم افتح التطبيق مجددًا.'
            : 'Your preference was saved, but device notifications could not be updated. Check notification permission and reopen the app.'
        );
      }
    } catch (err) {
      Alert.alert(ar ? 'تعذر حفظ الإعداد' : 'Could not save setting',
        err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function confirmArchive() {
    if (!medication || busy) return;
    const target = medication;
    Alert.alert(
      ar ? 'أرشفة الدواء' : 'Archive medication',
      ar
        ? `هل تريد أرشفة ${target.name}؟ ستُحفظ سجلات الجرعات، ولن يظهر الدواء ضمن الأدوية الحالية.`
        : `Archive ${target.name}? Its dose history will be preserved, and it will no longer appear among current medications.`,
      [
        { text: ar ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: ar ? 'أرشفة' : 'Archive', onPress: async () => {
          setBusy(true);
          try {
            await archiveMedication(target.id);
            try { await syncMedicationReminders(); } catch (notificationError) {
              console.warn('Reminder update failed:', notificationError);
              Alert.alert(ar ? 'تنبيه' : 'Reminder warning', ar ? 'تم تحديث الدواء، لكن تعذر تحديث التذكيرات.' : 'Medication updated, but reminders could not be refreshed.');
            }
            router.replace('/medications');
          } catch (err) {
            Alert.alert(ar ? 'تعذرت الأرشفة' : 'Archive failed', err instanceof Error ? err.message : String(err));
          } finally { setBusy(false); }
        } },
      ]
    );
  }

  function confirmRestore() {
    if (!medication || busy) return;
    const target = medication;
    Alert.alert(
      ar ? 'استعادة الدواء' : 'Restore medication',
      ar
        ? `هل تريد استعادة ${target.name}؟ ستبقى تواريخ الوصفة كما هي، ولن يتم تمديدها تلقائيًا.`
        : `Restore ${target.name}? Prescription dates will stay unchanged and will not be extended automatically.`,
      [
        { text: ar ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: ar ? 'استعادة' : 'Restore', onPress: async () => {
          setBusy(true);
          try {
            await restoreMedication(target.id);
            try { await syncMedicationReminders(); } catch (notificationError) {
              console.warn('Reminder update failed:', notificationError);
              Alert.alert(ar ? 'تنبيه' : 'Reminder warning', ar ? 'تم تحديث الدواء، لكن تعذر تحديث التذكيرات.' : 'Medication updated, but reminders could not be refreshed.');
            }
            setMedication({ ...target, status: 'active' });
          } catch (err) {
            Alert.alert(ar ? 'تعذرت الاستعادة' : 'Restore failed', err instanceof Error ? err.message : String(err));
          } finally { setBusy(false); }
        } },
      ]
    );
  }

  function confirmDelete() {
    if (!medication || busy) return;
    const target = medication;
    Alert.alert(
      ar ? 'حذف الدواء نهائيًا' : 'Permanently delete medication',
      ar
        ? `سيتم حذف ${target.name} وجميع سجلات جرعاته نهائيًا. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟`
        : `This permanently deletes ${target.name} and all of its dose history. This cannot be undone. Are you sure?`,
      [
        { text: ar ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: ar ? 'حذف نهائي' : 'Delete permanently', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            await deleteMedication(target.id);
            try { await syncMedicationReminders(); } catch (notificationError) {
              console.warn('Reminder update failed:', notificationError);
              Alert.alert(ar ? 'تنبيه' : 'Reminder warning', ar ? 'تم تحديث الدواء، لكن تعذر تحديث التذكيرات.' : 'Medication updated, but reminders could not be refreshed.');
            }
            router.replace('/medications');
          } catch (err) {
            Alert.alert(ar ? 'تعذر الحذف' : 'Delete failed', err instanceof Error ? err.message : String(err));
          } finally { setBusy(false); }
        } },
      ]
    );
  }

  const frequencyLabels = {
    daily: ar ? 'يوميًا' : 'Daily',
    weekly: ar ? 'أسبوعيًا' : 'Weekly',
    as_needed: ar ? 'عند الحاجة' : 'As needed',
  };

  return (
    <Screen scroll>
      <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/medications'); }} style={{ marginTop: 12, marginBottom: 20 }}>
        <AppText style={{ color: palette.tealDark }}>{ar ? '→ رجوع' : '← Back'}</AppText>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color={palette.teal} />
      ) : error || !medication ? (
        <Card>
          <AppText weight="700">{ar ? 'تعذر عرض تفاصيل الدواء' : 'Unable to load medication details'}</AppText>
          <AppText muted style={{ marginTop: 8 }}>
            {error || (ar ? 'لم يتم العثور على الدواء.' : 'Medication not found.')}
          </AppText>
        </Card>
      ) : (
        <>
          <Card style={{ backgroundColor: palette.mint, marginBottom: 18 }}>
            <View style={[row, { alignItems: 'center', gap: 12 }]}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="medical" size={25} color={palette.tealDark} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText size={21} weight="700">{medication.name}</AppText>
                <AppText muted size={14}>{medication.dosage}</AppText>
              </View>
            </View>
          </Card>

          <AppText size={19} weight="700" style={{ marginBottom: 12 }}>
            {ar ? 'معلومات الدواء' : 'Medication information'}
          </AppText>

          <Card>
            <InfoRow label={ar ? 'اسم الدواء' : 'Medication name'} value={medication.name} />
            <InfoRow label={ar ? 'الجرعة الموصوفة' : 'Prescribed dosage'} value={medication.dosage} />
            <InfoRow label={ar ? 'التكرار' : 'Frequency'} value={frequencyLabels[medication.frequency]} />
            {medication.frequency === 'weekly' && (
              <InfoRow label={ar ? 'يوم الجرعة' : 'Dose day'} value={medication.days_of_week.map(day => (ar ? weekdaysAr : weekdaysEn)[day]).filter(Boolean).join(', ') || '—'} />
            )}
            {medication.frequency !== 'as_needed' && (
              <InfoRow label={ar ? 'وقت الجرعة' : 'Dose time'} value={medication.scheduled_times.join(', ') || '—'} />
            )}
            <InfoRow label={ar ? 'تاريخ البداية' : 'Start date'} value={displayDate(medication.start_date, ar)} />
            <InfoRow label={ar ? 'تاريخ النهاية' : 'End date'} value={medication.end_date ? displayDate(medication.end_date, ar) : (ar ? 'غير محدد' : 'Not specified')} />
            <InfoRow label={ar ? 'تعليمات الطبيب' : 'Prescriber instructions'} value={medication.instructions || (ar ? 'لا توجد تعليمات إضافية' : 'No additional instructions')} />
            <InfoRow label={ar ? 'الحالة' : 'Status'} value={medication.status === 'archived' ? (ar ? 'مؤرشف' : 'Archived') : (ar ? 'مسجل' : 'Recorded')} />
          </Card>

          <View style={{ marginTop: 20, marginBottom: 6 }}>
            <AppText size={19} weight="700" style={{ marginBottom: 12 }}>
              {ar ? 'تذكيرات الدواء' : 'Medication reminders'}
            </AppText>
            <Card>
              <View style={[row, { alignItems: 'center', gap: 12 }]}>
                <View style={{
                  width: 42, height: 42, borderRadius: 13,
                  backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="notifications-outline" size={22} color={palette.tealDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="700" size={15}>
                    {ar ? 'تنبيه وقت الجرعة' : 'Dose-time reminder'}
                  </AppText>
                  <AppText muted size={12} style={{ marginTop: 3 }}>
                    {medication.status === 'archived'
                      ? (ar ? 'متوقف لأن الدواء مؤرشف' : 'Paused while archived')
                      : medication.frequency === 'as_needed'
                      ? (ar ? 'غير متاح للأدوية عند الحاجة' : 'Unavailable for as-needed medication')
                      : medication.reminder_enabled !== false
                      ? (ar ? 'مفعّل' : 'Enabled')
                      : (ar ? 'متوقف' : 'Off')}
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel={ar ? 'تفعيل تذكيرات الدواء' : 'Enable medication reminders'}
                  value={medication.reminder_enabled !== false}
                  disabled={busy || medication.status === 'archived' || medication.frequency === 'as_needed'}
                  onValueChange={(value) => void changeReminder(value)}
                  trackColor={{ false: palette.border, true: palette.teal }}
                  thumbColor={palette.surface}
                />
              </View>
              {medication.frequency !== 'as_needed' && (
                <View style={{
                  borderTopWidth: 1, borderTopColor: palette.border,
                  marginTop: 14, paddingTop: 12,
                }}>
                  <View style={[row, { alignItems: 'center', justifyContent: 'space-between', gap: 10 }]}>
                    <AppText muted size={13}>{ar ? 'الوقت' : 'Time'}</AppText>
                    <AppText size={13} weight="700">
                      {medication.scheduled_times.join('، ') || '—'}
                    </AppText>
                  </View>
                  <View style={[row, { alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 }]}>
                    <AppText muted size={13}>{ar ? 'التكرار' : 'Repeats'}</AppText>
                    <AppText size={13} weight="700">
                      {medication.frequency === 'weekly'
                        ? medication.days_of_week.map(day => (ar ? weekdaysAr : weekdaysEn)[day]).filter(Boolean).join('، ')
                        : (ar ? 'يوميًا' : 'Daily')}
                    </AppText>
                  </View>
                </View>
              )}
              <AppText muted size={12} style={{ marginTop: 12 }}>
                {ar
                  ? 'تعتمد الإشعارات على إعدادات جهازك. قد يتطلب استمرار التذكيرات فتح عون دوريًا.'
                  : 'Notifications depend on device permissions. Open Awon periodically to keep reminders scheduled.'}
              </AppText>
            </Card>
          </View>

          <Card style={{ marginTop: 18, marginBottom: 18, backgroundColor: palette.mint }}>
            <View style={[row, { alignItems: 'flex-start', gap: 10 }]}>
              <Ionicons name="information-circle-outline" size={21} color={palette.tealDark} />
              <AppText size={13} style={{ flex: 1 }}>
                {ar
                  ? 'هذه المعلومات مسجلة لمساعدتك على متابعة أدويتك. اتبع تعليمات الطبيب أو الصيدلي عند تناول الدواء.'
                  : 'These details help you track your medications. Follow your prescriber or pharmacist’s instructions.'}
              </AppText>
            </View>
          </Card>

          <View style={{ marginTop: 8, marginBottom: 24, gap: 12 }}>
            {medication.status !== 'archived' ? (
              <>
                <PrimaryButton
                  label={ar ? 'تعديل الدواء' : 'Edit medication'}
                  onPress={() => router.push({ pathname: '/medication-add', params: { id: medication.id } })}
                />
                <Pressable onPress={confirmArchive} disabled={busy} style={{ paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: palette.border, alignItems: 'center', opacity: busy ? 0.5 : 1 }}>
                  <AppText weight="700" style={{ color: palette.ink }}>
                    {busy ? (ar ? 'جارٍ التنفيذ...' : 'Working...') : (ar ? 'أرشفة الدواء' : 'Archive medication')}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <PrimaryButton
                label={busy ? (ar ? 'جارٍ التنفيذ...' : 'Working...') : (ar ? 'استعادة الدواء' : 'Restore medication')}
                onPress={confirmRestore}
              />
            )}

            <Pressable onPress={confirmDelete} disabled={busy} style={{ paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: '#C74848', alignItems: 'center', opacity: busy ? 0.5 : 1 }}>
              <AppText weight="700" style={{ color: '#C74848' }}>
                {ar ? 'حذف الدواء نهائيًا' : 'Permanently delete medication'}
              </AppText>
            </Pressable>
          </View>
        </>
      )}
    </Screen>
  );
}
