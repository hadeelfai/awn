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

  const worker = await createWorker("eng");

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

    const response = await askAwn(message.trim());

    return res.json({
      success: true,
      reply: response,
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

app.get("/appointments/booked", (_req, res) => {
  return res.json({
    success: true,
    appointments: getBookedAppointments(),
  });
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