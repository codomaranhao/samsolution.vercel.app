const crypto = require('crypto');
const QRCode = require('qrcode');
const { initDb, query } = require('../lib/db');
const { mpRequest, safeCustomer } = require('../lib/mp');

function bodyOf(req){
  if (!req.body) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { throw Object.assign(new Error('JSON inválido.'), {status:400}); } }
  return req.body;
}

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método não permitido.'});
  try{
    await initDb();
    const body = bodyOf(req);
    const customer = safeCustomer(body);
    const product = (await query("SELECT id,name,price FROM samsolution_products WHERE id='main'")).rows[0];
    if(!product) throw Object.assign(new Error('Produto não configurado.'),{status:500});
    const stock = Number((await query("SELECT COUNT(*)::int AS n FROM samsolution_codes WHERE used=false")).rows[0].n);
    if(stock<1) throw Object.assign(new Error('Produto sem estoque.'),{status:409});
    const price = Number(product.price);
    const reference = `SAMSOLUTION-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const amount = price.toFixed(2);
    const order = await mpRequest('/v1/orders',{
      method:'POST',
      headers:{'X-Idempotency-Key':crypto.randomUUID()},
      body:JSON.stringify({
        type:'qr', total_amount:amount, description:String(product.name).slice(0,150),
        external_reference:reference, expiration_time:'PT16M',
        config:{qr:{mode:'dynamic'}},
        transactions:{payments:[{amount}]},
        items:[{title:String(product.name).slice(0,150),unit_price:amount,quantity:1,unit_measure:'unit'}]
      })
    });
    const qrData=order?.type_response?.qr_data || order?.qr_data || '';
    if(!qrData) throw new Error('O Mercado Pago não retornou o QR Code.');
    const qrDataUrl=await QRCode.toDataURL(qrData,{width:420,margin:2});
    await query(`INSERT INTO samsolution_orders
      (id,external_reference,name,email,phone,product_name,amount,mp_status,mp_status_detail)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[
        String(order.id),reference,customer.name,customer.email,customer.phone,product.name,price,
        String(order.status||'pending'),order.status_detail||null
      ]);
    return res.status(201).json({ok:true,orderId:String(order.id),externalReference:reference,status:order.status||'pending',amount:price,customer,qrData,qrDataUrl,pixCopyPaste:qrData,expiresAt:order.expiration_time||null});
  }catch(e){
    console.error('[qr]',e);
    return res.status(Number(e.status)||500).json({ok:false,error:e.message||'Não foi possível gerar o PIX.',details:e.details||undefined});
  }
};
