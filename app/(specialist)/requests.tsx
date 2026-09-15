import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, Screen, StatusPill, TopBar, useUi } from '../../src/ui';
import type { RequestStatus } from '../../src/types';

const filters: { id: 'all' | RequestStatus; key: 'all' | 'new' | 'pending' | 'approved' | 'moreInfo' }[] = [
  { id: 'all', key: 'all' },
  { id: 'new', key: 'new' },
  { id: 'pending', key: 'pending' },
  { id: 'approved', key: 'approved' },
  { id: 'more_info', key: 'moreInfo' },
];

export default function Requests() {
  const { tt, locale, requests, palette, isRTL } = useUi();
  const [f, setF] = useState<(typeof filters)[number]['id']>('all');
  const list = requests.filter((r) => (f === 'all' ? true : f === 'approved' ? r.status === 'approved' || r.status === 'modified' : r.status === f));
  return (
    <Screen scroll>
      <TopBar title={tt('requests')} />
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {filters.map((x) => (
          <Pressable
            key={x.id}
            onPress={() => setF(x.id)}
            style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: f === x.id ? palette.tealDark : palette.mint }}
          >
            <AppText size={13} weight="700" style={{ color: f === x.id ? '#fff' : palette.tealDark }}>
              {tt(x.key)}
            </AppText>
          </Pressable>
        ))}
      </View>
      {list.map((r) => (
        <Card key={r.id} style={{ marginBottom: 10 }} onPress={() => router.push(`/(specialist)/request/${r.id}`)}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }}>
            <AppText weight="700">{r.id}</AppText>
            <StatusPill
              label={r.status === 'more_info' ? tt('moreInfo') : r.status === 'new' ? tt('new') : r.status === 'pending' ? tt('pending') : tt('approved')}
              tone={r.status === 'new' ? 'info' : r.status === 'pending' ? 'warning' : r.status === 'more_info' ? 'danger' : 'success'}
            />
          </View>
          <AppText>{locale === 'ar' ? r.patientNameAr : r.patientNameEn}</AppText>
          <AppText muted>{locale === 'ar' ? r.reasonAr : r.reasonEn}</AppText>
          <AppText size={13} muted>
            {r.createdAt.slice(0, 16).replace('T', ' ')} · {typeLabel(tt, r.type)}
          </AppText>
        </Card>
      ))}
    </Screen>
  );
}

function typeLabel(tt: ReturnType<typeof useUi>['tt'], type: string) {
  if (type === 'specialty_guidance') return tt('typeSpecialty');
  if (type === 'appointment_change') return tt('typeChange');
  if (type === 'prescription_query') return tt('typeRx');
  return tt('typeMedical');
}
