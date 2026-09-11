const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { verifyToken, requireFacultyOrHod } = require("../middleware/auth");
const { validateQrSession } = require("../middleware/validator");
const db = require("../db");

const router = express.Router();

/**
 * POST /qr-session/create
 *
 * Security requirements:
 *  1. Caller must be authenticated as FACULTY or HOD.
 *  2. The lecture_id MUST belong to this faculty member (ownership check).
 *  3. Session token is 32 cryptographically random bytes (64 hex chars).
 *  4. Session expires in exactly 5 minutes from generation.
 *  5. The QR payload contains ONLY the session_token — NOT the lecture_id.
 *     The backend derives the lecture from the session on the student side.
 */
router.post("/create", verifyToken, requireFacultyOrHod, validateQrSession, async (req, res) => {
  try {
    const { lecture_id } = req.body;

    // --- Ownership verification ---
    // Ensure the requesting faculty actually owns this lecture.
    const ownershipSql = `
      SELECT l.id
      FROM lectures l
      JOIN faculty f ON l.faculty_id = f.id
      WHERE l.id = $1 AND f.user_id = $2
    `;
    const ownerRows = await db.query(ownershipSql, [lecture_id, req.user.id]);
    if (!ownerRows || ownerRows.length === 0) {
      return res.status(403).json({
        message: "Forbidden: You do not own this lecture or it does not exist.",
      });
    }

    // --- Generate cryptographically secure session token ---
    const session_token = crypto.randomBytes(32).toString("hex");

    // --- Set expiration (5 minutes from now) ---
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // --- Persist session ---
    const insertSql = `
      INSERT INTO qr_sessions
      (lecture_id, session_token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const result = await db.query(insertSql, [lecture_id, session_token, expires_at]);

    // --- QR payload contains ONLY the session_token ---
    // Never embed lecture_id in QR — the backend resolves it from the session.
    const qrPayload = session_token;
    const qr_code = await QRCode.toDataURL(qrPayload);

    return res.status(201).json({
      message: "QR session created successfully.",
      session_id: result[0].id,
      session_token,
      expires_at,
      qr_code,
      // Note: lecture_id is intentionally NOT returned in the body exposed to clients.
      // The student's scan endpoint only accepts session_token.
    });
  } catch (error) {
    console.error("QR session creation error:", error);
    return res.status(500).json({ message: "QR session generation failed." });
  }
});

module.exports = router;