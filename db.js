const { Pool } = require("pg");

let pool;
function getDatabaseUrl() {
  return process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    "";
}
function getPool() {
  if (pool) return pool;
  const url = getDatabaseUrl();
  if (!url) throw new Error("Banco de dados não configurado. Conecte um banco PostgreSQL ao projeto e defina POSTGRES_URL (ou DATABASE_URL).");
  pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
    ssl: { rejectUnauthorized: false }
  });
  return pool;
}
async function query(text, params=[]) {
  return getPool().query(text, params);
}
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    throw e;
  } finally {
    client.release();
  }
}
async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS samsolution_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0.01),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS samsolution_codes (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      order_id TEXT,
      used_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS samsolution_orders (
      id TEXT PRIMARY KEY,
      external_reference TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      product_name TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      mp_status TEXT NOT NULL DEFAULT 'pending',
      mp_status_detail TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ,
      code_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_samsolution_codes_used ON samsolution_codes(used);
    CREATE INDEX IF NOT EXISTS idx_samsolution_orders_status ON samsolution_orders(mp_status);
    INSERT INTO samsolution_products (id,name,price)
      VALUES ('main','Google AI Pro',0.01)
      ON CONFLICT (id) DO NOTHING;
  `);
}
module.exports = { query, withTransaction, initDb };
