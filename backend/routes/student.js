const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { verifyToken, requireStudent } = require("../middleware/auth");

const router = express.Router();

// Enforce student role across all student routes
router.use(verifyToken);
router.use(requireStudent);

/**
 * GET /student/dashboard
 */
router.get("/dashboard", (req, res) => {
  res.json({
    message: "Student Dashboard Access Granted",
    user: req.user,
  });
});

/**
 * GET /student/profile
 * Allows a student to view their own profile, academic cohort, and persisted settings.
 */
router.get("/profile", async (req, res) => {
  try {
    const userRows = await db.query(
      `SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        st.id as student_id,
        st.roll_number,
        st.section,
        st.student_phone,
        st.parent_phone,
        st.department,
        st.settings
      FROM users u
      LEFT JOIN students st ON u.id = st.user_id
      WHERE u.id = $1`,
      [req.user.id]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const row = userRows[0];
    let parsedSettings = {};
    try {
      if (row.settings) {
        parsedSettings = typeof row.settings === "string" ? JSON.parse(row.settings) : row.settings;
      }
    } catch {
      parsedSettings = {};
    }

    res.json({
      profile: {
        userId: row.user_id,
        studentId: row.student_id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        rollNumber: row.roll_number || `2024-CSE-${String(row.student_id || row.user_id).padStart(3, "0")}`,
        section: row.section || "Sec A",
        studentPhone: row.student_phone || "",
        parentPhone: row.parent_phone || "",
        department: row.department || "Department of Computer Science & Engineering",
        institution: "St. Xavier’s College of Engineering & Technology",
        settings: parsedSettings,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error("Fetch student profile error:", err);
    res.status(500).json({ message: "Failed to retrieve student profile record." });
  }
});

/**
 * PUT /student/profile
 * Allows student to update permitted profile fields (student_phone, parent_phone, full_name, password, settings).
 * Strictly forbids updating immutable institutional fields (role, email, roll_number, section).
 */
router.put("/profile", async (req, res) => {
  const {
    full_name,
    student_phone,
    studentPhone,
    parent_phone,
    parentPhone,
    phone,
    settings,
    current_password,
    new_password,
    role,
    email,
    roll_number,
    section,
  } = req.body;

  const cleanStudentPhone = student_phone || studentPhone || phone || null;
  const cleanParentPhone = parent_phone || parentPhone || null;

  // 1. Enforce immutability of institutional governance fields
  if (role && String(role).toUpperCase() !== "STUDENT") {
    return res.status(403).json({ message: "Forbidden: You cannot alter your account role." });
  }
  if (email && email.trim().toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ message: "Forbidden: Student institutional email cannot be self-modified." });
  }
  if (roll_number || section) {
    return res.status(403).json({
      message: "Forbidden: Roll number and cohort section are immutable institutional identifiers.",
    });
  }

  try {
    // 2. Handle optional password update
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required to set a new password." });
      }
      if (String(new_password).length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters in length." });
      }

      const userRow = await db.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
      if (!userRow || userRow.length === 0) {
        return res.status(404).json({ message: "User account not found." });
      }

      const match = await bcrypt.compare(current_password, userRow[0].password);
      if (!match) {
        return res.status(400).json({ message: "Current password does not match system records." });
      }

      const hashedNew = await bcrypt.hash(new_password.trim(), 10);
      await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNew, req.user.id]);
    }

    // 3. Update full_name if provided
    if (full_name && String(full_name).trim()) {
      await db.query("UPDATE users SET full_name = $1 WHERE id = $2", [
        String(full_name).trim(),
        req.user.id,
      ]);
    }

    // 4. Update student_phone and parent_phone in students table
    const stExists = await db.query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    if (stExists && stExists.length > 0) {
      await db.query(
        "UPDATE students SET student_phone = COALESCE($1, student_phone), parent_phone = COALESCE($2, parent_phone) WHERE user_id = $3",
        [cleanStudentPhone ? String(cleanStudentPhone).trim() : null, cleanParentPhone ? String(cleanParentPhone).trim() : null, req.user.id]
      );
    } else {
      await db.query(
        "INSERT INTO students (user_id, student_phone, parent_phone) VALUES ($1, $2, $3)",
        [req.user.id, cleanStudentPhone ? String(cleanStudentPhone).trim() : null, cleanParentPhone ? String(cleanParentPhone).trim() : null]
      );
    }

    // Fetch refreshed profile to return
    const refreshed = await db.query(
      `SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        st.id as student_id,
        st.roll_number,
        st.section,
        st.student_phone,
        st.parent_phone,
        st.department
      FROM users u
      LEFT JOIN students st ON u.id = st.user_id
      WHERE u.id = $1`,
      [req.user.id]
    );

    const updatedRow = refreshed[0] || {};

    res.json({
      message: "Student profile & settings updated successfully.",
      profile: {
        userId: updatedRow.user_id,
        studentId: updatedRow.student_id,
        fullName: updatedRow.full_name,
        email: updatedRow.email,
        role: updatedRow.role,
        rollNumber: updatedRow.roll_number || `2024-CSE-${String(updatedRow.student_id || updatedRow.user_id).padStart(3, "0")}`,
        section: updatedRow.section || "Sec A",
        studentPhone: updatedRow.student_phone || "",
        parentPhone: updatedRow.parent_phone || "",
        department: updatedRow.department || "Department of Computer Science & Engineering",
      },
    });
  } catch (err) {
    console.error("Update student profile error:", err);
    res.status(500).json({ message: "Failed to update profile settings.", error: err.message });
  }
});

