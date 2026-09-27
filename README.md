# عون (Awn)

Smart healthcare navigation assistant — Expo + React Native prototype for a Ministry of Health AI challenge demo.

Awn helps beneficiaries ask, get guided, and understand health information in simple language. It does **not** diagnose or replace clinicians. Requests that need medical judgment go to a specialist dashboard for approval.

## Run

```bash
npm start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

## Structure

- `src/services/ai.ts` — intent routing (swap for a real model later)
- `src/store.tsx` — in-memory state (swap for APIs)
- `src/data/seed.ts` — mock appointments, prescriptions, facilities, requests
- `src/i18n.ts` — Arabic / English strings with RTL in UI
