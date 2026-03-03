# RecipeEasy

AI-powered recipe generation web app built with Next.js, Neon PostgreSQL, and R2 object storage.

## Stack

- Next.js 15 (App Router) + TypeScript
- React 19 + Tailwind CSS 4
- Neon PostgreSQL (`pg`)
- R2 object storage via S3 API (`@aws-sdk/client-s3`)
- Supabase Auth (Google/email)
- AI providers: Replicate + Qwen/DashScope

## Architecture

- Runtime: Node.js (Vercel)
- Database: Neon PostgreSQL
- File storage: R2 (S3-compatible API)
- Image URLs: public R2 image domain (`R2_PUBLIC_URL_IMG` / `NEXT_PUBLIC_R2_PUBLIC_URL_IMG`)
- Legal docs URLs: public R2 docs domain (`R2_PUBLIC_URL_DOC` / `NEXT_PUBLIC_R2_PUBLIC_URL_DOC`)

## Quick Start

```bash
git clone https://github.com/nasirannn/recipe-easy.git
cd recipe-easy
npm install
cp .env.example .env.local
# edit .env.local
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

Set these in `.env.local` (local) and Vercel Project Settings (production):

```bash
# App
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require

# Supabase
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>

# AI
REPLICATE_API_TOKEN=<token>
QWENPLUS_API_KEY=<token>
# optional depending on your setup
DASHSCOPE_API_KEY=<token>
DEEPSEEK_API_KEY=<token>

# PayPal (credit purchase)
# sandbox | live
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=<paypal-client-id>
PAYPAL_CLIENT_SECRET=<paypal-client-secret>
PAYPAL_WEBHOOK_ID=<paypal-webhook-id>

# Shared R2 endpoint (S3 compatible)
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com

# R2 image bucket
R2_BUCKET_NAME_IMG=recipe-images
R2_ACCESS_KEY_ID_IMG=<key-id>
R2_SECRET_ACCESS_KEY_IMG=<secret>
R2_PUBLIC_URL_IMG=https://<your-r2-image-public-domain>
NEXT_PUBLIC_R2_PUBLIC_URL_IMG=https://<your-r2-image-public-domain>

# R2 docs bucket (public markdown docs)
R2_BUCKET_NAME_DOC=recipe-doc
R2_ACCESS_KEY_ID_DOC=<key-id>
R2_SECRET_ACCESS_KEY_DOC=<secret>
R2_PUBLIC_URL_DOC=https://<your-r2-doc-public-domain>
NEXT_PUBLIC_R2_PUBLIC_URL_DOC=https://<your-r2-doc-public-domain>
```

## PayPal Credits Purchase

- Pricing page: `/pricing` (English) / `/zh/pricing` (Chinese)
- Create order API: `POST /api/payments/paypal/create-order`
- Capture API: `POST /api/payments/paypal/capture-order`
- Webhook API: `POST /api/payments/paypal/webhook`

Configure `PAYPAL_WEBHOOK_ID` in PayPal dashboard and subscribe to:
- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`

## Database

- Current PostgreSQL schema files are in `docs/database/`.
- Apply schema to Neon with `psql`:

```bash
psql "$DATABASE_URL" -f docs/database/neon-schema.sql
```

## Scripts

```bash
npm run dev      # start local dev server
npm run build    # production build
npm run start    # run production build locally
npm run lint     # lint checks
npm run preview  # build + start
```

## Deploy (Vercel)

1. Push repository to GitHub.
2. Import project in Vercel.
3. Configure all environment variables listed above.
4. Deploy.

## Notes

- This project no longer depends on Cloudflare Workers/D1 runtime.
- R2 remains as an object storage backend via S3-compatible credentials.
