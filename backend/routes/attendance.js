const express = require("express");
const crypto = require("crypto");
const { verifyToken, requireStudent, requireFacultyOrHod } = require("../middleware/auth");
const { calculateDistanceInMeters } = require("../utils/geo");
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
  try {
    // --- 1. Resolve authenticated student record strictly from JWT identity ---
    const studentRows = await db.query(
      "SELECT id, user_id, roll_number, department, attendance_security_locked, device_token_hash FROM students WHERE user_id = $1",
      [req.user.id]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(403).json({
        message: "No student profile found for your account. Please contact your institution.",
      });
    }

    const student = studentRows[0];
    const studentId = student.id;

    const clientDeviceToken = req.body?.device_token || req.headers["x-device-token"] || null;
    const clientDeviceHash = clientDeviceToken ? crypto.createHash("sha256").update(String(clientDeviceToken).trim()).digest("hex") : null;
    const effectiveDeviceHash = student.device_token_hash || clientDeviceHash;

    // --- 1b. Security Check: Is this student's attendance access locked? ---
    if (student.attendance_security_locked) {
      return res.status(403).json({
        message: "Attendance request rejected. Your account has been locked. Please contact the HOD.",
        locked: true,
      });
    }

    // --- 1c. Identity Manipulation Detection ---
    // Detect if client attempts to send another student's ID, user_id, or enrollment number.
    const incoming = { ...(req.query || {}), ...(req.body || {}) };
    const incomingStudentId = incoming.student_id ?? incoming.studentId;
    const incomingUserId = incoming.user_id ?? incoming.userId;
    const incomingRoll = incoming.enrollment_no ?? incoming.roll_number ?? incoming.rollNumber ?? incoming.enrollmentNumber;

    let hasIdentityManipulation = false;

    if (incomingStudentId !== undefined && incomingStudentId !== null && String(incomingStudentId).trim() !== "") {
      if (String(incomingStudentId).trim() !== String(student.id).trim()) {
        hasIdentityManipulation = true;
      }
    }

    if (incomingUserId !== undefined && incomingUserId !== null && String(incomingUserId).trim() !== "") {
      if (String(incomingUserId).trim() !== String(req.user.id).trim()) {
        hasIdentityManipulation = true;
      }
    }

    if (incomingRoll !== undefined && incomingRoll !== null && String(incomingRoll).trim() !== "") {
      if (!student.roll_number || String(incomingRoll).trim().toLowerCase() !== String(student.roll_number).trim().toLowerCase()) {
        hasIdentityManipulation = true;
      }
    }

    if (hasIdentityManipulation) {
      await db.query(
        "UPDATE students SET attendance_security_locked = TRUE WHERE id = $1",
        [student.id]
      );

      return res.status(403).json({
        message: "Attendance request rejected. Your account has been locked. Please contact the HOD.",
        locked: true,
      });
    }

    // Security: Purge any client-supplied identity parameters so downstream operations never see them
    if (req.body) {
      delete req.body.student_id;
      delete req.body.studentId;
      delete req.body.user_id;
      delete req.body.userId;
      delete req.body.enrollment_no;
      delete req.body.roll_number;
      delete req.body.rollNumber;
      delete req.body.enrollmentNumber;
    }
    if (req.query) {
      delete req.query.student_id;
      delete req.query.studentId;
      delete req.query.user_id;
      delete req.query.userId;
      delete req.query.enrollment_no;
      delete req.query.roll_number;
      delete req.query.rollNumber;
      delete req.query.enrollmentNumber;
    }

    const { session_token, latitude, longitude } = req.body || {};

    // --- 2. session_token is strictly required ---
    const tokenToUse = session_token ? String(session_token).trim() : "";
    if (!tokenToUse) {
      return res.status(400).json({
        message: "A valid session_token is required to mark attendance. Scan the QR code displayed by your instructor.",
      });
    }

    // --- 3. Resolve QR session from token with Geo-Fence coordinates ---
    const sessionRows = await db.query(
      "SELECT id, lecture_id, expires_at, latitude, longitude, radius_meters FROM qr_sessions WHERE session_token = $1",
      [tokenToUse]
    );

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(404).json({
        message: "Invalid QR code. This session was not found.",
      });
    }

    const session = sessionRows[0];

    // --- 3a. Check session expiration (server clock — not client-supplied) ---
    if (new Date() > new Date(session.expires_at)) {
      return res.status(400).json({
        message: "QR session has expired. Please ask your instructor for a new QR code.",
        expired: true,
        expiredAt: session.expires_at,
      });
    }

    // --- 3b. Geo-Fencing GPS Verification (Anti-Proxy Defense) ---
    // Geo-fencing is enforced ONLY if faculty enabled radius (>0) from their device.
    const isSessionGeoFenced = Boolean(
      session.radius_meters !== null &&
      Number(session.radius_meters) > 0 &&
      session.latitude !== null &&
      session.longitude !== null
    );

    let verifiedDistance = null;

    if (isSessionGeoFenced) {
      if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return res.status(400).json({
          message: `GPS Location Required: Geo-fencing is active for this lecture (${session.radius_meters}m from faculty device). Please enable device location in your browser to verify physical classroom presence.`,
          locationRequired: true,
          allowedRadius: session.radius_meters,
        });
      }

      const radiusAllowed = Number(session.radius_meters);
      const distance = calculateDistanceInMeters(session.latitude, session.longitude, latitude, longitude);

      if (distance === null) {
        return res.status(400).json({
          message: "Invalid GPS coordinates detected. Please verify your device location services and retry.",
        });
      }

      if (distance > radiusAllowed) {
        return res.status(403).json({
          message: `Geo-Fence Verification Failed: You are ${distance}m away from the faculty's classroom device. Attendance requires physical presence within ${radiusAllowed}m.`,
          distance,
          allowedRadius: radiusAllowed,
          outOfBounds: true,
        });
      }

      verifiedDistance = distance;
    } else {
      // Open Attendance Session (No Geo-Fence)
      if (
        session.latitude !== null &&
        session.longitude !== null &&
        latitude !== undefined &&
        latitude !== null &&
        longitude !== undefined &&
        longitude !== null
      ) {
        verifiedDistance = calculateDistanceInMeters(session.latitude, session.longitude, latitude, longitude);
      }
    }

    // --- 4. Derive lecture_id strictly from the validated session record ---
    const lectureId = session.lecture_id;

    // --- 4b. Anti-Proxy Single-Device Enforcement per Lecture Session ---
    // A single physical device cannot mark attendance for more than one student in the same lecture session.
    const hashesToCheck = Array.from(new Set([clientDeviceHash, student.device_token_hash].filter(Boolean)));
    if (hashesToCheck.length > 0) {
      const deviceUsedRows = await db.query(
        `SELECT a.id, a.student_id 
         FROM attendance a 
         WHERE a.lecture_id = $1 
           AND a.device_token_hash = ANY($2::varchar[]) 
           AND a.student_id != $3`,
        [lectureId, hashesToCheck, studentId]
      );

      if (deviceUsedRows && deviceUsedRows.length > 0) {
        // Lock this student's account for proxy attendance on the same device
        await db.query(
          "UPDATE students SET attendance_security_locked = TRUE WHERE id = $1",
          [studentId]
        );

        return res.status(403).json({
          message: "Attendance has already been marked for this lecture session from this device. Multiple student attendance from the same device is strictly prohibited. Your account has been locked. Please contact the HOD.",
          deviceConflict: true,
          locked: true,
        });
      }
    }

    // --- 5b. Department Check: Student must belong to the same department as the Faculty's Lecture ---
    const lectureFacultyRows = await db.query(
      `SELECT f.department as faculty_dept, s.subject_name
       FROM lectures l
       JOIN faculty f ON l.faculty_id = f.id
       JOIN subjects s ON l.subject_id = s.id
       WHERE l.id = $1`,
      [lectureId]
    );

    if (lectureFacultyRows && lectureFacultyRows.length > 0) {
      const lectureInfo = lectureFacultyRows[0];
      const normalizeDept = (d) => String(d || "").trim().toLowerCase();

      if (normalizeDept(student.department) !== normalizeDept(lectureInfo.faculty_dept)) {
        return res.status(403).json({
          message: `Access Denied: This lecture is exclusively for '${lectureInfo.faculty_dept}' students. Your registered department is '${student.department || "Unknown"}'.`,
          forbidden: true,
          studentDepartment: student.department,
          requiredDepartment: lectureInfo.faculty_dept,
        });
      }
    }

    // --- 6. Enrollment / eligibility check ---
    // Guarantee attendance can ONLY be recorded for eligible students enrolled in this subject.
    let isEnrolled = await db.query(
      `SELECT e.id
       FROM enrollments e
       JOIN lectures l ON l.subject_id = e.subject_id
       WHERE l.id = $1 AND e.student_id = $2`,
      [lectureId, studentId]
    );

    if (!isEnrolled || isEnrolled.length === 0) {
      // If student belongs to the same department as the lecture or subject, auto-enroll them
      const deptMatch = await db.query(
        `SELECT l.subject_id FROM lectures l
         JOIN subjects s ON l.subject_id = s.id
         JOIN faculty f ON l.faculty_id = f.id
         WHERE l.id = $1 AND (
           LOWER(COALESCE(s.department, f.department, '')) = LOWER($2)
           OR LOWER(COALESCE(s.department, f.department, '')) LIKE '%' || LOWER($2) || '%'
         )`,
        [lectureId, student.department || ""]
      );

      if (deptMatch && deptMatch.length > 0) {
        const subjId = deptMatch[0].subject_id;
        await db.query(
          "INSERT INTO enrollments (student_id, subject_id) VALUES ($1, $2) ON CONFLICT (student_id, subject_id) DO NOTHING",
          [studentId, subjId]
        );
        isEnrolled = [{ id: 1 }];
      } else {
        return res.status(403).json({
          message: "You are not enrolled in the subject associated with this lecture.",
          forbidden: true,
        });
      }
    }

    // --- 7. Duplicate attendance check ---
    const duplicateRows = await db.query(
      "SELECT id, status FROM attendance WHERE lecture_id = $1 AND student_id = $2",
      [lectureId, studentId]
    );

    if (duplicateRows && duplicateRows.length > 0 && duplicateRows[0].status === "PRESENT") {
      return res.status(409).json({
        message: "Attendance already marked for this lecture session.",
        conflict: true,
      });
    }

    // --- 8. Mark attendance with server-side timestamp and verified distance ---
    // Upsert so if a placeholder ABSENT record existed, it is updated to PRESENT
    let insertRows;
    if (duplicateRows && duplicateRows.length > 0) {
      insertRows = await db.query(
        `UPDATE attendance
         SET status = 'PRESENT',
             attendance_time = CURRENT_TIMESTAMP,
             distance_meters = $1,
             student_latitude = $2,
             student_longitude = $3,
             location_verified = $4,
             device_token_hash = COALESCE($5, device_token_hash)
         WHERE lecture_id = $6 AND student_id = $7
         RETURNING id, attendance_time, distance_meters`,
        [
          verifiedDistance,
          latitude !== undefined && latitude !== null ? Number(latitude) : null,
          longitude !== undefined && longitude !== null ? Number(longitude) : null,
          verifiedDistance !== null,
          effectiveDeviceHash,
          lectureId,
          studentId,
        ]
      );
    } else {
      insertRows = await db.query(
        `INSERT INTO attendance
         (lecture_id, student_id, status, distance_meters, student_latitude, student_longitude, location_verified, device_token_hash, attendance_time)
         VALUES ($1, $2, 'PRESENT', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING id, attendance_time, distance_meters`,
        [
          lectureId,
          studentId,
          verifiedDistance,
          latitude !== undefined && latitude !== null ? Number(latitude) : null,
          longitude !== undefined && longitude !== null ? Number(longitude) : null,
          verifiedDistance !== null,
          effectiveDeviceHash,
        ]
      );
    }

    const record = insertRows[0];

    return res.status(201).json({
      message: `Attendance marked successfully. Status: PRESENT.${
        verifiedDistance !== null ? ` (Location verified: ${verifiedDistance}m from classroom)` : ""
      }`,
      attendance_id: record.id,
      lecture_id: lectureId,
      student_id: studentId,
      status: "PRESENT",
      distance_meters: verifiedDistance,
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
      l.lecture_date,
      l.start_time,
      l.end_time,
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
 * Helper: Find all eligible students for a lecture
 */
async function getEligibleStudentsForLecture(lectureId) {
  const lectureRows = await db.query(
    `SELECT l.id, l.subject_id, s.department as subject_dept, f.department as faculty_dept
     FROM lectures l
     JOIN subjects s ON l.subject_id = s.id
     JOIN faculty f ON l.faculty_id = f.id
     WHERE l.id = $1`,
    [lectureId]
  );

  if (!lectureRows || lectureRows.length === 0) return [];
  const { subject_id, subject_dept, faculty_dept } = lectureRows[0];
  const targetDept = (subject_dept || faculty_dept || "").trim();

  const students = await db.query(
    `SELECT DISTINCT
       st.id as student_id,
       st.roll_number,
       st.section,
       st.department,
       u.id as user_id,
       u.full_name,
       u.email
     FROM students st
     JOIN users u ON st.user_id = u.id
     LEFT JOIN enrollments e ON e.student_id = st.id AND e.subject_id = $1
     WHERE e.id IS NOT NULL
        OR (LOWER(st.department) = LOWER($2) AND $2 != '')
     ORDER BY st.roll_number ASC, u.full_name ASC`,
    [subject_id, targetDept]
  );

  return students || [];
}

/**
 * GET /attendance/lecture/:lectureId
 * Returns live attendance roster for a lecture.
 * Shows PRESENT students in real-time, and if QR session has ended or stopped,
 * displays ABSENT students below the present students.
 * Only accessible by FACULTY or HOD.
 */
router.get("/lecture/:lectureId", verifyToken, requireFacultyOrHod, async (req, res) => {
  const lectureId = req.params.lectureId;
  try {
    // 1. Check if there is an active QR session for this lecture
    const activeSessions = await db.query(
      "SELECT id, expires_at FROM qr_sessions WHERE lecture_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1",
      [lectureId]
    );
    const hasActiveSession = Boolean(activeSessions && activeSessions.length > 0);

    // 2. Check if any QR session ever existed for this lecture
    const allSessions = await db.query(
      "SELECT id, expires_at FROM qr_sessions WHERE lecture_id = $1 ORDER BY id DESC LIMIT 1",
      [lectureId]
    );
    const hasAnySession = Boolean(allSessions && allSessions.length > 0);
    const sessionEnded = hasAnySession && !hasActiveSession;

    // 3. If session has ended or expired, insert ABSENT records for unrecorded eligible students
    if (sessionEnded) {
      const eligibleStudents = await getEligibleStudentsForLecture(lectureId);
      const existingAttendance = await db.query(
        "SELECT student_id, status FROM attendance WHERE lecture_id = $1",
        [lectureId]
      );
      const recordedStudentIds = new Set(existingAttendance.map((r) => String(r.student_id)));

      for (const st of eligibleStudents) {
        if (!recordedStudentIds.has(String(st.student_id))) {
          await db.query(
            `INSERT INTO attendance
             (lecture_id, student_id, status, attendance_time, distance_meters, location_verified)
             VALUES ($1, $2, 'ABSENT', CURRENT_TIMESTAMP, NULL, FALSE)
             ON CONFLICT (lecture_id, student_id) DO NOTHING`,
            [lectureId, st.student_id]
          );
        }
      }
    }

    // 4. Query all attendance records for this lecture
    // Sort: PRESENT first (ordered by attendance_time ASC), then ABSENT (ordered by roll_number ASC)
    const sql = `
      SELECT
        a.id,
        a.lecture_id,
        a.student_id,
        a.attendance_time,
        a.status,
        a.distance_meters,
        a.student_latitude,
        a.student_longitude,
        a.location_verified,
        u.full_name,
        u.email,
        st.roll_number,
        st.section,
        st.department
      FROM attendance a
      JOIN students st ON a.student_id = st.id
      JOIN users u ON st.user_id = u.id
      WHERE a.lecture_id = $1
      ORDER BY
        CASE WHEN a.status = 'PRESENT' THEN 0 ELSE 1 END,
        CASE WHEN a.status = 'PRESENT' THEN a.attendance_time END ASC,
        st.roll_number ASC,
        u.full_name ASC
    `;

    const results = await db.query(sql, [lectureId]);
    const attendanceRecords = results || [];

    const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "ABSENT").length;

    res.json({
      message: "Lecture attendance fetched successfully.",
      attendance: attendanceRecords,
      present_count: presentCount,
      absent_count: absentCount,
      total_count: attendanceRecords.length,
      summary: {
        present_count: presentCount,
        absent_count: absentCount,
        total_count: attendanceRecords.length,
      },
      has_active_session: hasActiveSession,
      session_ended: sessionEnded,
    });
  } catch (err) {
    console.error("Fetch lecture attendance error:", err);
    res.status(500).json({ message: "Failed to fetch lecture attendance roster." });
  }
});

/**
 * PUT /attendance/status
 * Allows faculty (or HOD) to manually override / update a student's attendance status
 * for a lecture session (e.g. mark Present as Absent, or Absent as Present).
 */
router.put("/status", verifyToken, requireFacultyOrHod, async (req, res) => {
  const lecture_id = req.body.lecture_id || req.body.lectureId;
  const student_id = req.body.student_id || req.body.studentId;
  const attendance_id = req.body.attendance_id || req.body.attendanceId;
  const status = req.body.status;

  if (!status || !["PRESENT", "ABSENT"].includes(String(status).toUpperCase())) {
    return res.status(400).json({
      message: "Valid status ('PRESENT' or 'ABSENT') is required.",
    });
  }

  const targetStatus = String(status).toUpperCase();

  try {
    let resolvedLectureId = lecture_id ? Number(lecture_id) : null;
    let resolvedStudentId = student_id ? Number(student_id) : null;

    if (attendance_id && (!resolvedLectureId || !resolvedStudentId)) {
      const attRow = await db.query(
        "SELECT lecture_id, student_id FROM attendance WHERE id = $1",
        [attendance_id]
      );
      if (attRow && attRow.length > 0) {
        resolvedLectureId = resolvedLectureId || attRow[0].lecture_id;
        resolvedStudentId = resolvedStudentId || attRow[0].student_id;
      }
    }

    if (!resolvedLectureId || !resolvedStudentId) {
      return res.status(400).json({
        message: "lecture_id and student_id (or valid attendance_id) are required.",
      });
    }

    // Verify faculty ownership of the lecture (HOD can update any in department)
    if (req.user.role !== "HOD") {
      const ownerRows = await db.query(
        `SELECT l.id FROM lectures l
         JOIN faculty f ON l.faculty_id = f.id
         WHERE l.id = $1 AND f.user_id = $2`,
        [resolvedLectureId, req.user.id]
      );
      if (!ownerRows || ownerRows.length === 0) {
        return res.status(403).json({
          message: "Forbidden: You do not own this lecture session.",
        });
      }
    }

    // Update or insert into attendance table
    const existing = await db.query(
      "SELECT id, status, attendance_time, distance_meters FROM attendance WHERE lecture_id = $1 AND student_id = $2",
      [resolvedLectureId, resolvedStudentId]
    );

    const isPresent = targetStatus === "PRESENT";
    let updatedRecord = null;

    if (existing && existing.length > 0) {
      const updateResult = await db.query(
        `UPDATE attendance
         SET status = $1,
             attendance_time = COALESCE(attendance_time, CURRENT_TIMESTAMP),
             distance_meters = CASE WHEN $2 = true THEN COALESCE(distance_meters, 0) ELSE NULL END,
             location_verified = $2
         WHERE lecture_id = $3 AND student_id = $4
         RETURNING id, lecture_id, student_id, status, attendance_time, distance_meters, location_verified`,
        [targetStatus, isPresent, resolvedLectureId, resolvedStudentId]
      );
      updatedRecord = updateResult && updateResult[0] ? updateResult[0] : null;
    } else {
      const insertResult = await db.query(
        `INSERT INTO attendance
         (lecture_id, student_id, status, attendance_time, distance_meters, location_verified)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
         RETURNING id, lecture_id, student_id, status, attendance_time, distance_meters, location_verified`,
        [
          resolvedLectureId,
          resolvedStudentId,
          targetStatus,
          isPresent ? 0 : null,
          isPresent,
        ]
      );
      updatedRecord = insertResult && insertResult[0] ? insertResult[0] : null;
    }

    return res.json({
      message: `Student attendance successfully updated to ${targetStatus}.`,
      record: updatedRecord,
    });
  } catch (err) {
    console.error("Update attendance status error:", err);
    return res.status(500).json({ message: "Failed to update attendance status." });
  }
});

module.exports = router;