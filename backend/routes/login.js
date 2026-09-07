const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ms9724006035@",
  database: "smart_attendance",
});

const JWT_SECRET = "smart_attendance_secret_key";

router.post("/", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and Password are required",
    });
  }

  const sql =
    "SELECT id, full_name, email, password, role FROM users WHERE email = ?";

  db.query(sql, [email], (err, results) => {
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

    if (password !== user.password) {
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
      JWT_SECRET,
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