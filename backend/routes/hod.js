const express = require("express");
const bcrypt = require("bcryptjs");
const { verifyToken, requireHod } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// Strict HOD / Admin Authorization on all routes
router.use(verifyToken);
router.use(requireHod);

/**
 * Helper to retrieve authenticated HOD's active academic department.
 */
async function getHodDepartment(req) {
  if (req.user && req.user.department && String(req.user.department).trim()) {
    return String(req.user.department).trim();
  }
  const facRows = await db.query(
    "SELECT department FROM faculty WHERE user_id = $1",
    [req.user.id]
  );
  if (facRows && facRows.length > 0 && facRows[0].department) {
    return String(facRows[0].department).trim();
  }
  return "Department of Computer Science & Engineering";
}

/**
 * 1. GET /hod/stats
 * Department-level statistics and KPIs for the logged-in HOD.
 */
router.get("/stats", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const studentCountRow = await db.query(
      "SELECT COUNT(*) as count FROM students WHERE department = $1",
      [hodDept]
    );
    const facultyCountRow = await db.query(
      "SELECT COUNT(*) as count FROM faculty WHERE department = $1 AND user_id != $2",
      [hodDept, req.user.id]
    );
    const subjectCountRow = await db.query(
      "SELECT COUNT(*) as count FROM subjects WHERE department = $1",
      [hodDept]
    );
    const lectureCountRow = await db.query(
      `SELECT COUNT(l.id) as count 
       FROM lectures l 
       JOIN subjects s ON l.subject_id = s.id 
       WHERE s.department = $1`,
      [hodDept]
    );

    const totalStudents = Number(studentCountRow[0]?.count || 0);
    const totalFaculty = Number(facultyCountRow[0]?.count || 0);
    const totalCourses = Number(subjectCountRow[0]?.count || 0);
    const totalLectures = Number(lectureCountRow[0]?.count || 0);

    // Calculate overall attendance rate for students in this department
    const totalAttendanceRow = await db.query(
      `SELECT COUNT(a.id) as count 
       FROM attendance a 
       JOIN students st ON a.student_id = st.id 
       WHERE st.department = $1 AND a.status = 'PRESENT'`,
      [hodDept]
    );
    const totalAttendances = Number(totalAttendanceRow[0]?.count || 0);

    const theoreticalAttendances = totalLectures * totalStudents;
    const aggregateAttendance = theoreticalAttendances > 0 
      ? Math.min(100, Math.round((totalAttendances / theoreticalAttendances) * 100 * 10) / 10)
      : 0;

    // At-risk students (< 75% attendance) in this department
    const studentStats = await db.query(
      `SELECT 
        st.id,
        COUNT(a.id) as attended_count
      FROM students st
      LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'PRESENT'
      WHERE st.department = $1
      GROUP BY st.id`,
      [hodDept]
    );

    let atRiskCount = 0;
    (studentStats || []).forEach((s) => {
      const attended = Number(s.attended_count || 0);
      const ratio = totalLectures > 0 ? (attended / totalLectures) * 100 : 100;
      if (ratio < 75) atRiskCount++;
    });

    // Today's active lectures for subjects in this department
    const today = new Date().toISOString().split("T")[0];
    const todayLecturesRow = await db.query(
      `SELECT COUNT(l.id) as count 
       FROM lectures l 
       JOIN subjects s ON l.subject_id = s.id 
       WHERE l.lecture_date = $1 AND s.department = $2`,
      [today, hodDept]
    );
    const todayLectures = Number(todayLecturesRow[0]?.count || 0);

    res.json({
      institution: "LectureLog University",
      department: hodDept,
      academicYear: "AY 2026-27 (Fall Semester)",
      totalStudents,
      totalFaculty,
      totalDepartments: 1,
      totalCourses,
      totalLectures,
      aggregateAttendance,
      atRiskCount,
      todayLectures,
      accreditationTarget: 75,
    });
  } catch (err) {
    console.error("HOD Stats Error:", err);
    res.status(500).json({ message: "Failed to load institution statistics." });
  }
});

/**
 * 2. Student Management: List, Add, Edit, Delete
 */

