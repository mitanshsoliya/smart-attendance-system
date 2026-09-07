require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error("DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL for migration...");
    const sqlPath = path.join(__dirname, "supabase.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Executing supabase.sql...");
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
