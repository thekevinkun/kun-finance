# Changelog

All notable changes to Kun Finance are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — Phase 1: Tooling Foundation

### Added
- Monorepo scaffolded with npm workspaces (`client`, `server`, `shared`)
- Next.js 16 client with TypeScript, Tailwind v4, App Router
- Design token system (colors, spacing, typography) matching design mockups
- next-intl i18n wiring: Indonesian (default) + English, cookie-based
  persistence, language toggle component
- `@kun-finance/shared` package with `Result<T>` discriminated union type
- Express 5 server scaffold with CORS, JSON parsing, health check endpoint
- Global error handling and 404 middleware
- Prisma 7.9.0 schema covering 8 core models (User, Business, Transaction,
  Forecast, Anomaly, Advice, ModelMetadata, AuditLog)
- PostgreSQL database via Supabase, with Row Level Security enabled on all
  tables as defense-in-depth
- Python 3.12 ML pipeline skeleton (`generate_demo.py`, `train.py`,
  `predict.py`) with virtual environment and `requirements.txt`
- Vitest configured for server tests; pytest configured for ML tests
- GitHub Actions CI workflow: typecheck, lint, test across client/server/ml

### Changed
- Switched planned database host from Neon to Supabase
- Pinned Prisma to 7.9.0 after discovering `prisma@latest` resolves to an
  unstable `8.0.0-rc.x` Platform CLI release

### Fixed
- CI Prisma Client generation failing due to missing env vars at `generate`
  time (added dummy values, since `generate` doesn't connect to a real DB)
- CI type error from Next.js 16's stricter typed-routes constraint on
  `[locale]/layout.tsx` (switched to generated `LayoutProps<"/[locale]">`)
- Vitest picking up stale compiled test files from `dist/` (excluded via
  `vitest.config.ts`)

## [Unreleased] — Phase 2: Authentication

### Added
- `RefreshToken` Prisma model with soft revocation and cascade delete
- JWT utilities: sign, verify, decode, refresh token generation, SHA-256 hashing
- bcrypt password hashing and comparison helpers
- Auth service: register, login, refresh — all returning `Result<T>`, never throwing
- Refresh token reuse detection (full session revocation on suspicious reuse)
- Zod validation schemas for register and login
- Reusable `validate` Express middleware
- Auth routes: POST /api/auth/register, /login, /refresh with httpOnly cookie handling
- `authenticate` middleware: Bearer token verification, attaches `req.user`
- 14 unit tests covering auth service and middleware
