# SamSolution — Vercel + Mercado Pago PIX

## O que foi corrigido
- Rotas Serverless dentro de `api/`
- `/api/qr` para criação do QR PIX
- `/api/order/[id]` para consulta do pagamento
- `/api/webhook/mercadopago` para notificações
- `/api/health` para diagnóstico
- Node.js 20
- Validação de e-mail sem rejeitar endereços em maiúsculas
- Respostas de erro do Mercado Pago em JSON
- `X-Idempotency-Key` automático
- Compatibilidade temporária com a variável antiga `SAMSOLUTION`

## Environment Variables no Vercel

Crie em **Settings → Environment Variables**, para **Production** (e Preview se quiser testar):

`MP_ACCESS_TOKEN` = seu Access Token atual do Mercado Pago

`PRODUCT_NAME` = Google AI Pro

`PRODUCT_PRICE` = 0.01

`DELIVERY_CODE` = GEMINI-DEMO-001

`MP_WEBHOOK_SECRET` = segredo do webhook, se você configurar assinatura

Também é aceito `SAMSOLUTION` como fallback do token, mas o recomendado é usar `MP_ACCESS_TOKEN`.

## Depois de salvar
Faça **Redeploy** da branch `main` sem usar cache.

## Testes
Abra:

`https://SEU-DOMINIO.vercel.app/api/health`

Depois faça um checkout de teste de R$ 0,01.

## Segurança
Nunca coloque o Access Token no HTML, JavaScript do navegador, GitHub ou ZIP público. Como um token foi exposto anteriormente, gere/renove o token no Mercado Pago antes de usar em produção.
