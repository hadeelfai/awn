import { Pressable, Switch, View } from 'react-native';

import {
  AppText,
  Card,
  LangSwitch,
  Screen,
  TopBar,
  useUi,
} from '../../src/ui';

const fontScales = [1, 1.15, 1.3] as const;

export default function Settings() {
  const {
    tt,
    fontScale,
    setFontScale,
    highContrast,
    setHighContrast,
    palette,
    row,
  } = useUi();

  return (
    <Screen scroll>
      <TopBar title={tt('settings')} back />

      <Card style={{ marginBottom: 14 }}>
        <View style={[row, { alignItems: 'center', justifyContent: 'space-between' }]}>
          <AppText weight="700">{tt('language')}</AppText>
          <LangSwitch />
        </View>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <AppText weight="700" style={{ marginBottom: 14 }}>
          {tt('fontSize')}
        </AppText>
        <View style={[row, { gap: 10 }]}>
          {fontScales.map((scale) => {
            const selected = fontScale === scale;
            return (
              <Pressable
                key={scale}
                onPress={() => setFontScale(scale)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={String(Math.round(scale * 100)) + '%'}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? palette.tealDark : palette.mint,
                }}
              >
                <AppText
                  weight="700"
                  style={{ color: selected ? '#fff' : palette.ink }}
                >
                  {Math.round(scale * 100)}%
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <View style={[row, { alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <AppText weight="700">{tt('contrast')}</AppText>
          </View>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ false: palette.border, true: palette.teal }}
            thumbColor={highContrast ? palette.tealDark : undefined}
            accessibilityLabel={tt('contrast')}
          />
        </View>
      </Card>
    </Screen>
  );
}
