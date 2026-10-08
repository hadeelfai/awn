# Awn

Awn is an Arabic/English Expo health navigation prototype. It helps people find general health information, prepare for an appointment, and keep track of appointment details. It is not a diagnostic service and does not book directly into a hospital or Ministry of Health scheduling system.

## Run the app

```bash
npm install
npm start
```

Use `i`, `a`, or `w` in Expo to launch iOS, Android, or web. Expo SDK 57 is used; see the [versioned Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/).

## Project map

- `app/(beneficiary)/` — home dashboard, Ask chat, appointment list/calendar and detail pages, report explanation, medications, and notifications.
- `src/store.tsx` — client state, Ask/booking flow, chat history, appointment changes, and Supabase synchronization.
- `src/services/` — Gemini/RAG and Supabase clients, persistence, report explanation, API URLs, and appointment date helpers.
- `src/data/seed.ts` — demo patient, appointments, prescriptions, notifications, and report. Demo records are not live clinical or scheduling data.
- `awn-rag/` — FastAPI service, Gemini health Q&A with optional retrieved references, preparation guidance, source ingestion, and Supabase schema.
- `agent-server/` — legacy Express service, including the booked-appointments endpoint. Ask responses and preparation currently use `awn-rag`.
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — implemented flows, limitations, and prioritized follow-up work.

## Backend setup

The Expo app expects the RAG API on port `8000` and the appointment API on port `3001`. For a physical device, `src/config.ts` derives the development host from Expo; the device and computer must be on a reachable network.

For `awn-rag`, run `awn-rag/schema.sql` in Supabase, copy `awn-rag/.env.example` to `awn-rag/.env`, and fill in the backend credentials. Then in `awn-rag/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python ingest.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The ingestion step reads official source URLs from `awn-rag/sources.txt`, stores searchable text in Supabase, and downloads the BGE-M3 embedding model on first run. It fetches and chunks catalog sources on each run, but skips embedding and database replacement for sources whose extracted chunks have not changed. To process only a newly added or updated source, pass its exact catalog URL, for example `python ingest.py --url "https://www.moh.gov.sa/ministry/mediacenter/news/pages/news-2022-07-31-001.aspx"`. An unchanged source still needs to be fetched to detect remote edits. Retrieval uses up to `TOP_K` passages (default 8); when references are unavailable, Gemini can still answer with general health information under the safety policy and will disclose that no matching Awn reference was retrieved. `GEMINI_THINKING_LEVEL` is unset by default because supported values depend on the selected model; set it only after verifying model support. Tune `MAX_DISTANCE` only against a representative Arabic/English question set to balance coverage and relevance. Keep API keys and database credentials on the backend; do not place them in the Expo app. Use the app's local environment file only for public client configuration such as Supabase URL/key. Do not commit local `.env` files.

For the app's public Supabase settings, copy the root `.env.example` to `.env.local` and fill in the project URL and publishable key. Run `npm run typecheck` to check the TypeScript app before shipping changes. Voice dictation uses browser speech recognition on web; native iOS/Android builds do not currently include speech recognition.

## Patient data and safety

The app's booking flow currently saves appointment details in Awn's calendar after patient confirmation. It does not reserve or verify a slot with a real clinic. Patients must verify official availability through Sehhaty or the facility. Do not use real patient records until authentication, access controls, privacy, regulatory, and clinical safety reviews are complete. The RAG query log also needs an explicit retention/privacy policy before production use.
