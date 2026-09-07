# LectureLog Smart Attendance System

LectureLog is a React and Node.js attendance platform for managing lecture check-ins with time-limited QR sessions. It supports students, faculty members, and HOD accounts through role-aware authentication and dashboards.

## Features

### Authentication

- Login with email and password.
- Student, Faculty, and HOD portal selection on the login screen.
- JWT-based authentication for protected API routes.
- Persistent login session in the browser.
- Logout and expired-token handling.

### Student dashboard

- View total attended classes and attendance percentage.
- Enter a lecture ID and QR session token to mark attendance.
- Scan a faculty QR code using the device camera.
- Upload and scan a QR image through the QR scanner.
- View attendance history with subject, date/time, and status.
- Duplicate attendance for the same lecture is rejected by the backend.

### Faculty and HOD dashboard

- Load the faculty member's assigned lectures.
- Select a lecture from the lecture list.
- Generate a secure QR attendance session.
- Display the QR code and session token.
- Show a five-minute session countdown.
- Copy the session token for manual student check-in.

### Interface

- LectureLog editorial-style responsive UI.
- Mobile navigation drawer.
- Loading, success, empty, and error states.
- Responsive login, QR, scanner, and attendance history views.

## Project structure

```text
smart-attendance-system/
├── backend/
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── attendance.js
│   │   ├── lectures.js
│   │   ├── login.js
│   │   ├── qrSession.js
│   │   ├── register.js
│   │   └── student.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── QRScanner.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- MySQL 8 or newer
- A modern browser with camera permission support for QR scanning

## Supabase database setup

The backend now uses PostgreSQL through Supabase. To migrate the database:

1. Create or open your Supabase project.
2. Copy [backend/.env.example](backend/.env.example) to `backend/.env` and add your Supabase `DATABASE_URL` and `JWT_SECRET`.
3. Run `node database/migrate.js` in `backend/` (or run [backend/database/supabase.sql](backend/database/supabase.sql) in Supabase SQL Editor).
4. Users registered via `POST /register` automatically receive their linked student or faculty profile in PostgreSQL.

If the backend prints `DATABASE_URL is not configured`, `backend/.env` is missing or does not contain a `DATABASE_URL` entry. Copy the example file, replace its placeholders with the connection string from **Supabase Dashboard > Project Settings > Database**, then restart Node. Never commit `backend/.env`.

The migration creates the database tables, PostgreSQL enums, foreign keys, indexes, duplicate-attendance protection, and a demo subject. Supabase already provides the PostgreSQL database, so do not run the old MySQL schema against Supabase.

The previous MySQL-only schema is retained at [backend/database/schema.sql](backend/database/schema.sql) for reference only.

The backend expects these tables and relationships:

- `users`: `id`, `full_name`, `email`, `password`, `role`
- `students`: `id`, `user_id`
- `faculty`: `id`, `user_id`
- `subjects`: `id`, `subject_code`, `subject_name`
- `lectures`: `id`, `subject_id`, `faculty_id`, `lecture_date`, `start_time`, `end_time`
- `qr_sessions`: `id`, `lecture_id`, `session_token`, `expires_at`
- `attendance`: `id`, `lecture_id`, `student_id`, `status`, `attendance_time`

Recommended role values are:

```text
HOD
FACULTY
STUDENT
```

The schema inserts a `DEMO-101` subject if it does not already exist.

### Demo Credentials

Run `node database/seed.js` in `backend/` to seed or reset demo users and sample lectures.

| Role | Portal Tab | Email | Password |
| :--- | :--- | :--- | :--- |
| **Student** | Student | `student@example.com` | `student123` |
| **Faculty** | Faculty | `faculty@example.com` | `faculty123` |
| **HOD** | HOD | `hod@example.com` | `hod123` |

## Backend setup

Open a terminal in the backend directory:

```bash
cd backend
npm install
node server.js
```

The backend runs at:

```text
http://localhost:5000
```

The current server enables CORS and exposes JSON APIs. The frontend uses this URL by default.

## Frontend setup

Open a second terminal in the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local development URL, normally:

```text
http://localhost:5173
```

For a production build:

```bash
npm run build
npm run preview
```

To point the frontend at another backend, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Environment files are ignored by Git. Do not commit passwords, JWT secrets, or database credentials.

## API reference

All protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

### Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/login` | No | Authenticate a user and return a JWT plus user details. |
| `POST` | `/register` | No | Register a user with `full_name`, `email`, `password`, and `role`. |

Login request:

```json
{
  "email": "student@example.com",
  "password": "your-password"
}
```

### Student endpoints

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/student/dashboard` | Any authenticated user | Verify dashboard access and return the token user. |
| `POST` | `/attendance/mark` | `STUDENT` | Mark attendance using `lecture_id` and `session_token`. |
| `GET` | `/attendance/my` | `STUDENT` | Return the logged-in student's attendance records. |

Mark attendance request:

```json
{
  "lecture_id": 2,
  "session_token": "token-from-the-active-qr-session"
}
```

### Faculty and HOD endpoints

| Method | Endpoint | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/lectures/my` | `FACULTY` | Return lectures assigned to the logged-in faculty member. |
| `POST` | `/lectures/create` | `FACULTY` | Create a lecture using subject and schedule details. |
| `POST` | `/qr-session/create` | `FACULTY`, `HOD` | Create a QR session that expires after five minutes. |

Create lecture request:

```json
{
  "subject_id": 1,
  "lecture_date": "2026-09-07",
  "start_time": "10:00:00",
  "end_time": "11:00:00"
}
```

QR session request:

```json
{
  "lecture_id": 2
}
```

The QR response includes `qr_code`, `session_token`, `lecture_id`, and `expires_at`.

## Typical workflow

1. Start MySQL and create the `smart_attendance` database and required tables.
2. Register or insert one `FACULTY` user and one `STUDENT` user.
3. Create matching rows in `faculty` and `students`.
4. Add a subject and lecture assigned to the faculty member.
5. Start the backend with `node server.js`.
6. Start the frontend with `npm run dev`.
7. Faculty selects a lecture and generates a QR session.
8. Student scans the QR code or enters the lecture ID and session token.
9. Student opens **My Attendance** to verify the recorded check-in.

## Development commands

Run from `frontend/`:

```bash
npm run dev       # Start Vite development server
npm run build     # Create production bundle
npm run preview   # Preview production bundle
npm run lint      # Run ESLint
```

Run from `backend/`:

```bash
node server.js    # Start API server
```

## Security notes

The backend now uses PostgreSQL and can connect directly to Supabase. The current backend is suitable for local development, but production deployment should improve the following areas:

- Use `backend/.env.example` to configure `DATABASE_URL`, `JWT_SECRET`, and `PORT`.
- Hash passwords with `bcrypt` or Argon2 instead of comparing plain text passwords.
- Use HTTPS in production.
- Add request validation and rate limiting to authentication routes.
- Restrict CORS to the deployed frontend origin.
- Apply `backend/database/supabase.sql` in the Supabase SQL Editor.
- Avoid exposing session tokens outside the intended lecture audience.

## Current limitations

- Lecture creation is available through the API but is not yet exposed as a dedicated frontend form.
- The backend uses a direct MySQL connection in each route module.
- The application does not currently include faculty attendance reports or HOD-wide analytics.
- No automated backend test suite is configured yet.
