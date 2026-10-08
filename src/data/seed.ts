import type { AppNotification, Appointment, ExplainedDocument, Prescription } from '../types';

export const PATIENT = {
  id: 'PAT-1001',
  nameAr: 'هديل الحارثي',
  nameEn: 'Hadeel Alharthi',
  cityAr: 'جدة',
  cityEn: 'Jeddah',
};

export const initialAppointments: Appointment[] = [
  {
    id: 'APT-219',
    specialtyAr: 'الباطنة',
    specialtyEn: 'Internal medicine',
    doctorAr: 'د. سارة القحطاني',
    doctorEn: 'Dr. Sarah Alqahtani',
    facilityAr: 'مستشفى الملك عبدالعزيز',
    facilityEn: 'King Abdulaziz Hospital',
    locationAr: 'جدة — حي الشرفية',
    locationEn: 'Jeddah — Al Sharafiyah',
    date: '2026-09-16',
    time: '10:00',
    status: 'upcoming',
    preparationAr: [
      'أحضر الهوية وتأكيد الموعد وقائمة أدويتك وتقاريرك ذات الصلة.',
      'اتبع تعليمات المنشأة لهذا الموعد؛ لا تصم أو توقف دواءً إلا بتوجيه من فريق الرعاية.',
    ],
    preparationEn: [
      'Bring your ID, appointment confirmation, medication list, and relevant reports.',
      'Follow the facility’s instructions; do not fast or stop medication unless your care team tells you to.',
    ],
  },
  {
    id: 'APT-188',
    specialtyAr: 'المختبر',
    specialtyEn: 'Laboratory',
    doctorAr: 'وحدة التحاليل',
    doctorEn: 'Lab unit',
    facilityAr: 'مركز الرعاية الأولية — الروضة',
    facilityEn: 'Primary care center — Al Rawdah',
    locationAr: 'جدة — حي الروضة',
    locationEn: 'Jeddah — Al Rawdah',
    date: '2026-09-10',
    time: '09:15',
    status: 'completed',
    hasPrescription: true,
    preparationAr: ['لا تحضير إضافي.'],
    preparationEn: ['No extra preparation.'],
    notesAr: 'اكتملت الزيارة وصدرت وصفة مرتبطة بها.',
    notesEn: 'Visit completed and a linked prescription was issued.',
  },
];

export const initialPrescriptions: Prescription[] = [
  {
    id: 'RX-77',
    medicationAr: 'أموكسيسيلين',
    medicationEn: 'Amoxicillin',
    dosage: '500 mg',
    frequencyAr: 'كبسولة — مرتين يوميًا',
    frequencyEn: 'Capsule — twice daily',
    instructionsAr: 'لمدة 7 أيام. كما هو مكتوب في الوصفة.',
    instructionsEn: 'For 7 days. Exactly as written on the prescription.',
    issuedAt: '2026-09-10',
    active: true,
    refillSoon: true,
    sourceAppointmentId: 'APT-188',
  },
  {
    id: 'RX-61',
    medicationAr: 'باراسيتامول',
    medicationEn: 'Paracetamol',
    dosage: '500 mg',
    frequencyAr: 'عند الحاجة — لا تتجاوز الجرعة المكتوبة',
    frequencyEn: 'As needed — do not exceed the written dose',
    instructionsAr: 'حسب تعليمات الوصفة فقط.',
    instructionsEn: 'Follow the prescription instructions only.',
    issuedAt: '2026-09-10',
    active: true,
    sourceAppointmentId: 'APT-188',
  },
  {
    id: 'RX-40',
    medicationAr: 'فيتامين د',
    medicationEn: 'Vitamin D',
    dosage: '50,000 IU',
    frequencyAr: 'أسبوعياً — وصفة سابقة',
    frequencyEn: 'Weekly — previous prescription',
    instructionsAr: 'انتهت مدة الصرف.',
    instructionsEn: 'Dispensing period ended.',
    issuedAt: '2026-06-02',
    active: false,
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'N-1',
    type: 'appointment_reminder',
    titleAr: 'موعدك غدًا الساعة 10:00 صباحًا',
    titleEn: 'You have an appointment tomorrow at 10:00 AM',
    bodyAr: 'موعد الباطنة في مستشفى الملك عبدالعزيز. هل ترغب في الاطلاع على التحضيرات المطلوبة؟',
    bodyEn: 'Internal medicine at King Abdulaziz Hospital. Would you like to review the required preparations?',
    createdAt: '2026-09-15T07:00:00',
    read: false,
    href: '/(beneficiary)/guide/appointment/APT-219',
  },
  {
    id: 'N-2',
    type: 'prescription_renewal',
    titleAr: 'اقترب موعد إعادة صرف أحد أدويتك',
    titleEn: 'A medication refill is coming up',
    bodyAr: 'هل ترغب في معرفة الخيارات المتاحة لصرف الوصفة؟ بيانات التوفّر تجريبية.',
    bodyEn: 'Would you like nearby pharmacy options? Availability is demo data.',
    createdAt: '2026-09-15T06:30:00',
    read: false,
    href: '/(beneficiary)/guide/medications',
  },
  {
    id: 'N-3',
    type: 'prescription_available',
    titleAr: 'وصفة مرتبطة بزيارتك الأخيرة',
    titleEn: 'A prescription from your last visit is available',
    bodyAr: 'يمكنك الاطلاع عليها أو البحث عن أقرب منشأة لصرفها.',
    bodyEn: 'You can view it or find a nearby facility to dispense it.',
    createdAt: '2026-09-10T12:00:00',
    read: true,
    href: '/(beneficiary)/guide/medications',
  },
];

export const demoLab: ExplainedDocument = {
  id: 'DOC-HEMO',
  titleAr: 'تحليل الدم — الهيموغلوبين',
  titleEn: 'Blood test — hemoglobin',
  kind: 'lab',
  originalName: 'lab-result.pdf',
  createdAt: '2026-09-10',
  findings: [
    {
      nameAr: 'الهيموغلوبين',
      nameEn: 'Hemoglobin',
      value: '10.2',
      unit: 'g/dL',
      simpleAr:
        'الهيموغلوبين بروتين في كريات الدم الحمراء يساعد على نقل الأكسجين. الرقم الظاهر هنا هو القيمة المكتوبة في التقرير. هذا الشرح للتثقيف ولا يعني تشخيصًا.',
      simpleEn:
        'Hemoglobin is a protein in red blood cells that helps carry oxygen. The number shown is exactly what the report lists. This is educational and not a diagnosis.',
    },
  ],
};
