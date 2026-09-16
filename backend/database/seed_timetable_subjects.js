/**
 * Seed script to ensure all department timetable subjects exist in the database.
 * Run with: node database/seed_timetable_subjects.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../db");

const TIMETABLE_SUBJECTS = [
  // 1. Computer Science & Engineering
  {
    code: "DDSP",
    name: "Database Design and SQL Programming / Digital Design",
    department: "Department of Computer Science & Engineering",
    credit_hours: 4,
  },
  {
    code: "PS",
    name: "Probability and Statistics",
    department: "Department of Computer Science & Engineering",
    credit_hours: 4,
  },
  {
    code: "ETC",
    name: "Effective Technical Communication",
    department: "Department of Computer Science & Engineering",
    credit_hours: 3,
  },
  {
    code: "DS",
    name: "Data Structures using C/C++",
    department: "Department of Computer Science & Engineering",
    credit_hours: 4,
  },
  {
    code: "DLMA",
    name: "Discrete Linear Math & Algebra",
    department: "Department of Computer Science & Engineering",
    credit_hours: 4,
  },
  {
    code: "PY",
    name: "Python Programming Laboratory",
    department: "Department of Computer Science & Engineering",
    credit_hours: 2,
  },
  {
    code: "IC",
    name: "Indian Constitution",
    department: "Department of Computer Science & Engineering",
    credit_hours: 3,
  },

  // 2. Information Technology
  {
    code: "DE",
    name: "Digital Electronics – Theory & Lab",
    department: "Department of Information Technology",
    credit_hours: 4,
  },
  {
    code: "WT",
    name: "Basics of Web Technology",
    department: "Department of Information Technology",
    credit_hours: 4,
  },
  {
    code: "IT-PS",
    name: "Probability and Statistics (IT)",
    department: "Department of Information Technology",
    credit_hours: 4,
  },
  {
    code: "IT-ETC",
    name: "Effective Technical Communication (IT)",
    department: "Department of Information Technology",
    credit_hours: 3,
  },
  {
    code: "IT-DS",
    name: "Data Structures – Theory & Lab (IT)",
    department: "Department of Information Technology",
    credit_hours: 4,
  },
  {
    code: "IT-PY",
    name: "Python & Web Scripting Lab (IT)",
    department: "Department of Information Technology",
    credit_hours: 2,
  },
  {
    code: "IT-IC",
    name: "Indian Constitution (IT)",
    department: "Department of Information Technology",
    credit_hours: 3,
  },

  // 3. Electronics & Communication
  {
    code: "DSD",
    name: "Digital System Design – Theory & VLSI Lab",
    department: "Department of Electronics & Communication",
    credit_hours: 4,
  },
  {
    code: "M-III",
    name: "Mathematics-III",
    department: "Department of Electronics & Communication",
    credit_hours: 4,
  },
  {
    code: "NA",
    name: "Network Analysis – Theory & Circuits Lab",
    department: "Department of Electronics & Communication",
    credit_hours: 4,
  },
  {
    code: "MCS",
    name: "Modern Control Systems – Theory & Lab",
    department: "Department of Electronics & Communication",
    credit_hours: 4,
  },
  {
    code: "HDL",
    name: "Hardware Description & Simulation Lab",
    department: "Department of Electronics & Communication",
    credit_hours: 2,
  },
  {
    code: "ECE-ETC",
    name: "Effective Technical Communication (ECE)",
    department: "Department of Electronics & Communication",
    credit_hours: 3,
  },
  {
    code: "ECE-IC",
    name: "Indian Constitution (ECE)",
    department: "Department of Electronics & Communication",
    credit_hours: 3,
  },
];

async function seedTimetableSubjects() {
  console.log("Seeding timetable subjects into database...");
  for (const s of TIMETABLE_SUBJECTS) {
    try {
      const existing = await db.query(
        "SELECT id, subject_code FROM subjects WHERE UPPER(subject_code) = UPPER($1)",
        [s.code]
      );
      if (existing && existing.length > 0) {
        await db.query(
          "UPDATE subjects SET subject_name = $1, department = $2, credit_hours = $3 WHERE id = $4",
          [s.name, s.department, s.credit_hours, existing[0].id]
        );
        console.log(`Updated subject: [${s.code}] ${s.name} (${s.department})`);
      } else {
        await db.query(
          "INSERT INTO subjects (subject_code, subject_name, department, credit_hours) VALUES ($1, $2, $3, $4)",
          [s.code, s.name, s.department, s.credit_hours]
        );
        console.log(`Inserted subject: [${s.code}] ${s.name} (${s.department})`);
      }
    } catch (err) {
      console.error(`Error with subject ${s.code}:`, err.message);
    }
  }
  console.log("Timetable subjects seeding finished!");
}

if (require.main === module) {
  seedTimetableSubjects()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal seed error:", err);
      process.exit(1);
    });
}

module.exports = { seedTimetableSubjects, TIMETABLE_SUBJECTS };