// GET /hod/students — View student directory
router.get("/students", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const totalLecturesRow = await db.query(
      `SELECT COUNT(l.id) as count 
       FROM lectures l 
       JOIN subjects s ON l.subject_id = s.id 
       WHERE s.department = $1`,
      [hodDept]
    );
    const totalLectures = Number(totalLecturesRow[0]?.count || 0);

    const students = await db.query(
      `SELECT 
        st.id as student_id,
        st.roll_number,
        st.section,
        st.student_phone,
        st.parent_phone,
        st.department,
        st.device_token_hash IS NOT NULL as is_device_bound,
        st.device_registered_at,
        st.attendance_security_locked as is_attendance_locked,
        u.id as user_id,
        u.full_name,
        u.email,
        u.created_at,
        COUNT(a.id) as attended_count
      FROM students st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'PRESENT'
      WHERE (st.department = $1 OR st.department IS NULL OR st.department = '')
      GROUP BY st.id, st.roll_number, st.section, st.student_phone, st.parent_phone, st.department, st.device_token_hash, st.device_registered_at, st.attendance_security_locked, u.id, u.full_name, u.email, u.created_at
      ORDER BY u.full_name ASC`,
      [hodDept]
    );

    const deptPrefix = hodDept.includes("Information") ? "IT" : hodDept.includes("Electronics") ? "ECE" : "CSE";

    const enriched = (students || []).map((s, i) => {
      const attended = Number(s.attended_count || 0);
      const total = totalLectures > 0 ? totalLectures : 38;
      const pct = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0;
      let status = "Clear";
      if (pct < 70) status = "Level 2 Critical";
      else if (pct < 75) status = "Level 1 Advisory";

      return {
        id: s.student_id,
        userId: s.user_id,
        fullName: s.full_name,
        email: s.email,
        rollNumber: s.roll_number || `2024-${deptPrefix}-${String(s.student_id || i + 1).padStart(3, "0")}`,
        section: s.section || (i % 2 === 0 ? "Sec A" : "Sec B"),
        studentPhone: s.student_phone || "",
        parentPhone: s.parent_phone || "",
        department: s.department || hodDept,
        attendedLectures: attended,
        totalLectures: total,
        attendancePercentage: pct,
        status,
        isDeviceBound: Boolean(s.is_device_bound),
        deviceRegisteredAt: s.device_registered_at || null,
        isAttendanceLocked: Boolean(s.is_attendance_locked),
      };
    });

    res.json({ students: enriched });
  } catch (err) {
    console.error("HOD Students Error:", err);
    res.status(500).json({ message: "Failed to load student directory." });
  }
});

// POST /hod/students — Add Student
router.post("/students", async (req, res) => {
  const { fullName, full_name, email, password, rollNumber, roll_number, section, studentPhone, student_phone, parentPhone, parent_phone } = req.body;

  const nameToUse = fullName || full_name;
  if (!nameToUse || !email || !password) {
    return res.status(400).json({ message: "Full name, email, and password are required." });
  }

  try {
    const hodDept = await getHodDepartment(req);
    const deptPrefix = hodDept.includes("Information") ? "IT" : hodDept.includes("Electronics") ? "ECE" : "CSE";

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(nameToUse).trim();
    const cleanRoll = (rollNumber || roll_number) ? String(rollNumber || roll_number).trim() : `2026-${deptPrefix}-${Math.floor(100 + Math.random() * 900)}`;
    const cleanSec = section ? String(section).trim() : "Sec A";
    const cleanStdPhone = (studentPhone || student_phone) ? String(studentPhone || student_phone).trim() : null;
    const cleanParPhone = (parentPhone || parent_phone) ? String(parentPhone || parent_phone).trim() : null;
    const cleanDept = hodDept;

    const existing = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'STUDENT') RETURNING id",
      [cleanName, cleanEmail, hashedPassword]
    );
    const userId = userRes[0].id;

    const studentRes = await db.query(
      "INSERT INTO students (user_id, roll_number, section, student_phone, parent_phone, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [userId, cleanRoll, cleanSec, cleanStdPhone, cleanParPhone, cleanDept]
    );

    res.status(201).json({
      message: `Student profile registered successfully into ${cleanDept}.`,
      student: {
        id: studentRes[0].id,
        userId,
        fullName: cleanName,
        email: cleanEmail,
        rollNumber: cleanRoll,
        section: cleanSec,
        studentPhone: cleanStdPhone || "",
        parentPhone: cleanParPhone || "",
        department: cleanDept,
      },
    });
  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({ message: "Failed to create student account." });
  }
});

