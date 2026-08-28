# Project Bible — Kun Finance Dashboard

> **Document Type:** Permanent reference. Rarely changes. Defines architecture decisions, database schema, design system, code patterns, and security model.
> **Last updated:** August 2026
> **Status:** Foundation locked. Ready for Phase 1 development.

---

## 1. Project Overview

**Kun Finance** is an AI-powered cash flow forecasting system for small businesses in Indonesia and Southeast Asia.

**Part of:** The Kun project ecosystem (sibling to Kundesk and Kun Bookshop). Shares design language, security philosophy, and "Kun" AI assistant.

**Core value:** Predict cash flow disruptions 30-90 days in advance. Detect unusual transactions. Generate actionable financial advice from trained ML models via KUN AI assistant.

**Target user:** Restaurant owners, salon operators, small trading businesses. People managing cash flow manually or via spreadsheets, stressed about surprise shortfalls. Default language: Indonesian (Bahasa Indonesia).

**Why built:** Portfolio project demonstrating full-stack ML integration + security practices + financial domain knowledge + bilingual web apps. Built during job application waiting periods.

---

## 2. Tech Stack (Final)

### Frontend
- **Framework:** Next.js 16 (App Router, Server Actions, SSE)
- **Language:** TypeScript (strict mode, zero `any`)
- **UI:** React 19
- **Styling:** Tailwind CSS v4, custom design tokens
- **Charts:** Chart.js 4.4
- **HTTP:** Axios
- **State:** Zustand (if needed, kept minimal)

### Backend
- **Runtime:** Node.js 20+
- **Server:** Express v5
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase, pooled connection + direct connection)
- **ORM:** Prisma 7.9.0 (pinned — see Known Constraints)
- **Validation:** Zod v4
- **Auth:** Custom JWT (email + password + refresh tokens)
- **Rate limiting:** Upstash Redis
- **Email:** Resend + React Email
- **Error tracking:** Sentry (optional, for production)

### Machine Learning
- **Language:** Python 3.12+
- **Package manager:** pip + virtual env
- **Forecasting model:** scikit-learn (Gradient Boosting Regressor)
- **Anomaly detection:** scikit-learn (Isolation Forest)
- **Embeddings/Vectorization:** scikit-learn preprocessing
- **Model serialization:** `.pkl` files (pickle)
- **LLM integration:** OpenAI API (gpt-4o-mini for advice generation)

### Infrastructure & Deployment
- **Database hosting:** Supabase (serverless PostgreSQL)
- **Frontend hosting:** Vercel
- **Backend hosting:** Railway
- **File storage:** Local (development) or AWS S3 (production-ready structure)
- **Cron jobs:** Vercel Cron (retraining, report generation)
- **CI/CD:** GitHub Actions (typecheck → lint → test → build)

### Testing
- **Unit/Component:** Vitest (Node.js backend)
- **Python models:** pytest + model validation tests
- **E2E:** Playwright (optional, for critical user flows)

### Internationalization (i18n)
- **Library:** next-intl (App Router native, TypeScript-friendly)
- **Languages:** Indonesian (ID, default) + English (EN)
- **Storage:** Middleware + httpOnly cookie (persists across sessions)
- **URL structure:** `/id/dashboard`, `/en/dashboard` (language in path)
- **Translation files:** JSON in `/public/locales/id/` and `/public/locales/en/`
- **Namespacing:** common.json (shared), dashboard.json, forecast.json, etc.
- **AI assistant name:** "KUN" (not translated, consistent across languages)

---

## 3. Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────┐
│                   NEXT.JS FRONTEND                       │
│                  (Vercel, React 19)                      │
│           Dashboard | Forecast | Transactions | Reports  │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP/SSE
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 EXPRESS API BACKEND                       │
│              (Railway, Node.js, TypeScript)              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Route Handlers                                       │ │
│  │ • /api/auth (JWT, refresh tokens)                  │ │
│  │ • /api/forecasts (query pre-computed predictions)  │ │
│  │ • /api/anomalies (query detected issues)           │ │
│  │ • /api/transactions (CRUD + filter)                │ │
│  │ • /api/advice (LLM-generated recommendations)      │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────┘
                         │ SQL
                         ▼
