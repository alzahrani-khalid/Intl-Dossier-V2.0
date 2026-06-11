---
phase: 260610-fkn
plan: 01
type: execute
status: complete
completed: 2026-06-10
commits:
  - 483b5ac5 # Task 1 — activity_stream actor-binding RLS + role backfill
  - 21f67834 # Task 2 — briefing-books escapeHtml + delete orphan ExportDialog
  - f802ea5d # Task 3 — role-source unification
  - e3e51688 # adversarial fix — briefing-books @page CSS XSS (headerText/footerText)
  - 561e9ab7 # adversarial fix — AccessibilitySettings hard-coded test token
  - ec38b7b6 # adversarial fix — guard contract-test mock routers out of production
requirements:
  - P2-SEC-ACTIVITY-RLS
  - P2-SEC-BRIEFING-XSS
  - P2-SEC-EXPORT-ORPHAN
  - P2-SEC-ROLE-SOURCE
---

# Summary — 260610-fkn P2 Security Pass (Phase 61 scope)

Four confirmed authz / XSS / dead-code liabilities closed on branch
`quick/260608-c9b-country-dossier-workflow-fixes`, each as its own atomic commit,
all verified against live staging (`zkrcjzdemdmwhearhfgg`).

## What shipped

### 1. activity_stream actor-binding RLS + role backfill — `483b5ac5` (P2-SEC-ACTIVITY-RLS)

- Migration `20260610120000_activity_stream_actor_binding_and_role_backfill.sql`
  **committed + applied to staging**.
- INSERT policy swapped: `activity_stream_insert_authenticated`
  (`WITH CHECK auth.role()='authenticated'`, spoofable) →
  `activity_stream_insert_own_actor` (`WITH CHECK actor_id = auth.uid()`).
- Targeted backfill promoted **only the 1 metadata-admin** into `public.users.role`;
  defensive `REVOKE ALL ON public.activity_stream FROM anon`.

**Live probes (post-apply):**

- `pg_policy`: only INSERT policy is `activity_stream_insert_own_actor` WITH CHECK
  `(actor_id = auth.uid())`; old `_authenticated` policy gone. ✓
- `public.users.role` distribution: **392 viewer + 1 admin = 393** (exactly 1 admin). ✓

### 2. briefing-books XSS + orphan ExportDialog — `21f67834`

- **P2-SEC-BRIEFING-XSS:** added local `escapeHtml(s: unknown)` (escapes `& < > " '`)
  and wrapped **31** DB/user-string interpolations across `generateHTMLDocument`
  (cover, exec summary, entities, contacts, engagements, positions, MoUs,
  commitments, custom blocks, section titles). Dates/static i18n labels left unwrapped
  (safe). **Edge fn redeployed to staging** via `supabase functions deploy
briefing-books --use-api` (uploaded index.ts + \_shared/cors.ts, new version).
- **P2-SEC-EXPORT-ORPHAN:** deleted `frontend/src/components/export/ExportDialog.tsx`
  (hard-coded `Bearer test-auth-token`, **zero real importers** — the only matches
  were git-ignored `.understand-anything/` fingerprint JSON) and its now-empty dir.
  The real `components/export-import/ExportDialog.tsx` twin is untouched.

### 3. Role-source unification — `f802ea5d` (P2-SEC-ROLE-SOURCE)

`public.users.role` is now the single authorization truth; all trust in
client-writable auth metadata removed.

- **authStore:** dropped the `|| user_metadata?.role` fallback in `checkAuth` and
  `handleAuthStateChange` (`role = profile?.role ?? 'viewer'`); name/avatar display
  fallbacks kept.
- **New `frontend/src/lib/auth/requireAdmin.ts`:** shared TanStack `beforeLoad` guard
  reading `public.users.role`, accepting `admin` + `super_admin` (Sidebar parity),
  **fail-closed** (throws `Error('Admin access required')` on missing session, DB error,
  or non-admin role).
- **7 admin routes** (approvals, preview-layouts, ai-settings, ai-usage,
  field-permissions, data-retention, system) routed through `requireAdmin`; the
  now-orphaned `supabase` imports (preview-layouts, field-permissions, data-retention)
  and `redirect` import (field-permissions) removed.
- **`/users` and `/audit-logs`** (previously ungated beyond the `_protected` session
  wrapper) now gated with `requireAdmin`.
- **audit-logs-viewer edge fn** narrowed `['admin','editor','supervisor']` → `['admin']`
  and **redeployed to staging** (compliance trail now matches the admin-only nav).

