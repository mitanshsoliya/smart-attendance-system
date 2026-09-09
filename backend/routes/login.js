const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and Password are required",
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  const jwtSecret = process.env.JWT_SECRET?.trim() || "smart_attendance_default_secret_key_2026";

  const sql =
    "SELECT id, full_name, email, password, role FROM users WHERE LOWER(email) = LOWER($1)";

  db.query(sql, [cleanEmail], async (err, results) => {
    if (err) {
      console.error("Login Query Error:", err);
      return res.status(500).json({
        message: "Database error during login check",
      });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    // Verify bcrypt hash or fallback to direct plaintext comparison
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(cleanPassword, user.password);
    } catch {
      passwordMatch = false;
    }

    if (!passwordMatch && (user.password === cleanPassword || user.password === password)) {
      passwordMatch = true;
      // Background upgrade of plain password to bcrypt hash
      bcrypt.hash(cleanPassword, 10).then((hashed) => {
        db.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, user.id], () => {});
      }).catch(() => {});
    }

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

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
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  });
});

module.exports = router;