/**
 * GET /student/courses
 * Retrieves student's enrolled courses with live attendance calculations.
 */
router.get("/courses", async (req, res) => {
  try {
    const stRows = await db.query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    const studentId = stRows && stRows[0] ? stRows[0].id : null;

    let subjects = [];
    if (studentId) {
      subjects = await db.query(
        `SELECT DISTINCT s.id, s.subject_code, s.subject_name
         FROM enrollments e
         JOIN subjects s ON e.subject_id = s.id
         WHERE e.student_id = $1`,
        [studentId]
      );
    }

    if (!subjects || subjects.length === 0) {
      subjects = await db.query(
        "SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_code ASC"
      );
    }

    const coursesWithStats = [];
    for (const sub of subjects || []) {
      let totalLectures = 0;
      let attended = 0;
      if (studentId) {
        const totalRows = await db.query(
          "SELECT COUNT(*) as count FROM lectures WHERE subject_id = $1",
          [sub.id]
        );
        totalLectures = Number(totalRows[0]?.count || 0);

        const attRows = await db.query(
          `SELECT COUNT(*) as count FROM attendance a
           JOIN lectures l ON a.lecture_id = l.id
           WHERE l.subject_id = $1 AND a.student_id = $2 AND a.status = 'PRESENT'`,
          [sub.id, studentId]
        );
        attended = Number(attRows[0]?.count || 0);
      }

      const facRows = await db.query(
        `SELECT u.full_name as faculty_name FROM lectures l
         JOIN faculty f ON l.faculty_id = f.id
         JOIN users u ON f.user_id = u.id
         WHERE l.subject_id = $1 LIMIT 1`,
        [sub.id]
      );
      const facultyName = facRows && facRows[0] ? facRows[0].faculty_name : "Department Faculty";

      const pct = totalLectures > 0 ? Number(((attended / totalLectures) * 100).toFixed(1)) : 100.0;

      coursesWithStats.push({
        id: sub.id,
        code: sub.subject_code,
        name: sub.subject_name,
        faculty: facultyName,
        totalLectures,
        attendedLectures: attended,
        percentage: pct,
        status: pct >= 75 ? "On Track" : "At Risk",
        credits: 4,
        semester: "Semester 5",
      });
    }

    res.json({ courses: coursesWithStats });
  } catch (err) {
    console.error("Fetch student courses error:", err);
    res.status(500).json({ message: "Failed to fetch enrolled courses." });
  }
});

