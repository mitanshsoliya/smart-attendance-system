const express = require("express");
const { verifyToken, requireFacultyOrHod } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// Protect all subject management routes
router.use(verifyToken);

/**
 * GET /subjects
 * Fetch academic courses/subjects with faculty name and enrolled count.
 * Filtered by faculty department if requested by FACULTY role.
 */
router.get("/", async (req, res) => {
  try {
    let filterClause = "";
    let params = [];

    if (req.user.role === "FACULTY") {
      const facRows = await db.query("SELECT id, department FROM faculty WHERE user_id = $1", [req.user.id]);
      if (facRows && facRows.length > 0) {
        filterClause = "WHERE s.department = $1 OR s.faculty_id = $2";
        params = [facRows[0].department, facRows[0].id];
      }
    }

    const sql = `
      SELECT
        s.id,
        s.subject_code,
        s.subject_name,
        COALESCE(s.department, 'Department of Computer Science & Engineering') as department,
        COALESCE(s.credit_hours, 3) as credit_hours,
        s.faculty_id,
        u.full_name as faculty_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.subject_id = s.id) as enrolled_count
      FROM subjects s
      LEFT JOIN faculty f ON s.faculty_id = f.id
      LEFT JOIN users u ON f.user_id = u.id
      ${filterClause}
      ORDER BY s.subject_code ASC
    `;

    const subjects = await db.query(sql, params);
    res.json({
      message: "Subjects fetched successfully.",
      subjects: subjects || [],
    });
  } catch (err) {
    console.error("Fetch subjects error:", err);
    res.status(500).json({ message: "Failed to fetch subjects list." });
  }
});

/**
 * GET /subjects/:id
 * Fetch details of a single subject including enrolled student roster.
 */
router.get("/:id", async (req, res) => {
  const subjectId = req.params.id;
  try {
    const subjectRows = await db.query(
      `SELECT
        s.id,
        s.subject_code,
        s.subject_name,
        COALESCE(s.department, 'Department of Computer Science & Engineering') as department,
        COALESCE(s.credit_hours, 3) as credit_hours,
        s.faculty_id,
        u.full_name as faculty_name
       FROM subjects s
       LEFT JOIN faculty f ON s.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE s.id = $1`,
      [subjectId]
    );

    if (!subjectRows || subjectRows.length === 0) {
      return res.status(404).json({ message: "Subject not found." });
    }

    const students = await db.query(
      `SELECT
        e.id as enrollment_id,
        e.enrolled_at,
        st.id as student_id,
        st.roll_number,
        st.section,
        u.id as user_id,
        u.full_name,
        u.email
       FROM enrollments e
       JOIN students st ON e.student_id = st.id
       JOIN users u ON st.user_id = u.id
       WHERE e.subject_id = $1
       ORDER BY st.roll_number ASC, u.full_name ASC`,
      [subjectId]
    );

    res.json({
      message: "Subject details fetched successfully.",
      subject: subjectRows[0],
      students: students || [],
    });
  } catch (err) {
    console.error("Fetch single subject error:", err);
    res.status(500).json({ message: "Failed to fetch subject details." });
  }
});

/**
 * POST /subjects
 * Create a new academic subject/course. Restricted to Faculty or HOD.
 */
router.post("/", requireFacultyOrHod, async (req, res) => {
  const { subject_code, subject_name, department, credit_hours, faculty_id } = req.body;

  if (!subject_code || !String(subject_code).trim()) {
    return res.status(400).json({ message: "Subject code is required." });
  }
  if (!subject_name || !String(subject_name).trim()) {
    return res.status(400).json({ message: "Subject name is required." });
  }

  const cleanCode = String(subject_code).trim().toUpperCase();
  const cleanName = String(subject_name).trim();
  const cleanDept = department ? String(department).trim() : "Department of Computer Science & Engineering";
  const cleanCredits = credit_hours ? Number(credit_hours) : 3;

  try {
    // 1. Check code uniqueness
    const existing = await db.query("SELECT id FROM subjects WHERE UPPER(subject_code) = $1", [
      cleanCode,
    ]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        message: `Subject code '${cleanCode}' already exists. Please choose a unique subject code.`,
        conflict: true,
      });
    }

    // 2. Insert subject safely
    let result;
    try {
      result = await db.query(
        "INSERT INTO subjects (subject_code, subject_name, department, credit_hours, faculty_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [cleanCode, cleanName, cleanDept, cleanCredits, faculty_id ? Number(faculty_id) : null]
      );
    } catch (colErr) {
      result = await db.query(
        "INSERT INTO subjects (subject_code, subject_name) VALUES ($1, $2) RETURNING id",
        [cleanCode, cleanName]
      );
    }

    const createdId = result[0]?.id || Date.now();

    res.status(201).json({
      message: "Subject created successfully.",
      subject: {
        id: createdId,
        subject_code: cleanCode,
        subject_name: cleanName,
        department: cleanDept,
        credit_hours: cleanCredits,
        faculty_id: faculty_id ? Number(faculty_id) : null,
      },
    });
  } catch (err) {
    if (err.code === "23505" || err.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        message: `Subject code '${cleanCode}' already exists. Please choose a unique subject code.`,
        conflict: true,
      });
    }
    console.error("Create subject error:", err);
    res.status(500).json({ message: "Failed to create subject." });
  }
});

