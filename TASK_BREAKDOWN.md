# IT3030 – Smart Campus Operations Hub
## Master Task Breakdown – Group Assignment 2026

> **Stack:** Spring Boot REST API + React | **Database:** Supabase (PostgreSQL)
> **Deadline:** 27th April 2026 | **Viva:** From 11th April 2026

---

## 👥 Team Allocation Overview

| Member | Module | Focus Area |
|--------|--------|------------|
| **Vishwa** | Module A | Facilities & Assets Catalogue |
| **Charindhi** | Module B | Booking Workflow & Conflict Checking |
| **Suchintha** | Module C | Incident Tickets, Attachments & Technician Updates |
| **Chanuka** | Module D + E | Notifications, Role Management & OAuth Integration |

---

## 🗄️ Supabase Database – Table Ownership

> **Chanuka** creates the Supabase project and shares credentials via a `.env` file in the repo root (gitignored).

### Tables & Owners

| Table | Owner | Description |
|-------|-------|-------------|
| `users` | Chanuka | Synced from Google OAuth |
| `roles` | Chanuka | USER, ADMIN, TECHNICIAN |
| `user_roles` | Chanuka | Join table |
| `resources` | Vishwa | Rooms, labs, equipment |
| `bookings` | Charindhi | Booking requests + status |
| `tickets` | Suchintha | Incident/maintenance tickets |
| `ticket_comments` | Suchintha | Comments on tickets |
| `ticket_attachments` | Suchintha | Image uploads (up to 3) |
| `notifications` | Chanuka | In-app notifications |

### Shared `.env` Template (copy to `backend/.env`, never commit)
```properties
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-service-role-key
SPRING_DATASOURCE_URL=jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-db-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret-min-32-chars
```

---

## 📁 Project Structure – Conflict-Free Zones

```
smart-campus/
├── backend/src/main/java/com/smartcampus/
│   ├── config/                    ← Chanuka ONLY
│   ├── security/                  ← Chanuka ONLY
│   ├── modules/
│   │   ├── resource/              ← Vishwa ONLY
│   │   │   ├── ResourceController.java
│   │   │   ├── ResourceService.java
│   │   │   ├── ResourceRepository.java
│   │   │   ├── Resource.java (entity)
│   │   │   └── dto/
│   │   ├── booking/               ← Charindhi ONLY
│   │   │   ├── BookingController.java
│   │   │   ├── BookingService.java
│   │   │   ├── BookingRepository.java
│   │   │   ├── Booking.java (entity)
│   │   │   └── dto/
│   │   ├── ticket/                ← Suchintha ONLY
│   │   │   ├── TicketController.java
│   │   │   ├── TicketService.java
│   │   │   ├── TicketRepository.java
│   │   │   ├── Ticket.java (entity)
│   │   │   ├── TicketCommentController.java
│   │   │   └── dto/
│   │   └── notification/          ← Chanuka ONLY
│   │       ├── NotificationController.java
│   │       ├── NotificationService.java
│   │       └── dto/
│   └── shared/                    ← Anyone (discuss before editing)
│       ├── exception/
│       ├── response/ApiResponse.java
│       └── util/
│
└── frontend/src/
    ├── pages/
    │   ├── resources/             ← Vishwa ONLY
    │   ├── bookings/              ← Charindhi ONLY
    │   ├── tickets/               ← Suchintha ONLY
    │   └── notifications/         ← Chanuka ONLY
    ├── components/
    │   ├── resource/              ← Vishwa ONLY
    │   ├── booking/               ← Charindhi ONLY
    │   ├── ticket/                ← Suchintha ONLY
    │   └── shared/                ← Discuss before editing (Navbar, Layout)
    ├── services/
    │   ├── resourceService.js     ← Vishwa ONLY
    │   ├── bookingService.js      ← Charindhi ONLY
    │   ├── ticketService.js       ← Suchintha ONLY
    │   └── notificationService.js ← Chanuka ONLY
    └── context/AuthContext.jsx    ← Chanuka ONLY
```

---

## 🔀 Git Branching Strategy

```
main
└── dev  ← everyone merges here via PR
    ├── feature/vishwa-resources
    ├── feature/charindhi-bookings
    ├── feature/suchintha-tickets
    └── feature/chanuka-auth-notifications
```

**Rules (follow strictly):**
1. Never commit directly to `main` or `dev`
2. Work only inside your own feature branch
3. Raise a PR to `dev` when a feature is ready
4. Rebase your branch from `dev` at least once a day
5. Resolve your own merge conflicts before raising a PR

---

## 📅 Timeline

| Date | Milestone |
|------|-----------|
| Apr 6 | Supabase project ready, backend scaffolded, auth skeleton done (Chanuka) |
| Apr 10 | All DB tables created with seed data |
| Apr 13 | All backend endpoints done; individual Postman tests pass |
| Apr 20 | Frontend pages done and connected to API |
| Apr 24 | Integration complete, GitHub Actions passing, report drafted |
| Apr 27 | Final submission via Courseweb (11:45 PM) |

---

## ✅ Shared Setup Tasks (Do Once, Coordinate)

| Task | Who Does It |
|------|-------------|
| Create GitHub repo (`it3030-paf-2026-smart-campus-groupXX`) | Chanuka |
| Set branch protection on `main` and `dev` | Chanuka |
| Create Supabase project + run schema SQL | Chanuka |
| Init Spring Boot project (Spring Initializr) | Vishwa or Chanuka |
| Init React project (Vite) | Anyone |
| GitHub Actions CI workflow (build + test) | Chanuka |
| Add `.gitignore` (exclude `node_modules`, `target`, `.env`) | First person to commit |
| Final report PDF assembly | All members contribute their sections |

---

## 📋 Individual Task Files

- [`VISHWA_TASKS.md`](./VISHWA_TASKS.md) – Module A: Facilities & Assets
- [`CHARINDHI_TASKS.md`](./CHARINDHI_TASKS.md) – Module B: Bookings
- [`SUCHINTHA_TASKS.md`](./SUCHINTHA_TASKS.md) – Module C: Tickets
- [`CHANUKA_TASKS.md`](./CHANUKA_TASKS.md) – Module D+E: Auth & Notifications
