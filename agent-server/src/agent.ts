import {
  Agent,
  run,
  setDefaultOpenAIClient,
  setOpenAIAPI,
  setTracingDisabled,
  tool,
  type AgentInputItem,
} from "@openai/agents";

import OpenAI from "openai";
import { z } from "zod";

// ============================================================
// OPENROUTER
// ============================================================

const openRouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

setDefaultOpenAIClient(openRouterClient);
setOpenAIAPI("chat_completions");
setTracingDisabled(true);

// ============================================================
// TYPES
// ============================================================

export type Appointment = {
  id: string;
  specialty: string;
  specialtyAr: string;
  facility: string;
  facilityAr: string;
  city: string;
  cityAr: string;
  neighborhood: string;
  neighborhoodAr: string;
  date: string;
  time: string;
};

export type SavedReport = {
  id: string;
  fileName: string;
  fileType: string;
  explanation: string;
  createdAt: string;
};

// ============================================================
// MOCK APPOINTMENT AVAILABILITY
// ============================================================

const appointments: Appointment[] = [
  // ==========================================================
  // JEDDAH - OPHTHALMOLOGY
  // ==========================================================

  {
    id: "APT-001",
    specialty: "Ophthalmology",
    specialtyAr: "طب العيون",
    facility: "Awn Medical Center - Rawdah",
    facilityAr: "مركز عون الطبي - الروضة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Rawdah",
    neighborhoodAr: "الروضة",
    date: "2026-09-20",
    time: "10:00 AM",
  },
  {
    id: "APT-002",
    specialty: "Ophthalmology",
    specialtyAr: "طب العيون",
    facility: "Awn Medical Center - Al Zahra",
    facilityAr: "مركز عون الطبي - الزهراء",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Zahra",
    neighborhoodAr: "الزهراء",
    date: "2026-09-20",
    time: "1:30 PM",
  },
  {
    id: "APT-003",
    specialty: "Ophthalmology",
    specialtyAr: "طب العيون",
    facility: "Awn Medical Center - Al Salamah",
    facilityAr: "مركز عون الطبي - السلامة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Salamah",
    neighborhoodAr: "السلامة",
    date: "2026-09-21",
    time: "4:00 PM",
  },

  // ==========================================================
  // JEDDAH - ORTHOPEDICS
  // ==========================================================

  {
    id: "APT-004",
    specialty: "Orthopedics",
    specialtyAr: "عيادة العظام",
    facility: "Awn Medical Center - Rawdah",
    facilityAr: "مركز عون الطبي - الروضة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Rawdah",
    neighborhoodAr: "الروضة",
    date: "2026-09-21",
    time: "9:00 AM",
  },
  {
    id: "APT-005",
    specialty: "Orthopedics",
    specialtyAr: "عيادة العظام",
    facility: "Awn Medical Center - Al Zahra",
    facilityAr: "مركز عون الطبي - الزهراء",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Zahra",
    neighborhoodAr: "الزهراء",
    date: "2026-09-22",
    time: "11:30 AM",
  },
  {
    id: "APT-006",
    specialty: "Orthopedics",
    specialtyAr: "عيادة العظام",
    facility: "Awn Medical Center - Al Salamah",
    facilityAr: "مركز عون الطبي - السلامة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Salamah",
    neighborhoodAr: "السلامة",
    date: "2026-09-23",
    time: "2:00 PM",
  },

  // ==========================================================
  // JEDDAH - GENERAL PRACTITIONER
  // ==========================================================

  {
    id: "APT-007",
    specialty: "General Practitioner",
    specialtyAr: "طبيب عام",
    facility: "Awn Medical Center - Rawdah",
    facilityAr: "مركز عون الطبي - الروضة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Rawdah",
    neighborhoodAr: "الروضة",
    date: "2026-09-20",
    time: "8:30 AM",
  },
  {
    id: "APT-008",
    specialty: "General Practitioner",
    specialtyAr: "طبيب عام",
    facility: "Awn Medical Center - Al Zahra",
    facilityAr: "مركز عون الطبي - الزهراء",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Zahra",
    neighborhoodAr: "الزهراء",
    date: "2026-09-21",
    time: "12:30 PM",
  },
  {
    id: "APT-009",
    specialty: "General Practitioner",
    specialtyAr: "طبيب عام",
    facility: "Awn Medical Center - Al Salamah",
    facilityAr: "مركز عون الطبي - السلامة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Salamah",
    neighborhoodAr: "السلامة",
    date: "2026-09-22",
    time: "5:00 PM",
  },

  // ==========================================================
  // JEDDAH - NEUROLOGY
  // ==========================================================

  {
    id: "APT-010",
    specialty: "Neurology",
    specialtyAr: "عيادة الأعصاب",
    facility: "Awn Medical Center - Rawdah",
    facilityAr: "مركز عون الطبي - الروضة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Rawdah",
    neighborhoodAr: "الروضة",
    date: "2026-09-22",
    time: "10:30 AM",
  },
  {
    id: "APT-011",
    specialty: "Neurology",
    specialtyAr: "عيادة الأعصاب",
    facility: "Awn Medical Center - Al Zahra",
    facilityAr: "مركز عون الطبي - الزهراء",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Zahra",
    neighborhoodAr: "الزهراء",
    date: "2026-09-23",
    time: "1:00 PM",
  },
  {
    id: "APT-012",
    specialty: "Neurology",
    specialtyAr: "عيادة الأعصاب",
    facility: "Awn Medical Center - Al Salamah",
    facilityAr: "مركز عون الطبي - السلامة",
    city: "Jeddah",
    cityAr: "جدة",
    neighborhood: "Al Salamah",
    neighborhoodAr: "السلامة",
    date: "2026-09-24",
    time: "4:30 PM",
  },

  // ==========================================================
  // RIYADH - OPHTHALMOLOGY
  // ==========================================================

  {
    id: "APT-013",
    specialty: "Ophthalmology",
    specialtyAr: "طب العيون",
    facility: "Awn Medical Center - Al Olaya",
    facilityAr: "مركز عون الطبي - العليا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Olaya",
    neighborhoodAr: "العليا",
    date: "2026-09-20",
    time: "9:30 AM",
  },
  {
    id: "APT-014",
    specialty: "Ophthalmology",
    specialtyAr: "طب العيون",
    facility: "Awn Medical Center - Al Malqa",
    facilityAr: "مركز عون الطبي - الملقا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Malqa",
    neighborhoodAr: "الملقا",
    date: "2026-09-21",
    time: "12:00 PM",
  },
  {
    id: "APT-015",
    specialty: "Ophthalmology",
    specialtyAr: "طب العيون",
    facility: "Awn Medical Center - Al Yasmin",
    facilityAr: "مركز عون الطبي - الياسمين",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Yasmin",
    neighborhoodAr: "الياسمين",
    date: "2026-09-22",
    time: "3:30 PM",
  },

  // ==========================================================
  // RIYADH - ORTHOPEDICS
  // ==========================================================

  {
    id: "APT-016",
    specialty: "Orthopedics",
    specialtyAr: "عيادة العظام",
    facility: "Awn Medical Center - Al Olaya",
    facilityAr: "مركز عون الطبي - العليا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Olaya",
    neighborhoodAr: "العليا",
    date: "2026-09-21",
    time: "10:00 AM",
  },
  {
    id: "APT-017",
    specialty: "Orthopedics",
    specialtyAr: "عيادة العظام",
    facility: "Awn Medical Center - Al Malqa",
    facilityAr: "مركز عون الطبي - الملقا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Malqa",
    neighborhoodAr: "الملقا",
    date: "2026-09-22",
    time: "1:30 PM",
  },
  {
    id: "APT-018",
    specialty: "Orthopedics",
    specialtyAr: "عيادة العظام",
    facility: "Awn Medical Center - Al Yasmin",
    facilityAr: "مركز عون الطبي - الياسمين",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Yasmin",
    neighborhoodAr: "الياسمين",
    date: "2026-09-23",
    time: "4:00 PM",
  },

  // ==========================================================
  // RIYADH - GENERAL PRACTITIONER
  // ==========================================================

  {
    id: "APT-019",
    specialty: "General Practitioner",
    specialtyAr: "طبيب عام",
    facility: "Awn Medical Center - Al Olaya",
    facilityAr: "مركز عون الطبي - العليا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Olaya",
    neighborhoodAr: "العليا",
    date: "2026-09-20",
    time: "8:00 AM",
  },
  {
    id: "APT-020",
    specialty: "General Practitioner",
    specialtyAr: "طبيب عام",
    facility: "Awn Medical Center - Al Malqa",
    facilityAr: "مركز عون الطبي - الملقا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Malqa",
    neighborhoodAr: "الملقا",
    date: "2026-09-21",
    time: "2:30 PM",
  },
  {
    id: "APT-021",
    specialty: "General Practitioner",
    specialtyAr: "طبيب عام",
    facility: "Awn Medical Center - Al Yasmin",
    facilityAr: "مركز عون الطبي - الياسمين",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Yasmin",
    neighborhoodAr: "الياسمين",
    date: "2026-09-22",
    time: "6:00 PM",
  },

  // ==========================================================
  // RIYADH - NEUROLOGY
  // ==========================================================

  {
    id: "APT-022",
    specialty: "Neurology",
    specialtyAr: "عيادة الأعصاب",
    facility: "Awn Medical Center - Al Olaya",
    facilityAr: "مركز عون الطبي - العليا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Olaya",
    neighborhoodAr: "العليا",
    date: "2026-09-22",
    time: "11:00 AM",
  },
  {
    id: "APT-023",
    specialty: "Neurology",
    specialtyAr: "عيادة الأعصاب",
    facility: "Awn Medical Center - Al Malqa",
    facilityAr: "مركز عون الطبي - الملقا",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Malqa",
    neighborhoodAr: "الملقا",
    date: "2026-09-23",
    time: "2:00 PM",
  },
  {
    id: "APT-024",
    specialty: "Neurology",
    specialtyAr: "عيادة الأعصاب",
    facility: "Awn Medical Center - Al Yasmin",
    facilityAr: "مركز عون الطبي - الياسمين",
    city: "Riyadh",
    cityAr: "الرياض",
    neighborhood: "Al Yasmin",
    neighborhoodAr: "الياسمين",
    date: "2026-09-24",
    time: "5:00 PM",
  },
];

