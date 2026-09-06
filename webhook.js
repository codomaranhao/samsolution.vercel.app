const { initDb, query } = require("../lib/db");
const { mpRequest } = require("../lib/mp");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Método não permitido." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const type = String(req.query?.type || body.type || "").toLowerCase();
    const orderId = String(req.query?.["data.id"] || body?.data?.id || body?.id || "").trim();

    // O Mercado Pago pode enviar a notificação antes de termos um registro local.
    // Respondemos 200 para evitar retries intermináveis e só atualizamos se o pedido for nosso.
    if (!orderId || (type && type !== "order" && type !== "orders")) {
      return res.status(200).json({ ok:true, ignored:true });
    }

    await initDb();
    const local = (await query(
      "SELECT id FROM samsolution_orders WHERE id=$1",
      [orderId]
    )).rows[0];

    if (!local) return res.status(200).json({ ok:true, ignored:true });

    const mp = await mpRequest(`/v1/orders/${encodeURIComponent(orderId)}`);
    const payment = mp?.transactions?.payments?.[0] || {};
    const status = payment.status || mp.status || "pending";
    const detail = payment.status_detail || mp.status_detail || null;
    const paid = status === "processed" || status === "approved";

    await query(
      `UPDATE samsolution_orders
       SET mp_status=$1,
           mp_status_detail=$2,
           paid_at=CASE WHEN $3 THEN COALESCE(paid_at,NOW()) ELSE paid_at END
       WHERE id=$4`,
      [status, detail, paid, orderId]
    );

    return res.status(200).json({ ok:true, orderId, status, paid });
  } catch (e) {
    console.error("[webhook]", e);
    // Mercado Pago espera uma resposta rápida; o checkout também faz polling.
    return res.status(200).json({ ok:false, received:true });
  }
};
