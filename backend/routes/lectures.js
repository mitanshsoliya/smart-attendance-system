const express = require("express");
const { verifyToken, requireFacultyOrHod } = require("../middleware/auth");
const { validateLecture } = require("../middleware/validator");
const db = require("../db");

const router = express.Router();

/**
 * Helper: computes lecture active/inactive status
 */
function computeLectureStatus(lecture, activeSessionLectureIds = new Set()) {
  if (activeSessionLectureIds.has(Number(lecture.id))) {
    return { status: "ACTIVE", is_active: true };
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentTimeStr = now.toTimeString().split(" ")[0]; // "HH:MM:SS"

  const lecDate = lecture.lecture_date;
  const start = lecture.start_time;
  const end = lecture.end_time;

  if (lecDate === todayStr) {
    if (currentTimeStr >= start && currentTimeStr <= end) {
      return { status: "ACTIVE", is_active: true };
    } else if (currentTimeStr < start) {
      return { status: "UPCOMING", is_active: false };
    } else {
      return { status: "COMPLETED", is_active: false };
    }
  } else if (lecDate > todayStr) {
    return { status: "UPCOMING", is_active: false };
  } else {
    return { status: "COMPLETED", is_active: false };
  }
}

/**
 * GET /lectures/subjects
 * Returns all available academic subjects for course selection.
 */
router.get("/subjects", verifyToken, requireFacultyOrHod, async (req, res) => {
  try {
    const subjects = await db.query(
      "SELECT id, subject_code, subject_name FROM subjects ORDER BY subject_code ASC"
    );
    res.json({
      message: "Subjects fetched successfully",
      subjects: subjects || [],
    });
  } catch (err) {
    console.error("Fetch subjects error:", err);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
});

/**
 * GET /lectures/my
 * Returns lectures for the logged-in faculty member with real-time active/inactive status.
 */
router.get("/my", verifyToken, requireFacultyOrHod, async (req, res) => {
  try {
    const sql = `
      SELECT
        l.id,
        l.subject_id,
        l.faculty_id,
        l.lecture_date,
        l.start_time,
        l.end_time,
        s.subject_code,
        s.subject_name,
        u.full_name as faculty_name
      FROM lectures l
      JOIN subjects s ON l.subject_id = s.id
      JOIN faculty f ON l.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = $1
      ORDER BY l.lecture_date DESC, l.start_time DESC
    `;

    const results = await db.query(sql, [req.user.id]);

    // Query active QR sessions to compute status
    const activeSessions = await db.query(
      "SELECT DISTINCT lecture_id FROM qr_sessions WHERE expires_at > CURRENT_TIMESTAMP"
    );
    const activeLectureIds = new Set((activeSessions || []).map((s) => Number(s.lecture_id)));

    const lecturesWithStatus = (results || []).map((lec) => {
      const { status, is_active } = computeLectureStatus(lec, activeLectureIds);
      return {
        ...lec,
        status,
        is_active,
      };
    });

    res.json({
      message: "Lectures fetched successfully",
      lectures: lecturesWithStatus,
    });
  } catch (err) {
    console.error("Fetch lectures error:", err);
    res.status(500).json({ message: "Failed to fetch lectures" });
  }
});

/**
 * GET /lectures/:id
 * Retrieve single lecture details with active status.
 */
router.get("/:id", verifyToken, requireFacultyOrHod, async (req, res) => {
  try {
    const sql = `
      SELECT
        l.id,
        l.subject_id,
        l.faculty_id,
        l.lecture_date,
        l.start_time,
        l.end_time,
        s.subject_code,
        s.subject_name,
        u.full_name as faculty_name
      FROM lectures l
      JOIN subjects s ON l.subject_id = s.id
      JOIN faculty f ON l.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE l.id = $1
    `;

    const results = await db.query(sql, [req.params.id]);
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const lec = results[0];
    const activeSessions = await db.query(
      "SELECT id FROM qr_sessions WHERE lecture_id = $1 AND expires_at > CURRENT_TIMESTAMP",
      [lec.id]
    );
    const hasActiveSession = activeSessions && activeSessions.length > 0;
    const { status, is_active } = computeLectureStatus(
      lec,
      hasActiveSession ? new Set([Number(lec.id)]) : new Set()
    );

    res.json({
      message: "Lecture details fetched successfully",
      lecture: {
        ...lec,
        status,
        is_active,
      },
    });
  } catch (err) {
    console.error("Fetch single lecture error:", err);
    res.status(500).json({ message: "Failed to fetch lecture" });
  }
});

/**
 * POST /lectures/create
 * Create a new lecture with validation, faculty ownership assignment, and conflict checks.
 */
router.post("/create", verifyToken, requireFacultyOrHod, validateLecture, async (req, res) => {
  const { subject_id, lecture_date, start_time, end_time, faculty_id: requestedFacultyId } = req.body;

  try {
    // 1. Verify subject exists
    const subjectRows = await db.query("SELECT id, subject_code, subject_name FROM subjects WHERE id = $1", [
      subject_id,
    ]);
    if (!subjectRows || subjectRows.length === 0) {
      return res.status(404).json({
        message: "Selected subject does not exist.",
      });
    }

    // 2. Resolve faculty ID (Verify ownership or HOD delegation)
    let faculty_id = null;
    if (req.user.role === "HOD" && requestedFacultyId) {
      faculty_id = Number(requestedFacultyId);
    } else {
      const facultyResult = await db.query("SELECT id FROM faculty WHERE user_id = $1", [req.user.id]);
      if (!facultyResult || facultyResult.length === 0) {
        return res.status(404).json({
          message: "Faculty profile not found for authenticated account.",
        });
      }
      faculty_id = facultyResult[0].id;
    }

    // 3. Insert lecture
    const lectureSql = `
      INSERT INTO lectures
      (subject_id, faculty_id, lecture_date, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await db.query(lectureSql, [
      subject_id,
      faculty_id,
      lecture_date,
      start_time,
      end_time,
    ]);

    const createdLectureId = result[0].id;

    res.status(201).json({
      message: "Lecture created successfully",
      lecture_id: createdLectureId,
      subject_id,
      faculty_id,
      lecture_date,
      start_time,
      end_time,
      status: "UPCOMING",
      is_active: false,
    });
  } catch (err) {
    if (err.constraint === "lectures_time_order" || err.code === "23514") {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }
    console.error("Lecture creation error:", err);
    res.status(500).json({ message: "Lecture creation failed" });
  }
});

/**
 * PUT /lectures/:id
 * Edit an existing lecture with strict faculty ownership verification and time range validation.
 */
router.put("/:id", verifyToken, requireFacultyOrHod, async (req, res) => {
  const { lecture_date, start_time, end_time, subject_id, faculty_id } = req.body;
  const lectureId = req.params.id;

  try {
    // 1. Check lecture existence and retrieve current values
    const existingRows = await db.query(
      `SELECT l.id, l.faculty_id, l.subject_id, l.lecture_date, l.start_time, l.end_time, f.user_id as faculty_user_id
       FROM lectures l
       JOIN faculty f ON l.faculty_id = f.id
       WHERE l.id = $1`,
      [lectureId]
    );

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ message: "Lecture record not found." });
    }

    const currentLecture = existingRows[0];

    // 2. Verify faculty ownership (HOD can edit any; Faculty can only edit their own)
    if (req.user.role !== "HOD" && currentLecture.faculty_user_id !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to modify this lecture.",
      });
    }

    // 3. Validate times if provided
    const newStart = start_time ? String(start_time).trim() : currentLecture.start_time;
    const newEnd = end_time ? String(end_time).trim() : currentLecture.end_time;
    const newDate = lecture_date ? String(lecture_date).trim() : currentLecture.lecture_date;
    const newSubjectId = subject_id ? Number(subject_id) : currentLecture.subject_id;

    if (newStart >= newEnd) {
      return res.status(400).json({ message: "End time must be strictly after start time." });
    }

    // 4. Validate subject if modified
    if (subject_id) {
      const subjectCheck = await db.query("SELECT id FROM subjects WHERE id = $1", [newSubjectId]);
      if (!subjectCheck || subjectCheck.length === 0) {
        return res.status(404).json({ message: "Selected subject does not exist." });
      }
    }

    // 5. Update lecture record
    const updateSql = `
      UPDATE lectures
      SET lecture_date = $1, start_time = $2, end_time = $3, subject_id = $4
      WHERE id = $5
    `;

    await db.query(updateSql, [newDate, newStart, newEnd, newSubjectId, lectureId]);

    res.json({
      message: "Lecture updated successfully.",
      lecture: {
        id: Number(lectureId),
        subject_id: newSubjectId,
        lecture_date: newDate,
        start_time: newStart,
        end_time: newEnd,
      },
    });
  } catch (err) {
    console.error("Update lecture error:", err);
    res.status(500).json({ message: "Failed to update lecture record." });
  }
});

/**
 * DELETE /lectures/:id
 * Delete a lecture with faculty ownership check.
 */
router.delete("/:id", verifyToken, requireFacultyOrHod, async (req, res) => {
  const lectureId = req.params.id;

  try {
    const existing = await db.query(
      `SELECT l.id, f.user_id as faculty_user_id
       FROM lectures l
       JOIN faculty f ON l.faculty_id = f.id
       WHERE l.id = $1`,
      [lectureId]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: "Lecture not found." });
    }

    if (req.user.role !== "HOD" && existing[0].faculty_user_id !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden: You can only delete lectures you created.",
      });
    }

    // Clean up dependent attendance and qr_sessions if any
    await db.query("DELETE FROM attendance WHERE lecture_id = $1", [lectureId]);
    await db.query("DELETE FROM qr_sessions WHERE lecture_id = $1", [lectureId]);
    await db.query("DELETE FROM lectures WHERE id = $1", [lectureId]);

    res.json({ message: "Lecture deleted successfully." });
  } catch (err) {
    console.error("Delete lecture error:", err);
    res.status(500).json({ message: "Failed to delete lecture." });
  }
});

module.exports = router;