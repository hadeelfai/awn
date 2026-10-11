import * as Speech from 'expo-speech';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
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
} from './services/ai';

import { AWN_RAG_URL } from './config';
import { streamAsk } from './services/askStream';
import {
    loadSyncedData,
    deleteAppointmentRecord,
    deleteChatMessages,
    deleteReport,
    saveAppointment,
    saveChatMessage,
    saveReport,
} from './services/supabaseData';
import { colors, highContrastColors } from './theme';
import { isUpcomingAppointment } from './services/appointmentTime';

import type {
    AppNotification,
    Appointment,
    ChatMessage,
    ChatOption,
    ExplainedDocument,
    Locale,
    Prescription,
} from './types';

type FontScale = 1 | 1.15 | 1.3;

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

function createConversationId() {
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function languageForInquiry(text: string, fallback: Locale): Locale {
  const arabic = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return arabic === latin ? fallback : arabic > latin ? 'ar' : 'en';
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

  const activeConversationId = useRef(createConversationId());
  const [messages, setMessages] =
    useState<ChatMessage[]>([
      { ...greeting('ar'), conversationId: activeConversationId.current },
    ]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { ...greeting('ar'), conversationId: activeConversationId.current },
  ]);

  const [documents, setDocuments] =
    useState<ExplainedDocument[]>([
      demoLab,
    ]);

  const [bookingConversation, setBookingConversation] =
    useState({
      active: false,
      state: {} as Record<string, any>,
    });

  const [bookingNavigationPending, setBookingNavigationPending] =
    useState(false);

  useEffect(() => {
    let active = true;

    void loadSyncedData()
      .then((data) => {
        if (!active) return;

        setAppointments((current) => mergeById(current, data.appointments));
        setDocuments((current) => mergeById(current, data.reports));

        if (data.messages.length) {
          const lastMessage = data.messages[data.messages.length - 1];
          const conversationId = lastMessage.conversationId ?? 'legacy';
          activeConversationId.current = conversationId;
          setChatHistory(data.messages);
          setMessages(
            data.messages.filter(
              (message) => (message.conversationId ?? 'legacy') === conversationId
            )
          );
        }
      })
      .catch((error) => {
        console.warn('Supabase sync unavailable:', error);
      });

    return () => {
      active = false;
    };
  }, []);


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

  /*
   * REAL AWN BACKEND
   */
  const sendUser = useCallback(
    async (text: string) => {
      const conversationId = activeConversationId.current;
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        conversationId,
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
      setChatHistory((prev) => [...prev, userMsg]);
      void saveChatMessage(userMsg).catch((error) =>
        console.warn('Could not save chat message:', error)
      );

      // Handle booking conversation
      if (bookingConversation.active) {
        await continueBookingConversation(text);
        return;
      }

      const manageIntent = /\b(cancel|cancellation|reschedule)\b|\b(?:appointment|booking).{0,35}(?:change|edit|cancel|move)\b|\b(?:change|edit|cancel|move).{0,35}(?:appointment|booking)\b|إلغاء|الغاء|ألغ|الغِ|تعديل|تغيير|غيّر|غير|تأجيل|أجل/i.test(text);
      if (manageIntent) {
        const upcomingIds = appointments
          .filter((appointment) => isUpcomingAppointment(appointment))
          .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
          .map((appointment) => appointment.id);
        const awnMsg: ChatMessage = {
          id: `a-manage-${Date.now()}`,
          conversationId,
          role: 'awn',
          textAr: upcomingIds.length ? 'اختر الموعد الذي تريد تعديله أو إلغاءه. ستتمكن من مراجعة التغيير وتأكيده قبل حفظه.' : 'لا توجد مواعيد قادمة لإدارتها حالياً. يمكنك عرض جميع مواعيدك من صفحة مواعيدي.',
          textEn: upcomingIds.length ? 'Choose the appointment you want to edit or cancel. You can review and confirm the change before it is saved.' : 'There are no upcoming appointments to manage. You can view all appointments from My Appointments.',
          appointmentIds: upcomingIds,
          actions: upcomingIds.length ? [] : [{ id: 'open-appointments', kind: 'show_appointments', labelAr: 'مواعيدي', labelEn: 'My appointments' }],
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, awnMsg]);
        setChatHistory((prev) => [...prev, awnMsg]);
        void saveChatMessage(awnMsg).catch((error) => console.warn('Could not save chat reply:', error));
        return;
      }

      // Check for booking intent
      const bookingKeywords = [
        'حجز', 'book', 'موعد', 'appointment', 'زيارة', 'visit', 'احجز', 'reserve'
      ];
      const wantsToBook = bookingKeywords.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (wantsToBook && !bookingConversation.active) {
        await startBookingConversation(undefined, text);
        return;
      }

      try {
        const reply: ChatMessage = {
          id: `a-${Date.now()}`,
          conversationId,
          role: 'awn',
          textAr: '',
          textEn: '',
          sources: [],
          createdAt: new Date().toISOString(),
        };
        let replyText = '';
        let replySources: ChatMessage['sources'] = [];
        let replySaved = false;

        const syncReply = () => {
          if (activeConversationId.current !== conversationId) return;
          const nextReply = { ...reply, textAr: replyText, textEn: replyText, sources: replySources };
          setMessages((current) => current.some((item) => item.id === reply.id)
            ? current.map((item) => item.id === reply.id ? nextReply : item)
            : [...current, nextReply]);
          setChatHistory((current) => current.some((item) => item.id === reply.id)
            ? current.map((item) => item.id === reply.id ? nextReply : item)
            : [...current, nextReply]);
        };
        const saveReply = () => {
          if (replySaved || activeConversationId.current !== conversationId) return;
          replySaved = true;
          const finalReply = { ...reply, textAr: replyText, textEn: replyText, sources: replySources };
          void saveChatMessage(finalReply).catch((error) =>
            console.warn('Could not save chat reply:', error)
          );
        };

        try {
          const conversationContext = messages
            .filter((message) => message.role === 'user' || message.role === 'awn')
            .slice(-10)
            .map((message) => ({
              role: message.role as 'user' | 'awn',
              content: (message.textAr || message.textEn).slice(0, 1200),
            }))
            .filter((turn) => turn.content.trim().length > 0);

          await streamAsk(text, (event) => {
            if (event.type === 'meta') {
              replySources = event.sources;
              syncReply();
            } else if (event.type === 'delta') {
              replyText += event.text;
              syncReply();
            } else if (event.type === 'error') {
              replyText += replyText
                ? (locale === 'ar' ? '\n\nانقطع الاتصال قبل اكتمال الرد. حاول مرة أخرى.' : '\n\nThe response was interrupted. Please try again.')
                : (locale === 'ar' ? 'تعذر على Gemini إنشاء الرد الآن. حاول مرة أخرى بعد قليل.' : 'Gemini could not finish the response. Please try again shortly.');
              syncReply();
              saveReply();
            } else if (event.type === 'done') {
              syncReply();
              saveReply();
            }
          }, conversationContext);
        } catch (error) {
          if (!replyText) throw error;
          replyText += locale === 'ar'
            ? '\n\nانقطع الاتصال قبل اكتمال الرد. حاول مرة أخرى.'
            : '\n\nThe response was interrupted. Please try again.';
          syncReply();
          saveReply();
        }
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

        if (activeConversationId.current !== conversationId) return;

        const errorCode = error instanceof Error ? error.message : '';
        const failureMessages: Record<string, { ar: string; en: string }> = {
          gemini_unavailable: {
            ar: 'تعذر على Gemini إنشاء الرد الآن. تحقق من إعدادات GEMINI_MODEL أو حاول بعد قليل.',
            en: 'Gemini could not generate a reply. Check GEMINI_MODEL or try again shortly.',
          },
        };
        const failure = failureMessages[errorCode];
        const errorMsg: ChatMessage = {
          id: `a-error-${Date.now()}`,
          conversationId,
          role: 'awn',

          textAr:
            failure?.ar ?? 'تعذر الاتصال بعون حالياً. تحقق من اتصال الخادم وحاول مرة أخرى.',

          textEn:
            failure?.en ?? 'Could not connect to Awn. Check the server connection and try again.',

          createdAt:
            new Date().toISOString(),
        };

        setMessages(
          (prev) => [
            ...prev,
            errorMsg,
          ]
        );
        setChatHistory((prev) => [...prev, errorMsg]);
        void saveChatMessage(errorMsg).catch((saveError) =>
          console.warn('Could not save chat error:', saveError)
        );
      }
    },
    [appointments, bookingConversation.active, bookingConversation.state, locale, messages]
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

  const startBookingConversation = useCallback(
    async (specialty?: { specialtyAr: string; specialtyEn: string }, inquiry?: string) => {
      const responseLocale = languageForInquiry(inquiry ?? '', locale);
      setBookingConversation({
        active: true,
        state: {
          step: 'symptoms',
          specialty: specialty || null,
        },
      });

      const startMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        conversationId: activeConversationId.current,
        role: 'awn',
        textAr: responseLocale === 'ar'
          ? specialty
            ? `سأساعدك في حجز موعد مع تخصص ${specialty.specialtyAr}. ما هي الأعراض أو السبب الذي تدفعك للزيارة؟`
            : 'سأساعدك في حجز موعد طبي. ما هي الأعراض أو السبب الذي تدفعك للزيارة؟'
          : specialty
            ? `I'll help you book an appointment with ${specialty.specialtyEn}. What are your symptoms or reason for the visit?`
            : 'I\'ll help you book a medical appointment. What are your symptoms or reason for the visit?',
        textEn: responseLocale === 'en'
          ? specialty
            ? `I'll help you book an appointment with ${specialty.specialtyEn}. What are your symptoms or reason for the visit?`
            : 'I\'ll help you book a medical appointment. What are your symptoms or reason for the visit?'
          : specialty
            ? `سأساعدك في حجز موعد مع تخصص ${specialty.specialtyAr}. ما هي الأعراض أو السبب الذي تدفعك للزيارة؟`
            : 'سأساعدك في حجز موعد طبي. ما هي الأعراض أو السبب الذي تدفعك للزيارة؟',
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, startMsg]);
      setChatHistory((prev) => [...prev, startMsg]);
      void saveChatMessage(startMsg).catch((error) =>
        console.warn('Could not save booking start:', error)
      );
    },
    [locale]
  );

  const continueBookingConversation = useCallback(
    async (userMessage: string) => {
      const responseLocale = languageForInquiry(userMessage, locale);
      console.log('Continuing booking conversation, current state:', bookingConversation.state);

      try {
        const response = await fetch(
          `${AWN_RAG_URL}/booking-conversation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_message: userMessage,
              conversation_state: bookingConversation.state,
              language: responseLocale,
              history: messages
                .filter((message) => message.role === 'user' || message.role === 'awn')
                .slice(-10)
                .map((message) => ({
                  role: message.role as 'user' | 'awn',
                  content: (message.textAr || message.textEn).slice(0, 1200),
                }))
                .filter((turn) => turn.content.trim().length > 0),
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to process booking');
        }

        const result = await response.json();
        console.log('Booking conversation result:', result);

        const bookingState = result.state || bookingConversation.state;

        // Update conversation state
        setBookingConversation({
          active: !result.confirmed && !result.emergency,
          state: bookingState,
        });

        const replyMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          conversationId: activeConversationId.current,
          role: 'awn',
          textAr: result.response || '',
          textEn: result.response || '',
          createdAt: new Date().toISOString(),
        };

        // If user confirmed the booking, create the appointment
        if (result.confirmed && result.appointment) {
          const appointmentDate = result.appointment.date || bookingState.date;
          const appointmentTime = result.appointment.time || bookingState.time;
          const facilityAr = result.appointment.facility_ar || bookingState.facility_ar;
          const facilityEn = result.appointment.facility_en || bookingState.facility_en;

          if (!appointmentDate || !appointmentTime || !facilityAr || !facilityEn) {
            setBookingConversation({ active: true, state: bookingState });
            const missingDetailsNotice = responseLocale === 'ar'
              ? 'لا أستطيع حفظ الطلب بعد؛ أحتاج اسم المنشأة والتاريخ والوقت بشكل واضح.'
              : 'I can’t save the request yet. I still need a clear facility, date, and time.';
            replyMsg.textAr = missingDetailsNotice;
            replyMsg.textEn = missingDetailsNotice;
          } else {
            console.log('Patient confirmed appointment details:', result.appointment);
            bookAppointment({
              specialtyAr: bookingState.specialty_ar || result.appointment.specialty_ar || 'طب الأسرة',
              specialtyEn: bookingState.specialty_en || result.appointment.specialty_en || 'Family medicine',
              doctorAr: 'د. (يحدد لاحقاً)',
              doctorEn: 'Dr. (TBD)',
              facilityAr,
              facilityEn,
              locationAr: result.appointment.location_ar || bookingState.location_ar || bookingState.location || 'غير محدد',
              locationEn: result.appointment.location_en || bookingState.location_en || bookingState.location || 'Not specified',
              date: appointmentDate,
              time: appointmentTime,
              symptoms: bookingState.symptoms || '',
              bookingConversationId: activeConversationId.current,
              preparationAr: [],
              preparationEn: [],
              patientPreparationItems: (bookingState.patient_preparation_items || []).filter((item: unknown): item is string => typeof item === 'string'),
              notesAr: 'تم حفظ التفاصيل في التطبيق فقط. هذا النموذج لا يتصل بنظام المستشفى لتأكيد توفر الموعد؛ يرجى تأكيده عبر صحتي.',
              notesEn: 'Details are saved in this app only. This prototype does not connect to the hospital scheduling system; confirm availability in Sehhaty.',
            });
            setBookingNavigationPending(true);
            const savedNotice = responseLocale === 'ar'
              ? 'تم حفظ تفاصيل الموعد في صفحة مواعيدي. هذا النموذج لا يتصل بنظام المستشفى لحجز الفترة فعليًا؛ يرجى تأكيد التوفر عبر صحتي.'
              : 'The appointment details are saved in My Appointments. This prototype does not reserve a slot with the hospital; please confirm availability in Sehhaty.';
            replyMsg.textAr = savedNotice;
            replyMsg.textEn = savedNotice;

            replyMsg.actions = [
              {
                id: 'view-appointments',
                kind: 'show_appointments',
                labelAr: 'مواعيدي',
                labelEn: 'My appointments',
              },
            ];
          }
        } else if (result.complete) {
          // Show confirmation button
          const confirmationNotice = responseLocale === 'ar'
            
          replyMsg.textEn += confirmationNotice;
          replyMsg.actions = [
            {
              id: 'confirm-booking',
              kind: 'intent',
              intent: 'confirm_booking',
              labelAr: 'تأكيد الحجز',
              labelEn: 'Confirm booking',
            },
          ];
        }

        setMessages((prev) => [...prev, replyMsg]);
        setChatHistory((prev) => [...prev, replyMsg]);
        void saveChatMessage(replyMsg).catch((error) =>
          console.warn('Could not save booking reply:', error)
        );
      } catch (error) {
        console.log('Booking conversation failed:', error);
        setBookingConversation({
          active: false,
          state: {},
        });
      }
    },
    [bookingConversation.state, locale, messages]
  );

  const resetChat =
    useCallback(() => {
      const conversationId = createConversationId();
      activeConversationId.current = conversationId;
      setBookingConversation({ active: false, state: {} });
      setBookingNavigationPending(false);
      const welcomeMessage = {
        ...greeting(locale),
        conversationId,
      };
      setMessages([
        welcomeMessage,
      ]);
      setChatHistory((prev) => [...prev, welcomeMessage]);
      void saveChatMessage(welcomeMessage).catch((error) =>
        console.warn('Could not save new chat:', error)
      );
    }, [locale]);

  const consumeBookingNavigation = useCallback(() => {
    setBookingNavigationPending(false);
  }, []);

  const openChatConversation = useCallback((conversationId: string) => {
    activeConversationId.current = conversationId;
    setBookingConversation({ active: false, state: {} });
    setMessages(chatHistory.filter((message) =>
      (message.conversationId ?? 'legacy') === conversationId
    ));
  }, [chatHistory]);

  const removeChatConversation = useCallback(async (conversationId: string) => {
    const conversationMessages = chatHistory.filter((message) =>
      (message.conversationId ?? 'legacy') === conversationId
    );
    await deleteChatMessages(conversationMessages.map((message) => message.id));
    setChatHistory((prev) => prev.filter((message) =>
      (message.conversationId ?? 'legacy') !== conversationId
    ));
    if (activeConversationId.current === conversationId) {
      const nextId = createConversationId();
      activeConversationId.current = nextId;
      const welcomeMessage = { ...greeting(locale), conversationId: nextId };
      setMessages([welcomeMessage]);
      setChatHistory((prev) => [...prev, welcomeMessage]);
      void saveChatMessage(welcomeMessage).catch((error) =>
        console.warn('Could not save new chat:', error)
      );
    }
  }, [chatHistory, locale]);

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

        return apt.id;
      },
      []
    );

  const updateAppointment = useCallback(
    (id: string, changes: Partial<Pick<Appointment, 'date' | 'time'>>) => {
      const existing = appointments.find((appointment) => appointment.id === id);
      if (!existing) return false;
      const updated = { ...existing, ...changes, status: 'updated' as const };
      setAppointments((current) => current.map((appointment) => appointment.id === id ? updated : appointment));
      void saveAppointment(updated).catch((error) =>
        console.warn('Could not update appointment:', error)
      );
      return true;
    },
    [appointments]
  );

  const saveAppointmentPreparation = useCallback((id: string, language: Locale, preparation: NonNullable<Appointment['preparationByLanguage']>[Locale]) => {
    const existing = appointments.find((appointment) => appointment.id === id);
    if (!existing) return false;
    const updated = {
      ...existing,
      preparationByLanguage: {
        ...existing.preparationByLanguage,
        [language]: preparation,
      },
    };
    setAppointments((current) => current.map((appointment) => appointment.id === id ? updated : appointment));
    void saveAppointment(updated).catch((error) =>
      console.warn('Could not save appointment preparation:', error)
    );
    return true;
  }, [appointments]);

  const cancelAppointment = useCallback((id: string) => {
    const existing = appointments.find((appointment) => appointment.id === id);
    if (!existing) return false;
    const cancelled = { ...existing, status: 'cancelled' as const };
    setAppointments((current) => current.map((appointment) => appointment.id === id ? cancelled : appointment));
    void saveAppointment(cancelled).catch((error) =>
      console.warn('Could not cancel appointment:', error)
    );
    return true;
  }, [appointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    const existing = appointments.find((appointment) => appointment.id === id);
    if (!existing) return false;
    setAppointments((current) => current.filter((appointment) => appointment.id !== id));
    try {
      await deleteAppointmentRecord(id);
      return true;
    } catch (error) {
      setAppointments((current) => mergeById(current, [existing]));
      throw error;
    }
  }, [appointments]);

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

      },
      []
    );

  const updateDocument = useCallback((doc: ExplainedDocument) => {
    setDocuments((current) => current.map((item) => item.id === doc.id ? doc : item));
    void saveReport(doc).catch((error) =>
      console.warn('Could not update report:', error)
    );
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((current) => current.filter((item) => item.id !== id));
    void deleteReport(id).catch((error) =>
      console.warn('Could not delete report:', error)
    );
  }, []);

  const unread =
    notifications.filter(
      (n) => !n.read
    ).length;

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
    documents,

    unread,

    sendUser,
    sendOption,
    resetChat,
    chatHistory,
    openChatConversation,
    removeChatConversation,
    startBookingConversation,
    bookingNavigationPending,
    consumeBookingNavigation,

    markNotification,
    bookAppointment,
    updateAppointment,
    saveAppointmentPreparation,
    cancelAppointment,
    deleteAppointment,
    addDocument,
    updateDocument,
    removeDocument,

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
