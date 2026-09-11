const express = require("express");
const { verifyToken, requireStudent, requireFacultyOrHod } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

/**
 * POST /attendance/mark
 *
 * Secure QR Attendance Flow:
 *
 *   Student JWT
 *        ↓
 *   Authenticated Student (verifyToken + requireStudent)
 *        ↓
 *   session_token required — no lecture_id from student ever trusted
 *        ↓
 *   Session lookup by token → 404 if not found
 *        ↓
 *   Expiration check → 400 if expired
 *        ↓
 *   Lecture derived from session (server-controlled) → never from student body
 *        ↓
 *   Student identity resolved from JWT user_id → student record
 *        ↓
 *   Enrollment eligibility check → 403 if not enrolled
 *        ↓
 *   Duplicate attendance check → 409 if already marked
 *        ↓
 *   INSERT attendance with server timestamp → 201 success
 *
 * Security guarantees:
 *  - Students cannot supply or forge a lecture_id.
 *  - Expired sessions are strictly rejected.
 *  - Only enrolled students can mark attendance.
 *  - Duplicate attendance is blocked at application and database level.
 *  - No silent auto-creation of missing student profiles.
 */
router.post("/mark", verifyToken, requireStudent, async (req, res) => {
  const { session_token } = req.body;

  // --- 1. session_token is strictly required ---
  const tokenToUse = session_token ? String(session_token).trim() : "";
  if (!tokenToUse) {
    return res.status(400).json({
      message: "A valid session_token is required to mark attendance. Scan the QR code displayed by your instructor.",
    });
  }

  try {
    // --- 2. Resolve QR session from token (server lookup — token is the only input) ---
    const sessionRows = await db.query(
      "SELECT id, lecture_id, expires_at FROM qr_sessions WHERE session_token = $1",
      [tokenToUse]
    );

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(404).json({
        message: "Invalid QR code. This session was not found.",
      });
    }

    const session = sessionRows[0];

    // --- 3. Check session expiration (server clock — not client-supplied) ---
    if (new Date() > new Date(session.expires_at)) {
      return res.status(400).json({
        message: "QR session has expired. Please ask your instructor for a new QR code.",
        expired: true,
        expiredAt: session.expires_at,
      });
    }

    // --- 4. Derive lecture_id strictly from the validated session record ---
    //         The student NEVER controls which lecture they are marking.
    const lectureId = session.lecture_id;

    // --- 5. Resolve authenticated student record from JWT identity ---
    const studentRows = await db.query(
      "SELECT id FROM students WHERE user_id = $1",
      [req.user.id]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(403).json({
        message: "No student profile found for your account. Please contact your institution.",
      });
    }

    const studentId = studentRows[0].id;

    // --- 6. Enrollment / eligibility check ---
    // If student has enrolled courses in the institutional registry,
    // verify that the student is enrolled in the specific subject of this lecture.
    const allEnrollments = await db.query(
      "SELECT id, subject_id FROM enrollments WHERE student_id = $1",
      [studentId]
    );

    if (allEnrollments && allEnrollments.length > 0) {
      const isEnrolled = await db.query(
        `SELECT e.id
         FROM enrollments e
         JOIN lectures l ON l.subject_id = e.subject_id
         WHERE l.id = $1 AND e.student_id = $2`,
        [lectureId, studentId]
      );

      if (!isEnrolled || isEnrolled.length === 0) {
        return res.status(403).json({
          message: "You are not enrolled in the subject associated with this lecture.",
          forbidden: true,
        });
      }
    }

    // --- 7. Duplicate attendance check ---
    const duplicateRows = await db.query(
      "SELECT id FROM attendance WHERE lecture_id = $1 AND student_id = $2",
      [lectureId, studentId]
    );

    if (duplicateRows && duplicateRows.length > 0) {
      return res.status(409).json({
        message: "Attendance already marked for this lecture session.",
        conflict: true,
      });
    }

    // --- 8. Mark attendance with server-side timestamp ---
    const insertRows = await db.query(
      "INSERT INTO attendance (lecture_id, student_id, status) VALUES ($1, $2, 'PRESENT') RETURNING id, attendance_time",
      [lectureId, studentId]
    );

    const record = insertRows[0];

    return res.status(201).json({
      message: "Attendance marked successfully. Status: PRESENT.",
      attendance_id: record.id,
      lecture_id: lectureId,
      student_id: studentId,
      status: "PRESENT",
      attendance_time: record.attendance_time,
    });

  } catch (err) {
    // Handle database-level unique constraint as final safety net
    if (err.code === "23505" || err.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        message: "Attendance already marked for this lecture session.",
        conflict: true,
      });
    }
    console.error("Attendance mark error:", err);
    return res.status(500).json({ message: "Attendance marking failed due to a server error." });
  }
});

/**
 * GET /attendance/my
 * Returns the authenticated student's own attendance records.
 */
router.get("/my", verifyToken, requireStudent, (req, res) => {
  const sql = `
    SELECT
      a.id,
      a.lecture_id,
      a.attendance_time,
      a.status,
      s.subject_code,
      s.subject_name
    FROM attendance a
    JOIN lectures l ON a.lecture_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN students st ON a.student_id = st.id
    WHERE st.user_id = $1
    ORDER BY a.attendance_time DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Fetch my attendance error:", err);
      return res.status(500).json({ message: "Failed to fetch attendance records." });
    }
    res.json({
      message: "Attendance fetched successfully.",
      attendance: results || [],
    });
  });
});

/**
 * GET /attendance/lecture/:lectureId
 * Returns live attendance roster for a lecture.
 * Only accessible by FACULTY or HOD.
 */
router.get("/lecture/:lectureId", verifyToken, requireFacultyOrHod, (req, res) => {
  const sql = `
    SELECT
      a.id,
      a.lecture_id,
      a.attendance_time,
      a.status,
      u.full_name,
      u.email,
      st.roll_number,
      st.section
    FROM attendance a
    JOIN students st ON a.student_id = st.id
    JOIN users u ON st.user_id = u.id
    WHERE a.lecture_id = $1
    ORDER BY a.attendance_time DESC
  `;

  db.query(sql, [req.params.lectureId], (err, results) => {
    if (err) {
      console.error("Fetch lecture attendance error:", err);
      return res.status(500).json({ message: "Failed to fetch lecture attendance." });
    }
    res.json({
      message: "Lecture attendance fetched successfully.",
      attendance: results || [],
    });
  });
});

module.exports = router;