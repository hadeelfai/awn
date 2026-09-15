import { View } from 'react-native';
import { AppText, Card, Screen, TopBar, useUi } from '../../src/ui';

export default function Metrics() {
  const { tt, stats, feedback, locale } = useUi();
  const avg = stats.satisfaction;
  const confusing = feedback.filter((f) => f.tags.includes('chipsConfusing')).length;
  return (
    <Screen scroll>
      <TopBar title={tt('experience')} />
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 10 }}>
        <Stat n={avg || '—'} l={tt('satisfaction')} />
        <Stat n={stats.journeys} l={tt('journeys')} />
        <Stat n={stats.pending} l={tt('pending')} />
        <Stat n={confusing} l={tt('commonIssues')} />
      </View>
      <AppText size={18} weight="700" style={{ marginTop: 22 }}>
        {tt('trends')}
      </AppText>
      {feedback.slice(0, 6).map((f) => (
        <Card key={f.id} style={{ marginTop: 8 }}>
          <AppText weight="700">
            {f.rating}/5 · {f.journey}
          </AppText>
          <AppText muted>{f.tags.join(' · ') || '—'}</AppText>
          {f.comment ? <AppText>{f.comment}</AppText> : null}
        </Card>
      ))}
    </Screen>
  );
}

function Stat({ n, l }: { n: number | string; l: string }) {
  return (
    <Card style={{ width: '47%', flexGrow: 1 }}>
      <AppText size={28} weight="700">
        {n}
      </AppText>
      <AppText muted>{l}</AppText>
    </Card>
  );
}
