const express = require("express");
const { verifyToken, requireStudent } = require("../middleware/auth");

const router = express.Router();

// Enforce student role on student dashboard endpoint
router.get("/dashboard", verifyToken, requireStudent, (req, res) => {
  res.json({
    message: "Student Dashboard Access Granted",
    user: req.user,
  });
});

module.exports = router;