// ============================================================
// PROTOTYPE STORAGE
// ============================================================

const bookedAppointments: Appointment[] = [];
const savedReports: SavedReport[] = [];

let lastSearchResults: Appointment[] = [];
let pendingAppointment: Appointment | null = null;

// ============================================================
// APPOINTMENT TOOLS
// ============================================================

const findAppointments = tool({
  name: "find_appointments",

  description:
    "Search the prototype appointment data based on specialty, city, and optional neighborhood.",

  parameters: z.object({
    specialty: z.string(),
    city: z.string(),
    neighborhood: z.string().nullable(),
  }),

  async execute({ specialty, city, neighborhood }) {
    const specialtySearch = specialty.toLowerCase();
    const citySearch = city.toLowerCase();
    const neighborhoodSearch = neighborhood?.toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSpecialty =
        appointment.specialty.toLowerCase().includes(specialtySearch) ||
        appointment.specialtyAr.includes(specialty);

      const matchesCity =
        appointment.city.toLowerCase().includes(citySearch) ||
        appointment.cityAr.includes(city);

      const matchesNeighborhood =
        !neighborhood ||
        appointment.neighborhood
          .toLowerCase()
          .includes(neighborhoodSearch!) ||
        appointment.neighborhoodAr.includes(neighborhood);

      return (
        matchesSpecialty &&
        matchesCity &&
        matchesNeighborhood
      );
    });
  },
});

