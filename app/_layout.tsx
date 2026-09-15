import {
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  useFonts,
} from '@expo-google-fonts/cairo';
import {
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../src/store';
import { colors } from '../src/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Shell>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      </Shell>
    </AppProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { role, isRTL } = useApp();
  const wide = Platform.OS === 'web' && role === 'specialist';
  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>{children}</View>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#C9DDD6', alignItems: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
      <View
        style={{
          width: '100%',
          maxWidth: wide ? 1120 : 430,
          flex: 1,
          backgroundColor: colors.bg,
          overflow: 'hidden',
          shadowColor: '#0F3B34',
          shadowOpacity: 0.18,
          shadowRadius: 30,
        }}
      >
        {children}
      </View>
    </View>
  );
}
