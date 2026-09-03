# Development Guide

How to run Kun Finance locally, and how each piece of the stack fits together.

## Prerequisites

- Node.js 24.x
- Python 3.12.x
- npm (comes with Node)
- A Supabase project (or any PostgreSQL instance) with a connection string

## Initial Setup

### 1. Clone and install JS dependencies

This is an npm workspaces monorepo — one install at the root covers
`client`, `server`, and `shared` together.

```bash
git clone <repo-url>
cd kun-finance
npm install
```

### 2. Set up environment variables

**Server** (`server/.env`):

```bash
cp server/.env.example server/.env
```

Fill in:
- `DATABASE_URL` — Supabase **pooled** connection (port 6543, `?pgbouncer=true`).
  Used by the app at runtime.
- `DIRECT_URL` — Supabase **direct** connection (port 5432).
  Used only by Prisma Migrate — the pooler can't run migrations.
- `JWT_SECRET` — any random 64-character string for local dev
- Leave `KUN_FINANCE_*_MODE` vars set to `mock` unless you're testing real
  integrations (OpenAI, etc.)

**Client** (`client/.env.local`):

```bash
cp client/.env.example client/.env.local
```

### 3. Set up the database

```bash
cd server
npx prisma generate      # generates the typed Prisma Client
npx prisma migrate dev   # applies all migrations to your database
```

If you're on a fresh Supabase project, this also runs the `enable_rls`
migration, which turns on Row Level Security on all tables (see
`project-bible.md` Section 6 for why this matters).

### 4. Set up the Python ML environment

```bash
cd ml
python3 -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate           # Windows
pip install -r requirements.txt --break-system-packages
```

You'll need to run `source venv/bin/activate` again every time you open a
new terminal to work on `/ml` — it's not a one-time step.

## Running Things Locally

```bash
# Frontend — localhost:3000, both /id/... and /en/... routes
npm run dev --workspace=client

# Backend — localhost:5000
npm run dev --workspace=server

# Confirm the backend is alive
curl http://localhost:5000/healthcheck
```

## Running Tests

```bash
# Server (Vitest)
npm run test --workspace=server

# Python ML (pytest) — venv must be active
cd ml && pytest
```

## Common Tasks

### Adding a new Prisma model or field

1. Edit `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <describe_the_change>`
3. Run `npx prisma generate` (usually automatic after migrate, but run it
   explicitly if types look stale)

### Viewing the database

```bash
cd server
npx prisma studio
```

Opens a browser GUI for inspecting/editing rows directly.

### Checking types and build health before committing

```bash
npm run build --workspace=client
npm run build --workspace=server
```

This mirrors what CI runs — if these pass locally, CI should pass too.

## Known Tooling Quirks

- **Prisma is pinned to 7.9.0.** `prisma@latest` currently resolves to a
  release-candidate Platform CLI (`8.0.0-rc.x`) with breaking changes
  (removed `url` from the schema `datasource` block, different config
  format, auto-installs AI agent skill docs). Don't run
  `npm i prisma@latest` — install `prisma@7.9.0` explicitly if you ever
  need to reinstall.
- **Prisma reads `.env` only**, not `.env.local` or other variants —
  this applies to the `server` workspace specifically.
- **Supabase gives two connection strings.** `DATABASE_URL` (pooled,
  port 6543) is for the app; `DIRECT_URL` (unpooled, port 5432) is for
  migrations only. Mixing these up causes migration failures.
- **Standalone scripts run via `tsx` don't auto-load `.env`.** Only
  `npm run dev` picks up `server/.env` implicitly. Scripts like
  `seed.ts` need `tsx --env-file=.env <script>` in their `package.json`
  entry, or Prisma silently falls back to `127.0.0.1:5432` and fails
  with a confusing "can't reach database" error.

## CI

Every push and PR to `master` runs `.github/workflows/test.yml`, which
typechecks, lints, and tests `client`, `server`, and `ml` in parallel.
Check the **Actions** tab on GitHub if a push doesn't show a run — the
most common cause is targeting the wrong branch name in the workflow's
`on.push.branches` list.
