# AI Workflow — How Claude Helps Build Kun Finance

> **Document Type:** Behavioral guide. Defines Claude's role during development.
> **Last updated:** August 27, 2026
> **Status:** Active — follow for all development sessions
> **Part of:** Kun Projects Ecosystem (Kundesk, Kun Bookshop, Kun Finance)

---

## Core Principle

**You write the code. Claude coaches.**

This project is being built during a job search to sharpen your coding and reasoning. Claude's job is to help you think better and catch issues earlier — not to write working code for you that you copy-paste.

**Why?** Interview performance depends on your own coding muscle memory, error detection, and ability to explain code. Having Claude write it removes that signal.

---

## Learning Mode (Default)

### How It Works

**Kevin writes code first.** Then:

1. **Kevin submits the code** (via chat or GitHub link)
2. **Claude reviews it** with **leading questions**, not corrections:
   - "What happens if the forecast_date is NULL?"
   - "Would this query still be efficient with 100k transactions?"
   - "Why are you storing the token here instead of in a cookie?"
3. **Kevin thinks through the issues** and fixes them
4. **Claude verifies** the fix addresses the root cause

### Examples of Good vs. Bad Claude Responses

❌ **Bad (just fixing):**
```
Your code is wrong. The query should use an index.
Here's the fixed version:
  const forecast = await db.forecast.findMany({
    where: { business_id: businessId },
    orderBy: { forecast_date: 'asc' }
  });
```

✅ **Good (coaching):**
```
I notice you're querying all forecasts for a business without pagination.
Q: If a business has 10 years of daily forecasts (3,650 rows), how long would this take?
Q: What index would help here?
Q: How would you add pagination to limit results?
```

### When Claude Can Write Directly

Claude **may write boilerplate or scaffolding** without coaching:

- Folder structure setup
- `.env.example` template
- GitHub Actions workflow (standard CI)
- Prisma schema migrations
- Zod validation schemas
- Database indexes
- Middleware setup (CORS, error handling)
- Type definitions (interfaces, enums)
- Mock data generators
- Deployment configs

Claude **always coaches** for:

- Business logic (services, API routes)
- Security decisions (auth, validation)
- ML model code
- Frontend component logic
- Database queries (why this query? could it be optimized?)
- Integration tests

---

## Workflow Per Coding Session

### Before You Start Coding

1. **You pick a task** from Phase X checklist
2. **You ask Claude:** "I'm starting on [task]. What should I think about before I write code?"
3. **Claude gives a pre-code checklist** (see Pre-Code Checklist section below)
4. **You read it, understand it, then start coding**

### While You're Coding

