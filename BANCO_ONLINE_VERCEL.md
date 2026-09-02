# Banco de dados online — SamSolution

O painel não usa mais `localStorage`. Produto, preço, códigos e pedidos ficam no PostgreSQL online.

## Vercel
Conecte um banco PostgreSQL ao projeto (Neon é uma opção disponível no Marketplace da Vercel). A integração deve criar `POSTGRES_URL` em Production.

## Variáveis
- `MP_ACCESS_TOKEN` — Access Token do Mercado Pago
- `ADMIN_USER` — usuário do painel
- `ADMIN_PASSWORD` — senha forte
- `ADMIN_SESSION_SECRET` — segredo aleatório longo
- `POSTGRES_URL` — conexão PostgreSQL
- `PRODUCT_NAME` — nome inicial
- `PRODUCT_PRICE` — preço inicial

As tabelas são criadas automaticamente na primeira chamada da API.

## URLs de diagnóstico
`/api/health` deve retornar `database: online`.
`/api/store` mostra produto e estoque.

## Importante
Não coloque tokens ou senhas em arquivos versionados no GitHub.