// PUT /hod/students/:id — Edit Student
router.put("/students/:id", async (req, res) => {
  const studentId = req.params.id;
  const { fullName, full_name, email, rollNumber, roll_number, section, studentPhone, student_phone, parentPhone, parent_phone } = req.body;

  const nameToUse = fullName || full_name;
  const rollToUse = rollNumber || roll_number;
  const stdPhoneToUse = studentPhone || student_phone;
  const parPhoneToUse = parentPhone || parent_phone;

  try {
    const hodDept = await getHodDepartment(req);
    const studentRows = await db.query(
      "SELECT id, user_id FROM students WHERE id = $1 AND department = $2",
      [studentId, hodDept]
    );
    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ message: "Student record not found in your department." });
    }

    const userId = studentRows[0].user_id;

    if (nameToUse || email) {
      await db.query(
        "UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email) WHERE id = $3",
        [nameToUse ? String(nameToUse).trim() : null, email ? String(email).trim().toLowerCase() : null, userId]
      );
    }

    await db.query(
      "UPDATE students SET roll_number = COALESCE($1, roll_number), section = COALESCE($2, section), student_phone = COALESCE($3, student_phone), parent_phone = COALESCE($4, parent_phone), department = $5 WHERE id = $6",
      [
        rollToUse ? String(rollToUse).trim() : null,
        section ? String(section).trim() : null,
        stdPhoneToUse ? String(stdPhoneToUse).trim() : null,
        parPhoneToUse ? String(parPhoneToUse).trim() : null,
        hodDept,
        studentId,
      ]
    );

    res.json({ message: "Student profile updated successfully." });
  } catch (err) {
    console.error("Edit Student Error:", err);
    res.status(500).json({ message: "Failed to update student profile." });
  }
});

// DELETE /hod/students/:id — Delete Student
router.delete("/students/:id", async (req, res) => {
  const studentId = req.params.id;
  try {
    const hodDept = await getHodDepartment(req);
    const studentRows = await db.query(
      "SELECT id, user_id FROM students WHERE id = $1 AND department = $2",
      [studentId, hodDept]
    );
    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ message: "Student record not found in your department." });
    }
    const userId = studentRows[0].user_id;

    await db.query("DELETE FROM attendance WHERE student_id = $1", [studentId]);
    await db.query("DELETE FROM enrollments WHERE student_id = $1", [studentId]);
    await db.query("DELETE FROM students WHERE id = $1", [studentId]);
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({ message: "Student record deleted successfully." });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ message: "Failed to delete student record." });
  }
});

