const { mpRequest }=require("../lib/mp");
const { initDb, withTransaction }=require("../lib/db");
module.exports=async(req,res)=>{
 if(req.method!=="POST") return res.status(405).json({ok:false,error:"Método não permitido."});
 try{
  await initDb();
  const body=typeof req.body === "string" ? JSON.parse(req.body||"{}") : (req.body||{});
  const orderId=String(body.orderId||"").trim();
  if(!orderId) return res.status(400).json({ok:false,error:"Pedido inválido."});
  const mp=await mpRequest(`/v1/orders/${encodeURIComponent(orderId)}`);
  const payment=mp?.transactions?.payments?.[0]||{};
  const status=payment.status||mp.status;
  const paid=status==="processed"||status==="approved";
  if(!paid) return res.status(402).json({ok:false,error:"Pagamento ainda não aprovado.",status});
  const result=await withTransaction(async client=>{
    const existing=await client.query("SELECT code_id FROM samsolution_orders WHERE id=$1 FOR UPDATE",[orderId]);
    if(!existing.rowCount) throw Object.assign(new Error("Pedido não encontrado."),{status:404});
    if(existing.rows[0].code_id){
      const c=await client.query("SELECT code FROM samsolution_codes WHERE id=$1",[existing.rows[0].code_id]);
      return {code:c.rows[0]?.code||null,reused:true};
    }
    const code=await client.query("SELECT id,code FROM samsolution_codes WHERE used=false ORDER BY used_at NULLS FIRST, id FOR UPDATE SKIP LOCKED LIMIT 1");
    if(!code.rowCount) throw Object.assign(new Error("Pagamento confirmado, mas o estoque está vazio."),{status:503});
    const c=code.rows[0];
    await client.query("UPDATE samsolution_codes SET used=true,order_id=$1,used_at=NOW() WHERE id=$2",[orderId,c.id]);
    await client.query("UPDATE samsolution_orders SET mp_status=$1,mp_status_detail=$2,paid_at=COALESCE(paid_at,NOW()),code_id=$3 WHERE id=$4",[status,payment.status_detail||mp.status_detail||null,c.id,orderId]);
    return {code:c.code,reused:false};
  });
  return res.status(200).json({ok:true,code:result.code,deliveryToken:require("crypto").createHash("sha256").update(orderId+":"+result.code).digest("hex").slice(0,32)});
 }catch(e){return res.status(e.status||500).json({ok:false,error:e.message||"Erro ao liberar código."});}
};
