import { AppText, Card, Screen, TopBar, useUi } from '../../src/ui';

export default function Privacy() {
  const { tt } = useUi();
  return (
    <Screen scroll>
      <TopBar title={tt('privacy')} back />
      <Card>
        <AppText size={16}>{tt('principle')}</AppText>
      </Card>
      {[tt('privacy1'), tt('privacy2'), tt('privacy3'), tt('privacy4')].map((p) => (
        <Card key={p} style={{ marginTop: 10 }}>
          <AppText>{p}</AppText>
        </Card>
      ))}
    </Screen>
  );
}
