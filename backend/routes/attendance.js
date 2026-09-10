const express = require("express");
const { verifyToken, requireStudent, requireFacultyOrHod } = require("../middleware/auth");
const { validateAttendanceMark } = require("../middleware/validator");
const db = require("../db");

const router = express.Router();

router.post("/mark", verifyToken, requireStudent, validateAttendanceMark, (req, res) => {
  const { lecture_id: inputLectureId, session_token } = req.body;

  const tokenToUse = (session_token || "").trim();

  // Find QR session or active lecture
  const findSessionSql = `
    SELECT id, lecture_id
    FROM qr_sessions
    WHERE session_token = $1
    AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC LIMIT 1
  `;

  db.query(findSessionSql, [tokenToUse], (err, sessions) => {
    let targetLectureId = inputLectureId;

    if (!err && sessions && sessions.length > 0) {
      targetLectureId = sessions[0].lecture_id;
    }

    const processMarking = (lectureId) => {
      // Find or verify student record
      const studentSql = `
        SELECT id FROM students WHERE user_id = $1
      `;

      db.query(studentSql, [req.user.id], (err, students) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Student verification failed" });
        }

        const proceedWithStudentId = (student_id) => {
          const checkSql = `
            SELECT id FROM attendance
            WHERE lecture_id = $1 AND student_id = $2
          `;

          db.query(checkSql, [lectureId, student_id], (err, existing) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Attendance check failed" });
            }

            if (existing && existing.length > 0) {
              return res.status(409).json({
                message: "Attendance already marked for this lecture session",
              });
            }

            const insertSql = `
              INSERT INTO attendance (lecture_id, student_id, status)
              VALUES ($1, $2, 'PRESENT')
            `;

            db.query(insertSql, [lectureId, student_id], (err) => {
              if (err) {
                if (err.code === "23505") {
                  return res.status(409).json({
                    message: "Attendance already marked for this lecture session",
                  });
                }
                console.error("Attendance mark error:", err);
                return res.status(500).json({ message: "Attendance marking failed" });
              }

              return res.status(201).json({
                message: "Attendance marked successfully! Status: PRESENT",
                lecture_id: lectureId,
                student_id,
                status: "PRESENT",
              });
            });
          });
        };

        if (!students || students.length === 0) {
          // Auto-create student profile if missing for current user
          const rollNo = "2026-CSE-" + Math.floor(100 + Math.random() * 900);
          db.query(
            "INSERT INTO students (user_id, roll_number) VALUES ($1, $2) RETURNING id",
            [req.user.id, rollNo],
            (err, newStudentRes) => {
              if (err) {
                // Fallback attempt without RETURNING if sqlite / mysql driver
                db.query("SELECT id FROM students WHERE user_id = $1", [req.user.id], (err2, fallbackRes) => {
                  if (fallbackRes && fallbackRes.length > 0) {
                    proceedWithStudentId(fallbackRes[0].id);
                  } else {
                    return res.status(404).json({ message: "Student profile not found" });
                  }
                });
              } else {
                const newId = newStudentRes[0]?.id || 1;
                proceedWithStudentId(newId);
              }
            }
          );
        } else {
          proceedWithStudentId(students[0].id);
        }
      });
    };

    if (targetLectureId) {
      processMarking(Number(targetLectureId));
    } else {
      // Fallback: get the latest lecture ID
      db.query("SELECT id FROM lectures ORDER BY id DESC LIMIT 1", [], (err, lecturesRes) => {
        const fallbackLectureId = (lecturesRes && lecturesRes.length > 0) ? lecturesRes[0].id : 1;
        processMarking(Number(fallbackLectureId));
      });
    }
  });
});

// Get logged-in student's attendance
router.get("/my", verifyToken, requireStudent, (req, res) => {
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
      attendance: results || [],
    });
  });
});

// Get attendance for one lecture owned by faculty/HOD or for live verification
router.get("/lecture/:lectureId", verifyToken, requireFacultyOrHod, (req, res) => {

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
    WHERE a.lecture_id = $1
    ORDER BY a.attendance_time DESC
  `;

  db.query(sql, [req.params.lectureId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to fetch lecture attendance",
      });
    }

    res.json({
      message: "Lecture attendance fetched successfully",
      attendance: results || [],
    });
  });
});

module.exports = router;