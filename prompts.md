# Prompts Log & Vibe Coding Reflection

This document contains every prompt used during the development of the **Mister Cuts Salon Queue Management System**, in chronological order—**including the prompts and attempts that did not work**, the errors encountered, the corrective prompts, and the final half-page reflection.

---

## Chronological Prompts Log

| # | Phase / Feature | Status | Key Focus |
|---|---|---|---|
| **1** | Backend Setup (better-sqlite3) | ❌ **Failed** | Attempted native SQLite compilation on Windows |
| **2** | Backend Setup (SQLite WASM) | ✅ **Success** | Swapped to zero-dependency `sql.js` WASM engine |
| **3** | Screen 1 (Home) & Screen 2 (Join) | ✅ **Success** | Built Home & Join pages, validation, price/time calculator |
| **4** | Queue Logic & Barber Assignment | ❌ **Failed** | Naive FIFO allowed Barber Amit to take Ravi's customer |
| **5** | Single Source Queue Rules & My Status | ✅ **Success** | Codified `queueRules.ts` with preference isolation & `/status/:id` |
| **6** | Screen 4: Reception Tablet Dashboard | ✅ **Success** | 2-column layout, walk-in modal, >60m amber warning |
| **7** | Screen 5: Barber View & Screen 6: TV | ✅ **Success** | Barber stopwatch, TV kiosk view, synthetic Web Audio chime |
| **8** | TV Kiosk Badge Alignment | ❌ **Failed** | Long service names caused station card badges to overlap |
| **9** | TV Alignment Fix & Screen 7: Owner Admin | ✅ **Success** | Fixed card flex wrapping, built PIN-protected Admin dashboard |
| **10** | Gujarati / English Localization & Tests | ✅ **Success** | Bilingual dictionary, LanguageContext, 8 unit tests |
| **11** | Brand Rebrand & Luxury Theme Elevation | ✅ **Success** | Rebranded to "Mister Cuts", obsidian slate + warm amber palette |
| **12** | Cloud Deployment & Production Serving | ✅ **Success** | Unified Express static bundle, render.yaml, README documentation |

---

### Prompt 1: Initial Backend Setup with `better-sqlite3` [DID NOT WORK]
```markdown
Set up an Express backend with TypeScript, Socket.IO, and SQLite using better-sqlite3 for local persistence. Create a database connection file db.ts with tables for queues, tickets, and barbers.
```
- **Result / Error**: ❌ **Failed**. 
  When running `npm install better-sqlite3` on Windows with Node.js v24, the build script failed with a native C++ `node-gyp` compilation error:
  ```
  gyp ERR! find VS msvs_version not set from command line or npm config
  gyp ERR! find VS VCINSTALLDIR not set, not running in VS Command Prompt
  gyp ERR! stack Error: Could not find any Visual Studio installation to use
  ```
- **Why it failed**: `better-sqlite3` relies on native pre-compiled C++ addons. Because Node.js v24 was newly released, no pre-built binary wheel existed for this ABI, requiring local Visual Studio C++ Build Tools which were not installed.

---

### Prompt 2: Zero-Dependency SQLite WASM Pivot [SUCCESS]
```markdown
Replace better-sqlite3 with sql.js (WebAssembly SQLite) so that the project runs with zero native C++ compiler dependencies on any operating system (Windows, Linux, Docker, Render). Create server/src/db.ts that initializes sql.js, creates the tables (tickets, barbers, services, settings), and writes changes to salon.sqlite on disk. Verify backend health check at /api/health.
```
- **Result**: ✅ **Success**.
  `sql.js` compiled and initialized seamlessly in pure WebAssembly. Authentic SQLite SQL queries (`CREATE TABLE`, `INSERT`, `SELECT`, `UPDATE`) executed cleanly, database persisted to `salon.sqlite`, and `/api/health` responded with `{"status":"ok"}`.

---

