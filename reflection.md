# Half-Page Reflection: Vibe Coding & AI-Assisted Development

## Mister Cuts — Salon Queue Management System

### 1. What Went Wrong / What The Agent Got Wrong

Working with an AI coding agent significantly accelerated development, but required careful human debugging on three key technical obstacles:

1. **Native C++ Build Failure with SQLite (`better-sqlite3`)**:
   In initial iterations, the agent attempted to use `better-sqlite3` for persistence. On Windows with Node.js v24, this dependency required a native C++ `node-gyp` rebuild because pre-compiled binary wheels were not available. Because Visual Studio C++ Build Tools were not installed on the system, `npm install` crashed immediately.

2. **Naive FIFO Queue Logic Overriding Customer Barber Preferences**:
   During queue logic development, the agent initially implemented the "Call Next" endpoint using a plain FIFO query (`ORDER BY created_at ASC LIMIT 1`). When Barber Amit called next, the system assigned him Customer 1 even though Customer 1 explicitly chose Barber Ravi, violating the salon's core preference rule.

3. **TV Display Layout Overflow on Multi-Service Tickets**:
   On the 1080p Waiting Area TV display, station cards were initially set to rigid heights. When customers selected multiple long services, the badges overflowed their cards and collided with the pulsing "Now Serving" indicator.

---

### 2. How We Noticed It

- **Compiler Error in Terminal**: `better-sqlite3` build failed with `gyp ERR! find VS VCINSTALLDIR not set` and exited with status code 1.
- **Verification Testing (TC-03)**: Testing the barber workflow in multiple browser tabs revealed that Amit took Ravi's customer instead of skipping to the next available "Any" or "Amit" ticket.
- **DevTools Viewport Inspection**: Testing the `/display` TV route under dense demo data showed text clipping and badge overlapping.

---

### 3. How We Fixed It

1. **Swapped to Zero-Dependency WebAssembly SQLite (`sql.js`)**:
   We directed the agent to replace `better-sqlite3` with `sql.js`. Because `sql.js` runs authentic SQLite compiled directly to pure WebAssembly, it executes seamlessly inside the V8 engine without requiring any C++ compiler, toolchains, or platform-specific binaries. We added automated disk persistence to `salon.sqlite` after mutating queries.

2. **Dedicated Single Source of Truth (`server/src/queueRules.ts`)**:
   We extracted all queue business logic into a pure, testable module with `getNextEligibleTicket(tickets, barberId)`. When a barber calls next, the function automatically skips any waiting customer whose preferred barber is someone else, taking only customers who chose that barber or "Any Barber". We added automated unit tests in `tests/queueRules.test.ts` to guarantee 100% test passing.

3. **Responsive Flexbox & Text Truncation for TV Display**:
   We updated the station cards in `TvDisplay.tsx` with dynamic auto-height containers, responsive gap utilities, and text truncation (`truncate max-w-[200px]`), ensuring clean rendering across all viewport sizes.
