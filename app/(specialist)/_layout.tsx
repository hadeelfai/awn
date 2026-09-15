import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, LangSwitch, useUi } from '../../src/ui';

export default function SpecialistLayout() {
  const { palette, tt, isRTL } = useUi();
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: palette.bg }}>
        <SideNav />
        <View style={{ flex: 1 }}>
          <Tabs
            tabBar={() => null}
            screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.bg } }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="requests" />
            <Tabs.Screen name="metrics" />
            <Tabs.Screen name="request" options={{ href: null }} />
          </Tabs>
        </View>
      </View>
    );
  }
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.bg } }}
      tabBar={(p) => <SpecTabs {...p} />}
    >
      <Tabs.Screen name="index" options={{ title: tt('dashboard') }} />
      <Tabs.Screen name="requests" options={{ title: tt('requests') }} />
      <Tabs.Screen name="metrics" options={{ title: tt('experience') }} />
      <Tabs.Screen name="request" options={{ href: null }} />
    </Tabs>
  );
}

function SideNav() {
  const { tt, palette, setRole, stats } = useUi();
  const items = [
    { href: '/(specialist)', label: tt('dashboard'), icon: 'grid-outline' as const },
    { href: '/(specialist)/requests', label: tt('requests'), icon: 'clipboard-outline' as const },
    { href: '/(specialist)/metrics', label: tt('experience'), icon: 'stats-chart-outline' as const },
  ];
  return (
    <View style={{ width: 240, backgroundColor: palette.tealDark, padding: 18, justifyContent: 'space-between' }}>
      <View>
        <AppText style={{ color: '#fff' }} size={22} weight="700">
          {tt('brand')}
        </AppText>
        <AppText style={{ color: '#C9E6E2' }} size={13}>
          {tt('dashboard')}
        </AppText>
        <View style={{ marginTop: 16 }}>
          <LangSwitch />
        </View>
        {items.map((it) => (
          <Pressable key={it.href} onPress={() => router.push(it.href as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 }}>
            <Ionicons name={it.icon} color="#fff" size={20} />
            <Text style={{ color: '#fff', fontWeight: '700' }}>{it.label}</Text>
          </Pressable>
        ))}
      </View>
      <View>
        <Text style={{ color: '#C9E6E2', marginBottom: 8 }}>{tt('todayLoad')}: {stats.neu + stats.pending}</Text>
        <Pressable
          onPress={() => {
            setRole(null);
            router.replace('/');
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{tt('logout')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SpecTabs({ state, navigation, descriptors }: any) {
  const insets = useSafeAreaInsets();
  const { palette, fs } = useUi();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: palette.surface, borderTopWidth: 1, borderColor: palette.border, paddingBottom: insets.bottom }}>
      {state.routes
        .filter((r: any) => r.name !== 'request')
        .map((route: any) => {
          const focused = state.routes[state.index]?.name === route.name;
          return (
            <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} style={{ flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: focused ? palette.tealDark : palette.inkSoft, fontWeight: '700', fontSize: fs(12) }}>{descriptors[route.key].options.title}</Text>
            </Pressable>
          );
        })}
    </View>
  );
}