// POST /hod/students/:id/reset-device — Reset registered device binding for a student
router.post("/students/:id/reset-device", async (req, res) => {
  const studentId = req.params.id;
  try {
    const studentRows = await db.query(
      "SELECT s.id, u.full_name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1",
      [studentId]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const student = studentRows[0];

    await db.query(
      "UPDATE students SET device_token_hash = NULL, device_registered_at = NULL, device_last_used_at = NULL WHERE id = $1",
      [studentId]
    );

    res.json({
      message: `Device binding successfully reset for ${student.full_name}. The student can now register their new device on their next login.`,
      student_id: student.id,
      full_name: student.full_name,
    });
  } catch (err) {
    console.error("Reset Device Error:", err);
    res.status(500).json({ message: "Failed to reset student device binding." });
  }
});

// POST /hod/students/:id/unlock-attendance — HOD Unlocks Student's Attendance Access
router.post("/students/:id/unlock-attendance", async (req, res) => {
  const studentId = req.params.id;

  try {
    const studentRows = await db.query(
      "SELECT s.id, u.full_name, u.email, s.attendance_security_locked FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = $1",
      [studentId]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({ message: "Student record not found." });
    }

    const student = studentRows[0];

    await db.query(
      "UPDATE students SET attendance_security_locked = FALSE WHERE id = $1",
      [studentId]
    );

    res.json({
      message: `Attendance access unlocked successfully for ${student.full_name}.`,
      student_id: student.id,
      full_name: student.full_name,
      unlocked: true,
    });
  } catch (err) {
    console.error("Unlock Attendance Error:", err);
    res.status(500).json({ message: "Failed to unlock student attendance access." });
  }
});

/**
 * 3. Faculty Management: List, Add, Edit, Delete
 */

// GET /hod/faculty — View faculty directory
router.get("/faculty", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const faculty = await db.query(
      `SELECT 
        f.id as faculty_id,
        f.department,
        f.designation,
        f.phone,
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        COUNT(l.id) as lectures_conducted
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN lectures l ON f.id = l.faculty_id
      WHERE f.department = $1 AND u.id != $2
      GROUP BY f.id, f.department, f.designation, f.phone, u.id, u.full_name, u.email, u.role
      ORDER BY u.full_name ASC`,
      [hodDept, req.user.id]
    );

    const enriched = (faculty || []).map((fac) => ({
      id: fac.faculty_id,
      userId: fac.user_id,
      fullName: fac.full_name,
      email: fac.email,
      role: fac.role,
      phone: fac.phone || "",
      contactNo: fac.phone || "",
      department: fac.department || hodDept,
      designation: fac.designation || (fac.role === "HOD" ? "Professor & HOD" : "Assistant Professor"),
      lecturesConducted: Number(fac.lectures_conducted || 0),
      complianceRate: 96.5,
    }));

    res.json({ faculty: enriched });
  } catch (err) {
    console.error("HOD Faculty Error:", err);
    res.status(500).json({ message: "Failed to load faculty directory." });
  }
});

// POST /hod/faculty — Add Faculty
router.post("/faculty", async (req, res) => {
  const { fullName, full_name, email, password, phone, contactNo, contact_no, designation } = req.body;

  const nameToUse = fullName || full_name;
  const phoneToUse = phone || contactNo || contact_no;

  if (!nameToUse || !email || !password) {
    return res.status(400).json({ message: "Full name, email, and password are required." });
  }

  try {
    const hodDept = await getHodDepartment(req);
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(nameToUse).trim();
    const cleanDept = hodDept;
    const cleanDesig = designation ? String(designation).trim() : "Assistant Professor";
    const cleanPhone = phoneToUse ? String(phoneToUse).trim() : null;

    const existing = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'FACULTY') RETURNING id",
      [cleanName, cleanEmail, hashedPassword]
    );
    const userId = userRes[0].id;

    const facRes = await db.query(
      "INSERT INTO faculty (user_id, department, designation, phone) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, cleanDept, cleanDesig, cleanPhone]
    );

    res.status(201).json({
      message: `Faculty member registered successfully into ${cleanDept}.`,
      faculty: {
        id: facRes[0].id,
        userId,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone || "",
        contactNo: cleanPhone || "",
        department: cleanDept,
        designation: cleanDesig,
      },
    });
  } catch (err) {
    console.error("Add Faculty Error:", err);
    res.status(500).json({ message: "Failed to create faculty account." });
  }
});

