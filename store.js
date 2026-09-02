const { initDb, query } = require("../lib/db");
module.exports = async (req,res)=>{
  if(req.method!=="GET") return res.status(405).json({ok:false,error:"Método não permitido."});
  try{
    await initDb();
    const p=(await query("SELECT id,name,price FROM samsolution_products WHERE id='main'")).rows[0];
    const stock=(await query("SELECT COUNT(*)::int AS n FROM samsolution_codes WHERE used=false")).rows[0].n;
    return res.status(200).json({ok:true,product:{id:p.id,name:p.name,price:Number(p.price)},stock});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
};
