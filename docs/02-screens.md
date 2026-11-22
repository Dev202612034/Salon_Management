# Salon Queue Management System — Screens & Features

This document specifies all 7 screens of the application.

---

## Screen 1: Home (`/`)
- **Target User**: Salon customers on their smartphones or walk-in arrivals scanning a QR code.
- **Header**:
  - Salon branding: "Royal Shave Salon / રાજવી સલૂન" with scissors/crown icon.
  - Salon status badge: `Open · Closes 9:00 PM` (or `Closed · Queue paused` if owner closed queue).
  - Language toggle button (`EN | GU`).
  - Navigation links / Quick switch pill for testing (`Join`, `Reception`, `Barber`, `TV Display`, `Admin`).
- **Live Queue Hero Card**:
  - Large headline: `Live Queue Status`.
  - Counter badge: e.g. `4 people waiting · ~35 min wait`.
  - Quick summary of active barbers on duty with status chips:
    - Ravi (Busy - in chair)
    - Amit (Free - ready)
    - Imran (On Break)
- **Primary Call to Action**:
  - Big prominent gold button: `[ Join Queue / કતારમાં જોડાઓ ]` (disabled with clear banner if queue is closed).
- **Secondary Actions**:
  - `[ Check Existing Token / મારું ટોકન તપાસો ]` quick lookup by phone number or token ID.
  - Salon location and hours info card.

---

## Screen 2: Join Queue (`/join`)
- **Target User**: Customer joining the queue on mobile.
- **Elements (Top to Bottom)**:
  1. Header with back link to Home and EN/GU toggle.
  2. Step 1: Customer Details:
     - Name input (required, validated).
     - Phone number input (10 digits strictly validated with error state).
  3. Step 2: Select Services (multi-select, minimum 1, maximum 3):
     - Interactive service cards displaying name, duration, and price:
       - Haircut (વાળ કાપવા) · 30 min · ₹150
       - Beard Trim / Shave (દાઢી સેટિંગ) · 15 min · ₹80
       - Hair Spa & Wash (હેર સ્પા) · 45 min · ₹400
       - Head Massage (માલિશ) · 20 min · ₹120
       - Royal Facial & Clean-up (ફેશિયલ) · 40 min · ₹350
     - Shows selected counter (e.g. `2 / 3 selected`).
  4. Step 3: Choose Barber:
     - "Any Barber (Fastest) / કોઈપણ વાણંદ (સૌથી ઝડપી)" recommended default card.
     - Individual barber cards with photo/avatar, name, and current status chip (`Free` or `Busy`). If barber is on break, card shows "On Break".
  5. Live Summary Box (Sticky bottom on mobile or fixed summary card):
     - `Total Services: 2`
     - `Total Duration: 45 min`
     - `Total Estimated Price: ₹230`
     - `Estimated Wait Time: ~30 min`
  6. Action Button:
     - Gold button: `[ Confirm & Get Token / ટોકન મેળવો ]`.
- **Validation & Edge Cases**:
  - If phone number already has an active ticket (`WAITING`, `CALLED`, or `IN_CHAIR`), alert user and offer link to existing token: `You already have an active ticket (S-X). View Status`.
  - Max 3 services limit enforced with tooltip message if user tries to pick 4th.
  - If queue closed by owner, show message: `Online queue joining is currently closed. Walk-ins available at counter.`

---

## Screen 3: My Status (`/status/:id`)
- **Target User**: Customer tracking their turn live from their phone (at home, nearby cafe, or waiting sofa).
- **Elements**:
  - Token badge: Large gold display `Token S-14`.
  - Customer name & chosen barber name (or "Any Available Barber").
  - Current queue status:
    - Position: e.g. `4th in line` (or `You are next!`).
    - Circular countdown visualizer showing estimated waiting time (e.g. `~35 min`).
    - Service list summary + total bill estimate.
  - **Dynamic State Banners**:
    - **Position > 2**: Calm status: `Relax, we'll notify you as your turn approaches.`
    - **Position == 2 ("Start Coming")**: Prominent amber alert banner: `⚡ Start coming to the salon! Only 1 customer ahead of you.`
    - **Position == 1 / CALLED ("It's your turn!")**: Full-screen luxury gold celebratory modal / banner with pulsing glow and chime: `🎉 It's your turn! Please proceed to chair: [Barber Name]`.
    - **IN_CHAIR**: Green badge: `Currently in chair with [Barber Name]`.
    - **DONE**: Completed celebration card: `Service finished. Thank you for visiting Royal Shave Salon!`
  - **Cancel Option**:
    - Red outlined button: `[ Cancel My Spot / મારી જગ્યા રદ કરો ]`.
    - Opens confirmation dialog: `Are you sure you want to cancel your queue spot?`
    - Only allowed while status is `WAITING`.
  - Real-time updates: Automatically refreshes via Socket.IO without manual browser refresh.

---

