import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppText, Card, PrimaryButton, Screen, SpeakBtn, StatusPill, TopBar, useUi } from '../../../../src/ui';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tt, locale, appointments, setReminder, reminderIds, palette, row } = useUi();
  const a = appointments.find((x) => x.id === id);
  if (!a) {
    return (
      <Screen>
        <TopBar title={tt('myAppointments')} back />
        <AppText>{tt('noResults')}</AppText>
      </Screen>
    );
  }
  const prep = locale === 'ar' ? a.preparationAr : a.preparationEn;
  return (
    <Screen scroll>
      <TopBar title={locale === 'ar' ? a.specialtyAr : a.specialtyEn} back />
      <StatusPill label={`${a.date} · ${a.time}`} tone="info" />
      <Card style={{ marginTop: 12 }}>
        <Row k={tt('facility')} v={locale === 'ar' ? a.facilityAr : a.facilityEn} />
        <Row k={tt('doctor')} v={locale === 'ar' ? a.doctorAr : a.doctorEn} />
        <Row k={tt('location')} v={locale === 'ar' ? a.locationAr : a.locationEn} />
        <Row k={tt('status')} v={a.status} />
      </Card>
      <View style={[row, { alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }]}>
        <AppText size={20} weight="700">
          {tt('prep')}
        </AppText>
        <SpeakBtn text={prep.join(' ')} />
      </View>
      {prep.map((p: string) => (
        <Card key={p} style={{ marginTop: 8, backgroundColor: palette.surfaceMuted }}>
          <AppText>{p}</AppText>
        </Card>
      ))}
      <View style={{ gap: 10, marginTop: 20 }}>
        <PrimaryButton label={tt('viewLocation')} icon="map-outline" onPress={() => router.push('/(beneficiary)/guide/map')} />
        <PrimaryButton
          label={reminderIds.includes(a.id) ? tt('reminderSet') : tt('reminder')}
          icon="notifications-outline"
          variant="soft"
          onPress={() => setReminder(a.id)}
        />
        <PrimaryButton
          label={tt('reschedule')}
          variant="ghost"
          onPress={() =>
            router.push({ pathname: '/(beneficiary)/ask' })
          }
        />
        {a.hasPrescription ? (
          <PrimaryButton label={tt('viewRx')} variant="soft" onPress={() => router.push('/(beneficiary)/guide/medications')} />
        ) : null}
      </View>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <AppText muted size={13}>
        {k}
      </AppText>
      <AppText size={17} weight="700">
        {v}
      </AppText>
    </View>
  );
}
