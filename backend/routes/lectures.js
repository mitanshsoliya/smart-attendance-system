const express = require("express");
const mysql = require("mysql2");
const verifyToken = require("../middleware/auth");

const router = express.Router();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ms9724006035@",
  database: "smart_attendance",
});

// Get Faculty Lectures
router.get("/my", verifyToken, (req, res) => {
  if (req.user.role !== "FACULTY") {
    return res.status(403).json({
      message: "Only faculty can access lectures",
    });
  }

  const sql = `
    SELECT
      l.id,
      l.lecture_date,
      l.start_time,
      l.end_time,
      s.subject_code,
      s.subject_name
    FROM lectures l
    JOIN subjects s ON l.subject_id = s.id
    JOIN faculty f ON l.faculty_id = f.id
    WHERE f.user_id = ?
    ORDER BY l.lecture_date DESC, l.start_time DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch lectures",
      });
    }

    res.json({
      message: "Lectures fetched successfully",
      lectures: results,
    });
  });
});

// Create Lecture
router.post("/create", verifyToken, (req, res) => {
  // Only faculty can create lecture
  if (req.user.role !== "FACULTY") {
    return res.status(403).json({
      message: "Only faculty can create lectures",
    });
  }

  const {
    subject_id,
    lecture_date,
    start_time,
    end_time,
  } = req.body;

  // Check required fields
  if (!subject_id || !lecture_date || !start_time || !end_time) {
    return res.status(400).json({
      message:
        "subject_id, lecture_date, start_time and end_time are required",
    });
  }

  // Find faculty ID using logged-in user ID
  const facultySql = `
    SELECT id
    FROM faculty
    WHERE user_id = ?
  `;

  db.query(facultySql, [req.user.id], (err, facultyResult) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Faculty verification failed",
      });
    }

    if (facultyResult.length === 0) {
      return res.status(404).json({
        message: "Faculty profile not found",
      });
    }

    const faculty_id = facultyResult[0].id;

    // Create lecture
    const lectureSql = `
      INSERT INTO lectures
      (subject_id, faculty_id, lecture_date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      lectureSql,
      [
        subject_id,
        faculty_id,
        lecture_date,
        start_time,
        end_time,
      ],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "Lecture creation failed",
          });
        }

        res.status(201).json({
          message: "Lecture created successfully",
          lecture_id: result.insertId,
          subject_id,
          faculty_id,
          lecture_date,
          start_time,
          end_time,
        });
      }
    );
  });
});

module.exports = router;