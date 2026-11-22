# Prompts Log & Vibe Coding Reflection

This document contains all prompts executed in chronological order for the Salon Queue Management System, as required by the MSc IT TA Handout, including the half-page reflection.

---

## Chronological Prompts Log

### Prompt 1: Project Setup & Documentation
```markdown
Implement Step 1 only. Set up React + Vite + TypeScript + Tailwind, Express backend, SQLite and Socket.IO. Create a clean modular folder structure, configure concurrent local development scripts, add a backend health-check endpoint, and verify that frontend and backend both run on localhost. Do not build application screens yet. List changed files and test commands.
```
- **Outcome**: Created `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, `docs/03-flows-rules.md`, root `package.json`, and backend health check `/api/health`.

---

### Prompt 2: Home Screen & Join Queue
```markdown
Build Screen 1 (Home) and Screen 2 (Join Queue) from docs/02-screens.md with realistic salon services and 3 barbers (Ravi, Amit, Imran). Validate 10-digit Indian phone numbers and enforce the 3-service maximum limit. Live summary must calculate total duration, estimated bill, and expected wait time dynamically. Apply charcoal (#111827 / #1F2937) + gold (#D4AF37 / #F59E0B) luxury theme. Ensure touch targets are at least 44px on phone screens.
```
- **Outcome**: Built `client/src/pages/Home.tsx` and `client/src/pages/JoinQueue.tsx` with full service selection, barber chips, live counter cards, and validation.

---

### Prompt 3: Token Generation & My Status Screen
```markdown
Implement order placement and Customer My Status from docs/02-screens.md and docs/03-flows-rules.md. After Confirm, assign sequential daily token (S-1, S-2...) and navigate to /status/:id. Show live queue position, circular countdown visualizer with estimated wait time, 'Start coming to the salon' alert at 2nd in line, and celebratory full-screen gold alert with synthetic chime when called. Allow cancellation only while Waiting. Prevent duplicate active spots for the same phone number.
```
- **Outcome**: Implemented `server/queueRules.ts`, `server/db.ts`, and `client/src/pages/MyStatus.tsx` with celebratory full-screen modal, countdown ring, and cancellation dialog.

---

### Prompt 4: Reception Dashboard
```markdown
Build the Reception Dashboard at /reception for a 10-inch tablet in landscape. Create barber station cards on the left showing current customer, live elapsed service timer, progress bar, and [Call next] action. On the right, display the chronological waiting list with token, customer details, services, preferred barber, and elapsed wait time. Highlight customers waiting > 60 minutes in amber. Add a [+ Add Walk-in] quick modal form and [Mark No-Show] / [Cancel] controls. Keep all clients in sync via Socket.IO.
```
- **Outcome**: Built `client/src/pages/Reception.tsx` with 2-column split, search filter, walk-in modal, and real-time updates.

---

### Prompt 5: Barber Mirror View & Waiting Area TV Display
```markdown
Build Barber View (/barber/:name) and Waiting Area TV Display (/display). Barber View must allow switching between Ravi, Amit, and Imran, display current customer with live stopwatch, big [Start] and [Done] buttons, 'Next for you' preview, and On Break / Available toggle. TV Display must be optimized for 1920x1080 kiosk mode with dark background, showing active barber stations ('Now Serving'), newly-called token gold flash animation, synthetic chime audio, and the next 5 upcoming tokens with wait estimates.
```
- **Outcome**: Built `client/src/pages/BarberView.tsx`, `client/src/pages/TvDisplay.tsx`, and `client/src/components/AudioChime.ts`.

---

### Prompt 6: Owner Admin Settings
```markdown
Build Screen 7 (/admin) as the Owner Dashboard protected by 4-digit PIN (1234). Implement today's stats cards (Served Today, Avg Wait, Waiting Now, No-Shows/Cancelled). Add Online Queue Open/Closed toggle with custom message. Add Barbers On Duty toggles. Implement full CRUD and enable/disable toggle for salon services (Name EN/GU, duration, price, category). Add quick demo data seeding and queue reset utilities for evaluator testing.
```
- **Outcome**: Built `client/src/pages/OwnerSettings.tsx` with PIN screen, KPI stats, operational controls, and service editor.

---

### Prompt 7: Bi-lingual Gujarati / English Localization & Rule Auditing
```markdown
Implement central EN/GU dictionary in client/src/i18n/translations.ts and LanguageContext.tsx. Verify every label, button, badge, and notification translates accurately between English and Gujarati without overflow. Add automated unit test suite covering all 12 checklist items in docs/03-flows-rules.md (service multi-select, phone validation, barber preference isolation where Amit skips Ravi-preferred customers, forward-only status transitions, and stats calculations).
```
- **Outcome**: Created `translations.ts` with comprehensive Gujarati vocabulary, `LanguageContext.tsx` with instant toggle, and `tests/queueRules.test.ts` (8 passing unit tests).

---

### Prompt 8: Deployment Preparation & Verification
```markdown
Prepare the project for 1-click cloud deployment on Render, Railway, and Vercel. Ensure Express server serves client/dist in production on one unified port with zero CORS or WebSocket domain mismatch issues. Add render.yaml, vercel.json, and write README.md with live demo link and test credentials at the very top.
```
- **Outcome**: Added `render.yaml`, `vercel.json`, unified production serving in `server/index.ts`, and `README.md`.

---

## Half-Page Reflection

### 1. What Went Wrong / What The Agent Got Wrong
When initially configuring the SQLite storage engine, the agent attempted to use `better-sqlite3`. On Windows with Node.js v24, `better-sqlite3` lacked pre-built binary wheels and defaulted to a native C++ `node-gyp` rebuild, which failed because Visual Studio C++ Build Tools were not installed on the host machine. 

Furthermore, in the barber assignment logic, an early version of the "Call Next" function simply picked the earliest waiting ticket without strictly verifying whether that ticket specifically requested another barber (e.g. if a customer had selected "Ravi", Barber "Amit" was able to call them).

### 2. How We Noticed It
- **Database Build Failure**: The console logged an `EPERM` / `node-gyp rebuild` error during `npm install better-sqlite3`.
- **Barber Preference Logic Bug**: While reviewing the test scenario for TC-03 ("Amit calls next while Customer 1 chose Ravi"), we noticed that without an explicit barber constraint check in the queue rules, Amit would incorrectly take Ravi's loyal client.

### 3. How We Fixed It
1. **Zero-Dependency SQLite WASM (`sql.js`)**: Instead of relying on native C++ compilation modules that fail across different Node.js environments and OS architectures, we swapped to `sql.js` (official SQLite compiled to WebAssembly by the SQLite core team). It executes authentic SQLite SQL queries (`CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`), persists directly to disk as `salon.sqlite`, and runs seamlessly on Windows, Linux, Docker, Render, and Railway without compilation tools.
2. **Strict Queue Business Logic (`server/queueRules.ts`)**: We codified the rule into a pure, testable function `getNextEligibleTicket(tickets, barberId)`:
   ```ts
   for (const t of waitingTickets) {
     if (t.preferredBarberId === barberId || t.preferredBarberId === 'ANY') {
       return t;
     }
   }
   ```
   If a customer requested Ravi, Amit's search skips them automatically and selects the next customer who chose Amit or "Any". We added an automated test in `tests/queueRules.test.ts` which verified this behavior with 100% pass rate.
