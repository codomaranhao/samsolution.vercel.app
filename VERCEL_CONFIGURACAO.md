# SamSolution + Mercado Pago + Vercel

## O que está pronto
- Checkout sem a rejeição indevida de e-mail.
- Criação de Order via `POST /v1/orders`.
- `type: "qr"` + `config.qr.mode: "dynamic"`.
- QR Code e Pix Copia e Cola.
- Consulta `GET /v1/orders/{order_id}`.
- Polling automático até `status: processed`.
- Webhook `/api/webhook/mercadopago`.
- Estrutura de funções serverless compatível com Vercel.

## Variáveis do Vercel
Em Project > Settings > Environment Variables, adicione:

`MP_ACCESS_TOKEN` = Access Token do Mercado Pago (backend; nunca coloque no HTML)

`MP_WEBHOOK_SECRET` = chave secreta do Webhook, se disponível para o evento/app

`PRODUCT_NAME` = Google AI Pro

`PRODUCT_PRICE` = 0.01 para o teste real

`DELIVERY_CODE` = código que será exibido depois que a Order estiver `processed`

## Webhook
Configure no Mercado Pago:

`https://SEU-DOMINIO.vercel.app/api/webhook/mercadopago`

Use o evento de Order/Mercado Pago conforme a configuração da aplicação.

## Deploy
1. Suba este projeto no GitHub ou importe o ZIP no Vercel.
2. Configure as variáveis acima.
3. Faça Deploy.
4. Abra `/checkout.html`.
5. Preencha os dados.
6. Clique em Continuar para PIX.
7. O site cria uma Order real no Mercado Pago e mostra o QR.

## Importante sobre estoque
O Vercel Functions não deve usar `data.json` como banco persistente. Para estoque com vários códigos e baixa concorrente, conecte um banco (por exemplo, Postgres/Supabase) antes de produção. `DELIVERY_CODE` é deliberadamente um modo simples para o primeiro teste real de pagamento.
