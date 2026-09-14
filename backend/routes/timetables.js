const express = require("express");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

const DEPARTMENT_TIMETABLES = {
  "Department of Computer Science & Engineering": {
    deptKey: "CSE",
    deptFullName: "DEPARTMENT OF COMPUTER ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    semester: "3rd Div-A",
    class: "CSE",
    roomNo: "503",
    batchMapping: {
      "Sec A": "BATCH A1",
      "Sec B": "BATCH A2",
      "Sec C": "BATCH A3",
    },
  },
  "Department of Information Technology": {
    deptKey: "IT",
    deptFullName: "DEPARTMENT OF INFORMATION TECHNOLOGY",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    semester: "3rd Div-A",
    class: "IT",
    roomNo: "402",
    batchMapping: {
      "Sec A": "BATCH A1",
      "Sec B": "BATCH A2",
      "Sec C": "BATCH A3",
    },
  },
  "Department of Electronics & Communication": {
    deptKey: "ECE",
    deptFullName: "DEPARTMENT OF ELECTRONICS & COMMUNICATION",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    semester: "3rd Div-A",
    class: "ECE",
    roomNo: "301",
    batchMapping: {
      "Sec A": "BATCH A1",
      "Sec B": "BATCH A2",
      "Sec C": "BATCH A3",
    },
  },
};

/**
 * GET /timetables
 * Get list of available department timetables and student/faculty personal schedule info
 */
router.get("/", verifyToken, (req, res) => {
  const userDept = req.user.department || "Department of Computer Science & Engineering";
  res.json({
    message: "Available department timetables",
    departments: Object.keys(DEPARTMENT_TIMETABLES),
    currentDepartment: userDept,
    userRole: req.user.role,
  });
});

module.exports = router;