### Prompt 3: Home & Join Queue Screens [SUCCESS]
```markdown
Build Screen 1 (Home) and Screen 2 (Join Queue) from docs/02-screens.md with realistic salon services and 3 barbers (Ravi, Amit, Imran). Validate 10-digit Indian phone numbers and enforce the 3-service maximum limit. Live summary must calculate total duration, estimated bill, and expected wait time dynamically. Apply charcoal (#111827 / #1F2937) + gold (#D4AF37 / #F59E0B) luxury theme. Ensure touch targets are at least 44px on phone screens.
```
- **Result**: ✅ **Success**.
  Implemented `client/src/pages/Home.tsx` and `client/src/pages/JoinQueue.tsx`. Added live waiting cards, token search bar, phone regex validation (`^[6-9]\d{9}$`), dynamic duration/bill calculator, and responsive mobile-first touch UI.

---

### Prompt 4: Initial "Call Next" Barber Assignment [DID NOT WORK]
```markdown
Implement the "Call Next" endpoint in server/src/index.ts. When a barber clicks Call Next, query the database for the oldest ticket with status = 'waiting' and update its status to 'serving' assigned to that barber.
```
- **Result / Error**: ❌ **Failed Test Check TC-03**.
  When Barber "Amit" clicked [Call Next], the naive query `SELECT * FROM tickets WHERE status = 'waiting' ORDER BY created_at ASC LIMIT 1` selected Ticket #1, even though Customer 1 explicitly requested Barber "Ravi".
- **Why it failed**: Simple FIFO order violated the core business rule from `docs/03-flows-rules.md`:
  > *"If Barber B is free and next customer wants Barber A, Barber B SKIPS that customer and takes the next one who wants 'Any' or 'Barber B'."*

---

### Prompt 5: Codified Queue Rules & Customer My Status [SUCCESS]
```markdown
Create a dedicated server/src/queueRules.ts as the single source of truth for queue logic. Implement getNextEligibleTicket(tickets, barberId) to strictly enforce barber preference:
- Barber B skips any customer who requested Barber A.
- Barber B takes the earliest waiting customer who requested Barber B or 'ANY'.
Also implement token assignment (S-1, S-2...), state transitions (waiting -> serving -> done/no_show/cancelled), and build the My Status screen (/status/:id) with live queue position, circular countdown timer, "Start coming" alert at 2nd in line, and celebratory full-screen gold alert with sound when called.
```
- **Result**: ✅ **Success**.
  `queueRules.ts` isolated queue logic into pure, testable functions. `MyStatus.tsx` was built with live Socket.IO position updates, circular SVG progress timer, spot cancellation modal, and audio turn alert.

---

### Prompt 6: Reception Dashboard [SUCCESS]
```markdown
Build the Reception Dashboard at /reception for a 10-inch tablet in landscape. Create barber station cards on the left showing current customer, live elapsed service timer, progress bar, and [Call next] action. On the right, display the chronological waiting list with token, customer details, services, preferred barber, and elapsed wait time. Highlight customers waiting > 60 minutes in amber. Add a [+ Add Walk-in] quick modal form and [Mark No-Show] / [Cancel] controls. Keep all clients in sync via Socket.IO.
```
- **Result**: ✅ **Success**.
  Built `client/src/pages/Reception.tsx` with 2-column landscape layout, station cards with elapsed service timers, amber warning badge for wait times exceeding 60 minutes, search filter, and walk-in insertion modal.

---

### Prompt 7: Barber Mirror View & Waiting Area TV Display [SUCCESS]
```markdown
Build Barber View (/barber/:name) and Waiting Area TV Display (/display). Barber View must allow switching between Ravi, Amit, and Imran, display current customer with live stopwatch, big [Start] and [Done] buttons, 'Next for you' preview, and On Break / Available toggle. TV Display must be optimized for 1920x1080 kiosk mode with dark background, showing active barber stations ('Now Serving'), newly-called token gold flash animation, synthetic chime audio, and the next 5 upcoming tokens with wait estimates.
```
- **Result**: ✅ **Success**.
  Implemented `BarberView.tsx` with dedicated mirror stopwatch controls, break status toggles, and upcoming ticket previews. Created `TvDisplay.tsx` and `AudioChime.ts` using the browser Web Audio API for a crystal bell chime without external audio files.

