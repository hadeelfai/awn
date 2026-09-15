import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Pressable, View } from 'react-native';
import { space } from '../src/theme';
import { AppText, LangSwitch, Screen, useUi } from '../src/ui';

export default function Gate() {
  const { role, setRole, tt } = useUi();
  if (role === 'beneficiary') return <Redirect href="/(beneficiary)" />;
  if (role === 'specialist') return <Redirect href="/(specialist)" />;

  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-end', paddingTop: 8 }}>
        <LangSwitch />
      </View>
      <LinearGradient
        colors={['#E7F4EE', '#F3F7F4']}
        style={{ marginTop: 12, borderRadius: 28, padding: 24, minHeight: 220, overflow: 'hidden' }}
      >
        <View style={{ height: 88, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../assets/brand/logo.png')} style={{ width: 220, height: 88 }} contentFit="contain" />
        </View>
        <AppText size={28} weight="700">
          {tt('brand')} — {tt('tagline')}
        </AppText>
        <AppText muted size={15} style={{ marginTop: 8 }}>
          {tt('subtitle')}
        </AppText>
        {/*}
        <View style={{ height: 64, marginTop: 18, opacity: 0.4, justifyContent: 'flex-end' }}>
          <View style={{ height: 36, backgroundColor: '#C5D9C8', borderTopLeftRadius: 40, borderTopRightRadius: 40 }} />
        </View> */}
      </LinearGradient>

      <AppText size={18} weight="700" style={{ marginTop: 28 }}>
        {tt('roleTitle')}
      </AppText>
      <RoleCard title={tt('beneficiary')} hint={tt('beneficiaryHint')} onPress={() => setRole('beneficiary')} />
      <RoleCard title={tt('specialist')} hint={tt('specialistHint')} onPress={() => setRole('specialist')} />
      <AppText muted size={14} style={{ marginTop: 20 }}>
        {tt('principle')}
      </AppText>
    </Screen>
  );
}

function RoleCard({ title, hint, onPress }: { title: string; hint: string; onPress: () => void }) {
  const { palette } = useUi();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        marginTop: space.md,
        backgroundColor: palette.surface,
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: palette.border,
        minHeight: 96,
        justifyContent: 'center',
      }}
    >
      <AppText size={20} weight="700">
        {title}
      </AppText>
      <AppText muted size={15}>
        {hint}
      </AppText>
    </Pressable>
  );
}
