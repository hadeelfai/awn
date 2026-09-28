import * as Speech from 'expo-speech';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  demoLab,
  initialAppointments,
  initialNotifications,
  initialPrescriptions,
  PATIENT,
} from './data/seed';

import {
  greeting,
  optionToUserText,
  type AIResult,
} from './services/ai';

import { API_URL } from './config';
import {
  getSupabaseAccessToken,
  loadSyncedData,
  saveAppointment,
  saveChatMessage,
  saveReport,
} from './services/supabaseData';
import { colors, highContrastColors } from './theme';

import type {
  AppNotification,
  Appointment,
  ChatMessage,
  ChatOption,
  ExplainedDocument,
  FeedbackItem,
  IntakeState,
  Locale,
  Prescription,
} from './types';

type FontScale = 1 | 1.15 | 1.3;

type State = {
  locale: Locale;
  fontScale: FontScale;
  highContrast: boolean;
  appointments: Appointment[];
  prescriptions: Prescription[];
  notifications: AppNotification[];
  messages: ChatMessage[];
  intake: IntakeState;
  documents: ExplainedDocument[];
  feedback: FeedbackItem[];
  bookingUnlocked: boolean;
  reminderIds: string[];
};

const AppContext =
  createContext<ReturnType<typeof useAppValue> | null>(null);


function mergeById<T extends { id: string }>(
  current: T[],
  persisted: T[]
): T[] {
  const persistedIds = new Set(persisted.map((item) => item.id));
  return [
    ...persisted,
    ...current.filter((item) => !persistedIds.has(item.id)),
  ];
}

