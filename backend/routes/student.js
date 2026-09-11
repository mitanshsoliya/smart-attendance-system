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
        st.phone,
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
        phone: row.phone || "+91 98450 12890",
        department: "Department of Computer Science & Engineering",
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
 * Allows student to update permitted profile fields (full_name, phone, settings, password).
 * Strictly forbids updating immutable institutional fields (role, email, roll_number, section).
 */
router.put("/profile", async (req, res) => {
  const {
    full_name,
    phone,
    settings,
    current_password,
    new_password,
    role,
    email,
    roll_number,
    section,
  } = req.body;

  // 1. Enforce immutability of institutional governance fields
  if (role && String(role).toUpperCase() !== "STUDENT") {
    return res.status(403).json({ message: "Forbidden: You cannot alter your account role." });
  }
  if (email && email.trim().toLowerCase() !== req.user.email.toLowerCase()) {
    return res.status(403).json({ message: "Forbidden: Student institutional email cannot be self-modified." });
  }
  if (roll_number || section) {
    // Academic cohort assignment is strictly governed by Faculty / HOD
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

    // 3. Update permitted profile fields in users table
    if (full_name && String(full_name).trim()) {
      await db.query("UPDATE users SET full_name = $1 WHERE id = $2", [
        String(full_name).trim(),
        req.user.id,
      ]);
    }

    // 4. Update permitted phone & settings in students table
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanSettingsStr = settings ? (typeof settings === "string" ? settings : JSON.stringify(settings)) : null;

    if (cleanPhone !== null || cleanSettingsStr !== null) {
      // Check if student profile row exists
      const stExists = await db.query("SELECT id FROM students WHERE user_id = $1", [req.user.id]);
      if (stExists && stExists.length > 0) {
        if (cleanPhone !== null && cleanSettingsStr !== null) {
          await db.query("UPDATE students SET phone = $1, settings = $2 WHERE user_id = $3", [
            cleanPhone,
            cleanSettingsStr,
            req.user.id,
          ]);
        } else if (cleanPhone !== null) {
          await db.query("UPDATE students SET phone = $1 WHERE user_id = $2", [
            cleanPhone,
            req.user.id,
          ]);
        } else {
          await db.query("UPDATE students SET settings = $1 WHERE user_id = $2", [
            cleanSettingsStr,
            req.user.id,
          ]);
        }
      } else {
        await db.query(
          "INSERT INTO students (user_id, phone, settings) VALUES ($1, $2, $3)",
          [req.user.id, cleanPhone, cleanSettingsStr]
        );
      }
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
        st.phone,
        st.settings
      FROM users u
      LEFT JOIN students st ON u.id = st.user_id
      WHERE u.id = $1`,
      [req.user.id]
    );

    const updatedRow = refreshed[0];
    let parsedUpdatedSettings = {};
    try {
      if (updatedRow.settings) {
        parsedUpdatedSettings = typeof updatedRow.settings === "string" ? JSON.parse(updatedRow.settings) : updatedRow.settings;
      }
    } catch {
      parsedUpdatedSettings = {};
    }

    res.json({
      message: "Student profile & settings updated successfully.",
      profile: {
        userId: updatedRow.user_id,
        studentId: updatedRow.student_id,
        fullName: updatedRow.full_name,
        email: updatedRow.email,
        role: updatedRow.role,
        rollNumber: updatedRow.roll_number,
        section: updatedRow.section,
        phone: updatedRow.phone,
        settings: parsedUpdatedSettings,
      },
    });
  } catch (err) {
    console.error("Update student profile error:", err);
    res.status(500).json({ message: "Failed to update profile settings." });
  }
});

module.exports = router;