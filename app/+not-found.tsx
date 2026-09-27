import { Link, Stack } from 'expo-router';
import { AppText, Screen } from '../src/ui';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'عون', headerShown: false }} />
      <Screen>
        <AppText size={22} weight="700">
          Awn
        </AppText>
        <Link href="/">
          <AppText>Home</AppText>
        </Link>
      </Screen>
    </>
  );
}