const bookAppointment = tool({
  name: "book_appointment",

  description:
    "Book a specific appointment only after explicit patient confirmation.",

  parameters: z.object({
    appointmentId: z.string(),
  }),

  async execute({ appointmentId }) {
    const appointment = appointments.find(
      (item) => item.id === appointmentId
    );

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found.",
      };
    }

    const alreadyBooked = bookedAppointments.some(
      (item) => item.id === appointmentId
    );

    if (alreadyBooked) {
      return {
        success: false,
        message: "Appointment already booked.",
      };
    }

    bookedAppointments.push(appointment);

    return {
      success: true,
      appointment,
    };
  },
});

// ============================================================
// AWN AGENT
// ============================================================

export const awnAgent = new Agent({
  name: "Awn",

    model: "openrouter/free",

  instructions: `
You are Awn (عون), an AI-powered smart healthcare assistant.

You are the single conversational interface between the patient and
healthcare services.

LANGUAGE:
- Respond in the same language the patient primarily uses.
- Arabic should sound natural, clear, and professional.
- Keep responses concise and patient-friendly.

==================================================
SYMPTOM GUIDANCE
==================================================

When a patient describes symptoms:

- Help them identify an appropriate medical specialty.
- You are NOT diagnosing the patient.
- Never say the patient definitely has a specific disease.
- Ask a short follow-up question only when necessary.
- Explain briefly why that specialty may be appropriate.

Prototype specialties currently available for booking include:
- Ophthalmology / طب العيون
- Orthopedics / عيادة العظام
- General Practitioner / طبيب عام
- Neurology / عيادة الأعصاب

Other specialties may be suggested when medically appropriate,
but only the specialties above currently have prototype appointment
availability.

After suggesting a specialty, offer to help find an appointment.

==================================================
APPOINTMENTS
==================================================

Appointment availability and booking are handled by Awn's
application tools.

Prototype appointment cities:
- Jeddah / جدة
- Riyadh / الرياض

Never invent appointment availability.
Never claim that an appointment has been booked unless the
booking operation actually succeeded.

==================================================
FAHIMNI - MEDICAL REPORTS
==================================================

Fahimni helps patients understand medical reports.

When report content is provided:

- Explain it in simple patient-friendly language.
- Explain important medical terms.
- Highlight values or findings outside a provided reference range.
- Do not diagnose.
- Do not prescribe treatment.
- Do not tell the patient to change medication.
- Do not exaggerate abnormal results.
- Clearly state when something cannot be determined from the report alone.

==================================================
SAFETY
==================================================

Never:
- Diagnose a patient.
- Prescribe medication.
- Tell a patient to start, stop, or change medication.

If a message suggests a potentially serious or urgent situation,
such as severe difficulty breathing, loss of consciousness,
severe uncontrolled bleeding, or another apparent medical emergency:

- Do not continue the normal appointment or report workflow.
- Tell the patient to seek immediate emergency medical assistance.
- Keep the response direct and concise.

==================================================
SUPPORT
==================================================

Help patients with:
- appointments
- reports
- Awn features
- navigating healthcare services

If a request cannot be handled by Awn, explain that human
support may be required.

You assist patients with healthcare navigation.
You do not replace medical professionals.
`,

  tools: [findAppointments, bookAppointment],
});

