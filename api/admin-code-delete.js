const { requireAdmin }=require('../lib/auth');
const { initDb, query }=require('../lib/db');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='DELETE') return res.status(405).json({ok:false,error:'Método não permitido.'});
  if(!requireAdmin(req,res)) return;
  try{
    await initDb();
    const id=String(req.query?.id||'').trim();
    if(!id) return res.status(400).json({ok:false,error:'Código não informado.'});
    const r=await query('DELETE FROM samsolution_codes WHERE id=$1 AND used=false',[id]);
    if(!r.rowCount) return res.status(404).json({ok:false,error:'Código não encontrado ou já utilizado.'});
    return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
};
