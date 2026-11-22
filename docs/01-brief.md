# Salon Queue Management System — Project Brief & Scope

## Problem
On busy days and weekends, salon customers often wait 1 to 2 hours in physical waiting chairs without knowing their exact turn or remaining wait time. Some walk away frustrated, while others dispute who arrived first. Barbers lack visibility on the waiting queue and their upcoming clients, leading to inefficient chair turnover.

## Users
1. **Customer**: Joins queue remotely or on arrival, tracks live token status, estimated wait, and receives instant "It's your turn!" notification.
2. **Receptionist**: Adds walk-in customers, monitors waiting list, calls next client, manages no-shows and cancellations.
3. **Barber**: Sees current client in chair with timer, calls/starts next client, completes services, toggles break/available status.
4. **Owner / Manager**: Configures salon services (pricing, duration, availability), manages barbers on duty, controls queue status (open/closed), and monitors today's operational stats.

## Must-Have Features
1. **Join Queue (Mobile-First)**: Customer enters Name & 10-digit Phone number, picks up to 3 services, selects a preferred barber (or 'Any Barber' for fastest service), and gets an instant sequential token (e.g. S-1, S-2...).
2. **Live Customer Tracking (`/status/:id`)**: Real-time token position, circular wait time countdown, "Start coming to the salon" alert at position 2, and celebratory full-screen gold "It's your turn! Go to [Barber]" alert with audio-visual chime.
3. **Receptionist Dashboard (`/reception`)**: Tablet landscape view with barber chair cards, ordered live waiting list, quick [+ Add Walk-in] modal, wait time warning for >60 min in amber, and [No-show] / [Cancel] actions.
4. **Barber View (`/barber/:name`)**: Mobile/tablet screen for barbers showing current in-chair customer, service timer, big [Start] and [Done] buttons, "Next for you" preview, and On Break / Available toggle.
5. **Waiting Area TV Display (`/display`)**: High-contrast, 1920x1080 display readable from 5 meters away, displaying each barber's active token ("Now Serving"), list of next 5 upcoming tokens with wait estimates, and flashing gold highlight + chime on new call.
6. **Owner Admin Settings (`/admin`)**: PIN-protected settings to toggle services (minutes, price, EN/GU names), toggle barbers on duty, toggle queue open/closed for online joining, and view today's metrics (total served, avg wait, no-shows).
7. **Real-time Sync**: Instant synchronization across customer phones, reception tablets, barber screens, and TV displays via Socket.IO.
8. **Bilingual EN/GU**: Seamless toggle between English and Gujarati across all screens.

## Don't Build (Out of Scope)
- No online payment gateway or card processing (cash/UPI paid at salon counter).
- No future-date scheduling or appointment bookings (queue is live same-day only).
- No external paid SMS / WhatsApp APIs (pure real-time webapp notifications).
- No loyalty points, discount voucher schemes, or multi-branch franchise architecture.

## Look & Feel
- **Aesthetic**: Premium luxury salon experience.
- **Palette**: Deep Charcoal (`#111827`, `#1F2937`) base with Royal Gold (`#D4AF37`, `#F59E0B`, `#EAB308`) accents and soft white/slate typography.
- **Typography & Components**: Modern sans-serif, rounded-2xl cards, smooth transitions, mobile-first responsive touch targets (minimum 44px).
- **Language**: English and Gujarati labels and notifications.
