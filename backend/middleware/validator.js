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

  const cleanStart = String(start_time || "").trim();
  const cleanEnd = String(end_time || "").trim();

  if (!cleanStart || !TIME_REGEX.test(cleanStart)) {
    return res.status(400).json({
      message: "Invalid start_time format. Must be formatted as HH:MM or HH:MM:SS.",
      field: "start_time",
    });
  }

  if (!cleanEnd || !TIME_REGEX.test(cleanEnd)) {
    return res.status(400).json({
      message: "Invalid end_time format. Must be formatted as HH:MM or HH:MM:SS.",
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
 * Validates Attendance Marking payload (session_token or lecture_id)
 */
const validateAttendanceMark = (req, res, next) => {
  const { session_token, lecture_id } = req.body || {};

  const cleanToken = session_token ? String(session_token).trim() : "";
  const numLectureId = lecture_id ? Number(lecture_id) : null;

  if (!cleanToken && (!numLectureId || isNaN(numLectureId))) {
    return res.status(400).json({
      message: "Either a valid session_token or lecture_id is required to mark attendance.",
    });
  }

  req.body.session_token = cleanToken;
  if (numLectureId) req.body.lecture_id = numLectureId;
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
