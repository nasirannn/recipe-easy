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
- Image URLs: public R2 domain (`R2_PUBLIC_URL` / `NEXT_PUBLIC_R2_PUBLIC_URL`)

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

# R2 (S3 compatible)
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_BUCKET_NAME=recipe-images
R2_ACCESS_KEY_ID=<key-id>
R2_SECRET_ACCESS_KEY=<secret>
R2_PUBLIC_URL=https://<your-r2-public-domain>
NEXT_PUBLIC_R2_PUBLIC_URL=https://<your-r2-public-domain>
```

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
