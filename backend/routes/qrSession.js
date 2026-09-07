const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const verifyToken = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

router.post("/create", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "FACULTY" && req.user.role !== "HOD") {
      return res.status(403).json({
        message: "Only Faculty or HOD can create QR sessions",
      });
    }

    const { lecture_id } = req.body;

    if (!lecture_id) {
      return res.status(400).json({
        message: "lecture_id is required",
      });
    }

    const session_token = crypto.randomBytes(32).toString("hex");

    const expires_at = new Date(Date.now() + 5 * 60 * 1000);

    const sql = `
      INSERT INTO qr_sessions
      (lecture_id, session_token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    db.query(
      sql,
      [lecture_id, session_token, expires_at],
      async (err, result) => {
        if (err) {
          console.error(err);

          return res.status(500).json({
            message: "QR Session creation failed",
          });
        }

        const qrData = JSON.stringify({
          lecture_id: lecture_id,
          session_token: session_token,
        });

        const qr_code = await QRCode.toDataURL(qrData);

        res.status(201).json({
          message: "QR Session created successfully",
          session_id: result[0].id,
          lecture_id: lecture_id,
          session_token: session_token,
          expires_at: expires_at,
          qr_code: qr_code,
        });
      }
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "QR generation failed",
    });
  }
});

module.exports = router;