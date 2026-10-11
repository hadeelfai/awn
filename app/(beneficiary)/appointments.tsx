import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { API_URL } from '../../src/config';
import { getSupabaseAccessToken } from '../../src/services/supabaseData';
import MonthCalendar from '../../src/components/MonthCalendar';
import { formatAppointmentDate, isUpcomingAppointment, localDateKey } from '../../src/services/appointmentTime';
import {
  AppText,
  Card,
  PrimaryButton,
  Screen,
  StatusPill,
  TopBar,
  useUi,
} from '../../src/ui';

type Choice = {
  id: string;
  ar: string;
  en: string;
};

const specialties: Array<
  Choice & {
    preparationAr: string[];
    preparationEn: string[];
  }
> = [
  {
    id: 'family',
    ar: 'طب الأسرة',
    en: 'Family medicine',
    preparationAr: ['أحضر الهوية وتأكيد الموعد وقائمة أدويتك ذات الصلة.', 'اتبع تعليمات المركز الخاصة بموعدك.'],
    preparationEn: ['Bring your ID, appointment confirmation, and relevant medication list.', 'Follow the center’s instructions for your appointment.'],
  },
  {
    id: 'internal',
    ar: 'الباطنة',
    en: 'Internal medicine',
    preparationAr: ['أحضر الهوية وقائمة أدويتك وتقاريرك ذات الصلة.', 'لا تصم أو توقف دواءً إلا إذا طلب منك فريق الرعاية ذلك.'],
    preparationEn: ['Bring your ID, medication list, and relevant reports.', 'Do not fast or stop medication unless your care team tells you to.'],
  },
  {
    id: 'lab',
    ar: 'المختبر',
    en: 'Laboratory',
    preparationAr: [
      'أحضر الهوية وطلب التحليل إن وجد.',
      'اتبع تعليمات التحضير المكتوبة لطلب التحليل؛ تختلف التعليمات حسب الفحص.',
    ],
    preparationEn: [
      'Bring your ID and lab request, if available.',
      'Follow the written preparation instructions for your specific test; instructions vary by test.',
    ],
  },
];

const centers: Choice[] = [
  {
    id: 'rawda',
    ar: 'مركز الرعاية الأولية — الروضة',
    en: 'Primary care center — Al Rawdah',
  },
  {
    id: 'king-abdulaziz',
    ar: 'مستشفى الملك عبدالعزيز',
    en: 'King Abdulaziz Hospital',
  },
  {
    id: 'salamah',
    ar: 'عيادة الأسرة — حي السلامة',
    en: 'Family clinic — Al Salamah',
  },
];

const doctors: Choice[] = [
  {
    id: 'sara',
    ar: 'د. سارة القحطاني',
    en: 'Dr. Sarah Alqahtani',
  },
  {
    id: 'noura',
    ar: 'د. نورة الغامدي',
    en: 'Dr. Noura Alghamdi',
  },
  {
    id: 'fahad',
    ar: 'د. فهد العتيبي',
    en: 'Dr. Fahad Alotaibi',
  },
];

const appointmentTimes: Array<
  Choice & {
    date: string;
    time: string;
  }
> = Array.from({ length: 3 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index + 1);
  const dateValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const time = ['09:30', '11:00', '13:15'][index];
  const label = new Intl.DateTimeFormat('en-SA-u-ca-gregory', { month: 'short', day: 'numeric' }).format(date);
  return { id: `date-${dateValue}`, ar: `${date.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'long', day: 'numeric' })} · ${time}`, en: `${label} · ${time}`, date: dateValue, time };
});

