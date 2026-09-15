import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { View } from 'react-native';
import { demoLab } from '../../src/data/seed';
import { AppText, Card, PrimaryButton, Screen, SpeakBtn, StatusPill, TopBar, useUi } from '../../src/ui';

export default function Explain() {
  const { tt, locale, documents, addDocument, palette, row, sendUser } = useUi();

  const ingest = (name: string) => {
    addDocument({
      ...demoLab,
      id: `DOC-${Date.now()}`,
      originalName: name,
      createdAt: new Date().toISOString(),
    });
    router.push('/(beneficiary)/doc');
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (!res.canceled) ingest(res.assets[0].fileName || 'scan.jpg');
  };
  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!res.canceled) ingest(res.assets[0].name);
  };

  return (
    <Screen scroll>
      <TopBar title={tt('explainMe')} subtitle={tt('explainHint')} />
      <Card>
        <AppText>{tt('disclaimer')}</AppText>
      </Card>
      <View style={{ gap: 10, marginTop: 14 }}>
        <PrimaryButton label={tt('uploadDoc')} icon="cloud-upload-outline" onPress={pickFile} />
        <PrimaryButton label={tt('gallery')} icon="image-outline" variant="soft" onPress={pickImage} />
      </View>
      <AppText size={20} weight="700" style={{ marginTop: 22, marginBottom: 8 }}>
        {locale === 'ar' ? 'المستندات' : 'Documents'}
      </AppText>
      {documents.map((d) => (
        <Card key={d.id} style={{ marginBottom: 12 }} onPress={() => router.push({ pathname: '/(beneficiary)/doc', params: { id: d.id } })}>
          <StatusPill label={d.kind} tone="info" />
          <AppText size={18} weight="700" style={{ marginTop: 6 }}>
            {locale === 'ar' ? d.titleAr : d.titleEn}
          </AppText>
          <AppText muted>{d.originalName}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