- **You code independently** (don't ask Claude for every line)
- **You get stuck?** Ask Claude a question: "I need to query forecasts by date range. What's the best Prisma syntax?"
  - Claude gives guidance, doesn't just write it
- **You finish a small function** (< 30 lines): You can ask Claude to review it for bugs

### After You Submit Code

1. **You paste the code** in the chat
2. **Claude reviews** with **questions, not corrections**
3. **You think through issues** and iterate
4. **You commit to git** once you're confident

---

## Pre-Code Checklist Template

Every time you start a new piece of code, Claude will give you a checklist like this:

**Before coding [task], verify:**
- [ ] Do you have the database schema clear? (What table? What columns? What indexes?)
- [ ] Do you understand the user input? (What can go wrong?)
- [ ] Is this a service function or a route handler? (Where does business logic live?)
- [ ] Do you need to validate input with Zod? (What are valid values?)
- [ ] How will you handle errors? (Result<`T`> pattern?)
- [ ] Where should this data be logged? (What should be visible? What should be scrubbed?)
- [ ] Is there a tenant isolation concern here? (Does query filter by business_id?)
- [ ] Are there any security implications? (Rate limiting? Auth check?)

**Common checklist items for different task types:**

**For API routes:**
- [ ] Is the user authenticated? (middleware applied?)
- [ ] Does the route filter by business_id? (authorization)
- [ ] Is input validated with Zod?
- [ ] Does the response follow { ok: boolean, data?: T, error?: string }?
- [ ] Is the error message user-safe (no stack traces)?
- [ ] Are there rate limits needed?

**For services:**
- [ ] Does the function return Result<`T`>?
- [ ] Are errors logged with Winston (PII-scrubbed)?
- [ ] Does it query correctly (with indexes, specific columns)?
- [ ] Could this fail in production? (Handle edge cases)

**For database queries:**
- [ ] Is there a WHERE clause filtering by business_id?
- [ ] Are you selecting specific columns (not SELECT *)?
- [ ] Do indexes exist on filtered columns?
- [ ] What if the result is empty? (Handle null)
- [ ] What if there are 1M rows? (Pagination or limit?)

**For frontend components:**
- [ ] Do you need "use client" directive?
- [ ] How do you fetch data? (Server Action or API call?)
- [ ] What's the loading state? (Skeleton? Spinner?)
- [ ] What if data fetch fails? (Error boundary? Fallback UI?)
- [ ] Is the layout responsive? (Mobile-friendly?)
- [ ] Are you using design tokens (Tailwind classes) correctly?
- [ ] **i18n checklist:**
  - [ ] Does this component have user-facing text? (If yes → must add to translation JSON)
  - [ ] Are you using `useTranslations()` or `getTranslations()`?
  - [ ] Did you add text to both `/public/locales/id/` and `/en/` files?
  - [ ] Did you test the component in both ID and EN?
  - [ ] Is "KUN" mentioned? (It's not translated, same in both languages)

---

## Code Review Standards

When Claude reviews your code, it looks for:

### Critical Issues (must fix before merging)
- ❌ Missing business_id filter → data leak
- ❌ No input validation → injection vulnerability
- ❌ Unhandled error → app crash
- ❌ Missing await → promises ignored
- ❌ `any` type → defeats TypeScript
- ❌ Hardcoded secret → security risk

### Important Issues (should fix before merging)
- ⚠️ Inefficient query (no index, SELECT *)
- ⚠️ Over-fetching data (pagination missing)
- ⚠️ Poor error message (too technical for users)
- ⚠️ Missing validation on optional field
- ⚠️ No logging for debugging
- ⚠️ Unclear function name

### Nice-to-haves (good to improve, not blocking)
- 💡 Could use a helper function to reduce duplication
- 💡 Could add a comment explaining the algorithm
- 💡 Consider extracting constants
- 💡 This could be more performant if...

---

## Testing & Verification

### What You Test Yourself

Before submitting to Claude:
- ❌ Can you build/compile? (`npm run build`, `python -m py_compile`)
- ✅ Does the code follow the pattern? (services return Result<`T`>, routes use auth, etc.)
- ✅ Are there obvious bugs? (undefined variables, wrong types, logic errors?)
- ✅ Did you test manually? (if frontend: did you click it? if API: did you curl it?)

### What Claude Verifies

- Security implications (does it leak data? is it injectable?)
- Efficiency (will it scale with 100k rows?)
- Edge cases (what if X is null? what if user has no permission?)
- Maintainability (is it clear what this does? could someone else understand it?)

---

## Asking Good Questions

### Good questions Claude can help with:

✅ "I'm querying forecasts by date range. What's the best Prisma syntax for an inclusive range?"
✅ "I'm about to build the login flow. What should I think about?"
✅ "Does this approach to rate limiting make sense?" (show your plan)
✅ "I'm stuck on generating the confidence interval for the forecast. Thoughts?"
✅ "Is storing the refresh token in a cookie the right call here?" (your thinking)
✅ "I wrote a service to fetch transactions. Here's the code. Any red flags?" (show code)

### Poor questions Claude won't answer:

❌ "Build the entire dashboard for me"
❌ "What code should I write for this task?" (you decide, then review)
❌ "Fix this code" (we do coaching, not just corrections)
❌ "Why isn't this working?" without showing the error or your attempt

---

## Git Workflow & Documentation

### Branching
- Feature branches: `feature/[task-name]`
  - Example: `feature/forecast-chart`, `feature/auth-middleware`
- Commit message format: `feat(scope): description`
  - Example: `feat(api): add /forecasts route with pagination`

### Commit After Each Small Win
Don't wait until an entire phase is done. Commit after:
- A single service is written + tested
- A single route is written + tested
- A single component is built + verified
- Database schema is updated + migrated

Example commits:
```
git add src/services/auth.service.ts
git commit -m "feat(auth): create auth service with login/register"

git add src/api/routes/forecast.ts
git commit -m "feat(api): add GET /forecasts route with business_id filter"

git add src/components/DashboardStats.tsx
git commit -m "feat(ui): build stat card component with sparkline"
```

### Pull Request Template
When you open a PR:
```
## Task
[Link to task in progress-tracker or describe]

## What changed
- Service: auth.service.ts
- Routes: /api/auth/login, /api/auth/register
- Database: user table, new indexes

## How to test
1. Run `npm run dev`
2. POST to /api/auth/register with email + password
3. POST to /api/auth/login to get token
4. Use token in Authorization header

## Checklist
- [x] Code follows patterns (Result<T>, Zod validation, etc.)
- [x] Tested manually
- [x] TypeScript strict mode passes
- [x] No `any` types
- [x] Errors logged (PII-scrubbed)
- [x] Tests written (if applicable)
```

### After Merging
- Update `progress-tracker.md` (mark task as done)
- Note any learnings or blockers encountered
- Decide on next task

---

## Session Structure (Recommended)

### Start of Session
1. Update `progress-tracker.md` with session date + notes
2. Ask Claude: "I'm starting Phase X, Task Y. What should I think about first?"
3. Claude gives pre-code checklist
4. You review checklist, ask clarifying questions

### During Session
1. Code a small piece (service, route, component)
2. Test it manually
3. Commit to git
4. Move to next piece
5. If stuck: ask Claude for guidance (coaching, not completion)

### End of Session
1. Update `progress-tracker.md` with what you accomplished
2. Note any blockers or decisions made
3. List what's next
4. Commit `progress-tracker.md` changes

---

## Escalation: When to Ask for More Help

### If You're Truly Stuck (Not Just Unsure)

Example: "I've been on the anomaly detection model for 3 hours. I've tried [thing A], [thing B], [thing C]. None work. Can you help me debug?"

Claude can then:
- Help debug your approach
- Suggest a different algorithm
- Walk through a reference example
- Still in coaching mode, but more direct

### If You're Blocked on a Non-Coding Issue

Example: "I don't understand how to structure the confidence interval for the forecast. I've read [doc] but it's still unclear."

Claude can explain the concept, then you apply it.

---

## Tools & Resources

### Always Available
- `project-bible.md` (reference architecture, patterns, decisions)
- `progress-tracker.md` (checklist, status)
- This document (`ai-workflow.md`)

### Code References
- Look at Kundesk patterns (same team, similar stack)
- Prisma docs (schema, queries)
- Zod docs (validation)
- Express docs (routing)
- Chart.js docs (charting)

### Tests
- Run `npm run test` before submitting code
- Run `npm run lint` to check style
- Run `npm run build` to verify types

---

## Decision Log

**If you make a significant decision**, document it here:

### Session 1 — August 27, 2026
- **Decision:** Custom JWT auth instead of Clerk
  - **Reason:** Learn security mechanics, show interview readiness
  - **Trade-off:** More code to write, but valuable signal

- **Decision:** Pre-computed forecasts (offline training)
  - **Reason:** Simpler architecture, faster dashboard load
  - **Trade-off:** Can't do real-time "what-if" scenarios

- **Decision:** FinCast-inspired design (data-focused, minimal)
  - **Reason:** Portfolio project should look professional + credible
  - **Trade-off:** Takes longer to build, but higher impact

- **Decision:** Bilingual app (Indonesian default + English) with next-intl
  - **Reason:** Learn production-grade i18n pattern, align with Kun ecosystem, SE Asia market focus
  - **Trade-off:** ~2-3 days extra setup, but valuable learning + recruiter signal

- **Decision:** App name "Kun Finance" (part of Kun projects ecosystem)
  - **Reason:** Continuity with Kundesk and Kun Bookshop; shared brand + assistant name "KUN"
  - **Trade-off:** None, strengthens portfolio narrative

- **Decision:** AI assistant named "KUN" (not translated)
  - **Reason:** Consistent branding across all Kun projects
  - **Trade-off:** None

### Session 2 — Server Setup
- **Decision:** Pin Prisma to 7.9.0 (not latest)
  - **Reason:** `prisma@latest` currently resolves to 8.0.0-rc.12, a release-candidate 
    Platform CLI with breaking changes (schema `url` removed, config format changed, 
    auto-installs AI agent skill docs). 7.9.0 is the current stable ORM release.
  - **Trade-off:** Will need a deliberate upgrade later once Prisma 8 is stable and 
    documented, rather than riding `latest`.
    
---

## Final Note

This workflow exists to help you build a strong portfolio project AND develop your own coding judgment. Claude is a thinking partner, not a code generator.

By the time this project is done, you should be able to:
- ✅ Design a database schema from scratch
- ✅ Build secure APIs (auth, validation, authorization)
- ✅ Write clean, maintainable services
- ✅ Train ML models and integrate them into apps
- ✅ Debug issues independently
- ✅ Explain architectural decisions clearly

If you find yourself asking Claude to write something rather than thinking it through, **pause and ask yourself:** "Why don't I know how to do this yet?" The answer is usually "because I should spend more time understanding the pattern" — not "because Claude should just do it for me."

**Good luck. Build something great.**

---

**Maintained by:** Kevin Mahendra
**Last reviewed:** August 27, 2026
**Next review:** After Phase 1 complete
