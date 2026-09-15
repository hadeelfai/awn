import { Stack } from 'expo-router';
import { useUi } from '../../../src/ui';

export default function GuideLayout() {
  const { palette } = useUi();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />;
}
