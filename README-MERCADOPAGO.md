# SamSolution Google AI Pro + Mercado Pago QR

## 1) Configure a credencial
Copie `.env.example` para `.env` e coloque o Access Token do Mercado Pago no servidor:

MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN
MP_WEBHOOK_SECRET=SUA_CHAVE_SECRETA
PORT=3000

Nunca coloque o Access Token no HTML/JS.

## 2) Instale e rode
Node.js 18+:

npm install
npm start

Abra http://localhost:3000

## 3) QR dinâmico
O backend usa `POST /v1/orders` com `type: qr`, `config.qr.mode: dynamic`, `external_reference` do pedido e `X-Idempotency-Key` único. O retorno `type_response.qr_data` é convertido em QR PNG.

## 4) Webhook
No Mercado Pago: Sua aplicação > Webhooks > Configurar notificações > evento **Order (Mercado Pago)**. Em produção use uma URL HTTPS pública:
https://SEU-DOMINIO/api/webhook/mercadopago

## 5) Teste de R$ 0,01
O `data.json` já começa com preço R$ 0,01. Para um teste real, coloque um Access Token válido, rode o servidor e faça a compra. O servidor consulta a Order no Mercado Pago e só depois reserva um código do estoque.

## 6) Segurança
Antes de produção, valide `x-signature` usando a chave secreta do webhook, proteja o painel admin no servidor e use HTTPS. O Mercado Pago recomenda Webhooks para notificações e permite validar a origem pela assinatura.
