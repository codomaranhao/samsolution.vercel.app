const { Pool } = require("pg");
const INITIAL_CODES = require("./initial-stock");

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
  let url = getDatabaseUrl();
  if (!url) throw new Error("Banco de dados não configurado. Defina POSTGRES_URL ou DATABASE_URL na Vercel.");

  // Supabase/Vercel: alguns connection strings trazem sslmode=verify-full,
  // o que faz o pg exigir o CA local e pode gerar "self-signed certificate in certificate chain".
  // Para o runtime serverless, usamos TLS criptografado sem validação local do CA.
  try {
    const u = new URL(url);
    if (u.searchParams.has('sslmode')) u.searchParams.set('sslmode', 'require');
    if (u.searchParams.has('sslrootcert')) u.searchParams.delete('sslrootcert');
    url = u.toString();
  } catch (_) {}

  pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
    prepare: false
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

  // Semeia o estoque enviado pelo proprietário uma única vez por código.
  // ON CONFLICT evita duplicações em cold starts/redeploys.
  for (const code of INITIAL_CODES) {
    await query(
      "INSERT INTO samsolution_codes(id,code) VALUES(gen_random_uuid()::text,$1) ON CONFLICT(code) DO NOTHING",
      [String(code).trim()]
    );
  }
}
module.exports = { query, withTransaction, initDb };
