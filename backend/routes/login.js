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

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable is not set");
    return res.status(500).json({
      message: "Server authentication misconfigured",
    });
  }

  const sql =
    "SELECT id, full_name, email, password, role FROM users WHERE email = $1";

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Login failed",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    // Verify bcrypt hash or support legacy plaintext
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
    } catch {
      passwordMatch = false;
    }

    if (!passwordMatch && user.password === password) {
      passwordMatch = true;
      // Upgrade plaintext password to bcrypt in background
      bcrypt.hash(password, 10).then((hashed) => {
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
        expiresIn: "1h",
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