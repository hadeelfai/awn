import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen, StatusPill, TopBar, useUi } from '../../src/ui';

export default function Notifications() {
  const { tt, locale, notifications, markNotification } = useUi();
  return (
    <Screen scroll>
      <TopBar title={tt('notifications')} back />
      {notifications.length === 0 ? <AppText muted>{tt('emptyNotif')}</AppText> : null}
      {notifications.map((n) => (
        <Card
          key={n.id}
          style={{ marginBottom: 10, opacity: n.read ? 0.72 : 1 }}
          onPress={() => {
            markNotification(n.id);
            if (n.href) router.push(n.href as any);
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <StatusPill label={n.read ? tt('done') : tt('unread')} tone={n.read ? 'neutral' : 'warning'} />
          </View>
          <AppText size={17} weight="700" style={{ marginTop: 8 }}>
            {locale === 'ar' ? n.titleAr : n.titleEn}
          </AppText>
          <AppText muted>{locale === 'ar' ? n.bodyAr : n.bodyEn}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
