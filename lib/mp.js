const crypto = require('crypto');

const MP_API = 'https://api.mercadopago.com';

function getConfig() {
  const token = process.env.MP_ACCESS_TOKEN || process.env.SAMSOLUTION;
  if (!token) throw new Error('Configure MP_ACCESS_TOKEN nas Environment Variables do Vercel.');
  return {
    token,
    productName: process.env.PRODUCT_NAME || 'Google AI Pro',
    productPrice: Number(process.env.PRODUCT_PRICE || '0.01'),
    deliveryCode: process.env.DELIVERY_CODE || ''
  };
}

async function mpRequest(path, options = {}) {
  const { token } = getConfig();
  const response = await fetch(MP_API + path, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(`Mercado Pago ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function validEmail(value) {
  const v = String(value || '').trim().replace(/\s+/g, '').toLowerCase();
  if (v.length < 6 || v.length > 254 || v.includes('..')) return false;

  const at = v.indexOf('@');
  if (at <= 0 || at !== v.lastIndexOf('@')) return false;

  const local = v.slice(0, at);
  const domain = v.slice(at + 1);

  if (local.length > 64 || !domain || domain.length > 253) return false;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$/i.test(domain)) return false;

  return true;
}

function safeCustomer(body) {
  const name = String(body?.name || '').trim().slice(0, 120);
  const phone = String(body?.phone || '').trim().slice(0, 40);
  const email = cleanEmail(body?.email);
  if (!name) throw new Error('Informe seu nome.');
  if (!phone) throw new Error('Informe seu WhatsApp.');
  if (!validEmail(email)) throw new Error('Informe um e-mail válido.');
  return { name, phone, email };
}

function externalReference() {
  return `SAMSOLUTION-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

module.exports = { getConfig, mpRequest, cleanEmail, validEmail, safeCustomer, externalReference };
