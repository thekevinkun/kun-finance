# Kun Finance

AI-powered cash flow forecasting for small businesses in Indonesia and Southeast Asia.

Part of the Kun Projects ecosystem (alongside Kundesk and Kun Bookshop), sharing a
design language, security philosophy, and the "KUN" AI assistant.

## What it does

- Predicts cash flow disruptions 30–90 days in advance
- Detects unusual transactions (anomaly detection)
- Generates actionable financial advice via a trained ML pipeline + LLM
- Bilingual: Indonesian (default) and English

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, next-intl |
| Backend | Express 5, TypeScript, Prisma 7.9.0 |
| Database | PostgreSQL (Supabase) |
| ML | Python 3.12, scikit-learn |
| Monorepo | npm workspaces |

See [`project-bible.md`](./project-bible.md) for full architecture, schema, and design decisions.

## Project Structure

```
kun-finance/
├── client/     # Next.js frontend
├── server/     # Express API backend
├── ml/         # Python ML pipeline
├── shared/     # Shared TypeScript types (Result<T>, etc.)
└── docs/       # project-bible.md, progress-tracker.md, ai-workflow.md
```

## Getting Started

See [`DEVELOPMENT.md`](./DEVELOPMENT.md) for full local setup instructions.

Quick start:

```bash
# Install all workspace dependencies (client + server + shared)
npm install

# Run the frontend (localhost:3000)
npm run dev --workspace=client

# Run the backend (localhost:5000)
npm run dev --workspace=server
```

## Status

Currently in active development (Phase 1: Tooling Foundation).
See [`progress-tracker.md`](./progress-tracker.md) for detailed phase-by-phase progress.

## License

Personal portfolio project. Not licensed for reuse.

## Maintainer

Kevin Mahendra
