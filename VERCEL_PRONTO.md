# SamSolution — pacote pronto para Vercel

Este projeto foi preparado para Vercel com:
- funções serverless em `/api`;
- PostgreSQL persistente;
- painel administrativo sem senha, com sessão HttpOnly assinada;
- cadastro de produto e preço pelo painel;
- lançamento/exclusão de códigos de estoque;
- criação de PIX dinâmico pelo Mercado Pago Orders API;
- consulta de status do pagamento;
- entrega automática de um código após pagamento confirmado;
- webhook de Orders para sincronização de status;
- endpoint `/api/health` para diagnóstico.

## 1. Banco PostgreSQL no Vercel

O Vercel Postgres antigo não está disponível para novos projetos. Para este projeto, use uma integração PostgreSQL do Vercel Marketplace, preferencialmente Neon.

No projeto Vercel:
**Storage / Marketplace → Neon → Install/Connect → Production + Preview**.

A integração injeta a conexão no projeto. Este código aceita `DATABASE_URL`, `POSTGRES_URL` e outras variáveis PostgreSQL comuns.

## 2. Variáveis do Vercel

Em **Settings → Environment Variables**, configure para Production (e Preview se quiser testar):

- `DATABASE_URL` = conexão PostgreSQL fornecida pela integração
- `MP_ACCESS_TOKEN` = Access Token do Mercado Pago
- `PRODUCT_NAME` = Google AI Pro
- `PRODUCT_PRICE` = 0.01

Depois de alterar variáveis, faça um novo Deploy/Redeploy.

**Nunca coloque `MP_ACCESS_TOKEN` no HTML, JavaScript do navegador, GitHub ou em um arquivo `.env` enviado ao repositório.**

## 3. Mercado Pago

A integração usa a API de Orders para QR dinâmico:
`POST /v1/orders` com `config.qr.mode = dynamic`.

Depois de publicar, configure no Mercado Pago o webhook:
`https://SEU-DOMINIO.vercel.app/api/webhook/mercadopago`

Ative o tópico **Order (Mercado Pago)** / `orders`.

Para QR Code, a documentação atual do Mercado Pago informa que o campo `notification_url` não deve mais ser usado na API de Orders; o webhook é configurado no painel da aplicação.

## 4. Teste

Abra:
`https://SEU-DOMINIO.vercel.app/api/health`

O resultado esperado é:
- `ok: true`
- `vercel: true`
- `database: true`

Depois:
1. abra `/admin-login.html`;
2. entre com usuário `admin`;
3. cadastre o produto/preço;
4. lance pelo menos um código em **Estoque**;
5. abra a loja;
6. faça um checkout;
7. gere o PIX;
8. pague com uma conta de teste do Mercado Pago;
9. aguarde a confirmação;
10. confirme a entrega na tela de pagamento.

## 5. Importante sobre o painel

O projeto mantém o requisito de **admin sem senha**. A sessão é criada pelo endpoint de login e armazenada em cookie HttpOnly assinado, em vez de confiar em um cabeçalho fixo enviado pelo navegador.

Isso não equivale a uma autenticação forte: qualquer pessoa que consiga acessar a rota de login pode entrar como admin. Para uma loja pública em produção, o ideal é adicionar senha/2FA ou restringir o painel.

## Rotas principais

- `/` — loja
- `/checkout.html` — checkout
- `/pagamento-real.html` — QR/Pix Copia e Cola
- `/admin-login.html` — login do painel
- `/admin.html` — painel
- `/api/health` — diagnóstico
- `/api/store` — produto/estoque público
- `/api/qr` — criação do PIX
- `/api/order?id=...` — consulta da order
- `/api/deliver` — entrega do código
- `/api/webhook/mercadopago` — webhook Orders

## Observação

O ZIP não contém suas credenciais reais do Mercado Pago nem a URL real do banco. Essas duas informações precisam ser inseridas nas Environment Variables do Vercel; isso é obrigatório para o banco e o pagamento funcionarem.
