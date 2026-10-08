# Awn project status

Last reviewed: 2026-10-08

## What is implemented

- **Bilingual app shell:** Expo / React Native screens support Arabic and English, RTL layout, accessibility font scaling, and a high-contrast setting.
- **Ask Awn:** chat requests go to the FastAPI service. Gemini can answer general health questions using its medical knowledge; retrieved MOH/WHO passages are references when relevant, and the answer must disclose when no matching Awn reference was found. Safety rules prohibit diagnosis and personalized treatment instructions. Replies can include source links. The chat UI includes typing state, searchable conversation history, and conversation deletion.
- **Voice input:** browser speech recognition can dictate into the Ask composer on supported web browsers. Native iOS/Android speech recognition is not included in the current Expo Go-compatible build.
- **Appointment conversation:** the agent gathers symptoms first, uses Gemini to suggest a suitable specialty (for example, musculoskeletal pain → orthopedics), asks for date/time/location preferences, and requests patient confirmation before saving the appointment in Awn.
- **Appointment management:** appointments can be viewed in list/calendar modes, shown on the home dashboard, edited, cancelled, and managed from chat. Awn stores these records in its own calendar and Supabase.
- **Preparation guidance:** the detail screen sends the appointment symptoms, specialty, facility, and appointment type to `/prepare-appointment`. Guidance is constrained to applicable retrieved sources; if sources do not support a specific step, it falls back to general safe reminders and directs patients to follow the clinic's instructions.
- **Report explanation:** PDF and image reports can be uploaded for a plain-language explanation with source-grounded term help. Uploaded files are processed in memory by the RAG service and are not stored there.
- **Persistence:** Supabase backs up Awn appointments, reports, and chat messages; anonymous sign-in is used by the current prototype.
- **Knowledge sources:** `awn-rag/sources.txt` contains Ministry of Health information and WHO fact sheets. `awn-rag/ingest.py` loads sources into the Supabase vector table.

## Important current limits

- Appointment booking is **not a live hospital booking**. Confirmation saves a user-entered appointment in Awn; no official slot is checked or reserved, and changes/cancellation are not sent to Sehhaty or a clinic.
- Demo seed records are still shipped in `src/data/seed.ts`. Replace them with a clean first-run experience or clearly labeled demo mode before user trials.
- The health knowledge index is only as current and complete as the last successful source ingestion. A source listed in `sources.txt` is not proof that its content has been ingested or retrieved correctly. Broader Q&A coverage depends on a successful re-ingestion and retrieval evaluation.
- Authentication, privacy controls, retention, and production security are incomplete. The RAG service currently allows wildcard CORS and attempts to store Ask questions and answers in `query_log`; logging failure no longer blocks an answer. Do not send real patient-identifying data until these issues are addressed.
- The appointment screen still calls the legacy Express service for an appointment endpoint. The app also reads appointments from Supabase; decide on one authoritative path and remove the duplicate after confirming deployments no longer depend on it.
- The Python RAG service downloads BGE-M3 embeddings on first use/ingestion. This is a large model and has had intermittent Hugging Face connection failures in this environment.

## Recommended next work

### P0 — reliability and correctness

1. Run RAG ingestion from a working network and verify `/health` reports a nonzero chunk count; test representative Arabic and English questions against the actual stored sources.
2. Validate Gemini model names and fallback behavior using the configured account. Surface timeouts/rate limits clearly and add bounded retries; avoid silently replacing the sourced answer with generic content.
3. Reconcile appointment persistence: make Supabase the single source of truth, or document and secure the legacy appointment endpoint. Verify create, edit, cancel, reload, and home-dashboard upcoming selection across app restarts.
4. Confirm the booking confirmation action stays in chat until explicit confirmation, then navigates to My Appointments and shows the same saved record.

### P1 — real appointment data and safer clinical behavior

1. Connect to an authorized live scheduling API (such as an approved MOH/HDP integration, if access and scope permit). Resolve specialty and symptom intent against an authoritative service catalog; retrieve actual facilities and slot availability by city, then reserve only after patient confirmation.
2. Keep symptom classification as navigation support, not diagnosis. Add clinician-reviewed mapping/evaluation cases for Arabic dialects, children, multi-symptom reports, and emergency red flags.
3. Improve preparation content with clinic/procedure-specific official instructions. Keep general reminders separate, show dates/owners on sources, and do not infer fasting, medication changes, or tests.
4. Audit the provided public datasets and PDFs for machine-readable service identifiers, specialties, facility addresses, update cadence, license, and geographic coverage. Accreditation and directory data can improve facility discovery but does not prove live appointment availability.

### P2 — production readiness and maintenance

1. Restrict CORS, add backend authentication/authorization and rate limits, define query-log retention, and complete privacy/regulatory review before real health data use.
2. Add a privacy-conscious way to delete all account data; current chat deletion removes messages only.
3. Add automated checks for appointment lifecycle, booking confirmation, Arabic/English behavior, emergency handling, and RAG source citations. The root project now provides `npm run typecheck`; it does not yet have automated behavioral tests or a lint script.
4. Add source freshness monitoring and a repeatable ingestion report (success/failure, extracted pages, duplicates, and last-updated date).
5. Consolidate backend ownership and remove legacy routes, packages, and demo assets only after deployments and external clients are confirmed not to use them.

## Local development pointers

- App: `npm start`
- RAG setup and ingestion: follow the backend instructions in the root `README.md`; configure `awn-rag/.env` from `awn-rag/.env.example`.
- API endpoints used by the app: RAG on port `8000`; legacy appointment endpoint on port `3001`.
- Never commit `.env` files or send real patient records to the prototype.
