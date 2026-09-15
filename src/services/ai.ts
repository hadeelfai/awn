import { PATIENT } from '../data/seed';
import type { Appointment, ChatAction, ChatMessage, ChatOption, IntakeState, Locale, Priority, SpecialistRequest } from '../types';

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
  createRequest?: Omit<SpecialistRequest, 'id' | 'createdAt' | 'status' | 'patientId' | 'patientNameAr' | 'patientNameEn'>;
  showAppointments?: boolean;
};

export function greeting(locale: Locale): ChatMessage {
  return msg({
    role: 'aoun',
    textAr: 'مرحبًا، أنا عون. أقدر أساعدك في الإجراءات، المواعيد، الوصفات، وشرح المعلومات الصحية بلغة بسيطة. لا أشخص الأمراض ولا أصف العلاج.',
    textEn: 'Hello, I am Aoun. I can help with procedures, appointments, prescriptions, and simple explanations. I do not diagnose or prescribe treatment.',
    actions: [
      { id: 'a1', kind: 'intent', intent: 'specialty', labelAr: 'ما أعرف أي تخصص أحتاج', labelEn: "I don't know which specialty I need" },
      { id: 'a2', kind: 'intent', intent: 'prep', labelAr: 'كيف أستعد لموعدي؟', labelEn: 'How do I prepare for my visit?' },
      { id: 'a3', kind: 'navigate', href: '/(beneficiary)/guide/medications', labelAr: 'صرف وصفة', labelEn: 'Fill a prescription' },
    ],
  });
}

function refuseMedical(): ChatMessage {
  return msg({
    role: 'aoun',
    textAr:
      'هذا السؤال يحتاج حكمًا طبيًا. لا أستطيع التشخيص أو تغيير الجرعة أو اقتراح خطة علاج. يمكنني تنظيم معلوماتك وإرسالها إلى مختص لمراجعتها واعتمادها.',
    textEn:
      'This needs medical judgment. I cannot diagnose, change a dose, or recommend a treatment plan. I can organize your information and send it to a specialist for review and approval.',
    disclaimer: true,
    actions: [
      { id: 'spec', kind: 'create_request', labelAr: 'إرسال لمختص', labelEn: 'Send to a specialist' },
    ],
  });
}

