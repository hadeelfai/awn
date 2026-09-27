import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import {
    AppText,
    Card,
    Screen,
    StatusPill,
    TopBar,
    useUi,
} from '../../src/ui';

type Medication = {
  id: string;
  nameAr: string;
  nameEn: string;
  doseAr: string;
  doseEn: string;
  instructionAr: string;
  instructionEn: string;
  prescriptionEnd: string;
  daysLeft: number;
  status: 'endingSoon' | 'active';
};

const mockMedications: Medication[] = [
  {
    id: 'vitamin-d3',
    nameAr: 'فيتامين D3',
    nameEn: 'Vitamin D3',
    doseAr: '50,000 وحدة',
    doseEn: '50,000 IU',
    instructionAr: 'كبسولة واحدة أسبوعيًا',
    instructionEn: 'One capsule once a week',
    prescriptionEnd: '2026-09-23',
    daysLeft: 5,
    status: 'endingSoon',
  },
  {
    id: 'iron',
    nameAr: 'الحديد',
    nameEn: 'Ferrous Sulfate',
    doseAr: '200 ملغ',
    doseEn: '200 mg',
    instructionAr: 'قرص واحد يوميًا',
    instructionEn: 'One tablet daily',
    prescriptionEnd: '2026-10-18',
    daysLeft: 30,
    status: 'active',
  },
];

