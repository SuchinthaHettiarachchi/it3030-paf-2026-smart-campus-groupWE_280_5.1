# 🏫 Smart Campus Operations Hub

A full-stack web application for managing university facility bookings, maintenance tickets, notifications, and role-based access control.

> **IT3030 – PAF Assignment 2026 (Semester 1) | SLIIT**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 4.0, Gradle |
| Database | MongoDB |
| Security | Spring Security, Google OAuth2 |
| Frontend | React 18, Vite |
| CI/CD | GitHub Actions |

---

## ✅ Prerequisites

Make sure you have the following installed before cloning:

| Tool | Version | Check |
|------|---------|-------|
| Java JDK | 17+ | `java -version` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MongoDB | 6+ (running locally) | `mongod --version` |
| Git | Any | `git --version` |

---

## 🚀 Setup & Run (New Clone)

### Step 1 — Clone the repository
```bash
git clone https://github.com/SuchinthaHettiarachchi/it3030-paf-2026-smart-campus-groupWE_280_5.1.git
cd it3030-paf-2026-smart-campus-groupWE_280_5.1
```

### Step 2 — Start MongoDB
Make sure MongoDB is running locally:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or run directly
mongod --dbpath /usr/local/var/mongodb
```
MongoDB must be running on `mongodb://localhost:27017`

### Step 3 — Configure Backend Environment
Create the backend `.env` file:
```bash
cd backend
cp .env.example .env
```
The default `.env.example` values work out of the box for local development:
```
MONGODB_URI=mongodb://localhost:27017/SmartCampus
PORT=8080
FRONTEND_URL=http://localhost:5173
```

### Step 4 — Run the Backend
```bash
# From the /backend directory
./gradlew bootRun
```
Wait for:
```
Started SmartCampusBackendApplication in X.XXX seconds
Database already contains data. Skipping initialization.
```
Backend runs at: **http://localhost:8080**

> **If you see "Port 8080 already in use":**
> ```bash
> lsof -ti:8080 | xargs kill -9
> ./gradlew bootRun
> ```

### Step 5 — Configure Frontend Environment
```bash
cd ../frontend
cp .env.example .env   # or create .env manually
```
The `.env` file should contain:
```
VITE_API_URL=http://localhost:8080
```

### Step 6 — Run the Frontend
```bash
# From the /frontend directory
npm install
npm run dev
```
Frontend runs at: **http://localhost:5173**

---

## 🔐 Logging In

This project uses **Google OAuth2** for authentication. In development mode, you can log in instantly without a Google account:

| Button | Role | Permissions |
|--------|------|-------------|
| **Administrator** | ADMIN | Full access — approve bookings, manage resources, view all tickets |
| **User** | USER | Create bookings, raise tickets, view own data |
| **Technician** | TECHNICIAN | View assigned tickets, update ticket status |

---

## 📦 Project Structure

```
/
├── backend/                          # Spring Boot REST API
│   ├── src/main/java/com/smartcampus/
│   │   ├── controller/               # REST controllers (A–E modules)
│   │   ├── service/                  # Business logic
│   │   ├── model/                    # MongoDB documents
│   │   ├── repository/               # Spring Data MongoDB repos
│   │   ├── security/                 # OAuth2 + DevBypassFilter
│   │   └── config/                   # CORS, Web config
│   ├── build.gradle
│   ├── gradlew
│   └── .env.example
│
├── frontend/                         # React + Vite client
│   ├── src/
│   │   ├── pages/                    # ResourcesPage, BookingsPage, etc.
│   │   ├── components/               # Modals, buttons, reusable UI
│   │   ├── context/                  # AuthContext
│   │   └── api/                      # Axios instance
│   ├── package.json
│   └── .env.example
│
├── .github/workflows/build.yml       # GitHub Actions CI
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints Summary

| Module | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **Auth** | GET | `/api/auth/me` | Current user info |
| **Auth** | POST | `/api/auth/select-role` | Set user role after OAuth |
| **Resources** | GET | `/api/resources` | List all resources (search supported) |
| **Resources** | POST | `/api/resources` | Create resource (ADMIN) |
| **Resources** | PUT | `/api/resources/{id}` | Update resource (ADMIN) |
| **Resources** | DELETE | `/api/resources/{id}` | Delete resource (ADMIN) |
| **Bookings** | GET | `/api/bookings` | All bookings (ADMIN only) |
| **Bookings** | GET | `/api/bookings/my-bookings` | Current user's bookings |
| **Bookings** | POST | `/api/bookings` | Create booking request |
| **Bookings** | PUT | `/api/bookings/{id}/approve` | Approve/Reject (ADMIN only) |
| **Bookings** | PATCH | `/api/bookings/{id}/cancel` | Cancel booking |
| **Bookings** | GET | `/api/bookings/verify-qr` | QR check-in (public) |
| **Tickets** | GET | `/api/tickets` | All/assigned/own tickets |
| **Tickets** | POST | `/api/tickets` | Create ticket (multipart + images) |
| **Tickets** | PUT | `/api/tickets/{id}/status` | Update ticket status |
| **Tickets** | PUT | `/api/tickets/{id}/resolve` | Resolve with notes |
| **Tickets** | PATCH | `/api/tickets/{id}/assign` | Assign technician |
| **Comments** | GET | `/api/tickets/{id}/comments` | Get ticket comments |
| **Comments** | POST | `/api/tickets/{id}/comments` | Add comment |
| **Comments** | PUT | `/api/tickets/comments/{id}` | Edit comment (author only) |
| **Comments** | DELETE | `/api/tickets/comments/{id}` | Delete comment (author/admin) |
| **Notifications** | GET | `/api/notifications` | Get notifications |
| **Notifications** | PATCH | `/api/notifications/{id}/read` | Mark as read |
| **Notifications** | PATCH | `/api/notifications/read-all` | Mark all as read |

---

## ⚙️ CI/CD

GitHub Actions automatically builds the backend and frontend on every push to `main` or `dev`:

```yaml
# .github/workflows/build.yml
- Backend: ./gradlew build
- Frontend: npm install && npm run build
```

---

## 🧩 Modules Implemented

- **Module A** – Facilities & Assets Catalogue (CRUD, search, filter, status)
- **Module B** – Booking Management (PENDING → APPROVED/REJECTED, conflict check, QR check-in)
- **Module C** – Maintenance & Incident Ticketing (workflow, images, technician assign, comments)
- **Module D** – Notifications (booking/ticket events, unread badge, mark-as-read)
- **Module E** – Authentication & Authorization (Google OAuth2, role-based access: USER/ADMIN/TECHNICIAN)