┌──────────────────────────────────────────────────────────┐
│          POSTGRESQL DATABASE (Neon)                      │
│   • transactions • forecasts • anomalies • users         │
│   • processed_webhooks • audit_log                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  PYTHON ML PIPELINE                       │
│              (Run locally or via GitHub Actions)         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 1. Load demo data (or real CSV)                    │ │
│  │ 2. Feature engineering                             │ │
│  │ 3. Train forecasting model (Gradient Boosting)     │ │
│  │ 4. Train anomaly detector (Isolation Forest)       │ │
│  │ 5. Generate predictions for next 30/60/90 days     │ │
│  │ 6. Detect anomalies in historical data             │ │
│  │ 7. Store predictions + anomalies in PostgreSQL     │ │
│  │ 8. Export models as .pkl files                     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Data Flow

**Training (offline):**
1. Python script loads historical transactions (12 months)
2. Feature engineering (date, day-of-week, is-payday, seasonality, etc.)
3. Models trained on 80%, validated on 10%, tested on 10%
4. Predictions generated for next 30/60/90 days
5. Anomalies detected on entire historical set
6. Results stored in PostgreSQL
7. Models exported as `.pkl` files, versioned in git or S3

**Runtime (online):**
1. User opens dashboard
2. Express API queries PostgreSQL for pre-computed forecasts
3. Returns JSON: date, predicted_cash, confidence_lower, confidence_upper
4. Frontend renders Chart.js line chart + anomaly list
5. For advice generation: API calls OpenAI with model outputs + business context
6. OpenAI generates markdown, streamed via SSE to frontend
7. Frontend renders advice cards

---

## 3.5 Internationalization Strategy

### File Structure
```
/public/locales/
├── id/
│   ├── common.json          (shared: buttons, nav, general UI)
│   ├── dashboard.json       (dashboard page strings)
│   ├── forecast.json        (forecast page strings)
│   ├── transactions.json    (transactions page strings)
│   ├── reports.json         (reports page strings)
│   └── errors.json          (error messages, validation)
└── en/
    ├── common.json
    ├── dashboard.json
    ├── forecast.json
    ├── transactions.json
    ├── reports.json
    └── errors.json
```

### Language Switching Flow
1. User clicks language toggle (ID ↔ EN)
2. Middleware updates language cookie
3. Next.js re-routes to new language path (e.g., `/id/dashboard` → `/en/dashboard`)
4. Page reloads with new locale
5. All strings rendered from `/public/locales/[lang]/` JSON files

### Default Language
- **Server-side:** Indonesian (ID)
- **User preference:** Stored in cookie, persists across sessions
- **Fallback:** If browser language is unsupported, default to ID

### API Responses
- **Error codes:** API returns code (e.g., `"FORECAST_LOAD_ERROR"`)
- **Translation:** Frontend translates code to user's language using `errors.json`
- **Rationale:** Backend agnostic to language, frontend handles display

### Example Translation Structure
**`/public/locales/id/common.json`:**
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "forecast": "Ramalan",
    "transactions": "Transaksi",
    "reports": "Laporan"
  },
  "buttons": {
    "login": "Masuk",
    "logout": "Keluar",
    "export": "Unduh",
    "filter": "Filter"
  },
  "ai_assistant": "KUN"
}
```

**`/public/locales/en/common.json`:**
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "forecast": "Forecast",
    "transactions": "Transactions",
    "reports": "Reports"
  },
  "buttons": {
    "login": "Login",
    "logout": "Logout",
    "export": "Download",
    "filter": "Filter"
  },
  "ai_assistant": "KUN"
}
```

### Usage in Components
```typescript
// Server Component
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  
  return (
    <h1>{t('title')}</h1>  // "Ringkasan Arus Kas" (ID) or "Cash Flow Overview" (EN)
  );
}

// Client Component
'use client';
import { useTranslations } from 'next-intl';

export function StatCard() {
  const t = useTranslations('common');
  
  return <button>{t('buttons.export')}</button>;  // "Unduh" or "Download"
}
```

### Testing i18n
- Verify routes work: visit `/id/dashboard` and `/en/dashboard`
- Verify strings load: check all namespaced JSON files have both ID + EN versions
- Verify switcher works: click language toggle, page re-renders with new language
- Verify persistence: refresh page, language preference persists

---

## 4. Database Schema

### Core Tables

