# Salon Queue Management System — Flows & Rules

## 1. Main Flows

### A. Remote Customer Flow
1. Customer opens Home (`/`) on mobile phone.
2. Clicks `[ Join Queue ]` -> navigates to `/join`.
3. Enters Name and 10-digit Phone. Selects 1-3 services (e.g. Haircut 30m, Beard Trim 15m).
4. Selects Barber (e.g. "Any Barber" or "Ravi").
5. Reviews live summary (Total 45 min · ₹230 · Expected wait ~35 min) and clicks `[ Confirm ]`.
6. Server assigns next sequential token (e.g. `S-14`).
7. Customer is redirected to My Status (`/status/:id`).
8. Customer watches live status:
   - At position > 2: status is normal waiting.
   - At position 2: banner displays "Start coming to the salon".
   - When receptionist or barber calls token: status transitions to `CALLED`, phone triggers full-screen gold celebration "It's your turn! Go to Amit" with audio chime.
9. Customer arrives, barber taps `[ Start ]` -> status transitions to `IN_CHAIR`.
10. When haircut finishes, barber taps `[ Done ]` -> status transitions to `DONE`.

### B. Walk-in Customer Flow
1. Customer walks into the salon without prior booking.
2. Receptionist on the tablet dashboard (`/reception`) taps `[ + Add Walk-in ]`.
3. Receptionist enters customer Name, Phone, selects Services and preferred barber.
4. Customer is appended to the queue strictly at the end (first come, first served).
5. Receptionist hands them their printed/spoken token number (e.g. `S-15`).
6. Customer watches the Waiting Area TV Display (`/display`) in the lounge.

---

## 2. Queue State Machine & Transition Rules

### Allowed Status Transitions:
```
[ WAITING ] ───────────► [ CALLED ] ───────────► [ IN_CHAIR ] ───────────► [ DONE ]
     │                       │
     ▼                       ▼
[ CANCELLED ]           [ NO_SHOW ]
```

- **Strict Forward-Only**: Once a customer advances to `CALLED`, they cannot move back to `WAITING`. Once `IN_CHAIR`, they cannot move back to `CALLED`.
- **Cancellation**: Only customers in `WAITING` state can be cancelled (either by customer via My Status or by receptionist).
- **No-Show**: Only customers who have been `CALLED` and failed to show up within the grace window (e.g. 10 minutes) can be marked as `NO_SHOW`.
- **Terminal States**: `DONE`, `CANCELLED`, and `NO_SHOW` are terminal. If a no-show customer returns later, they must be added as a fresh entry at the very end of the queue with a brand new sequential token number.

---

## 3. Barber Assignment & "Call Next" Rules

1. **First-Come, First-Served (FCFS) with Barber Constraints**:
   - When Barber **X** clicks `[ Call Next ]`:
     - Search all currently `WAITING` tickets ordered by arrival time (token sequence).
     - Find the earliest ticket where `preferredBarberId == X` OR `preferredBarberId == 'ANY'`.
     - Assign that ticket to Barber **X** and update status to `CALLED`.
2. **Preference Isolation**:
   - If Customer A chose `Ravi` specifically, Customer A is **NEVER** assigned to `Amit` or `Imran`.
   - If `Amit` clicks `[ Call Next ]`, the system will skip Customer A and take the next waiting customer who chose `Amit` or `Any`.
3. **One Customer Per Chair**:
   - A barber can only have at most one customer in `CALLED` or `IN_CHAIR` at any given time.
   - If a barber already has an active client, `[ Call Next ]` is disabled until the current client is marked `DONE` or `NO_SHOW`.
4. **On Break Status**:
   - If a barber toggles their status to `On Break`, they cannot call new customers.
   - Customers viewing that barber will see a badge `[Barber Name] is currently on break`.

---

## 4. Waiting Time Estimation Formula

```
Estimated Wait Time (minutes) = (Total Service Minutes of Customers Ahead) / (Number of Active Working Barbers)
```
- For a customer with a specific barber preference:
  - Estimated Wait = Sum of service durations of all waiting customers ahead who selected that specific barber + remaining time of that barber's current in-chair customer.
- For a customer who chose 'Any Barber':
  - Estimated Wait = Sum of service durations of all general/eligible waiting customers ahead divided by active working barbers on duty.

---

## 5. Duplicate Prevention & Active Spots
- **One Active Spot Per Phone Number**:
  - A phone number can only have ONE ticket in `WAITING`, `CALLED`, or `IN_CHAIR` status.
  - If a user attempts to submit the Join form with an already active phone number, the app detects it, displays an alert, and redirects them to their active status page (`/status/:id`).

---

## 6. Online Queue Control
- Owner can switch the online queue to **Closed** from `/admin`.
- When closed, the `[ Join Queue ]` button on the homepage and `/join` is disabled, and an informative banner explains that remote joining is paused (walk-ins may still be registered at the desk).

---

## 7. Test Checklist (Verification Suite)

- [ ] **TC-01: Multi-Service Calculation** -> Join with 2 services (e.g. Haircut 30m ₹150 + Beard 15m ₹80); verify total duration shows 45 min and price shows ₹230.
- [ ] **TC-02: Phone Validation & Duplicate Check** -> Entering invalid phone fails validation. Entering the same 10-digit phone twice redirects to the existing active token without creating a duplicate.
- [ ] **TC-03: Barber Preference Isolation** -> Customer 1 chooses Ravi. Customer 2 chooses Any. Barber Amit taps "Call Next"; Amit must receive Customer 2, completely skipping Customer 1.
- [ ] **TC-04: Real-Time Status Notification (< 5s)** -> When Barber/Receptionist calls Token S-X, customer's mobile status page instantly reflects "It's your turn!" with full-screen gold alert without page refresh.
- [ ] **TC-05: Barber Workflow (Start -> Done)** -> Barber taps "Start" -> status changes to "In Chair" and live timer starts. Barber taps "Done" -> customer leaves active queue, and reception + TV instantly update.
- [ ] **TC-06: No-Show Re-Add Behavior** -> Mark called customer as No-Show. Re-adding them via Walk-in places them at the very END of the queue with a NEW sequential token.
- [ ] **TC-07: Online Queue Switch** -> Toggle Online Queue to Closed in `/admin`; verify `/join` button is disabled with notice.
- [ ] **TC-08: Bilingual EN/GU Toggle** -> Toggle language to Gujarati; verify all headers, service names, status texts, and action buttons switch to Gujarati cleanly.
- [ ] **TC-09: Waiting Time Countdown** -> Waiting time dynamically reduces as preceding customers are completed or cancelled.
- [ ] **TC-10: Multi-Window Synchronization** -> Open Customer, Reception, Barber, and TV Display in separate windows; verify updates appear synchronously on all screens via Socket.IO.
- [ ] **TC-11: Waiting > 60 min Warning** -> Any customer waiting more than 60 minutes is highlighted in amber on the Reception Dashboard.
- [ ] **TC-12: TV Display Audio Chime & Visual Flash** -> Calling a token flashes the TV station card in gold and triggers sound chime.
