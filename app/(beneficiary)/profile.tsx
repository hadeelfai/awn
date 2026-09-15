import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, LangSwitch, PrimaryButton, Screen, TopBar, useUi } from '../../src/ui';

export default function Profile() {
  const { tt, displayName, fontScale, setFontScale, highContrast, setHighContrast, setRole, palette, row } = useUi();
  return (
    <Screen scroll>
      <TopBar title={tt('profile')} back right={<LangSwitch />} />
      <Card>
        <AppText muted>{tt('patient')}</AppText>
        <AppText size={22} weight="700">
          {displayName}
        </AppText>
        <AppText muted>PAT-1001</AppText>
      </Card>
      <AppText size={18} weight="700" style={{ marginTop: 20 }}>
        {tt('a11y')}
      </AppText>
      <Card style={{ marginTop: 8 }}>
        <AppText>{tt('fontSize')}</AppText>
        <View style={[row, { gap: 8, marginTop: 10 }]}>
          {([1, 1.15, 1.3] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setFontScale(s)}
              style={{ flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: fontScale === s ? palette.tealDark : palette.mint }}
            >
              <AppText weight="700" style={{ color: fontScale === s ? '#fff' : palette.tealDark }}>
                {s === 1 ? tt('small') : s === 1.15 ? tt('medium') : tt('large')}
              </AppText>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setHighContrast(!highContrast)}
          style={[row, { marginTop: 16, minHeight: 52, alignItems: 'center', justifyContent: 'space-between' }]}
          accessibilityRole="switch"
          accessibilityState={{ checked: highContrast }}
        >
          <AppText>{tt('contrast')}</AppText>
          <AppText weight="700">{highContrast ? tt('on') : tt('off')}</AppText>
        </Pressable>
      </Card>
      <View style={{ marginTop: 16, gap: 10 }}>
        <PrimaryButton label={tt('privacy')} variant="soft" onPress={() => router.push('/(beneficiary)/privacy')} />
        <PrimaryButton
          label={tt('logout')}
          variant="ghost"
          onPress={() => {
            setRole(null);
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
