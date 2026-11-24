# Prompts Log & Vibe Coding Reflection

This document contains the chronological record of the **8 core prompts given to the AI coding agent** to design, build, debug, and deploy the **Mister Cuts Salon Queue Management System**. It documents the exact prompt progression, including the prompts that produced errors or incorrect logic, how the AI was redirected, and the final reflection.

---

## Overview of the 8 Prompts

| # | Prompt Focus | Status / Result | Core Challenge / Outcome |
|---|---|---|---|
| **Prompt 1** | Monorepo Setup & Tech Stack | ⚠️ Produced native build error | Initial attempt triggered C++ compiler issues with `better-sqlite3`. |
| **Prompt 2** | Database Driver Redirection | ✅ Resolved successfully | Directed AI to pivot to zero-dependency SQLite WASM (`sql.js`). |
| **Prompt 3** | Customer Flow (Home, Join & Status) | ✅ Built successfully | Created Home, Join Queue with phone/service limits, and token tracking. |
| **Prompt 4** | Barber "Call Next" Queue Logic | ❌ Business logic bug | Simple FIFO caused Barber Amit to grab a customer reserved for Ravi. |
| **Prompt 5** | Queue Preference Rule Correction | ✅ Resolved & tested | Isolated logic in `queueRules.ts` with strict preference filtering. |
| **Prompt 6** | Reception Tablet & TV Waiting Kiosk | ⚠️ Minor layout glitch fixed | Built 2-column Reception and TV kiosk with synthetic Web Audio chime. |
| **Prompt 7** | Barber Mirror View & Owner Admin | ✅ Built successfully | Added live service stopwatch, station switcher, and PIN-protected admin. |
| **Prompt 8** | Gujarati i18n, Theme & Cloud Deploy | ✅ Finalized & deployed | Full English/Gujarati dictionary, Obsidian/Amber theme, and Render setup. |

---

## Detailed Chronological Prompts

### Prompt 1: Initial Monorepo Setup & Architecture
> **User Prompt to AI:**
> *"Hi Antigravity, let's build the Mister Cuts Salon Queue Management System based on the specifications in `AGENTS.md` and `docs/`. Start by setting up a monorepo with React + Vite + TypeScript for the frontend, Tailwind CSS for styling, and an Express backend with Socket.IO for real-time synchronization. Use SQLite for local persistence and add a health-check endpoint at `/api/health`."*

- **What the Agent Did**: Scaffolded the frontend and backend project structure, set up `package.json`, and attempted to install `better-sqlite3`.
- **What Went Wrong [DID NOT WORK]**: The terminal failed during `npm install better-sqlite3` on Windows Node.js v24 with a fatal `node-gyp` error (`VCINSTALLDIR not set, MSVC compiler missing`), blocking local execution.

---

### Prompt 2: Database Driver Redirection to SQLite WASM
> **User Prompt to AI:**
> *"The install failed with a node-gyp C++ compiler error on Windows. We cannot rely on native compilation tools. Please switch the database driver to `sql.js` (official SQLite compiled to WebAssembly) so the backend runs with zero native C++ build dependencies on any machine. Implement `server/src/db.ts` to write transactions to `salon.sqlite` and verify that `npm run dev` boots cleanly."*

- **What the Agent Did**: Replaced `better-sqlite3` with `sql.js`, initialized in-memory WASM SQLite with disk persistence to `salon.sqlite`, and created the initial schema for tickets, barbers, services, and salon settings.
- **Outcome [SUCCESS]**: The backend compiled cleanly with zero native dependencies, and `/api/health` returned `{"status":"ok"}`.

---

### Prompt 3: Customer Flow (Home, Join Queue & My Status)
> **User Prompt to AI:**
> *"Now let's build the customer-facing mobile experience:
> 1. Home screen (`/`) showing live waiting count, approximate wait time, barber status chips, and a token search bar.
> 2. Join Queue screen (`/join`) with Indian 10-digit phone number validation (`^[6-9]\d{9}$`), a 1-to-3 service selection limit, dynamic bill and duration calculation, and barber preference selection.
> 3. Generate sequential tokens (`S-1`, `S-2`...) and build the My Status screen (`/status/:id`) with real-time queue position, circular countdown ring, and an alert when the customer is 2nd in line."*

