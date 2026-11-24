# AI Prompts Used for Salon Queue Management System Development

### Prompt 1: Project Planning and Initial Setup

Create a modern Salon Queue Management System using React, TypeScript, Node.js, Express.js and Tailwind CSS. The system should help salon owners manage customer queues digitally instead of using manual registers. Design a clean, premium-looking interface with a professional salon theme. Organize the project with separate frontend and backend folders and establish a proper project structure.

### Prompt 2: Admin Dashboard Development

Build an admin dashboard for the salon owner. Include statistics such as total customers, waiting customers, currently serving customers and completed services. Allow the admin to view the customer queue, call the next customer, mark a service as completed, skip a customer and manage queue entries. Use attractive statistic cards, a sidebar navigation system and an easy-to-understand interface.

### Prompt 3: Customer Queue Registration

Create a customer registration interface where customers can enter their name, mobile number and select the salon service they require. After registration, automatically generate a unique queue token number. Display the customer's token number, current position in the queue and estimated waiting time. Ensure that the interface is simple, user-friendly and mobile-responsive.

### Prompt 4: Real-Time Queue Management

Implement real-time queue synchronization using Socket.IO. Whenever the admin calls the next customer, completes a service or skips a customer, automatically update the queue on all connected customer and display screens without requiring a page refresh. Handle connection and disconnection events properly to maintain synchronization between the frontend and backend.

### Prompt 5: TV Display Screen

Create a dedicated TV Display page for the salon. Display the currently serving token number prominently along with the next customers waiting and their queue numbers. Use large readable typography, a professional layout and a full-screen design suitable for displaying on a television. Synchronize all displayed information in real time using Socket.IO.

### Prompt 6: Backend and Database Integration

Develop the backend using Node.js and Express.js. Use SQLite through sql.js to store customer information, queue entries and service details. Create APIs for customer registration, retrieving queue information, updating customer status and managing the queue. Organize the backend code properly and implement appropriate error handling and input validation.

### Prompt 7: UI Improvements and Responsiveness

Improve the entire salon management application with a premium, modern and consistent design. Use Tailwind CSS, clean typography, attractive cards, subtle animations, proper spacing and intuitive navigation. Make all pages responsive for mobile phones, tablets, laptops and large TV screens. Maintain consistent styling throughout the application and ensure a smooth user experience.

### Prompt 8: Testing and Deployment

Review the complete Salon Queue Management System and fix frontend, backend, TypeScript and API integration errors. Test customer registration, admin queue operations, real-time synchronization and TV display functionality. Prepare the application for production deployment on Render. Configure the appropriate production build and start commands, environment variables and server port handling. Ensure the application works correctly in the production environment.

---

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Real-Time Communication:** Socket.IO
- **Database:** SQLite (sql.js)
- **Build Tool:** Vite
- **Deployment:** Render

---

## Half-Page Reflection

### 1. What Went Wrong / What The Agent Got Wrong

Working with an AI coding agent significantly accelerated development, but required careful human debugging on three key technical obstacles:

1. **Native C++ Build Failure with SQLite (`better-sqlite3`)**:
   In initial iterations, the agent attempted to use `better-sqlite3` for persistence. On Windows with Node.js v24, this dependency required a native C++ `node-gyp` rebuild because pre-compiled binary wheels were not available. Because Visual Studio C++ Build Tools were not installed, `npm install` crashed immediately.

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
