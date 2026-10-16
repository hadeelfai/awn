
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  View
} from 'react-native';

import {
  AppText,
  Card,
  PrimaryButton,
  Screen,
  StatusPill,
  TopBar,
  useUi,
} from '../../src/ui';

import {
  buildScheduledDoses,
  getDoseRecordsForDate,
  getMedications,
  recordMedicationDose,
  undoMedicationDose,
  type DoseStatus,
  type MedicationDoseRecord,
  type MedicationRecord,
  type ScheduledDose,
} from '../../src/services/medications';

const EXPIRY_WARNING_DAYS = 7;

function todayLocal(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function daysBetween(today: string, target: string): number {
  const toUTC = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };

  return Math.round(
    (toUTC(target) - toUTC(today)) / 86400000
  );
}

function formatDate(date: string, ar: boolean): string {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(year, month - 1, day, 12).toLocaleDateString(
    ar ? 'ar-SA-u-ca-gregory' : 'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

function medicationStatus(
  medication: MedicationRecord,
  today: string
): 'active' | 'endingSoon' | 'expired' | 'upcoming' | 'archived' {
  if (medication.status === 'archived') return 'archived';
  if (medication.start_date > today) return 'upcoming';

  if (medication.end_date) {
    const remaining = daysBetween(today, medication.end_date);

    if (remaining < 0) return 'expired';
    if (remaining <= EXPIRY_WARNING_DAYS) return 'endingSoon';
  }

  return 'active';
}

export default function Medications() {
  const router = useRouter();
  const { locale, palette, row } = useUi();
  const ar = locale === 'ar';

  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doseRecords, setDoseRecords] = useState<MedicationDoseRecord[]>([]);
  const [doseError, setDoseError] = useState<string | null>(null);
  const [savingDoseKey, setSavingDoseKey] = useState<string | null>(null);
  const savingDoseRef = useRef(false);
  const [doseRevision, setDoseRevision] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function load() {
        setLoading(true);
        setError(null);

        try {
          const records = await getMedications();
          if (mounted) setMedications(records);

          try {
            const doses = await getDoseRecordsForDate(todayLocal());
            if (mounted) {
              setDoseRecords(doses.map((record) => ({
                ...record,
                scheduled_at: new Date(record.scheduled_at).toISOString(),
              })));
              setDoseError(null);
            }
          } catch (doseErr) {
            if (mounted) {
              setDoseRecords([]);
              setDoseError(doseErr instanceof Error ? doseErr.message : 'Unable to load dose records');
            }
          }
        } catch (err) {
          if (mounted) {
            setError(
              err instanceof Error
                ? err.message
                : 'Failed to load medications'
            );
          }
        } finally {
          if (mounted) setLoading(false);
        }
      }

      load();

      return () => {
        mounted = false;
      };
    }, [doseRevision])
  );

  const today = todayLocal();
  const scheduledDoses = doseError ? [] : buildScheduledDoses(medications, today, doseRecords);

  async function changeDose(dose: ScheduledDose, status: DoseStatus | 'pending') {
    // A ref blocks rapid taps even before React has rendered the loading state.
    if (savingDoseRef.current) return;
    savingDoseRef.current = true;

    const key = `${dose.medicationId}|${dose.scheduledAt}`;
    setSavingDoseKey(key);

    try {
      if (status === 'pending') {
        await undoMedicationDose(dose.medicationId, dose.scheduledAt);
        setDoseRecords((previous) =>
          previous.filter(
            (record) =>
              !(record.medication_id === dose.medicationId &&
                new Date(record.scheduled_at).getTime() === new Date(dose.scheduledAt).getTime())
          )
        );
      } else {
        const saved = await recordMedicationDose(
          dose.medicationId,
          dose.scheduledAt,
          status
        );
        // Update the visible card as soon as Supabase confirms the save.
        // No full-screen reload is needed.
        setDoseRecords((previous) => [
          ...previous.filter(
            (record) =>
              !(record.medication_id === dose.medicationId &&
                new Date(record.scheduled_at).getTime() === new Date(dose.scheduledAt).getTime())
          ),
          { ...saved, scheduled_at: dose.scheduledAt },
        ]);
      }
    } catch (err) {
      Alert.alert(
        ar ? 'تعذر حفظ الجرعة' : 'Unable to save dose',
        err instanceof Error
          ? err.message
          : ar ? 'حاول مرة أخرى' : 'Please try again'
      );
    } finally {
      savingDoseRef.current = false;
      setSavingDoseKey(null);
    }
  }

  const activeMedications = medications.filter((medication) => {
    const status = medicationStatus(medication, today);
    return status === 'active' || status === 'endingSoon';
  });

  const attentionMedications = medications.filter((medication) => {
    const status = medicationStatus(medication, today);
    return status === 'endingSoon' || status === 'expired';
  });

  const currentMedications = medications.filter((medication) => {
    return medicationStatus(medication, today) === 'active';
  });

  const otherMedications = medications.filter((medication) => {
    const status = medicationStatus(medication, today);
    return status === 'upcoming' || status === 'archived';
  });

  const endingSoonCount = attentionMedications.filter(
    (medication) =>
      medicationStatus(medication, today) === 'endingSoon'
  ).length;

  const nextExpiring = [...attentionMedications]
    .filter((medication) =>
      medicationStatus(medication, today) === 'endingSoon'
    )
    .sort((a, b) =>
      (a.end_date ?? '').localeCompare(b.end_date ?? '')
    )[0];

  const activeCount = activeMedications.length;

  return (
    <Screen scroll>
      <TopBar
        title={ar ? 'أدويتي' : 'My medications'}
        right={null}
      />

      <View style={{ marginTop: 16, marginBottom: 16 }}>
        <PrimaryButton
          label={ar ? 'إضافة دواء +' : 'Add medication +'}
          onPress={() => router.push('/medication-add')}
        />
      </View>

      {loading ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={palette.teal} />
          <AppText muted style={{ marginTop: 12 }}>
            {ar ? 'جارٍ تحميل أدويتك...' : 'Loading medications...'}
          </AppText>
        </View>
      ) : error ? (
        <Card style={{ marginTop: 12 }}>
          <AppText weight="700">
            {ar ? 'تعذر تحميل الأدوية' : 'Unable to load medications'}
          </AppText>
          <AppText muted style={{ marginTop: 8 }}>
            {error}
          </AppText>
          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              label={ar ? 'إعادة المحاولة' : 'Try again'}
              onPress={() => router.replace('/medications')}
            />
          </View>
        </Card>
      ) : (
        <>
          <Card
            style={{
              marginBottom: 20,
              backgroundColor: palette.mint,
            }}
          >
            <View style={[row, { alignItems: 'center', gap: 12 }]}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  backgroundColor: palette.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="medkit"
                  size={23}
                  color={palette.tealDark}
                />
              </View>

              <View style={{ flex: 1 }}>
                <AppText size={18} weight="700">
                  {ar
                    ? `لديك ${activeCount} من الأدوية الحالية`
                    : `You have ${activeCount} current medications`}
                </AppText>

                <AppText muted size={13} style={{ marginTop: 3 }}>
                  {endingSoonCount > 0
                    ? ar
                      ? `${endingSoonCount} من الوصفات تنتهي قريبًا`
                      : `${endingSoonCount} prescriptions ending soon`
                    : ar
                      ? 'تابع أدويتك ومواعيدها في مكان واحد'
                      : 'Track your medications in one place'}
                </AppText>
              </View>
            </View>
          </Card>

          <View style={{ marginBottom: 18 }}>
            <PrimaryButton
              label={ar ? 'عرض سجل الجرعات' : 'View dose history'}
              onPress={() => router.push('/medication-history')}
            />
          </View>

          <TodayDosesSection
            doses={scheduledDoses}
            ar={ar}
            error={doseError}
            savingDoseKey={savingDoseKey}
            onChangeDose={changeDose}
            onRetry={() => setDoseRevision((value) => value + 1)}
          />

          {medications.length === 0 ? (
            <Card style={{ paddingVertical: 28 }}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <Ionicons
                  name="medical-outline"
                  size={42}
                  color={palette.teal}
                />
                <AppText size={18} weight="700">
                  {ar ? 'لا توجد أدوية مضافة بعد' : 'No medications yet'}
                </AppText>
                <AppText muted size={13}>
                  {ar
                    ? 'أضف أدويتك لعرض مواعيدها ومتابعة وصفاتك.'
                    : 'Add medications to view schedules and prescriptions.'}
                </AppText>
              </View>
            </Card>
          ) : (
            <>
              {attentionMedications.length > 0 && (
                <MedicationSection
                  title={ar ? 'يحتاج انتباهك' : 'Needs your attention'}
                  icon="notifications-outline"
                  medications={attentionMedications}
                  today={today}
                />
              )}

              {currentMedications.length > 0 && (
                <MedicationSection
                  title={ar ? 'الأدوية الحالية' : 'Current medications'}
                  icon="medical-outline"
                  medications={currentMedications}
                  today={today}
                />
              )}

              {otherMedications.length > 0 && (
                <MedicationSection
                  title={ar ? 'أدوية أخرى' : 'Other medications'}
                  icon="albums-outline"
                  medications={otherMedications}
                  today={today}
                />
              )}

              {nextExpiring && nextExpiring.end_date && (
                <Card
                  style={{
                    marginTop: 16,
                    backgroundColor: palette.mint,
                  }}
                >
                  <View style={[row, { gap: 10, alignItems: 'flex-start' }]}>
                    <Ionicons
                      name="sparkles"
                      size={20}
                      color={palette.tealDark}
                    />
                    <View style={{ flex: 1 }}>
                      <AppText
                        size={16}
                        weight="700"
                        style={{ color: palette.tealDark }}
                      >
                        {ar ? 'عون يذكّرك' : 'Awn reminder'}
                      </AppText>
                      <AppText size={13} style={{ marginTop: 5 }}>
                        {ar
                          ? `متبقي ${daysBetween(today, nextExpiring.end_date)} أيام على انتهاء وصفة ${nextExpiring.name}.`
                          : `${daysBetween(today, nextExpiring.end_date)} days remain before ${nextExpiring.name} ends.`}
                      </AppText>
                    </View>
                  </View>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function MedicationSection({
  title,
  icon,
  medications,
  today,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  medications: MedicationRecord[];
  today: string;
}) {
  const { palette, row } = useUi();

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={[
          row,
          {
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            marginBottom: 12,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={palette.teal}
        />
        <AppText size={20} weight="700">
          {title}
        </AppText>
      </View>

      {medications.map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
          today={today}
        />
      ))}
    </View>
  );
}

function MedicationCard({
  medication,
  today,
}: {
  medication: MedicationRecord;
  today: string;
}) {
  const { locale, palette, row } = useUi();
  const router = useRouter();
  const ar = locale === 'ar';

  const status = medicationStatus(medication, today);
  const daysLeft = medication.end_date
    ? daysBetween(today, medication.end_date)
    : null;

  const statusLabels = {
    active: ar ? 'فعّالة' : 'Active',
    endingSoon: ar ? 'تنتهي قريبًا' : 'Ending soon',
    expired: ar ? 'منتهية' : 'Expired',
    upcoming: ar ? 'لم تبدأ بعد' : 'Upcoming',
    archived: ar ? 'مؤرشفة' : 'Archived',
  };

  const statusTones = {
    active: 'success',
    endingSoon: 'warning',
    expired: 'danger',
    upcoming: 'info',
    archived: 'neutral',
  } as const;

  const frequencyText =
    medication.frequency === 'daily'
      ? ar ? 'يوميًا' : 'Daily'
      : medication.frequency === 'weekly'
      ? ar ? 'أسبوعيًا' : 'Weekly'
      : ar ? 'عند الحاجة' : 'As needed';

  const scheduleText =
    medication.frequency === 'as_needed'
      ? frequencyText
      : `${frequencyText} ${
          medication.scheduled_times.join(', ')
        }`;

  return (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={
      ar
        ? `عرض تفاصيل ${medication.name}`
        : `View details for ${medication.name}`
    }
    onPress={() =>
      router.push({
        pathname: '/medication-details',
        params: { id: medication.id },
      })
    }
  >
    <Card style={{ marginBottom: 12 }}>
      <View
        style={[
          row,
          {
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          },
        ]}
      >
        <View style={[row, { flex: 1, gap: 11, alignItems: 'center' }]}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: palette.mint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="medical"
              size={21}
              color={palette.tealDark}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppText size={18} weight="700">
              {medication.name}
            </AppText>
            <AppText muted size={13} style={{ marginTop: 2 }}>
              {medication.dosage}
            </AppText>
          </View>
        </View>

        <StatusPill
          label={statusLabels[status]}
          tone={statusTones[status]}
        />
      </View>

      <View
        style={[
          row,
          {
            alignItems: 'center',
            gap: 8,
            marginTop: 17,
          },
        ]}
      >
        <Ionicons
          name="time-outline"
          size={17}
          color={palette.teal}
        />
        <AppText size={14}>
          {scheduleText}
        </AppText>
      </View>

      {!!medication.instructions && (
        <AppText muted size={13} style={{ marginTop: 8 }}>
          {medication.instructions}
        </AppText>
      )}

      <View
        style={{
          marginTop: 15,
          padding: 13,
          borderRadius: 15,
          backgroundColor:
            status === 'endingSoon'
              ? palette.mint
              : palette.bg,
        }}
      >
        <View
          style={[
            row,
            {
              justifyContent: 'space-between',
              gap: 10,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AppText muted size={12}>
              {ar ? 'انتهاء الوصفة' : 'Prescription ends'}
            </AppText>
            <AppText weight="700" style={{ marginTop: 2 }}>
              {medication.end_date
                ? formatDate(medication.end_date, ar)
                : ar ? 'غير محدد' : 'Not specified'}
            </AppText>
          </View>

          <View style={{ flex: 1 }}>
            <AppText muted size={12}>
              {ar ? 'الوقت المتبقي' : 'Time remaining'}
            </AppText>
            <AppText weight="700" style={{ marginTop: 2 }}>
              {daysLeft === null
                ? '—'
                : daysLeft < 0
                ? ar ? 'انتهت' : 'Expired'
                : ar
                ? `${daysLeft} أيام`
                : `${daysLeft} days`}
            </AppText>
          </View>
        </View>

        {status === 'endingSoon' && (
          <View
            style={[
              row,
              {
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
              },
            ]}
          >
            <Ionicons
              name="notifications"
              size={15}
              color={palette.tealDark}
            />
            <AppText
              size={13}
              weight="700"
              style={{ flex: 1, color: palette.tealDark }}
            >
              {ar
                ? 'هذه الوصفة تنتهي قريبًا'
                : 'This prescription is ending soon'}
            </AppText>
          </View>
        )}
      </View>
    </Card>
      </Pressable>
  );
}


function TodayDosesSection({
  doses,
  ar,
  error,
  savingDoseKey,
  onChangeDose,
  onRetry,
}: {
  doses: ScheduledDose[];
  ar: boolean;
  error: string | null;
  savingDoseKey: string | null;
  onChangeDose: (dose: ScheduledDose, status: DoseStatus | 'pending') => void;
  onRetry: () => void;
}) {
  const { palette, row } = useUi();
  const taken = doses.filter((dose) => dose.status === 'taken').length;
  const completed = doses.filter((dose) => dose.status !== 'pending').length;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={[row, { alignItems: 'center', gap: 7, marginBottom: 9 }]}>
        <Ionicons name="time-outline" size={19} color={palette.teal} />
        <AppText size={18} weight="700">
          {ar ? 'جرعات اليوم' : "Today's doses"}
        </AppText>
      </View>
      <Card style={{ paddingVertical: 12, paddingHorizontal: 13 }}>
        {error ? (
          <View style={{ gap: 8 }}>
            <AppText weight="700">{ar ? 'تعذر تحميل الجرعات' : 'Unable to load doses'}</AppText>
            <AppText muted size={12}>{error}</AppText>
            <PrimaryButton label={ar ? 'إعادة المحاولة' : 'Retry'} onPress={onRetry} />
          </View>
        ) : doses.length === 0 ? (
          <View style={[row, { alignItems: 'center', gap: 8, paddingVertical: 6 }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={palette.teal} />
            <AppText muted size={13}>
              {ar ? 'لا توجد جرعات مجدولة اليوم' : 'No scheduled doses today'}
            </AppText>
          </View>
        ) : (
          <View>
            <View style={[row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }]}>
              <AppText weight="700" size={13}>
                {ar ? 'تقدم اليوم' : 'Today’s progress'}
              </AppText>
              <AppText muted size={12}>
                {ar
                  ? `${completed} / ${doses.length} مسجلة · ${taken} تم تناولها`
                  : `${completed}/${doses.length} recorded · ${taken} taken`}
              </AppText>
            </View>
            <View style={{ height: 5, borderRadius: 5, overflow: 'hidden', backgroundColor: palette.mint, marginBottom: 4 }}>
              <View style={{ height: 5, width: `${(completed / doses.length) * 100}%`, backgroundColor: palette.teal, borderRadius: 5 }} />
            </View>
            {doses.map((dose, index) => {
              const key = `${dose.medicationId}|${dose.scheduledAt}`;
              const busy = savingDoseKey !== null;
              const timeLabel = new Date(dose.scheduledAt).toLocaleTimeString(
                ar ? 'ar-SA-u-ca-gregory' : 'en-US',
                { hour: 'numeric', minute: '2-digit' }
              );
              const label = dose.status === 'taken'
                ? (ar ? 'تم التناول' : 'Taken')
                : dose.status === 'skipped'
                  ? (ar ? 'تم التخطي' : 'Skipped')
                  : (ar ? 'لم تسجل' : 'Pending');
              return (
                <View
                  key={key}
                  style={{ paddingTop: 11, paddingBottom: index === doses.length - 1 ? 1 : 11, borderTopWidth: 1, borderTopColor: palette.mint, marginTop: 9 }}
                >
                  <View style={[row, { justifyContent: 'space-between', alignItems: 'center', gap: 8 }]}>
                    <View style={{ flex: 1 }}>
                      <AppText weight="700" size={14}>{dose.medicationName}</AppText>
                      <AppText muted size={12}>
                        {dose.dosage} · {timeLabel}
                      </AppText>
                    </View>
                    <StatusPill
                      label={label}
                      tone={dose.status === 'taken' ? 'success' : dose.status === 'skipped' ? 'neutral' : 'info'}
                    />
                  </View>
                  {dose.status === 'pending' ? (
                    <View style={[row, { gap: 7, marginTop: 9, alignItems: 'center' }]}>
                      <Pressable
                        disabled={busy}
                        accessibilityRole="button"
                        onPress={() => onChangeDose(dose, 'taken')}
                        style={{ flex: 1, minHeight: 38, paddingHorizontal: 9, justifyContent: 'center', borderRadius: 9, backgroundColor: palette.mint, alignItems: 'center', opacity: busy ? 0.5 : 1 }}
                      >
                        <AppText size={13} weight="700" style={{ color: palette.tealDark }}>
                          {ar ? '✓ تم التناول' : '✓ Taken'}
                        </AppText>
                      </Pressable>
                      <Pressable
                        disabled={busy}
                        accessibilityRole="button"
                        onPress={() => onChangeDose(dose, 'skipped')}
                        style={{ flex: 1, minHeight: 38, paddingHorizontal: 9, justifyContent: 'center', borderRadius: 9, backgroundColor: palette.bg, alignItems: 'center', opacity: busy ? 0.5 : 1 }}
                      >
                        <AppText size={13} weight="700">{ar ? 'تخطي' : 'Skip'}</AppText>
                      </Pressable>
                      {savingDoseKey === key && <ActivityIndicator size="small" color={palette.teal} />}
                    </View>
                  ) : (
                    <View style={[row, { justifyContent: 'flex-end', alignItems: 'center', marginTop: 5 }]}>
                      <Pressable
                        disabled={busy}
                        accessibilityRole="button"
                        onPress={() => onChangeDose(dose, 'pending')}
                        style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 8, opacity: busy ? 0.5 : 1 }}
                      >
                        <AppText size={12} weight="700" style={{ color: palette.tealDark }}>
                          {ar ? 'تراجع' : 'Undo'}
                        </AppText>
                      </Pressable>
                      {savingDoseKey === key && <ActivityIndicator size="small" color={palette.teal} />}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </View>
  );
}