// ============================================================
// CONVERSATION STATE
// ============================================================

// Keep short-lived conversation context isolated by authenticated Supabase user.
// A single process-wide history can expose one beneficiary's messages to another.
const conversationHistories = new Map<string, AgentInputItem[]>();

// ============================================================
// APPOINTMENT HELPERS
// ============================================================

function detectAppointmentSearch(message: string) {
  const text = message
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");

  const wantsAppointment =
    text.includes("موعد") ||
    text.includes("احجز") ||
    text.includes("حجز") ||
    text.includes("appointment") ||
    text.includes("book");

  if (!wantsAppointment) {
    return null;
  }

  let specialty: string | null = null;
  let city: string | null = null;

  // ==========================================================
  // OPHTHALMOLOGY - طب العيون
  // ==========================================================

  if (
    text.includes("عيون") ||
    text.includes("العين") ||
    text.includes("طب العيون") ||
    text.includes("طبيب عيون") ||
    text.includes("عياده عيون") ||
    text.includes("ophthalmology") ||
    text.includes("eye doctor")
  ) {
    specialty = "Ophthalmology";
  }

  // ==========================================================
  // ORTHOPEDICS - العظام
  // ==========================================================

  else if (
    text.includes("عظام") ||
    text.includes("العظام") ||
    text.includes("طب العظام") ||
    text.includes("عياده العظام") ||
    text.includes("عياده عظام") ||
    text.includes("طبيب عظام") ||
    text.includes("orthopedic") ||
    text.includes("orthopedics")
  ) {
    specialty = "Orthopedics";
  }

  // ==========================================================
  // GENERAL PRACTITIONER - الطب العام
  // ==========================================================

  else if (
    text.includes("طبيب عام") ||
    text.includes("الطبيب العام") ||
    text.includes("طب عام") ||
    text.includes("الطب العام") ||
    text.includes("طب عامه") ||
    text.includes("عياده عامه") ||
    text.includes("general practitioner") ||
    text.includes("general doctor") ||
    text === "gp" ||
    text.includes(" gp ")
  ) {
    specialty = "General Practitioner";
  }

  // ==========================================================
  // NEUROLOGY - الأعصاب
  // ==========================================================

  else if (
    text.includes("اعصاب") ||
    text.includes("الاعصاب") ||
    text.includes("طب الاعصاب") ||
    text.includes("عياده الاعصاب") ||
    text.includes("عياده اعصاب") ||
    text.includes("طبيب اعصاب") ||
    text.includes("neurology") ||
    text.includes("neurologist")
  ) {
    specialty = "Neurology";
  }

  // ==========================================================
  // CITY
  // ==========================================================

  if (
    text.includes("جده") ||
    text.includes("jeddah")
  ) {
    city = "Jeddah";
  } else if (
    text.includes("الرياض") ||
    text.includes("رياض") ||
    text.includes("riyadh")
  ) {
    city = "Riyadh";
  }

  return {
    specialty,
    city,
  };
}

