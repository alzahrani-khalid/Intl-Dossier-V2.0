# Phase 88: Security & Hygiene Tail - Research

**Researched:** 2026-07-13
**Domain:** PostgREST filter injection, credential hygiene, Express 5 request mutation
**Confidence:** HIGH (all three work items verified directly against the live codebase and installed dependencies)

## Summary

Three small, mechanical items. (1) SEC-01: `UserPicker.handleSearch` interpolates raw user input into a supabase-js `.or()` filter string; PostgREST parses `,` `(` `)` as logic-tree syntax, so input containing them alters the query. `.or()` has no parameter binding — the correct fix is PostgREST double-quoting of the value (escape `\` and `"` inside), which is injection-proof AND preserves dot-in-email search. (2) SEC-02: the `.env.test.example` templates and gitignore rules already exist and are correct; test/CI code already reads `process.env.TEST_USER_PASSWORD`. The actual leak is the **real password value in 3 tracked doc/spec files** (plus the real email in a 4th) — verified by grepping tracked files for the live `.env.test` value. Since git history retains it, the password must be **rotated** in Supabase staging, not just scrubbed. (3) Hygiene: `backend/src/utils/validation.ts:45` assigns `req.query`, which Express 5.2.1 defines as a **getter-only prototype property** (verified: `Object.getOwnPropertyDescriptor(express.request,'query')` → `get: true, set: false`) — throws TypeError in strict mode → 500 on every `validate({ query })` route (17 routes, incl. elected-officials list).

**Primary recommendation:** Three surgical fixes — a shared `escapeIlikeSearch`-style helper + double-quoted `.or()` in UserPicker; rotate + scrub the leaked credential; `Object.defineProperty(req, 'query', …)` in the shared `validate()` helper.

## Architectural Responsibility Map

| Capability                       | Primary Tier                                         | Secondary Tier | Rationale                                                                                                                     |
| -------------------------------- | ---------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SEC-01 filter escaping           | Browser/Client (frontend `lib/` helper + UserPicker) | —              | The `.or()` string is built client-side in supabase-js; RLS still governs rows, but query-shape integrity is a client concern |
| SEC-02 credential scrub/rotation | Repo files + Supabase Auth (staging) + GH secrets    | CI workflows   | Secrets live in tracked docs, local `.env.test`, GH Actions secrets, and the Supabase auth user                               |
| Hygiene `req.query` fix          | API/Backend (`backend/src/utils/validation.ts`)      | —              | Single shared middleware factory; all 17 `validate({ query })` routes route through it                                        |

## Standard Stack

No new libraries needed. All fixes use what's installed.

### Core

| Library                          | Version           | Purpose                       | Why Standard                                                                                                       |
| -------------------------------- | ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| @supabase/supabase-js (frontend) | already installed | `.or()` / `.ilike()` builders | Existing data path; fix is string-escaping only [VERIFIED: codebase]                                               |
| express                          | 5.2.1 (backend)   | `req.query` getter semantics  | `backend/package.json` `^5.2.1`; getter-only verified against installed source [VERIFIED: node_modules inspection] |
| zod                              | already installed | validation schemas            | Existing `validate()` factory pattern per `backend/CLAUDE.md` [VERIFIED: codebase]                                 |
| vitest                           | already installed | unit tests both workspaces    | `pnpm test` = vitest in backend and frontend [VERIFIED: package.json]                                              |

### Alternatives Considered

| Instead of                             | Could Use                                          | Tradeoff                                                                                                                             |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `.or()` + double-quoted values         | Strip `,().:"` from input                          | Simpler, satisfies the success criterion literally — but breaks searching emails containing `.` (e.g. "john.doe"), a real regression |
| `.or()` + double-quoted values         | Two separate `.ilike()` queries merged client-side | Structurally injection-free but 2 round-trips + dedupe/merge code; overkill                                                          |
| `Object.defineProperty(req,'query',…)` | Store parsed result on `req.validatedQuery`        | Requires editing all 17 downstream handlers that read `req.query` — larger diff, same outcome                                        |

## Package Legitimacy Audit

No new packages are installed by this phase — audit not applicable. **Packages removed: none. Packages flagged: none.**

## Architecture Patterns

### SEC-01: The injection surface and the fix

**Surface** — `frontend/src/components/forms/UserPicker.tsx:86`:

```ts
.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
```

supabase-js `.or()` passes the string as raw PostgREST logic-tree syntax with **no escaping and no parameter binding** [CITED: supabase.com/docs/reference/javascript/using-filters — "filters are used as-is and need to follow PostgREST syntax… make sure it's properly sanitized"]. In logic-tree values, PostgREST reserves `,` `.` `:` `(` `)`; a value containing them must be surrounded by double quotes, and inside quotes `"` is escaped `\"` and `\` as `\\` [CITED: docs.postgrest.org/en/v12/references/api/url_grammar.html]. Input like `x,email.eq.` splices a new condition into the `or=` tree.

**Fix (recommended)** — a small pure helper, then quote the whole pattern:

```ts
// frontend/src/lib/postgrest-escape.ts (new, ~10 lines)
// Wraps a value in PostgREST double quotes so reserved chars , . : ( ) are literal.
export const quotePostgrestValue = (value: string): string =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

// UserPicker.tsx:86 becomes:
const pattern = quotePostgrestValue(`%${query}%`)
// …then in the query chain:
//   .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
```

The quotes are PostgREST grammar only — they are stripped before the SQL `ilike`, so the `%…%` wildcards still work and dots in emails still match. Community-verified pattern: quoting `id.eq."${v}"` makes `0,x.gte.1` a literal value [CITED: github.com/orgs/supabase/discussions/3843, github.com/supabase/postgrest-js/issues/164].

Optionally also neutralize user-typed LIKE wildcards (`%`, `_`, `*`) — they can only broaden matches, not alter query shape; for a user-search box this is a taste call, not a security requirement. If done: `query.replace(/[%_*]/g, '\\$&')` before wrapping.

**Sibling surfaces (flag, not in SEC-01 scope):** the same `.or(\`…ilike.%${input}%…\`)`interpolation exists in`useCountries.ts:76`, `useOrganizations.ts:69`, `useWorkingGroups.ts:95`, `EventsPage.tsx:272`, `commitments.service.ts:91`(their`safeSearch`is only a length cap, NOT escaping — verified). The other`.or()` sites interpolate internal UUIDs (`dossierId`, `userData.id`), not user input — safe. Since the helper exists after SEC-01, sweeping the 5 user-input siblings is ~5 one-line edits; recommend including them in the same plan as a cheap hardening task, or explicitly deferring with a note.

### SEC-02: Credential hygiene — what's actually leaked

Verified state (grep of tracked files against the live `.env.test` values, values never printed):

| Finding                                                | Status                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.test` / `backend/.env.test` git-tracked?         | **No** — only `.example` files tracked; `.gitignore:24` `.env.*` + `!.env.*.example` [VERIFIED: git ls-files]                                                                                                                           |
| `.env.test.example` templates exist with placeholders? | **Yes**, both root and backend, well-commented [VERIFIED: file read]                                                                                                                                                                    |
| Test code reads env vars (not literals)?               | **Yes** — all ~40 spec/test files use `process.env.TEST_USER_PASSWORD` [VERIFIED: grep]                                                                                                                                                 |
| CI provides secrets?                                   | **Yes** — `ci.yml` maps `secrets.E2E_ANALYST_PASSWORD` etc. → `TEST_USER_PASSWORD`; `e2e.yml` maps `E2E_ADMIN/ANALYST/INTAKE` [VERIFIED: workflow read]                                                                                 |
| **Real password value in tracked files**               | **3 files**: `.archive/implementation-reports/FRONT_DOOR_INTAKE_FINAL_STATUS.md`, `specs/020-complete-the-development/contracts/auth-api.yaml`, `specs/021-apply-gusto-design/quickstart.md` [VERIFIED: git grep -F against live value] |
| **Real email value in tracked files**                  | Same 3 + `docker/anythingllm/DEBUGGING_AUTO_GENERATION.md` [VERIFIED: same method]                                                                                                                                                      |

**Pattern:** because the value is in git history (not just the working tree), scrubbing the 3 files is insufficient — the requirement's "rotated **or** externalized" resolves to **rotate**:

1. Scrub the 3 files: replace the literal password with `$TEST_USER_PASSWORD` / `<see .env.test>` (email may stay — it's an identifier, but replacing with `$TEST_USER_EMAIL` is cleaner and cheap; do the docker doc too).
2. Rotate the staging test user's password via Supabase (staging project `zkrcjzdemdmwhearhfgg`) — admin API `supabaseAdmin.auth.admin.updateUserById(id, { password })` or dashboard. **Requires a human/checkpoint**: pick the new value, update local `.env.test`, and update any GH Actions secret backed by the same account (`E2E_ANALYST_PASSWORD` / `E2E_ADMIN_PASSWORD` — whether those secrets hold this same account's password is not readable from the repo; must be confirmed by the operator). [ASSUMED: which GH secrets map to the leaked account]
3. Re-verify login paths: run one Playwright login spec locally + confirm `frontend/playwright.config.ts:28` loads root `.env.test` (verified it does via `dotenv.config`).
4. Guard against re-leak: `git grep` for the OLD value must return nothing outside git history; optionally note the old value is dead after rotation so history exposure is inert.

**Secondary literals found (decide, don't silently fix):**

- `backend/tests/contract/*.test.ts` use `process.env.TEST_USER_PASSWORD || 'testpassword123'` — a fake fallback, not a secret; recommend dropping the fallback so misconfigured runs fail loudly rather than silently probing a wrong password. LOW priority.
- `Test123!@#` (8 old e2e specs: ai-extraction, assignment-queue-management, log-after-action, manual-assignment-override, publish-\*, sla-countdown-display) and `TestPassword123!@#OrgA/B` (`tests/security/org-isolation.test.ts`) — hardcoded passwords for **seeded fixture accounts** from old spec-kit flows. These are TEST_USER_PASSWORD-class only if those accounts exist in staging with those passwords. [ASSUMED: fixture accounts stale/nonexistent] Recommend: planner includes a decision task — externalize to env vars, or record them as dead-spec fixtures for Phase 89's e2e burn-down.

### Hygiene: Express 5 `req.query` getter

**Root cause verified:** installed `express@5.2.1` — `backend/node_modules/express/lib/request.js:217` `defineGetter(req, 'query', …)` and `Object.getOwnPropertyDescriptor(express.request, 'query')` → `{ get: fn, set: undefined }`. TypeScript compiles strict → assignment at `validation.ts:45` throws `TypeError: Cannot set property query`, caught by the catch block's `next(error)` → generic 500. This breaks **all 17 routes** using `validate({ query })`, not just elected-officials: after-action, cache-metrics, contacts, countries, commitments, entity-search, elected-officials, events, mous, organizations, permissions (x3), positions (x2), tasks. (They read `req.query` downstream — e.g. `elected-officials.ts:118` destructures it — so the fix must keep `req.query` returning the parsed value.)

**`req.params` and `req.body` are NOT affected:** in Express 5 the router sets `req.params` as a plain own property and body-parser sets `req.body` as a plain own property — plain assignment works. The `as any` on line 50 is cosmetic. Fix line 44–46 only; leave 40/50 alone (surgical-changes rule).

**Fix (one place, all 17 routes):**

```ts
// backend/src/utils/validation.ts:43-46
if (schema.query) {
  const result = await schema.query.parseAsync(req.query)
  // Express 5: req.query is a getter-only prototype property; shadow it per-request
  Object.defineProperty(req, 'query', {
    value: result,
    writable: true,
    enumerable: true,
    configurable: true,
  })
}
```

`middleware/validation.ts` only re-exports the utils version (verified) — no second copy to fix. Also grep confirmed no other `req.query =` assignment exists in `backend/src` [VERIFIED: git grep].

### Anti-Patterns to Avoid

- **Scrub-without-rotate:** removing the password from tracked files while it stays valid — git history keeps it exposed.
- **Sanitizing by stripping `.`:** kills dot-in-email search; quoting is strictly better.
- **Fixing only elected-officials:** the bug is in the shared helper; a route-local workaround leaves 16 siblings broken.
- **Adding `req.validatedQuery`:** forces edits in every downstream handler for zero benefit over `defineProperty`.

## Don't Hand-Roll

| Problem                  | Don't Build                    | Use Instead                                                             | Why                                                                                                    |
| ------------------------ | ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| PostgREST value escaping | Regex blocklist of "bad chars" | Double-quote + `\`/`"` escaping per PostgREST grammar                   | Blocklists miss cases and break legitimate input (dots in emails); quoting is the documented mechanism |
| Secret detection         | One-off greps forever          | The `git grep -F "<value>"` check as a scripted verify step in the plan | Repeatable, provable in verification                                                                   |

## Common Pitfalls

### Pitfall 1: Quoting only the user text, not the whole pattern

**What goes wrong:** `%"${escaped}"%` — quotes must wrap the ENTIRE value including the `%` wildcards, or PostgREST sees reserved chars outside quotes.
**How to avoid:** `quotePostgrestValue(\`%${query}%\`)` — wrap last.

### Pitfall 2: Breaking test auth during rotation ordering

**What goes wrong:** rotate the Supabase password before updating local `.env.test`/CI secrets → every e2e/browser flow 401s.
**How to avoid:** sequence in one checkpoint task: rotate → update `.env.test` → update GH secrets → run one login spec to confirm. Success criterion 3 explicitly requires no silently broken login paths.

### Pitfall 3: `defineProperty` without `enumerable: true`

**What goes wrong:** code that spreads or logs `req.query` (e.g. `logInfo('…', { filters: req.query })` in elected-officials) sees `{}` if the property is non-enumerable.
**How to avoid:** set `writable/enumerable/configurable: true` as in the snippet.

### Pitfall 4: Assuming the frontend fix needs a backend/RLS change

**What goes wrong:** scope creep. The `users` table read already passes RLS under the user's JWT; the injection alters _which rows the filter asks for_, not authorization.
**How to avoid:** SEC-01 is a 2-file frontend diff (helper + UserPicker).

## Code Examples

See Architecture Patterns above — both fixes are shown verbatim (UserPicker quoting, `defineProperty` in `validate()`). Both were derived from the live files at `frontend/src/components/forms/UserPicker.tsx:75-109` and `backend/src/utils/validation.ts:31-68`.

## State of the Art

| Old Approach                                          | Current Approach                                     | When Changed                | Impact                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| Express 4: `req.query` plain own property, assignable | Express 5: getter-only prototype property            | express 5.0 (repo on 5.2.1) | Any middleware assigning `req.query` throws; this is exactly the validation.ts bug |
| supabase-js `.or()` treated as safe builder           | Documented as raw PostgREST syntax, caller-sanitized | longstanding; docs explicit | All `.or()` string interpolation of user input is an injection surface             |

## Assumptions Log

| #   | Claim                                                                                                                                    | Section          | Risk if Wrong                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| A1  | GH Actions secrets `E2E_ANALYST_PASSWORD`/`E2E_ADMIN_PASSWORD` may hold the same leaked account's password and need updating on rotation | SEC-02           | CI e2e jobs fail auth after rotation; mitigated by the checkpoint task confirming with operator      |
| A2  | `Test123!@#` / org-isolation fixture accounts are stale or non-privileged staging seeds, not live secrets                                | SEC-02 secondary | If live, they're an unrotated credential class; planner includes a decide-task                       |
| A3  | Quoted `ilike."%x%"` patterns keep wildcard semantics on this PostgREST version                                                          | SEC-01           | Search returns exact-match only; caught immediately by the manual smoke (type 2 chars in UserPicker) |

## Open Questions

1. **Sweep the 5 sibling `.or()` user-input interpolations now or defer?**
   - What we know: same bug class, ~5 one-line edits once the helper exists; SEC-01 names only UserPicker.
   - Recommendation: include as one small hardening task in the same plan (cheap, closes the class) — planner's call; if deferred, record explicitly.

## Environment Availability

| Dependency                                | Required By             | Available                         | Version                      | Fallback                |
| ----------------------------------------- | ----------------------- | --------------------------------- | ---------------------------- | ----------------------- |
| Supabase staging (dashboard or MCP admin) | password rotation       | ✓ (MCP configured)                | project zkrcjzdemdmwhearhfgg | dashboard UI            |
| GH repo secrets access                    | CI secret update        | operator-only                     | —                            | checkpoint:human-verify |
| vitest (backend + frontend)               | tests                   | ✓                                 | installed                    | —                       |
| Playwright + `.env.test`                  | login-path verification | ✓ (config loads root `.env.test`) | installed                    | manual browser login    |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Framework          | Vitest (backend + frontend), Playwright (e2e)                                            |
| Config file        | `backend/vitest.config.ts`, `frontend/vitest.config.ts`, `frontend/playwright.config.ts` |
| Quick run command  | `pnpm --filter <ws> exec vitest run <file>`                                              |
| Full suite command | `pnpm test` per workspace (existing CI gates unchanged)                                  |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                                                       | Test Type                         | Automated Command                                                                                                                                             | File Exists? |
| ------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| SEC-01  | `quotePostgrestValue` neutralizes `,().:"\\` and preserves `%` wildcards + dots                                | unit                              | `cd frontend && pnpm exec vitest run src/lib/__tests__/postgrest-escape.test.ts`                                                                              | ❌ Wave 0    |
| SEC-01  | UserPicker search with `x,email.eq.` input yields a quoted filter (assert built string / mock supabase)        | unit                              | same file or `frontend/src/components/forms/__tests__/UserPicker.escape.test.tsx`                                                                             | ❌ Wave 0    |
| SEC-01  | Manual: typing `a,b(c)` into a UserPicker in the running app returns empty results, no PostgREST 400/injection | manual-only (network-shape check) | browser smoke                                                                                                                                                 | —            |
| SEC-02  | No tracked file contains the old OR new password value                                                         | scripted check                    | `git grep -cF "<value>" -- . ; test $? -eq 1` (value sourced from env, never committed to the plan)                                                           | command-only |
| SEC-02  | Login still works post-rotation                                                                                | e2e smoke                         | `cd frontend && pnpm exec playwright test tests/e2e/dashboard.spec.ts --project=chromium` (any login-gated spec)                                              | ✅ exists    |
| Hygiene | `validate({ query })` on Express 5 returns 200 + parsed query, not 500                                         | unit/integration                  | `cd backend && pnpm exec vitest run tests/unit/validate-middleware.test.ts` (new: real `express()` app + supertest + `validate({ query: paginationSchema })`) | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** the relevant new vitest file (`vitest run <file>`, <30s)
- **Per wave merge:** `pnpm --filter backend test` + `pnpm --filter frontend exec vitest run` scoped dirs
- **Phase gate:** existing required CI checks green (lint, typecheck, build, bundle-size) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/lib/__tests__/postgrest-escape.test.ts` — covers SEC-01 helper
- [ ] `backend/tests/unit/validate-middleware.test.ts` — covers the `req.query` fix (note: `backend/tests/unit/validation.test.ts` exists but tests unrelated theme/preference validators — don't reuse; check whether supertest is already a backend devDependency, else assert via direct middleware invocation on a real `express()` req)

## Security Domain

### Applicable ASVS Categories

| ASVS Category       | Applies               | Standard Control                                                       |
| ------------------- | --------------------- | ---------------------------------------------------------------------- |
| V2 Authentication   | yes (SEC-02)          | Supabase Auth; rotation via admin API; secrets in env/GH secrets only  |
| V5 Input Validation | yes (SEC-01, hygiene) | PostgREST value quoting (frontend); Zod `validate()` factory (backend) |
| V6 Cryptography     | no                    | —                                                                      |
| V14 Configuration   | yes (SEC-02)          | `.env.*` gitignored, `.example` templates tracked (already in place)   |

### Known Threat Patterns for this stack

| Pattern                                                  | STRIDE                                                               | Standard Mitigation                                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| PostgREST logic-tree injection via `.or()` interpolation | Tampering / Info disclosure (filter widening; RLS still bounds rows) | Double-quote values per PostgREST grammar; never interpolate unquoted user input into `.or()`/`.not()`/`.filter()` strings |
| Secret in tracked file + git history                     | Info disclosure                                                      | Rotate the credential; scrub working tree; verify with `git grep -F`                                                       |
| Middleware 500 masking (getter assignment)               | DoS (broken endpoints)                                               | Fix in shared helper; unit test pins Express 5 semantics                                                                   |

## Project Constraints (from CLAUDE.md)

- Zod (not express-validator) with the `validate()` factory is the backend validation pattern — the hygiene fix stays inside that helper. [backend/CLAUDE.md]
- Exposed secret found: never echo it — report location + recommend rotation (followed here: values referenced only by file path). [~/.claude/rules/core.md]
- Explicit return types, no `any`, strict-boolean ESLint — the new helper needs `(value: string): string`.
- No net-new UI; frontend files ~400-line norm — helper goes in `frontend/src/lib/` (kebab-case filename per ESLint dir rules).
- Schema changes via migrations only — none needed this phase.
- Both EN/AR must keep working — no UI/string changes involved; Arabic search input benefits from quoting (no chars stripped).

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                     | Research Support                                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-01 | UserPicker no longer interpolates user input into PostgREST filter strings — `.ilike()` builder or sanitized `,().` input       | Injection mechanics + verified quoting fix (Architecture Patterns / SEC-01); escape set confirmed against PostgREST v12 docs; sibling surfaces enumerated                                           |
| SEC-02 | No real secrets in tracked files; TEST_USER_PASSWORD-class values rotated or externalized; `.env.test.example` pattern enforced | Exact leak inventory (3 tracked files + 1 email file, verified by value-grep); rotation sequencing incl. CI secrets and login-path re-verification; templates/gitignore confirmed already compliant |

</phase_requirements>

## Sources

### Primary (HIGH confidence)

- Live codebase: `frontend/src/components/forms/UserPicker.tsx`, `backend/src/utils/validation.ts`, `backend/src/api/*.ts` (17 `validate({query})` callers), `.gitignore`, `git ls-files`, `.github/workflows/{ci,e2e}.yml`, `frontend/playwright.config.ts`
- Installed `express@5.2.1` source (`lib/request.js:217` `defineGetter(req,'query',…)`) + runtime descriptor check
- [PostgREST v12 URL grammar — reserved chars `,.:()` and double-quote/backslash escaping](https://docs.postgrest.org/en/v12/references/api/url_grammar.html)
- [supabase-js using-filters docs — `.or()` is raw PostgREST syntax, caller must sanitize](https://supabase.com/docs/reference/javascript/using-filters)

### Secondary (MEDIUM confidence)

- [supabase discussion #3843 — quoting values defeats `or=` splicing](https://github.com/orgs/supabase/discussions/3843)
- [postgrest-js issue #164 — special-character handling not automatic](https://github.com/supabase/postgrest-js/issues/164)
- [supabase discussion #19651 — comma-in-value search behavior](https://github.com/orgs/supabase/discussions/19651)

## Metadata

**Confidence breakdown:**

- SEC-01 fix mechanics: HIGH — escape grammar cited from PostgREST docs; surface read from source
- SEC-02 leak inventory: HIGH — value-grep against live `.env.test`; rotation-to-GH-secrets mapping MEDIUM (A1, operator-confirmed at checkpoint)
- Hygiene fix: HIGH — getter-only verified against the installed Express binary

**Research date:** 2026-07-13
**Valid until:** 2026-08-13 (stable domain; re-verify only if express or supabase-js majors bump)
