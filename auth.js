const crypto = require('crypto');

const COOKIE = 'samsolution_admin';
const SESSION_TTL = 8 * 60 * 60 * 1000;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || 'samsolution-admin-session-2026-change-this';
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function makeSession() {
  const payload = `${Date.now()}.${crypto.randomBytes(18).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

function validSession(value) {
  if (!value) return false;
  const parts = String(value).split('.');
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  if (!/^\d+$/.test(ts) || !nonce || !sig) return false;
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_TTL) return false;
  const expected = sign(`${ts}.${nonce}`);
  const a = Buffer.from(String(sig));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getCookies(req) {
  const out = {};
  String(req?.headers?.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) {
      const key = part.slice(0, i).trim();
      const value = part.slice(i + 1).trim();
      try { out[key] = decodeURIComponent(value); } catch { out[key] = value; }
    }
  });
  return out;
}

function getBearer(req) {
  const h = String(req?.headers?.authorization || '');
  if (!/^Bearer\s+/i.test(h)) return '';
  return h.replace(/^Bearer\s+/i, '').trim();
}

function requireAdmin(req, res) {
  // O painel não usa senha: o login gera uma sessão HttpOnly assinada.
  // Não aceite identificadores enviados pelo navegador como autenticação.
  const cookieToken = getCookies(req)[COOKIE];
  const bearerToken = getBearer(req);
  if (!validSession(bearerToken || cookieToken)) {
    res.status(401).json({ ok: false, error: 'Acesso administrativo necessário.' });
    return false;
  }
  return true;
}

function sessionCookie(value) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=28800`;
}

function clearCookie() {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`;
}

// O painel solicitado usa somente o usuário "admin".
// A senha foi deliberadamente removida: qualquer senha (inclusive vazia) é aceita para admin.
function adminCredentials(user) {
  return String(user || '').trim().toLowerCase() === 'admin';
}

module.exports = {
  makeSession,
  validSession,
  requireAdmin,
  sessionCookie,
  clearCookie,
  adminCredentials
};