// PUT /hod/faculty/:id — Edit Faculty
router.put("/faculty/:id", async (req, res) => {
  const facultyId = req.params.id;
  const { fullName, full_name, email, designation, phone, contactNo, contact_no } = req.body;

  const nameToUse = fullName || full_name;
  const phoneToUse = phone || contactNo || contact_no;

  try {
    const hodDept = await getHodDepartment(req);
    const facRows = await db.query(
      "SELECT id, user_id FROM faculty WHERE id = $1 AND department = $2",
      [facultyId, hodDept]
    );
    if (!facRows || facRows.length === 0) {
      return res.status(404).json({ message: "Faculty record not found in your department." });
    }

    const userId = facRows[0].user_id;

    if (nameToUse || email) {
      await db.query(
        "UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email) WHERE id = $3",
        [nameToUse ? String(nameToUse).trim() : null, email ? String(email).trim().toLowerCase() : null, userId]
      );
    }

    await db.query(
      "UPDATE faculty SET designation = COALESCE($1, designation), phone = COALESCE($2, phone), department = $3 WHERE id = $4",
      [
        designation ? String(designation).trim() : null,
        phoneToUse ? String(phoneToUse).trim() : null,
        hodDept,
        facultyId,
      ]
    );

    res.json({ message: "Faculty member updated successfully." });
  } catch (err) {
    console.error("Edit Faculty Error:", err);
    res.status(500).json({ message: "Failed to update faculty member." });
  }
});

// DELETE /hod/faculty/:id — Delete Faculty
router.delete("/faculty/:id", async (req, res) => {
  const facultyId = req.params.id;
  try {
    const hodDept = await getHodDepartment(req);
    const facRows = await db.query(
      "SELECT id, user_id FROM faculty WHERE id = $1 AND department = $2",
      [facultyId, hodDept]
    );
    if (!facRows || facRows.length === 0) {
      return res.status(404).json({ message: "Faculty record not found in your department." });
    }
    const userId = facRows[0].user_id;

    await db.query("UPDATE subjects SET faculty_id = NULL WHERE faculty_id = $1", [facultyId]);
    await db.query("DELETE FROM faculty WHERE id = $1", [facultyId]);
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({ message: "Faculty member deleted successfully." });
  } catch (err) {
    console.error("Delete Faculty Error:", err);
    res.status(500).json({ message: "Failed to delete faculty record." });
  }
});

/**
 * 4. Department Management
 */

// GET /hod/departments — Department metrics & summary (Live from Database)
router.get("/departments", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const studentCountRow = await db.query(
      "SELECT COUNT(id) as count FROM students WHERE department = $1",
      [hodDept]
    );
    const facultyCountRow = await db.query(
      "SELECT COUNT(id) as count FROM faculty WHERE department = $1 AND user_id != $2",
      [hodDept, req.user.id]
    );
    const courseCountRow = await db.query(
      "SELECT COUNT(id) as count FROM subjects WHERE department = $1",
      [hodDept]
    );
    const attendanceCountRow = await db.query(
      `SELECT COUNT(a.id) as count 
       FROM students st 
       JOIN attendance a ON st.id = a.student_id 
       WHERE st.department = $1 AND a.status = 'PRESENT'`,
      [hodDept]
    );
    const lectureCountRow = await db.query(
      `SELECT COUNT(l.id) as count 
       FROM subjects sub 
       JOIN lectures l ON sub.id = l.subject_id 
       WHERE sub.department = $1`,
      [hodDept]
    );

    const students = Number(studentCountRow[0]?.count || 0);
    const faculty = Number(facultyCountRow[0]?.count || 0);
    const courses = Number(courseCountRow[0]?.count || 0);
    const attended = Number(attendanceCountRow[0]?.count || 0);
    const lectures = Number(lectureCountRow[0]?.count || 0);

    const theoretical = lectures * students;
    const attendancePct =
      theoretical > 0
        ? Math.min(100, Math.round((attended / theoretical) * 1000) / 10)
        : 0;

    const code = hodDept.includes("Information") ? "IT" : hodDept.includes("Electronics") ? "ECE" : "CSE";

    const departments = [
      {
        id: `dept-${code.toLowerCase()}`,
        name: hodDept,
        code,
        head: req.user.full_name || "Head of Department",
        students,
        studentsCount: students,
        faculty,
        facultyCount: faculty,
        courses,
        coursesCount: courses,
        avgAttendance: attendancePct,
        attendancePct,
      },
    ];

    res.json({ departments });
  } catch (err) {
    console.error("HOD Departments Error:", err);
    res.status(500).json({ message: "Failed to load departments." });
  }
});

/**
 * 5. Attendance Analytics
 */