export function respond(input: string, intake: IntakeState, appointments: Appointment[]): AIResult {
  const n = norm(input);

  if (intake.step > 0 && intake.step < 4) {
    return continueIntake(n, intake, input);
  }

  if (/(شخص|مرض عندي|عندي مرض|diagnose|do i have|is this cancer|جرعه|dosage|علاج لي|prescribe|treatment plan|ارسل لمختص|send to a specialist)/.test(n)) {
    if (/(ارسل لمختص|send to a specialist)/.test(n)) {
      return {
        createRequest: {
          type: 'medical_question',
          priority: 'routine',
          originalText: input,
          reasonAr: 'المستفيد طلب مراجعة مختص لسؤال يحتاج حكمًا طبيًا.',
          reasonEn: 'The beneficiary asked a specialist to review a question that needs medical judgment.',
          providedAr: ['طلب تحويل لمختص من المحادثة.'],
          providedEn: ['Escalation requested from the conversation.'],
          missingAr: ['تفاصيل سريرية يضيفها المختص عند الحاجة.'],
          missingEn: ['Clinical details the specialist may still request.'],
          aiNextStepAr: 'مراجعة المختص ثم الرد على المستفيد.',
          aiNextStepEn: 'Specialist review, then a response to the beneficiary.',
        },
        reply: msg({
          role: 'aoun',
          textAr: 'تم تجهيز الطلب وإرساله إلى مختص. لن أقدّم تشخيصًا أو قرار علاج.',
          textEn: 'The request was prepared and sent to a specialist. I will not provide a diagnosis or treatment decision.',
          disclaimer: true,
        }),
      };
    }
    return { reply: refuseMedical() };
  }

  if (/(ما اعرف|ما ادري|اي تخصص|which specialty|don't know which|dont know which|مو عارف)/.test(n)) {
    return startIntake();
  }

  if (/(غير موعد|اغير موعد|تغيير موعد|reschedule|change (my )?appointment)/.test(n)) {
    const upcoming = appointments.filter((a) => a.status === 'upcoming' || a.status === 'updated');
    if (upcoming.length === 0) {
      return {
        reply: msg({
          role: 'aoun',
          textAr: 'ما لقيت موعدًا قادمًا مرتبطًا بحسابك. هل تريد طلب موعد جديد؟ هذا قد يحتاج مراجعة مختص إذا لم تحدد الخدمة.',
          textEn: 'I could not find an upcoming appointment on your account. Do you want to request a new visit? That may need specialist review if the service is unclear.',
        }),
      };
    }
    return {
      showAppointments: true,
      reply: msg({
        role: 'aoun',
        textAr: 'أكيد. أي موعد ترغب في تغييره؟ اختر من مواعيدك القادمة — لن أغيّر الموعد مباشرة قبل المراجعة الإدارية.',
        textEn: 'Of course. Which appointment would you like to change? Choose from your upcoming visits — I will not change it until administrative review.',
        appointmentIds: upcoming.map((a) => a.id),
        actions: [{ id: 'apps', kind: 'show_appointments', labelAr: 'فتح مواعيدي', labelEn: 'Open My Appointments' }],
      }),
    };
  }

  if (/(استعد|تحضير|prep|prepare)/.test(n)) {
    const next = appointments.find((a) => a.status === 'upcoming' || a.status === 'updated');
    return {
      reply: msg({
        role: 'aoun',
        textAr: next
          ? `أكيد، أقدر أساعدك بمعرفة التحضيرات المرتبطة بموعدك في ${next.facilityAr} يوم ${next.date} الساعة ${next.time}.`
          : 'أكيد، أقدر أساعدك بمعرفة التحضيرات المرتبطة بموعدك عندما يتوفر موعد قادم.',
        textEn: next
          ? `I can show the preparations for your visit at ${next.facilityEn} on ${next.date} at ${next.time}.`
          : 'I can show preparations when you have an upcoming visit.',
        appointmentIds: next ? [next.id] : undefined,
        actions: next
          ? [{ id: 'prep', kind: 'navigate', href: `/(beneficiary)/guide/appointment/${next.id}`, labelAr: 'عرض التحضيرات', labelEn: 'View preparations' }]
          : undefined,
      }),
    };
  }

  if (/(وصفه|صرف|صيدلي|prescription|pharmacy|medication|دواء)/.test(n)) {
    return {
      reply: msg({
        role: 'aoun',
        textAr: 'تمام. لصرف الوصفة أو معرفة المنشآت القريبة انتقل إلى وجّهني ← الأدوية والوصفات. بيانات التوفّر في الخريطة تجريبية للعرض.',
        textEn: 'For filling a prescription or nearby facilities, go to Guide Me → Medications. Map availability is demo data.',
        actions: [
          { id: 'meds', kind: 'navigate', href: '/(beneficiary)/guide/medications', labelAr: 'الأدوية والوصفات', labelEn: 'Medications & prescriptions' },
          { id: 'map', kind: 'navigate', href: '/(beneficiary)/guide/map', labelAr: 'الخريطة', labelEn: 'Map' },
        ],
      }),
    };
  }

  if (/(تحليل|نتيجه|تقرير|hemoglobin|lab result|explain|فهمني|وش معنى)/.test(n)) {
    return {
      reply: msg({
        role: 'aoun',
        textAr: 'أقدر أشرح التقرير أو النتيجة بلغة مبسطة في قسم فهمني، بدون تشخيص. إذا احتجت حكمًا طبيًا سأحوّل الطلب لمختص.',
        textEn: 'I can explain a report in simple language in Explain to Me, without diagnosing. If you need medical judgment I will send a specialist request.',
        actions: [{ id: 'ex', kind: 'navigate', href: '/(beneficiary)/explain', labelAr: 'فتح فهمني', labelEn: 'Open Explain to Me' }],
      }),
    };
  }

  if (/(المواعيد|appointments)/.test(n) && !/(غير|change|اغير)/.test(n)) {
    return {
      reply: msg({
        role: 'aoun',
        textAr: 'يمكنك متابعة مواعيدك وتحضيراتك من وجّهني.',
        textEn: 'You can follow appointments and preparations from Guide Me.',
        actions: [{ id: 'ap', kind: 'navigate', href: '/(beneficiary)/guide/appointments', labelAr: 'مواعيدي', labelEn: 'My appointments' }],
      }),
    };
  }

  if (/(موعد جديد|احجز|book|appointment)/.test(n) && !/(غير|change)/.test(n)) {
    return {
      reply: msg({
        role: 'aoun',
        textAr: 'إذا كنت تعرف الخدمة المطلوبة يمكن المتابعة للحجز الإداري. إذا لم تعرف التخصص المناسب سأسألك أسئلة ثم أرسل الملخص لمختص — أنا لا أقرر التخصص نيابة عن الطبيب.',
        textEn: 'If you already know the service, we can continue with administrative booking. If the specialty is unclear I will ask questions and send a summary to a specialist — I do not decide the specialty.',
        actions: [
          { id: 'book', kind: 'navigate', href: '/(beneficiary)/guide/book', labelAr: 'أعرف الخدمة — متابعة الحجز', labelEn: 'I know the service — book' },
          { id: 'spec', kind: 'intent', intent: 'specialty', labelAr: 'ما أعرف التخصص', labelEn: "I don't know the specialty" },
        ],
      }),
    };
  }

  if (n.length < 4) {
    return {
      reply: msg({
        role: 'aoun',
        textAr: 'أقدر أساعدك، لكن أحتاج جملة أوضح: هل تقصد موعدًا، وصفة، أم شرح نتيجة؟',
        textEn: 'I can help, but I need a clearer request: is this about an appointment, a prescription, or explaining a result?',
      }),
    };
  }

  return {
    reply: msg({
      role: 'aoun',
      textAr: 'أقدر أساعدك في الإجراءات والتوجيه وشرح المعلومات. هل تقصد مواعيدك، صرف دواء، فهم تقرير، أم أنك غير متأكد من الخدمة المناسبة؟',
      textEn: 'I can help with procedures, guidance, and explanations. Do you mean appointments, dispensing medication, understanding a report, or are you unsure which service you need?',
      options: [
        { id: 'apps', labelAr: 'المواعيد', labelEn: 'Appointments' },
        { id: 'rx', labelAr: 'الأدوية', labelEn: 'Medications' },
        { id: 'ex', labelAr: 'شرح تقرير', labelEn: 'Explain a report' },
        { id: 'unk', labelAr: 'غير متأكد من التخصص', labelEn: 'Unsure about specialty' },
      ],
    }),
  };
}

export function startIntake(): AIResult {
  return {
    intake: { step: 1 },
    reply: msg({
      role: 'aoun',
      textAr: 'أكيد، خلينا نحدد احتياجك بأسئلة قصيرة. أين موضع الإزعاج أو الاستفسار؟ هذه الأسئلة لتنظيم الطلب وليست تشخيصًا.',
      textEn: 'Sure — a few short questions to understand your need. Where is the concern? This is to organize the request, not to diagnose.',
      options: specialtyOptions,
    }),
  };
}

function continueIntake(n: string, intake: IntakeState, raw: string): AIResult {
  if (intake.step === 1) {
    const area = matchOption(n, specialtyOptions) || raw;
    return {
      intake: { ...intake, area, step: 2 },
      reply: msg({
        role: 'aoun',
        textAr: 'شكرًا. منذ متى وهذا الأمر موجود تقريبًا؟',
        textEn: 'Thank you. About how long has this been going on?',
        options: durationOptions,
      }),
    };
  }
  if (intake.step === 2) {
    const duration = matchOption(n, durationOptions) || raw;
    return {
      intake: { ...intake, duration, step: 3 },
      reply: msg({
        role: 'aoun',
        textAr: 'هل تصف الأمر بأنه شديد أو مفاجئ، أو تحتاج مراجعة قريبًا، أو استشارة غير مستعجلة؟',
        textEn: 'Would you describe this as severe/sudden, needed soon, or a non-urgent consultation?',
        options: urgencyOptions,
      }),
    };
  }
  const urgency = (['urgent', 'soon', 'routine'].find((k) => n.includes(k)) as Priority | undefined) || inferUrgency(n);
  if (urgency === 'urgent') {
    return {
      intake: { step: 0 },
      reply: msg({
        role: 'aoun',
        textAr:
          'إذا كانت الأعراض شديدة أو مفاجئة، لا تعتمد على التطبيق. توجّه للطوارئ أو اتصل بـ 937. بعد أن تكون بأمان يمكنني المساعدة في الإجراءات غير الإسعافية.',
        textEn:
          'If symptoms are severe or sudden, do not rely on the app. Go to emergency care or call 937. After you are safe, I can help with non-emergency procedures.',
        disclaimer: true,
      }),
    };
  }
  const area = intake.area || 'غير محدد';
  const duration = intake.duration || 'غير محدد';
  return {
    intake: { area, duration, urgency, step: 4 },
    createRequest: {
      type: 'specialty_guidance',
      priority: urgency,
      originalText: `منطقة: ${area}. المدة: ${duration}. الاستعجال: ${urgency}.`,
      reasonAr: 'المستفيد لا يعرف التخصص المناسب ويحتاج توجيهًا مهنيًا.',
      reasonEn: 'The beneficiary does not know the appropriate specialty and needs professional guidance.',
      providedAr: [`موضع الاهتمام: ${area}`, `المدة التقريبية: ${duration}`, 'المستفيد طلب المساعدة في اختيار الخدمة.'],
      providedEn: [`Area of concern: ${area}`, `Approximate duration: ${duration}`, 'The beneficiary asked for help choosing a service.'],
      missingAr: ['فحص سريري وتاريخ طبي كامل — لا يستطيع عون استكماله.'],
      missingEn: ['Clinical exam and full history — Aoun cannot complete these.'],
      aiNextStepAr: 'مراجعة مختص لاعتماد التخصص المناسب ثم إتاحة الحجز الإداري.',
      aiNextStepEn: 'Specialist review to approve an appropriate service, then administrative booking.',
    },
    reply: msg({
      role: 'aoun',
      textAr: `هذا الطلب يحتاج مراجعة مختص لأن اختيار التخصص قرار مهني. نظّمت إجاباتك وأرسلتها للمراجعة:\n• الموضع: ${area}\n• المدة: ${duration}\n• الاستعجال: غير إسعافي\nلن أحجز أو أحدد العيادة قبل اعتماد المختص.`,
      textEn: `This needs specialist review because choosing a specialty is a professional decision. I organized your answers:\n• Area: ${area}\n• Duration: ${duration}\n• Urgency: non-emergency\nI will not book or assign a clinic before specialist approval.`,
      disclaimer: true,
    }),
  };
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

export function makeRequestPayload(
  draft: NonNullable<AIResult['createRequest']>
): Omit<SpecialistRequest, 'id' | 'createdAt' | 'status'> {
  return {
    ...draft,
    patientId: PATIENT.id,
    patientNameAr: PATIENT.nameAr,
    patientNameEn: PATIENT.nameEn,
  };
}

export const navActions: ChatAction[] = [];
