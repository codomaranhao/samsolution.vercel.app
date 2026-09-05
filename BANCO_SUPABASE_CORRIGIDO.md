# SamSolution — Banco Supabase corrigido

O banco `samsolution` já deve conter as tabelas `samsolution_products`, `samsolution_codes` e `samsolution_orders`.

## Vercel
Crie apenas estas variáveis no projeto:

- `POSTGRES_URL`: Connection string da **Transaction pooler** da Supabase.
- `MP_ACCESS_TOKEN`: Access Token do Mercado Pago.

O código normaliza `sslmode=verify-full` para `sslmode=require` e usa TLS com `rejectUnauthorized:false` para evitar `self-signed certificate in certificate chain` no runtime serverless.

Depois de salvar as variáveis, faça Redeploy.

## Diagnóstico
Abra `/api/health`. O esperado é `database: true` e `mercadopago: true`.
