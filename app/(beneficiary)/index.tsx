import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, HeroBand, LangSwitch, Screen, SpeakBtn, StatusPill, TopBar, useUi } from '../../src/ui';

export default function Home() {
  const { tt, displayName, palette, row, locale, appointments, prescriptions, notifications, sendUser } = useUi();
  const next = appointments.find((a) => a.status === 'upcoming' || a.status === 'updated');
  const refill = prescriptions.find((p) => p.refillSoon);

  return (
    <Screen scroll>
      <TopBar
        title={tt('helloName', { name: displayName.split(' ')[0] })}
        subtitle={tt('howHelp')}
        right={<LangSwitch />}
      />
      <HeroBand>
        <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <AppText size={15} muted>
              {tt('brand')} — {tt('tagline')}
            </AppText>
            <AppText size={22} weight="700" style={{ marginTop: 4 }}>
              {tt('composer')}
            </AppText>
          </View>
          <SpeakBtn text={`${tt('helloName', { name: displayName })} ${tt('howHelp')}`} />
        </View>
        <Pressable
          onPress={() => router.push('/(beneficiary)/ask')}
          accessibilityRole="button"
          accessibilityLabel={tt('askAoun')}
          style={[
            row,
            {
              marginTop: 16,
              backgroundColor: palette.surface,
              borderRadius: 28,
              minHeight: 60,
              paddingHorizontal: 16,
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons name="mic-circle" size={34} color={palette.teal} />
          <AppText muted style={{ flex: 1 }}>
            {tt('composer')}
          </AppText>
        </Pressable>
      </HeroBand>

      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
        <Quick title={tt('askMe')} hint={tt('askMeHint')} icon="chatbubbles" onPress={() => router.push('/(beneficiary)/ask')} />
        <Quick title={tt('myAppointments')} hint={tt('myAppointmentsHint')} icon="calendar" onPress={() => router.push('/(beneficiary)/guide/appointments')} />
        <Quick title={tt('myMeds')} hint={tt('myMedsHint')} icon="medkit" onPress={() => router.push('/(beneficiary)/guide/medications')} />
        <Quick title={tt('explainMe')} hint={tt('explainHint')} icon="book" onPress={() => router.push('/(beneficiary)/explain')} />
      </View>

      <AppText size={20} weight="700" style={{ marginTop: 26, marginBottom: 10 }}>
        {tt('aounSuggests')}
      </AppText>
      {next ? (
        <Card
          onPress={() => router.push(`/(beneficiary)/guide/appointment/${next.id}`)}
          style={{ marginBottom: 12 }}
        >
          <StatusPill label={tt('tomorrow')} tone="warning" />
          <AppText size={18} weight="700" style={{ marginTop: 8 }}>
            {locale === 'ar' ? next.specialtyAr : next.specialtyEn} · {next.time}
          </AppText>
          <AppText muted>{locale === 'ar' ? next.facilityAr : next.facilityEn}</AppText>
          <AppText style={{ marginTop: 8 }}>{tt('reminderPrep')}</AppText>
        </Card>
      ) : null}
      {refill ? (
        <Card onPress={() => router.push('/(beneficiary)/guide/medications')} style={{ marginBottom: 12 }}>
          <StatusPill label={tt('demoBadge')} tone="info" />
          <AppText size={18} weight="700" style={{ marginTop: 8 }}>
            {locale === 'ar' ? refill.medicationAr : refill.medicationEn}
          </AppText>
          <AppText muted>
            {locale === 'ar'
              ? 'اقترب موعد إعادة صرف أحد أدويتك. هل ترغب في معرفة الخيارات المتاحة؟'
              : 'A refill is coming up. Would you like nearby options?'}
          </AppText>
        </Card>
      ) : null}
      {appointments.some((a) => a.hasPrescription) ? (
        <Card onPress={() => router.push('/(beneficiary)/guide/medications')} style={{ marginBottom: 12 }}>
          <StatusPill label={tt('viewRx')} tone="success" />
          <AppText size={17} weight="700" style={{ marginTop: 8 }}>
            {tt('afterVisitRx')}
          </AppText>
        </Card>
      ) : null}

      <Pressable onPress={() => router.push('/(beneficiary)/profile')} style={{ marginTop: 20 }}>
        <AppText muted>
          {tt('settings')} · {tt('privacy')} · {tt('a11y')}
        </AppText>
      </Pressable>
    </Screen>
  );
}

function Quick({
  title,
  hint,
  icon,
  onPress,
}: {
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { palette } = useUi();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        width: '47%',
        flexGrow: 1,
        minWidth: 140,
        backgroundColor: palette.surface,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.border,
        minHeight: 128,
      }}
    >
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={palette.tealDark} />
      </View>
      <AppText size={18} weight="700" style={{ marginTop: 12 }}>
        {title}
      </AppText>
      <AppText muted size={13}>
        {hint}
      </AppText>
    </Pressable>
  );
}