/**
 * PUT /subjects/:id
 * Update an existing course/subject. Restricted to Faculty or HOD.
 */
router.put("/:id", requireFacultyOrHod, async (req, res) => {
  const subjectId = req.params.id;
  const { subject_code, subject_name, department, credit_hours, faculty_id } = req.body;

  try {
    const existing = await db.query("SELECT id, subject_code FROM subjects WHERE id = $1", [
      subjectId,
    ]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Subject not found." });
    }

    if (subject_code && String(subject_code).trim().toUpperCase() !== existing[0].subject_code) {
      const codeCheck = await db.query(
        "SELECT id FROM subjects WHERE UPPER(subject_code) = $1 AND id != $2",
        [String(subject_code).trim().toUpperCase(), subjectId]
      );
      if (codeCheck && codeCheck.length > 0) {
        return res.status(409).json({
          message: `Subject code '${subject_code.trim().toUpperCase()}' is already taken by another course.`,
          conflict: true,
        });
      }
    }

    const updateSql = `
      UPDATE subjects
      SET
        subject_code = COALESCE($1, subject_code),
        subject_name = COALESCE($2, subject_name),
        department = COALESCE($3, department),
        credit_hours = COALESCE($4, credit_hours),
        faculty_id = $5
      WHERE id = $6
    `;

    await db.query(updateSql, [
      subject_code ? String(subject_code).trim().toUpperCase() : null,
      subject_name ? String(subject_name).trim() : null,
      department ? String(department).trim() : null,
      credit_hours ? Number(credit_hours) : null,
      faculty_id ? Number(faculty_id) : null,
      subjectId,
    ]);

    const updated = await db.query(
      `SELECT s.id, s.subject_code, s.subject_name, s.department, s.credit_hours, s.faculty_id, u.full_name as faculty_name
       FROM subjects s
       LEFT JOIN faculty f ON s.faculty_id = f.id
       LEFT JOIN users u ON f.user_id = u.id
       WHERE s.id = $1`,
      [subjectId]
    );

    res.json({
      message: "Subject updated successfully.",
      subject: updated[0],
    });
  } catch (err) {
    console.error("Update subject error:", err);
    res.status(500).json({ message: "Failed to update subject." });
  }
});

/**
 * DELETE /subjects/:id
 * Delete a course/subject and clean up associated enrollments. Restricted to HOD.
 */