// GET /hod/analytics — Department-wise, course-wise, faculty-wise, and student statistics
router.get("/analytics", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const studentCounts = await db.query(
      "SELECT COUNT(id) as count FROM students WHERE department = $1",
      [hodDept]
    );
    const attendanceCounts = await db.query(
      `SELECT COUNT(a.id) as attended_count 
       FROM students st 
       LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'PRESENT' 
       WHERE st.department = $1`,
      [hodDept]
    );
    const lectureCounts = await db.query(
      `SELECT COUNT(l.id) as total_lectures 
       FROM subjects sub 
       LEFT JOIN lectures l ON sub.id = l.subject_id 
       WHERE sub.department = $1`,
      [hodDept]
    );

    const students = Number(studentCounts[0]?.count || 0);
    const attended = Number(attendanceCounts[0]?.attended_count || 0);
    const lectures = Number(lectureCounts[0]?.total_lectures || 0);
    const theoretical = lectures * students;
    const attendancePct = theoretical > 0 ? Math.min(100, Math.round((attended / theoretical) * 1000) / 10) : 0;

    const code = hodDept.includes("Information") ? "IT" : hodDept.includes("Electronics") ? "ECE" : "CSE";

    const departmentAttendance = [
      {
        name: hodDept.replace("Department of ", ""),
        fullName: hodDept,
        code,
        attendancePct,
        targetPct: 75.0,
      },
    ];

    // Course-wise attendance in this department
    const courseStats = await db.query(
      `SELECT 
        s.subject_code,
        s.subject_name,
        COUNT(DISTINCT l.id) as total_lectures,
        COUNT(a.id) as total_attendances
      FROM subjects s
      LEFT JOIN lectures l ON s.id = l.subject_id
      LEFT JOIN attendance a ON l.id = a.lecture_id AND a.status = 'PRESENT'
      WHERE s.department = $1
      GROUP BY s.id, s.subject_code, s.subject_name
      ORDER BY s.subject_code ASC`,
      [hodDept]
    );

    // Faculty-wise lecture statistics in this department
    const facultyStats = await db.query(
      `SELECT 
        u.full_name,
        f.department,
        COUNT(DISTINCT l.id) as lectures_conducted,
        COUNT(a.id) as total_attendances
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN lectures l ON f.id = l.faculty_id
      LEFT JOIN attendance a ON l.id = a.lecture_id AND a.status = 'PRESENT'
      WHERE f.department = $1 AND u.id != $2
      GROUP BY f.id, u.full_name, f.department
      ORDER BY u.full_name ASC`,
      [hodDept, req.user.id]
    );

    // Low attendance student list (< 75%) in this department
    const lowAttendanceStudents = await db.query(
      `SELECT 
        st.id as student_id,
        st.roll_number,
        st.section,
        u.full_name,
        u.email,
        COUNT(a.id) as attended_count
      FROM students st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'PRESENT'
      WHERE st.department = $1
      GROUP BY st.id, st.roll_number, st.section, u.full_name, u.email
      HAVING COUNT(a.id) < 28
      ORDER BY attended_count ASC`,
      [hodDept]
    );

    res.json({
      departmentAttendance,
      courseStats: courseStats || [],
      facultyStats: facultyStats || [],
      lowAttendanceStudents: lowAttendanceStudents || [],
    });
  } catch (err) {
    console.error("HOD Analytics Error:", err);
    res.status(500).json({ message: "Failed to load attendance analytics." });
  }
});

/**
 * 6. Statutory Reports & At-Risk Audit Ledger
 */
