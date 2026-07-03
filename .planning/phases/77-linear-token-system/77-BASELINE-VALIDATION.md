# Phase 77-01 — VERIFY-01 Pre-Swap Visual Baseline Validation

**Captured:** 2026-07-02 (this Mac — `-chromium-darwin` platform)
**Gate:** VERIFY-01 — the pre-swap (Bureau, default light) visual baseline that must
exist in git history BEFORE any `frontend/src/design-system/tokens/directions.ts`
literal changes in this phase. Re-comparison against Linear is **Phase 80's** job; no
re-compare is designed or run here.
**Status:** Capture complete + replay-reproducible. **AWAITING HUMAN REVIEW** — the
baseline commit (pinned specs + regenerated PNGs + this log) lands only after approval
(Task 3, `checkpoint:human-verify gate="blocking"`).

Task 1 (theme+locale pinning) is already committed: **`dfef0dd36437388c4c1a43ac7bad9c79dd25fcb0`**
(`test(77-01): pin theme+locale in visual specs`, 12 spec files, type-check green).

---

## 1. Pin-state audit (all 12 `tests/e2e/*-visual.spec.ts`)

Every spec now pins `id.theme` explicitly (via `page.addInitScript` seeding
`localStorage.setItem('id.theme', …)` before first paint) so the Phase-77 default flip
(light → dark) cannot silently change what Phase 80 re-compares (Pitfall 6). `id.dir` is
**not** pinned (post-swap coercion makes it meaningless — per plan). The grep gate
`grep -l "id.theme\|lng=" <12 specs> | wc -l` = **12**.

| #   | Spec                      | Committed PNGs | Locale pin (before)       | Theme pin (before)           | Fix applied                                                 | In baseline capture      |
| --- | ------------------------- | -------------- | ------------------------- | ---------------------------- | ----------------------------------------------------------- | ------------------------ |
| 1   | list-pages-visual         | 14             | ✅ `?lng=`                | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 2   | dashboard-widgets-visual  | 8              | ✅ EN via login           | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 3   | kanban-visual             | 4              | ✅ `?lng=`                | ❌ default light             | + `id.theme=light` (new beforeEach)                         | ✅                       |
| 4   | tasks-tab-visual          | 4              | ✅ `?lng=`                | ❌ default light             | + `id.theme=light` (new beforeEach)                         | ✅                       |
| 5   | tasks-page-visual         | 2              | ✅ fixture switchToArabic | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 6   | activity-page-visual      | 2              | ✅ fixture                | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 7   | after-actions-page-visual | 2              | ✅ fixture                | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 8   | briefs-page-visual        | 2              | ✅ fixture                | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 9   | settings-page-visual      | 3              | ✅ fixture                | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 10  | dossier-drawer-visual     | 2              | ✅ login-locale           | ❌ default light             | + `id.theme=light` (beforeEach)                             | ✅                       |
| 11  | **calendar-visual**       | **0 (stub)**   | ❌ dead `i18nextLng` key  | ❌                           | + `id.theme=light` + `id.locale` + `?lng=` (fixed dead key) | ❌ **excluded** (see §5) |
| 12  | **dashboard-visual**      | **0 (stub)**   | login-locale              | ⚠ legacy `theme` key + class | + `id.theme` via canonical key (per shot)                   | ❌ **excluded** (see §5) |

**Verification of the pin (`bootstrap.js:10` reads `id.theme || 'light'`):** current default
is light, so seeding `id.theme='light'` renders byte-identically to today's default — the
pin adds determinism, not a visual change. The 10 baselined specs regenerated with no
structural change (see §3); the diffs are dynamic content (dates/rows), not the theme.

`git diff --stat` for Task 1 showed only pinning additions across the 12 specs — no route,
viewport, or screenshot-name changes.

---

## 2. Staging seed refresh (Task 2a)

Idempotent, **dates only**, touching **only** the 3 deterministic `b0000002-*`
`engagement_dossiers` fixture rows (project `zkrcjzdemdmwhearhfgg`), mirroring the
canonical schedule in `supabase/seed/060-dashboard-demo.sql:205-216` and the 46-01
precedent ("today +2h, tomorrow +10h, +2d/+4d for the VIP visit"):

```sql
UPDATE engagement_dossiers SET
  start_date = date_trunc('hour', NOW()) + INTERVAL '2 hours',
  end_date   = date_trunc('hour', NOW()) + INTERVAL '4 hours'
WHERE id = 'b0000002-0000-0000-0000-000000000001';           -- today
UPDATE engagement_dossiers SET
  start_date = date_trunc('day', NOW()) + INTERVAL '1 day 10 hours',
  end_date   = date_trunc('day', NOW()) + INTERVAL '1 day 12 hours'
WHERE id = 'b0000002-0000-0000-0000-000000000002';           -- tomorrow
UPDATE engagement_dossiers SET
  start_date = date_trunc('day', NOW()) + INTERVAL '2 days 14 hours',
  end_date   = date_trunc('day', NOW()) + INTERVAL '4 days 16 hours'
WHERE id = 'b0000002-0000-0000-0000-000000000003';           -- +2d/+4d (VIP visit)
```

