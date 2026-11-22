# AGENTS.md — Salon Queue Management System

Queue app for a salon: customers join from their phone, see wait time, get called; reception and barbers manage the queue; waiting area TV display.

## Read First
- `docs/01-brief.md` -> features + what NOT to build
- `docs/02-screens.md` -> every screen's layout, elements, and behavior
- `docs/03-flows-rules.md` -> flows, queue rules, state transitions, test checklist

## Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: Express + SQLite + Socket.IO (keeps phone, tablet, and TV in real-time sync)
- Theme: Dark charcoal (`#111827` / `#1F2937`) + Gold accent (`#D4AF37` / `#F59E0B`), elegant salon aesthetics, rounded cards (`rounded-2xl`)
- Bilingual: English (EN) and Gujarati (GU) language support across all screens with central dictionary
- Run Command: `npm run dev` (runs both client and server concurrently)
- Test Command: `npm test`

## Hosting
- Frontend & Backend: Unified Express server serving React static bundle + Socket.IO, or Frontend on Vercel and Backend on Render/Railway.
- Live link must be the first line after the title in `README.md`.

## How to Work
- Follow the 8-step build plan cleanly.
- One screen or feature per task.
- Queue business logic lives in ONE dedicated module (`server/src/queueRules.ts` & shared types) to ensure single source of truth.
- All user-facing text sourced from the EN/GU translation system.
- Never add features from the 'Don't build' list (no online payment, no future-date appointments, no SMS/WhatsApp gateway, no loyalty, no multi-branch).
- Verify every feature against the test checklist.
