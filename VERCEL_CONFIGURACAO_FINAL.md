# SamSolution — configuração final Vercel + Supabase + Mercado Pago

## Variáveis obrigatórias na Vercel

- `POSTGRES_URL`: use a **Transaction Pooler** connection string da Supabase (porta 6543).
- `MP_ACCESS_TOKEN`: Access Token de produção do Mercado Pago.
- `ADMIN_SESSION_SECRET`: opcional, recomendado para sessões administrativas.

Não coloque o Access Token dentro do código ou do ZIP.

## Fluxo

1. `/checkout.html` chama `/api/qr`.
2. `/api/qr` cria uma Order QR dinâmica no Mercado Pago.
3. O QR é gerado a partir de `type_response.qr_data`.
4. O pedido é salvo no PostgreSQL.
5. `/api/order` consulta o status.
6. `/api/webhook` recebe atualizações de Order quando configurado no Mercado Pago.
7. `/api/deliver` só libera o primeiro código não usado depois de confirmar o pagamento.
8. O código é marcado como usado no PostgreSQL.

## Estoque enviado nesta versão

O estoque recebido do arquivo do usuário é semeado pelo backend no PostgreSQL na inicialização, usando `ON CONFLICT` para não duplicar códigos.

## Webhook Mercado Pago

Depois de publicar o domínio, configure no Mercado Pago a URL:

`https://SEU-DOMINIO/api/webhook`

Evento: **Order**.

O checkout continua fazendo polling como mecanismo de contingência.

## Teste

Abra:

`https://SEU-DOMINIO/api/health`

Esperado:

- `database: true`
- `mercadopago: true`
- `stock: 2` (ou o número atual de códigos disponíveis)

## Observação de segurança

O painel foi mantido no modo solicitado, com identificador `admin` sem senha. Isso não é adequado para uma loja pública. Recomenda-se adicionar autenticação forte antes de colocar a URL do painel em divulgação pública.
