const express = require("express");
const { verifyToken, requireHod } = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// Fallback default templates if database table is ever empty
const DEFAULT_TIMETABLES = {
  "Department of Computer Science & Engineering": {
    deptKey: "CSE",
    deptFullName: "DEPARTMENT OF COMPUTER ENGINEERING",
    facultyName: "FACULTY OF ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    revisionNo: "0",
    issueNo: "1",
    docNo: "FOE/CSE/TT/2026/01",
    semester: "3rd Div-A",
    class: "CSE",
    roomNo: "503",
  },
  "Department of Information Technology": {
    deptKey: "IT",
    deptFullName: "DEPARTMENT OF INFORMATION TECHNOLOGY",
    facultyName: "FACULTY OF ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    revisionNo: "0",
    issueNo: "1",
    docNo: "FOE/IT/TT/2026/01",
    semester: "3rd Div-A",
    class: "IT",
    roomNo: "402",
  },
  "Department of Electronics & Communication": {
    deptKey: "ECE",
    deptFullName: "DEPARTMENT OF ELECTRONICS & COMMUNICATION",
    facultyName: "FACULTY OF ENGINEERING",
    term: "WINTER 2026",
    effectiveFrom: "29.06.2026",
    revisionNo: "0",
    issueNo: "1",
    docNo: "FOE/ECE/TT/2026/01",
    semester: "3rd Div-A",
    class: "ECE",
    roomNo: "301",
  },
};

/**
 * Helper to get HOD's verified department
 */
async function getHodDepartment(userId, userDept) {
  if (userDept) return userDept;
  try {
    const rows = await db.query("SELECT department FROM faculty WHERE user_id = $1", [userId]);
    if (rows && rows.length > 0 && rows[0].department) {
      return rows[0].department;
    }
  } catch (e) {
    console.error("Error checking HOD department:", e);
  }
  return "Department of Computer Science & Engineering";
}

/**
 * GET /timetables
 * Returns the active timetable for the authenticated user's department
 * or specified ?department query
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    let targetDept = req.query.department || req.user.department;

    if (!targetDept) {
      targetDept = await getHodDepartment(req.user.id, null);
    }

    // Strict isolation: if user is HOD, ensure they can only query their own department
    if (req.user.role === "HOD") {
      const hodDept = await getHodDepartment(req.user.id, req.user.department);
      targetDept = hodDept;
    }

    // Strict isolation: if user is STUDENT, ensure they can only query their own department
    if (req.user.role === "STUDENT") {
      let studentDept = req.user.department;
      if (!studentDept) {
        const studentRows = await db.query("SELECT department FROM students WHERE user_id = $1", [req.user.id]);
        if (studentRows && studentRows.length > 0 && studentRows[0].department) {
          studentDept = studentRows[0].department;
        }
      }
      if (studentDept) {
        targetDept = studentDept;
      }
    }

    // Strict isolation: if user is FACULTY, default/lock to their own department
    if (req.user.role === "FACULTY") {
      let facDept = req.user.department;
      if (!facDept) {
        const facRows = await db.query("SELECT department FROM faculty WHERE user_id = $1", [req.user.id]);
        if (facRows && facRows.length > 0 && facRows[0].department) {
          facDept = facRows[0].department;
        }
      }
      if (facDept) {
        targetDept = facDept;
      }
    }

    if (!targetDept) {
      targetDept = "Department of Computer Science & Engineering";
    }

    // Normalize targetDept
    if (targetDept.includes("Computer") || targetDept.includes("CSE")) {
      targetDept = "Department of Computer Science & Engineering";
    } else if (targetDept.includes("Information") || targetDept.includes("IT")) {
      targetDept = "Department of Information Technology";
    } else if (targetDept.includes("Electronics") || targetDept.includes("ECE")) {
      targetDept = "Department of Electronics & Communication";
    }

    // Query from database
    const rows = await db.query(
      "SELECT department, schedule, updated_at FROM department_timetables WHERE department = $1",
      [targetDept]
    );

    let schedule = null;
    let updatedAt = null;

    if (rows && rows.length > 0) {
      schedule = typeof rows[0].schedule === "string" ? JSON.parse(rows[0].schedule) : rows[0].schedule;
      updatedAt = rows[0].updated_at;
    }

    res.json({
      message: "Timetable fetched successfully.",
      department: targetDept,
      schedule: schedule,
      updatedAt: updatedAt,
      userRole: req.user.role,
    });
  } catch (err) {
    console.error("Fetch timetable error:", err);
    res.status(500).json({ message: "Failed to fetch timetable." });
  }
});

/**
 * GET /timetables/all
 * Returns all active timetables across all departments (for student view or admin)
 */
router.get("/all", verifyToken, async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT department, schedule, updated_at FROM department_timetables ORDER BY department ASC"
    );

    const allSchedules = {};
    if (rows && rows.length > 0) {
      for (const row of rows) {
        allSchedules[row.department] = typeof row.schedule === "string" ? JSON.parse(row.schedule) : row.schedule;
      }
    }

    res.json({
      message: "All department timetables fetched successfully.",
      timetables: allSchedules,
    });
  } catch (err) {
    console.error("Fetch all timetables error:", err);
    res.status(500).json({ message: "Failed to fetch all timetables." });
  }
});

/**
 * PUT /timetables
 * Allows HOD to edit & update the timetable for THEIR OWN department only!
 */
router.put("/", verifyToken, requireHod, async (req, res) => {
  try {
    const hodDept = await getHodDepartment(req.user.id, req.user.department);
    const { schedule, department } = req.body;

    if (!schedule) {
      return res.status(400).json({ message: "Schedule payload is required." });
    }

    // Enforce strict department isolation: HOD can only edit their own department
    if (department && department !== hodDept) {
      return res.status(403).json({
        message: `Forbidden: You are the HOD of [${hodDept}]. You cannot modify timetables for [${department}].`,
      });
    }

    const scheduleStr = typeof schedule === "object" ? JSON.stringify(schedule) : schedule;

    // Upsert into department_timetables
    const updateRes = await db.query(
      `INSERT INTO department_timetables (department, schedule, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (department) DO UPDATE
       SET schedule = EXCLUDED.schedule,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
       RETURNING department, schedule, updated_at;`,
      [hodDept, scheduleStr, req.user.id]
    );

    const savedSchedule = updateRes && updateRes.length > 0
      ? (typeof updateRes[0].schedule === "string" ? JSON.parse(updateRes[0].schedule) : updateRes[0].schedule)
      : schedule;

    res.json({
      message: `Class Timetable for ${hodDept} updated and published successfully.`,
      department: hodDept,
      schedule: savedSchedule,
      updatedAt: updateRes[0]?.updated_at,
    });
  } catch (err) {
    console.error("Update timetable error:", err);
    res.status(500).json({ message: "Failed to update department timetable." });
  }
});

module.exports = router;
