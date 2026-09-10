require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Login Route
const loginRoute = require("./routes/login");
app.use("/login", loginRoute);

// Student Route
const studentRoute = require("./routes/student");
app.use("/student", studentRoute);

// Register Route
const registerRoute = require("./routes/register");
app.use("/register", registerRoute);

// QR Session Route
const qrSessionRoute = require("./routes/qrSession");
app.use("/qr-session", qrSessionRoute);

// Attendance Route
const attendanceRoute = require("./routes/attendance");
app.use("/attendance", attendanceRoute);

const lectureRoute = require("./routes/lectures");
app.use("/lectures", lectureRoute);

// HOD Administration Route
const hodRoute = require("./routes/hod");
app.use("/hod", hodRoute);

// Verify the database before accepting API traffic.
db.connect((err) => {
  if (err) {
    console.error("Database Connection Failed:", err);
    process.exitCode = 1;
    return;
  }

  if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    console.error("FATAL: JWT_SECRET is not configured in backend/.env.");
    process.exitCode = 1;
    return;
  }

  console.log("PostgreSQL connected successfully");

  // Home Route
  app.get("/", (req, res) => {
    res.send("Smart Attendance Backend Running Successfully");
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});