import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Card, PrimaryButton, Screen, StatusPill, TopBar, useUi } from '../../../src/ui';

export default function Book() {
  const { tt, locale, bookingUnlocked, bookingSlots, bookSlot, requests, setPendingFeedback } = useUi();
  const mine = requests.find((r) => r.patientId === 'PAT-1001' && (r.status === 'approved' || r.status === 'modified'));
  const unlocked = bookingUnlocked || !!mine;

  return (
    <Screen scroll>
      <TopBar title={tt('bookNow')} back />
      {!unlocked ? (
        <Card>
          <StatusPill label={tt('pending')} tone="warning" />
          <AppText size={17} style={{ marginTop: 10 }}>
            {locale === 'ar'
              ? 'إذا كنت تعرف الخدمة يمكنك المتابعة لاحقًا بعد الربط الإداري. إذا كان اختيار التخصص يحتاج حكمًا طبيًا، أرسل الطلب من اسألني إلى المختص أولًا.'
              : 'If you already know the service, administrative booking continues after approval. If specialty choice needs medical judgment, send the request from Ask Me first.'}
          </AppText>
          <View style={{ marginTop: 14 }}>
            <PrimaryButton label={tt('askMe')} onPress={() => router.push('/(beneficiary)/ask')} />
          </View>
        </Card>
      ) : (
        <>
          <AppText>
            {locale === 'ar'
              ? 'تمت مراجعة طلبك. يمكنك الآن اختيار الموعد المناسب.'
              : 'Your request was reviewed. You can now choose a suitable appointment.'}
          </AppText>
          <AppText muted size={14} style={{ marginTop: 6 }}>
            {mine ? (locale === 'ar' ? mine.approvedServiceAr : mine.approvedServiceEn) : tt('familyMed')}
          </AppText>
          <AppText size={20} weight="700" style={{ marginTop: 18, marginBottom: 8 }}>
            {tt('availableSlots')}
          </AppText>
          {bookingSlots.map((s) => (
            <Card key={s.id} style={{ marginBottom: 10 }}>
              <AppText weight="700">
                {s.date} · {s.time}
              </AppText>
              <AppText muted>{locale === 'ar' ? s.facilityAr : s.facilityEn}</AppText>
              <View style={{ marginTop: 10 }}>
                <PrimaryButton
                  label={tt('confirmBooking')}
                  onPress={() => {
                    const id = bookSlot(s.id);
                    setPendingFeedback('booking');
                    if (id) router.push(`/(beneficiary)/guide/appointment/${id}`);
                    else router.push('/(beneficiary)/guide/appointments');
                  }}
                />
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