```sql
-- Users (authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Businesses (demo or user-created)
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),  -- 'restaurant', 'salon', 'trading', etc.
  monthly_revenue DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'IDR',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Historical transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(100),  -- 'revenue', 'payroll', 'rent', 'supplier', etc.
  description TEXT,
  type VARCHAR(20),  -- 'income', 'expense'
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (business_id, date)
);

-- Pre-computed forecasts
CREATE TABLE forecasts (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_cash DECIMAL(12,2) NOT NULL,
  confidence_lower DECIMAL(12,2),
  confidence_upper DECIMAL(12,2),
  model_version VARCHAR(50),  -- e.g., 'gb_v1_2026-08-01'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (business_id, forecast_date),
  INDEX (business_id, forecast_date)
);

-- Detected anomalies
CREATE TABLE anomalies (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  anomaly_type VARCHAR(50),  -- 'high_outlier', 'new_vendor', 'duplicate', etc.
  severity VARCHAR(20),  -- 'low', 'medium', 'high'
  explanation TEXT,
  flagged_amount DECIMAL(12,2),
  detected_at TIMESTAMP DEFAULT NOW(),
  INDEX (business_id, severity)
);

-- LLM-generated advice
CREATE TABLE advice (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  advice_text TEXT NOT NULL,
  type VARCHAR(50),  -- 'forecast', 'anomaly', 'optimization'
  priority VARCHAR(20),  -- 'low', 'medium', 'high'
  generated_at TIMESTAMP DEFAULT NOW(),
  INDEX (business_id, priority)
);

-- Model metadata
CREATE TABLE model_metadata (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  model_type VARCHAR(50),  -- 'forecaster', 'anomaly_detector'
  algorithm VARCHAR(100),
  rmse DECIMAL(10,2),
  confidence_score DECIMAL(3,2),  -- 0.0 to 1.0
  trained_at TIMESTAMP,
  next_training TIMESTAMP
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),  -- 'viewed_forecast', 'downloaded_report', etc.
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (business_id, created_at)
);
```

### Key Constraints & Indexes
- All foreign keys cascade on delete
- `forecasts`: unique constraint on (business_id, forecast_date)
- `transactions`: index on (business_id, date) for range queries
- `anomalies`: index on (business_id, severity) for filtering by severity
- `audit_log`: index on (business_id, created_at) for timeline queries

---

## 5. Design System

### Color Palette
- **Background:** #f7f9fb
- **Surface:** #ffffff (white)
- **Ink:** #191c1e
- **Ink Muted:** #434655
- **Line:** #c3c6d7
- **Accent:** #004ac6
- **Warning:** #d97706 (amber)
- **Critical:** #ba1a1a (red)
- **Success:** #007d55 (green)

### Typography
- **Font:** Inter (system fallback: -apple-system, BlinkMacSystemFont, Segoe UI)
- **Monospace (numbers):** IBM Plex Mono or Courier Prime
- **H1 (Page title):** 24–28px, weight 700, letter-spacing -0.01em
- **H2 (Card title):** 16–18px, weight 600
- **Body text:** 14px, weight 400, line-height 1.5
- **Small text (labels):** 12px, weight 500
- **Stat value (big number):** 24–32px, weight 700, monospace

### Spacing & Layout
- **Sidebar width:** 200px (fixed)
- **Topbar height:** 56px (fixed)
- **Page padding:** 24px (all sides)
- **Card padding:** 16px (vertical), 20px (horizontal)
- **Gap between cards:** 16px
- **Gap between sections:** 24px
- **Border radius (cards):** 8px
- **Border radius (buttons):** 6px
- **Border radius (small elements):** 4px

### Shadows (minimal)
- Subtle: `0 1px 2px rgba(0,0,0,0.05)`
- Light: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Most cards: 1px border only, no shadow

### Components
- **Stat cards:** Number + label + sparkline + trend tag
- **Chart cards:** Title + subtitle + Chart.js canvas + legend
- **Anomaly/advice cards:** Severity dot + description + amount + badge
- **Table:** Minimal, no striping, hover row shift to #f8fafc
- **Buttons:** No shadow, subtle hover, no transform on click
- **Badges:** Rounded (100px), color-coded by category/severity

### Pages (4 main pages)
1. **Dashboard:** Overview (3-stat cards) + 12-month forecast chart + right sidebar (AI insights + alerts)
2. **Cash Flow Forecast:** Alert banner + large 30-day chart + anomalies + model stats cards below
3. **Transactions (Management):** Filters + searchable table with category badges + flag column
4. **Reports & Alerts:** Runway donut + system alerts + standard reports table

