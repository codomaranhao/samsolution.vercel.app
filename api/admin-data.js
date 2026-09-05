const { requireAdmin } = require('../lib/auth');
const { initDb, query } = require('../lib/db');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok:false, error:'Método não permitido.' });
  if (!requireAdmin(req, res)) return;
  try {
    await initDb();
    const p = (await query("SELECT id,name,price FROM samsolution_products WHERE id='main'")).rows[0];
    const codes = (await query('SELECT id,code,used,order_id,used_at FROM samsolution_codes ORDER BY used ASC, code ASC')).rows;
    const orders = (await query('SELECT id,name,email,phone,product_name,amount,mp_status,mp_status_detail,created_at,paid_at,code_id FROM samsolution_orders ORDER BY created_at DESC LIMIT 200')).rows;
    const stats = (await query("SELECT COUNT(*) FILTER (WHERE used=false)::int stock, (SELECT COUNT(*)::int FROM samsolution_orders) orders, (SELECT COUNT(*)::int FROM samsolution_orders WHERE mp_status IN ('processed','approved')) approved FROM samsolution_codes")).rows[0];
    return res.status(200).json({ ok:true, product:{...p,price:Number(p.price)}, codes, orders, stats });
  } catch(e) { return res.status(500).json({ok:false,error:e.message}); }
};