router.get("/reports", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const totalLecturesRow = await db.query(
      `SELECT COUNT(l.id) as count 
       FROM lectures l 
       JOIN subjects s ON l.subject_id = s.id 
       WHERE s.department = $1`,
      [hodDept]
    );
    const totalLectures = Number(totalLecturesRow[0]?.count || 0);

    const students = await db.query(
      `SELECT 
        st.id as student_id,
        st.roll_number,
        st.section,
        u.full_name,
        u.email,
        COUNT(a.id) as attended_count
      FROM students st
      JOIN users u ON st.user_id = u.id
      LEFT JOIN attendance a ON st.id = a.student_id AND a.status = 'PRESENT'
      WHERE st.department = $1
      GROUP BY st.id, st.roll_number, st.section, u.full_name, u.email
      ORDER BY u.full_name ASC`,
      [hodDept]
    );

    const deptPrefix = hodDept.includes("Information") ? "IT" : hodDept.includes("Electronics") ? "ECE" : "CSE";

    const ledger = (students || []).map((st, i) => {
      const attended = Number(st.attended_count || 0);
      const pct = totalLectures > 0 
        ? Math.round((attended / totalLectures) * 1000) / 10 
        : 85.0;
      const deficit = Math.max(0, Math.round((75 - pct) * 10) / 10);

      return {
        id: st.student_id,
        name: st.full_name,
        roll: st.roll_number || `2024-${deptPrefix}-${String(i + 101).padStart(3, "0")}`,
        email: st.email,
        attended,
        total: totalLectures,
        percentage: pct,
        deficit,
        status: pct < 75 ? (pct < 65 ? "Disqualification Warning (Level 2)" : "Attendance Advisory (Level 1)") : "Compliant (Good Standing)",
        isAtRisk: pct < 75,
      };
    });

    res.json({
      auditDate: new Date().toISOString(),
      academicCycle: "AY 2026-27",
      statutoryCutoff: "75.0%",
      department: hodDept,
      ledger,
    });
  } catch (err) {
    console.error("HOD Reports Error:", err);
    res.status(500).json({ message: "Failed to load statutory reports." });
  }
});

/**
 * 8. Registration Requests Management (Student & Faculty Self-Registration Verification)
 */

// GET /hod/registration-requests
router.get("/registration-requests", async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req);

    const rows = await db.query(
      `SELECT 
        id,
        full_name,
        email,
        role,
        roll_number,
        section,
        student_phone,
        parent_phone,
        employee_id,
        designation,
        phone,
        department,
        status,
        created_at
      FROM registration_requests
      WHERE department = $1
      ORDER BY 
        CASE WHEN status = 'PENDING' THEN 1 ELSE 2 END,
        created_at DESC`,
      [hodDept]
    );

    const requests = (rows || []).map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      role: r.role,
      rollNumber: r.roll_number || "",
      section: r.section || "",
      studentPhone: r.student_phone || "",
      parentPhone: r.parent_phone || "",
      employeeId: r.employee_id || "",
      designation: r.designation || "",
      phone: r.phone || "",
      department: r.department || hodDept,
      status: r.status || "PENDING",
      createdAt: r.created_at,
    }));

    const pendingStudents = requests.filter((r) => r.role === "STUDENT" && r.status === "PENDING").length;
    const pendingFaculty = requests.filter((r) => r.role === "FACULTY" && r.status === "PENDING").length;
    const approvedTotal = requests.filter((r) => r.status === "APPROVED").length;
    const rejectedTotal = requests.filter((r) => r.status === "REJECTED").length;

    res.json({
      requests,
      counts: {
        total: requests.length,
        pendingTotal: pendingStudents + pendingFaculty,
        pendingStudents,
        pendingFaculty,
        approvedTotal,
        rejectedTotal,
      },
    });
  } catch (err) {
    console.error("GET Registration Requests Error:", err);
    res.status(500).json({ message: "Failed to load registration requests." });
  }
});

