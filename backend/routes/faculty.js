const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { verifyToken, requireFacultyOrHod } = require("../middleware/auth");

const router = express.Router();

// Protect all faculty routes
router.use(verifyToken);
router.use(requireFacultyOrHod);

/**
 * GET /faculty/stats
 * Overview statistics for faculty dashboard.
 */
router.get("/stats", async (req, res) => {
  try {
    // 1. Get faculty ID
    const facRows = await db.query("SELECT id FROM faculty WHERE user_id = $1", [req.user.id]);
    const facultyId = facRows && facRows[0] ? facRows[0].id : null;

    if (!facultyId) {
      return res.json({
        totalLectures: 0,
        totalStudents: 0,
        averageAttendancePct: 0,
        activeSessionsCount: 0,
      });
    }

    // Total lectures conducted by this faculty
    const lecCountRows = await db.query(
      "SELECT COUNT(*) as count FROM lectures WHERE faculty_id = $1",
      [facultyId]
    );
    const totalLectures = Number(lecCountRows[0]?.count || 0);

    // Total distinct students enrolled / attended faculty's lectures
    const stCountRows = await db.query(
      `SELECT COUNT(DISTINCT a.student_id) as count
       FROM attendance a
       JOIN lectures l ON a.lecture_id = l.id
       WHERE l.faculty_id = $1`,
      [facultyId]
    );
    let totalStudents = Number(stCountRows[0]?.count || 0);
    if (totalStudents === 0) {
      const allStRows = await db.query("SELECT COUNT(*) as count FROM students");
      totalStudents = Number(allStRows[0]?.count || 0);
    }

    // Average attendance percentage
    const attStats = await db.query(
      `SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_records
       FROM attendance a
       JOIN lectures l ON a.lecture_id = l.id
       WHERE l.faculty_id = $1`,
      [facultyId]
    );
    const totRec = Number(attStats[0]?.total_records || 0);
    const presRec = Number(attStats[0]?.present_records || 0);
    const avgPct = totRec > 0 ? Number(((presRec / totRec) * 100).toFixed(1)) : 88.5;

    // Active QR sessions count
    const activeQrRows = await db.query(
      `SELECT COUNT(*) as count
       FROM qr_sessions q
       JOIN lectures l ON q.lecture_id = l.id
       WHERE l.faculty_id = $1 AND q.expires_at > CURRENT_TIMESTAMP`,
      [facultyId]
    );
    const activeSessionsCount = Number(activeQrRows[0]?.count || 0);

    res.json({
      totalLectures,
      totalStudents,
      averageAttendancePct: avgPct,
      activeSessionsCount,
    });
  } catch (err) {
    console.error("Fetch faculty stats error:", err);
    res.status(500).json({ message: "Failed to compile faculty statistics." });
  }
});

/**
 * GET /faculty/profile
 * Returns profile details for logged in faculty member.
 */
router.get("/profile", async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        f.id as faculty_id,
        f.department,
        f.designation,
        f.phone
       FROM users u
       LEFT JOIN faculty f ON u.id = f.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Faculty record not found." });
    }

    const row = rows[0];

    res.json({
      profile: {
        userId: row.user_id,
        facultyId: row.faculty_id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        department: row.department || "Department of Computer Science & Engineering",
        designation: row.designation || "Assistant Professor",
        phone: row.phone || "",
        contactNo: row.phone || "",
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error("Fetch faculty profile error:", err);
    res.status(500).json({ message: "Failed to retrieve faculty profile record." });
  }
});

/**
 * PUT /faculty/profile
 * Allows faculty member to update department, designation, phone, or change password.
 * Strictly blocks modifying role or email.
 */
router.put("/profile", async (req, res) => {
  const {
    department,
    designation,
    phone,
    contactNo,
    contact_no,
    full_name,
    current_password,
    new_password,
    role,
    email,
  } = req.body;

  const phoneToUse = phone || contactNo || contact_no;

  if (role && String(role).toUpperCase() !== req.user.role) {
    return res.status(403).json({ message: "Forbidden: You cannot alter your account role." });
  }
  if (email && email.trim().toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ message: "Forbidden: Institutional email cannot be self-modified." });
  }

  try {
    // 1. Password change
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required to update credentials." });
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

    // 2. Full name update in users table
    if (full_name && String(full_name).trim()) {
      await db.query("UPDATE users SET full_name = $1 WHERE id = $2", [
        String(full_name).trim(),
        req.user.id,
      ]);
    }

    // 3. Department, designation, phone update in faculty table
    const cleanDept = department ? String(department).trim() : null;
    const cleanDesig = designation ? String(designation).trim() : null;
    const cleanPhone = phoneToUse ? String(phoneToUse).trim() : null;

    const facExists = await db.query("SELECT id FROM faculty WHERE user_id = $1", [req.user.id]);
    if (facExists && facExists.length > 0) {
      await db.query(
        "UPDATE faculty SET department = COALESCE($1, department), designation = COALESCE($2, designation), phone = COALESCE($3, phone) WHERE user_id = $4",
        [cleanDept, cleanDesig, cleanPhone, req.user.id]
      );
    } else {
      await db.query(
        "INSERT INTO faculty (user_id, department, designation, phone) VALUES ($1, $2, $3, $4)",
        [req.user.id, cleanDept || "Department of Computer Science & Engineering", cleanDesig || "Assistant Professor", cleanPhone]
      );
    }

    const refreshed = await db.query(
      `SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        u.role,
        f.id as faculty_id,
        f.department,
        f.designation,
        f.phone
       FROM users u
       LEFT JOIN faculty f ON u.id = f.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const updatedRow = refreshed[0] || {};

    res.json({
      message: "Faculty profile updated successfully.",
      profile: {
        userId: updatedRow.user_id,
        facultyId: updatedRow.faculty_id,
        fullName: updatedRow.full_name,
        email: updatedRow.email,
        role: updatedRow.role,
        department: updatedRow.department,
        designation: updatedRow.designation,
        phone: updatedRow.phone || "",
        contactNo: updatedRow.phone || "",
      },
    });
  } catch (err) {
    console.error("Update faculty profile error:", err);
    res.status(500).json({ message: "Failed to update faculty profile." });
  }
});

module.exports = router;
