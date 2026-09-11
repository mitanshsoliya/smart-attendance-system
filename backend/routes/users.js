const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { verifyToken, requireHod, requireFacultyOrHod } = require("../middleware/auth");

const router = express.Router();

// Enforce authentication on all user-management operations
router.use(verifyToken);

/**
 * POST /users/students
 * Permitted roles: FACULTY, HOD
 * Forbidden roles: STUDENT, Anonymous
 */
router.post("/students", requireFacultyOrHod, async (req, res) => {

  const { full_name, email, password, roll_number, section } = req.body;

  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ message: "Student full name is required." });
  }
  if (!email || !String(email).trim()) {
    return res.status(400).json({ message: "Student email address is required." });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters in length." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: "Invalid email address format." });
  }

  const cleanName = String(full_name).trim();
  const cleanPassword = String(password).trim();
  const cleanSection = section ? String(section).trim() : "Sec A";

  try {
    // 1. Prevent duplicate email accounts
    const existingUsers = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [cleanEmail]);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: "Conflict: An account with this email already exists." });
    }

    // 2. Prevent duplicate roll numbers if provided
    let cleanRoll = roll_number ? String(roll_number).trim() : null;
    if (cleanRoll) {
      const existingRolls = await db.query(
        "SELECT id FROM students WHERE LOWER(roll_number) = LOWER($1)",
        [cleanRoll]
      );
      if (existingRolls && existingRolls.length > 0) {
        return res.status(409).json({ message: "Conflict: A student with this roll number already exists." });
      }
    }

    // 3. Securely hash password
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // 4. Create base user record with role 'STUDENT'
    const userResult = await db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'STUDENT') RETURNING id",
      [cleanName, cleanEmail, hashedPassword]
    );

    const userId = userResult && userResult[0] ? userResult[0].id : null;
    if (!userId) {
      return res.status(500).json({ message: "Failed to create user account record." });
    }

    // Default roll number if not provided
    if (!cleanRoll) {
      cleanRoll = `2024-CSE-${String(userId).padStart(3, "0")}`;
    }

    // 5. Create linked student profile record
    const studentResult = await db.query(
      "INSERT INTO students (user_id, roll_number, section) VALUES ($1, $2, $3) RETURNING id",
      [userId, cleanRoll, cleanSection]
    );

    const studentId = studentResult && studentResult[0] ? studentResult[0].id : userId;

    // 6. Handle enrollment / academic relationship if course or subject is specified
    const targetCourse = req.body.course || req.body.subject_code;
    let enrolledCourse = null;
    if (targetCourse && String(targetCourse).trim()) {
      const cleanCourse = String(targetCourse).trim().toUpperCase();
      let subRows = await db.query(
        "SELECT id, subject_code FROM subjects WHERE UPPER(subject_code) = UPPER($1)",
        [cleanCourse]
      );
      let subjectId = subRows && subRows[0] ? subRows[0].id : null;
      if (!subjectId) {
        const subInsert = await db.query(
          "INSERT INTO subjects (subject_code, subject_name) VALUES ($1, $2) RETURNING id",
          [cleanCourse, `${cleanCourse} Lecture Module`]
        );
        subjectId = subInsert && subInsert[0] ? subInsert[0].id : null;
      }

      if (subjectId) {
        await db.query(
          "INSERT INTO enrollments (student_id, subject_id) VALUES ($1, $2) ON CONFLICT (student_id, subject_id) DO NOTHING",
          [studentId, subjectId]
        );
        enrolledCourse = cleanCourse;
      }
    }

    return res.status(201).json({
      message: "Student account successfully created and enrolled.",
      student: {
        id: studentId,
        userId: userId,
        fullName: cleanName,
        email: cleanEmail,
        rollNumber: cleanRoll,
        section: cleanSection,
        enrolledCourse: enrolledCourse,
        role: "STUDENT",
        createdBy: req.user.email,
      },
    });
  } catch (err) {
    console.error("Student creation error:", err);
    if (err.code === "23505" || err.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Conflict: Duplicate record detected." });
    }
    return res.status(500).json({ message: "Internal server error during student registration." });
  }
});

/**
 * POST /users/faculty
 * Permitted roles: HOD
 * Forbidden roles: FACULTY, STUDENT, Anonymous
 * Cannot create role HOD / Admin
 */