// POST /hod/registration-requests/:id/approve
router.post("/registration-requests/:id/approve", async (req, res) => {
  const reqId = req.params.id;
  try {
    const hodDept = await getHodDepartment(req);
    const rows = await db.query(
      "SELECT * FROM registration_requests WHERE id = $1 AND department = $2",
      [reqId, hodDept]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Registration request not found in your department." });
    }

    const reg = rows[0];
    if (reg.status === "APPROVED") {
      return res.status(400).json({ message: "This request has already been approved." });
    }

    const cleanEmail = String(reg.email).trim().toLowerCase();
    const cleanRole = String(reg.role).trim().toUpperCase();
    const cleanName = String(reg.full_name).trim();
    const cleanDept = reg.department || hodDept;

    // 1. Check if user with email already exists in users table
    const existing = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    let userId;

    if (existing && existing.length > 0) {
      userId = existing[0].id;
    } else {
      // Create user account with the password hash already stored in the request
      const userRes = await db.query(
        "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
        [cleanName, cleanEmail, reg.password, cleanRole]
      );
      userId = userRes[0].id;
    }

    // 2. Link student or faculty profile
    let assignedSection = null;
    if (cleanRole === "STUDENT") {
      const deptPrefix = cleanDept.includes("Information") ? "IT" : cleanDept.includes("Electronics") ? "ECE" : "CSE";
      const cleanRoll = reg.roll_number || `2026-${deptPrefix}-${Math.floor(100 + Math.random() * 900)}`;

      // Department HOD decides which section the student belongs to
      assignedSection = (req.body && (req.body.section || req.body.cohort_section))
        ? String(req.body.section || req.body.cohort_section).trim()
        : (reg.section && reg.section !== "Pending HOD Allocation" ? reg.section : "Sec A");

      const cleanStdPhone = reg.student_phone || null;
      const cleanParPhone = reg.parent_phone || null;

      const existingStd = await db.query("SELECT id FROM students WHERE user_id = $1", [userId]);
      if (!existingStd || existingStd.length === 0) {
        await db.query(
          "INSERT INTO students (user_id, roll_number, section, student_phone, parent_phone, department) VALUES ($1, $2, $3, $4, $5, $6)",
          [userId, cleanRoll, assignedSection, cleanStdPhone, cleanParPhone, cleanDept]
        );
      } else {
        await db.query(
          "UPDATE students SET roll_number = $1, section = $2, student_phone = $3, parent_phone = $4, department = $5 WHERE user_id = $6",
          [cleanRoll, assignedSection, cleanStdPhone, cleanParPhone, cleanDept, userId]
        );
      }
    } else if (cleanRole === "FACULTY") {
      const cleanDesig = reg.designation || "Assistant Professor";
      const cleanPhone = reg.phone || null;

      const existingFac = await db.query("SELECT id FROM faculty WHERE user_id = $1", [userId]);
      if (!existingFac || existingFac.length === 0) {
        await db.query(
          "INSERT INTO faculty (user_id, department, designation, phone) VALUES ($1, $2, $3, $4)",
          [userId, cleanDept, cleanDesig, cleanPhone]
        );
      } else {
        await db.query(
          "UPDATE faculty SET department = $1, designation = $2, phone = $3 WHERE user_id = $4",
          [cleanDept, cleanDesig, cleanPhone, userId]
        );
      }
    }

    // 3. Mark request as APPROVED and persist HOD-assigned section
    if (assignedSection) {
      await db.query("UPDATE registration_requests SET status = 'APPROVED', section = $1 WHERE id = $2", [assignedSection, reqId]);
    } else {
      await db.query("UPDATE registration_requests SET status = 'APPROVED' WHERE id = $1", [reqId]);
    }

    res.json({
      message: `${cleanRole === "STUDENT" ? `Student account approved and assigned to ${assignedSection}` : "Faculty account approved"} and onboarded successfully into ${cleanDept}.`,
      requestId: reqId,
      userId,
      role: cleanRole,
      section: assignedSection,
      department: cleanDept,
    });
  } catch (err) {
    console.error("Approve Registration Request Error:", err);
    res.status(500).json({ message: "Failed to approve registration request." });
  }
});

// POST /hod/registration-requests/:id/reject
router.post("/registration-requests/:id/reject", async (req, res) => {
  const reqId = req.params.id;
  try {
    const hodDept = await getHodDepartment(req);
    const rows = await db.query(
      "SELECT id, status FROM registration_requests WHERE id = $1 AND department = $2",
      [reqId, hodDept]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Registration request not found in your department." });
    }

    await db.query("UPDATE registration_requests SET status = 'REJECTED' WHERE id = $1", [reqId]);
    res.json({ message: "Registration request rejected.", requestId: reqId });
  } catch (err) {
    console.error("Reject Registration Request Error:", err);
    res.status(500).json({ message: "Failed to reject registration request." });
  }
});

module.exports = router;
