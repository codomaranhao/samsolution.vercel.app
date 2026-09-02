const { initDb, query } = require('../../lib/db');
const { mpRequest } = require('../../lib/mp');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método não permitido.'});

  try{
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    // A API de Orders usa o tópico "orders". Para QR Code, a assinatura
    // secreta do webhook não é aplicável; confirmamos o estado consultando
    // a própria order no Mercado Pago antes de alterar o banco local.
    const orderId = String(
      body?.data?.id ||
      body?.id ||
      body?.order?.id ||
      body?.resource?.id ||
      ''
    ).trim();

    if(!orderId){
      return res.status(200).json({ok:true,ignored:true,reason:'order_id ausente'});
    }

    await initDb();
    const local = (await query(
      'SELECT id FROM samsolution_orders WHERE id=$1',
      [orderId]
    )).rows[0];

    if(!local){
      return res.status(200).json({ok:true,ignored:true,reason:'order não pertence a esta loja'});
    }

    const mp = await mpRequest(`/v1/orders/${encodeURIComponent(orderId)}`);
    const payment = mp?.transactions?.payments?.[0] || {};
    const status = String(mp?.status || payment?.status || 'created');
    const detail = mp?.status_detail || payment?.status_detail || null;
    const paid = status === 'processed';

    await query(
      `UPDATE samsolution_orders
       SET mp_status=$1,
           mp_status_detail=$2,
           paid_at=CASE WHEN $3 THEN COALESCE(paid_at,NOW()) ELSE paid_at END
       WHERE id=$4`,
      [status,detail,paid,orderId]
    );

    return res.status(200).json({ok:true,orderId,status,paid});
  }catch(e){
    console.error('[webhook/orders]',e);
    return res.status(Number(e.status)||500).json({
      ok:false,
      error:e.message||'Erro ao processar webhook.'
    });
  }
};
