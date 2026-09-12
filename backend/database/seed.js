require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Connected to Supabase PostgreSQL for seeding demo credentials...");
    await client.query("BEGIN");

    // 1. Ensure DEMO subject exists
    const subjectRes = await client.query(`
      INSERT INTO subjects (subject_code, subject_name)
      VALUES ('DEMO-101', 'Introduction to Computer Science')
      ON CONFLICT (subject_code) DO UPDATE SET subject_name = EXCLUDED.subject_name
      RETURNING id;
    `);
    const subjectId = subjectRes.rows[0].id;

    // Optional: Add a second subject for better testing
    const subject2Res = await client.query(`
      INSERT INTO subjects (subject_code, subject_name)
      VALUES ('CS-202', 'Data Structures & Algorithms')
      ON CONFLICT (subject_code) DO UPDATE SET subject_name = EXCLUDED.subject_name
      RETURNING id;
    `);
    const subject2Id = subject2Res.rows[0].id;

    const demoUsers = [
      {
        full_name: "Demo Student",
        email: "student@example.com",
        password: "student123",
        role: "STUDENT",
      },
      {
        full_name: "Dr. Demo Faculty",
        email: "faculty@example.com",
        password: "faculty123",
        role: "FACULTY",
      },
      {
        full_name: "Prof. Demo HOD",
        email: "hod@example.com",
        password: "hod123",
        role: "HOD",
      },
    ];

    const createdUsers = {};

    for (const u of demoUsers) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const userRes = await client.query(
        `INSERT INTO users (full_name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE 
         SET full_name = EXCLUDED.full_name,
             password = EXCLUDED.password,
             role = EXCLUDED.role
         RETURNING id;`,
        [u.full_name, u.email, hashedPassword, u.role]
      );
      const userId = userRes.rows[0].id;
      createdUsers[u.role] = userId;

      if (u.role === "STUDENT") {
        await client.query(
          `INSERT INTO students (user_id, roll_number, section)
           VALUES ($1, '2024-CSE-001', 'Sec A')
           ON CONFLICT (user_id) DO UPDATE 
           SET roll_number = COALESCE(students.roll_number, EXCLUDED.roll_number),
               section = COALESCE(students.section, EXCLUDED.section);`,
          [userId]
        );
      } else if (u.role === "FACULTY" || u.role === "HOD") {
        const designation = u.role === "HOD" ? "Professor & HOD" : "Assistant Professor";
        await client.query(
          `INSERT INTO faculty (user_id, department, designation)
           VALUES ($1, 'Department of Computer Science & Engineering', $2)
           ON CONFLICT (user_id) DO UPDATE 
           SET department = COALESCE(faculty.department, EXCLUDED.department),
               designation = COALESCE(faculty.designation, EXCLUDED.designation);`,
          [userId, designation]
        );
      }
    }

    // 2. Create sample scheduled lectures for Faculty & HOD
    const facultyIdRes = await client.query(
      "SELECT id FROM faculty WHERE user_id = $1",
      [createdUsers["FACULTY"]]
    );
    const facultyId = facultyIdRes.rows[0]?.id;

    if (facultyId) {
      // Check if lectures already exist
      const existingLectures = await client.query(
        "SELECT id FROM lectures WHERE faculty_id = $1",
        [facultyId]
      );

      if (existingLectures.rows.length === 0) {
        const today = new Date().toISOString().split("T")[0];

        await client.query(
          `INSERT INTO lectures (subject_id, faculty_id, lecture_date, start_time, end_time)
           VALUES ($1, $2, $3, '09:00:00', '10:00:00'),
                  ($4, $2, $3, '11:00:00', '12:00:00');`,
          [subjectId, facultyId, today, subject2Id]
        );
        console.log("Sample lectures created for Dr. Demo Faculty.");
      }
    }

    await client.query("COMMIT");
    console.log("Demo credentials and sample lectures seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
