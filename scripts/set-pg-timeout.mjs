import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");
    
    // Set idle timeouts for this role so PostgreSQL automatically terminates any connection idle for > 15 seconds!
    try {
      await client.query("ALTER ROLE us15mmkthwl0bbbcwrmp SET idle_session_timeout = '15s';");
      console.log("Successfully set idle_session_timeout = '15s'");
    } catch (e) {
      console.warn("Could not ALTER ROLE for idle_session_timeout:", e.message);
    }

    try {
      await client.query("ALTER ROLE us15mmkthwl0bbbcwrmp SET idle_in_transaction_session_timeout = '10s';");
      console.log("Successfully set idle_in_transaction_session_timeout = '10s'");
    } catch (e) {
      console.warn("Could not ALTER ROLE for idle_in_transaction_session_timeout:", e.message);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end().catch(() => undefined);
    process.exit(0);
  }
}

run();