router.delete("/:id", requireFacultyOrHod, async (req, res) => {
  const subjectId = req.params.id;

  try {
    const existing = await db.query("SELECT id FROM subjects WHERE id = $1", [subjectId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Subject not found." });
    }

    // Clean up dependent attendance, qr_sessions, lectures, and enrollments
    const lectureRows = await db.query("SELECT id FROM lectures WHERE subject_id = $1", [subjectId]);
    if (lectureRows && lectureRows.length > 0) {
      for (const lec of lectureRows) {
        await db.query("DELETE FROM attendance WHERE lecture_id = $1", [lec.id]);
        await db.query("DELETE FROM qr_sessions WHERE lecture_id = $1", [lec.id]);
        await db.query("DELETE FROM lectures WHERE id = $1", [lec.id]);
      }
    }
    await db.query("DELETE FROM enrollments WHERE subject_id = $1", [subjectId]);
    await db.query("DELETE FROM subjects WHERE id = $1", [subjectId]);

    res.json({ message: "Subject deleted successfully." });
  } catch (err) {
    console.error("Delete subject error:", err);
    res.status(500).json({ message: "Failed to delete subject." });
  }
});

/**
 * POST /subjects/:id/enroll
 * Enroll a student into a subject with strict duplicate enrollment prevention.
 */
router.post("/:id/enroll", requireFacultyOrHod, async (req, res) => {
  const subjectId = Number(req.params.id);
  const { student_id, user_id, roll_number } = req.body;

  try {
    // 1. Verify subject existence
    const subRows = await db.query("SELECT id, subject_code, subject_name FROM subjects WHERE id = $1", [
      subjectId,
    ]);
    if (!subRows || subRows.length === 0) {
      return res.status(404).json({ message: "Subject not found." });
    }

    // 2. Resolve student_id
    let resolvedStudentId = null;
    if (student_id) {
      resolvedStudentId = Number(student_id);
    } else if (user_id) {
      const stUser = await db.query("SELECT id FROM students WHERE user_id = $1", [Number(user_id)]);
      if (stUser && stUser.length > 0) resolvedStudentId = Number(stUser[0].id);
    } else if (roll_number) {
      const stRoll = await db.query("SELECT id FROM students WHERE roll_number = $1", [
        String(roll_number).trim(),
      ]);
      if (stRoll && stRoll.length > 0) resolvedStudentId = Number(stRoll[0].id);
    }

    if (!resolvedStudentId) {
      return res.status(404).json({
        message: "Student record not found. Please provide a valid student_id, user_id, or roll_number.",
      });
    }

    // 3. Duplicate enrollment prevention check
    const existingEnrollment = await db.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND subject_id = $2",
      [resolvedStudentId, subjectId]
    );

    if (existingEnrollment && existingEnrollment.length > 0) {
      return res.status(409).json({
        message: "Student is already enrolled in this course.",
        conflict: true,
      });
    }

    // 4. Create enrollment record
    const insertRes = await db.query(
      "INSERT INTO enrollments (student_id, subject_id) VALUES ($1, $2) RETURNING id",
      [resolvedStudentId, subjectId]
    );

    res.status(201).json({
      message: "Student enrolled successfully.",
      enrollment: {
        id: insertRes[0]?.id || Date.now(),
        student_id: resolvedStudentId,
        subject_id: Number(subjectId),
        enrolled_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Enroll student error detail:", err);
    if (err.code === "23505" || err.message?.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        message: "Student is already enrolled in this course.",
        conflict: true,
      });
    }
    res.status(500).json({ message: "Failed to enroll student.", error: err.message });
  }
});

/**
 * DELETE /subjects/:id/unenroll
 * Unenroll a student from a subject.
 */
router.delete("/:id/unenroll", requireFacultyOrHod, async (req, res) => {
  const subjectId = req.params.id;
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ message: "student_id is required for unenrollment." });
  }

  try {
    const existing = await db.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND subject_id = $2",
      [student_id, subjectId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Enrollment record not found for this student and subject." });
    }

    await db.query("DELETE FROM enrollments WHERE student_id = $1 AND subject_id = $2", [
      student_id,
      subjectId,
    ]);

    res.json({ message: "Student unenrolled successfully." });
  } catch (err) {
    console.error("Unenroll student error:", err);
    res.status(500).json({ message: "Failed to unenroll student." });
  }
});

/**
 * GET /subjects/:id/students
 * Return list of enrolled students for a given subject.
 */
router.get("/:id/students", async (req, res) => {
  const subjectId = req.params.id;
  try {
    const students = await db.query(
      `SELECT
        e.id as enrollment_id,
        e.enrolled_at,
        st.id as student_id,
        st.roll_number,
        st.section,
        u.id as user_id,
        u.full_name,
        u.email
       FROM enrollments e
       JOIN students st ON e.student_id = st.id
       JOIN users u ON st.user_id = u.id
       WHERE e.subject_id = $1
       ORDER BY st.roll_number ASC, u.full_name ASC`,
      [subjectId]
    );

    res.json({
      message: "Enrolled students fetched successfully.",
      students: students || [],
    });
  } catch (err) {
    console.error("Fetch enrolled students error:", err);
    res.status(500).json({ message: "Failed to fetch enrolled students." });
  }
});

module.exports = router;
