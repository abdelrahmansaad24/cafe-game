import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 3000,
  connectionTimeoutMillis: 5000,
});

try {
  console.log("Connecting with max=1...");
  const client = await pool.connect();
  const res = await client.query("SELECT 1 as connected;");
  console.log("Query result:", res.rows);
  client.release();
  console.log("SUCCESS: Single connection established and released!");
} catch (err) {
  console.error("Connection error:", err.message);
} finally {
  await pool.end();
  process.exit(0);
}