// ============================================================
// FORMAT AVAILABLE APPOINTMENTS
// ============================================================

function formatAppointments(results: Appointment[]) {
  if (results.length === 0) {
    return "لم أجد مواعيد متاحة مطابقة لطلبك حاليًا.";
  }

  let response = "وجدت لك المواعيد التالية:\n\n";

  results.forEach((appointment, index) => {
    response +=
      `${index + 1}. ${appointment.specialtyAr}\n` +
      `📍 ${appointment.facilityAr} - ${appointment.neighborhoodAr}\n` +
      `📅 ${appointment.date}\n` +
      `🕐 ${appointment.time}\n\n`;
  });

  response +=
    "اختر الموعد المناسب لك، وبعدها سأطلب منك تأكيد الحجز.";

  return response;
}

// ============================================================
// DETECT APPOINTMENT SELECTION
// ============================================================

function detectAppointmentSelection(
  message: string
): number | null {
  const text = message.trim().toLowerCase();

  if (
    text === "1" ||
    text.includes("الأول") ||
    text.includes("الاول") ||
    text.includes("first")
  ) {
    return 0;
  }

  if (
    text === "2" ||
    text.includes("الثاني") ||
    text.includes("second")
  ) {
    return 1;
  }

  if (
    text === "3" ||
    text.includes("الثالث") ||
    text.includes("third")
  ) {
    return 2;
  }

  return null;
}

// ============================================================
// EXPLICIT BOOKING CONFIRMATION
// ============================================================

function isExplicitConfirmation(message: string) {
  const text = message
    .trim()
    .toLowerCase()
    .replace(/[،,.!?]/g, "");

  const confirmations = [
    "نعم",
    "نعم أؤكد",
    "نعم اؤكد",
    "نعم أؤكد الحجز",
    "نعم اؤكد الحجز",
    "أؤكد",
    "اؤكد",
    "أؤكد الحجز",
    "اؤكد الحجز",
    "أكد الحجز",
    "اكد الحجز",
    "احجز",
    "احجزه",
    "yes",
    "confirm",
    "yes confirm",
    "book it",
  ];

  return confirmations.some(
    (confirmation) => text === confirmation
  );
}

// ============================================================
// CHAT
// ============================================================