## Screen 4: Reception Dashboard (`/reception`)
- **Target User**: Salon receptionist or front-desk manager on a 10-inch+ tablet or laptop.
- **Layout (Optimized Landscape 2-Column Split)**:
  - **Top Bar**:
    - Salon title, current time, total waiting count, average wait time.
    - `[ + Add Walk-in Customer ]` button.
    - Quick search/filter bar for tokens or customer names.
    - Language switcher.
  - **Left Column: Barber Chairs & Status (3 Cards)**:
    - Card for each barber (Ravi, Amit, Imran):
      - Photo, Name, Status badge (`Free`, `In Chair`, `On Break`).
      - Current customer info (Token, Name, Services, Time Elapsed).
      - Progress bar of service completion time.
      - Action button: `[ Call Next ]` (picks next eligible customer based on preference rules).
      - Action button: `[ Break / Resume ]` toggle.
  - **Right Column: Waiting Queue (Chronological Order)**:
    - Table / Cards of all currently waiting customers:
      - Token number (e.g. `S-14`).
      - Customer Name & Phone number.
      - Services requested & duration.
      - Barber preference (e.g. `Ravi` or `Any`).
      - Waiting time elapsed (if > 60 min, highlighted in amber warning color).
      - Actions:
        - `[ Call Next ]`
        - `[ Mark No-Show ]` (for called customers who did not show up).
        - `[ Cancel ]` (with confirmation).
  - **Walk-in Modal Form**:
    - Fast entry: Name, Phone, Service selection, Barber choice.
    - Automatically appends customer to end of queue with next sequential token.

---

## Screen 5: Barber View (`/barber/:name`)
- **Target User**: Barbers (Ravi, Amit, Imran) checking their phone mounted next to their mirror.
- **Top Bar**:
  - Barber selector tabs / switcher: `Ravi` | `Amit` | `Imran`.
  - Status toggle switch: `🟢 Available` vs `🟡 On Break`.
- **Main In-Chair Card**:
  - If serving a customer:
    - Token: e.g. `S-12`.
    - Customer Name: e.g. `Rahul Patel`.
    - Services: `Haircut + Beard Trim` (45 min).
    - Live Stopwatch / Timer: e.g. `12:45 elapsed / ~45 min expected`.
    - Primary Action Buttons:
      - `[ Start Service ]` (when client sits in chair, transitions from `CALLED` to `IN_CHAIR`).
      - `[ Complete Service / Done ]` (finishes client, transitions to `DONE`, updates stats).
  - If chair is empty:
    - `No customer in chair`.
    - Prominent button: `[ Call Next Customer ]`.
- **Upcoming Queue Card ("Next for You")**:
  - Displays the next waiting customer eligible for this barber (e.g. `Next: S-15 Kunal · Haircut`).
  - Notification banner if barber is currently marked "On Break".

---

## Screen 6: Waiting Area TV Display (`/display`)
- **Target User**: Salon customers seated in the waiting lobby looking at a 1080p wall-mounted TV.
- **Aesthetic**:
  - Clean, high-contrast dark theme (`#111827`), readable from 5 meters.
  - No scrolling or navigation buttons needed; operates as a kiosk display.
- **Sections**:
  1. **Top Header**:
     - Salon logo, live clock with seconds, and current active queue summary.
  2. **Active Chairs ("Now Serving / હવે વારો છે")**:
     - Grid of 3 barber stations (Station 1: Ravi, Station 2: Amit, Station 3: Imran).
     - Each station displays: Barber photo, station name, current Token `S-12`, customer first name, and status (`In Chair` or `Calling...`).
     - Newly called tokens flash with a glowing gold animation for 10 seconds and play a sound chime.
  3. **Up Next ("Upcoming Tokens / આગામી ટોકન")**:
     - Large horizontal cards showing the next 5 tokens in queue:
       - Token number (e.g. `S-14`, `S-15`, `S-16`, `S-17`, `S-18`).
       - Estimated wait time.
       - Assigned/Preferred barber.

---

## Screen 7: Owner Admin Settings (`/admin`)
- **Target User**: Salon Owner managing operational parameters and reviewing daily performance.
- **Security**: Protected by PIN code (Default test PIN: `1234`).
- **Sections**:
  1. **Today's Key Performance Indicators (Stats)**:
     - Total Customers Served Today.
     - Average Waiting Time (minutes).
     - Active Customers in Queue.
     - No-shows / Cancellations Count.
  2. **Salon Operations Controls**:
     - Queue Joining Toggle: `Open for Online Joining` vs `Closed for Online Joining` (with custom alert message).
     - Reset Daily Tokens / Queue button (with confirmation).
     - Seed Demo Data button (loads 5-8 realistic customers for TA testing).
  3. **Barbers On Duty Today**:
     - List of barbers (Ravi, Amit, Imran) with toggle switches (`On Duty` vs `Off Duty`).
  4. **Services & Pricing Management**:
     - Table of all services with:
       - Name in English & Gujarati.
       - Duration (minutes).
       - Price (₹).
       - Active switch (`Enabled` / `Disabled`).
       - Edit & Add Service modal.
