import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { API_URL } from '../../src/config';
import { getSupabaseAccessToken } from '../../src/services/supabaseData';
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
    preparationAr: [
      'أحضر الهوية.',
      'وصل قبل الموعد بـ 15 دقيقة.',
    ],
    preparationEn: [
      'Bring your ID.',
      'Arrive 15 minutes early.',
    ],
  },
  {
    id: 'internal',
    ar: 'الباطنة',
    en: 'Internal medicine',
    preparationAr: [
      'صم 8 ساعات إذا كان الموعد يتطلب تحاليل.',
      'أحضر قائمة أدويتك الحالية.',
    ],
    preparationEn: [
      'Fast for 8 hours if your visit includes lab work.',
      'Bring a list of your current medications.',
    ],
  },
  {
    id: 'lab',
    ar: 'المختبر',
    en: 'Laboratory',
    preparationAr: [
      'أحضر الهوية وطلب التحليل إن وجد.',
      'اتبع تعليمات الصيام في طلب التحليل.',
    ],
    preparationEn: [
      'Bring your ID and lab request, if available.',
      'Follow the fasting instructions on your lab request.',
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
> = [
  {
    id: 'sep-21',
    ar: '21 سبتمبر، 9:30 ص',
    en: 'September 21, 9:30 AM',
    date: '2026-09-21',
    time: '09:30',
  },
  {
    id: 'sep-22',
    ar: '22 سبتمبر، 11:00 ص',
    en: 'September 22, 11:00 AM',
    date: '2026-09-22',
    time: '11:00',
  },
  {
    id: 'sep-23',
    ar: '23 سبتمبر، 1:15 م',
    en: 'September 23, 1:15 PM',
    date: '2026-09-23',
    time: '13:15',
  },
];

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
    (a) =>
      a.status === 'upcoming' ||
      a.status === 'updated' ||
      a.status === 'booked' ||
      !a.status
  );

  const past = appointments.filter(
    (a) =>
      a.status === 'completed' ||
      a.status === 'cancelled'
  );

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

        preparationAr:
          specialty.preparationAr,

        preparationEn:
          specialty.preparationEn,
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

      {/* Upcoming appointments */}
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
          ) : (
            upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
              />
            ))
          )}

          <Pressable
            onPress={openBooking}
            style={{
              marginTop: 24,
              backgroundColor:
                palette.tealDark,
              borderRadius: 22,
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
                color="#fff"
              />

              <AppText
                size={16}
                weight="700"
                style={{
                  color: '#fff',
                }}
              >
                {tt(
                  'bookNewAppointment'
                )}
              </AppText>
            </View>
          </Pressable>
        </>
      ) : (
        <>
          {past.length === 0 ? (
            <Card>
              <AppText muted>
                {tt('noPrevious')}
              </AppText>
            </Card>
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

  const isUpcoming =
    appointment.status ===
      'upcoming' ||
    appointment.status ===
      'updated' ||
    appointment.status ===
      'booked' ||
    !appointment.status;

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
            isUpcoming
              ? tt('upcoming')
              : tt('completed')
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
}: {
  specialty:
    (typeof specialties)[number];
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
    </Card>
  );
}