/**
 * Request Input Validation Middleware for LectureLog
 * Provides input validation to ensure well-formed requests
 * before hitting database queries or business logic.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

/**
 * Validates Login payload (email, password)
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !String(email).trim()) {
    return res.status(400).json({
      message: "Email is required.",
      field: "email",
    });
  }

  if (!password || !String(password).trim()) {
    return res.status(400).json({
      message: "Password is required.",
      field: "password",
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({
      message: "Invalid email format. Please provide a valid email address.",
      field: "email",
    });
  }

  req.body.email = cleanEmail;
  req.body.password = String(password).trim();
  next();
};

/**
 * Validates Lecture Creation payload
 * (subject_id, lecture_date, start_time, end_time)
 */
const validateLecture = (req, res, next) => {
  const { subject_id, lecture_date, start_time, end_time } = req.body || {};

  if (!subject_id || isNaN(Number(subject_id)) || Number(subject_id) <= 0) {
    return res.status(400).json({
      message: "A valid positive numeric subject_id is required.",
      field: "subject_id",
    });
  }

  if (!lecture_date || !DATE_REGEX.test(String(lecture_date).trim())) {
    return res.status(400).json({
      message: "Invalid lecture_date. Must be formatted as YYYY-MM-DD.",
      field: "lecture_date",
    });
  }

  // Lenient time parser supporting HH:MM, HH:MM:SS, H:MM, H:MM:SS, and 12-hour AM/PM
  const normalizeTime = (raw) => {
    if (!raw) return null;
    const str = String(raw).trim();
    // Check 12-hour AM/PM like "10:00 AM", "2:30 pm", "09:15am"
    const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([aApP][mM])$/);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = ampmMatch[2];
      const seconds = ampmMatch[3] || "00";
      const modifier = ampmMatch[4].toUpperCase();

      if (hours < 1 || hours > 12) return null;
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    }

    // Check standard 24-hour formats like "10:00", "10:00:00", "9:30", "09:30:00"
    const match24 = str.match(/^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      if (hours < 0 || hours > 23) return null;
      const minutes = match24[2];
      const seconds = match24[3] || "00";
      return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;
    }

    return null;
  };

  const cleanStart = normalizeTime(start_time);
  const cleanEnd = normalizeTime(end_time);

  if (!cleanStart) {
    return res.status(400).json({
      message: "Invalid start_time format. Must be formatted as HH:MM or HH:MM:SS (e.g., 10:00 or 10:00:00).",
      field: "start_time",
    });
  }

  if (!cleanEnd) {
    return res.status(400).json({
      message: "Invalid end_time format. Must be formatted as HH:MM or HH:MM:SS (e.g., 11:30 or 11:30:00).",
      field: "end_time",
    });
  }

  // Compare start and end times
  const toSec = (t) => {
    const parts = t.split(":").map(Number);
    return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
  };

  if (toSec(cleanEnd) <= toSec(cleanStart)) {
    return res.status(400).json({
      message: "End time must be strictly after start time.",
      field: "end_time",
    });
  }

  req.body.subject_id = Number(subject_id);
  req.body.lecture_date = String(lecture_date).trim();
  req.body.start_time = cleanStart;
  req.body.end_time = cleanEnd;
  next();
};

/**
 * Validates QR Session creation (lecture_id)
 */
const validateQrSession = (req, res, next) => {
  const { lecture_id } = req.body || {};

  if (!lecture_id || isNaN(Number(lecture_id)) || Number(lecture_id) <= 0) {
    return res.status(400).json({
      message: "A valid positive numeric lecture_id is required to create a QR session.",
      field: "lecture_id",
    });
  }

  req.body.lecture_id = Number(lecture_id);
  next();
};

/**
 * Validates Attendance Marking payload.
 *
 * Security policy:
 *   - Only a session_token is accepted from the student.
 *   - Supplying a bare lecture_id is NOT permitted — it would allow
 *     bypassing the QR session entirely.
 *   - The backend derives the lecture from the validated session server-side.
 */
const validateAttendanceMark = (req, res, next) => {
  const { session_token } = req.body || {};

  const cleanToken = session_token ? String(session_token).trim() : "";

  if (!cleanToken) {
    return res.status(400).json({
      message: "A valid session_token is required to mark attendance.",
      field: "session_token",
    });
  }

  req.body.session_token = cleanToken;
  // Explicitly delete any lecture_id the student may have submitted.
  delete req.body.lecture_id;
  next();
};

module.exports = {
  EMAIL_REGEX,
  DATE_REGEX,
  TIME_REGEX,
  validateLogin,
  validateLecture,
  validateQrSession,
  validateAttendanceMark,
};