export async function askAwn(message: string, userId: string) {
  // ----------------------------------------------------------
  // 1. CONFIRM A PENDING APPOINTMENT
  // ----------------------------------------------------------

  if (
    pendingAppointment &&
    isExplicitConfirmation(message)
  ) {
    const appointment = pendingAppointment;

    const alreadyBooked = bookedAppointments.some(
      (item) => item.id === appointment.id
    );

    if (alreadyBooked) {
      pendingAppointment = null;

      return (
        `هذا الموعد محجوز لديك بالفعل.\n\n` +
        `${appointment.specialtyAr}\n` +
        `📍 ${appointment.facilityAr}\n` +
        `📅 ${appointment.date}\n` +
        `🕐 ${appointment.time}`
      );
    }

    bookedAppointments.push(appointment);

    pendingAppointment = null;

    return (
      `تم تأكيد حجز موعدك بنجاح ✅\n\n` +
      `${appointment.specialtyAr}\n` +
      `📍 ${appointment.facilityAr}\n` +
      `📅 ${appointment.date}\n` +
      `🕐 ${appointment.time}\n\n` +
      `ستجد الموعد أيضًا في قسم مواعيدي.`
    );
  }

  // ----------------------------------------------------------
  // 2. SELECT APPOINTMENT FROM LAST SEARCH
  // ----------------------------------------------------------

  const selectedIndex =
    detectAppointmentSelection(message);

  if (
    selectedIndex !== null &&
    lastSearchResults[selectedIndex]
  ) {
    pendingAppointment =
      lastSearchResults[selectedIndex];

    const appointment = pendingAppointment;

    return (
      `اخترت هذا الموعد:\n\n` +
      `${appointment.specialtyAr}\n` +
      `📍 ${appointment.facilityAr}\n` +
      `📅 ${appointment.date}\n` +
      `🕐 ${appointment.time}\n\n` +
      `هل تؤكد حجز هذا الموعد؟`
    );
  }

  // ----------------------------------------------------------
  // 3. DETERMINISTIC APPOINTMENT SEARCH
  // ----------------------------------------------------------

  const appointmentRequest =
    detectAppointmentSearch(message);

  if (appointmentRequest) {
    if (!appointmentRequest.specialty) {
      return "أكيد. أي تخصص أو عيادة ترغب في حجز موعد فيها؟";
    }

    if (!appointmentRequest.city) {
      return "في أي مدينة ترغب في حجز الموعد؟ جدة أم الرياض؟";
    }

    const results = appointments.filter(
      (appointment) =>
        appointment.specialty ===
          appointmentRequest.specialty &&
        appointment.city ===
          appointmentRequest.city
    );

    lastSearchResults = results;
    pendingAppointment = null;

    return formatAppointments(results);
  }

  // ----------------------------------------------------------
  // 4. EVERYTHING ELSE -> AWN AI
  // ----------------------------------------------------------

  const history = conversationHistories.get(userId) ?? [];
  const result = await run(awnAgent, [
    ...history,
    {
      role: "user",
      content: message,
    },
  ]);

  // Bound retained context and active users so this in-memory prototype stays small.
  conversationHistories.set(userId, result.history.slice(-24));
  if (conversationHistories.size > 500) {
    const oldestUser = conversationHistories.keys().next().value;
    if (oldestUser) conversationHistories.delete(oldestUser);
  }

  return (
    result.finalOutput ??
    "عذرًا، لم أتمكن من معالجة الطلب."
  );
}

// ============================================================
// FAHIMNI TEXT ANALYSIS
// ============================================================

// ============================================================
// FAHIMNI TEXT ANALYSIS
// ============================================================

