const { requireAdmin } = require('../lib/auth');
const { initDb, query } = require('../lib/db');
module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método não permitido.'});
  if(!requireAdmin(req,res)) return;
  try {
    await initDb();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name=String(body.name||'').trim().slice(0,150)||'Google AI Pro';
    const raw=String(body.price??'').trim().replace(/R\$\s?/gi,'');
    const price=raw.includes(',') ? Number(raw.replace(/\./g,'').replace(',','.')) : Number(raw);
    if(!Number.isFinite(price)||price<0.01) return res.status(400).json({ok:false,error:'Preço inválido.'});
    await query("UPDATE samsolution_products SET name=$1,price=$2,updated_at=NOW() WHERE id='main'",[name,price]);
    return res.status(200).json({ok:true});
  } catch(e) { return res.status(500).json({ok:false,error:e.message}); }
};
