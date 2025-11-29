import { Pool, PoolConfig } from "pg";

const config: PoolConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.PG_PORT || "5433", 10),
  database: process.env.DB_NAME || "inzynierka",
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
