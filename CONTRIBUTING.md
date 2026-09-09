# Contributing / Git Workflow

Solo project, but disciplined workflow on purpose — this is interview-signal practice.

## Branching

- `master` is always deployable / never broken.
- One feature branch per task: `feature/<task-name>`
  - e.g. `feature/repo-setup`, `feature/auth-middleware`, `feature/forecast-chart`
- Open a PR into `master` even solo — forces you to review your own diff before merging.

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

## Full Workflow, Step by Step

This is the exact sequence every feature branch follows, start to finish:

1. **Branch:** `git checkout -b feature/<task-name>` — before writing any
   business logic, not after.
2. **Commit as you go:** small, working units per the Commit Cadence
   section above — not one giant commit at the end.
3. **Push and open a PR** into `master`, even solo. Title format matches
   commit format (`feat(scope): description`). Description in Markdown,
   covering: what changed, why (especially for non-obvious design
   decisions), how it was tested, and what's explicitly out of scope /
   deferred to a later PR.
4. **Let CI run.** Don't request review or merge until it's green.
5. **Let CodeRabbit review.** If it doesn't fire automatically, comment
   `@coderabbitai review` on the PR to trigger it manually.
6. **Address CodeRabbit's findings** — don't apply them blindly. Some are
   mechanical fixes (docstrings, config, naming); some are real design
   questions that need actual thinking before touching code (e.g.,
   whether a guard belongs in one function or two, what a fallback value
   should be). Treat CodeRabbit as a second reviewer whose comments are
   input, not instructions to execute verbatim.
7. **Re-push fixes to the same branch** — same PR updates, no new PR per
   fix.
8. **Merge once CI is green and CodeRabbit's findings are resolved** (or
   explicitly, deliberately dismissed with a reason).
9. **Clean up:** switch to `master`, pull, delete the feature branch both
   locally (`git branch -d`) and on the remote
   (`git push origin --delete`).

If work accidentally starts on `master` instead of a feature branch,
stop immediately, create the feature branch from the current
(uncommitted or unpushed) state, and continue there — don't let it ride
just because it already started wrong.