export default function Medications() {
  const { locale, palette, row } = useUi();

  const isArabic = locale === 'ar';

  return (
    <Screen scroll>
      <TopBar
        title={isArabic ? 'أدويتي' : 'My medications'}
        right={null}
      />

      {/* Summary */}
      <Card
        style={{
          marginTop: 16,
          marginBottom: 18,
          backgroundColor: palette.mint,
        }}
      >
        <View
          style={[
            row,
            {
              alignItems: 'center',
              gap: 12,
            },
          ]}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="medkit"
              size={23}
              color={palette.tealDark}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppText size={18} weight="700">
              {isArabic
                ? 'لديك وصفتان فعّالتان'
                : 'You have 2 active prescriptions'}
            </AppText>

            <AppText
              muted
              size={13}
              style={{ marginTop: 3 }}
            >
              {isArabic
                ? 'إحدى الوصفات تنتهي قريبًا'
                : 'One prescription is ending soon'}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Attention */}
      <View
        style={[
          row,
          {
            alignItems: 'center',
            gap: 7,
            marginBottom: 11,
          },
        ]}
      >
        <Ionicons
          name="notifications-outline"
          size={20}
          color={palette.teal}
        />

        <AppText size={20} weight="700">
          {isArabic
            ? 'يحتاج انتباهك'
            : 'Needs your attention'}
        </AppText>
      </View>

      <MedicationCard
        medication={mockMedications[0]}
      />

      {/* Current medications */}
      <View
        style={[
          row,
          {
            alignItems: 'center',
            gap: 7,
            marginTop: 24,
            marginBottom: 11,
          },
        ]}
      >
        <Ionicons
          name="medical-outline"
          size={20}
          color={palette.teal}
        />

        <AppText size={20} weight="700">
          {isArabic
            ? 'الأدوية الحالية'
            : 'Current medications'}
        </AppText>
      </View>

      {mockMedications.slice(1).map((medication) => (
        <MedicationCard
          key={medication.id}
          medication={medication}
        />
      ))}

      {/* Awn insight */}
      <Card
        style={{
          marginTop: 14,
          marginBottom: 12,
          backgroundColor: palette.mint,
        }}
      >
        <View
          style={[
            row,
            {
              alignItems: 'flex-start',
              gap: 10,
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={palette.tealDark}
          />

          <View style={{ flex: 1 }}>
            <AppText
              size={16}
              weight="700"
              style={{
                color: palette.tealDark,
              }}
            >
              {isArabic
                ? 'عون يذكّرك'
                : 'Awn reminder'}
            </AppText>

            <AppText
              size={13}
              style={{
                marginTop: 5,
                lineHeight: 20,
              }}
            >
              {isArabic
                ? 'متبقي 5 أيام على انتهاء وصفة فيتامين D3.'
                : '5 days remain before your Vitamin D3 prescription ends.'}
            </AppText>
          </View>
        </View>
      </Card>

      {/* Demo disclaimer */}
      <View
        style={[
          row,
          {
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            marginTop: 8,
            marginBottom: 16,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={palette.teal}
        />

        <AppText muted size={11}>
          {isArabic
            ? 'بيانات تجريبية لعرض نموذج عون'
            : 'Demo data for the Awn prototype'}
        </AppText>
      </View>
    </Screen>
  );
}

function MedicationCard({
  medication,
}: {
  medication: Medication;
}) {
  const { locale, palette, row } = useUi();

  const isArabic = locale === 'ar';
  const endingSoon =
    medication.status === 'endingSoon';

  return (
    <Card
      style={{
        marginBottom: 12,
      }}
    >
      {/* Medication name + status */}
      <View
        style={[
          row,
          {
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          },
        ]}
      >
        <View
          style={[
            row,
            {
              flex: 1,
              alignItems: 'center',
              gap: 11,
            },
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: palette.mint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="medical"
              size={21}
              color={palette.tealDark}
            />
          </View>

          <View style={{ flex: 1 }}>
            <AppText
              size={18}
              weight="700"
            >
              {isArabic
                ? medication.nameAr
                : medication.nameEn}
            </AppText>

            <AppText
              muted
              size={13}
              style={{
                marginTop: 2,
              }}
            >
              {isArabic
                ? medication.doseAr
                : medication.doseEn}
            </AppText>
          </View>
        </View>

        <StatusPill
          label={
            endingSoon
              ? isArabic
                ? 'تنتهي قريبًا'
                : 'Ending soon'
              : isArabic
              ? 'فعّالة'
              : 'Active'
          }
          tone={
            endingSoon
              ? 'warning'
              : 'success'
          }
        />
      </View>

      {/* Instructions */}
      <View
        style={[
          row,
          {
            alignItems: 'center',
            gap: 8,
            marginTop: 17,
          },
        ]}
      >
        <Ionicons
          name="time-outline"
          size={17}
          color={palette.teal}
        />

        <AppText size={14}>
          {isArabic
            ? medication.instructionAr
            : medication.instructionEn}
        </AppText>
      </View>

      {/* Expiry information */}
      <View
        style={{
          marginTop: 15,
          padding: 13,
          borderRadius: 15,
          backgroundColor: endingSoon
            ? palette.mint
            : palette.bg,
        }}
      >
        <View
          style={[
            row,
            {
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AppText muted size={12}>
              {isArabic
                ? 'انتهاء الوصفة'
                : 'Prescription ends'}
            </AppText>

            <AppText
              weight="700"
              style={{
                marginTop: 2,
              }}
            >
              {formatDate(
                medication.prescriptionEnd,
                locale
              )}
            </AppText>
          </View>

          <View
            style={{
              alignItems:
                isArabic
                  ? 'flex-start'
                  : 'flex-end',
            }}
          >
            <AppText muted size={12}>
              {isArabic
                ? 'الوقت المتبقي'
                : 'Time remaining'}
            </AppText>

            <AppText
              weight="700"
              style={{
                marginTop: 2,
                color: endingSoon
                  ? palette.tealDark
                  : palette.ink,
              }}
            >
              {isArabic
                ? `${medication.daysLeft} أيام`
                : `${medication.daysLeft} days`}
            </AppText>
          </View>
        </View>

        {endingSoon && (
          <View
            style={[
              row,
              {
                alignItems: 'center',
                gap: 6,
                marginTop: 11,
              },
            ]}
          >
            <Ionicons
              name="notifications"
              size={15}
              color={palette.tealDark}
            />

            <AppText
              size={13}
              weight="700"
              style={{
                color: palette.tealDark,
                flex: 1,
              }}
            >
              {isArabic
                ? `متبقي ${medication.daysLeft} أيام على انتهاء الوصفة`
                : `${medication.daysLeft} days remain before this prescription ends`}
            </AppText>
          </View>
        )}
      </View>
    </Card>
  );
}

function formatDate(
  date: string,
  locale: 'ar' | 'en'
) {
  const value = new Date(
    `${date}T12:00:00`
  );

  return value.toLocaleDateString(
    locale === 'ar'
      ? 'ar-SA'
      : 'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}