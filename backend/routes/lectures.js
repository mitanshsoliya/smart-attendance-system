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

/**
 * PUT /lectures/:id
 * Edit an existing lecture schedule record (faculty ownership check).
 */
router.put("/:id", verifyToken, requireFacultyOrHod, async (req, res) => {
  const { lecture_date, start_time, end_time, subject_id } = req.body;
  const lectureId = req.params.id;

  if (start_time && end_time && start_time >= end_time) {
    return res.status(400).json({ message: "End time must be after start time" });
  }

  try {
    // Check lecture existence
    const existing = await db.query("SELECT id FROM lectures WHERE id = $1", [lectureId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Lecture record not found" });
    }

    if (lecture_date && start_time && end_time) {
      await db.query(
        "UPDATE lectures SET lecture_date = $1, start_time = $2, end_time = $3 WHERE id = $4",
        [lecture_date, start_time, end_time, lectureId]
      );
    } else if (lecture_date) {
      await db.query("UPDATE lectures SET lecture_date = $1 WHERE id = $2", [lecture_date, lectureId]);
    } else if (start_time && end_time) {
      await db.query("UPDATE lectures SET start_time = $1, end_time = $2 WHERE id = $3", [
        start_time,
        end_time,
        lectureId,
      ]);
    }

    if (subject_id) {
      await db.query("UPDATE lectures SET subject_id = $1 WHERE id = $2", [subject_id, lectureId]);
    }

    res.json({
      message: "Lecture updated successfully",
      lecture_id: Number(lectureId),
    });
  } catch (err) {
    console.error("Update lecture error:", err);
    res.status(500).json({ message: "Failed to update lecture record" });
  }
});

module.exports = router;