**Result (before → after):** rows were stale at `2026-05-08/09/10` (from the 46-01 capture);
refreshed to `2026-07-02 20:00`, `2026-07-03 10:00`, `2026-07-04 14:00 → 07-06 16:00`.

**Verification:** `SELECT * FROM get_upcoming_events(NULL, 14)` now returns the 3 refreshed
engagements (Bilateral consultation — ESCWA, Prep session — G20, Delegation visit —
Indonesia BPS) **including `Dr. Sari Widodo` with `person_iso='ID'`** — matching the exact
46-01 verification. WeekAhead + VipVisits render non-empty. No schema change, no deletes,
no other rows touched (mitigates T-77-01-01).

---

## 3. Regenerated-PNG inventory (Task 2b)

Captured locally with `E2E_BASE_URL` unset (Playwright auto-started `pnpm dev` on
:5173, `reuseExistingServer`) via `--update-snapshots`. **43 baseline PNGs across the 10
baselined specs** (42 changed + 1 byte-identical), all Bureau / default-light / EN+AR
where the spec already does both:

| Spec                      | Dir                                            | PNGs                   | Changed                            |
| ------------------------- | ---------------------------------------------- | ---------------------- | ---------------------------------- |
| list-pages-visual         | `list-pages-visual.spec.ts-snapshots/`         | 14 (7 pages × en/ar)   | 14                                 |
| dashboard-widgets-visual  | `__snapshots__/dashboard-widgets/`             | 8 widgets              | 7 (recent-dossiers byte-identical) |
| kanban-visual             | `kanban-visual.spec.ts-snapshots/`             | 4 (ltr/rtl × 1280/768) | 4                                  |
| tasks-tab-visual          | `tasks-tab-visual.spec.ts-snapshots/`          | 4 (ltr/rtl × 1280/768) | 4                                  |
| settings-page-visual      | `settings-page-visual.spec.ts-snapshots/`      | 3 (en/ar/mobile)       | 3                                  |
| activity-page-visual      | `activity-page-visual.spec.ts-snapshots/`      | 2 (en/ar)              | 2                                  |
| after-actions-page-visual | `after-actions-page-visual.spec.ts-snapshots/` | 2 (en/ar)              | 2                                  |
| briefs-page-visual        | `briefs-page-visual.spec.ts-snapshots/`        | 2 (en/ar)              | 2                                  |
| tasks-page-visual         | `tasks-page-visual.spec.ts-snapshots/`         | 2 (en/ar)              | 2                                  |
| dossier-drawer-visual     | `dossier-drawer-visual.spec.ts-snapshots/`     | 2 (ltr/ar @1280)       | 2                                  |
| **Total baselined**       |                                                | **43**                 | **42**                             |

All default-path PNGs are `-chromium-darwin`-named; the dashboard-widgets set uses the
project's custom `pathTemplate` (bare `<name>.png`, no platform suffix — it never had one)
and is force-added / git-tracked at `frontend/tests/e2e/__snapshots__/dashboard-widgets/`.

Untracked `test-results/` and `playwright-report/` are gitignored and will not be committed.

---

## 4. Replay proof — reproducible, NOT laundered (Task 2c)

Replayed the same 10 specs **without `--update-snapshots`** against the just-captured
baseline (the committed PNGs are the oracle):

```
pnpm -C frontend exec playwright test <10 visual specs> --retries=2
→ 43/43 tests pass (42 first-attempt + 1 shell-chrome flake absorbed on retry). Exit 0.
```

`--retries=2` is CI parity (`playwright.config.ts` sets `retries: 2` on CI). The single
flake (`tasks-tab rtl @ 768×1024`, a `fullPage` shot) is the **documented** app-shell
flicker class (notification-status pulse + sidebar avatar between renders — see the kanban
spec comment); it is transient shell chrome, not a baseline mismatch — a fresh 2-worker
replay of `briefs` + `tasks-tab` passed 6/6 clean. The captured PNGs are unchanged between
the update pass and the replay pass, so this is reproducibility, not laundering.

---

## 5. Coverage statement — EXPLICIT, no silent expansion (VERIFY-01)

- **Baseline = the existing 12-spec matrix as-is**, captured light-dominant (Bureau default
  light), EN+AR wherever a spec already does both. **No coverage was expanded** — per
  VERIFY-01, expansion is _called out_, not assumed.
- **Dark-mode coverage exists only via the `qa-sweep-focus-outline.spec.ts`
  focused-primitive shots** (8 direction×mode PNGs), which are **left untouched here** and
  are rewritten linear-only in plan 77-07. They count as pre-swap state as-is.