export default function Appointments() {
  const {
    tt,
    locale,
    appointments: localAppointments,
    mergeAppointments,
    palette,
    row,
    sendUser,
    bookAppointment,
  } = useUi();

  const [activeTab, setActiveTab] =
    useState<'upcoming' | 'previous'>('upcoming');
  const [calendarMode, setCalendarMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const [showBookingModal, setShowBookingModal] =
    useState(false);

  const [bookingStep, setBookingStep] =
    useState(1);

  const [selectedSpecialtyId, setSelectedSpecialtyId] =
    useState<string | null>(null);

  const [selectedCenterId, setSelectedCenterId] =
    useState<string | null>(null);

  const [selectedDoctorId, setSelectedDoctorId] =
    useState<string | null>(null);

  const [selectedTimeId, setSelectedTimeId] =
    useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState('');

  // Real appointments coming from agent-server
  const [backendAppointments, setBackendAppointments] =
    useState<any[]>([]);

  const loadAppointments = useCallback(async () => {
    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch(
        API_URL + '/appointments/booked',
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const data = await response.json();

      const savedAppointments = data.appointments ?? [];
      setBackendAppointments(savedAppointments);
      mergeAppointments(savedAppointments);
    } catch (error) {
      // console.log instead of console.error so Expo
      // does not show a large development warning.
      console.log(
        'Could not load booked appointments:',
        error
      );
    }
  }, [mergeAppointments]);

  // Reload every time the user opens مواعيدي
  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  /*
   * Keep both:
   *
   * backendAppointments:
   * appointments booked through Awn chat.
   *
   * localAppointments:
   * appointments created by the teammate's
   * existing manual booking UI.
   */
  const appointments = [
    ...new Map(
      [...backendAppointments, ...localAppointments].map(
        (appointment) => [appointment.id, appointment]
      )
    ).values(),
  ];

  const upcoming = appointments.filter(
    (a) => isUpcomingAppointment(a)
  );

  const past = appointments.filter(
    (a) => !isUpcomingAppointment(a)
  );
  const visibleAppointments = activeTab === 'upcoming' ? upcoming : past;
  const dayAppointments = visibleAppointments.filter((a) => a.date === selectedDate);

  const handleDirectBooking = () => {
    setShowBookingModal(false);

    // Navigate to Awn chat
    router.push('/(beneficiary)/ask');

    // Start the booking conversation
    setTimeout(() => {
      sendUser(
        locale === 'ar'
          ? 'أريد حجز موعد'
          : 'I want to book an appointment'
      );
    }, 100);
  };

  const handleFormBooking = () => {
    const specialty = specialties.find(
      (item) =>
        item.id === selectedSpecialtyId
    );

    const center = centers.find(
      (item) =>
        item.id === selectedCenterId
    );

    const doctor = doctors.find(
      (item) =>
        item.id === selectedDoctorId
    );

    const appointmentTime =
      appointmentTimes.find(
        (item) =>
          item.id === selectedTimeId
      );

    if (
      !specialty ||
      !center ||
      !doctor ||
      !appointmentTime
    ) {
      return;
    }

    const appointmentId =
      bookAppointment({
        specialtyAr: specialty.ar,
        specialtyEn: specialty.en,

        doctorAr: doctor.ar,
        doctorEn: doctor.en,

        facilityAr: center.ar,
        facilityEn: center.en,

        locationAr: center.ar,
        locationEn: center.en,

        date: appointmentTime.date,
        time: appointmentTime.time,
        symptoms: selectedSymptoms.trim() || undefined,

        preparationAr:
          specialty.preparationAr,

        preparationEn:
          specialty.preparationEn,

      /** 
        notesAr: 'حُفظت تفاصيل الموعد في تقويم عون فقط. لا يتصل هذا النموذج بنظام حجز المستشفى؛ يرجى التحقق من التوفر وتأكيد الموعد عبر صحتي أو مع المنشأة.',
        notesEn: 'Appointment details are saved in Awn only. This prototype is not connected to the hospital booking system; verify availability and confirm with Sehhaty or the facility.',
     */
     
        });

    if (!appointmentId) {
      return;
    }

    setShowBookingModal(false);

    router.push({
      pathname:
        '/(beneficiary)/appointment/[id]',
      params: {
        id: appointmentId,
        from: 'appointments',
      },
    });
  };

  const isFormComplete = Boolean(
    selectedSpecialtyId &&
      selectedCenterId &&
      selectedDoctorId &&
      selectedTimeId
  );

  const selectionForStep = [
    selectedSpecialtyId,
    selectedCenterId,
    selectedDoctorId,
    selectedTimeId,
  ][bookingStep - 1];

  const stepLabels =
    locale === 'ar'
      ? [
          'التخصص',
          'المنشأة',
          'الطبيب',
          'الموعد',
          'التحضير',
        ]
      : [
          'Specialty',
          'Center',
          'Doctor',
          'Appointment',
          'Preparation',
        ];

  const openBooking = () => {
    setSelectedSymptoms('');
    setBookingStep(1);
    setShowBookingModal(true);
  };

  return (
    <Screen scroll>
      <TopBar
        title={tt('myAppointments')}
        right={null}
      />

      {/* Tabs */}
      <View
        style={[
          row,
          {
            marginTop: 16,
            marginBottom: 16,
            gap: 8,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            setActiveTab('upcoming')
          }
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor:
              activeTab === 'upcoming'
                ? palette.tealDark
                : palette.mint,
            borderRadius: 22,
          }}
        >
          <AppText
            weight="700"
            style={{
              color:
                activeTab === 'upcoming'
                  ? '#fff'
                  : palette.tealDark,
            }}
          >
            {tt('upcoming')}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() =>
            setActiveTab('previous')
          }
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor:
              activeTab === 'previous'
                ? palette.tealDark
                : palette.mint,
            borderRadius: 22,
          }}
        >
          <AppText
            weight="700"
            style={{
              color:
                activeTab === 'previous'
                  ? '#fff'
                  : palette.tealDark,
            }}
          >
            {tt('previous')}
          </AppText>
        </Pressable>
      </View>


          <Pressable
            onPress={openBooking}
            style={{
              marginTop: 12,
              marginBottom: 22,
              borderRadius: 22,
              backgroundColor: palette.tealDeep,
              borderWidth: 2,
              borderColor: palette.mint,
              padding: 16,
              alignItems: 'center',
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
                name="add"
                size={22}
                style={{
                color: palette.mint}}
              />

              <AppText
                size={16}
                weight="700"
                style={{
                  color: palette.mint,
                }}
              >
                {tt(
                  'bookNewAppointment'
                )}
              </AppText>
            </View>
          </Pressable>


      {/* Upcoming appointments */}
      <View style={[row, { justifyContent: 'flex-end', marginBottom: 12 }]}>
        <Pressable onPress={() => setCalendarMode((value) => !value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: palette.mint, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }}>
          <Ionicons name={calendarMode ? 'list-outline' : 'calendar-outline'} size={18} color={palette.tealDark} />
          <AppText size={13} weight="700" style={{ color: palette.tealDark }}>{calendarMode ? (locale === 'ar' ? 'عرض القائمة' : 'List view') : (locale === 'ar' ? 'عرض التقويم' : 'Calendar view')}</AppText>
        </Pressable>
      </View>

      {activeTab === 'upcoming' ? (
        <>
          {upcoming.length === 0 ? (
            <Card>
              <AppText muted>
                {tt('noUpcoming')}
              </AppText>

              <AppText
                muted
                size={13}
                style={{
                  marginTop: 8,
                }}
              >
                {tt('bookNewAppointment')}
              </AppText>
            </Card>
          ) : calendarMode ? (
            <>
              <MonthCalendar value={selectedDate} onChange={setSelectedDate} markedDates={visibleAppointments.map((a) => a.date)} />
              <AppText size={16} weight="700" style={{ marginTop: 16, marginBottom: 10 }}>{formatAppointmentDate(selectedDate, locale)}</AppText>
              {dayAppointments.length ? dayAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />) : <Card><AppText muted>{locale === 'ar' ? 'لا توجد مواعيد في هذا اليوم.' : 'No appointments on this day.'}</AppText></Card>}
            </>
          ) : (
            upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
              />
            ))
          )}

        </>
      ) : (
        <>
          {past.length === 0 ? (
            <Card>
              <AppText muted>
                {tt('noPrevious')}
              </AppText>
            </Card>
          ) : calendarMode ? (
            <>
              <MonthCalendar value={selectedDate} onChange={setSelectedDate} markedDates={visibleAppointments.map((a) => a.date)} minDate="0000-01-01" />
              <AppText size={16} weight="700" style={{ marginTop: 16, marginBottom: 10 }}>{formatAppointmentDate(selectedDate, locale)}</AppText>
              {dayAppointments.length ? dayAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />) : <Card><AppText muted>{locale === 'ar' ? 'لا توجد مواعيد في هذا اليوم.' : 'No appointments on this day.'}</AppText></Card>}
            </>
          ) : (
            past.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
              />
            ))
          )}
        </>
      )}

      {/* Existing teammate booking modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        onRequestClose={() =>
          setShowBookingModal(false)
        }
      >
        <View
          style={{
            flex: 1,
            backgroundColor:
              palette.bg,
            padding: 24,
            paddingTop: 56,
          }}
        >
          <View
            style={[
              row,
              {
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 28,
              },
            ]}
          >
            <AppText
              size={20}
              weight="700"
            >
              {tt(
                'bookNewAppointment'
              )}
            </AppText>

            <Pressable
              onPress={() =>
                setShowBookingModal(
                  false
                )
              }
              hitSlop={12}
              accessibilityLabel={tt(
                'cancel'
              )}
            >
              <Ionicons
                name="close"
                size={26}
                color={palette.ink}
              />
            </Pressable>
          </View>

          <BookingProgress
            labels={stepLabels}
            activeStep={bookingStep}
          />

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 36,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={
              false
            }
          >
            <AppText
              size={28}
              weight="700"
              style={{
                marginBottom: 20,
              }}
            >
              {locale === 'ar'
                ? `اختر ${
                    stepLabels[
                      bookingStep - 1
                    ]
                  }`
                : `Choose your ${stepLabels[
                    bookingStep - 1
                  ].toLowerCase()}`}
            </AppText>

            {bookingStep === 1 ? (
              <ChoiceGroup
                choices={specialties}
                selectedId={
                  selectedSpecialtyId
                }
                onSelect={
                  setSelectedSpecialtyId
                }
              />
            ) : null}

            {bookingStep === 2 ? (
              <ChoiceGroup
                choices={centers}
                selectedId={
                  selectedCenterId
                }
                onSelect={
                  setSelectedCenterId
                }
              />
            ) : null}

            {bookingStep === 3 ? (
              <ChoiceGroup
                choices={doctors}
                selectedId={
                  selectedDoctorId
                }
                onSelect={
                  setSelectedDoctorId
                }
              />
            ) : null}

            {bookingStep === 4 ? (
              <ChoiceGroup
                choices={
                  appointmentTimes
                }
                selectedId={
                  selectedTimeId
                }
                onSelect={
                  setSelectedTimeId
                }
              />
            ) : null}

            {bookingStep === 5 &&
            selectedSpecialtyId ? (
              <>
                <Card
                  style={{
                    marginBottom: 16,
                  }}
                >
                  <AppText
                    size={20}
                    weight="700"
                  >
                    {locale === 'ar'
                      ? appointmentTimes.find(
                          (item) =>
                            item.id ===
                            selectedTimeId
                        )?.ar
                      : appointmentTimes.find(
                          (item) =>
                            item.id ===
                            selectedTimeId
                        )?.en}
                  </AppText>

                  <AppText
                    muted
                    style={{
                      marginTop: 6,
                    }}
                  >
                    {
                      centers.find(
                        (item) =>
                          item.id ===
                          selectedCenterId
                      )?.[locale]
                    }
                  </AppText>

                  <AppText muted>
                    {
                      doctors.find(
                        (item) =>
                          item.id ===
                          selectedDoctorId
                      )?.[locale]
                    }
                  </AppText>
                </Card>

                <PreparationPreview
                  specialty={
                    specialties.find(
                      (item) =>
                        item.id ===
                      selectedSpecialtyId
                    )!
                  }
                  symptoms={selectedSymptoms}
                  onSymptomsChange={setSelectedSymptoms}
                />
              </>
            ) : null}
          </ScrollView>

          <PrimaryButton
            label={
              bookingStep === 5
                ? tt(
                    'confirmBooking'
                  )
                : bookingStep === 4
                ? locale === 'ar'
                  ? 'عرض التحضير'
                  : 'View preparations'
                : tt('continue')
            }
            onPress={
              bookingStep === 5
                ? handleFormBooking
                : () =>
                    setBookingStep(
                      (step) =>
                        step + 1
                    )
            }
            disabled={
              bookingStep === 5
                ? !isFormComplete
                : !selectionForStep
            }
          />

          <Pressable
            onPress={() =>
              bookingStep === 1
                ? setShowBookingModal(
                    false
                  )
                : setBookingStep(
                    (step) =>
                      step - 1
                  )
            }
            style={{
              alignItems: 'center',
              paddingVertical: 16,
            }}
          >
            <AppText weight="700">
              {locale === 'ar'
                ? 'رجوع'
                : 'Back'}
            </AppText>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}

function AppointmentCard({
  appointment,
}: {
  appointment: any;
}) {
  const {
    locale,
    palette,
    row,
    tt,
  } = useUi();

  const isUpcoming = isUpcomingAppointment(appointment);
  const isCancelled = appointment.status === 'cancelled';

  return (
    <Card
      style={{
        marginBottom: 12,
      }}
      onPress={() =>
        router.push({
          pathname:
            '/(beneficiary)/appointment/[id]',
          params: {
            id: appointment.id,
            from: 'appointments',
          },
        })
      }
    >
      <View
        style={[
          row,
          {
            justifyContent:
              'space-between',
            alignItems: 'center',
          },
        ]}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <AppText
            size={18}
            weight="700"
          >
            {locale === 'ar'
              ? appointment.specialtyAr ??
                appointment.specialty
              : appointment.specialtyEn ??
                appointment.specialty}
          </AppText>

          {(appointment.doctorAr ||
            appointment.doctorEn ||
            appointment.doctor) && (
            <AppText muted>
              {locale === 'ar'
                ? appointment.doctorAr ??
                  appointment.doctor
                : appointment.doctorEn ??
                  appointment.doctor}
            </AppText>
          )}
        </View>

        <StatusPill
          label={
            isCancelled
              ? locale === 'ar' ? 'ملغى' : 'Cancelled'
              : isUpcoming
                ? tt('upcoming')
                : locale === 'ar' ? 'سابق' : 'Past'
          }
          tone={
            isUpcoming
              ? 'warning'
              : 'neutral'
          }
        />
      </View>

      <View
        style={[
          row,
          {
            marginTop: 12,
            gap: 16,
          },
        ]}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <AppText
            muted
            size={13}
          >
            {tt('date')}
          </AppText>

          <AppText weight="600">
            {appointment.date ??
              '-'}
          </AppText>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <AppText
            muted
            size={13}
          >
            {tt('time')}
          </AppText>

          <AppText weight="600">
            {appointment.time ??
              '-'}
          </AppText>
        </View>
      </View>

      <AppText
        muted
        style={{
          marginTop: 8,
        }}
      >
        {locale === 'ar'
          ? appointment.facilityAr ??
            appointment.centerAr ??
            appointment.locationAr ??
            appointment.cityAr ??
            appointment.city ??
            ''
          : appointment.facilityEn ??
            appointment.centerEn ??
            appointment.locationEn ??
            appointment.cityEn ??
            appointment.city ??
            ''}
      </AppText>

      {isUpcoming && (
        <View
          style={[
            row,
            {
              marginTop: 12,
              alignItems:
                'center',
              gap: 8,
            },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={16}
            color={palette.info}
          />

          <AppText
            size={13}
            style={{
              color:
                palette.info,
            }}
          >
            {tt(
              'viewPreparation'
            )}
          </AppText>
        </View>
      )}
    </Card>
  );
}

function BookingProgress({
  labels,
  activeStep,
}: {
  labels: string[];
  activeStep: number;
}) {
  const {
    palette,
    row,
  } = useUi();

  return (
    <View
      style={[
        row,
        {
          justifyContent:
            'space-between',
          gap: 6,
        },
      ]}
    >
      {labels.map(
        (label, index) => {
          const step =
            index + 1;

          const active =
            step <= activeStep;

          return (
            <View
              key={label}
              style={{
                flex: 1,
                alignItems:
                  'center',
                gap: 7,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  backgroundColor:
                    active
                      ? palette.tealDark
                      : palette.border,
                }}
              >
                <AppText
                  weight="700"
                  style={{
                    color: active
                      ? '#fff'
                      : palette.inkMuted,
                  }}
                >
                  {step}
                </AppText>
              </View>

              <AppText
                size={11}
                weight={
                  step ===
                  activeStep
                    ? '700'
                    : '500'
                }
                style={{
                  textAlign:
                    'center',
                  color:
                    step ===
                    activeStep
                      ? palette.tealDark
                      : palette.inkMuted,
                }}
              >
                {label}
              </AppText>
            </View>
          );
        }
      )}
    </View>
  );
}

function ChoiceGroup({
  choices,
  selectedId,
  onSelect,
}: {
  choices: Choice[];
  selectedId:
    | string
    | null;
  onSelect: (
    id: string
  ) => void;
}) {
  const {
    locale,
    palette,
    row,
  } = useUi();

  return (
    <View
      style={[
        row,
        {
          flexWrap: 'wrap',
          gap: 10,
        },
      ]}
    >
      {choices.map(
        (choice) => {
          const selected =
            selectedId ===
            choice.id;

          return (
            <Pressable
              key={choice.id}
              onPress={() =>
                onSelect(
                  choice.id
                )
              }
              accessibilityRole="radio"
              accessibilityState={{
                selected,
              }}
              style={{
                width: '100%',
                padding: 18,
                borderRadius: 18,
                borderWidth: 2,
                borderColor:
                  selected
                    ? palette.tealDark
                    : palette.border,
                backgroundColor:
                  selected
                    ? palette.mint
                    : palette.surface,
              }}
            >
              <View
                style={[
                  row,
                  {
                    alignItems:
                      'center',
                    justifyContent:
                      'space-between',
                    gap: 12,
                  },
                ]}
              >
                <AppText
                  size={17}
                  weight="700"
                  style={{
                    flex: 1,
                  }}
                >
                  {locale === 'ar'
                    ? choice.ar
                    : choice.en}
                </AppText>

                <Ionicons
                  name={
                    selected
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={22}
                  color={
                    palette.tealDark
                  }
                />
              </View>
            </Pressable>
          );
        }
      )}
    </View>
  );
}

function PreparationPreview({
  specialty,
  symptoms,
  onSymptomsChange,
}: {
  specialty:
    (typeof specialties)[number];
  symptoms: string;
  onSymptomsChange: (value: string) => void;
}) {
  const {
    tt,
    locale,
    palette,
    row,
  } = useUi();

  const preparations =
    locale === 'ar'
      ? specialty.preparationAr
      : specialty.preparationEn;

  return (
    <Card
      style={{
        marginBottom: 18,
        backgroundColor:
          palette.mint,
      }}
    >
      <AppText
        size={16}
        weight="700"
        style={{
          marginBottom: 8,
        }}
      >
        {tt('preparation')}
      </AppText>

      <AppText size={14} weight="700" style={{ marginTop: 10, marginBottom: 6 }}>
        {locale === 'ar' ? 'ما الأعراض أو سبب الزيارة؟ (اختياري)' : 'What symptoms or reason are you visiting for? (optional)'}
      </AppText>
      <TextInput
        value={symptoms}
        onChangeText={onSymptomsChange}
        multiline
        maxLength={2000}
        placeholder={locale === 'ar' ? 'مثال: ألم في العظام منذ أسبوع' : 'Example: bone pain for one week'}
        accessibilityLabel={locale === 'ar' ? 'الأعراض أو سبب الزيارة' : 'Symptoms or reason for visit'}
        style={{ minHeight: 82, borderWidth: 1, borderColor: palette.border, borderRadius: 14, padding: 12, color: palette.ink, textAlign: locale === 'ar' ? 'right' : 'left', textAlignVertical: 'top', backgroundColor: palette.surface, marginBottom: 12 }}
      />

      {preparations.map(
        (item) => (
          <View
            key={item}
            style={[
              row,
              {
                gap: 8,
                alignItems:
                  'flex-start',
                marginBottom: 5,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={
                palette.success
              }
            />

            <AppText
              size={14}
              style={{
                flex: 1,
              }}
            >
              {item}
            </AppText>
          </View>
        )
      )}

      <Pressable onPress={() => void Linking.openURL('https://www.moh.gov.sa/en/eservices/sehhaty/pages/appointment-booking-on-sehhaty.aspx')} style={{ marginTop: 8 }}>
        <AppText size={12} weight="700" style={{ color: palette.tealDark, textDecorationLine: 'underline' }}>{locale === 'ar' ? 'مصدر وزارة الصحة: خدمة المواعيد عبر صحتي' : 'MOH source: appointment service in Sehhaty'}</AppText>
      </Pressable>
      <AppText muted size={12} style={{ marginTop: 8 }}>{locale === 'ar' ? 'التواريخ والأوقات هنا لا تمثل توفر المستشفى المباشر؛ تحقق من الموعد واحجزه رسمياً عبر صحتي أو المنشأة.' : 'These dates and times are not live hospital availability. Verify and book the official slot in Sehhaty or with the facility.'}</AppText>
    </Card>
  );
}
