import { Pool, PoolConfig } from "pg";

const config: PoolConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.PG_PORT || "5433", 10),
  database: process.env.DB_NAME || "inzynierka",
  user: process.env.DB_OWNER || "inzynierka_owner",
  password: process.env.DB_OWNER_PASSWORD || "zaq1@WSX",
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
