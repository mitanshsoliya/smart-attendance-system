const express = require("express");
const { verifyToken, requireFacultyOrHod } = require("../middleware/auth");
const { validateLecture } = require("../middleware/validator");
const db = require("../db");

const router = express.Router();

// Get Faculty / HOD Lectures
router.get("/my", verifyToken, requireFacultyOrHod, (req, res) => {
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
    WHERE f.user_id = $1
    ORDER BY l.lecture_date DESC, l.start_time DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Fetch lectures error:", err);

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
router.post("/create", verifyToken, requireFacultyOrHod, validateLecture, (req, res) => {
  const {
    subject_id,
    lecture_date,
    start_time,
    end_time,
  } = req.body;

  // Find faculty ID using logged-in user ID
  const facultySql = `
    SELECT id
    FROM faculty
    WHERE user_id = $1
  `;

  db.query(facultySql, [req.user.id], (err, facultyResult) => {
    if (err) {
      console.error("Faculty lookup error:", err);

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
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
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
          if (err.constraint === "lectures_time_order" || err.code === "23514") {
            return res.status(400).json({
              message: "End time must be after start time",
            });
          }

          if (err.code === "23503") {
            return res.status(404).json({
              message: "Selected subject does not exist",
            });
          }

          console.error("Lecture creation error:", err);

          return res.status(500).json({
            message: "Lecture creation failed",
          });
        }

        res.status(201).json({
          message: "Lecture created successfully",
          lecture_id: result[0].id,
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