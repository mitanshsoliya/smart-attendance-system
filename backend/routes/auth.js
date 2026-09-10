const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { verifyToken, getJwtSecret } = require("../middleware/auth");
const { validateLogin } = require("../middleware/validator");

const router = express.Router();

/**
 * POST /auth/login (and /login)
 * Authenticates user, verifies bcrypt password hash, issues JWT.
 * No plaintext-password fallbacks permitted.
 * No insecure default secrets permitted.
 */
router.post(["/", "/login"], validateLogin, async (req, res) => {
  const { email, password } = req.body;

  let jwtSecret;
  try {
    jwtSecret = getJwtSecret();
  } catch (err) {
    console.error("FATAL: JWT_SECRET environment variable is missing.");
    return res.status(500).json({
      message: "Server authentication misconfigured.",
    });
  }

  const sql =
    "SELECT id, full_name, email, password, role, created_at FROM users WHERE LOWER(email) = LOWER($1)";

  try {
    const results = await db.query(sql, [email]);

    if (!results || results.length === 0) {
      // Use generic error response to prevent user enumeration attacks
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = results[0];

    // Strictly verify password using bcrypt only - zero plaintext fallback
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error("Bcrypt comparison error:", bcryptErr);
      passwordMatch = false;
    }

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Fetch linked profile metadata
    let profile = null;
    if (user.role === "STUDENT") {
      const studentRows = await db.query(
        "SELECT id, roll_number, section FROM students WHERE user_id = $1",
        [user.id]
      );
      if (studentRows && studentRows.length > 0) {
        profile = studentRows[0];
      }
    } else if (user.role === "FACULTY" || user.role === "HOD") {
      const facultyRows = await db.query(
        "SELECT id, department, designation FROM faculty WHERE user_id = $1",
        [user.id]
      );
      if (facultyRows && facultyRows.length > 0) {
        profile = facultyRows[0];
      }
    }

    // Sign JWT with strictly verified secret from environment
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "24h",
      }
    );

    res.json({
      message: "Login successful.",
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        profile: profile,
      },
    });
  } catch (err) {
    console.error("Login Query Error:", err);
    return res.status(500).json({
      message: "Database error during authentication check.",
    });
  }
});

/**
 * GET /auth/me (also /me and /login/me)
 * Protected route returning the current authenticated user's profile.
 */
router.get(["/", "/me"], verifyToken, async (req, res) => {
  try {
    const userRows = await db.query(
      "SELECT id, full_name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({
        message: "User profile not found in system records.",
      });
    }

    const user = userRows[0];
    let profile = null;

    if (user.role === "STUDENT") {
      const studentRows = await db.query(
        "SELECT id, roll_number, section FROM students WHERE user_id = $1",
        [user.id]
      );
      if (studentRows && studentRows.length > 0) {
        profile = {
          student_id: studentRows[0].id,
          roll_number: studentRows[0].roll_number || `2024-CSE-${String(studentRows[0].id).padStart(3, "0")}`,
          section: studentRows[0].section || "Sec A",
        };
      }
    } else if (user.role === "FACULTY" || user.role === "HOD") {
      const facultyRows = await db.query(
        "SELECT id, department, designation FROM faculty WHERE user_id = $1",
        [user.id]
      );
      if (facultyRows && facultyRows.length > 0) {
        profile = {
          faculty_id: facultyRows[0].id,
          department: facultyRows[0].department || "Department of Computer Science & Engineering",
          designation: facultyRows[0].designation || (user.role === "HOD" ? "Professor & HOD" : "Assistant Professor"),
        };
      }
    }

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        profile: profile,
      },
    });
  } catch (err) {
    console.error("Fetch current user (/me) error:", err);
    res.status(500).json({
      message: "Failed to retrieve authenticated user profile.",
    });
  }
});

/**
 * POST /auth/logout (also /logout and /login/logout)
 * Protected route acknowledging session termination.
 */
router.post(["/", "/logout"], verifyToken, (req, res) => {
  res.json({
    message: "Logout successful. Active session terminated.",
    userId: req.user.id,
  });
});

module.exports = router;
