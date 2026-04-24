## Plan 38-08 deferred items

- WeekAhead.test.tsx (6 failing tests) — pre-existing failures NOT caused by 38-08. Out of scope.

## Deferred from 38-06 VipVisits (VIP-PERSON-ISO-JOIN)

- **Future:** Extend `get_upcoming_events` RPC (or add a new `get_vip_visits` RPC) to project `person_iso` (ISO2 country code) and `person_role` for each VIP row. Current hook returns `personFlag: undefined`, so `DossierGlyph` falls back to name-initials. Constraint from user checkpoint: "no new DB migrations" this wave — hence deferred.
  - Swap point: `frontend/src/hooks/useVipVisits.ts::toVipVisit` (single location).
  - Acceptance test: once migrated, the existing DossierGlyph rendering path will upgrade from initials → real flag with zero widget changes.

## Deferred from 38-04 Digest

- **Future:** Create `intelligence_digest` table + RLS + service + `useIntelligenceDigest` hook to replace `useActivityFeed`. Current Digest shows internal activity, not external intel signals. Deferred per user decision 2026-04-25.
  - Semantic compromise accepted: `source = actor_name` reads as internal user, not a publication/news outlet (e.g., "Reuters", "Al Sharq" as mocked in the handoff). The correct long-term shape is an `intelligence_digest` row with `(tag, headline, source_publication, published_at, external_url)`.
  - Migration path: once the dedicated hook lands, swap the import in `frontend/src/pages/Dashboard/widgets/Digest.tsx` and update the field map; no widget layout/visual changes required.

## Deferred from 38-09 — Dashboard E2E + visual baselines

### DASH-VISUAL-BLOCKED — visual-regression baselines could not be auto-seeded

- **Status:** BLOCKED-STRATEGY (not a code defect).
- **Reason:** Seeding 8 baselines via `playwright test --update-snapshots` requires:
  1. A running dev server (`pnpm dev` on :5173) — not started in this worktree.
  2. A `.env.test` with `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` for `loginAndWaitForDashboard()` — file is gitignored and absent from this worktree.
  3. Real Supabase auth + dashboard data (the spec navigates to `/dashboard` after login).
- **Spec is committed and ready** — `frontend/tests/e2e/dashboard-visual.spec.ts` ships the 8-snapshot matrix (`[ltr,rtl] × [light,dark] × [768,1280]`) with `freezeForSnapshot()` flake controls and inherits `maxDiffPixelRatio: 0.01` from `frontend/playwright.config.ts`.
- **Seeding command (operator runs once):**
  ```bash
  cp .env.test.example .env.test            # then fill TEST_USER_* values
  pnpm dev                                   # leave running on :5173 in another shell
  cd frontend && pnpm exec playwright test dashboard-visual --update-snapshots --project=chromium
  git add frontend/tests/e2e/__screenshots__ && git commit -m "test(38-09): seed dashboard visual baselines"
  ```
- **DASH-VISUAL-REVIEW** — once seeded, the 8 PNGs need a human eyeball pass against `reference/dashboard.png` per VALIDATION.md "Manual-Only" row before the baselines are trusted as the regression gate.

### DASH-COMPONENTS-DEAD — frontend/src/pages/Dashboard/components/ orphaned

- **Status:** dead code, compile-clean, NOT deleted in 38-09 to keep the deletion sweep surgical.
- 12 zone/widget files (AttentionZone, TimelineZone, EngagementsZone, ActivityFeed, ActionBar, AnalyticsWidget, QuickStatsBar, RoleSwitcher, etc.) plus `EngagementStageGroup.test.tsx` were composed exclusively by the deleted `OperationsHub.tsx`. After 38-09 they have ZERO importers (verified via `grep -rn "from '@/pages/Dashboard/components"` — no external hits).
- **Action item:** later cleanup pass should `rm -rf frontend/src/pages/Dashboard/components/`. Doing so will also free the `operations-hub.json` i18n namespace registration in `frontend/src/i18n/index.ts:181-182,301,405` (kept in 38-09 because these dead components still call `useTranslation('operations-hub')` at build time).
