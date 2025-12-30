import { Pool, PoolConfig } from "pg";

// Use connection string for Vercel (Neon), individual params for local Docker
const connectionString = process.env.DATABASE_URL;

const config: PoolConfig = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Neon
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5433", 10),
      database: process.env.DB_NAME || "model_viewer",
      user: process.env.DB_OWNER || "your_db_user",
      password: process.env.DB_OWNER_PASSWORD || "your_db_password",
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(config);

pool.on("error", err => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
