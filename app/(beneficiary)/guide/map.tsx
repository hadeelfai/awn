import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';
import { facilities } from '../../../src/data/seed';
import { AppText, Card, PrimaryButton, Screen, StatusPill, TopBar, useUi } from '../../../src/ui';
import type { Facility, FacilityType } from '../../../src/types';

const filters: { id: 'all' | FacilityType | 'med'; key: 'all' | 'pharmacies' | 'hospitals' | 'clinics' | 'centers' | 'medAvailable' }[] = [
  { id: 'all', key: 'all' },
  { id: 'pharmacy', key: 'pharmacies' },
  { id: 'hospital', key: 'hospitals' },
  { id: 'clinic', key: 'clinics' },
  { id: 'center', key: 'centers' },
  { id: 'med', key: 'medAvailable' },
];

export default function MapScreen() {
  const { tt, locale, palette, isRTL } = useUi();
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all');
  const [sel, setSel] = useState<Facility | null>(null);
  const list = facilities.filter((f) => {
    if (filter === 'all') return true;
    if (filter === 'med') return f.availabilityDemo === 'in_stock';
    return f.type === filter;
  });
  const icons: Record<FacilityType, keyof typeof Ionicons.glyphMap> = {
    pharmacy: 'medkit',
    hospital: 'business',
    clinic: 'heart',
    center: 'home',
  };
  return (
    <Screen scroll padded>
      <TopBar title={tt('mapTitle')} back />
      <AppText muted size={13} style={{ marginBottom: 8 }}>
        {tt('demoAvailability')}
      </AppText>
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {filters.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 18,
              backgroundColor: filter === f.id ? palette.tealDark : palette.mint,
            }}
          >
            <AppText size={13} weight="700" style={{ color: filter === f.id ? '#fff' : palette.tealDark }}>
              {tt(f.key)}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={{ height: 320, borderRadius: 24, overflow: 'hidden', backgroundColor: palette.mapLand, borderWidth: 1, borderColor: palette.border }}>
        <View style={{ position: 'absolute', left: 20, right: 20, top: 70, height: 10, backgroundColor: palette.mapRoad, borderRadius: 6 }} />
        <View style={{ position: 'absolute', left: 80, top: 20, bottom: 20, width: 10, backgroundColor: palette.mapRoad, borderRadius: 6 }} />
        <View style={{ position: 'absolute', left: 0, right: 40, bottom: 90, height: 8, backgroundColor: palette.mapRoad, opacity: 0.8 }} />
        <View style={{ position: 'absolute', width: 90, height: 40, right: 16, top: 16, backgroundColor: palette.mapWater, borderRadius: 20, opacity: 0.7 }} />
        <View
          style={{
            position: 'absolute',
            left: '48%',
            top: '46%',
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: palette.tealBright,
            borderWidth: 3,
            borderColor: '#fff',
          }}
          accessibilityLabel={locale === 'ar' ? 'موقعك التقريبي' : 'Your approximate location'}
        />
        {list.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setSel(f)}
            accessibilityLabel={locale === 'ar' ? f.nameAr : f.nameEn}
            style={{
              position: 'absolute',
              left: `${f.x * 100}%`,
              top: `${f.y * 100}%`,
              width: 36,
              height: 36,
              marginLeft: -18,
              marginTop: -18,
              borderRadius: 18,
              backgroundColor: f.type === 'pharmacy' ? palette.teal : palette.tealDark,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icons[f.type]} size={16} color="#fff" />
          </Pressable>
        ))}
      </View>
      <AppText size={16} weight="700" style={{ marginTop: 14, marginBottom: 8 }}>
        {tt('filters')}
      </AppText>
      {list.map((f) => (
        <Card key={f.id} style={{ marginBottom: 8 }} onPress={() => setSel(f)}>
          <AppText weight="700">{locale === 'ar' ? f.nameAr : f.nameEn}</AppText>
          <AppText muted>
            {f.distanceKm} {tt('km')} · {locale === 'ar' ? f.hoursAr : f.hoursEn}
          </AppText>
        </Card>
      ))}

      <Modal visible={!!sel} transparent animationType="slide" onRequestClose={() => setSel(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(10,28,24,0.4)', justifyContent: 'flex-end' }} onPress={() => setSel(null)}>
          {sel ? (
            <Pressable style={{ backgroundColor: palette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 }} onPress={() => {}}>
              <StatusPill
                label={sel.availabilityDemo === 'in_stock' ? tt('inStock') : sel.availabilityDemo === 'limited' ? tt('limited') : tt('unknownAvail')}
                tone={sel.availabilityDemo === 'in_stock' ? 'success' : sel.availabilityDemo === 'limited' ? 'warning' : 'neutral'}
              />
              <AppText size={22} weight="700" style={{ marginTop: 8 }}>
                {locale === 'ar' ? sel.nameAr : sel.nameEn}
              </AppText>
              <AppText muted>
                {sel.distanceKm} {tt('km')} · {locale === 'ar' ? sel.addressAr : sel.addressEn}
              </AppText>
              <AppText style={{ marginTop: 8 }}>
                {tt('hours')}: {locale === 'ar' ? sel.hoursAr : sel.hoursEn}
              </AppText>
              <View style={{ marginTop: 16, gap: 10 }}>
                <PrimaryButton label={tt('directions')} icon="navigate-outline" onPress={() => Linking.openURL('https://maps.google.com/?q=Jeddah')} />
                <PrimaryButton label={tt('call')} variant="soft" icon="call-outline" onPress={() => Linking.openURL(`tel:${sel.phone}`)} />
              </View>
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </Screen>
  );
}
