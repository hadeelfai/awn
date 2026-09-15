import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { AppText, Card, PrimaryButton, Screen, SpeakBtn, TopBar, useUi } from '../../src/ui';

export default function DocExplain() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tt, locale, documents, row, setPendingFeedback } = useUi();
  const doc = documents.find((d) => d.id === id) || documents[0];
  if (!doc) {
    return (
      <Screen>
        <TopBar title={tt('explainMe')} back />
        <AppText>{tt('noResults')}</AppText>
      </Screen>
    );
  }
  const finding = doc.findings[0];
  const simple = locale === 'ar' ? finding.simpleAr : finding.simpleEn;

  return (
    <Screen scroll>
      <TopBar title={locale === 'ar' ? doc.titleAr : doc.titleEn} back />
      <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
        <AppText size={20} weight="700">
          {tt('originalInfo')}
        </AppText>
        <SpeakBtn text={`${finding.nameEn} ${finding.value} ${finding.unit}. ${simple}`} />
      </View>
      <Card style={{ marginTop: 8 }}>
        <AppText muted>{locale === 'ar' ? finding.nameAr : finding.nameEn}</AppText>
        <AppText size={28} weight="700">
          {finding.value} {finding.unit}
        </AppText>
      </Card>
      <AppText size={20} weight="700" style={{ marginTop: 18 }}>
        {tt('simpleExplain')}
      </AppText>
      <Card style={{ marginTop: 8 }}>
        <AppText>{simple}</AppText>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <AppText weight="700">{tt('disclaimer')}</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          {tt('noDiagnose')}
        </AppText>
      </Card>
      <View style={{ gap: 10, marginTop: 16 }}>
        <PrimaryButton
          label={tt('askSpecialist')}
          onPress={() => {
            router.push('/(beneficiary)/ask');
          }}
        />
        <PrimaryButton
          label={tt('feedbackTitle')}
          variant="soft"
          onPress={() => {
            setPendingFeedback('explain');
            router.push('/(beneficiary)/feedback');
          }}
        />
      </View>
    </Screen>
  );
}
