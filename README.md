# عون (Aoun)

Smart healthcare navigation assistant — Expo + React Native prototype for a Ministry of Health AI challenge demo.

Aoun helps beneficiaries ask, get guided, and understand health information in simple language. It does **not** diagnose or replace clinicians. Requests that need medical judgment go to a specialist dashboard for approval.

## Run

```bash
npm start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

## Demo path

1. Enter as **Beneficiary**.
2. Open **Ask Me**, tap the mic, choose: `ما أعرف أي تخصص أحتاج`.
3. Answer the three questions (non-urgent).
4. Switch role → **Specialist**, open the new request, **Approve**.
5. Back to beneficiary: notification → **Choose appointment**.
6. After booking, open **Medications** and the **map** (availability is labeled demo data).

## Structure

- `src/services/ai.ts` — intent routing (swap for a real model later)
- `src/store.tsx` — in-memory state (swap for APIs)
- `src/data/seed.ts` — mock appointments, prescriptions, facilities, requests
- `src/i18n.ts` — Arabic / English strings with RTL in UI
