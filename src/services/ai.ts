import type { ChatMessage, ChatOption, Locale } from '../types';

export function greeting(_locale: Locale): ChatMessage {
  return {
    id: `m-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    role: 'awn',
    textAr: 'مرحبًا، أنا عون. أقدر أساعدك في الاستفسارات الصحية العامة، حجز المواعيد، وشرح التقارير الطبية بلغة بسيطة. لا أشخص الأمراض ولا أصف العلاج.',
    textEn: 'Hello, I am Awn. I can help with general health inquiries, booking appointments, and explaining medical reports in simple language. I do not diagnose or prescribe treatment.',
    actions: [
      { id: 'a1', kind: 'intent', intent: 'book_appointment', labelAr: 'أريد حجز موعد', labelEn: 'I want to book an appointment' },
      { id: 'a2', kind: 'navigate', href: '/(beneficiary)/explain', labelAr: 'شرح تقرير طبي', labelEn: 'Explain a medical report' },
      { id: 'a3', kind: 'navigate', href: '/(beneficiary)/appointments', labelAr: 'مواعيدي', labelEn: 'My appointments' },
    ],
  };
}

export function optionToUserText(option: ChatOption, locale: Locale) {
  return locale === 'ar' ? option.labelAr : option.labelEn;
}
