# Smart Appointment Book

Online booking system for local businesses — salons, clinics, tutors, consultants.

Customers book online. Owners manage the calendar. Reminders reduce no-shows.

---

## Features (MVP)

- Public booking page (service → date → time → details)
- Services with duration and price
- Working hours configuration
- Owner calendar (day / week view)
- Appointment statuses: Confirmed, Completed, Cancelled, No-show
- Manual walk-in booking
- Dashboard with today’s appointments
- Reminder-ready architecture (SMS / WhatsApp / email hooks)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | SQLite (dev) / PostgreSQL ready |
| Auth | JWT (owner login) |
| Validation | express-validator |

---

## Project Structure

```
smart-appointment-book/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/          # slot engine, reminders
│   │   └── app.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── hooks/
│   │   └── App.jsx
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API runs at http://localhost:4000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

### 3. Default owner (seed)

After first run, seed creates:

- Email: `owner@demo.com`
- Password: `password123`

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register owner |
| POST | `/api/auth/login` | Login |
| GET | `/api/services` | List services |
| POST | `/api/services` | Create service (auth) |
| GET | `/api/availability` | Free slots for date + service |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | List (owner) |
| PATCH | `/api/appointments/:id/status` | Update status |
| GET/PUT | `/api/working-hours` | Manage hours |

---

## Booking Flow

1. Customer opens `/book/:slug`
2. Selects service
3. Picks date → sees available time slots
4. Enters name + phone
5. Confirmation page
6. Owner sees it on dashboard/calendar

---

## Slot Engine

`backend/src/services/slotService.js` generates free slots from:

- Working hours for that weekday
- Existing appointments
- Service duration
- Optional buffer minutes

---

## Roadmap

- [ ] SMS / WhatsApp reminders
- [ ] Multiple staff
- [ ] Online deposits
- [ ] Google Calendar sync
- [ ] Customer history
- [ ] No-show analytics

---

## Author

**Ahalya** — BCA Graduate | Aspiring Data Analyst  
GitHub: [ahalya7259-lgtm](https://github.com/ahalya7259-lgtm)

## License

MIT
