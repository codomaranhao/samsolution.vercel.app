const crypto=require('crypto');
const { requireAdmin }=require('../lib/auth');
const { initDb, withTransaction }=require('../lib/db');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método não permitido.'});
  if(!requireAdmin(req,res)) return;
  try{
    await initDb();
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const values=Array.isArray(body.codes)?body.codes:[];
    const codes=[...new Set(values.map(v=>String(v||'').trim()).filter(Boolean))].slice(0,500);
    if(!codes.length) return res.status(400).json({ok:false,error:'Informe ao menos um código.'});
    let added=0,skipped=0;
    await withTransaction(async client=>{
      for(const code of codes){
        const r=await client.query('INSERT INTO samsolution_codes(id,code) VALUES($1,$2) ON CONFLICT(code) DO NOTHING',[crypto.randomUUID(),code]);
        if(r.rowCount) added++; else skipped++;
      }
    });
    return res.status(200).json({ok:true,added,skipped});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
};
