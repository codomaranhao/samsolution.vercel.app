const { initDb, query } = require('../lib/db');
module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método não permitido.'});
  const result={ok:true,vercel:Boolean(process.env.VERCEL),node:process.version,database:false,mercadopago:Boolean(process.env.MP_ACCESS_TOKEN||process.env.SAMSOLUTION)};
  try{ await initDb(); result.database=true; result.stock=Number((await query("SELECT COUNT(*)::int n FROM samsolution_codes WHERE used=false")).rows[0].n); }
  catch(e){ result.ok=false; result.databaseError=e.message; }
  return res.status(result.ok?200:503).json(result);
};
