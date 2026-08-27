# Contributing / Git Workflow

Solo project, but disciplined workflow on purpose — this is interview-signal practice.

## Branching

- `main` is always deployable / never broken.
- One feature branch per task: `feature/<task-name>`
  - e.g. `feature/repo-setup`, `feature/auth-middleware`, `feature/forecast-chart`
- Open a PR into `main` even solo — forces you to review your own diff before merging.

## Commit Messages

Format: `feat(scope): description` (or `fix(scope): ...`, `chore(scope): ...`)

```
feat(server): scaffold express entry point and healthcheck route
feat(client): add next-intl middleware and locale routing
chore(repo): initial monorepo structure
```

## Commit Cadence

Commit after each small, working unit — not after an entire phase:
- A single service written + tested
- A single route written + tested
- A single component built + verified
- A schema change migrated

## Pull Request Checklist

- [ ] Code follows patterns (`Result<T>`, Zod validation, business_id filtering)
- [ ] Tested manually
- [ ] TypeScript strict mode passes, no `any`
- [ ] Errors logged (PII-scrubbed)
- [ ] Progress tracker updated if a checklist item was completed
