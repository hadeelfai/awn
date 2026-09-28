import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import {
  AppText,
  Card,
  Screen,
  TopBar,
  useUi,
} from '../../src/ui';

export default function Notifications() {
  const { tt, locale, notifications, markNotification, palette, row } =
    useUi();

  if (!notifications.length) {
    return (
      <Screen>
        <TopBar title={tt('notifications')} back right={null} />
        <Card>
          <AppText muted>{tt('emptyNotif')}</AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <TopBar title={tt('notifications')} back right={null} />
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          style={{ marginBottom: 12 }}
          onPress={() => {
            markNotification(notification.id);
            if (notification.href) {
              router.push(notification.href as never);
            }
          }}
        >
          <View style={[row, { alignItems: 'flex-start', gap: 12 }]}>
            <Ionicons
              name={notification.read ? 'notifications-outline' : 'notifications'}
              size={22}
              color={notification.read ? palette.inkMuted : palette.tealDark}
            />
            <View style={{ flex: 1 }}>
              <AppText weight="700">
                {locale === 'ar' ? notification.titleAr : notification.titleEn}
              </AppText>
              <AppText muted size={14} style={{ marginTop: 4 }}>
                {locale === 'ar' ? notification.bodyAr : notification.bodyEn}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
