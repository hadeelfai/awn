import type { Appointment, ChatAction, ChatMessage, ChatOption, ExplainedDocument, IntakeState, Locale, Priority } from '../types';

const uid = () => `m-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

export const nowIso = () => new Date().toISOString();

const msg = (partial: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => ({
  id: uid(),
  createdAt: nowIso(),
  ...partial,
});

const norm = (text: string) =>
  text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[؟?!.,،]/g, ' ')
    .trim();

export const voiceDemos = [
  { id: 'v1', ar: 'ما أعرف أي تخصص أحتاج.', en: "I don't know which specialty I need." },
  { id: 'v2', ar: 'أبغى أعرف كيف أستعد لموعدي.', en: 'I want to know how to prepare for my appointment.' },
  { id: 'v3', ar: 'عندي وصفة وأبغى أعرف وين أقدر أصرفها.', en: 'I have a prescription and want to know where I can fill it.' },
  { id: 'v4', ar: 'وش معنى نتيجة التحليل هذه؟', en: 'What does this lab result mean?' },
  { id: 'v5', ar: 'أبغى أغير موعدي.', en: 'I want to change my appointment.' },
];

const specialtyOptions: ChatOption[] = [
  { id: 'head', labelAr: 'الرأس أو الأذن أو الحلق', labelEn: 'Head, ear, or throat' },
  { id: 'chest', labelAr: 'الصدر أو التنفس', labelEn: 'Chest or breathing' },
  { id: 'abdomen', labelAr: 'البطن أو الهضم', labelEn: 'Abdomen or digestion' },
  { id: 'joints', labelAr: 'المفاصل أو العضلات', labelEn: 'Joints or muscles' },
  { id: 'skin', labelAr: 'الجلد', labelEn: 'Skin' },
  { id: 'other', labelAr: 'أمر آخر / غير متأكد', labelEn: 'Something else / not sure' },
];

const durationOptions: ChatOption[] = [
  { id: 'days', labelAr: 'منذ أيام', labelEn: 'For a few days' },
  { id: 'weeks', labelAr: 'منذ أسابيع', labelEn: 'For weeks' },
  { id: 'months', labelAr: 'منذ أشهر أو أكثر', labelEn: 'For months or longer' },
];

const urgencyOptions: ChatOption[] = [
  { id: 'urgent', labelAr: 'أعراض شديدة أو مفاجئة', labelEn: 'Severe or sudden symptoms' },
  { id: 'soon', labelAr: 'أحتاج مراجعة قريبًا', labelEn: 'I need to be seen soon' },
  { id: 'routine', labelAr: 'استشارة غير مستعجلة', labelEn: 'A non-urgent consultation' },
];

export type AIResult = {
  reply: ChatMessage;
  intake?: IntakeState;
  showAppointments?: boolean;
  suggestedAppointment?: Appointment;
  createDocument?: ExplainedDocument;
};

export function greeting(locale: Locale): ChatMessage {
  return msg({
    role: 'awn',
    textAr: 'مرحبًا، أنا عون. أقدر أساعدك في الاستفسارات الصحية العامة، حجز المواعيد، وشرح التقارير الطبية بلغة بسيطة. لا أشخص الأمراض ولا أصف العلاج.',
    textEn: 'Hello, I am Awn. I can help with general health inquiries, booking appointments, and explaining medical reports in simple language. I do not diagnose or prescribe treatment.',
    actions: [
      { id: 'a1', kind: 'intent', intent: 'book_appointment', labelAr: 'أريد حجز موعد', labelEn: 'I want to book an appointment' },
      { id: 'a2', kind: 'navigate', href: '/(beneficiary)/explain', labelAr: 'شرح تقرير طبي', labelEn: 'Explain a medical report' },
      { id: 'a3', kind: 'navigate', href: '/(beneficiary)/appointments', labelAr: 'مواعيدي', labelEn: 'My appointments' },
    ],
  });
}

export function respond(input: string, intake: IntakeState, appointments: Appointment[]): AIResult {
  const n = norm(input);

  if (intake.step > 0 && intake.step < 5) {
    return continueIntake(n, intake, input);
  }

  // Handle appointment booking requests
  if (/(احجز|موعد جديد|book appointment|new appointment|حجز موعد|need appointment)/.test(n)) {
    return startAppointmentIntake();
  }

  // Handle report upload/explanation requests
  if (/(شرح تقرير|تحليل|نتيجة|explain report|lab result|upload report|رفع تقرير)/.test(n)) {
    return {
      reply: msg({
        role: 'awn',
        textAr: 'يمكنك رفع تقريرك الطبي وسأشرحه لك بلغة بسيطة. اضغط على زر الرفع أدناه.',
        textEn: 'You can upload your medical report and I will explain it in simple language. Click the upload button below.',
        actions: [
          { id: 'upload', kind: 'upload_report', labelAr: 'رفع تقرير', labelEn: 'Upload report' },
        ],
      }),
    };
  }

  // Handle general health inquiries
  if (/(ألم|pain|صداع|headache|حرارة|fever|سعال|cough|دوخة|dizziness|تعب|fatigue)/.test(n)) {
    return handleHealthInquiry(n);
  }

  // Handle appointment viewing
  if (/(مواعيدي|appointments|مواعيد)/.test(n)) {
    return {
      showAppointments: true,
      reply: msg({
        role: 'awn',
        textAr: 'إليك مواعيدك الحالية:',
        textEn: 'Here are your current appointments:',
        appointmentIds: appointments.map((a) => a.id),
        actions: [{ id: 'apps', kind: 'navigate', href: '/(beneficiary)/appointments', labelAr: 'عرض المواعيد', labelEn: 'View appointments' }],
      }),
    };
  }

  // Handle appointment preparation
  if (/(استعد|تحضير|prepare|preparation)/.test(n)) {
    const next = appointments.find((a) => a.status === 'upcoming' || a.status === 'updated');
    return {
      reply: msg({
        role: 'awn',
        textAr: next
          ? `إليك التحضيرات لموعدك في ${next.facilityAr} يوم ${next.date} الساعة ${next.time}.`
          : 'ليس لديك موعد قادم حاليًا.',
        textEn: next
          ? `Here are the preparations for your appointment at ${next.facilityEn} on ${next.date} at ${next.time}.`
          : 'You do not have an upcoming appointment currently.',
        appointmentIds: next ? [next.id] : undefined,
        actions: next
          ? [{ id: 'view', kind: 'navigate', href: `/(beneficiary)/appointment/${next.id}`, labelAr: 'عرض التفاصيل', labelEn: 'View details' }]
          : undefined,
      }),
    };
  }

  // Default response for general inquiries
  if (n.length < 4) {
    return {
      reply: msg({
        role: 'awn',
        textAr: 'أقدر أساعدك في الاستفسارات الصحية وحجز المواعيد وشرح التقارير. كيف يمكنني مساعدتك؟',
        textEn: 'I can help with health inquiries, booking appointments, and explaining reports. How can I help you?',
        options: [
          { id: 'book', labelAr: 'حجز موعد', labelEn: 'Book appointment' },
          { id: 'report', labelAr: 'شرح تقرير', labelEn: 'Explain report' },
          { id: 'health', labelAr: 'استفسار صحي', labelEn: 'Health inquiry' },
        ],
      }),
    };
  }

  return {
    reply: msg({
      role: 'awn',
      textAr: 'أقدر مساعدتك في هذا الاستفسار. هل تريد حجز موعد لهذه المشكلة، أم تحتاج معلومات عامة؟',
      textEn: 'I can help you with this inquiry. Would you like to book an appointment for this issue, or do you need general information?',
      options: [
        { id: 'book', labelAr: 'حجز موعد', labelEn: 'Book appointment' },
        { id: 'info', labelAr: 'معلومات عامة', labelEn: 'General information' },
      ],
    }),
  };
}

export function startIntake(): AIResult {
  return {
    intake: { step: 1 },
    reply: msg({
      role: 'awn',
      textAr: 'أكيد، خلينا نحدد احتياجك بأسئلة قصيرة. أين موضع الإزعاج أو الاستفسار؟ هذه الأسئلة لتنظيم الطلب وليست تشخيصًا.',
      textEn: 'Sure — a few short questions to understand your need. Where is the concern? This is to organize the request, not to diagnose.',
      options: specialtyOptions,
    }),
  };
}

export function startAppointmentIntake(): AIResult {
  return {
    intake: { step: 1 },
    reply: msg({
      role: 'awn',
      textAr: 'سأساعدك في حجز الموعد المناسب. أولاً، ما هو التخصص الطبي الذي تحتاجه؟',
      textEn: 'I will help you book the appropriate appointment. First, what medical specialty do you need?',
      options: [
        { id: 'family', labelAr: 'طب الأسرة', labelEn: 'Family medicine' },
        { id: 'internal', labelAr: 'الباطنة', labelEn: 'Internal medicine' },
        { id: 'pediatrics', labelAr: 'طب الأطفال', labelEn: 'Pediatrics' },
        { id: 'dermatology', labelAr: 'الجلدية', labelEn: 'Dermatology' },
        { id: 'orthopedics', labelAr: 'العظام', labelEn: 'Orthopedics' },
        { id: 'other', labelAr: 'تخصص آخر', labelEn: 'Other specialty' },
      ],
    }),
  };
}

function handleHealthInquiry(n: string): AIResult {
  const symptoms = extractSymptoms(n);
  const suggestedSpecialty = suggestSpecialty(symptoms);
  
  return {
    reply: msg({
      role: 'awn',
      textAr: `بناءً على الأعراض التي ذكرتها، قد يكون التخصص المناسب هو ${suggestedSpecialty.ar}. هل تريد أن أساعدك في حجز موعد؟`,
      textEn: `Based on the symptoms you mentioned, the appropriate specialty might be ${suggestedSpecialty.en}. Would you like me to help you book an appointment?`,
      disclaimer: true,
      actions: [
        { id: 'book', kind: 'intent', intent: 'book_appointment', labelAr: 'نعم، احجز موعد', labelEn: 'Yes, book appointment' },
        { id: 'info', kind: 'intent', intent: 'general_info', labelAr: 'معلومات عامة فقط', labelEn: 'General information only' },
      ],
    }),
  };
}

function extractSymptoms(text: string): string[] {
  const symptoms: string[] = [];
  if (/(ألم|pain)/.test(text)) symptoms.push('pain');
  if (/(صداع|headache)/.test(text)) symptoms.push('headache');
  if (/(حرارة|fever)/.test(text)) symptoms.push('fever');
  if (/(سعال|cough)/.test(text)) symptoms.push('cough');
  if (/(دوخة|dizziness)/.test(text)) symptoms.push('dizziness');
  if (/(تعب|fatigue)/.test(text)) symptoms.push('fatigue');
  return symptoms;
}

function suggestSpecialty(symptoms: string[]): { ar: string; en: string } {
  if (symptoms.includes('headache') || symptoms.includes('dizziness')) {
    return { ar: 'طب الأسرة أو الباطنة', en: 'Family medicine or Internal medicine' };
  }
  if (symptoms.includes('cough') || symptoms.includes('fever')) {
    return { ar: 'طب الأسرة أو الباطنة', en: 'Family medicine or Internal medicine' };
  }
  if (symptoms.includes('pain')) {
    return { ar: 'طب الأسرة', en: 'Family medicine' };
  }
  return { ar: 'طب الأسرة', en: 'Family medicine' };
}

function continueIntake(n: string, intake: IntakeState, raw: string): AIResult {
  // Step 1: Ask for specialty
  if (intake.step === 1) {
    const specialty = matchSpecialty(n) || raw;
    return {
      intake: { ...intake, area: specialty, step: 2 },
      reply: msg({
        role: 'awn',
        textAr: 'ممتاز. متى تفضل الموعد؟ اليوم، غدًا، أم تاريخ محدد؟',
        textEn: 'Excellent. When would you prefer the appointment? Today, tomorrow, or a specific date?',
        options: [
          { id: 'today', labelAr: 'اليوم', labelEn: 'Today' },
          { id: 'tomorrow', labelAr: 'غدًا', labelEn: 'Tomorrow' },
          { id: 'week', labelAr: 'هذا الأسبوع', labelEn: 'This week' },
          { id: 'specific', labelAr: 'تاريخ محدد', labelEn: 'Specific date' },
        ],
      }),
    };
  }
  
  // Step 2: Ask for preferred time
  if (intake.step === 2) {
    const time = matchTime(n) || raw;
    return {
      intake: { ...intake, duration: time, step: 3 },
      reply: msg({
        role: 'awn',
        textAr: 'أي وقت تفضل؟ صباحًا أم مساءً؟',
        textEn: 'What time do you prefer? Morning or afternoon?',
        options: [
          { id: 'morning', labelAr: 'صباحًا', labelEn: 'Morning' },
          { id: 'afternoon', labelAr: 'مساءً', labelEn: 'Afternoon' },
          { id: 'evening', labelAr: 'مساءً متأخرًا', labelEn: 'Evening' },
        ],
      }),
    };
  }
  
  // Step 3: Ask for facility preference
  if (intake.step === 3) {
    const facility = matchFacility(n) || raw;
    return {
      intake: { ...intake, urgency: facility, step: 4 },
      reply: msg({
        role: 'awn',
        textAr: 'هل لديك تفضيل للمستشفى أو المركز الصحي؟',
        textEn: 'Do you have a preference for the hospital or health center?',
        options: [
          { id: 'nearest', labelAr: 'الأقرب لي', labelEn: 'Nearest to me' },
          { id: 'king', labelAr: 'مستشفى الملك عبدالعزيز', labelEn: 'King Abdulaziz Hospital' },
          { id: 'primary', labelAr: 'مركز الرعاية الأولية', labelEn: 'Primary care center' },
          { id: 'any', labelAr: 'أي مركز', labelEn: 'Any center' },
        ],
      }),
    };
  }
  
  // Step 4: Suggest appointment and ask for confirmation
  if (intake.step === 4) {
    const suggestedAppointment = generateSuggestedAppointment(intake);
    return {
      intake: { ...intake, step: 5 },
      suggestedAppointment,
      reply: msg({
        role: 'awn',
        textAr: `بناءً على تفضيلاتك، أقترح لك الموعد التالي:\n• التخصص: ${suggestedAppointment.specialtyAr}\n• التاريخ: ${suggestedAppointment.date}\n• الوقت: ${suggestedAppointment.time}\n• المكان: ${suggestedAppointment.facilityAr}\n\nهل تريد تأكيد الحجز؟`,
        textEn: `Based on your preferences, I suggest the following appointment:\n• Specialty: ${suggestedAppointment.specialtyEn}\n• Date: ${suggestedAppointment.date}\n• Time: ${suggestedAppointment.time}\n• Location: ${suggestedAppointment.facilityEn}\n\nWould you like to confirm the booking?`,
        suggestedAppointment,
        actions: [
          { id: 'confirm', kind: 'confirm_booking', labelAr: 'تأكيد الحجز', labelEn: 'Confirm booking' },
          { id: 'modify', kind: 'intent', intent: 'book_appointment', labelAr: 'تعديل التفضيلات', labelEn: 'Modify preferences' },
        ],
      }),
    };
  }
  
  // Step 5: Confirm booking
  if (intake.step === 5) {
    if (/(نعم|yes|تأكيد|confirm)/.test(n)) {
      const appointment = generateSuggestedAppointment(intake);
      return {
        intake: { step: 0 },
        suggestedAppointment: appointment,
        reply: msg({
          role: 'awn',
          textAr: `تم تأكيد حجز موعدك بنجاح!\n• التخصص: ${appointment.specialtyAr}\n• التاريخ: ${appointment.date}\n• الوقت: ${appointment.time}\n• المكان: ${appointment.facilityAr}\n\nيمكنك عرض التفاصيل والتحضيرات من صفحة المواعيد.`,
          textEn: `Your appointment has been successfully booked!\n• Specialty: ${appointment.specialtyEn}\n• Date: ${appointment.date}\n• Time: ${appointment.time}\n• Location: ${appointment.facilityEn}\n\nYou can view details and preparations from the Appointments page.`,
          suggestedAppointment: appointment,
          appointmentIds: [appointment.id],
          actions: [
            { id: 'view', kind: 'navigate', href: `/(beneficiary)/appointment/${appointment.id}`, labelAr: 'عرض التفاصيل', labelEn: 'View details' },
            { id: 'appointments', kind: 'navigate', href: '/(beneficiary)/appointments', labelAr: 'مواعيدي', labelEn: 'My appointments' },
          ],
        }),
      };
    }
    return {
      intake: { step: 0 },
      reply: msg({
        role: 'awn',
        textAr: 'تم إلغاء الحجز. يمكنك البدء من جديد إذا أردت.',
        textEn: 'Booking cancelled. You can start over if you would like.',
        actions: [
          { id: 'retry', kind: 'intent', intent: 'book_appointment', labelAr: 'حجز موعد جديد', labelEn: 'Book new appointment' },
        ],
      }),
    };
  }
  
  return {
    intake: { step: 0 },
    reply: msg({
      role: 'awn',
      textAr: 'حدث خطأ. هل تريد البدء من جديد؟',
      textEn: 'An error occurred. Would you like to start over?',
      actions: [
        { id: 'retry', kind: 'intent', intent: 'book_appointment', labelAr: 'حجز موعد جديد', labelEn: 'Book new appointment' },
      ],
    }),
  };
}

function matchSpecialty(n: string): string {
  const specialties: Record<string, string> = {
    'family': 'طب الأسرة',
    'internal': 'الباطنة',
    'pediatrics': 'طب الأطفال',
    'dermatology': 'الجلدية',
    'orthopedics': 'العظام',
  };
  for (const [key, value] of Object.entries(specialties)) {
    if (n.includes(key)) return value;
  }
  return 'طب الأسرة';
}

function matchTime(n: string): string {
  if (/(today|اليوم)/.test(n)) return 'today';
  if (/(tomorrow|غد)/.test(n)) return 'tomorrow';
  if (/(week|أسبوع)/.test(n)) return 'week';
  return 'today';
}

function matchFacility(n: string): string {
  if (/(nearest|أقرب)/.test(n)) return 'nearest';
  if (/(king|ملك)/.test(n)) return 'king';
  if (/(primary|رعاية)/.test(n)) return 'primary';
  return 'nearest';
}

function generateSuggestedAppointment(intake: IntakeState): Appointment {
  const specialty = intake.area || 'طب الأسرة';
  const date = generateDate(intake.duration);
  const time = generateTime(intake.duration);
  const facility = generateFacility(intake.urgency);
  
  return {
    id: `APT-${Date.now()}`,
    specialtyAr: specialty,
    specialtyEn: translateSpecialty(specialty),
    doctorAr: 'يُحدد عند الحضور',
    doctorEn: 'Assigned at check-in',
    facilityAr: facility.nameAr,
    facilityEn: facility.nameEn,
    locationAr: facility.locationAr,
    locationEn: facility.locationEn,
    date: date,
    time: time,
    status: 'upcoming',
    preparationAr: [
      'أحضر الهوية وبطاقة التأمين إن وجدت.',
      'أحضر قائمة أدويتك الحالية.',
      'وصل قبل الموعد بـ 15 دقيقة لإنهاء الإجراءات.',
    ],
    preparationEn: [
      'Bring your ID and insurance card if you have one.',
      'Bring a list of your current medications.',
      'Arrive 15 minutes early for check-in.',
    ],
  };
}

function generateDate(preference: string): string {
  const today = new Date();
  if (preference === 'tomorrow') {
    today.setDate(today.getDate() + 1);
  } else if (preference === 'week') {
    today.setDate(today.getDate() + 3);
  }
  return today.toISOString().split('T')[0];
}

function generateTime(preference: string): string {
  if (preference === 'morning') return '09:00';
  if (preference === 'afternoon') return '14:00';
  if (preference === 'evening') return '17:00';
  return '10:00';
}

function generateFacility(preference: string): { nameAr: string; nameEn: string; locationAr: string; locationEn: string } {
  if (preference === 'king') {
    return {
      nameAr: 'مستشفى الملك عبدالعزيز',
      nameEn: 'King Abdulaziz Hospital',
      locationAr: 'جدة — حي الشرفية',
      locationEn: 'Jeddah — Al Sharafiyah',
    };
  }
  if (preference === 'primary') {
    return {
      nameAr: 'مركز الرعاية الأولية — الروضة',
      nameEn: 'Primary care center — Al Rawdah',
      locationAr: 'جدة — حي الروضة',
      locationEn: 'Jeddah — Al Rawdah',
    };
  }
  return {
    nameAr: 'مركز الرعاية الأولية — الروضة',
    nameEn: 'Primary care center — Al Rawdah',
    locationAr: 'جدة — حي الروضة',
    locationEn: 'Jeddah — Al Rawdah',
  };
}

function translateSpecialty(ar: string): string {
  const translations: Record<string, string> = {
    'طب الأسرة': 'Family medicine',
    'الباطنة': 'Internal medicine',
    'طب الأطفال': 'Pediatrics',
    'الجلدية': 'Dermatology',
    'العظام': 'Orthopedics',
  };
  return translations[ar] || 'Family medicine';
}

function matchOption(n: string, options: ChatOption[]) {
  const hit = options.find((o) => n.includes(norm(o.id)) || n.includes(norm(o.labelAr)) || n.includes(norm(o.labelEn)));
  return hit?.id;
}

function inferUrgency(n: string): Priority {
  if (/(شديد|مفاجئ|طوارئ|urgent|emergency|severe)/.test(n)) return 'urgent';
  if (/(قريب|soon|سريع)/.test(n)) return 'soon';
  return 'routine';
}

export function optionToUserText(option: ChatOption, locale: Locale) {
  return locale === 'ar' ? option.labelAr : option.labelEn;
}

export const navActions: ChatAction[] = [];
