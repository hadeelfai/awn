export type Locale = 'ar' | 'en';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'updated';
export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_update'
  | 'prescription_available'
  | 'prescription_renewal'
  | 'preparation'
  | 'satisfaction';

export type Appointment = {
  id: string;
  specialtyAr: string;
  specialtyEn: string;
  doctorAr: string;
  doctorEn: string;
  facilityAr: string;
  facilityEn: string;
  locationAr: string;
  locationEn: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  preparationAr: string[];
  preparationEn: string[];
  patientPreparationItems?: string[];
  preparationByLanguage?: Partial<Record<Locale, AppointmentPreparation>>;
  symptoms?: string;
  bookingConversationId?: string;
  notesAr?: string;
  notesEn?: string;
  hasPrescription?: boolean;
};

export type AppointmentPreparation = {
  cacheVersion?: number;
  instructions: string[];
  general_instructions?: string[];
  general_note?: string;
  sources: { title: string; url: string }[];
  note: string;
  emergency: boolean;
  fallback?: boolean;
};

export type Prescription = {
  id: string;
  medicationAr: string;
  medicationEn: string;
  dosage: string;
  frequencyAr: string;
  frequencyEn: string;
  instructionsAr: string;
  instructionsEn: string;
  issuedAt: string;
  active: boolean;
  refillSoon?: boolean;
  sourceAppointmentId?: string;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  createdAt: string;
  read: boolean;
  href?: string;
};

export type ChatOption = { id: string; labelAr: string; labelEn: string };
export type ChatAction = {
  id: string;
  labelAr: string;
  labelEn: string;
  kind: 'navigate' | 'intent' | 'show_appointments' | 'book' | 'confirm_booking' | 'upload_report';
  href?: string;
  intent?: string;
};

export type ChatMessage = {
  id: string;
  conversationId?: string;
  role: 'user' | 'awn' | 'system';
  textAr: string;
  textEn: string;
  createdAt: string;
  options?: ChatOption[];
  actions?: ChatAction[];
  appointmentIds?: string[];
  documentIds?: string[];
  suggestedAppointment?: Appointment;
  disclaimer?: boolean;
  sources?: { title: string; url: string }[];
};

export type LabFinding = {
  nameAr: string;
  nameEn: string;
  value: string;
  unit: string;
  simpleAr: string;
  simpleEn: string;
};

export type ExplainedDocument = {
  id: string;
  titleAr: string;
  titleEn: string;
  kind: 'lab' | 'prescription' | 'report' | 'instructions';
  originalName: string;
  originalUri?: string;
  explanationLanguage?: Locale;
  findings: LabFinding[];
  createdAt: string;
  // Explanation details
  summary?: string;
  keyPoints?: string[];
  terms?: { term: string; meaning: string }[];
  questionsForDoctor?: string[];
  nextSteps?: string[];
  urgent?: boolean;
  sources?: { title: string; url: string }[];
  disclaimer?: string;
  translations?: Partial<Record<Locale, {
    summary: string;
    keyPoints: string[];
    terms: { term: string; meaning: string }[];
    questionsForDoctor: string[];
    nextSteps: string[];
    disclaimer: string;
  }>>;
};
