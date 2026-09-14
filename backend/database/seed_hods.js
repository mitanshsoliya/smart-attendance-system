require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const db = require("../db");

async function seedHods() {
  console.log("Seeding Department HODs...");

  const hods = [
    {
      email: "hod.cse@univ.edu",
      fullName: "Prof. Rajesh Sharma (HOD CSE)",
      department: "Department of Computer Science & Engineering",
      designation: "Professor & Head of Department",
      password: "hod123",
    },
    {
      email: "hod@example.com", // Legacy alias for CSE HOD
      fullName: "Prof. Rajesh Sharma (HOD CSE)",
      department: "Department of Computer Science & Engineering",
      designation: "Professor & Head of Department",
      password: "hod123",
    },
    {
      email: "hod.it@univ.edu",
      fullName: "Dr. A. K. Sharma (HOD IT)",
      department: "Department of Information Technology",
      designation: "Professor & Head of Department",
      password: "hod123",
    },
    {
      email: "hod.ece@univ.edu",
      fullName: "Dr. Meenakshi Sundaram (HOD ECE)",
      department: "Department of Electronics & Communication",
      designation: "Professor & Head of Department",
      password: "hod123",
    },
  ];

  for (const hod of hods) {
    try {
      const hashedPassword = await bcrypt.hash(hod.password, 10);
      const existing = await db.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
        [hod.email]
      );

      let userId;
      if (existing && existing.length > 0) {
        userId = existing[0].id;
        console.log(`Updating existing HOD user ${hod.email} (ID: ${userId})...`);
        await db.query(
          "UPDATE users SET full_name = $1, password = $2, role = 'HOD' WHERE id = $3",
          [hod.fullName, hashedPassword, userId]
        );
      } else {
        console.log(`Creating new HOD user ${hod.email}...`);
        const userRes = await db.query(
          "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'HOD') RETURNING id",
          [hod.fullName, hod.email.toLowerCase(), hashedPassword]
        );
        userId = userRes[0].id;
      }

      // Link faculty entry
      const facExisting = await db.query(
        "SELECT id FROM faculty WHERE user_id = $1",
        [userId]
      );
      if (facExisting && facExisting.length > 0) {
        await db.query(
          "UPDATE faculty SET department = $1, designation = $2 WHERE user_id = $3",
          [hod.department, hod.designation, userId]
        );
      } else {
        await db.query(
          "INSERT INTO faculty (user_id, department, designation) VALUES ($1, $2, $3)",
          [userId, hod.department, hod.designation]
        );
      }

      console.log(`✓ HOD ${hod.email} for [${hod.department}] ready!`);
    } catch (err) {
      console.error(`Failed to seed ${hod.email}:`, err);
    }
  }

  console.log("Department HODs seeded successfully!");
  process.exit(0);
}

seedHods();