- **What the Agent Did**: Built `client/src/pages/Home.tsx`, `client/src/pages/JoinQueue.tsx`, and `client/src/pages/MyStatus.tsx` with mobile-first card design and real-time Socket.IO listeners.
- **Outcome [SUCCESS]**: Validation worked properly, duplicate active spots for the same phone number were rejected, and customer status updated live without manual page reloads.

---

### Prompt 4: Barber "Call Next" Endpoint
> **User Prompt to AI:**
> *"Now implement the queue management endpoint for barbers to call the next customer. When a barber calls next, find the earliest waiting ticket in the queue, assign it to that barber, set the status to 'serving', and broadcast the update to all connected clients via Socket.IO."*

- **What the Agent Did**: Created the `POST /api/queue/call-next` route using a standard database query: `SELECT * FROM tickets WHERE status = 'waiting' ORDER BY created_at ASC LIMIT 1`.
- **What Went Wrong [DID NOT WORK]**: During testing of Test Case TC-03, when Barber "Amit" called next, the system assigned him Customer 1, even though Customer 1 had explicitly requested Barber "Ravi". Simple FIFO violated the barber preference isolation rule.

---

### Prompt 5: Queue Business Logic Correction & Single Source of Truth
> **User Prompt to AI:**
> *"Wait, that broke the barber preference rule! If Customer 1 chose Barber Ravi, Barber Amit must NOT take them—Amit must skip them and take the next waiting customer who chose Amit or 'Any Barber'. 
> Please isolate all queue business logic into a single dedicated module `server/src/queueRules.ts` as the single source of truth. Implement `getNextEligibleTicket(tickets, barberId)`, enforce valid status transitions (`waiting` -> `serving` -> `done`/`no_show`/`cancelled`), and write automated unit tests covering all edge cases."*

- **What the Agent Did**: Refactored the backend architecture to route all queue state mutations through `queueRules.ts`. Created `tests/queueRules.test.ts` covering 8 unit test cases.
- **Outcome [SUCCESS]**: Barber preference isolation passed 100% of tests. When Amit calls next, Ravi's loyal customers remain protected at the top of the queue.

---

### Prompt 6: Reception Tablet Dashboard & Waiting Area TV Kiosk
> **User Prompt to AI:**
> *"Build the operational screens:
> 1. Reception Dashboard (`/reception`) tailored for a 10-inch landscape tablet: split into barber station progress cards on the left and a chronological waiting list on the right, with a [+ Add Walk-in] modal and amber badges for customers waiting over 60 minutes.
> 2. Waiting Area TV Display (`/display`) for a 1080p kiosk: high-contrast dark theme, active barber stations, upcoming tokens list, and an attention-grabbing gold flashing turn alert with an audio chime when a ticket is called."*

- **What the Agent Did**: Built `Reception.tsx` and `TvDisplay.tsx`. Implemented `AudioChime.ts` using the browser's native Web Audio API to synthesize a crystal bell tone without external MP3 files.
- **Glitch & Quick Fix**: On the TV screen, cards with multiple long services initially wrapped awkwardly over the "Now Serving" badge; the agent added responsive flexbox constraints and text truncation.
- **Outcome [SUCCESS]**: Multi-device sync verified across phone, tablet, and TV displays in real time.

---

### Prompt 7: Barber Mirror View & Owner Admin Dashboard
> **User Prompt to AI:**
> *"Build the remaining two screens:
> 1. Barber Mirror View (`/barber`) allowing station switching (Ravi, Amit, Imran), showing the current client with a live stopwatch, big [Start] and [Done] buttons, 'Next for you' preview, and an On Break toggle.
> 2. Owner Admin (`/admin`) protected by PIN `1234` with daily KPIs (Served, Avg Wait, Waiting, No-Shows), online queue open/closed toggle, full CRUD for salon services, and 1-click test queue seeding."*

- **What the Agent Did**: Implemented `BarberView.tsx` with dedicated mirror station controls and `OwnerSettings.tsx` with PIN authentication, operational controls, and service pricing editor.
- **Outcome [SUCCESS]**: Full 7-screen ecosystem completed with role-based access control and live stopwatch synchronization.

---

