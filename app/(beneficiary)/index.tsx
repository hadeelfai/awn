import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { buildScheduledDoses, getDoseRecordsForDate, getMedications, type MedicationRecord, type ScheduledDose } from '../../src/services/medications';

import { appointmentDateTime, formatAppointmentDate, getNextAppointment } from '../../src/services/appointmentTime';
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
    appointments,
  } = useUi();

  const isArabic = locale === 'ar';
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [todayDoses, setTodayDoses] = useState<ScheduledDose[]>([]);
  const [medicationLoading, setMedicationLoading] = useState(true);
  const [medicationError, setMedicationError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      setMedicationLoading(true);
      try {
        const nowDate = new Date();
        const date = `${nowDate.getFullYear()}-${String(nowDate.getMonth()+1).padStart(2,'0')}-${String(nowDate.getDate()).padStart(2,'0')}`;
        const [meds, records] = await Promise.all([getMedications(), getDoseRecordsForDate(date)]);
        if (!active) return;
        setMedications(meds);
        setTodayDoses(buildScheduledDoses(meds, date, records));
        setMedicationError(false);
      } catch (error) {
        console.warn('Could not load home medication reminders:', error);
        if (active) setMedicationError(true);
      } finally {
        if (active) setMedicationLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []));
  const pendingDoses = todayDoses.filter(d => d.status === 'pending');
  const nextDose = pendingDoses.find(d => new Date(d.scheduledAt).getTime() >= now);
  const todayDate = new Date(now);
  const todayDateString = `${todayDate.getFullYear()}-${String(todayDate.getMonth()+1).padStart(2,'0')}-${String(todayDate.getDate()).padStart(2,'0')}`;
  const upcomingExpiry = medications
    .filter(m => m.status === 'active' && m.end_date && m.end_date >= todayDateString)
    .sort((a,b) => (a.end_date ?? '').localeCompare(b.end_date ?? ''))[0];
  const expiryDays = upcomingExpiry?.end_date
    ? Math.round((new Date(`${upcomingExpiry.end_date}T12:00:00`).getTime() - new Date(`${todayDateString}T12:00:00`).getTime()) / 86400000)
    : null;
  const nextAppointment = getNextAppointment(appointments, new Date(now));
  const daysUntilNext = nextAppointment
    ? Math.max(0, Math.ceil(((appointmentDateTime(nextAppointment)?.getTime() ?? Date.now()) - Date.now()) / 86400000))
    : null;

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
                    {nextAppointment
                      ? (isArabic ? nextAppointment.specialtyAr : nextAppointment.specialtyEn)
                      : isArabic ? 'لا توجد مواعيد قادمة' : 'No upcoming appointments'}
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
                {nextAppointment
                  ? isArabic ? `بعد ${daysUntilNext} يوم` : `In ${daysUntilNext} days`
                  : isArabic ? 'احجز موعداً' : 'Book an appointment'}
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
                nextAppointment
                  ? `${formatAppointmentDate(nextAppointment.date, locale)} · ${nextAppointment.time}`
                  : isArabic ? 'ستظهر مواعيدك القادمة هنا' : 'Your upcoming appointments will appear here'
              }
            />

            <DetailRow
              icon="location-outline"
              text={
                nextAppointment
                  ? (isArabic ? nextAppointment.facilityAr : nextAppointment.facilityEn)
                  : isArabic ? 'افتح مواعيدي لإضافة موعد' : 'Open My Appointments to add one'
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
              ? 'أحضر هويتك وتأكيد الموعد وقائمة أدويتك وتقاريرك ذات الصلة. اتبع تعليمات المنشأة؛ لا تصم أو توقف دواءً إلا بتوجيه من فريق الرعاية.'
              : 'Bring your ID, appointment confirmation, medication list, and relevant reports. Follow the facility’s instructions; do not fast or stop medication unless your care team tells you to.'}
          </AppText>

          <Pressable
            onPress={() => nextAppointment
              ? router.push({ pathname: '/(beneficiary)/appointment/[id]', params: { id: nextAppointment.id, from: 'home' } })
              : router.push('/(beneficiary)/ask')}
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

      {medicationLoading ? (
        <Card style={{ marginBottom: 12 }}><AppText muted>{isArabic ? 'جارٍ تحميل تذكيرات الأدوية...' : 'Loading medication reminders...'}</AppText></Card>
      ) : medicationError ? (
        <Card style={{ marginBottom: 12 }}><AppText muted>{isArabic ? 'تعذر تحميل بيانات الأدوية حاليًا.' : 'Medication data is unavailable right now.'}</AppText></Card>
      ) : (
        <>
          {nextDose && (
            <SmartReminder
              icon="medkit-outline"
              title={isArabic ? 'جرعة مجدولة اليوم' : 'Scheduled dose today'}
              description={`${nextDose.medicationName} · ${nextDose.dosage} · ${nextDose.time}`}
              action={isArabic ? 'عرض جرعات اليوم' : 'View today’s doses'}
              onPress={() => router.push('/(beneficiary)/medications')}
            />
          )}
          {upcomingExpiry && expiryDays !== null && expiryDays <= 7 && (
            <SmartReminder
              icon="calendar-outline"
              title={isArabic ? 'اقتراب نهاية الوصفة' : 'Prescription ending soon'}
              description={isArabic
                ? `${upcomingExpiry.name}: ${expiryDays === 0 ? 'تنتهي اليوم' : `متبقي ${expiryDays} يوم`}`
                : `${upcomingExpiry.name}: ${expiryDays === 0 ? 'ends today' : `${expiryDays} day(s) remaining`}`}
              action={isArabic ? 'عرض الأدوية' : 'View medications'}
              onPress={() => router.push('/(beneficiary)/medications')}
            />
          )}
          {!nextDose && !(upcomingExpiry && expiryDays !== null && expiryDays <= 7) && (
            <Card style={{ marginBottom: 12 }}>
              <AppText muted>{isArabic ? 'لا توجد تنبيهات أدوية حاليًا.' : 'No medication reminders right now.'}</AppText>
            </Card>
          )}
        </>
      )}

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
            nextAppointment ? `${formatAppointmentDate(nextAppointment.date, locale)} · ${nextAppointment.time}` : isArabic ? '—' : '—'
          }
          title={
            nextAppointment
              ? (isArabic ? nextAppointment.specialtyAr : nextAppointment.specialtyEn)
              : isArabic ? 'لا يوجد موعد قادم' : 'No upcoming appointment'
          }
          first
        />

        {!medicationError && !medicationLoading && upcomingExpiry && (
          <TimelineItem
            icon="medkit-outline"
            date={new Date(`${upcomingExpiry.end_date}T12:00:00`).toLocaleDateString(isArabic ? 'ar-SA-u-ca-gregory' : 'en-US', { day: 'numeric', month: 'short' })}
            title={isArabic ? `نهاية وصفة ${upcomingExpiry.name}` : `${upcomingExpiry.name} prescription ends`}
            last
          />
        )}
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
