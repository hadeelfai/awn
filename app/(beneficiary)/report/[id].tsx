import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen, SpeakBtn, StatusPill, TopBar, useUi } from '../../../src/ui';

export default function ReportDetail() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { tt, locale, documents, palette, row } = useUi();
  const document = documents.find((d) => d.id === id);

  if (!document) {
    return (
      <Screen>
        <TopBar title={tt('report')} back right={null} onBack={() => from === 'explain' ? router.replace('/(beneficiary)/explain') : router.canGoBack() ? router.back() : router.replace('/(beneficiary)/explain')} />
        <AppText>{tt('notFound')}</AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <TopBar title={tt('reportDetails')} back right={null} onBack={() => from === 'explain' ? router.replace('/(beneficiary)/explain') : router.canGoBack() ? router.back() : router.replace('/(beneficiary)/explain')} />
      
      <Card style={{ marginBottom: 16 }}>
        <View style={[row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <AppText size={20} weight="700">
            {locale === 'ar' ? document.titleAr : document.titleEn}
          </AppText>
          <SpeakBtn text={locale === 'ar' ? document.titleAr : document.titleEn} />
        </View>
        <AppText muted style={{ marginTop: 8 }}>
          {document.originalName} · {document.createdAt.slice(0, 10)}
        </AppText>
        <View style={[row, { marginTop: 8, gap: 8 }]}>
          <StatusPill
            label={document.kind === 'lab' ? tt('labResult') : document.kind === 'prescription' ? tt('prescription') : tt('report')}
            tone="info"
          />
        </View>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <AppText size={16} weight="700" style={{ marginBottom: 12 }}>
          {tt('simpleExplanation')}
        </AppText>
        <AppText muted style={{ marginBottom: 16 }}>
          {tt('disclaimer')}
        </AppText>
        
        {document.findings.map((finding, index) => (
          <View key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <View style={[row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View style={{ flex: 1 }}>
                <AppText size={16} weight="700">
                  {locale === 'ar' ? finding.nameAr : finding.nameEn}
                </AppText>
                <AppText size={20} weight="700" style={{ color: palette.tealDark, marginTop: 4 }}>
                  {finding.value} {finding.unit}
                </AppText>
              </View>
              <SpeakBtn text={locale === 'ar' ? finding.simpleAr : finding.simpleEn} />
            </View>
            <AppText style={{ marginTop: 8, lineHeight: 22 }}>
              {locale === 'ar' ? finding.simpleAr : finding.simpleEn}
            </AppText>
          </View>
        ))}
      </Card>

      <Card>
        <View style={[row, { alignItems: 'center', gap: 8 }]}>
          <Ionicons name="information-circle" size={20} color={palette.info} />
          <AppText weight="700" style={{ color: palette.info }}>
            {tt('medicalDisclaimer')}
          </AppText>
        </View>
        <AppText muted style={{ marginTop: 8 }}>
          {tt('noDiagnose')}
        </AppText>
      </Card>
    </Screen>
  );
}
