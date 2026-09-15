export type Locale = 'ar' | 'en';
export type Role = 'beneficiary' | 'specialist';
export type RequestStatus = 'new' | 'pending' | 'approved' | 'more_info' | 'modified';
export type RequestType = 'specialty_guidance' | 'appointment_change' | 'medical_question' | 'prescription_query';
export type Priority = 'routine' | 'soon' | 'urgent';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'updated';
export type FacilityType = 'pharmacy' | 'hospital' | 'clinic' | 'center';
export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_update'
  | 'prescription_available'
  | 'prescription_renewal'
  | 'specialist_response'
  | 'more_info'
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
  notesAr?: string;
  notesEn?: string;
  hasPrescription?: boolean;
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

export type Facility = {
  id: string;
  nameAr: string;
  nameEn: string;
  type: FacilityType;
  addressAr: string;
  addressEn: string;
  hoursAr: string;
  hoursEn: string;
  phone: string;
  distanceKm: number;
  x: number;
  y: number;
  availabilityDemo: 'in_stock' | 'limited' | 'unknown';
};

export type SpecialistRequest = {
  id: string;
  patientId: string;
  patientNameAr: string;
  patientNameEn: string;
  type: RequestType;
  createdAt: string;
  status: RequestStatus;
  priority: Priority;
  originalText: string;
  reasonAr: string;
  reasonEn: string;
  providedAr: string[];
  providedEn: string[];
  missingAr: string[];
  missingEn: string[];
  aiNextStepAr: string;
  aiNextStepEn: string;
  specialistNote?: string;
  extraQuestion?: string;
  extraAnswer?: string;
  approvedServiceAr?: string;
  approvedServiceEn?: string;
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

export type FeedbackItem = {
  id: string;
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
  journey: string;
};

export type ChatOption = { id: string; labelAr: string; labelEn: string };
export type ChatAction = {
  id: string;
  labelAr: string;
  labelEn: string;
  kind: 'navigate' | 'intent' | 'create_request' | 'show_appointments' | 'book';
  href?: string;
  intent?: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'aoun' | 'system';
  textAr: string;
  textEn: string;
  createdAt: string;
  options?: ChatOption[];
  actions?: ChatAction[];
  appointmentIds?: string[];
  disclaimer?: boolean;
};

export type IntakeState = {
  area?: string;
  duration?: string;
  urgency?: Priority;
  step: 0 | 1 | 2 | 3 | 4;
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
  findings: LabFinding[];
  createdAt: string;
};
