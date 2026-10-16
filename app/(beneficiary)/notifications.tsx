import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { buildScheduledDoses, getDoseRecordsForDate, getMedications, type MedicationRecord, type ScheduledDose } from '../../src/services/medications';
import { AppText, Card, Screen, TopBar, useUi } from '../../src/ui';

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Notifications() {
  const { tt, locale, palette, row } = useUi();
  const ar = locale === 'ar';
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [doses, setDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const day = todayLocal();
        const [meds, records] = await Promise.all([getMedications(), getDoseRecordsForDate(day)]);
        if (!mounted) return;
        setMedications(meds);
        setDoses(buildScheduledDoses(meds, day, records));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []));

  const now = new Date();
  const today = todayLocal();
  const upcoming = doses.filter(d => d.status === 'pending' && new Date(d.scheduledAt) > now);
  const expiredSoon = medications.filter(m => m.status === 'active' && m.end_date && m.end_date >= today &&
    (new Date(`${m.end_date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000 <= 7);

  return (
    <Screen scroll>
      <TopBar title={tt('notifications')} back onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/(beneficiary)'); }} right={null} />
      {loading ? <ActivityIndicator color={palette.teal} style={{ marginTop: 24 }} /> : error ? (
        <Card><AppText muted>{ar ? 'تعذر تحميل التنبيهات الحالية.' : 'Unable to load current reminders.'}</AppText><AppText muted size={12}>{error}</AppText></Card>
      ) : upcoming.length === 0 && expiredSoon.length === 0 ? (
        <Card><AppText muted>{ar ? 'لا توجد تنبيهات أدوية حالية.' : 'No current medication reminders.'}</AppText></Card>
      ) : (
        <>
          {upcoming.map(d => (
            <Card key={`${d.medicationId}-${d.scheduledAt}`} style={{ marginBottom: 12 }} onPress={() => router.push('/(beneficiary)/medications')}>
              <View style={[row, { alignItems: 'center', gap: 12 }]}>
                <Ionicons name="time-outline" size={22} color={palette.tealDark} />
                <View style={{ flex: 1 }}>
                  <AppText weight="700">{ar ? 'جرعة قادمة اليوم' : 'Upcoming dose today'}</AppText>
                  <AppText muted size={13} style={{ marginTop: 4 }}>{d.medicationName} · {d.dosage} · {d.time}</AppText>
                </View>
              </View>
            </Card>
          ))}
          {expiredSoon.map(m => (
            <Card key={`expiry-${m.id}`} style={{ marginBottom: 12 }} onPress={() => router.push('/(beneficiary)/medications')}>
              <View style={[row, { alignItems: 'center', gap: 12 }]}>
                <Ionicons name="calendar-outline" size={22} color={palette.tealDark} />
                <View style={{ flex: 1 }}>
                  <AppText weight="700">{ar ? 'اقتراب نهاية الوصفة' : 'Prescription ending soon'}</AppText>
                  <AppText muted size={13} style={{ marginTop: 4 }}>{m.name} · {m.end_date}</AppText>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
