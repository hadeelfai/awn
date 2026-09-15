import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { SPECIALIST } from '../../src/data/seed';
import { AppText, Card, Screen, TopBar, useUi } from '../../src/ui';

export default function SpecialistHome() {
  const { tt, locale, stats, requests, palette } = useUi();
  const cards = [
    { n: stats.neu, l: tt('newRequests'), tone: palette.info },
    { n: stats.pending, l: tt('pendingReviews'), tone: palette.warning },
    { n: stats.approved, l: tt('approvedCount'), tone: palette.success },
    { n: stats.more, l: tt('moreInfoCount'), tone: palette.danger },
  ];
  return (
    <Screen scroll>
      <TopBar title={tt('dashboard')} subtitle={locale === 'ar' ? SPECIALIST.nameAr : SPECIALIST.nameEn} />
      <AppText muted>{locale === 'ar' ? SPECIALIST.roleAr : SPECIALIST.roleEn}</AppText>
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {cards.map((c) => (
          <Pressable key={c.l} onPress={() => router.push('/(specialist)/requests')} style={{ width: '47%', flexGrow: 1 }}>
            <Card>
              <AppText size={32} weight="700" style={{ color: c.tone }}>
                {c.n}
              </AppText>
              <AppText muted>{c.l}</AppText>
            </Card>
          </Pressable>
        ))}
      </View>
      <Card style={{ marginTop: 12 }}>
        <AppText muted>{tt('todayLoad')}</AppText>
        <AppText size={28} weight="700">
          {stats.neu + stats.pending}
        </AppText>
      </Card>
      <AppText size={18} weight="700" style={{ marginTop: 22, marginBottom: 8 }}>
        {tt('requests')}
      </AppText>
      {requests.slice(0, 4).map((r) => (
        <Card key={r.id} style={{ marginBottom: 10 }} onPress={() => router.push(`/(specialist)/request/${r.id}`)}>
          <AppText weight="700">{r.id}</AppText>
          <AppText muted>{locale === 'ar' ? r.reasonAr : r.reasonEn}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
