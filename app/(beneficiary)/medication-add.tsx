
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  Switch,
  TextInput,
  View,
} from 'react-native';

import {
  addMedication,
  getMedications,
  updateMedication,
  type NewMedication,
} from '../../src/services/medications';

import { syncMedicationReminders } from '../../src/services/medication-reminders';

import {
  AppText,
  Card,
  PrimaryButton,
  Screen,
  useUi,
} from '../../src/ui';

type Frequency = NewMedication['frequency'];
type PickerField = 'start' | 'end' | 'time';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function parseTime(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function AddMedicationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
const isEditing = Boolean(id);
const [loadingMedication, setLoadingMedication] = useState(false);
  const { locale, palette, row, align } = useUi();

  const ar = locale === 'ar';

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');

  const [frequency, setFrequency] =
    useState<Frequency>('daily');

  const [time, setTime] = useState('09:00');
  const [weekday, setWeekday] = useState(1);

  const [startDate, setStartDate] = useState(
    toLocalDateString(new Date())
  );
  const [endDate, setEndDate] = useState('');

  const [pickerField, setPickerField] =
    useState<PickerField | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  useFocusEffect(
  useCallback(() => {
    if (!id) {
      // Expo Router can keep this screen mounted between visits.
      // Start every new medication with a clean form.
      setName('');
      setDosage('');
      setInstructions('');
      setFrequency('daily');
      setTime('09:00');
      setWeekday(1);
      setStartDate(toLocalDateString(new Date()));
      setEndDate('');
      setReminderEnabled(true);
      setPickerField(null);
      setLoadingMedication(false);
      return;
    }

    let active = true;

    async function loadMedication() {
      setLoadingMedication(true);

      try {
        const records = await getMedications();
        const medication = records.find((item) => item.id === id);

        if (!medication) {
          throw new Error('Medication not found.');
        }

        if (!active) return;

        setName(medication.name);
        setDosage(medication.dosage);
        setInstructions(medication.instructions ?? '');
        setFrequency(medication.frequency);
        setTime(medication.scheduled_times[0] ?? '09:00');
        setWeekday(medication.days_of_week[0] ?? 1);
        setStartDate(medication.start_date);
        setEndDate(medication.end_date ?? '');
        setReminderEnabled(medication.reminder_enabled !== false);
      } catch (error) {
        if (active) {
          Alert.alert(
            ar ? 'تعذر تحميل الدواء' : 'Unable to load medication',
            error instanceof Error ? error.message : String(error)
          );
        }
      } finally {
        if (active) setLoadingMedication(false);
      }
    }

    loadMedication();

    return () => {
      active = false;
    };
  }, [id, ar])
);

  const weekdaysAr = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];

  const weekdaysEn = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  function displayDate(value: string): string {
    if (!value) {
      return ar ? 'اختر التاريخ' : 'Select date';
    }

    return parseLocalDate(value).toLocaleDateString(
      ar ? 'ar-SA-u-ca-gregory' : 'en-US',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  }

  function displayTime(value: string): string {
    return parseTime(value).toLocaleTimeString(
      ar ? 'ar-SA' : 'en-US',
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  }

  function handlePickerChange(
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) {
    const currentField = pickerField;

    if (Platform.OS !== 'ios') {
      setPickerField(null);
    }

    if (
      event.type === 'dismissed' ||
      !selectedDate ||
      !currentField
    ) {
      return;
    }

    if (currentField === 'time') {
      setTime(formatTime(selectedDate));
      return;
    }

    const selected = toLocalDateString(selectedDate);

    if (currentField === 'start') {
      setStartDate(selected);

      if (endDate && endDate < selected) {
        setEndDate('');
      }
    } else {
      setEndDate(selected);
    }
  }

  function getPickerValue(): Date {
    if (pickerField === 'time') {
      return parseTime(time);
    }

    if (pickerField === 'end') {
      return parseLocalDate(endDate || startDate);
    }

    return parseLocalDate(startDate);
  }

  function renderField(
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string
  ) {
    return (
      <View style={{ marginBottom: 18 }}>
        <AppText weight="700" style={{ marginBottom: 8 }}>
          {label}
        </AppText>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.inkMuted}
          style={[
            align,
            {
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 14,
              padding: 14,
              fontSize: 15,
              color: palette.ink,
              backgroundColor: palette.surface,
            },
          ]}
        />
      </View>
    );
  }

  function renderOption(
    label: string,
    selected: boolean,
    onPress: () => void
  ) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={{
          paddingVertical: 11,
          paddingHorizontal: 15,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: selected
            ? palette.tealDark
            : palette.border,
          backgroundColor: selected
            ? palette.mint
            : palette.surface,
          margin: 4,
        }}
      >
        <AppText
          size={13}
          weight="700"
          style={{
            color: selected
              ? palette.tealDark
              : palette.ink,
          }}
        >
          {label}
        </AppText>
      </Pressable>
    );
  }

  function renderPickerButton(
    label: string,
    value: string,
    field: PickerField
  ) {
    return (
      <View style={{ marginBottom: 18 }}>
        <AppText weight="700" style={{ marginBottom: 8 }}>
          {label}
        </AppText>

        <Pressable
          onPress={() => setPickerField(field)}
          style={[
            row,
            {
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 15,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 14,
              backgroundColor: palette.surface,
            },
          ]}
        >
          <AppText style={{ color: palette.ink }}>
            {value}
          </AppText>

          <Ionicons
            name={
              field === 'time'
                ? 'time-outline'
                : 'calendar-outline'
            }
            size={21}
            color={palette.teal}
          />
        </Pressable>

        {field === 'end' && endDate !== '' && (
          <Pressable
            onPress={() => {
              setEndDate('');
              if (pickerField === 'end') {
                setPickerField(null);
              }
            }}
            style={{ marginTop: 8 }}
          >
            <AppText
              size={13}
              style={{ color: palette.tealDark }}
            >
              {ar
                ? 'إزالة تاريخ النهاية'
                : 'Clear end date'}
            </AppText>
          </Pressable>
        )}
      </View>
    );
  }

  async function save() {
    if (saving) return;

    if (!name.trim() || !dosage.trim()) {
      Alert.alert(
        ar ? 'بيانات ناقصة' : 'Missing information',
        ar
          ? 'يرجى إدخال اسم الدواء والجرعة.'
          : 'Please enter the medication name and dosage.'
      );
      return;
    }

    if (endDate && endDate < startDate) {
      Alert.alert(
        ar ? 'تاريخ غير صحيح' : 'Invalid date',
        ar
          ? 'تاريخ النهاية لا يمكن أن يسبق تاريخ البداية.'
          : 'The end date cannot be before the start date.'
      );
      return;
    }

    setSaving(true);

    try {
const medicationData: NewMedication = {
  name: name.trim(),
  dosage: dosage.trim(),
  instructions: instructions.trim(),
  frequency,
  scheduled_times: frequency === 'as_needed' ? [] : [time],
  days_of_week: frequency === 'weekly' ? [weekday] : [],
  start_date: startDate,
  end_date: endDate || null,
  reminder_enabled: frequency === 'as_needed' ? false : reminderEnabled,
};

if (isEditing && id) {
  await updateMedication(id, medicationData);
} else {
  await addMedication(medicationData);
};

      let reminderWarning = '';
      try {
        await syncMedicationReminders(true);
      } catch (reminderError) {
        reminderWarning = ar
          ? ' تم حفظ الدواء، لكن تعذر تحديث التذكيرات. تحقق من إذن الإشعارات.'
          : ' Medication saved, but reminders could not be updated. Check notification permissions.';
        console.warn('Medication reminder sync:', reminderError);
      }

      Alert.alert(
        ar ? 'تم الحفظ' : 'Saved',
        ar
          ? `${isEditing ? 'تم تحديث الدواء بنجاح.' : 'تمت إضافة الدواء بنجاح.'}${reminderWarning}`
          : `${isEditing ? 'Medication updated successfully.' : 'Medication added successfully.'}${reminderWarning}`,
        [
          {
            text: ar ? 'حسنًا' : 'OK',
            onPress: () => {
              if (isEditing && id) router.replace({ pathname: '/medication-details', params: { id } });
              else router.replace('/medications');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        ar ? 'تعذر الحفظ' : 'Could not save',
        error instanceof Error
          ? error.message
          : String(error)
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <Pressable
        onPress={() => { if (isEditing && id) router.replace({ pathname: '/medication-details', params: { id } }); else router.replace('/medications'); }}
        style={{ marginTop: 12, marginBottom: 12 }}
      >
        <AppText style={{ color: palette.tealDark }}>
          {ar ? '→ رجوع' : '← Back'}
        </AppText>
      </Pressable>

      <AppText
        size={24}
        weight="700"
        style={{ marginBottom: 20 }}
      >
  {isEditing
  ? ar ? 'تعديل الدواء' : 'Edit medication'
  : ar ? 'إضافة دواء' : 'Add medication'}
      </AppText>

      <Card>
        {renderField(
          ar ? 'اسم الدواء' : 'Medication name',
          name,
          setName,
          ar ? 'مثال: فيتامين D3' : 'e.g. Vitamin D3'
        )}

        {renderField(
          ar ? 'الجرعة الموصوفة' : 'Prescribed dosage',
          dosage,
          setDosage,
          ar ? 'مثال: 500 ملغ' : 'e.g. 500 mg'
        )}

        {renderField(
          ar ? 'تعليمات الطبيب' : 'Prescriber instructions',
          instructions,
          setInstructions,
          ar ? 'مثال: بعد الطعام' : 'e.g. After food'
        )}

        <AppText weight="700">
          {ar ? 'التكرار' : 'Frequency'}
        </AppText>

        <View
          style={[
            row,
            {
              flexWrap: 'wrap',
              marginVertical: 12,
            },
          ]}
        >
          {renderOption(
            ar ? 'يوميًا' : 'Daily',
            frequency === 'daily',
            () => setFrequency('daily')
          )}

          {renderOption(
            ar ? 'أسبوعيًا' : 'Weekly',
            frequency === 'weekly',
            () => setFrequency('weekly')
          )}

          {renderOption(
            ar ? 'عند الحاجة' : 'As needed',
            frequency === 'as_needed',
            () => setFrequency('as_needed')
          )}
        </View>

        {frequency === 'weekly' && (
          <>
            <AppText weight="700">
              {ar ? 'يوم الجرعة' : 'Dose day'}
            </AppText>

            <View
              style={[
                row,
                {
                  flexWrap: 'wrap',
                  marginVertical: 12,
                },
              ]}
            >
              {(ar ? weekdaysAr : weekdaysEn).map(
                (day, index) => (
                  <View key={index}>
                    {renderOption(
                      day,
                      weekday === index,
                      () => setWeekday(index)
                    )}
                  </View>
                )
              )}
            </View>
          </>
        )}

        {frequency !== 'as_needed' &&
          renderPickerButton(
            ar ? 'وقت الجرعة' : 'Dose time',
            displayTime(time),
            'time'
          )}

        <View style={{
          marginTop: 8, marginBottom: 18, padding: 14,
          borderWidth: 1, borderColor: palette.border,
          borderRadius: 14, backgroundColor: palette.surface,
        }}>
          <View style={[row, { alignItems: 'center', gap: 12 }]}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: palette.mint,
            }}>
              <Ionicons name="notifications-outline" size={21} color={palette.tealDark} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="700" size={14}>
                {ar ? 'تذكير وقت الجرعة' : 'Dose reminder'}
              </AppText>
              <AppText muted size={12} style={{ marginTop: 3 }}>
                {frequency === 'as_needed'
                  ? (ar ? 'لا توجد مواعيد ثابتة لهذا الدواء' : 'No fixed dose time for this medication')
                  : (ar ? 'إشعار في موعد الجرعة' : 'Notify me at dose time')}
              </AppText>
            </View>
            <Switch
              accessibilityLabel={ar ? 'تفعيل تذكير الدواء' : 'Enable medication reminder'}
              value={frequency !== 'as_needed' && reminderEnabled}
              onValueChange={setReminderEnabled}
              disabled={frequency === 'as_needed' || saving}
              trackColor={{ false: palette.border, true: palette.teal }}
              thumbColor={palette.surface}
            />
          </View>
        </View>

        {renderPickerButton(
          ar ? 'تاريخ البداية' : 'Start date',
          displayDate(startDate),
          'start'
        )}

        {renderPickerButton(
          ar ? 'تاريخ النهاية (اختياري)' : 'End date (optional)',
          displayDate(endDate),
          'end'
        )}

      </Card>

      <Modal
        visible={pickerField !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerField(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.38)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPickerField(null)} />
          <View style={{ backgroundColor: palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 }}>
            <View style={[row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }] }>
              <AppText size={17} weight="700">
                {pickerField === 'time' ? (ar ? 'وقت الجرعة' : 'Dose time') : pickerField === 'start' ? (ar ? 'تاريخ البداية' : 'Start date') : (ar ? 'تاريخ النهاية' : 'End date')}
              </AppText>
              <Pressable onPress={() => setPickerField(null)} accessibilityRole="button" style={{ padding: 10 }}>
                <AppText weight="700" style={{ color: palette.tealDark }}>{ar ? 'تم' : 'Done'}</AppText>
              </Pressable>
            </View>
            {pickerField !== null && (
              <DateTimePicker
                key={pickerField}
                locale={Platform.OS === 'ios' && pickerField !== 'time' ? 'en_US' : undefined}
                value={getPickerValue()}
                mode={pickerField === 'time' ? 'time' : 'date'}
                display={Platform.OS === 'ios' ? (pickerField === 'time' ? 'spinner' : 'inline') : 'default'}
                minimumDate={pickerField === 'end' ? parseLocalDate(startDate) : undefined}
                onChange={handlePickerChange}
                style={{ alignSelf: 'stretch' }}
              />
            )}
          </View>
        </View>
      </Modal>

      <View
        style={{
          marginTop: 20,
          marginBottom: 24,
        }}
      >
        <PrimaryButton
          label={
  saving
    ? ar ? 'جارٍ الحفظ...' : 'Saving...'
    : isEditing
    ? ar ? 'حفظ التعديلات' : 'Save changes'
    : ar ? 'حفظ الدواء' : 'Save medication'
}
          onPress={save}
          disabled={saving || loadingMedication}
        />
      </View>
    </Screen>
  );
}
