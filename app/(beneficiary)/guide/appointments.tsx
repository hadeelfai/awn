import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen, StatusPill, TopBar, useUi } from '../../../src/ui';

export default function Appointments() {
  const { tt, locale, appointments } = useUi();
  const [tab, setTab] = useState<'upcoming' | 'previous'>('upcoming');
  const upcoming = appointments.filter((a) => a.status === 'upcoming' || a.status === 'updated');
  const previous = appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');
  const list = tab === 'upcoming' ? upcoming : previous;
  return (
    <Screen scroll>
      <TopBar title={tt('myAppointments')} back />
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', gap: 8, marginBottom: 14 }}>
        {(['upcoming', 'previous'] as const).map((k) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            style={{ flex: 1, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === k ? '#164A43' : '#E7F3EE' }}
          >
            <AppText weight="700" style={{ color: tab === k ? '#fff' : '#164A43' }}>
              {tt(k)}
            </AppText>
          </Pressable>
        ))}
      </View>
      {list.length === 0 ? <AppText muted>{tt('noResults')}</AppText> : null}
      {list.map((a) => (
        <Card key={a.id} style={{ marginBottom: 12 }} onPress={() => router.push(`/(beneficiary)/guide/appointment/${a.id}`)}>
          <StatusPill label={tab === 'upcoming' ? tt('upcoming') : tt('previous')} tone={a.status === 'upcoming' || a.status === 'updated' ? 'warning' : 'success'} />
          <AppText size={18} weight="700" style={{ marginTop: 8 }}>
            {locale === 'ar' ? a.specialtyAr : a.specialtyEn}
          </AppText>
          <AppText muted>
            {a.date} · {a.time}
          </AppText>
          <AppText>{locale === 'ar' ? a.facilityAr : a.facilityEn}</AppText>
          <AppText muted>{locale === 'ar' ? a.doctorAr : a.doctorEn}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