### Prompt 8: Bilingual Localization (Gujarati & English), Theme Polish & Deployment
> **User Prompt to AI:**
> *"Let's finalize the project for submission and production:
> 1. Add complete bilingual localization in English and Gujarati (ગુજરાતી) with a central dictionary and instant navbar toggle.
> 2. Rebrand the entire app to 'Mister Cuts' (મિસ્ટર કટ્સ) and elevate the styling to a luxury Obsidian Slate (`#0B0F17`) + Warm Amber Bronze (`#F59E0B`) palette.
> 3. Configure the Express backend to serve the production Vite frontend bundle on a single unified port, generate deployment files for Render, and provide the live demo link in `README.md`."*

- **What the Agent Did**: Created `client/src/i18n/translations.ts` and `LanguageContext.tsx`, rebranded all headers, labels, and badges to "Mister Cuts", polished the color scheme with glassmorphic cards, added `render.yaml` and `vercel.json`, and tested full production build.
- **Outcome [SUCCESS]**: Project achieved 100% test pass rate, unified static serving on port 3001, and live deployment on Render at `https://salon-management-1-i2dp.onrender.com/`.

---

## Half-Page Reflection

### 1. What Went Wrong / What The Agent Got Wrong

Working with the AI coding agent accelerated development, but required direct human intervention on three critical technical hurdles:

1. **Native C++ Build Dependency Failure (`better-sqlite3`)**:
   In Prompt 1, the agent chose `better-sqlite3` for persistence. On Windows with Node.js v24, this library attempted to trigger a native `node-gyp` C++ compilation because pre-built binaries were unavailable for that specific Node ABI. Since Visual Studio C++ Build Tools were not installed on the system, the build immediately crashed, stalling project setup.
   
2. **Naive FIFO Queue Logic Overriding Barber Preference**:
   In Prompt 4, the agent implemented the barber "Call Next" endpoint using an ordinary SQL `ORDER BY created_at ASC LIMIT 1`. While this satisfied simple FIFO queues, it violated the salon's core business rule: customers who selected a specific barber (e.g. Ravi) were being claimed by whichever barber became available first (e.g. Amit).

3. **TV Display Layout Overflow**:
   When rendering customer cards on the 1080p Waiting Area TV display, the agent initially used rigid height containers without wrapping. When a customer chose multiple long grooming services, the service tags overflowed the card boundaries and collided with the "Now Serving" pulsing gold badge.

---

### 2. How We Noticed It

- **Build Crash**: The terminal output immediately halted during dependency installation with `gyp ERR! find VS VCINSTALLDIR not set` and an exit status code of 1.
- **Test Case TC-03 Failure**: When running manual flow testing between two simulated browser tabs (Customer wanting Ravi vs. Barber Amit calling next), Amit’s station unexpectedly displayed Ravi’s customer.
- **Visual Inspection**: Testing the TV display route (`/display`) with dense demo seed data revealed badge collision and clipped text on 1080p kiosk viewports.

---

### 3. How We Fixed It

1. **Pivoted to Zero-Dependency WebAssembly SQLite (`sql.js`)**:
   In Prompt 2, we redirected the agent to replace `better-sqlite3` with `sql.js`. Because `sql.js` compiles SQLite directly to pure WebAssembly, it executes authentic relational SQL queries entirely within the V8 runtime without requiring native C++ build tools, Python, or Visual Studio installations. We wrapped it with an automated file-sync layer that writes the in-memory database to `salon.sqlite` on disk after every write operation, guaranteeing cross-platform portability.

2. **Single Source of Truth (`server/src/queueRules.ts`)**:
   In Prompt 5, we instructed the agent to extract all queue logic out of the route controllers into a pure, testable module. The `getNextEligibleTicket` function was redesigned:
   ```typescript
   export function getNextEligibleTicket(tickets: Ticket[], barberId: string): Ticket | undefined {
     const waiting = tickets.filter(t => t.status === 'waiting');
     return waiting.find(t => t.preferredBarberId === barberId || t.preferredBarberId === 'ANY');
   }
   ```
   If a customer selected Ravi, Amit's search skips them and selects the next eligible customer. We backed this with automated unit tests in `tests/queueRules.test.ts` to ensure 100% pass rates.

3. **Responsive Flexbox & Text Truncation**:
   We refactored the station cards in `TvDisplay.tsx` to utilize flexible auto-height containers, responsive gap utilities, and text truncation (`truncate max-w-[200px]`), ensuring clean aesthetics regardless of the number of selected services.