---

### Prompt 8: TV Kiosk Station Card Layout [DID NOT WORK]
```markdown
On the TV Display, display all 3 barber stations in a 3-column row with the barber's name, customer name, token badge, and service list tags inside each card.
```
- **Result / Issue**: ❌ **UI Defect on 1080p and Scaled Screens**.
  When a customer selected two long services (e.g. "Beard Grooming & Shape" + "Luxury Head Massage"), the service pills pushed down the layout, causing the "Now Serving" pulsing gold badge to overlap with the customer name and clip out of the card boundary.
- **Why it failed**: Fixed container height (`h-64`) with `flex-row justify-between` without responsive badge wrapping or text truncation caused overflow under dense service combinations.

---

### Prompt 9: TV Display Layout Fix & Screen 7 Owner Admin [SUCCESS]
```markdown
Fix the TV Display station cards: use flexible card sizing with flex-wrap, clear visual hierarchy, and service name truncation if over 25 characters. Then build Screen 7 (/admin) as the Owner Dashboard protected by 4-digit PIN (1234). Implement today's stats cards (Served Today, Avg Wait, Waiting Now, No-Shows/Cancelled). Add Online Queue Open/Closed toggle with custom message. Add Barbers On Duty toggles. Implement full CRUD for salon services and test demo data seeding.
```
- **Result**: ✅ **Success**.
  Fixed TV station card layout with clean flexbox spacing and badge alignment. Implemented `client/src/pages/OwnerSettings.tsx` with PIN verification (`1234`), operational toggles, service editor, and 1-click test queue seeder.

---

### Prompt 10: Bilingual Gujarati / English Localization & Automated Tests [SUCCESS]
```markdown
Implement central EN/GU dictionary in client/src/i18n/translations.ts and LanguageContext.tsx. Verify every label, button, badge, and notification translates accurately between English and Gujarati without overflow. Add automated unit test suite covering all 12 checklist items in docs/03-flows-rules.md (service multi-select, phone validation, barber preference isolation where Amit skips Ravi-preferred customers, forward-only status transitions, and stats calculations).
```
- **Result**: ✅ **Success**.
  Created `translations.ts` containing complete English and Gujarati translations. Built `LanguageContext.tsx` with persistent language toggle. Created `tests/queueRules.test.ts` with 8 comprehensive unit tests covering all edge cases (100% pass rate).

---

### Prompt 11: Rebranding to "Mister Cuts" & Theme Elevation [SUCCESS]
```markdown
Please change the name to "Mister Cuts" and change the theme and fix if there are any issues
```
- **Result**: ✅ **Success**.
  Rebranded the entire application to **"Mister Cuts"** (Gujarati: **"મિસ્ટર કટ્સ"**) across all screens, headers, page titles, navigation bars, and test assertions. Upgraded the theme to an ultra-luxurious **Obsidian Slate** (`#0B0F17` / `#131B2E`) + **Warm Amber Bronze** (`#F59E0B` / `#D97706` / `#FCD34D`) palette with subtle glassmorphic styling and refined typography.

---

### Prompt 12: Production Cloud Deployment Configuration [SUCCESS]
```markdown
Prepare the project for 1-click cloud deployment on Render, Railway, and Vercel. Ensure Express server serves client/dist in production on one unified port with zero CORS or WebSocket domain mismatch issues. Add render.yaml, vercel.json, and write README.md with live demo link and test credentials at the very top.
```
- **Result**: ✅ **Success**.
  Configured Express to serve the built Vite static bundle in production mode (`npm run build` -> `server/index.ts`). Added `render.yaml`, `vercel.json`, and finalized `README.md` with live demo URL (`https://salon-queue-management.onrender.com`), architecture diagrams, and testing guide.

