require("dotenv").config();
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL?.trim();
let pool = null;
let configurationError = null;

if (!connectionString) {
  configurationError = new Error("DATABASE_URL is not configured. Add your Supabase PostgreSQL connection string to backend/.env.");
} else if (!/^postgres(?:ql)?:\/\/[^\s<>]+$/i.test(connectionString)) {
  configurationError = new Error("DATABASE_URL is invalid. Use the complete postgresql:// connection string from Supabase and replace all placeholders.");
} else {
  try {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  } catch (error) {
    configurationError = new Error(`DATABASE_URL is invalid: ${error.message}`);
  }
}

if (configurationError) {
  console.error(configurationError.message);
}

// Dual callback & promise compatible database helper
const db = {
  pool,
  query(sql, values, callback) {
    if (typeof values === "function") {
      callback = values;
      values = [];
    }

    if (!pool) {
      if (typeof callback === "function") {
        callback(configurationError);
        return;
      }
      return Promise.reject(configurationError);
    }

    if (typeof callback === "function") {
      pool.query(sql, values, (error, result) => {
        callback(error, result ? result.rows : undefined);
      });
      return;
    }

    return pool.query(sql, values).then((result) => result.rows);
  },
  async getClient() {
    if (!pool) throw configurationError;
    return pool.connect();
  },
  connect(callback) {
    if (!pool) {
      callback(configurationError);
      return;
    }
    pool.query("SELECT 1", (error) => callback(error));
  },
};

module.exports = db;