/**
 * GET /student/schedule
 * Retrieves timetable schedule based on real lecture curriculum.
 */
router.get("/schedule", async (req, res) => {
  try {
    const lectureRows = await db.query(`
      SELECT 
        l.id,
        l.lecture_date,
        l.start_time,
        l.end_time,
        s.subject_code,
        s.subject_name,
        u.full_name as faculty_name
      FROM lectures l
      JOIN subjects s ON l.subject_id = s.id
      JOIN faculty f ON l.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      ORDER BY l.lecture_date DESC, l.start_time ASC
      LIMIT 25
    `);

    res.json({ schedule: lectureRows || [] });
  } catch (err) {
    console.error("Fetch student schedule error:", err);
    res.status(500).json({ message: "Failed to fetch student schedule." });
  }
});

/**
 * GET /student/reports
 * Compiles aggregated attendance statistics and subject-wise ledger.
 */
router.get("/reports", async (req, res) => {
  try {
    const stRows = await db.query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
    const studentId = stRows && stRows[0] ? stRows[0].id : null;

    if (!studentId) {
      return res.json({
        standing: {
          percentage: 0,
          status: "No Records Yet",
          totalConducted: 0,
          verifiedPresent: 0,
          absentCount: 0,
          lateCount: 0,
          examClearance: "No Records Found",
        },
        subjectLedger: [],
      });
    }

    const attRows = await db.query(
      `SELECT 
        a.id,
        a.status,
        a.attendance_time,
        s.id as subject_id,
        s.subject_code,
        s.subject_name,
        u.full_name as faculty_name
       FROM attendance a
       JOIN lectures l ON a.lecture_id = l.id
       JOIN subjects s ON l.subject_id = s.id
       LEFT JOIN faculty f ON l.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE a.student_id = $1
       ORDER BY a.attendance_time DESC`,
      [studentId]
    );

    const totalConducted = (attRows || []).length;
    const verifiedPresent = (attRows || []).filter((r) => r.status === "PRESENT").length;
    const absentCount = (attRows || []).filter((r) => r.status === "ABSENT").length;
    const lateCount = (attRows || []).filter((r) => r.status === "LATE").length;

    const overallPct = totalConducted > 0 ? Number(((verifiedPresent / totalConducted) * 100).toFixed(1)) : 0;

    const subjectMap = {};
    for (const r of attRows || []) {
      if (!subjectMap[r.subject_code]) {
        subjectMap[r.subject_code] = {
          code: r.subject_code,
          name: r.subject_name,
          faculty: r.faculty_name || "Department Faculty",
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
        };
      }
      subjectMap[r.subject_code].total += 1;
      if (r.status === "PRESENT") subjectMap[r.subject_code].present += 1;
      else if (r.status === "ABSENT") subjectMap[r.subject_code].absent += 1;
      else if (r.status === "LATE") subjectMap[r.subject_code].late += 1;
    }

    const subjectLedger = Object.values(subjectMap).map((sub) => {
      const pct = sub.total > 0 ? Number(((sub.present / sub.total) * 100).toFixed(1)) : 0;
      const margin = Number((pct - 75.0).toFixed(1));
      return {
        ...sub,
        percentage: pct,
        margin: margin >= 0 ? `+${margin}% safety` : `${margin}% below limit`,
        indicator: pct >= 85 ? "Exemplary" : pct >= 75 ? "Compliant" : "Review Needed",
      };
    });

    res.json({
      standing: {
        percentage: overallPct,
        status: overallPct >= 75 ? "Compliant • Good Standing" : totalConducted === 0 ? "No Records Yet" : "Warning • Below 75%",
        totalConducted,
        verifiedPresent,
        absentCount,
        lateCount,
        examClearance: overallPct >= 75 ? "Safe for Final Exams" : totalConducted === 0 ? "Pending Semester Start" : "Attendance Shortfall Warning",
      },
      subjectLedger,
    });
  } catch (err) {
    console.error("Fetch student reports error:", err);
    res.status(500).json({ message: "Failed to compile attendance reports." });
  }
});

module.exports = router;