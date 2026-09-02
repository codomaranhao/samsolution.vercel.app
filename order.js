const { initDb, query } = require('../lib/db');
const { mpRequest } = require('../lib/mp');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET') return res.status(405).json({ok:false,error:'Método não permitido.'});
  try{
    const id=String(req.query?.id||'').trim();
    if(!id) return res.status(400).json({ok:false,error:'Pedido inválido.'});
    await initDb();
    const local=(await query('SELECT id,mp_status,mp_status_detail,paid_at,code_id FROM samsolution_orders WHERE id=$1',[id])).rows[0];
    if(!local) return res.status(404).json({ok:false,error:'Pedido não encontrado.'});
    const mp=await mpRequest(`/v1/orders/${encodeURIComponent(id)}`);
    const payment=mp?.transactions?.payments?.[0]||{};
    const status=mp.status||payment.status||local.mp_status||'created';
    const detail=mp.status_detail||payment.status_detail||local.mp_status_detail||null;
    const paid=status==='processed';
    await query('UPDATE samsolution_orders SET mp_status=$1,mp_status_detail=$2,paid_at=CASE WHEN $3 THEN COALESCE(paid_at,NOW()) ELSE paid_at END WHERE id=$4',[status,detail,paid,id]);
    return res.status(200).json({ok:true,orderId:id,status,statusDetail:detail,paid,paidAt:paid?(local.paid_at||new Date().toISOString()):null,alreadyDelivered:Boolean(local.code_id)});
  }catch(e){
    console.error('[order]',e);
    return res.status(Number(e.status)||500).json({ok:false,error:e.message||'Erro ao consultar pagamento.'});
  }
};
