const express = require("express");
const mysql = require("mysql2");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ms9724006035@",
  database: "smart_attendance",
});

router.post("/", (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({
      message: "Full name, email, password and role are required",
    });
  }

  const allowedRoles = ["HOD", "FACULTY", "STUDENT"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  const sql =
    "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(
    sql,
    [full_name, email, password, role],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "Email already registered",
          });
        }

        console.error(err);

        return res.status(500).json({
          message: "Registration failed",
        });
      }

      res.status(201).json({
        message: "Registration successful",
        user_id: result.insertId,
        full_name: full_name,
        email: email,
        role: role,
      });
    }
  );
});

module.exports = router;