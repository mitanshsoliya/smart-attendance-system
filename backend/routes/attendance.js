const express = require("express");
const verifyToken = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

router.post("/mark", verifyToken, (req, res) => {
  if (req.user.role !== "STUDENT") {
    return res.status(403).json({
      message: "Only students can mark attendance",
    });
  }

  const { lecture_id, session_token } = req.body;

  if (!lecture_id || !session_token) {
    return res.status(400).json({
      message: "lecture_id and session_token are required",
    });
  }

  const sessionSql = `
    SELECT id
    FROM qr_sessions
    WHERE lecture_id = $1
    AND session_token = $2
    AND expires_at > CURRENT_TIMESTAMP
  `;

  db.query(
    sessionSql,
    [lecture_id, session_token],
    (err, sessions) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "QR verification failed",
        });
      }

      if (sessions.length === 0) {
        return res.status(400).json({
          message: "Invalid or expired QR session",
        });
      }

      const studentSql = `
        SELECT id
        FROM students
        WHERE user_id = $1
      `;

      db.query(
        studentSql,
        [req.user.id],
        (err, students) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              message: "Student verification failed",
            });
          }

          if (students.length === 0) {
            return res.status(404).json({
              message: "Student profile not found",
            });
          }

          const student_id = students[0].id;

          const checkSql = `
            SELECT id
            FROM attendance
            WHERE lecture_id = $1
            AND student_id = $2
          `;

          db.query(
            checkSql,
            [lecture_id, student_id],
            (err, existing) => {
              if (err) {
                console.error(err);
                return res.status(500).json({
                  message: "Attendance check failed",
                });
              }

              if (existing.length > 0) {
                return res.status(409).json({
                  message: "Attendance already marked",
                });
              }

              const insertSql = `
                INSERT INTO attendance
                (lecture_id, student_id, status)
                VALUES ($1, $2, 'PRESENT')
              `;

              db.query(
                insertSql,
                [lecture_id, student_id],
                (err) => {
                  if (err) {
                    if (err.code === "23505") {
                      return res.status(409).json({
                        message: "Attendance already marked",
                      });
                    }
                    console.error("Attendance mark error:", err);
                    return res.status(500).json({
                      message: "Attendance marking failed",
                    });
                  }

                  res.status(201).json({
                    message: "Attendance marked successfully",
                    lecture_id,
                    student_id,
                    status: "PRESENT",
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get logged-in student's attendance
router.get("/my", verifyToken, (req, res) => {

  if (req.user.role !== "STUDENT") {
    return res.status(403).json({
      message: "Only students can access attendance",
    });
  }

  const sql = `
    SELECT
      a.id,
      a.lecture_id,
      a.attendance_time,
      a.status,
      s.subject_code,
      s.subject_name
    FROM attendance a
    JOIN lectures l ON a.lecture_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    JOIN students st ON a.student_id = st.id
    WHERE st.user_id = $1
    ORDER BY a.attendance_time DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {

    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch attendance",
      });
    }

    res.json({
      message: "Attendance fetched successfully",
      attendance: results,
    });

  });
});

// Get attendance for one lecture owned by the logged-in faculty member
router.get("/lecture/:lectureId", verifyToken, (req, res) => {
  if (req.user.role !== "FACULTY" && req.user.role !== "HOD") {
    return res.status(403).json({
      message: "Only faculty or HOD can access lecture attendance",
    });
  }

  const sql = `
    SELECT
      a.id,
      a.lecture_id,
      a.attendance_time,
      a.status,
      u.full_name,
      u.email
    FROM attendance a
    JOIN students st ON a.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN lectures l ON a.lecture_id = l.id
    JOIN faculty f ON l.faculty_id = f.id
    WHERE a.lecture_id = $1
    AND f.user_id = $2
    ORDER BY a.attendance_time DESC
  `;

  db.query(sql, [req.params.lectureId, req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch lecture attendance",
      });
    }

    res.json({
      message: "Lecture attendance fetched successfully",
      attendance: results,
    });
  });
});

module.exports = router;