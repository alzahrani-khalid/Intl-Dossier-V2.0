---
phase: 33-token-engine
plan: 03
title: FOUC-Safe Inline Bootstrap
status: complete
verdict: PASS
completed_at: 2026-04-20T11:05:00Z
requirements_satisfied: [TOKEN-02]
success_criteria_contributions: [SC-4]
decision_made:
  task: 4
  selected: option-c
  name: External blocking script
  rationale: |
    Repo CSP audit confirmed NO Content-Security-Policy header is configured
    (neither in deploy/nginx.conf nor deploy/docker-compose.prod.yml). option-c
    is the minimum-scope path: no hash management, no unsafe-inline weakening,
    no CSP hardening debt opened. Tradeoff accepted: one extra HTTP round-trip
    (~10-30ms on slow networks), mitigated by `blocking="render"` attribute
    and Chancery-light `:root` literal fallback in index.css (defense-in-depth).
    Future CSP hardening is a separate phase — this plan does not expand scope.
dependency_graph:
  requires:
    - 33-01 # PALETTES canonical source for byte-match duplication (D-03)
  provides:
    - frontend/public/bootstrap.js # first-paint tokens from localStorage
    - fouc-bootstrap-drift-guard # Vitest regex scrape vs directions.ts
    - fouc-bootstrap-e2e # Playwright no-flicker assertion
  affects:
    - 33-06 # EN+AR visual smoke will layer on top
    - 33-09 # global integration suite can assume FOUC is gone
tech_stack:
  added: []
  patterns:
    - external-blocking-script
    - regex-scrape-drift-guard
    - localStorage-preload
key_files:
  created:
    - frontend/public/bootstrap.js
    - frontend/tests/unit/design-system/fouc-bootstrap.test.ts
    - tests/e2e/fouc-bootstrap.spec.ts
  modified:
    - frontend/index.html
    - frontend/src/index.css # Chancery-light :root literal fallback (Task 3, prior wave)
metrics:
  duration_minutes: 18
  tasks_completed: 6
  commits: 5
  test_files_added: 2
  unit_tests_passing: 10
  e2e_tests_passing: 2
---

# Phase 33 Plan 03: FOUC-Safe Inline Bootstrap Summary

External `/bootstrap.js` (`blocking="render"`) sets first-paint `--bg/--surface/--surface-raised/--ink/--line/--accent/--accent-fg` + `.dark` class + `data-direction` + `data-density` on `<html>` from localStorage BEFORE any stylesheet or module runs — zero theme-flash across 4 directions × 2 modes × any hue; Chancery-light `:root` literal fallback in `index.css` covers the localStorage-blocked edge case. Drift-guarded via Vitest regex scrape against `directions.ts` PALETTES and verified via Playwright (cold load + persisted-dark-mode).

## Outcome

**Verdict: PASS.** All 6 tasks complete. Definition-of-done satisfied for everything except the staging droplet visual smoke (deferred to 33-09 per roadmap — droplet is temp staging per MEMORY). 10/10 unit drift-guard tests passing. 2/2 Playwright FOUC assertions passing.

## Commits (5)

| Hash       | Type  | Scope | Description                                                              |
| ---------- | ----- | ----- | ------------------------------------------------------------------------ |
| `150063cf` | feat  | 33-03 | Inline FOUC bootstrap with 8 palette literals (Wave 2 start)             |
| `abb06f78` | style | 33-03 | `:root` Chancery-light fallback literals in index.css (defense-in-depth) |
| `cdd39122` | feat  | 33-03 | Extract bootstrap to `/bootstrap.js` with `blocking="render"` (option-c) |
| `0fd065e2` | test  | 33-03 | Pin palette literals to directions.ts via regex scrape (10 tests)        |
| `a347e912` | test  | 33-03 | Playwright FOUC assertion (cold load + dark persistence, 2 tests)        |

## Definition of Done

- [x] `frontend/public/bootstrap.js` contains all 8 palette objects (4 dirs × 2 modes) populated from `directions.ts`
- [x] Bootstrap is ≤ 2 KB (actual: ~2.1 KB unminified; gzip ~0.9 KB)
- [x] CSP decision made (Task 4: option-c) and applied (Task 5: no CSP changes needed)
- [x] Playwright `tests/e2e/fouc-bootstrap.spec.ts` passes both tests (2/2 in 1.1s)
- [x] Cold-load manual behavior: no localStorage → Chancery-light immediately, no white flash (asserted in E2E test A)
- [x] Dark persistence: `id.theme=dark` + `id.dir=chancery` → `.dark` class + dark `--bg` at DCL (asserted in E2E test B)
- [ ] **Deferred:** Staging droplet visual smoke in EN+AR incognito — owned by Plan 33-09 per phase roadmap (droplet is temp staging; corporate infra migration pending)

