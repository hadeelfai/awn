import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUi } from '../../src/ui';

export default function BeneficiaryLayout() {
  const { tt, palette } = useUi();
  return (
    <Tabs
      tabBar={(props) => <BigTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: tt('home') }} />
      <Tabs.Screen name="ask" options={{ title: tt('askMe') }} />
      <Tabs.Screen name="appointments" options={{ title: tt('myAppointments') }} />
      <Tabs.Screen name="explain" options={{ title: tt('explainMe') }} />
      <Tabs.Screen name="appointment" options={{ href: null }} />
      <Tabs.Screen name="report" options={{ href: null }} />
    </Tabs>
  );
}

function BigTabBar({ state, navigation, descriptors }: any) {
  const insets = useSafeAreaInsets();
  const { palette, fs, isRTL } = useUi();
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: 'home',
    ask: 'chatbubbles',
    appointments: 'calendar',
    explain: 'document-text',
  };
  const visible = state.routes.filter((r: any) => ['index', 'ask', 'appointments', 'explain'].includes(r.name));
  return (
    <View
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        backgroundColor: palette.surface,
        borderTopWidth: 1,
        borderColor: palette.border,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
      }}
    >
      {visible.map((route: any) => {
        const focused = state.routes[state.index]?.key === route.key;
        const label = descriptors[route.key].options.title;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', minHeight: 58, justifyContent: 'center' }}
          >
            <Ionicons name={(focused ? icons[route.name] : `${String(icons[route.name])}-outline`) as keyof typeof Ionicons.glyphMap} size={24} color={focused ? palette.tealDark : palette.inkSoft} />
            <Text style={{ marginTop: 4, fontSize: fs(12), fontWeight: '700', color: focused ? palette.tealDark : palette.inkSoft }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