---

## 6. Security Model (9 Layers)

### Layer 1: Authentication
- JWT-based auth (email + password)
- Access token (15 min expiry) + refresh token (30 days)
- Refresh tokens stored in httpOnly, Secure, SameSite cookies
- Password hashed with bcrypt (10 rounds)

### Layer 2: Authorization (Tenant Isolation)
- Every query filters by `business_id` from authenticated user
- Ownership check: user can only access their own business data
- Pattern: `WHERE business_id = $1 AND user_id = $2`

### Layer 3: Input Validation
- All request bodies validated with Zod before processing
- Schema defined for: transactions, forecasts, auth payloads, filters
- Reject invalid: type mismatch, missing required fields, out-of-range values

### Layer 4: Rate Limiting
- Upstash Redis (sliding window algorithm)
- Auth routes: 5 attempts / 15 minutes per IP
- Forecast queries: 30 requests / minute per user
- Anomaly queries: 30 requests / minute per user
- CSV upload: 5 uploads / day per user

### Layer 5: SQL Injection Prevention
- Prisma parameterized queries (guaranteed by ORM)
- All user input treated as parameters, never interpolated into SQL

### Layer 6: Sensitive Data in Logs
- Winston logger scrubs: amounts, descriptions, passwords, tokens
- Patterns: `/\d{3}-\d{2}-\d{4}/, /Rp\s*[\d,]+/, /password/i`
- Sentry PII scrubbing enabled: redacts email, IP, CC numbers

