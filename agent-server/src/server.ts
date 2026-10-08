import "dotenv/config";

import cors from "cors";
import express from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

import {
    analyzeReportText,
    askAwn,
    getBookedAppointments,
    getSavedReports,
    type Appointment as AgentAppointment,
} from "./agent.js";


// ============================================================
// SERVER SETUP
// ============================================================

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());


// ============================================================
// FILE UPLOAD
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});


// ============================================================
// PDF TEXT EXTRACTION
// ============================================================

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}


// ============================================================
// IMAGE OCR
// ============================================================

async function extractImageText(buffer: Buffer) {
  console.log("Starting image OCR...");

  // Arabic lab reports are common in the target audience. Tesseract accepts a
  // combined language list and will load both trained data sets as needed.
  const worker = await createWorker("eng+ara");

  try {
    const result = await worker.recognize(buffer);

    const text = result.data.text.trim();

    console.log(
      `OCR completed. Extracted ${text.length} characters.`
    );

    return text;
  } finally {
    await worker.terminate();
  }
}


// ============================================================
// HEALTH
// ============================================================

app.get("/health", (_req, res) => {
  return res.json({
    success: true,
    message: "Awn backend is running.",
  });
});


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY;

function getBearerToken(req: express.Request) {
  const authorization = req.header("authorization") ?? "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1];
}

function getSupabaseHeaders(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase server configuration is missing.");
  }

  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    authorization: "Bearer " + accessToken,
    "content-type": "application/json",
  };
}

async function verifySupabaseUser(accessToken: string) {
  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: getSupabaseHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("The Supabase session is invalid or expired.");
  }

  const user = (await response.json()) as { id?: string };
  if (!user.id) throw new Error("Supabase did not return a user id.");
  return user.id;
}

function toAppAppointment(appointment: AgentAppointment) {
  return {
    id: appointment.id,
    specialtyAr: appointment.specialtyAr,
    specialtyEn: appointment.specialty,
    doctorAr: "",
    doctorEn: "",
    facilityAr: appointment.facilityAr,
    facilityEn: appointment.facility,
    locationAr: appointment.cityAr + "، " + appointment.neighborhoodAr,
    locationEn: appointment.city + ", " + appointment.neighborhood,
    date: appointment.date,
    time: appointment.time,
    status: "upcoming",
    preparationAr: [],
    preparationEn: [],
  };
}

async function saveBookedAppointment(
  accessToken: string,
  appointment: AgentAppointment
) {
  await verifySupabaseUser(accessToken);

  const response = await fetch(
    SUPABASE_URL + "/rest/v1/awn_appointments?on_conflict=user_id%2Cclient_id",
    {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(accessToken),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        client_id: appointment.id,
        payload: toAppAppointment(appointment),
        created_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Could not save appointment to Supabase (HTTP " + response.status + ")."
    );
  }
}

// ============================================================
// CHAT
// ============================================================

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "A Supabase session is required.",
      });
    }

    const userId = await verifySupabaseUser(accessToken);
    const previouslyBooked = new Set(
      getBookedAppointments().map((appointment) => appointment.id)
    );

    const reply = await askAwn(message.trim(), userId);
    const newBookings = getBookedAppointments().filter(
      (appointment) => !previouslyBooked.has(appointment.id)
    );

    for (const appointment of newBookings) {
      await saveBookedAppointment(accessToken, appointment);
    }

    return res.json({
      success: true,
      reply,
      appointments: newBookings.map(toAppAppointment),
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Awn could not process the message.",
    });
  }
});


// ============================================================
// BOOKED APPOINTMENTS
// ============================================================

app.get("/appointments/booked", async (req, res) => {
  try {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "A Supabase session is required.",
      });
    }

    await verifySupabaseUser(accessToken);
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/awn_appointments?select=payload&order=created_at.desc&limit=200",
      { headers: getSupabaseHeaders(accessToken) }
    );

    if (!response.ok) {
      throw new Error(
        "Could not load appointments from Supabase (HTTP " + response.status + ")."
      );
    }

    const rows = (await response.json()) as Array<{
      payload: ReturnType<typeof toAppAppointment>;
    }>;

    return res.json({
      success: true,
      appointments: rows.map((row) => row.payload),
    });
  } catch (error) {
    console.error("Appointment load error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load appointments.",
    });
  }
});


// ============================================================
// SAVED REPORTS
// ============================================================

app.get("/reports", (_req, res) => {
  return res.json({
    success: true,
    reports: getSavedReports(),
  });
});


// ============================================================
// REPORT ANALYSIS
// ============================================================

app.post(
  "/reports/analyze",
  upload.single("report"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "A report file is required.",
        });
      }

      const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF, PNG, and JPG reports are supported.",
        });
      }

      console.log(
        `Received report: ${req.file.originalname}`
      );

      console.log(
        `File type: ${req.file.mimetype}`
      );

      let extractedText = "";


      // ======================================================
      // PDF
      // ======================================================

      if (req.file.mimetype === "application/pdf") {
        console.log("Extracting PDF text...");

        extractedText =
          await extractPdfText(req.file.buffer);
      }


      // ======================================================
      // IMAGE
      // ======================================================

      else {
        extractedText =
          await extractImageText(req.file.buffer);
      }


      // ======================================================
      // VALIDATE EXTRACTION
      // ======================================================

      if (
        !extractedText ||
        extractedText.trim().length < 10
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No readable text was found in this report. Please upload a clearer file.",
        });
      }

      console.log(
        `Sending ${extractedText.length} characters to Fahimni...`
      );


      // ======================================================
      // FAHIMNI
      // ======================================================

      const report = await analyzeReportText(
        extractedText,
        req.file.originalname,
        req.file.mimetype
      );

      console.log(
        `Report analyzed successfully: ${report.id}`
      );

      return res.json({
        success: true,
        report,
      });

    } catch (error) {
      console.error(
        "Report analysis error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "The report could not be analyzed. Please try again.",
      });
    }
  }
);


// Return a useful response for upload middleware errors.
app.use((error: any, _req: any, res: any, _next: any) => {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Report file is too large. The maximum size is 25 MB.",
    });
  }

  console.error("Request error:", error);
  return res.status(500).json({
    success: false,
    message: "The request could not be processed.",
  });
});


// ============================================================
// 404
// ============================================================

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "Endpoint not found.",
  });
});


// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(
    `Awn backend running on http://localhost:${PORT}`
  );
});