function useAppValue() {
  const [locale, setLocaleState] =
    useState<Locale>('ar');

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);

      if (typeof document !== 'undefined') {
        document.documentElement.dir =
          l === 'ar' ? 'rtl' : 'ltr';

        document.documentElement.lang = l;
      }
    },
    []
  );

  const [fontScale, setFontScale] =
    useState<FontScale>(1.15);

  const [highContrast, setHighContrast] =
    useState(false);

  const [appointments, setAppointments] =
    useState(initialAppointments);

  const mergeAppointments = useCallback(
    (incoming: Appointment[]) => {
      setAppointments((current) =>
        mergeById(current, incoming)
      );
    },
    []
  );

  const [prescriptions, setPrescriptions] =
    useState(initialPrescriptions);

  const [notifications, setNotifications] =
    useState(initialNotifications);

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      greeting('ar'),
    ]);

  const [intake, setIntake] =
    useState<IntakeState>({
      step: 0,
    });

  const [documents, setDocuments] =
    useState<ExplainedDocument[]>([
      demoLab,
    ]);

  const [feedback, setFeedback] =
    useState<FeedbackItem[]>([
      {
        id: 'F1',
        rating: 5,
        tags: ['clear'],
        createdAt: '2026-09-12',
        journey: 'explain',
      },
      {
        id: 'F2',
        rating: 4,
        tags: ['fast'],
        createdAt: '2026-09-13',
        journey: 'guide',
      },
      {
        id: 'F3',
        rating: 5,
        tags: ['helpful'],
        createdAt: '2026-09-14',
        journey: 'ask',
      },
    ]);

  const [
    bookingUnlocked,
    setBookingUnlocked,
  ] = useState(false);

  const [reminderIds, setReminderIds] =
    useState<string[]>([
      'APT-219',
    ]);

  useEffect(() => {
    let active = true;

    void loadSyncedData()
      .then((data) => {
        if (!active) return;

        setAppointments((current) => mergeById(current, data.appointments));
        setDocuments((current) => mergeById(current, data.reports));

        if (data.messages.length) {
          setMessages(data.messages);
        }
      })
      .catch((error) => {
        console.warn('Supabase sync unavailable:', error);
      });

    return () => {
      active = false;
    };
  }, []);


  const [
    pendingFeedback,
    setPendingFeedback,
  ] = useState<string | null>(null);

  const palette =
    highContrast
      ? highContrastColors
      : colors;

  const isRTL =
    locale === 'ar';

  const displayName =
    locale === 'ar'
      ? PATIENT.nameAr
      : PATIENT.nameEn;

  const speak = useCallback(
    (text: string) => {
      Speech.stop();

      Speech.speak(text, {
        language:
          locale === 'ar'
            ? 'ar-SA'
            : 'en-US',
        rate: 0.9,
      });
    },
    [locale]
  );

  const pushNotification =
    useCallback(
      (
        n: Omit<
          AppNotification,
          'id' | 'createdAt' | 'read'
        >
      ) => {
        setNotifications(
          (prev) => [
            {
              ...n,
              id: `N-${Date.now()}`,
              createdAt:
                new Date().toISOString(),
              read: false,
            },
            ...prev,
          ]
        );
      },
      []
    );

  /*
   * Kept because other parts of the
   * updated frontend may still use
   * the existing mock AIResult format.
   */
  const applyAI = useCallback(
    (result: AIResult) => {
      setMessages(
        (prev) => [
          ...prev,
          result.reply,
        ]
      );

      if (result.intake) {
        setIntake(result.intake);
      }

      const suggestedAppointment =
        result.suggestedAppointment;

      if (suggestedAppointment) {
        setAppointments(
          (prev) => [
            suggestedAppointment,
            ...prev,
          ]
        );
        void saveAppointment(suggestedAppointment).catch((error) =>
          console.warn('Could not save appointment:', error)
        );

        pushNotification({
          type: 'appointment_update',

          titleAr:
            'تم حجز موعد جديد',

          titleEn:
            'New appointment booked',

          bodyAr:
            `تم حجز موعد ${suggestedAppointment.specialtyAr} في ${suggestedAppointment.date}`,

          bodyEn:
            `Appointment booked for ${suggestedAppointment.specialtyEn} on ${suggestedAppointment.date}`,

          href:
            `/(beneficiary)/appointment/${suggestedAppointment.id}`,
        });
      }

      const createdDocument =
        result.createDocument;

      if (createdDocument) {
        setDocuments(
          (prev) => [
            createdDocument,
            ...prev,
          ]
        );
        void saveReport(createdDocument).catch((error) =>
          console.warn('Could not save report:', error)
        );

        pushNotification({
          type: 'appointment_update',

          titleAr:
            'تم شرح تقرير جديد',

          titleEn:
            'New report explained',

          bodyAr:
            `تم إضافة تقرير ${createdDocument.titleAr} إلى قسم فهمني`,

          bodyEn:
            `Report ${createdDocument.titleEn} added to Explain to Me`,

          href:
            `/(beneficiary)/report/${createdDocument.id}`,
        });
      }
    },
    [pushNotification]
  );

  /*
   * REAL AWN BACKEND
   */
  const sendUser = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        textAr: text,
        textEn: text,
        createdAt:
          new Date().toISOString(),
      };

      setMessages(
        (prev) => [
          ...prev,
          userMsg,
        ]
      );
      void saveChatMessage(userMsg).catch((error) =>
        console.warn('Could not save chat message:', error)
      );

      try {
        const response =
          await fetch(
            `${API_URL}/chat`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
                Authorization: 'Bearer ' + await getSupabaseAccessToken(),
              },

              body: JSON.stringify({
                message: text,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            `Backend returned ${response.status}`
          );
        }

        const result =
          await response.json();

        const awnMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'awn',
          textAr:
            result.reply ??
            'تعذر الحصول على رد من عون.',
          textEn:
            result.reply ??
            'Awn could not respond.',
          createdAt:
            new Date().toISOString(),
        };

        setMessages(
          (prev) => [
            ...prev,
            awnMsg,
          ]
        );
        void saveChatMessage(awnMsg).catch((error) =>
          console.warn('Could not save chat reply:', error)
        );
      } catch (error) {
        /*
         * Don't use console.error here.
         * Expo may display it as a large
         * development warning popup.
         */

        console.log(
          'Awn backend request failed:',
          error
        );

        const errorMsg: ChatMessage = {
          id: `a-error-${Date.now()}`,
          role: 'awn',

          textAr:
            'تعذر الاتصال بعون حالياً. حاول مرة أخرى.',

          textEn:
            'Could not connect to Awn. Please try again.',

          createdAt:
            new Date().toISOString(),
        };

        setMessages(
          (prev) => [
            ...prev,
            errorMsg,
          ]
        );
        void saveChatMessage(errorMsg).catch((saveError) =>
          console.warn('Could not save chat error:', saveError)
        );
      }
    },
    []
  );

  const sendOption = useCallback(
    (option: ChatOption) => {
      sendUser(
        optionToUserText(
          option,
          locale
        )
      );
    },
    [locale, sendUser]
  );

  const resetChat =
    useCallback(() => {
      setIntake({
        step: 0,
      });

      setMessages([
        greeting(locale),
      ]);
    }, [locale]);

  const markNotification =
    useCallback(
      (id: string) => {
        setNotifications(
          (prev) =>
            prev.map(
              (n) =>
                n.id === id
                  ? {
                      ...n,
                      read: true,
                    }
                  : n
            )
        );
      },
      []
    );

  const setReminder =
    useCallback(
      (
        appointmentId: string
      ) => {
        setReminderIds(
          (prev) =>
            prev.includes(
              appointmentId
            )
              ? prev
              : [
                  ...prev,
                  appointmentId,
                ]
        );

        pushNotification({
          type: 'preparation',

          titleAr:
            'تم تعيين تذكير للموعد',

          titleEn:
            'Appointment reminder set',

          bodyAr:
            'سنذكّرك بالتحضيرات والوقت قبل الزيارة.',

          bodyEn:
            'We will remind you about time and preparations before the visit.',

          href:
            `/(beneficiary)/guide/appointment/${appointmentId}`,
        });
      },
      [pushNotification]
    );

  const bookAppointment =
    useCallback(
      (
        details: Omit<
          Appointment,
          'id' | 'status'
        >
      ) => {
        const apt: Appointment = {
          id:
            `APT-${Math.floor(
              Math.random() *
                900 +
                300
            )}`,

          status: 'upcoming',

          ...details,
        };

        setAppointments(
          (prev) => [
            apt,
            ...prev,
          ]
        );
        void saveAppointment(apt).catch((error) =>
          console.warn('Could not save appointment:', error)
        );

        setPendingFeedback(
          'booking'
        );

        return apt.id;
      },
      []
    );

  const addDocument =
    useCallback(
      (
        doc: ExplainedDocument
      ) => {
        setDocuments(
          (prev) => [
            doc,
            ...prev,
          ]
        );
        void saveReport(doc).catch((error) =>
          console.warn('Could not save report:', error)
        );

        setPendingFeedback(
          'explain'
        );
      },
      []
    );

  const addPrescriptionFromScan =
    useCallback(
      (rx: Prescription) => {
        setPrescriptions(
          (prev) => [
            rx,
            ...prev,
          ]
        );
      },
      []
    );

  const addFeedback =
    useCallback(
      (
        item: Omit<
          FeedbackItem,
          'id' | 'createdAt'
        >
      ) => {
        setFeedback(
          (prev) => [
            {
              ...item,
              id:
                `F-${Date.now()}`,
              createdAt:
                new Date().toISOString(),
            },
            ...prev,
          ]
        );

        setPendingFeedback(
          null
        );
      },
      []
    );

  const unread =
    notifications.filter(
      (n) => !n.read
    ).length;

  const stats =
    useMemo(() => {
      return {
        satisfaction:
          feedback.length === 0
            ? 0
            : Math.round(
                (
                  feedback.reduce(
                    (s, f) =>
                      s +
                      f.rating,
                    0
                  ) /
                  feedback.length
                ) *
                  10
              ) / 10,

        journeys:
          18 +
          feedback.length,
      };
    }, [feedback]);

  return {
    locale,
    setLocale,

    fontScale,
    setFontScale,

    highContrast,
    setHighContrast,

    palette,
    isRTL,
    displayName,
    speak,

    appointments,
    mergeAppointments,
    prescriptions,
    notifications,
    messages,
    intake,
    documents,
    feedback,

    bookingUnlocked,
    reminderIds,
    pendingFeedback,
    setPendingFeedback,

    unread,
    stats,

    sendUser,
    sendOption,
    resetChat,

    markNotification,
    setReminder,
    bookAppointment,
    addDocument,
    addPrescriptionFromScan,
    addFeedback,

    PATIENT,
  };
}

export function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value =
    useAppValue();

  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx =
    useContext(AppContext);

  if (!ctx) {
    throw new Error(
      'useApp must be used within AppProvider'
    );
  }

  return ctx;
}