export async function analyzeReportText(
  text: string,
  fileName: string,
  fileType: string
) {
  if (!text || text.trim().length < 10) {
    throw new Error(
      "No readable report text was found."
    );
  }

  const hasArabicText = /[\u0600-\u06FF]/.test(text);
  const reportAgent = new Agent({
    name: "Fahimni",

    model: "openrouter/free",

    instructions: `
You are Fahimni (فهمني), the medical-report explanation feature inside Awn.

Your job is to help a patient quickly understand the most important information in a medical report.

IMPORTANT:
Your final response MUST be the actual explanation of the report.

Do NOT output classifications such as:
"safe"
"unsafe"
"User Safety: safe"
or any moderation/category label.

LANGUAGE:
- Respond in the language used by the report. If it contains both Arabic and English, respond in Arabic.
- Use simple, patient-friendly language.
- Avoid unnecessary medical terminology.
- Keep the entire response brief.
- Aim for approximately 60-100 words in the response language.
- Do NOT explain every test or value separately.
- Focus only on the overall picture and the most important finding.

Use ONLY this structure, translated into the response language:

ملخص التقرير:
Give one or two short sentences describing the overall result.

أهم ملاحظة:
Mention only the most important finding that deserves attention.
If there is no important abnormal finding, say that the results appear generally reassuring based on the report.

الخطوة التالية:
Give one short, appropriate next step, such as discussing an important finding with a healthcare professional if needed.

SAFETY:
- Do not diagnose.
- Do not claim the patient has a disease.
- Do not prescribe treatment.
- Do not recommend a specific medication.
- Do not tell the patient to start, stop, or change medication.
- Do not invent values, findings, or reference ranges.
- Only mention abnormalities supported by the report.
- If something cannot be determined from the report, say so briefly.
- Do not exaggerate abnormal findings.
`,
  });

  const prompt = `
${hasArabicText ? "هذا نص تقرير طبي تم استخراجه من الملف:" : "This medical report text was extracted from the file:"}

--- ${hasArabicText ? "بداية التقرير" : "Report begins"} ---

${text}

--- ${hasArabicText ? "نهاية التقرير" : "Report ends"} ---

${hasArabicText ? "اشرح التقرير للمريض باختصار شديد وبأسلوب بسيط." : "Explain the report to the patient briefly in simple language."}

${hasArabicText ? "لا تشرح كل تحليل أو قيمة بشكل منفصل. ركز فقط على الصورة العامة وأهم ملاحظة تستحق الانتباه." : "Do not explain every test or value separately. Focus on the overall picture and the most important finding."}

${hasArabicText ? "يجب أن تكون الإجابة تقريبًا بين 60 و100 كلمة فقط." : "Keep the answer to approximately 60–100 words."}

${hasArabicText ? "استخدم هذه العناوين فقط:" : "Use only these headings:"}

${hasArabicText ? "ملخص التقرير:" : "Report summary:"}

${hasArabicText ? "أهم ملاحظة:" : "Key finding:"}

${hasArabicText ? "الخطوة التالية:" : "Next step:"}

${hasArabicText ? 'ابدأ مباشرة بعبارة "ملخص التقرير:".' : 'Start directly with "Report summary:".'}
`;

  let explanation = "";

  // Free OpenRouter routing can occasionally return an unusable
  // moderation-style response, so allow a second attempt.

  for (
    let attempt = 0;
    attempt < 2;
    attempt++
  ) {
    const result =
      await run(
        reportAgent,
        prompt
      );

    explanation =
      typeof result.finalOutput ===
      "string"
        ? result.finalOutput.trim()
        : "";

    const badResponse =
      explanation.length < 40 ||
      /^user safety/i.test(
        explanation
      ) ||
      explanation.toLowerCase() ===
        "safe" ||
      explanation.toLowerCase() ===
        "unsafe";

    if (!badResponse) {
      break;
    }

    explanation = "";
  }

  if (!explanation) {
    throw new Error(
      "The free model did not return a usable report explanation."
    );
  }

  const report: SavedReport = {
    id: `REPORT-${Date.now()}`,
    fileName,
    fileType,
    explanation,
    createdAt:
      new Date().toISOString(),
  };

  savedReports.push(report);

  return report;
}
// ============================================================
// DATA ACCESS
// ============================================================

export function getBookedAppointments() {
  return bookedAppointments;
}

export function getSavedReports() {
  return savedReports;
}

export function saveReport(
  report: SavedReport
) {
  savedReports.push(report);

  return report;
}

export function resetConversation() {
  conversationHistories.clear();
  lastSearchResults = [];
  pendingAppointment = null;
}
