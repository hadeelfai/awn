import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, PrimaryButton, Screen, SpeakBtn, StatusPill, TopBar, useUi } from '../../../src/ui';

export default function AppointmentDetail() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { tt, locale, appointments, palette, row } = useUi();
  const appointment = appointments.find((a) => a.id === id);

  if (!appointment) {
    return (
      <Screen>
        <TopBar title={tt('appointment')} back right={null} onBack={() => from === 'appointments' ? router.replace('/(beneficiary)/appointments') : router.canGoBack() ? router.back() : router.replace('/(beneficiary)/appointments')} />
        <AppText>{tt('notFound')}</AppText>
      </Screen>
    );
  }

  const isUpcoming = appointment.status === 'upcoming' || appointment.status === 'updated';
  const preparation = locale === 'ar' ? appointment.preparationAr : appointment.preparationEn;

  return (
    <Screen scroll>
      <TopBar title={tt('appointmentDetails')} back right={null} onBack={() => from === 'appointments' ? router.replace('/(beneficiary)/appointments') : router.canGoBack() ? router.back() : router.replace('/(beneficiary)/appointments')} />
      
      <Card style={{ marginBottom: 16 }}>
        <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <AppText size={22} weight="700">
            {locale === 'ar' ? appointment.specialtyAr : appointment.specialtyEn}
          </AppText>
          <StatusPill
            label={isUpcoming ? tt('upcoming') : tt('completed')}
            tone={isUpcoming ? 'warning' : 'neutral'}
          />
        </View>
        <AppText muted style={{ marginTop: 8 }}>
          {locale === 'ar' ? appointment.doctorAr : appointment.doctorEn}
        </AppText>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <AppText size={16} weight="700" style={{ marginBottom: 12 }}>
          {tt('facility')}
        </AppText>
        <AppText>{locale === 'ar' ? appointment.facilityAr : appointment.facilityEn}</AppText>
        <AppText muted style={{ marginTop: 4 }}>
          {locale === 'ar' ? appointment.locationAr : appointment.locationEn}
        </AppText>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={[row, { gap: 24 }]}>
          <View style={{ flex: 1 }}>
            <AppText muted size={13}>{tt('date')}</AppText>
            <AppText size={18} weight="700">{appointment.date}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText muted size={13}>{tt('time')}</AppText>
            <AppText size={18} weight="700">{appointment.time}</AppText>
          </View>
        </View>
      </Card>

      {isUpcoming && (
        <Card style={{ marginBottom: 16 }}>
          <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
            <AppText size={16} weight="700">{tt('preparation')}</AppText>
            <SpeakBtn text={tt('preparationHelp')} />
          </View>
          <View style={{ marginTop: 12 }}>
            {preparation.map((prep: string, index: number) => (
              <View key={index} style={[row, { alignItems: 'flex-start', gap: 8, marginBottom: 8 }]}>
                <Ionicons name="checkmark-circle" size={18} color={palette.success} style={{ marginTop: 2 }} />
                <AppText style={{ flex: 1 }}>{prep}</AppText>
              </View>
            ))}
          </View>
        </Card>
      )}

      {appointment.notesAr && (
        <Card style={{ marginBottom: 16 }}>
          <AppText size={16} weight="700" style={{ marginBottom: 8 }}>
            {tt('notes')}
          </AppText>
          <AppText muted>{locale === 'ar' ? appointment.notesAr : appointment.notesEn}</AppText>
        </Card>
      )}

      {appointment.hasPrescription && (
        <Card style={{ marginBottom: 16 }}>
          <View style={[row, { alignItems: 'center', gap: 8 }]}>
            <Ionicons name="medical" size={20} color={palette.teal} />
            <AppText weight="700">{tt('hasPrescription')}</AppText>
          </View>
          <AppText muted style={{ marginTop: 4 }}>
            {tt('prescriptionNote')}
          </AppText>
        </Card>
      )}
    </Screen>
  );
}
