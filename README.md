# SamSolution — Vercel + Mercado Pago PIX + Painel Admin

## Acesso ao painel

O painel administrativo foi simplificado conforme solicitado: **somente o usuário `admin`**, sem campo de senha.

Abra:

- `/admin`
- `/admin.html`

O painel envia o identificador administrativo diretamente para as APIs. **Isso não é um mecanismo de segurança forte**; qualquer pessoa que descubra o endpoint pode tentar acessar o painel. Para produção, recomenda-se adicionar uma senha forte depois.

## O que esta versão corrige

- Painel não depende mais do login/cookie para abrir.
- `/admin` e `/painel` são reescritos para `admin.html`.
- Todas as APIs administrativas aceitam o modo administrativo solicitado.
- Erros de API são tratados como JSON e exibidos de forma clara.
- `/api/admin-data`, `/api/admin-product`, `/api/admin-codes` e `/api/admin-code-delete` estão alinhadas com o painel.
- Banco PostgreSQL é inicializado automaticamente na primeira chamada.
- Produto inicial: Google AI Pro, R$ 0,01.
- Estoque de códigos pode ser lançado pelo painel.
- Pedidos são listados no painel.
- Checkout consulta o produto pelo banco.
- PIX usa Mercado Pago Orders API com QR dinâmico.
- Consulta do pagamento usa `GET /v1/orders/{id}`.
- Entrega reserva um código disponível somente após confirmação do pagamento.
- Node 20 configurado em `package.json`.
- Não há declaração de runtime no `vercel.json`.
- Todas as páginas foram verificadas quanto às rotas `/api/*`.

## Variáveis obrigatórias no Vercel

Em **Settings → Environment Variables**, configure para Production:

```text
MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_DO_MERCADO_PAGO
POSTGRES_URL=SUA_URL_DE_POSTGRESQL
```

Depois faça **Redeploy**.

O login/painel abre sem o banco, mas salvar produto, lançar estoque, consultar pedidos e realizar checkout real exigem `POSTGRES_URL`.

## Banco

O projeto cria automaticamente:

- `samsolution_products`
- `samsolution_codes`
- `samsolution_orders`

Ao conectar um PostgreSQL, basta acessar o painel e cadastrar os códigos.

## Mercado Pago

O Access Token deve ficar **somente no Vercel Environment Variables**. Nunca coloque o token no HTML ou JavaScript do navegador.

Como um token foi exposto anteriormente, gere um novo token antes de produção.

## Teste após publicar

1. `https://SEU-DOMINIO.vercel.app/admin`
2. `https://SEU-DOMINIO.vercel.app/api/health`
3. Configure o banco.
4. Abra `/admin`, altere nome/preço e lance códigos.
5. Abra a loja e faça um checkout de teste.

## Estrutura

```text
index.html
checkout.html
pagamento-real.html
admin.html
admin-login.html
api/*.js
lib/*.js
package.json
vercel.json
```
