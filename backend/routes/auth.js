const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../db");
const { verifyToken, getJwtSecret } = require("../middleware/auth");
const { validateLogin } = require("../middleware/validator");

const router = express.Router();

/**
 * POST /auth/login (and /login)
 * Authenticates user, verifies bcrypt password hash, issues JWT.
 * Enforces one-student-one-device binding for STUDENT accounts.
 */
router.post(["/", "/login"], validateLogin, async (req, res) => {
  const { email, password, device_token } = req.body;

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

    // Fetch linked profile metadata & enforce device binding for STUDENT role
    let profile = null;
    let studentDeviceTokenToReturn = null;

    if (user.role === "STUDENT") {
      const studentRows = await db.query(
        "SELECT id, roll_number, section, student_phone, parent_phone, department, device_token_hash FROM students WHERE user_id = $1",
        [user.id]
      );
      if (studentRows && studentRows.length > 0) {
        const studentRecord = studentRows[0];
        profile = {
          id: studentRecord.id,
          student_id: studentRecord.id,
          roll_number: studentRecord.roll_number || `2024-CSE-${String(studentRecord.id).padStart(3, "0")}`,
          section: studentRecord.section || "Sec A",
          student_phone: studentRecord.student_phone || "",
          parent_phone: studentRecord.parent_phone || "",
          department: studentRecord.department || "Department of Computer Science & Engineering",
        };

        // --- One Student Account -> One Registered Device Protection ---
        const existingHash = studentRecord.device_token_hash;
        const clientDeviceToken = device_token ? String(device_token).trim() : "";

        // Anti-Device Sharing Check: If a device token is presented, check if it belongs to another student
        if (clientDeviceToken) {
          const checkHash = crypto.createHash("sha256").update(clientDeviceToken).digest("hex");
          const conflictRows = await db.query(
            "SELECT id FROM students WHERE device_token_hash = $1 AND id != $2",
            [checkHash, studentRecord.id]
          );

          if (conflictRows && conflictRows.length > 0) {
            return res.status(403).json({
              message: "This device is already registered to another student account. Each device can only be bound to one student.",
              code: "DEVICE_ALREADY_BOUND",
            });
          }
        }

        if (!existingHash) {
          // Case 1: First login (or reset by HOD) -> Generate a fresh, unique 256-bit device token
          const newToken = crypto.randomBytes(32).toString("hex");
          const newHash = crypto.createHash("sha256").update(newToken).digest("hex");
          await db.query(
            "UPDATE students SET device_token_hash = $1, device_registered_at = NOW(), device_last_used_at = NOW() WHERE id = $2",
            [newHash, studentRecord.id]
          );
          studentDeviceTokenToReturn = newToken;
        } else {
          // Case 2: Subsequent login -> Verify registered device token
          if (!clientDeviceToken) {
            return res.status(403).json({
              message: "Your account is registered on another device. Please contact the HOD/admin to verify or reset your registered device.",
              code: "DEVICE_NOT_AUTHORIZED",
            });
          }

          const clientHash = crypto.createHash("sha256").update(clientDeviceToken).digest("hex");
          let isMatch = false;
          try {
            isMatch = crypto.timingSafeEqual(
              Buffer.from(clientHash, "hex"),
              Buffer.from(existingHash, "hex")
            );
          } catch {
            isMatch = false;
          }

          if (!isMatch) {
            return res.status(403).json({
              message: "Your account is registered on another device. Please contact the HOD/admin to verify or reset your registered device.",
              code: "DEVICE_NOT_AUTHORIZED",
            });
          }

          // Legitimate registered device -> update last used timestamp
          await db.query(
            "UPDATE students SET device_last_used_at = NOW() WHERE id = $1",
            [studentRecord.id]
          );
        }
      }
    } else if (user.role === "FACULTY" || user.role === "HOD") {
      const facultyRows = await db.query(
        "SELECT id, department, designation, phone FROM faculty WHERE user_id = $1",
        [user.id]
      );
      if (facultyRows && facultyRows.length > 0) {
        profile = {
          ...facultyRows[0],
          phone: facultyRows[0].phone || "",
          contactNo: facultyRows[0].phone || "",
        };
      }
    }

    // Sign JWT with strictly verified secret from environment
    const token = jwt.sign(
      {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        department: profile?.department || null,
      },
      jwtSecret,
      {
        expiresIn: "24h",
      }
    );

    const responsePayload = {
      message: "Login successful.",
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: profile?.department || null,
        profile: profile,
      },
    };

    if (studentDeviceTokenToReturn) {
      responsePayload.device_token = studentDeviceTokenToReturn;
    }

    res.json(responsePayload);
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
        "SELECT id, roll_number, section, student_phone, parent_phone, department FROM students WHERE user_id = $1",
        [user.id]
      );
      if (studentRows && studentRows.length > 0) {
        profile = {
          student_id: studentRows[0].id,
          roll_number: studentRows[0].roll_number || `2024-CSE-${String(studentRows[0].id).padStart(3, "0")}`,
          section: studentRows[0].section || "Sec A",
          student_phone: studentRows[0].student_phone || "",
          parent_phone: studentRows[0].parent_phone || "",
          department: studentRows[0].department || "Department of Computer Science & Engineering",
        };
      }
    } else if (user.role === "FACULTY" || user.role === "HOD") {
      const facultyRows = await db.query(
        "SELECT id, department, designation, phone FROM faculty WHERE user_id = $1",
        [user.id]
      );
      if (facultyRows && facultyRows.length > 0) {
        profile = {
          faculty_id: facultyRows[0].id,
          department: facultyRows[0].department || "Department of Computer Science & Engineering",
          designation: facultyRows[0].designation || (user.role === "HOD" ? "Professor & HOD" : "Assistant Professor"),
          phone: facultyRows[0].phone || "",
          contactNo: facultyRows[0].phone || "",
        };
      }
    }

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: profile?.department || null,
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
 * PUT /auth/change-password (also /change-password)
 * Allows authenticated user to update their account password securely using bcrypt.
 */
router.put(["/change-password", "/auth/change-password"], verifyToken, async (req, res) => {
  const currentPassword = req.body.currentPassword || req.body.current_password;
  const newPassword = req.body.newPassword || req.body.new_password;

  if (!currentPassword) {
    return res.status(400).json({ message: "Current password is required." });
  }

  if (!newPassword || String(newPassword).trim().length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters in length." });
  }

  try {
    const userRows = await db.query("SELECT id, password FROM users WHERE id = $1", [req.user.id]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ message: "User account not found." });
    }

    const user = userRows[0];
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password does not match system records." });
    }

    const hashedNew = await bcrypt.hash(String(newPassword).trim(), 10);
    await db.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNew, req.user.id]);

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to update password. Please try again." });
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
