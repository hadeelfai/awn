import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, useUi } from '../ui';
import { localDateKey } from '../services/appointmentTime';

type Props = {
  value: string;
  onChange: (date: string) => void;
  markedDates?: string[];
  minDate?: string;
};

const keyOf = localDateKey;

export default function MonthCalendar({ value, onChange, markedDates = [], minDate }: Props) {
  const { locale, palette, row } = useUi();
  const initial = new Date(`${value || keyOf(new Date())}T12:00:00`);
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = month.getDay();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const marks = new Set(markedDates);
  const today = keyOf();
  const min = minDate ?? today;
  const title = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-SA-u-ca-gregory', { month: 'long', year: 'numeric' }).format(month);
  const weekdays = locale === 'ar' ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return <View style={{ padding: 14, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }}>
    <View style={[row, { alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={locale === 'ar' ? 'الشهر السابق' : 'Previous month'} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} hitSlop={8}><Ionicons name="chevron-back" size={21} color={palette.tealDark} /></Pressable>
      <AppText weight="700">{title}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={locale === 'ar' ? 'الشهر التالي' : 'Next month'} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} hitSlop={8}><Ionicons name="chevron-forward" size={21} color={palette.tealDark} /></Pressable>
    </View>
    <View style={[row, { flexWrap: 'wrap' }]}>
      {weekdays.map((day, index) => <View key={`${day}-${index}`} style={{ width: '14.285%', alignItems: 'center', paddingVertical: 7 }}><AppText muted size={12}>{day}</AppText></View>)}
      {cells.map((day, index) => {
        if (!day) return <View key={`blank-${index}`} style={{ width: '14.285%', height: 42 }} />;
        const date = keyOf(new Date(month.getFullYear(), month.getMonth(), day));
        const selected = date === value;
        const disabled = date < min;
        return <Pressable key={date} disabled={disabled} onPress={() => onChange(date)} style={{ width: '14.285%', height: 42, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? palette.tealDark : 'transparent', borderWidth: date === today && !selected ? 1 : 0, borderColor: palette.teal }}>
            <AppText size={13} weight={selected ? '700' : '500'} style={{ color: disabled ? palette.inkMuted : selected ? '#fff' : palette.ink }}>{day}</AppText>
          </View>
          {marks.has(date) ? <View style={{ position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: selected ? '#fff' : palette.teal }} /> : null}
        </Pressable>;
      })}
    </View>
  </View>;
}
