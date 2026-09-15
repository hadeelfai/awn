import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as Speech from 'expo-speech';
import { bookingSlots, demoLab, initialAppointments, initialNotifications, initialPrescriptions, initialRequests, PATIENT } from './data/seed';
import { colors, highContrastColors } from './theme';
import { greeting, makeRequestPayload, optionToUserText, respond, startIntake, type AIResult } from './services/ai';
import type {
  Appointment,
  AppNotification,
  ChatMessage,
  ChatOption,
  ExplainedDocument,
  FeedbackItem,
  IntakeState,
  Locale,
  Prescription,
  Role,
  SpecialistRequest,
} from './types';

type FontScale = 1 | 1.15 | 1.3;

type State = {
  locale: Locale;
  role: Role | null;
  fontScale: FontScale;
  highContrast: boolean;
  appointments: Appointment[];
  prescriptions: Prescription[];
  requests: SpecialistRequest[];
  notifications: AppNotification[];
  messages: ChatMessage[];
  intake: IntakeState;
  documents: ExplainedDocument[];
  feedback: FeedbackItem[];
  bookingUnlocked: boolean;
  reminderIds: string[];
};

const AppContext = createContext<ReturnType<typeof useAppValue> | null>(null);

function useAppValue() {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = l;
    }
  }, []);
  const [role, setRole] = useState<Role | null>(null);
  const [fontScale, setFontScale] = useState<FontScale>(1.15);
  const [highContrast, setHighContrast] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [requests, setRequests] = useState(initialRequests);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [messages, setMessages] = useState<ChatMessage[]>([greeting('ar')]);
  const [intake, setIntake] = useState<IntakeState>({ step: 0 });
  const [documents, setDocuments] = useState<ExplainedDocument[]>([demoLab]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([
    { id: 'F1', rating: 5, tags: ['clear'], createdAt: '2026-09-12', journey: 'explain' },
    { id: 'F2', rating: 4, tags: ['fast'], createdAt: '2026-09-13', journey: 'guide' },
    { id: 'F3', rating: 5, tags: ['helpful'], createdAt: '2026-09-14', journey: 'ask' },
  ]);
  const [bookingUnlocked, setBookingUnlocked] = useState(false);
  const [reminderIds, setReminderIds] = useState<string[]>(['APT-219']);
  const [pendingFeedback, setPendingFeedback] = useState<string | null>(null);

  const palette = highContrast ? highContrastColors : colors;
  const isRTL = locale === 'ar';
  const displayName = locale === 'ar' ? PATIENT.nameAr : PATIENT.nameEn;

  const speak = useCallback(
    (text: string) => {
      Speech.stop();
      Speech.speak(text, { language: locale === 'ar' ? 'ar-SA' : 'en-US', rate: 0.9 });
    },
    [locale]
  );

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      { ...n, id: `N-${Date.now()}`, createdAt: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const applyAI = useCallback(
    (result: AIResult) => {
      setMessages((prev) => [...prev, result.reply]);
      if (result.intake) setIntake(result.intake);
      if (result.createRequest) {
        const payload = makeRequestPayload(result.createRequest);
        const id = `REQ-${2400 + Math.floor(Math.random() * 80)}`;
        const request: SpecialistRequest = {
          ...payload,
          id,
          createdAt: new Date().toISOString(),
          status: 'new',
        };
        setRequests((prev) => [request, ...prev]);
        pushNotification({
          type: 'specialist_response',
          titleAr: 'تم إرسال طلبك إلى مختص',
          titleEn: 'Your request was sent to a specialist',
          bodyAr: 'عون لا يتخذ القرار الطبي. ستصلك نتيجة المراجعة هنا.',
          bodyEn: 'Aoun does not make the medical decision. You will see the review outcome here.',
          href: '/(beneficiary)/notifications',
        });
      }
    },
    [pushNotification]
  );

  const sendUser = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        textAr: text,
        textEn: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      const result = respond(text, intake, appointments);
      applyAI(result);
    },
    [applyAI, appointments, intake]
  );

  const sendOption = useCallback(
    (option: ChatOption) => {
      sendUser(optionToUserText(option, locale));
    },
    [locale, sendUser]
  );

  const resetChat = useCallback(() => {
    setIntake({ step: 0 });
    setMessages([greeting(locale)]);
  }, [locale]);

  const markNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const setReminder = useCallback((appointmentId: string) => {
    setReminderIds((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]));
    pushNotification({
      type: 'preparation',
      titleAr: 'تم تعيين تذكير للموعد',
      titleEn: 'Appointment reminder set',
      bodyAr: 'سنذكّرك بالتحضيرات والوقت قبل الزيارة.',
      bodyEn: 'We will remind you about time and preparations before the visit.',
      href: `/(beneficiary)/guide/appointment/${appointmentId}`,
    });
  }, [pushNotification]);

  const bookSlot = useCallback(
    (slotId: string) => {
      const slot = bookingSlots.find((s) => s.id === slotId);
      if (!slot) return;
      const apt: Appointment = {
        id: `APT-${Math.floor(Math.random() * 900 + 300)}`,
        specialtyAr: slot.serviceAr,
        specialtyEn: slot.serviceEn,
        doctorAr: 'يُحدد عند الحضور',
        doctorEn: 'Assigned at check-in',
        facilityAr: slot.facilityAr,
        facilityEn: slot.facilityEn,
        locationAr: slot.facilityAr,
        locationEn: slot.facilityEn,
        date: slot.date,
        time: slot.time,
        status: 'upcoming',
        preparationAr: ['أحضر الهوية.', 'وصل قبل الموعد بـ 15 دقيقة.'],
        preparationEn: ['Bring your ID.', 'Arrive 15 minutes early.'],
      };
      setAppointments((prev) => [apt, ...prev]);
      pushNotification({
        type: 'appointment_update',
        titleAr: 'تم تحديث مواعيدك',
        titleEn: 'Your appointments were updated',
        bodyAr: `أُضيف موعد ${slot.serviceAr} في ${slot.date} الساعة ${slot.time}. هل ترغب في الاطلاع على الموعد الجديد؟`,
        bodyEn: `${slot.serviceEn} was added on ${slot.date} at ${slot.time}. Would you like to view it?`,
        href: `/(beneficiary)/guide/appointment/${apt.id}`,
      });
      setPendingFeedback('booking');
      return apt.id;
    },
    [pushNotification]
  );

  const approveRequest = useCallback(
    (id: string, serviceAr?: string, serviceEn?: string) => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'approved' as const,
                approvedServiceAr: serviceAr || r.approvedServiceAr || 'طب الأسرة — موعد روتيني',
                approvedServiceEn: serviceEn || r.approvedServiceEn || 'Family medicine — routine visit',
              }
            : r
        )
      );
      const req = requests.find((r) => r.id === id);
      if (req?.patientId === PATIENT.id) {
        setBookingUnlocked(true);
        pushNotification({
          type: 'specialist_response',
          titleAr: 'تمت مراجعة طلبك',
          titleEn: 'Your request was reviewed',
          bodyAr: 'يمكنك الآن اختيار الموعد المناسب. عون لا يغني عن تعليمات المختص.',
          bodyEn: 'You can now choose a suitable appointment. Aoun does not replace specialist instructions.',
          href: '/(beneficiary)/guide/book',
        });
      }
    },
    [pushNotification, requests]
  );

  const modifyRequest = useCallback(
    (id: string, serviceAr: string, serviceEn: string) => {
      approveRequest(id, serviceAr, serviceEn);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'modified' } : r)));
    },
    [approveRequest]
  );

  const askMoreInfo = useCallback(
    (id: string, question: string) => {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'more_info', extraQuestion: question } : r)));
      const req = requests.find((r) => r.id === id);
      if (req?.patientId === PATIENT.id) {
        pushNotification({
          type: 'more_info',
          titleAr: 'المختص يحتاج معلومات إضافية',
          titleEn: 'The specialist needs more information',
          bodyAr: question,
          bodyEn: question,
          href: '/(beneficiary)/ask',
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'aoun',
            textAr: `المختص يطلب معلومات إضافية: ${question}\nيمكنك الرد هنا وسأعيد إرفاق الإجابة بالطلب.`,
            textEn: `The specialist asked: ${question}\nYou can reply here and I will attach your answer to the request.`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    },
    [pushNotification, requests]
  );

  const answerMoreInfo = useCallback((requestId: string, answer: string) => {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, extraAnswer: answer, status: 'pending' } : r)));
  }, []);

  const addDocument = useCallback((doc: ExplainedDocument) => {
    setDocuments((prev) => [doc, ...prev]);
    setPendingFeedback('explain');
  }, []);

  const addPrescriptionFromScan = useCallback((rx: Prescription) => {
    setPrescriptions((prev) => [rx, ...prev]);
  }, []);

  const addFeedback = useCallback((item: Omit<FeedbackItem, 'id' | 'createdAt'>) => {
    setFeedback((prev) => [
      { ...item, id: `F-${Date.now()}`, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setPendingFeedback(null);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;
  const stats = useMemo(() => {
    return {
      neu: requests.filter((r) => r.status === 'new').length,
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved' || r.status === 'modified').length,
      more: requests.filter((r) => r.status === 'more_info').length,
      satisfaction:
        feedback.length === 0 ? 0 : Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 10) / 10,
      journeys: 18 + feedback.length,
    };
  }, [feedback, requests]);

  return {
    locale,
    setLocale,
    role,
    setRole,
    fontScale,
    setFontScale,
    highContrast,
    setHighContrast,
    palette,
    isRTL,
    displayName,
    speak,
    appointments,
    prescriptions,
    requests,
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
    bookSlot,
    approveRequest,
    modifyRequest,
    askMoreInfo,
    answerMoreInfo,
    addDocument,
    addPrescriptionFromScan,
    addFeedback,
    PATIENT,
    bookingSlots,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useAppValue();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
