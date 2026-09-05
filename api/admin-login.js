const { makeSession, sessionCookie, adminCredentials } = require('../lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Método não permitido.' });

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); }
      catch { body = {}; }
    }
    const user = String(body.user || '').trim();
    if (!adminCredentials(user)) {
      return res.status(401).json({ ok:false, error:'Digite o usuário admin.' });
    }

    const token = makeSession();
    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(200).json({ ok:true, authenticated:true, token, user:'admin' });
  } catch (e) {
    console.error('[admin-login]', e);
    return res.status(500).json({ ok:false, error:'Erro interno no login: ' + (e.message || 'desconhecido') });
  }
};
