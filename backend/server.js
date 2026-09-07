const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

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

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ms9724006035@",
  database: "smart_attendance",
});

db.connect((err) => {
  if (err) {
    console.error("Database Connection Failed:", err);
    return;
  }

  console.log("MySQL Connected Successfully");
});

// Home Route
app.get("/", (req, res) => {
  res.send("Smart Attendance Backend Running Successfully");
});

// Server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});