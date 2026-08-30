# Progress Tracker — Kun Finance Dashboard

> **Document Type:** Living checklist. Updated after each session. Single source of truth for project status.
> **Last updated:** August 2026, Session 1 (planning complete)
> **Current phase:** Phase 1 (Tooling Foundation + i18n Setup) — Ready to start
> **Part of:** Kun Projects Ecosystem

---

## Session Notes (Latest at Top)

### Session 3 — Server Scaffold, Prisma, CI/CD
**Date:** August 28, 2026
**Status:** ✅ Complete

**Accomplished:**
- Express 5 server scaffolded with CORS, JSON parsing, error/404 middleware
- Prisma 7.9.0 schema written: 8 models translated 1:1 from project-bible.md
- Migrated from planned Neon to Supabase for PostgreSQL hosting
- Row Level Security enabled on all tables via tracked migration
- Python 3.12 ML pipeline skeleton scaffolded (generate_demo.py, train.py, predict.py)
- Vitest + pytest configured with sample tests for server and ml
- GitHub Actions CI workflow set up across client/server/ml
- README.md, DEVELOPMENT.md, CHANGELOG.md written

**Decisions made:**
- Pinned Prisma to 7.9.0 after `prisma@latest` resolved to an unstable
  8.0.0-rc.x Platform CLI with breaking changes (see ai-workflow.md decision log)
- Supabase chosen over Neon — same "Postgres or local" slot from original plan,
  adds dashboard/RLS tooling
