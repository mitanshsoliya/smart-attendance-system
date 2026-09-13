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
    const { lecture_id, latitude, longitude, radius_meters } = req.body;

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

    // --- Invalidate any previously active QR session for this faculty ---
    // Rule: Only 1 active QR session allowed per faculty at a time.
    const nowTime = new Date();
    const pastTime = new Date(Date.now() - 5000);
    await db.query(
      `UPDATE qr_sessions
       SET expires_at = $1
       WHERE lecture_id IN (
         SELECT l.id FROM lectures l
         JOIN faculty f ON l.faculty_id = f.id
         WHERE f.user_id = $2
       ) AND expires_at > $3`,
      [pastTime, req.user.id, nowTime]
    );

    // --- Generate cryptographically secure session token ---
    const session_token = crypto.randomBytes(32).toString("hex");

    // --- Set expiration (5 minutes from now) ---
    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // --- Geo-Fencing Configuration ---
    // If radius_meters is 0, '0', false, or null -> Geo-Fencing is DISABLED (Open attendance)
    // If radius_meters > 0 -> Faculty device location is the classroom anchor!
    const isGeoEnabled = (
      radius_meters !== undefined &&
      radius_meters !== null &&
      radius_meters !== 0 &&
      radius_meters !== "0" &&
      radius_meters !== false &&
      radius_meters !== "none"
    );

    let finalLat = null;
    let finalLon = null;
    let finalRadius = 0;

    if (isGeoEnabled) {
      // Pinpoint classroom anchor to faculty device's exact location
      finalLat = (latitude !== undefined && latitude !== null && !isNaN(Number(latitude)))
        ? Number(latitude)
        : (process.env.CAMPUS_LAT ? Number(process.env.CAMPUS_LAT) : 21.1702);

      finalLon = (longitude !== undefined && longitude !== null && !isNaN(Number(longitude)))
        ? Number(longitude)
        : (process.env.CAMPUS_LON ? Number(process.env.CAMPUS_LON) : 72.8311);

      finalRadius = Math.max(20, Math.min(500, Number(radius_meters)));
    }

    // --- Persist session with Geo-Fence ---
    const insertSql = `
      INSERT INTO qr_sessions
      (lecture_id, session_token, expires_at, latitude, longitude, radius_meters)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, latitude, longitude, radius_meters
    `;
    const result = await db.query(insertSql, [
      lecture_id,
      session_token,
      expires_at,
      finalLat,
      finalLon,
      finalRadius,
    ]);

    // --- QR payload contains ONLY the session_token ---
    // Never embed lecture_id in QR — the backend resolves it from the session.
    const qrPayload = session_token;
    const qr_code = await QRCode.toDataURL(qrPayload);

    return res.status(201).json({
      message: isGeoEnabled
        ? `QR session created with ${finalRadius}m Classroom Geo-Fence active from your device.`
        : "QR session created with Geo-Fencing disabled (Open attendance).",
      session_id: result[0].id,
      session_token,
      expires_at,
      expires_in: 300,
      qr_code,
      geo_fence: {
        enabled: isGeoEnabled,
        latitude: finalLat,
        longitude: finalLon,
        radius_meters: finalRadius,
      },
    });
  } catch (error) {
    console.error("QR session creation error:", error);
    return res.status(500).json({ message: "QR session generation failed." });
  }
});

/**
 * POST /qr-session/stop
 * Allows the faculty to terminate / expire the active QR session immediately.
 */
router.post("/stop", verifyToken, requireFacultyOrHod, async (req, res) => {
  try {
    const { session_token, lecture_id } = req.body;

    if (!session_token && !lecture_id) {
      return res.status(400).json({ message: "session_token or lecture_id is required." });
    }

    // Faculty ownership check
    let targetSession = null;
    if (session_token) {
      const rows = await db.query(
        `SELECT qs.id, qs.lecture_id, l.faculty_id
         FROM qr_sessions qs
         JOIN lectures l ON qs.lecture_id = l.id
         JOIN faculty f ON l.faculty_id = f.id
         WHERE qs.session_token = $1 AND f.user_id = $2`,
        [session_token, req.user.id]
      );
      if (!rows || rows.length === 0) {
        return res.status(403).json({ message: "Session not found or not owned by you." });
      }
      targetSession = rows[0];
    } else if (lecture_id) {
      const rows = await db.query(
        `SELECT qs.id, qs.lecture_id, l.faculty_id
         FROM qr_sessions qs
         JOIN lectures l ON qs.lecture_id = l.id
         JOIN faculty f ON l.faculty_id = f.id
         WHERE qs.lecture_id = $1 AND f.user_id = $2
         ORDER BY qs.id DESC LIMIT 1`,
        [lecture_id, req.user.id]
      );
      if (!rows || rows.length === 0) {
        return res.status(403).json({ message: "Session not found or not owned by you." });
      }
      targetSession = rows[0];
    }

    // Set expires_at to past timestamp (now) so that any scan attempts fail immediately
    const pastTime = new Date(Date.now() - 10000);
    await db.query("UPDATE qr_sessions SET expires_at = $1 WHERE id = $2", [pastTime, targetSession.id]);

    return res.json({ message: "QR session stopped and expired successfully." });
  } catch (error) {
    console.error("Error stopping QR session:", error);
    return res.status(500).json({ message: "Failed to stop QR session." });
  }
});

module.exports = router;