### Layer 7: CORS & Security Headers
- Whitelist only production frontend domain
- CSP header: restrict scripts to same-origin only
- X-Frame-Options: DENY (prevent clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000

### Layer 8: Webhook Verification (Future)
- If integrating bank APIs: verify HMAC signatures
- Pattern: `HMAC-SHA256(payload, secret_key) === provided_signature`
- Idempotency: track processed webhook IDs in `processed_webhooks` table

### Layer 9: Audit Logging
- Every sensitive action logged: view forecast, download report, train model
- Audit table: user_id, business_id, action, timestamp, IP, user-agent
- Useful for: compliance, debugging, detecting unauthorized access

### Mock Mode System (Development)
Every external service supports mock mode via environment variable:

```
KUN_FINANCE_AI_MODE=mock|real           (OpenAI for advice)
KUN_FINANCE_TRAINING_MODE=mock|real     (Model training)
KUN_FINANCE_STORAGE_MODE=mock|real      (S3 file uploads)
KUN_FINANCE_ENCRYPTION_MODE=mock|real   (Encrypt amounts in transit)
```

**Mock mode behavior:**
- `KUN_FINANCE_AI_MODE=mock`: return static advice instead of calling OpenAI
- `KUN_FINANCE_TRAINING_MODE=mock`: generate synthetic predictions instead of training
- Other services: return success with dummy data, no external calls

**Benefits:**
- Build and test without spending money
- Faster development cycles (no API latency)
- Production-ready code (flip one env var, go live)

---

## 7. Code Patterns (Non-Negotiable)

### Service Layer
```typescript
// Every service function returns Result<T>
interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function getForecast(businessId: string, days: number): Promise<Result<Forecast[]>> {
  try {
    const forecasts = await db.forecast.findMany({
      where: { business_id: businessId },
      take: days,
      orderBy: { forecast_date: 'asc' }
    });
    return { ok: true, data: forecasts };
  } catch (err) {
    return { ok: false, error: 'Failed to fetch forecast' };
  }
}

// In route handler:
const result = await getForecast(businessId, 30);
if (!result.ok) return res.status(400).json({ error: result.error });
return res.json(result.data);
```

### File Organization
```
/server/src
  /api/routes
    /auth.ts          (login, register, refresh)
    /forecasts.ts     (GET predictions)
    /anomalies.ts     (GET detected issues)
    /transactions.ts  (GET, POST, PUT)
    /advice.ts        (GET generated advice)
  /services
    /forecast.service.ts      (business logic)
    /anomaly.service.ts
    /transaction.service.ts
    /auth.service.ts
  /middleware
    /authenticate.ts  (JWT validation)
    /authorize.ts     (business_id ownership check)
    /validate.ts      (Zod schema validation)
    /rateLimit.ts     (Upstash Redis)
  /models
    /User.ts          (Prisma schema references)
    /Forecast.ts
    /Transaction.ts
  /lib
    /db.ts            (Prisma client singleton)
    /logger.ts        (Winston with PII scrubbing)
    /jwt.ts           (sign/verify tokens)
  /validators
    /auth.ts          (Zod schemas)
    /forecast.ts
    /transaction.ts
```

### Naming Conventions
- **Files:** kebab-case (`forecast.service.ts`)
- **Exports:** PascalCase for classes/types, camelCase for functions
- **Database columns:** snake_case
- **Environment variables:** SCREAMING_SNAKE_CASE

### Error Handling
- No throwing to callers; always return Result<`T`>
- Log all errors with Winston (PII-scrubbed)
- Client receives: `{ ok: false, error: "User-friendly message" }`
- Internal: log full stack trace for debugging

### Database Queries
- Always include `business_id` filter (tenant isolation)
- Use indexes on frequently-filtered columns
- Prefer specific column selection over SELECT *
- Example:
  ```typescript
  const data = await db.forecast.findMany({
    where: {
      business_id: businessId,
      forecast_date: { gte: today, lte: endDate }
    },
    select: { forecast_date: true, predicted_cash: true, confidence_upper: true },
    orderBy: { forecast_date: 'asc' }
  });
  ```

### Frontend (Next.js)
- Page components: Server Components by default (no "use client")
- State needed? Extract to `"use client"` wrapper component
- Data fetching: Server Actions or direct API calls (axios)
- Error states: graceful fallback UI, not error boundaries
- Types defined in `/types` folder, never inline

---

## 8. Deployment & Environment

### Local Development
```bash
# Backend
npm run dev          # Express on localhost:5000

# Frontend
npm run dev          # Next.js on localhost:3000 (bilingual: /id/dashboard, /en/dashboard)

# Python ML
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python /ml/train.py --business demo_restaurant
python /ml/predict.py --business demo_restaurant
```

### Environment Variables
**Backend (.env):**
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:6543/kun_finance
DIRECT_URL=postgresql://user:pass@localhost:5432/kun_finance
JWT_SECRET=<64-char-random-string>

KUN_FINANCE_AI_MODE=mock
KUN_FINANCE_TRAINING_MODE=mock
KUN_FINANCE_STORAGE_MODE=mock

OPENAI_API_KEY=sk-...
SENTRY_DSN=https://...

CLIENT_URL=http://localhost:3000
API_URL=http://localhost:5000
```

**Frontend (.env):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  (if later added)
```

### Production Deployment (Vercel + Railway)
- Frontend: Vercel (auto-deploys from GitHub)
- Backend: Railway (Docker containers)
- Database: Neon PostgreSQL (serverless)
- Models: Stored in git (if < 10MB) or S3
- Cron: Vercel Cron for daily retraining

---

## 9. Known Constraints & Future Work

### Current MVP
- ✅ Pre-computed forecasts (no real-time retraining)
- ✅ Demo mode (synthetic data for all businesses)
- ✅ Single user per business
- ✅ No real money, no actual integrations

### Future Phases (Phase 7+)
- Real CSV upload + processing pipeline
- Multi-user per business (roles: owner, accountant, viewer)
- Bank API integration (auto-import transactions)
- Real Stripe/Midtrans payments (if monetizing)
- SMS/email notifications (send alerts to business owner)
- Mobile app (React Native)
- Multi-language support

### Technical Debt to Avoid
- Don't scatter business logic across routes (use services)
- Don't hardcode secrets (always use env vars)
- Don't skip validation (even if input seems safe)
- Don't mix authenticated + unauthenticated logic (separate routes)
- Don't store models in database (use .pkl files + S3)

### Tooling Notes
- Prisma pinned to 7.9.0. `prisma@latest` resolves to 8.0.0-rc.12 (Platform CLI beta) — 
  do not upgrade until 8.x is stable and documented.
  
---

## 10. Reference Documents

- **Design Spec:** See `ai-workflow.md` → Design System section (pages 1-4 detailed layouts)
- **Code Examples:** See `/mnt/project` folder for Kundesk patterns (same team, similar stack)
- **Security Model:** Kundesk's 11-layer model served as inspiration; this is 9 layers tailored to finance
- **Learning Mode:** See `ai-workflow.md` for how Claude assists during development

---

**Maintainer:** Kevin Mahendra
**Last reviewed:** August 2026
**Next review:** After Phase 1 complete (tooling setup)