- Split Supabase's pooled (`DATABASE_URL`) vs direct (`DIRECT_URL`) connections:
  pooled for app runtime, direct for Prisma Migrate (pooler can't run migrations)
- Test-immediately-after-logic adopted as the project's testing rhythm going
  forward, rather than deferring all tests to Phase 8

**Debugging notes (for future reference):**
- Prisma 8 RC auto-installs `.agents/.claude/.cursor/.devil` skill folders —
  safe to delete, added to .gitignore
- Next.js 16's typed-routes constraint requires generated `LayoutProps<"/[locale]">`
  instead of hand-written params types in `[locale]/layout.tsx`
- CI needs dummy DATABASE_URL/DIRECT_URL env vars for `prisma generate` step
  (doesn't connect to a real DB, but prisma.config.ts eagerly reads env vars)

**What's next:** Documentation section of Phase 1 (this session), then Phase 2 (Authentication)

### Session 2 — Client Scaffold + i18n
**Date:** August 27, 2026
**Status:** ✅ Complete

**Accomplished:**
- Next.js 16 client scaffolded (TypeScript, Tailwind v4, src/ dir, App Router)
- Design tokens reconciled between bible and mockups (colors, fonts, spacing)
- npm workspaces set up with @kun-finance/shared package (Result<`T`> type)
- next-intl i18n fully wired: proxy.ts, locale routing, cookie persistence
- LanguageToggle component built using next-intl's navigation APIs
- Placeholder pages for all 4 routes, both locales confirmed working

**Decisions made:**
- Design token naming: ink/ink-muted (not text-*) and line (not border) to avoid Tailwind utility stutter
- Shared types via npm workspaces (not duplication) — revisit if Prisma types tempt duplication later
- next-intl's own useRouter/usePathname (not next/navigation) required for cookie-based locale persistence

**What's next:** Express server scaffold (Phase 1 checklist, server section)

### Session 1 — Planning & Design Lockdown
**Date:** August 27, 2026
**Status:** ✅ Complete

**Accomplished:**
- Locked tech stack (Next.js + Express + PostgreSQL + Prisma + Python)
- Designed 4-page UI (Dashboard, Forecast, Transactions, Reports) per FinCast
- Defined 9-layer security model + mock mode system
- Mapped database schema (13 tables)
- Documented code patterns & project Bible
- Identified AI workflow (Learning Mode for development)
- Planned bilingual setup (next-intl, Indonesian default + English)
- Named app "Kun Finance" (part of Kun ecosystem with KUN AI assistant)

**Decisions made:**
- No NestJS (too much ceremony for focus)
- No Clerk auth (build custom JWT to learn security)
- Pre-computed forecasts (offline training, not real-time)
- FinCast-inspired design (data-focused, minimal decoration)
- Bilingual with next-intl (Indonesian default, language in URL path: `/id/...`, `/en/...`)
- App name "Kun Finance" + AI assistant "KUN" (consistent with Kundesk ecosystem)
- 3-file documentation system (bible, tracker, workflow)
- i18n integrated into Phase 1 (not separate phase)

**What's next:** Start Phase 1 (repo setup, tooling, boilerplate)

---

## Phase Overview

**Goal:** Build a portfolio-grade cash flow forecasting system with trained ML models, clean architecture, and security best practices.

**Scope:** 
- 4 pages (dashboard, forecast, transactions, reports)
- 2 trained models (forecasting, anomaly detection)
- 9-layer security
- Pre-computed predictions, demo mode

**Not in scope:**
- Real money handling (demo only)
- Multi-user / team features
- Bank API integrations (future phase)
- Mobile app

---

## Phase Breakdown & Checklist

### Phase 1: Tooling Foundation ⏳ (Next)
**Goal:** Set up repo structure, environment, and boilerplate so coding can start immediately.
**Estimated time:** 3–5 days
**Start after:** This document is ready

**Checklist:**

- [x] GitHub repo created + cloned locally
- [x] Folder structure created:
  - [x] `/client` (Next.js)
  - [x] `/server` (Express)
  - [x] `/ml` (Python)
  - [x] `/docs` (markdown docs)
- [x] **Client (Next.js 16):**
  - [x] `npm create next-app@latest` with TypeScript, Tailwind, App Router
  - [x] `.env.local` template created
  - [x] `tsconfig.json` configured (strict mode)
  - [x] Tailwind config extended with design tokens (colors, spacing)
  - [x] Global styles (`globals.css`) with CSS variables
  - [x]  `src/types/` folder for shared types
  - [x] `src/lib/axios.ts` configured (base URL, auth headers)
  - [x] **i18n Setup (next-intl):**
    - [x] `npm install next-intl`
    - [x] `i18n.config.ts` created (language config: default = 'id')
    - [x] Middleware configured (`src/middleware.ts`) for language routing
    - [x] Folder structure created: `/public/locales/id/` and `/public/locales/en/`
    - [x] Translation files created: `common.json`, `dashboard.json`, `forecast.json`, `transactions.json`, `reports.json`, `errors.json`
    - [x] Language switcher component created (`LanguageToggle.tsx`)
    - [x] Routes wrapped with i18n provider
    - [x] Test: visit `/id/dashboard` and `/en/dashboard` (both work)
  - [x] Placeholder pages: `/[locale]/dashboard`, `/[locale]/forecast`, `/[locale]/transactions`, `/[locale]/reports`
  - [x] Git workflow setup (main + feature branches)
- [x] **Server (Express):**
  - [x] `npm init -y` + TypeScript setup
  - [x] `package.json` scripts: `dev`, `build`, `start`, `test`
  - [x] `tsconfig.json` configured
  - [x] Entry point `src/index.ts` created
  - [x] Express server scaffold (port 5000)
  - [x] CORS configured to allow frontend localhost:3000
  - [x] `.env` template created (DATABASE_URL, DIRECT_URL, JWT_SECRET, etc.)
  - [x] Prisma initialized (pinned to 7.9.0 — see decision log)
  - [x] `.env` linked to PostgreSQL (Supabase, pooled + direct connection)
  - [x] First migration: base schema pushed to DB
  - [x] Folder structure: `/src/api/routes`, `/src/services`, `/src/middleware`, `/src/lib`
  - [x] Middleware stack in place (error handling, CORS)
  - [x] `/healthcheck` endpoint working
- [x] **Python ML:**
  - [x] Python 3.11+ installed
  - [x] Virtual env created
  - [x] `requirements.txt` created (scikit-learn, pandas, numpy, openai)
  - [x] Demo data generator script: `/ml/data/generate_demo.py`
  - [x] Folder structure: `/ml/models`, `/ml/data`, `/ml/notebooks`
  - [x] `train.py` skeleton created (loads data, prints progress, no actual training yet)
  - [x] `predict.py` skeleton created (loads models, generates dummy predictions)
- [x] **Database (PostgreSQL):**
  - [x] PostgreSQL running (Supabase connection string in `.env`)
  - [x] Prisma schema (`schema.prisma`) with all 13 tables defined
  - [x] First migration created and applied (`npx prisma migrate dev --name init`)
  - [x] Prisma Studio tested locally (`npx prisma studio`)
- [x] **Testing setup:**
  - [x] Vitest configured in `/server`
  - [x] pytest configured in `/ml`
  - [x] Sample test written for each (verify runner works)
- [x] **CI/CD:**
  - [x] GitHub Actions workflow created: `.github/workflows/test.yml`
  - [x] Runs: typecheck, lint (ESLint), test, build
  - [x] Runs on: push to `master`, PRs
- [x] **Documentation:**
  - [x] `README.md` written (project overview, setup instructions)
  - [x] `DEVELOPMENT.md` written (how to run locally, how to contribute)
  - [x] `CHANGELOG.md` created (empty, will track changes)

**Definition of done:** Developer can run `npm run dev` (client) + `npm run dev` (server) + python scripts, all boilerplate works, i18n routing works (`/id/...` and `/en/...` pages load correctly), language toggle switches between ID and EN, no business logic yet.

---

### Phase 2: Authentication & Authorization ⏳
**Goal:** Implement user auth (JWT), protect API routes, enable user-specific queries.
**Estimated time:** 5–7 days
**Dependency:** Phase 1 complete

**Checklist:**

- [ ] **Auth service created:**
  - [x] `src/services/auth.service.ts` with functions: `register()`, `login()`, `refreshToken()`
  - [x] JWT utility: `src/lib/jwt.ts` (sign, verify, decode)
  - [x] Password hashing: bcrypt integration
  - [ ] Test: unit tests for auth functions (Vitest)
- [x] **API routes created:**
  - [x] `POST /api/auth/register` (email, password)
  - [x] `POST /api/auth/login` (email, password)
  - [x] `POST /api/auth/refresh` (refresh token)
  - [x] All routes return `Result<T>` type
- [ ] **Middleware:**
  - [ ] Authentication middleware: verifies JWT, extracts user_id
  - [ ] Authorization middleware: checks business_id ownership
  - [ ] Applied to all protected routes
- [ ] **Frontend:**
  - [ ] Zustand store for auth state (currentUser, isAuthenticated, tokens)
  - [ ] Login page: email + password form, submit to `/api/auth/login`
  - [ ] Register page: email + password + confirm, submit to `/api/auth/register`
  - [ ] Redirect unauthenticated users to login
  - [ ] Store tokens in localStorage (access) + httpOnly cookie (refresh, backend sets)
  - [ ] Pass JWT in Authorization header for all API calls
- [ ] **Test cases:**
  - [ ] Register new user
  - [ ] Login existing user
  - [ ] Invalid password rejected
  - [ ] Refresh token works
  - [ ] Expired JWT rejected
  - [ ] Unauthenticated request rejected

**Definition of done:** User can register, login, get JWT, use it to access protected routes. Token refresh works.

---

### Phase 3: Database & Demo Data ⏳
**Goal:** Populate PostgreSQL with demo businesses and 12 months of synthetic transactions.
**Estimated time:** 4–6 days
**Dependency:** Phase 2 complete

**Checklist:**

- [ ] **Demo data generator (Python):**
  - [ ] `ml/data/generate_demo.py` creates realistic transaction patterns
  - [ ] Generates 3 demo businesses (restaurant, salon, trading)
  - [ ] Each business: 12 months (360 days) of daily + periodic transactions
  - [ ] Transaction patterns:
    - [ ] Daily revenue (varies by day-of-week, seasonal)
    - [ ] Fixed costs (rent, payroll on specific dates)
    - [ ] Variable costs (suppliers every 15 days, utilities monthly)
    - [ ] Some anomalies (duplicate charge, spike, new vendor)
  - [ ] Outputs: SQL insert statements or JSON
- [ ] **Seed script:**
  - [ ] `server/src/scripts/seed.ts` reads generated data
  - [ ] Inserts into PostgreSQL via Prisma
  - [ ] Creates test users (test@example.com)
  - [ ] Callable via `npm run seed`
- [ ] **API endpoint to fetch demo data:**
  - [ ] `GET /api/businesses` (list user's businesses)
  - [ ] Returns demo businesses + transaction counts
- [ ] **Verify data:**
  - [ ] Prisma Studio shows 3 demo businesses
  - [ ] Each has ~360 transactions
  - [ ] Date ranges correct (Jan — Dec)
  - [ ] Amounts realistic (Rp values)
- [ ] **Frontend:**
  - [ ] Business selector created (shows "Warung Bu Ratna", "Toko Kopi", etc.)
  - [ ] Clicking business stores businessId in Zustand store
  - [ ] All subsequent API calls filter by businessId

**Definition of done:** Demo data in DB, frontend can select business, API queries return business's transactions filtered correctly.

---

### Phase 4: Python ML — Training Pipeline ⏳
**Goal:** Build training scripts that generate forecasts and detect anomalies.
**Estimated time:** 7–10 days
**Dependency:** Phase 3 complete

**Checklist:**

- [ ] **Forecasting model:**
  - [ ] `ml/train_forecast.py` loads transactions for a business
  - [ ] Feature engineering:
    - [ ] Day of month, month, day of week, is_weekend
    - [ ] Lagged features (revenue from 7 days ago, 30 days ago)
    - [ ] Seasonality indicators (is_monsoon, is_holiday)
  - [ ] Splits data: 80% train, 10% validate, 10% test
  - [ ] Trains Gradient Boosting Regressor (from scikit-learn)
  - [ ] Evaluates on test set: RMSE, MAE, R²
  - [ ] Generates 30-day forecast (daily predictions + confidence intervals)
  - [ ] Saves model: `ml/models/forecast_model_{business_id}.pkl`
  - [ ] Test: verify model loads, makes predictions
- [ ] **Anomaly detection model:**
  - [ ] `ml/train_anomaly.py` loads all transactions for business
  - [ ] Feature engineering:
    - [ ] Amount (normalized by category mean)
    - [ ] Day of month, day of week
    - [ ] Is this transaction's category recurring for this business?
  - [ ] Trains Isolation Forest (contamination=0.05)
  - [ ] Identifies anomalies in historical data
  - [ ] Saves model: `ml/models/anomaly_model_{business_id}.pkl`
  - [ ] Test: verify model flags known anomalies
- [ ] **Prediction script:**
  - [ ] `ml/predict.py --business_id=<id>` runs both models
  - [ ] Generates 30-day forecast data
  - [ ] Runs anomaly detection
  - [ ] Stores results in PostgreSQL (forecasts + anomalies tables)
- [ ] **Integration with backend:**
  - [ ] Express endpoint: `POST /api/ml/train` (runs Python subprocess)
  - [ ] Calls `python /ml/predict.py --business_id=<id>`
  - [ ] Stores model metadata in `model_metadata` table
- [ ] **Backtesting:**
  - [ ] Train on first 6 months, predict for next 3 months
  - [ ] Compare predictions vs actual
  - [ ] Calculate RMSE, MAE for validation
  - [ ] Document results

**Definition of done:** `python /ml/predict.py --business_id=demo_restaurant` runs, generates forecasts + anomalies, stores in DB.

---

### Phase 5: Dashboard Page ⏳
**Goal:** Build the main dashboard view with stats, charts, and strategy panel.
**Estimated time:** 6–8 days
**Dependency:** Phase 4 complete

**Checklist:**

- [ ] **Frontend page:** `app/dashboard/page.tsx`
- [ ] **Components created:**
  - [ ] StatCard (displays number, label, sparkline, trend)
  - [ ] Chart component (wraps Chart.js, displays 12-month forecast)
  - [ ] AnomalyList (lists detected issues with severity badges)
  - [ ] StrategyLabPanel (AI insights, alerts, chat input)
  - [ ] UpcomingPaymentsTable (mini table of next 4 payments)
- [ ] **Data fetching:**
  - [ ] `GET /api/forecasts?business_id=<id>` returns 30-day forecast
  - [ ] `GET /api/anomalies?business_id=<id>` returns detected issues
  - [ ] `GET /api/advice?business_id=<id>` returns LLM-generated advice
  - [ ] `GET /api/transactions?business_id=<id>&limit=4&sort=date_asc` (upcoming payments)
- [ ] **API endpoints created:**
  - [ ] `GET /api/forecasts`
  - [ ] `GET /api/anomalies`
  - [ ] `GET /api/transactions` (with query filters)
  - [ ] All return `{ ok: true, data: [...] }`
- [ ] **Layout:**
  - [ ] Top: 3 stat cards (current balance, predicted low, recommended buffer)
  - [ ] Middle: Alert banner (if cash dip detected)
  - [ ] Middle: Large chart (12-month forecast)
  - [ ] Right sidebar: Strategy Lab (AI insights + alerts, sticky)
  - [ ] Bottom: Upcoming Payments table
- [ ] **Styling:**
  - [ ] Uses design tokens from Tailwind config
  - [ ] Matches FinCast mockup
  - [ ] Responsive (sidebar collapses on mobile)
- [ ] **Error states:**
  - [ ] Loading skeleton for each section
  - [ ] Error message if data fails to load
  - [ ] Graceful fallback if no data exists

**Definition of done:** Dashboard page loads, displays stats + chart + alerts, data from API, styled per design spec.

---

### Phase 6: Remaining Pages ⏳
**Goal:** Build Forecast, Transactions, and Reports pages.
**Estimated time:** 8–10 days
**Dependency:** Phase 5 complete

**Checklist:**

- [ ] **Forecast page (`/forecast`):**
  - [ ] Large 30-day cash position chart (actual + predicted + confidence band)
  - [ ] Alert banner at top (if dip detected)
  - [ ] Below: Anomalies list + Model Stats cards (side-by-side)
  - [ ] Features: date range picker, export button
- [ ] **Transactions page (`/transactions`):**
  - [ ] Filters: account dropdown, category dropdown, date range
  - [ ] Search box (by description or amount)
  - [ ] Table: date, type (↑↓), description, category badge, amount, flag
  - [ ] Pagination: 15 rows per page
  - [ ] Export button (CSV)
  - [ ] Add Transaction button (for future CSV upload feature)
- [ ] **Reports page (`/reports`):**
  - [ ] Top section: "Runway Analysis" card (donut chart + burn rate + cash position)
  - [ ] Top section: "System Alerts" card (3 latest alerts with severity icons)
  - [ ] Bottom section: "Standard Reports" table (P&L, Balance Sheet, Cash Flow Statement)
  - [ ] Export buttons (PDF, CSV, XLSX)
  - [ ] Date picker (Q3 2023, etc.)
- [ ] **API endpoints (if not already created):**
  - [ ] `GET /api/reports/runway`
  - [ ] `GET /api/reports/alerts`
  - [ ] `GET /api/reports/standard` (with period parameter)
- [ ] **Styling:**
  - [ ] All pages match FinCast design
  - [ ] Consistent sidebar, topbar, spacing

**Definition of done:** All 4 pages load, display data from API, styled per design spec, fully functional.

---

### Phase 7: LLM Integration ⏳
**Goal:** Connect OpenAI to generate financial advice from model outputs.
**Estimated time:** 5–7 days
**Dependency:** Phase 6 complete

**Checklist:**

- [ ] **Advice service:**
  - [ ] `src/services/advice.service.ts` with `generateAdvice()` function
  - [ ] Takes: forecasts, anomalies, business context (name, type, revenue)
  - [ ] Crafts prompt for GPT-4 (or gpt-4o-mini)
  - [ ] Calls OpenAI API with streaming (SSE)
  - [ ] Stores response in advice table
  - [ ] Returns markdown text
- [ ] **API endpoint:**
  - [ ] `GET /api/advice?business_id=<id>` (with SSE streaming)
  - [ ] Client connects to EventSource, receives advice chunks in real-time
  - [ ] Falls back to non-streaming if SSE not available
- [ ] **Mock mode:**
  - [ ] When `MAHAKAM_AI_MODE=mock`: return static advice instead of calling OpenAI
  - [ ] Useful for development without spending API credits
- [ ] **Frontend:**
  - [ ] Advice cards render as advice is streamed in
  - [ ] Loading state (skeleton or spinner) while streaming
  - [ ] Display priority badges (HIGH / MED / LOW)
- [ ] **Prompt engineering:**
  - [ ] Test different prompts with real and mock data
  - [ ] Ensure advice is actionable and specific
  - [ ] Handle edge cases (no anomalies, very healthy business, etc.)

**Definition of done:** `GET /api/advice` returns LLM-generated advice, streams to frontend, displays in dashboard.

---

### Phase 8: Testing, Hardening & Polish ⏳
**Goal:** Add tests, security checks, documentation, prepare for "production."
**Estimated time:** 8–12 days
**Dependency:** Phase 7 complete

**Checklist:**

- [ ] **Backend tests:**
  - [ ] Unit tests for all services (auth, forecast, anomaly, advice, transaction)
  - [ ] Each test: happy path + error cases
  - [ ] Use `vitest` + `supertest` for route testing
  - [ ] Run: `npm run test` → all pass
- [ ] **Python tests:**
  - [ ] Unit tests for model training (verify shapes, outputs)
  - [ ] Test data generation (verify anomalies present)
  - [ ] Backtesting (verify model accuracy on held-out data)
  - [ ] Run: `pytest` → all pass
- [ ] **Frontend tests (optional, low priority):**
  - [ ] Component snapshots for stat cards, charts
  - [ ] User interactions (login, filter, export)
- [ ] **Security audit:**
  - [ ] Verify all 9 layers implemented
  - [ ] Rate limiting tested (try exceeding limits)
  - [ ] JWT expiry tested (expired token rejected)
  - [ ] SQL injection attempt on transaction description (Prisma handles)
  - [ ] CORS: cross-origin request from evil.com blocked
  - [ ] CSP headers present in responses
  - [ ] Sensitive data (amounts, passwords) scrubbed from logs
- [ ] **Performance:**
  - [ ] Large transaction list (1000+ rows) loads in < 2s
  - [ ] Dashboard renders in < 3s
  - [ ] Chart zooming/panning smooth
  - [ ] API responses gzipped
- [ ] **Documentation:**
  - [ ] `DEVELOPMENT.md` updated (how to run, common tasks)
  - [ ] `ARCHITECTURE.md` written (system design, data flow diagrams)
  - [ ] `API.md` written (all endpoints, request/response examples)
  - [ ] `MODELS.md` written (what the ML models do, how to retrain)
  - [ ] `DEPLOYMENT.md` written (how to deploy to Vercel + Railway)
- [ ] **Code cleanup:**
  - [ ] Linting: `npm run lint` passes (ESLint + TypeScript)
  - [ ] No console.logs, debuggers left in code
  - [ ] Unused imports removed
  - [ ] Type safety: zero `any`, all inference correct
- [ ] **Configuration:**
  - [ ] `.env.example` file created (template for developers)
  - [ ] `.env.production` template documented
  - [ ] GitHub Actions secrets added (API keys, DB URLs)
- [ ] **Final checks:**
  - [ ] All 4 pages load without errors
  - [ ] Can login, create/filter transactions, view forecasts
  - [ ] Can select different businesses
  - [ ] Export buttons work (CSV, PDF for reports)
  - [ ] LLM advice generates on demand
  - [ ] Demo mode works (no external API calls)

**Definition of done:** Project is production-grade. All tests pass. Security verified. Documentation complete. Ready for recruiter review.

---

## Current Status Summary

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1: Tooling | ⏳ Next | - | - |
| 2: Auth | 🔜 Queued | - | - |
| 3: Demo Data | 🔜 Queued | - | - |
| 4: ML Training | 🔜 Queued | - | - |
| 5: Dashboard | 🔜 Queued | - | - |
| 6: Pages | 🔜 Queued | - | - |
| 7: LLM | 🔜 Queued | - | - |
| 8: Testing | 🔜 Queued | - | - |

**Legend:** ✅ Done | ⏳ In progress | 🔜 Queued | ❌ Blocked

---

## Notes for Upcoming Sessions

**Handoff to Session 2 (Phase 1):**
- Start with GitHub repo creation
- Follow Phase 1 checklist step-by-step
- Use Learning Mode: write code, Claude reviews
- Test each section (client, server, DB, Python) before moving on
- Commit to git after each small milestone

**Things to remember:**
- Zod validation everywhere
- Result<T> pattern for all services
- Mock mode for all external services
- No `any` in TypeScript
- Business_id filter on every query

---

**Maintained by:** Kevin Mahendra
**Format:** Markdown checklist + session notes
**Update frequency:** After each session (new note at top)
