import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Card, Screen, TopBar, useUi } from '../../../src/ui';

export default function GuideHome() {
  const { tt, palette } = useUi();
  const items = [
    { title: tt('myAppointments'), hint: tt('myAppointmentsHint'), icon: 'calendar-outline' as const, href: '/(beneficiary)/guide/appointments' },
    { title: tt('myMeds'), hint: tt('myMedsHint'), icon: 'medkit-outline' as const, href: '/(beneficiary)/guide/medications' },
    { title: tt('mapTitle'), hint: tt('demoAvailability'), icon: 'map-outline' as const, href: '/(beneficiary)/guide/map' },
    { title: tt('bookNow'), hint: tt('availableSlots'), icon: 'add-circle-outline' as const, href: '/(beneficiary)/guide/book' },
  ];
  return (
    <Screen scroll>
      <TopBar title={tt('guideMe')} subtitle={tt('subtitle')} />
      {items.map((it) => (
        <Card key={it.href} onPress={() => router.push(it.href as any)} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={it.icon} size={24} color={palette.tealDark} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText size={18} weight="700">
                {it.title}
              </AppText>
              <AppText muted size={14}>
                {it.hint}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
      <AppText muted size={14} style={{ marginTop: 8 }}>
        {tt('principle')}
      </AppText>
    </Screen>
  );
}