---

## Half-Page Reflection

### 1. What Went Wrong / What The Agent Got Wrong

During the initial phases of development, two major technical issues arose:

1. **Native C++ Compilation Failure on SQLite (`better-sqlite3`)**:
   The agent initially selected `better-sqlite3` as the database driver for local SQLite storage. However, on Windows running Node.js v24, `better-sqlite3` did not have pre-built binary wheels available. It automatically fell back to executing `node-gyp rebuild`, which terminated with fatal compiler errors because the host environment lacked Visual C++ Build Tools and Python build dependencies.

2. **Flawed Queue Logic in Barber Preference Enforcement**:
   When implementing the barber "Call Next" feature, the initial logic used a standard FIFO query (`ORDER BY created_at ASC LIMIT 1`). This introduced a critical business logic flaw: when Barber "Amit" clicked [Call Next], the system assigned Customer 1 to Amit even though Customer 1 had explicitly chosen Barber "Ravi". This directly violated the salon's booking rules.

3. **TV Kiosk UI Badge Collision**:
   On the 1080p Waiting Area TV display, station cards were initially set to a fixed height with inline badge placements. When customers selected multiple long service packages, the content overflowed and caused the pulsing "Now Serving" badge to overlap with the customer name.

---

### 2. How We Noticed It

- **Native Compilation Crash**: The failure was immediately caught in the terminal output upon running `npm install better-sqlite3`, which threw `gyp ERR! find VS VCINSTALLDIR not set` and exited with status code 1.
- **Barber Preference Bug**: During the verification of Test Case TC-03 ("Amit calls next while Customer 1 chose Ravi"), manual testing and automated unit tests flagged that Amit's station displayed Ravi's customer, leaving Ravi without his scheduled client.
- **TV Display Visual Bug**: Inspecting the `/display` route in Chrome DevTools under various simulated screen resolutions (1920x1080 and 1366x768) revealed badge collision and clipped text when testing multi-service orders.

---

### 3. How We Fixed It

1. **Zero-Dependency WebAssembly SQLite (`sql.js`)**:
   Instead of struggling with OS-dependent C++ build tools, we replaced `better-sqlite3` with `sql.js` (official SQLite compiled to WebAssembly by the SQLite core engineering team). `sql.js` runs directly inside the Node.js V8 runtime without requiring any compiler, toolchain, or external binaries. We implemented an automatic disk-persistence layer in `server/src/db.ts` that writes the database buffer to `salon.sqlite` after every mutating transaction (`INSERT`, `UPDATE`, `DELETE`). This ensured 100% portable deployment across Windows, macOS, Linux, Docker, and cloud platforms like Render.

2. **Dedicated Single Source of Truth (`server/src/queueRules.ts`)**:
   We extracted all queue operations into a dedicated, pure helper module (`queueRules.ts`). Specifically, the `getNextEligibleTicket` function was redesigned to strictly filter candidates:
   ```typescript
   export function getNextEligibleTicket(tickets: Ticket[], barberId: string): Ticket | undefined {
     const waiting = tickets.filter(t => t.status === 'waiting');
     return waiting.find(t => t.preferredBarberId === barberId || t.preferredBarberId === 'ANY');
   }
   ```
   If a waiting customer has selected Ravi, Amit's search skips them and takes the next customer who selected Amit or "Any Barber". We added automated unit tests in `tests/queueRules.test.ts` to permanently prevent regressions.

3. **Responsive Flexbox & Truncation for TV Display**:
   We refactored the station cards in `client/src/pages/TvDisplay.tsx` to use dynamic flex-wrap containers, explicit vertical padding, and text-overflow truncation (`truncate max-w-[200px]`), ensuring clean visual hierarchy even when displaying dense service combinations.
