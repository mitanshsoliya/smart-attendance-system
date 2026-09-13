const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { full_name, fullName, email, password, role } = req.body;
  const nameToUse = (full_name || fullName || "").trim();

  if (!nameToUse || !email || !password || !role) {
    return res.status(400).json({
      message: "Full name, email, password and role are required",
    });
  }

  const cleanRole = String(role).trim().toUpperCase();

  if (cleanRole === "FACULTY" || cleanRole === "HOD" || cleanRole === "ADMIN") {
    return res.status(403).json({
      message: "Forbidden: Faculty and HOD/Admin accounts cannot be created via public registration. Contact departmental administration.",
    });
  }

  if (cleanRole !== "STUDENT") {
    return res.status(400).json({
      message: "Invalid role. Only STUDENT registration is permitted publicly.",
    });
  }

  let client;
  try {
    client = await db.getClient();
    await client.query("BEGIN");

    const hashedPassword = await bcrypt.hash(password, 10);

    const userSql =
      "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id";

    const userResult = await client.query(userSql, [
      nameToUse,
      String(email).trim().toLowerCase(),
      hashedPassword,
      cleanRole,
    ]);

    const userId = userResult.rows[0].id;

    // Automatically create the linked profile row based on user role to avoid orphan users
    if (role === "STUDENT") {
      await client.query(
        "INSERT INTO students (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        [userId]
      );
    } else if (role === "FACULTY" || role === "HOD") {
      await client.query(
        "INSERT INTO faculty (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        [userId]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Registration successful",
      user_id: userId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
    });
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    if (err.code === "23505" || err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    console.error("Registration error:", err);

    return res.status(500).json({
      message: "Registration failed",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

/**
 * POST /register/request
 * Candidate (Student / Faculty) Registration Request workflow for HOD verification
 */
router.post("/request", async (req, res) => {
  const {
    fullName,
    full_name,
    email,
    password,
    role,
    rollNumber,
    roll_number,
    section,
    studentPhone,
    student_phone,
    parentPhone,
    parent_phone,
    employeeId,
    employee_id,
    designation,
    phone,
    contactNo,
    contact_no,
    department,
  } = req.body;

  const nameToUse = (fullName || full_name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanRole = String(role || "STUDENT").trim().toUpperCase();

  if (!nameToUse || !cleanEmail || !password) {
    return res.status(400).json({ message: "Full name, email, and password are required." });
  }

  if (cleanRole !== "STUDENT" && cleanRole !== "FACULTY") {
    return res.status(400).json({ message: "Invalid role. Self-registration request is only available for Students and Faculty." });
  }

  const cleanDept = (department || "Department of Computer Science & Engineering").trim();

  try {
    // 1. Check if an active account with this email already exists
    const existingUser = await db.query("SELECT id FROM users WHERE LOWER(email) = $1", [cleanEmail]);
    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ message: "An active account with this institutional email already exists. Please log in directly." });
    }

    // 2. Check if a PENDING registration request already exists
    const existingReq = await db.query(
      "SELECT id FROM registration_requests WHERE LOWER(email) = $1 AND status = 'PENDING'",
      [cleanEmail]
    );
    if (existingReq && existingReq.length > 0) {
      return res.status(409).json({ message: "A registration request for this email is already pending review by the Head of Department (HOD)." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanRoll = (rollNumber || roll_number) ? String(rollNumber || roll_number).trim() : null;
    const cleanSec = section ? String(section).trim() : (cleanRole === "STUDENT" ? "Sec A" : null);
    const cleanStdPhone = (studentPhone || student_phone) ? String(studentPhone || student_phone).trim() : null;
    const cleanParPhone = (parentPhone || parent_phone) ? String(parentPhone || parent_phone).trim() : null;
    const cleanEmpId = (employeeId || employee_id) ? String(employeeId || employee_id).trim() : null;
    const cleanDesig = designation ? String(designation).trim() : (cleanRole === "FACULTY" ? "Assistant Professor" : null);
    const cleanFacPhone = (phone || contactNo || contact_no) ? String(phone || contactNo || contact_no).trim() : null;

    const insertSql = `
      INSERT INTO registration_requests (
        full_name, email, password, role,
        roll_number, section, student_phone, parent_phone,
        employee_id, designation, phone, department, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PENDING')
      RETURNING id, full_name, email, role, department, status, created_at
    `;

    const result = await db.query(insertSql, [
      nameToUse,
      cleanEmail,
      hashedPassword,
      cleanRole,
      cleanRoll,
      cleanSec,
      cleanStdPhone,
      cleanParPhone,
      cleanEmpId,
      cleanDesig,
      cleanFacPhone,
      cleanDept,
    ]);

    const created = result && result[0] ? result[0] : null;

    return res.status(201).json({
      message: "Registration request submitted successfully! Your request has been forwarded to the Head of Department (HOD) for verification and approval.",
      request: created,
    });
  } catch (err) {
    console.error("Registration Request Error:", err);
    return res.status(500).json({ message: "Failed to submit registration request. Please try again." });
  }
});

module.exports = router;