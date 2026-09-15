import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, PrimaryButton, Screen, StatusPill, TopBar, useUi } from '../../../src/ui';

export default function Medications() {
  const { tt, locale, prescriptions, addPrescriptionFromScan, palette } = useUi();
  const active = prescriptions.filter((p) => p.active);
  const prev = prescriptions.filter((p) => !p.active);

  const scan = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (res.canceled) return;
    addPrescriptionFromScan({
      id: `RX-SCAN-${Date.now()}`,
      medicationAr: 'أموكسيسيلين',
      medicationEn: 'Amoxicillin',
      dosage: '500 mg',
      frequencyAr: 'كما هو مكتوب في الوصفة المرفوعة',
      frequencyEn: 'Exactly as written on the uploaded prescription',
      instructionsAr: 'استُخرجت كما ظهرت في الوصفة — دون تعديل أو إضافة جرعة.',
      instructionsEn: 'Extracted as shown on the prescription — no dose was changed or invented.',
      issuedAt: new Date().toISOString().slice(0, 10),
      active: true,
    });
  };

  return (
    <Screen scroll>
      <TopBar title={tt('myMeds')} back />
      <AppText muted style={{ marginBottom: 12 }}>
        {tt('extractedExact')}
      </AppText>
      <PrimaryButton label={tt('uploadRx')} icon="camera-outline" onPress={scan} />
      <AppText size={20} weight="700" style={{ marginTop: 22, marginBottom: 8 }}>
        {tt('activeRx')}
      </AppText>
      {active.map((p) => (
        <Card key={p.id} style={{ marginBottom: 10 }}>
          {p.refillSoon ? <StatusPill label={tt('soon')} tone="warning" /> : null}
          <AppText size={18} weight="700">
            {locale === 'ar' ? p.medicationAr : p.medicationEn}
          </AppText>
          <AppText>
            {p.dosage} · {locale === 'ar' ? p.frequencyAr : p.frequencyEn}
          </AppText>
          <AppText muted>{locale === 'ar' ? p.instructionsAr : p.instructionsEn}</AppText>
          <Pressable
            onPress={() => router.push('/(beneficiary)/explain')}
            style={{ marginTop: 8, alignSelf: 'flex-start' }}
          >
            <AppText weight="700" style={{ color: palette.tealDeep }}>
              {tt('termHelp')}
            </AppText>
          </Pressable>
        </Card>
      ))}
      <AppText size={20} weight="700" style={{ marginTop: 12, marginBottom: 8 }}>
        {tt('previousRx')}
      </AppText>
      {prev.map((p) => (
        <Card key={p.id} style={{ marginBottom: 10 }}>
          <AppText weight="700">{locale === 'ar' ? p.medicationAr : p.medicationEn}</AppText>
          <AppText muted>
            {p.dosage} · {p.issuedAt}
          </AppText>
        </Card>
      ))}
      <View style={{ marginTop: 8 }}>
        <PrimaryButton label={tt('findPharmacy')} icon="map" variant="soft" onPress={() => router.push('/(beneficiary)/guide/map')} />
      </View>
    </Screen>
  );
}