## Probed facts (per plan <output>)

- **Live `users.role` taxonomy:** column type is **`text`** with **no CHECK / no enum**
  (the three historical migration definitions never reconciled). Any string is
  storable, so `'supervisor'` _would_ have been accepted.
- **Supervisor promotion:** despite the column accepting it, the backfill stayed
  **conservative** — promoted only the 1 admin; the supervisor account remains
  `viewer` pending a product decision on role mapping (live count: 0 supervisor).
- **briefing-books deploy:** redeployed (CLI `--use-api`), new version live.
- **audit-logs-viewer redeploy:** yes — narrowed to `['admin']`, redeployed.
- **A2 re-grep:** no direct-client `activity_stream` INSERT exists in app code; the only
  producer is `log_activity()` (SECURITY DEFINER, binds `actor_id := auth.uid()`) plus
  the service-role seed — both exempt from the new policy. Non-breaking confirmed.

## Adversarial verification — 3 extra findings closed

A 5-agent adversarial workflow (4 refutation lenses + completeness critic) plus a
second re-verification round drove the pass past the literal plan scope. authz and RLS
were independently **could-not-refute** (solid); the XSS and dead-code lenses **refuted**
closure and surfaced three real residuals, all now fixed:

1. **briefing-books @page CSS XSS — `e3e51688`.** The body-level wrap missed two sinks in
   the `<style>` block: `config.headerText` (l.704) and `config.footerText` (l.718) were
   interpolated unescaped into `content:"…"` CSS declarations. A `";}</style><script>…`
   payload broke out (the HTML parser ends `<style>` at a literal `</style>` regardless of
   CSS string context). Wrapped both with `escapeHtml` (strips `< > "` → closes both the
   `</style>` and CSS-string breakouts; entities don't decode in raw-text). Edge fn
   redeployed. Re-verified **closed** (full re-scan: zero remaining unescaped DB/user sinks).
2. **AccessibilitySettings hard-coded token — `561e9ab7`.** A _second_ `Bearer
test-auth-token` lived in a routed, production-reachable component
   (`/accessibility` → `AccessibilitySettings.tsx`) — worse than the dead ExportDialog.
   Now sources the real session token via `supabase.auth.getSession()`. (The component is
   a vestigial stub hitting a non-existent endpoint; route deletion is a noted follow-up.)
3. **Contract-test mock routers mounted in production — `ec38b7b6`.** The _same_
   `test-auth-token` was a LIVE admin gate: `backend/src/api/contract/helpers.ts`
   `isAdminToken(t)===' test-auth-token'` gated six contract mock routers
   (`/audit`,`/export`,`/mfa`,`/monitoring`,`/analytics`,`/accessibility`) mounted
   **unconditionally** in `src/index.ts`, while `docker-compose.prod.yml` runs the backend
   with `NODE_ENV=production`. The routers return **in-memory mock data only** (no real DB),
   so no real data was exposed, but a fixed-token admin surface on the deployed backend is
   precisely this pass's liability class. Now mounted only when `NODE_ENV !== 'production'`.
   Contract tests run against a non-production `localhost:5001` server (and aren't in any CI
   workflow), so they're unaffected. Backend `tsc --noEmit` + esbuild build green.

Final sweep: **zero production-reachable hard-coded auth tokens** remain (the two
`helpers.ts` literals are contract-test fixtures, now reachable only outside production).

## Verification

- `tsc --noEmit` (frontend): **exit 0** (clean).
- `pnpm --filter intake-frontend build`: **exit 0** (built in ~11s).
- Grep gates: zero `user_metadata.role`/`app_metadata.role` authorization reads remain;
  `beforeLoad: requireAdmin` present on all 9 routes; audit-logs-viewer = `['admin']`;
  no orphaned `supabase`/`redirect` imports.
- `routeTree.gen.ts` intentionally never staged (regenerated locally only).
- Out-of-scope cosmetic reformat of `escalations-report/index.ts` (stray Prettier
  semicolon-stripping) was reverted to keep the security commits surgical.

## Out of scope / follow-ups

- **R15/R16:** `create-user` / `assign-role` edge fns still _write_ `user_metadata.role`.
  Harmless now that nothing _reads_ it for authz, but a future cleanup could stop writing
  it (or document it as display-only). Not a live hole.
- **Supervisor role mapping** (A1) is a product decision, deliberately deferred.
- **Browser UAT** (admin sees gated routes / viewer blocked, LTR + RTL) is the remaining
  human-verify checkpoint.
