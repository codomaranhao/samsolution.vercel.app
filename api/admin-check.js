const { requireAdmin } = require('../lib/auth');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ok:false,error:'Método não permitido.'});
  if (!requireAdmin(req, res)) return;
  return res.status(200).json({ok:true,authenticated:true});
};