- **`tests/visual/theme-visual.spec.ts` is stale legacy** (references dead `gastat` /
  `blue-sky` themes) — **excluded**, left untouched.
- **`calendar-visual.spec.ts` and `dashboard-visual.spec.ts` are excluded** from the
  baseline capture as **non-baselined stubs** (same disposition as `theme-visual`):
  - Both have **0 committed PNG baselines** (git-verified); the research's "51 committed
    PNGs" = 43 baselined-spec PNGs + 8 qa-sweep, counting these two out.
  - `dashboard-visual.spec.ts` is a documented "Known Stubs / Deferred" scaffold (Phase 38)
    whose matrix is ltr/rtl × **light+dark** × 768/1280 — capturing it would newly baseline
    **dark shots**, directly contradicting "dark coverage only via qa-sweep." It also seeds
    theme via the legacy `theme` key + a post-load class flip, not the canonical `id.theme`.
  - `calendar-visual.spec.ts` pinned locale via the **dead `i18nextLng` key** (i18next reads
    `id.locale`), so its AR shots were never correct; it too has no committed baseline.
  - Both were **theme+locale-pinned in Task 1** for forward-compatibility (so a future plan
    can baseline them cleanly) but are **not captured/committed** in this gate.
- **Committed-PNG total is unchanged: 51** (43 regenerated baselined + 8 untouched
  qa-sweep). No PNG added or removed.

---

## 6. Deviations from plan (for human ratification at the checkpoint)

Two auto-fixes were required to produce a _valid, non-empty, git-tracked_ baseline; both are
included in the pending Task-3 baseline commit and are surfaced here for approval. A third
item is a scope interpretation (see §5).

**[Rule 3 — blocking] dashboard-widgets frozen clock realigned to the seed**

- File: `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` (`FROZEN_TIME`
  `2026-05-08T12:00:00Z` → `2026-07-02T12:00:00Z`).
- Why: `get_upcoming_events` filters server-side by real `NOW()` (today), while WeekAhead
  buckets client-side by the browser's frozen clock (today/tomorrow/this_week/next_week) and
  **drops** anything outside that window (`useUpcomingEvents.ts:32-46`). With the seed
  refreshed to today and the clock frozen 8 weeks in the past, WeekAhead rendered empty and
  `.week-row` never appeared → capture failed. Aligning the frozen clock to the today-anchored
  seed restores a non-empty WeekAhead. This is the exact class of blocker 46-01 fixed as a
  Rule-3 auto-fix (stale seed). Consequence: all 8 dashboard-widget PNGs re-render with
  today-relative dates (internally consistent; Phase 80 compares against this new baseline).
  _Latency note:_ this constant tracks the capture date; a future recapture must re-align it
  (inherent 46-era fragility, not introduced here).

**[Rule 3 — blocking] dashboard-widgets snapshot pathTemplate fixed**

- File: `frontend/playwright.config.ts` (`{testDir}/__snapshots__/…` →
  `{testDir}/{testFileDir}/__snapshots__/…`).
- Why: `testDir` was widened from `frontend/tests/e2e` to `frontend/tests` (for a11y
  discovery), which silently moved this custom template's output to
  `frontend/tests/__snapshots__/` (gitignored) and **orphaned** the committed baselines at
  `frontend/tests/e2e/__snapshots__/`. The spec's captures were writing to an ignored path,
  decoupled from git. `{testDir}/{testFileDir}` pins output back to the committed, tracked
  location. Blast radius: only the `chromium-dashboard-widgets` project (the sole user of
  this template). Verified: `--update-snapshots` now writes to
  `frontend/tests/e2e/__snapshots__/dashboard-widgets/` (7 `M` + 1 identical), and the
  replay reads them and passes.

**[Scope interpretation] calendar-visual + dashboard-visual excluded** — see §5. This keeps
the mandated coverage statement (light-dominant, dark only via qa-sweep, no expansion)
truthful; capturing dashboard-visual's dark shots would have made that statement false.
Flagged for the human: the plan's Task-2 verify command lists all 12 specs, but the
prescribed coverage statement is only internally consistent if these two stubs are excluded.

**Total deviations:** 2 Rule-3 auto-fixes + 1 documented scope interpretation.
**Impact:** dashboard-widgets is now a valid, tracked, reproducible part of the baseline
(the alternative was an empty/orphaned dashboard baseline). No other spec affected.

---

## 7. Files pending the Task-3 baseline commit (UNCOMMITTED — awaiting approval)

- 42 regenerated baseline PNGs (10 specs; paths in §3).
- `frontend/tests/e2e/dashboard-widgets-visual.spec.ts` — frozen-clock realignment (§6).
- `frontend/playwright.config.ts` — pathTemplate fix (§6).
- `.planning/phases/77-linear-token-system/77-BASELINE-VALIDATION.md` — this log.

(The 12 pinned specs themselves are already committed in `dfef0dd3`.)
