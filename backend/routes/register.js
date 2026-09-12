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

module.exports = router;