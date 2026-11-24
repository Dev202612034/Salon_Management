# Mister Cuts — Salon Queue Management System

**Live Demo:** [Mister Cuts — Smart Salon Queue Management System](https://salon-management-1-i2dp.onrender.com/)  
**GitHub Repository:** [https://github.com/Dev202612034/Salon_Management](https://github.com/Dev202612034/Salon_Management)  
**Staff / Owner PIN:** `1234`

---

## What is Mister Cuts?

**Mister Cuts** is a modern, real-time salon queue management system. Customers can join the waiting queue remotely from their smartphones, track their live position and estimated wait time, and receive an alert when it's their turn.

All screens—customer phones, the reception tablet, barber stations, and the waiting lounge TV display—stay in sync in real time using **Socket.IO**.

---

## Key Features

- **Live Queue Tracking**: Customers see their real-time position, countdown timer, and turn alerts.
- **Smart Barber Preference**: Customers can choose their favorite barber (Ravi, Amit, Imran) or pick "Any Barber". The queue engine automatically routes customers fairly.
- **Bilingual (English & Gujarati)**: Instant one-click language toggle (**English** / **ગુજરાતી**) across all 7 screens.
- **Waiting Area TV Display**: 1080p kiosk screen with active stations, upcoming tokens, and a celebratory sound chime when a ticket is called.
- **Reception Tablet Dashboard**: 2-column layout to manage chair assignments, view walk-in guests, and flag long wait times (>60 mins).
- **Barber Mirror Station**: Clean mobile/tablet interface with a live stopwatch for tracking haircut duration and an "On Break" toggle.
- **Owner Admin Dashboard**: Protected by PIN `1234` to view daily KPIs (served, wait times, no-shows), toggle the queue, and manage services.

---

## The 7 Screens

| Screen | URL Path | Designed For | What It Does |
| :--- | :--- | :--- | :--- |
| **1. Home** | `/` | Mobile / Desktop | Live wait time, queue count, and token search |
| **2. Join Queue** | `/join` | Mobile Phone | Enter phone number, pick 1–3 services, choose barber |
| **3. My Status** | `/status/:id` | Mobile Phone | Live countdown ring, position tracker, and turn alert |
| **4. Reception** | `/reception` | Tablet / Laptop | Manage chairs, add walk-ins, mark no-shows |
| **5. Barber View** | `/barber` | Mobile / Tablet | Station stopwatch, call next client, break toggle |
| **6. Waiting TV** | `/display` | 1080p Kiosk TV | Lounge display with gold flash and audio chime |
| **7. Owner Admin** | `/admin` | Desktop / Tablet | Daily stats, salon settings, service CRUD (PIN: `1234`) |

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO (sub-second real-time sync)
- **Database**: SQLite WebAssembly (`sql.js`) with disk persistence (`salon.sqlite`) — zero native C++ dependencies
- **Audio**: Web Audio API (synthetic crystal bell chime)

---

## Quick Start (Run Locally)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm

### 1. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 2. Run Locally
```bash
npm run dev
```

The application will start concurrently:
- **Frontend**: http://localhost:5173
- **Backend API & WebSockets**: http://localhost:3001

---

## Running Tests

Run the automated test suite (checks queue rules, wait time calculations, and barber preferences):

```bash
npm test
```

---

## Project Structure

```
Salon_Management/
├── client/          # React frontend (Vite + Tailwind + TypeScript)
│   ├── src/pages/   # 7 application screens
│   └── src/i18n/    # English and Gujarati translations
├── server/          # Express backend, SQLite WASM, and Socket.IO hub
│   └── src/queueRules.ts # Single source of truth for queue rules
├── docs/            # Specifications and flow rules
├── tests/           # Automated test suite
├── prompts.md       # Chronological AI prompts log
├── reflection.md    # Half-page reflection (what went wrong & how we fixed it)
└── README.md        # Project documentation
```

---

## Deployment

The app is production-ready for unified hosting on **Render** or **Railway**:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (Express serves the built React app and WebSocket hub on a single port)

---

## Author & License

- **Author**: Dev Malhotra ([devmalhotra1311@gmail.com](mailto:devmalhotra1311@gmail.com))
- **License**: MIT
