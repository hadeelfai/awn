import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import {
  AppText,
  Card,
  HeroBand,
  LangSwitch,
  Screen,
  SpeakBtn,
  useUi,
} from '../../src/ui';

export default function Home() {
  const {
    tt,
    displayName,
    palette,
    row,
    locale,
  } = useUi();

  const isArabic = locale === 'ar';

  return (
    <Screen scroll>
      {/* HEADER */}
      <View
        style={{
          minHeight: 92,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          position: 'relative',
        }}
      >
        <View style={{ zIndex: 1 }}>
          <LangSwitch />
        </View>

        <Image
          source={require('../../assets/brand/logo.png')}
          style={{
            width: 111,
            height: 111,
            position: 'absolute',
            left: '50%',
            transform: [{ translateX: -42 }],
          }}
          contentFit="contain"
          accessibilityLabel={tt('brand')}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }}>
          <Pressable
            onPress={() => router.push('/(beneficiary)/notifications')}
            accessibilityRole="button"
            accessibilityLabel={tt('notifications')}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={19}
              color={palette.ink}
            />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(beneficiary)/settings')}
            accessibilityRole="button"
            accessibilityLabel={tt('settings')}
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="settings-outline"
              size={19}
              color={palette.ink}
            />
          </Pressable>
        </View>
      </View>

      <View style={{ marginBottom: 20 }}>
        <AppText size={27} weight="700">
          {tt('helloName', {
            name: displayName.split(' ')[0],
          })}
        </AppText>
        <AppText muted size={17} style={{ marginTop: 4 }}>
          {tt('brand')} — {tt('tagline')}
        </AppText>
      </View>

      {/* HERO */}
      <HeroBand>
        <View
          style={[
            row,
            {
              justifyContent: 'space-between',
              alignItems: 'center',
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <AppText size={15} muted>
              {tt('howHelp')}
            </AppText>

            <AppText
              size={22}
              weight="700"
              style={{ marginTop: 4 }}
            >
              {tt('composer')}
            </AppText>
          </View>

          <SpeakBtn
            text={`${tt('helloName', {
              name: displayName,
            })} ${tt('howHelp')}`}
          />
        </View>

        <Pressable
          onPress={() =>
            router.push('/(beneficiary)/ask')
          }
          accessibilityRole="button"
          style={[
            row,
            {
              marginTop: 16,
              backgroundColor: palette.surface,
              borderRadius: 28,
              minHeight: 60,
              paddingHorizontal: 16,
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: palette.border,
            },
          ]}
        >
          <Ionicons
            name="mic-circle"
            size={34}
            color={palette.teal}
          />

          <AppText muted style={{ flex: 1 }}>
            {tt('composer')}
          </AppText>
        </Pressable>
      </HeroBand>

      {/* QUICK ACTIONS */}
      <View
        style={{
          flexDirection:
            locale === 'ar'
              ? 'row-reverse'
              : 'row',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 18,
        }}
      >

      {/*
        <Quick
          title={tt('askMe')}
          hint={tt('askMeHint')}
          icon="chatbubbles"
          onPress={() =>
            router.push('/(beneficiary)/ask')
          }
        />
*/ }


{/**
        <Quick
          title={tt('myAppointments')}
          hint={tt('myAppointmentsHint')}
          icon="calendar"
          onPress={() =>
            router.push('/(beneficiary)/appointments')
          }
        />
 */}

        <Quick
          title={
            isArabic
              ? 'أدويتي'
              : 'My medications'
          }
          hint={
            isArabic
              ? 'عرض الأدوية والوصفات'
              : 'View medications and prescriptions'
          }
          icon="medkit"
          onPress={() =>
            router.push('/(beneficiary)/medications')
          }
        />

        <Quick
          title={tt('explainMe')}
          hint={tt('explainHint')}
          icon="document-text"
          onPress={() =>
            router.push('/(beneficiary)/explain')
          }
        />


      </View>

      {/* AWN SUGGESTS */}
      <SectionHeader
        icon="sparkles"
        title={
          isArabic
            ? 'عون يقترح لك'
            : 'Awn suggests'
        }
      />

      {/* NEXT APPOINTMENT */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: palette.border,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: 18 }}>
          <View
            style={[
              row,
              {
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <View
                style={[
                  row,
                  {
                    alignItems: 'center',
                    gap: 10,
                  },
                ]}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: palette.mint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={21}
                    color={palette.tealDark}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <AppText
                    size={13}
                    muted
                    weight="600"
                  >
                    {isArabic
                      ? 'موعدك القادم'
                      : 'Your next appointment'}
                  </AppText>

                  <AppText
                    size={19}
                    weight="700"
                    style={{ marginTop: 2 }}
                  >
                    {isArabic
                      ? 'عيادة العظام'
                      : 'Orthopedics'}
                  </AppText>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: palette.mint,
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <AppText
                size={12}
                weight="700"
                style={{
                  color: palette.tealDark,
                }}
              >
                {isArabic
                  ? 'بعد 3 أيام'
                  : 'In 3 days'}
              </AppText>
            </View>
          </View>

          <View
            style={{
              marginTop: 18,
              gap: 10,
            }}
          >
            <DetailRow
              icon="time-outline"
              text={
                isArabic
                  ? 'الأحد، 21 سبتمبر · 9:00 ص'
                  : 'Sunday, Sep 21 · 9:00 AM'
              }
            />

            <DetailRow
              icon="location-outline"
              text={
                isArabic
                  ? 'مركز الرعاية الأولية — الروضة'
                  : 'Primary care center — Al Rawdah'
              }
            />
          </View>
        </View>

        {/* APPOINTMENT PREPARATION */}
        <View
          style={{
            backgroundColor: palette.mint,
            padding: 18,
          }}
        >
          <View
            style={[
              row,
              {
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={palette.tealDark}
            />

            <AppText
              size={16}
              weight="700"
              style={{
                color: palette.tealDark,
              }}
            >
              {isArabic
                ? 'عون يساعدك تستعد'
                : 'Awn helps you prepare'}
            </AppText>
          </View>

          <AppText
            size={14}
            style={{
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            {isArabic
              ? 'جهّز تقريرك السابق وقائمة أدويتك، ودوّن أي تغيّرات أو أسئلة تريد مناقشتها مع الطبيب.'
              : 'Prepare your previous report, medication list, and any changes or questions you want to discuss with your doctor.'}
          </AppText>

          <Pressable
            onPress={() =>
              router.push('/(beneficiary)/ask')
            }
            style={{
              marginTop: 14,
              backgroundColor: palette.teal,
              minHeight: 48,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}
          >
            <View
              style={[
                row,
                {
                  alignItems: 'center',
                  gap: 7,
                },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={18}
                color="#FFFFFF"
              />

              <AppText
                weight="700"
                style={{
                  color: '#FFFFFF',
                }}
              >
                {isArabic
                  ? 'ساعدني أستعد'
                  : 'Help me prepare'}
              </AppText>
            </View>
          </Pressable>
        </View>
      </View>

      {/* SMART REMINDERS */}
      <SectionHeader
        icon="notifications-outline"
        title={
          isArabic
            ? 'تنبيهات من عون'
            : 'Awn reminders'
        }
      />

      <SmartReminder
        icon="document-text-outline"
        title={
          isArabic
            ? 'متابعة مقترحة'
            : 'Follow-up suggested'
        }
        description={
          isArabic
            ? 'رفعت تقريرًا طبيًا جديدًا، ولم يتم تسجيل موعد متابعة بعد.'
            : 'You uploaded a new medical report, but no follow-up appointment is recorded.'
        }
        action={
          isArabic
            ? 'احجز متابعة'
            : 'Book follow-up'
        }
        onPress={() =>
          router.push('/(beneficiary)/ask')
        }
      />

      <SmartReminder
        icon="medkit-outline"
        title={
          isArabic
            ? 'تذكير بالوصفة'
            : 'Prescription reminder'
        }
        description={
          isArabic
            ? 'متبقي 5 أيام على انتهاء وصفة فيتامين D3.'
            : '5 days remain before your Vitamin D3 prescription ends.'
        }
        action={
          isArabic
            ? 'عرض التفاصيل'
            : 'View details'
        }
        onPress={() =>
          router.push('/(beneficiary)/medications')
        }
      />

      {/* COMING UP */}
      <SectionHeader
        icon="checkmark-circle-outline"
        title={
          isArabic
            ? 'القادم'
            : 'Coming up'
        }
      />

      <Card
        style={{
          paddingVertical: 4,
          marginBottom: 12,
        }}
      >
        <TimelineItem
          icon="calendar-outline"
          date={
            isArabic
              ? '21 سبتمبر'
              : 'Sep 21'
          }
          title={
            isArabic
              ? 'موعد عيادة العظام'
              : 'Orthopedics appointment'
          }
          first
        />

        <TimelineItem
          icon="medkit-outline"
          date={
            isArabic
              ? '23 سبتمبر'
              : 'Sep 23'
          }
          title={
            isArabic
              ? 'انتهاء وصفة فيتامين D3'
              : 'Vitamin D3 prescription ends'
          }
        />

        <TimelineItem
          icon="document-text-outline"
          date={
            isArabic
              ? 'متابعة'
              : 'Follow-up'
          }
          title={
            isArabic
              ? 'تقرير جديد يحتاج مراجعة'
              : 'New report needs review'
          }
          last
        />
      </Card>

      {/* DEMO NOTE */}
      <View
        style={[
          row,
          {
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            marginTop: 8,
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
            ? 'بيانات تجريبية لعرض رؤية عون المستقبلية'
            : 'Demo data showing Awn’s future vision'}
        </AppText>
      </View>
    </Screen>
  );
}

function Quick({
  title,
  hint,
  icon,
  onPress,
}: {
  title: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { palette } = useUi();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        width: '47%',
        flexGrow: 1,
        minWidth: 140,
        backgroundColor: palette.surface,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: palette.border,
        minHeight: 128,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: palette.mint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={icon}
          size={22}
          color={palette.tealDark}
        />
      </View>

      <AppText
        size={18}
        weight="700"
        style={{ marginTop: 12 }}
      >
        {title}
      </AppText>

      <AppText muted size={13}>
        {hint}
      </AppText>
    </Pressable>
  );
}

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  const { palette, row } = useUi();

  return (
    <View
      style={[
        row,
        {
          alignItems: 'center',
          gap: 7,
          marginTop: 28,
          marginBottom: 11,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={palette.teal}
      />

      <AppText size={20} weight="700">
        {title}
      </AppText>
    </View>
  );
}

function DetailRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const { palette, row } = useUi();

  return (
    <View
      style={[
        row,
        {
          alignItems: 'center',
          gap: 8,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={palette.teal}
      />

      <AppText muted size={14}>
        {text}
      </AppText>
    </View>
  );
}

function SmartReminder({
  icon,
  title,
  description,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  const { palette, row, locale } = useUi();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: palette.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 16,
        marginBottom: 10,
      }}
    >
      <View
        style={[
          row,
          {
            alignItems: 'flex-start',
            gap: 12,
          },
        ]}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: palette.mint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={icon}
            size={21}
            color={palette.tealDark}
          />
        </View>

        <View style={{ flex: 1 }}>
          <AppText
            size={16}
            weight="700"
          >
            {title}
          </AppText>

          <AppText
            muted
            size={13}
            style={{
              marginTop: 4,
              lineHeight: 20,
            }}
          >
            {description}
          </AppText>

          <View
            style={[
              row,
              {
                alignItems: 'center',
                gap: 4,
                marginTop: 9,
              },
            ]}
          >
            <AppText
              size={13}
              weight="700"
              style={{
                color: palette.tealDark,
              }}
            >
              {action}
            </AppText>

            <Ionicons
              name={
                locale === 'ar'
                  ? 'arrow-back'
                  : 'arrow-forward'
              }
              size={14}
              color={palette.tealDark}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function TimelineItem({
  icon,
  date,
  title,
  first = false,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  date: string;
  title: string;
  first?: boolean;
  last?: boolean;
}) {
  const { palette, row } = useUi();

  return (
    <View
      style={[
        row,
        {
          minHeight: 72,
          alignItems: 'stretch',
        },
      ]}
    >
      <View
        style={{
          width: 42,
          alignItems: 'center',
        }}
      >
        {!first && (
          <View
            style={{
              width: 2,
              height: 14,
              backgroundColor: palette.border,
            }}
          />
        )}

        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: palette.mint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={icon}
            size={15}
            color={palette.tealDark}
          />
        </View>

        {!last && (
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: palette.border,
            }}
          />
        )}
      </View>

      <View
        style={{
          flex: 1,
          paddingTop: first ? 5 : 17,
          paddingBottom: 12,
        }}
      >
        <AppText
          size={12}
          weight="700"
          style={{
            color: palette.tealDark,
          }}
        >
          {date}
        </AppText>

        <AppText
          size={15}
          weight="600"
          style={{
            marginTop: 3,
          }}
        >
          {title}
        </AppText>
      </View>
    </View>
  );
}