router.post("/faculty", requireHod, async (req, res) => {
  // Prevent HOD self-replication or creation of additional HOD/Admin accounts
  const requestedRole = String(req.body.role || "FACULTY").toUpperCase();
  if (requestedRole === "HOD" || requestedRole === "ADMIN") {
    return res.status(403).json({
      message: "Forbidden: Creation of additional HOD/Admin accounts is strictly restricted.",
    });
  }

  const { full_name, email, password, department, designation } = req.body;

  if (!full_name || !String(full_name).trim()) {
    return res.status(400).json({ message: "Faculty member full name is required." });
  }
  if (!email || !String(email).trim()) {
    return res.status(400).json({ message: "Faculty email address is required." });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters in length." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: "Invalid email address format." });
  }

  const cleanName = String(full_name).trim();
  const cleanPassword = String(password).trim();
  const cleanDept = department ? String(department).trim() : "Department of Computer Science & Engineering";
  const cleanDesignation = designation ? String(designation).trim() : "Assistant Professor";

  try {
    // Prevent duplicate email accounts
    const existingUsers = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [cleanEmail]);
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ message: "Conflict: An account with this email already exists." });
    }

    // Securely hash password
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    // Create base user record with role 'FACULTY'
    const userResult = await db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'FACULTY') RETURNING id",
      [cleanName, cleanEmail, hashedPassword]
    );

    const userId = userResult && userResult[0] ? userResult[0].id : null;
    if (!userId) {
      return res.status(500).json({ message: "Failed to create user account record." });
    }

    // Create linked faculty profile record
    const facultyResult = await db.query(
      "INSERT INTO faculty (user_id, department, designation) VALUES ($1, $2, $3) RETURNING id",
      [userId, cleanDept, cleanDesignation]
    );

    const facultyId = facultyResult && facultyResult[0] ? facultyResult[0].id : userId;

    return res.status(201).json({
      message: "Faculty member successfully onboarded.",
      faculty: {
        id: facultyId,
        userId: userId,
        fullName: cleanName,
        email: cleanEmail,
        department: cleanDept,
        designation: cleanDesignation,
        role: "FACULTY",
        createdBy: req.user.email,
      },
    });
  } catch (err) {
    console.error("Faculty creation error:", err);
    if (err.code === "23505" || err.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Conflict: Duplicate record detected." });
    }
    return res.status(500).json({ message: "Internal server error during faculty onboarding." });
  }
});

/**
 * GET /users/students
 * Permitted roles: FACULTY, HOD
 */
router.get("/students", requireFacultyOrHod, async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        st.id as student_id,
        st.roll_number,
        st.section,
        u.id as user_id,
        u.full_name,
        u.email,
        u.created_at
      FROM students st
      JOIN users u ON st.user_id = u.id
      ORDER BY u.full_name ASC
    `);

    const students = (rows || []).map((r, i) => ({
      id: r.student_id,
      userId: r.user_id,
      fullName: r.full_name,
      email: r.email,
      rollNumber: r.roll_number || `2024-CSE-${String(r.student_id || i + 1).padStart(3, "0")}`,
      section: r.section || (i % 2 === 0 ? "Sec A" : "Sec B"),
      createdAt: r.created_at,
    }));

    res.json({ students });
  } catch (err) {
    console.error("Fetch students error:", err);
    res.status(500).json({ message: "Failed to retrieve student directory." });
  }
});

/**
 * GET /users/faculty
 * Permitted roles: HOD
 */
router.get("/faculty", requireHod, async (req, res) => {

  try {
    const rows = await db.query(`
      SELECT 
        f.id as faculty_id,
        f.department,
        f.designation,
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        u.created_at
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      ORDER BY u.full_name ASC
    `);

    const faculty = (rows || []).map((r) => ({
      id: r.faculty_id,
      userId: r.user_id,
      fullName: r.full_name,
      email: r.email,
      role: r.role,
      department: r.department || "Department of Computer Science & Engineering",
      designation: r.designation || (r.role === "HOD" ? "Professor & HOD" : "Assistant Professor"),
      createdAt: r.created_at,
    }));

    res.json({ faculty });
  } catch (err) {
    console.error("Fetch faculty error:", err);
    res.status(500).json({ message: "Failed to retrieve faculty directory." });
  }
});

module.exports = router;
