# Awn

Awn is an Arabic/English Expo health navigation prototype. It helps people find general health information, prepare for an appointment, and keep track of appointment details.


## Project map

- `app/(beneficiary)/` — home dashboard, Ask chat, appointment list/calendar and detail pages, report explanation, medications, and notifications.
- `src/store.tsx` — client state, Ask/booking flow, chat history, appointment changes, and Supabase synchronization.
- `src/services/` — Gemini/RAG and Supabase clients, persistence, report explanation, API URLs, and appointment date helpers.
- `src/data/seed.ts` — demo patient, appointments, prescriptions, notifications, and report. Demo records are not live clinical or scheduling data.
- `awn-rag/` — FastAPI service, Gemini health Q&A with optional retrieved references, preparation guidance, source ingestion, and Supabase schema.
