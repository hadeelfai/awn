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
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { AppState, Platform, View } from 'react-native';
import { clearMedicationReminders, syncMedicationReminders } from '../src/services/medication-reminders';
import { supabase } from '../src/services/supabaseClient';
import { AppProvider, useApp } from '../src/store';
import { colors } from '../src/theme';

export { ErrorBoundary } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
  const { isRTL } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const refresh = () => { void syncMedicationReminders().catch((error) => console.warn('Reminder sync:', error)); };
    refresh();
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const authSubscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        void clearMedicationReminders().catch(console.warn);
      } else if (event === 'SIGNED_IN') {
        // Defer work to avoid calling Supabase auth methods inside auth callback.
        setTimeout(refresh, 0);
      }
    });
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.awonTag === 'awon-medication-v1') {
        router.push('/medications');
      }
    });
    return () => {
      appSubscription.remove();
      authSubscription.data.subscription.unsubscribe();
      notificationSubscription.remove();
    };
  }, [router]);

  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
        {children}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#C9DDD6', alignItems: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
      <View
        style={{
          width: '100%',
          maxWidth: 430,
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
