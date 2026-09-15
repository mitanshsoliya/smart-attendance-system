# LectureLog — Smart Attendance System

> **A full-stack, mobile-responsive academic attendance & timetable platform built with React, Node.js, Express, and PostgreSQL (Supabase). Features role-aware portals for Students, Faculty, and HODs with live Geo-Fenced QR check-ins, real-time polling, and departmental timetable matrices.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://smart-attendance-system-psi-lime.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Responsive](https://img.shields.io/badge/Design-Mobile%20%26%20Desktop%20Responsive-blue?style=for-the-badge)](https://smart-attendance-system-psi-lime.vercel.app/)

🌐 **Live URL**: [https://smart-attendance-system-psi-lime.vercel.app/](https://smart-attendance-system-psi-lime.vercel.app/)

---

## 📱 Screenshots

### Login & Portal Selector
![Login Screen](docs/screenshots/login.jpg)

### Faculty Portal — Live Geo-Fenced QR Broadcast
![Faculty Dashboard](docs/screenshots/faculty-dashboard.jpg)

### Student Portal — Attendance & Timetable
![Student Dashboard](docs/screenshots/student-dashboard.jpg)

### HOD Portal — Departmental Analytics & Governance
![HOD Dashboard](docs/screenshots/hod-dashboard.jpg)

---

## ✨ Key Highlights & Features

### 🔐 1. Authentication & Role-Based Access
- **3 Distinct Portals**: Dedicated, isolated workspaces for **Student**, **Faculty**, and **Head of Department (HOD)**.
- **JWT Authentication**: Secure stateless tokens with auto-revalidation via `/auth/me` and server-side session termination on logout.
- **Role Verification Guards**: Prevents cross-portal unauthorized access.
- **Self-Registration Requests**:
  - Prospective Students & Faculty can submit onboard requests via the registration modal.
  - Department HOD reviews and verifies requests before activating accounts and allocating cohort sections.

### 📍 2. Geo-Fenced QR Attendance Engine
- **Dynamic Session Token**: Cryptographically generated 64-character tokens with active countdown timer.
- **Configurable Geo-Fence Radius**:
  - `🌐 Open Attendance`: Any enrolled student can scan and check in regardless of distance.
  - `📍 50m Classroom Radius`: Checks GPS coordinates between student and faculty device using the Haversine formula.
  - `📍 100m Campus Radius`: Extended perimeter for lecture halls and auditoriums.
- **Live Attendance Roster**:
  - Live polling automatically updates the roster as students scan.
  - Displays verified GPS distance in meters.
  - Auto-flags absent students once session expires.
  - Faculty can override attendance status (Present / Absent / Late) in real time.

### 📅 3. Interactive Department Timetable Matrices
- **Multi-Department Support**: Computer Science & Engineering (CSE), Information Technology (IT), and Electronics & Communication (ECE).
- **Time Slots & Periods**: Complete Monday–Friday timetable tracking Periods 1 to 7, lunch breaks, and concurrent laboratory batches (B1, B2, B3).
- **Student View**: Section-specific class schedule with room and instructor details.
- **Faculty View**: Individual workload tracker displaying assigned theory lectures and lab sessions.
- **HOD Matrix**: Department-wide master schedule with faculty assignment and room allocation.

### 📱 4. 100% Mobile & Desktop Responsive Design
- **Mobile Navigation Drawer**: Slide-in navigation drawer with close button and profile footer.
- **Mobile Bottom Navigation Bar**: Quick-switch bottom tabs on smartphone screens (`md:hidden`).
- **Touch-Friendly Tables**: Timetable matrices and attendance rosters feature horizontal touch scrolling (`touch-pan-x`) with column width protection.
- **iOS Zoom Protection**: Input font sizes calibrated to prevent automatic zooming on iPhone Safari.

---

## 🏛️ Portal Features Breakdown

### 🎓 Student Portal
| Tab | Description |
|---|---|
| **Overview / Dashboard** | Attendance percentage circular gauge, total classes attended vs. absent, subject-wise progress. |
| **Scan QR** | In-app camera scanner, QR image upload, and manual token input. Verifies location if Geo-Fencing is active. |
| **Attendance History** | Searchable attendance records with filters by subject, date, and status. |
| **My Courses** | Enrolled subjects with faculty contact, credits, and cutoff indicators (75% threshold). |
| **Timetable** | Weekly schedule matrix customized to student's cohort section. |
| **Reports** | Semester standing reports with downloadable attendance statements. |
| **Settings** | Update student profile, phone number, and password. |

### 🏫 Faculty Portal
| Tab | Description |
|---|---|
| **Dashboard** | Total lectures taken, enrolled students count, average attendance rate, and upcoming schedule. |
| **Lectures** | Create and schedule lectures with subject code, date, and period slot. |
| **Live Attendance** | Broadcast live QR session with selectable Geo-Fence perimeter (0m, 50m, 100m) and real-time roster. |
| **Schedule** | Weekly faculty schedule matrix showing teaching hours and lab commitments. |
| **Students** | Enrolled students directory filterable by section and performance. |
| **Reports** | Class attendance analytics and exportable summary tables. |
| **Settings** | Update faculty phone number, profile details, and account credentials. |

### 🏛 HOD (Head of Department) Portal
| Tab | Description |
|---|---|
| **Overview** | Departmental attendance health, subject-wise analytics, and low-attendance alerts. |
| **Faculty Directory** | Faculty profiles, workload allocation, and contact records. |
| **Student Roster** | Comprehensive student list with section allocation and registration verification. |
| **Timetable Management** | Department master timetable configuration across all cohort sections. |
| **Hall Tickets** | Issue or restrict exam eligibility based on attendance threshold (75% rule). |
| **Accreditation / Reports** | Export academic compliance logs and attendance rosters. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Axios |
| **Styling** | Vanilla CSS, Tailwind Utilities, Google Fonts (DM Sans, DM Serif Display) |
| **Backend** | Node.js, Express.js (REST API, CORS, Dotenv) |
| **Database** | PostgreSQL on **Supabase Cloud** (Production) / SQLite (Local fallback) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing |
| **QR Engine** | `qrcode` |
| **Deployment** | **Vercel** (Frontend SPA) & **Render** (Backend Web Service) |

---

## 📂 Project Structure

```text
smart-attendance-system/
├── backend/
│   ├── database/
│   │   ├── migrate.js            # PostgreSQL schema migration
│   │   ├── seed.js               # Sample data seeder
│   │   └── supabase.sql          # Supabase SQL DDL
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role authorization
│   │   └── validator.js          # Payload validation middleware
│   ├── routes/
│   │   ├── attendance.js         # Check-in, live roster, Geo-Fence verification
│   │   ├── auth.js               # /login, /me, /logout
│   │   ├── faculty.js            # Faculty stats, profile, settings
│   │   ├── hod.js                # HOD overview, approvals, section assignments
│   │   ├── lectures.js           # Lecture scheduling & editing
│   │   ├── qrSession.js          # Live QR token creation & countdown
│   │   ├── register.js           # Registration requests & submissions
│   │   ├── student.js            # Student courses, reports, timetable
│   │   ├── timetable.js          # Department timetable APIs
│   │   └── users.js              # User management
│   ├── db.js                     # Database pool connector
│   ├── package.json
│   └── server.js                 # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Modal, Navigation, RegistrationRequestModal
│   │   │   ├── faculty/          # FacultyAttendanceTab, FacultyScheduleTab, etc.
│   │   │   ├── hod/              # HodOverviewTab, HodTimetableTab, etc.
│   │   │   ├── layout/           # DashboardLayout (Desktop + Mobile drawer/bottom bar)
│   │   │   ├── student/          # StudentAttendanceTab, StudentTimetableTab, etc.
│   │   │   └── Login.jsx         # Clean, responsive login screen
│   │   ├── data/                 # Department timetables (CSE, IT, ECE)
│   │   ├── services/             # Axios API service clients
│   │   ├── App.jsx               # Root application router
│   │   ├── index.css             # Base styles, responsive variables, custom scrollbars
│   │   └── QRScanner.jsx         # In-browser QR camera scanner
│   ├── package.json
│   ├── vercel.json               # SPA rewrites & caching for Vercel
│   └── vite.config.js            # Vite build configuration with dist auto-sync
├── docs/screenshots/            # UI screenshots
├── vercel.json                   # Root monorepo deployment config
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/mitanshsoliya/smart-attendance-system.git
cd smart-attendance-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` file:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
JWT_SECRET=your_super_secret_jwt_key_2026
```

Start the backend:
```bash
node server.js
# → Server running on http://localhost:5000
```

### 3. Frontend Setup
In another terminal:
```bash
cd frontend
npm install
npm run dev
# → Local: http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## ☁️ Production Deployment

### Frontend Deployment (Vercel)
1. Import the repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend` (Framework: `Vite`).
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-api.onrender.com`
4. Click **Deploy**. Vercel will build and deploy the frontend with SPA rewrites configured.

### Backend Deployment (Render.com)
1. Create a new **Web Service** on [Render](https://render.com) from your GitHub repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add Environment Variables:
   - `DATABASE_URL` (Supabase PostgreSQL connection string)
   - `JWT_SECRET` (A strong random secret string)
5. Click **Create Web Service**.

---

## 🔒 Security Practices

- **Password Hashing**: Passwords stored using `bcryptjs` with salt rounds.
- **JWT Protection**: Tokens validated on every private API route.
- **Duplicate Prevention**: Database constraints ensure attendance for a specific lecture cannot be recorded more than once per student.
- **Geo-Fence Validation**: Server-side validation of student GPS coordinates against faculty anchor device coordinates.
- **Credential Hygiene**: Sensitive environment variables are kept out of version control via `.gitignore`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
