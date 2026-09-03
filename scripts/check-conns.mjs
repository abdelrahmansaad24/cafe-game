import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();
  const res = await client.query(`
    SELECT pid, usename, client_addr, client_port, backend_start, state, state_change, query 
    FROM pg_stat_activity 
    WHERE usename = 'us15mmkthwl0bbbcwrmp';
  `);
  console.log("Active PostgreSQL connections count:", res.rows.length);
  console.log(JSON.stringify(res.rows, null, 2));
} catch (err) {
  console.error("Query error:", err.message);
} finally {
  await client.end().catch(() => undefined);
  process.exit(0);
}