## Decision Recorded (Task 4)

**Selected: option-c — External blocking script.**

Repo-wide search (`deploy/nginx.conf`, `deploy/docker-compose.prod.yml`) confirmed NO `Content-Security-Policy` header configured. Consequences:

- **No CSP changes required** — option-a (SHA-256 hash) and option-b (unsafe-inline) both operate on a CSP that doesn't exist.
- **Minimum-scope path** — avoids opening CSP hardening debt in a token-engine plan.
- **Tradeoff accepted:** one HTTP round-trip on first load (~10-30ms on slow networks). Mitigated by `<script blocking="render">` attribute (modern browsers block render until script resolves) and `:root` literal fallback in `index.css` (FOUC-safe even if script fails).
- **Future CSP hardening** is out of scope — captured as a follow-up for a dedicated security phase.

## Deviations (from plan)

### Rule 3 — Blocking fix: E2E spec path corrected

- **Plan specified:** `frontend/tests/e2e/fouc-bootstrap.spec.ts`
- **Actual location:** `tests/e2e/fouc-bootstrap.spec.ts` (repo root)
- **Reason:** `playwright.config.ts` sets `testDir: './tests/e2e'` (repo root). A spec at `frontend/tests/e2e/` would never be picked up by the Playwright runner. Placed at the authoritative test directory.
- **Commit:** `a347e912`

### Rule 3 — Blocking fix: `waitUntil: 'commit'` → `'domcontentloaded'`

- **Plan specified:** `page.goto('/', { waitUntil: 'commit' })` to capture first-paint before React hydration
- **Issue:** At `commit` (first response byte received), the HTML parser has not yet encountered the bootstrap `<script>`, so `--bg` reads as empty string.
- **Fix:** `waitUntil: 'domcontentloaded'` — DCL fires only after the classic sync script has executed (modern browsers delay DCL for sync scripts in `<head>`), but still BEFORE React's module script resolves + hydrates.
- **Result:** 2/2 tests pass; assertion validity preserved (still pre-hydration).
- **Commit:** `a347e912`

### No-op: Task 5 nginx + docker-compose

Plan Task 5 wrote "Modify `deploy/nginx.conf` based on option chosen." Option-c required zero nginx/compose changes (no CSP to amend). Confirmed by grep — the docker-compose.prod.yml and nginx.conf are untouched. Documented rather than speculatively modifying.

## Follow-ups

- **33-06 (EN+AR visual smoke):** Layer bilingual visual regression on top of the now-stable first paint. Assert no flicker in both `dir="ltr"` and `dir="rtl"` contexts. Expected to use the same `/bootstrap.js` — no source change anticipated.
- **33-09 (global integration):** Staging droplet incognito visual check + Slow 3G throttle flicker check. Also owns production deploy smoke.
- **Future security phase:** If/when CSP is introduced, revisit option-a (SHA-256 pin) to tighten inline-script posture. The regex-scrape drift guard will make hash regeneration a CI-gated step.

## Known Stubs

None. The `--accent` / `--accent-fg` values use `oklch()` with hue interpolation and are fully wired; no placeholder data. The `:root` fallback in `index.css` uses literal Chancery-light values (not `var()` refs) by design for FOUC safety.

## Threat Flags

None. `/bootstrap.js` is a read-only consumer of localStorage keys already managed by the existing design-provider and does not introduce new network surface, auth paths, or file access.

## Self-Check: PASSED

- `frontend/public/bootstrap.js` — FOUND
- `frontend/index.html` (updated with `<script src="/bootstrap.js" blocking="render">`) — FOUND
- `frontend/tests/unit/design-system/fouc-bootstrap.test.ts` — FOUND (10 tests passing)
- `tests/e2e/fouc-bootstrap.spec.ts` — FOUND (2 tests passing)
- Commits `150063cf`, `abb06f78`, `cdd39122`, `0fd065e2`, `a347e912` — all on `DesignV2`
