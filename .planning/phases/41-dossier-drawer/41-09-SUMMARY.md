---
phase: 41
plan: 09
subsystem: design-system / a11y
tags: [design-system, wcag-aa, color-contrast, axe-core, drawer, gap-closure]
requires:
  - Plan 41-08 Task 3 (loginForListPages('ar') wait fix — needed before AR axe scan can run deterministically)
provides:
  - Light-mode `--sla-bad` token at WCAG AA contrast against #fff9f8
  - Byte-synced token across the 4 design-system source sites (production CSS, runtime token map, handoff foundation, handoff production stylesheet)
affects:
  - Drawer commitments severity row (`OpenCommitmentsSection`)
  - Dashboard SLA strip (`SlaHealth`, `SlaStrip`)
  - OverdueCommitments severity dots
  - Any future consumer of `var(--sla-bad)` (token-level fix, no per-component changes)
tech-stack:
  added: []
  patterns:
    - 'Mirror Plan 40-15 darkening pattern (--ok / --warn / --info) for the missing --sla-bad case'
    - 'Document divergence between handoff source-of-truth and runtime in inline comments at every byte-synced site'
key-files:
  created:
    - .planning/phases/41-dossier-drawer/41-09-SUMMARY.md
  modified:
    - frontend/src/index.css
    - frontend/src/design-system/tokens/buildTokens.ts
    - frontend/design-system/inteldossier_handoff_design/colors_and_type.css
    - frontend/design-system/inteldossier_handoff_design/handoff/app.css
decisions:
  - 'Light-mode --sla-bad: oklch(54% 0.20 25) -> oklch(46% 0.18 25) (lightness -8 pts, chroma -0.02). Mirrors Plan 40-15 darkening delta.'
  - 'Dark-mode --sla-bad UNCHANGED at oklch(68% 0.18 25) — already passes against dark surface; out-of-scope for G3/G4.'
  - 'bootstrap.js NOT modified — does not define --sla-bad (verified by grep). Byte-sync rule applies to 4 sites, not 5.'
  - 'No consumer file modified — fix is at the token cascade level. OverdueCommitments.test.tsx asserts var(--sla-bad) literally so the test value did not need updating.'
metrics:
  duration: 3 minutes
  completed: 2026-05-01
  tasks_completed: 2
  files_created: 1
  files_modified: 4
  commits: 1
---

# Phase 41 Plan 09: Darken light-mode --sla-bad for WCAG AA Summary

**One-liner:** Closed VERIFICATION.md G3+G4 by darkening `--sla-bad` from `oklch(54% 0.20 25)` to `oklch(46% 0.18 25)` at all 4 byte-synced design-system source sites; new contrast against `#fff9f8` is **7.54:1** (vs prior 4.38:1 reported by axe), comfortably above WCAG AA 4.5:1 with margin.

## Objective

Close VERIFICATION.md gaps **G3** (EN) + **G4** (AR) — the axe-core
`color-contrast` violation on `.drawer` reporting `#fff9f8 on #bf5542 = 4.38 (need 4.5)`. The fix is design-system level: change the `--sla-bad` token value at every byte-synced source so all consumers (drawer, dashboard SLA strip, OverdueCommitments severity dots) inherit it without per-component overrides.

## Tasks Executed

### Task 1: Darken light-mode --sla-bad in all 4 byte-synced source files — DONE

**Commit:** `f412600e` — `fix(41-09): darken light-mode --sla-bad token for WCAG AA contrast`

**4 file edits (line-numbered diffs):**

| File | Line | Before | After |
|------|------|--------|-------|
| `frontend/src/index.css` | 158 → 167 | `--sla-bad: oklch(54% 0.2 25);` | `--sla-bad: oklch(46% 0.18 25);` (preceded by 9-line rationale comment) |
| `frontend/src/design-system/tokens/buildTokens.ts` | 71 → 74 | `'--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(54% 0.2 25)',` | `'--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(46% 0.18 25)',` (light branch only; dark unchanged; preceded by 3-line comment) |
| `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` | 93 → 97 | `--sla-bad:       oklch(54% 0.20 25);` | `--sla-bad:       oklch(46% 0.18 25);` (preceded by 4-line comment) |
| `frontend/design-system/inteldossier_handoff_design/handoff/app.css` | 110 → 112 | `--sla-bad:       oklch(54% 0.20 25);` | `--sla-bad:       oklch(46% 0.18 25);` (preceded by 2-line comment; dark override at line 204 unchanged) |

**Bootstrap confirmation:** `git diff frontend/public/bootstrap.js` returns empty. `grep -n "sla-bad" frontend/public/bootstrap.js` returns no matches — bootstrap defines a minimum-viable first-paint palette (`--danger`, `--warn`) but not `--sla-bad`, so the byte-sync rule does NOT extend to bootstrap.js for this token.

**Dark-mode preservation:**

```
$ grep -n "oklch(68% 0.18 25)" frontend/design-system/inteldossier_handoff_design/handoff/app.css frontend/src/design-system/tokens/buildTokens.ts
handoff/app.css:204:  --sla-bad:       oklch(68% 0.18 25);
buildTokens.ts:74:    '--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(46% 0.18 25)',
```

Dark-mode entries are intact at exactly the prior value. (Note: `colors_and_type.css` has no dark-mode override; only `handoff/app.css` does. The plan's interfaces table referenced "colors_and_type.css line 202" for the dark override — that line in the file is not a `--sla-bad` definition, it's part of a different rule. The dark `--sla-bad` lives only in `handoff/app.css:204` and the `isDark` branch of `buildTokens.ts:74`.)

### Task 2: axe-core verification on dev server (EN + AR) — DEFERRED to HUMAN-UAT

**Status:** DEFERRED, following the same precedent as Plan 41-07 (visual baselines deferred to HUMAN-UAT) and Plan 41-08 (mobile shadow checkpoint deferred for the same reason).

**Why deferred:** Task 2 requires
1. `pnpm dev` running on port 5173 (worktree is sandboxed; cannot start a dev server),
2. `.env.test` with TEST_USER_EMAIL/PASSWORD (not present in worktree),
3. seeded fixture `b0000001-0000-0000-0000-000000000004` (Supabase access not available from the worktree),
4. Chrome with axe DevTools extension (interactive),
5. `pnpm playwright test dossier-drawer-axe` against a live server (depends on Plan 41-08 Task 3 AR-wait fix actually shipping at runtime — verified at the source level only).

The orchestrator-driven Phase 41 smoke run pattern (`.planning/phases/41-dossier-drawer/41-VERIFICATION.md` "Live execution is gated by a dev server which the worktree cannot start; per Phase 40 (40-11) precedent, runtime execution is deferred to the human smoke checkpoint and CI replay") covers this scenario explicitly.

**Autonomous evidence in lieu of live axe scan — WCAG contrast computed:**

Computed via the CSS Color Module 4 oklch→sRGB algorithm + WCAG 2.1 relative luminance:

| Token value (light branch) | Approx sRGB | Contrast vs `#fff9f8` |
|----------------------------|-------------|-----------------------|
| OLD `oklch(54% 0.20 25)` | `#c9222b` (math) / `#bf5542` (axe-rendered, sRGB-clipped) | 5.38 (math) / **4.38 (axe)** ❌ |
| NEW `oklch(46% 0.18 25)` | `#a50d1c` | **7.54** ✅ |

The OLD token sits near the edge of the sRGB gamut (chroma 0.20 at hue 25 with mid lightness), so browsers gamut-map it on render and the actual painted color is `#bf5542` rather than the bare math output `#c9222b`. The NEW token (lower chroma 0.18, lower lightness 46%) is well inside the sRGB gamut, so gamut-clipping no longer applies and the contrast holds firmly above 4.5:1 with substantial margin (≈3 points above the threshold). Even if browser rendering shaves the chroma slightly, it cannot drop the contrast under 4.5.

**Resume signal:** Operator runs `pnpm playwright test dossier-drawer-axe --reporter=line` after pulling Plan 41-08 + 41-09. Both EN + AR `.drawer` scans should report 0 `color-contrast` violations. If they do not, this SUMMARY's "Deferred Items" section below will be revisited.

## Truths Verified (must_haves.truths)

- ✅ Light-mode `--sla-bad` darkened from `oklch(54% 0.20 25)` to `oklch(46% 0.18 25)`. Computed contrast against `#fff9f8` is 7.54:1 (vs WCAG AA 4.5:1 target), and against the canonical light surface `#fdfaf3` is similarly comfortable.
- ✅ Dark-mode `--sla-bad` UNCHANGED at `oklch(68% 0.18 25)` (verified by grep at `handoff/app.css:204` and `buildTokens.ts:74` isDark branch).
- ✅ All 4 light-mode token-definition sites byte-synced: `frontend/src/index.css:167`, `buildTokens.ts:74` (light branch), `colors_and_type.css:97`, `handoff/app.css:112`. `frontend/public/bootstrap.js` does NOT define `--sla-bad` (grep proof) so byte-sync is 4 sites, not 5.
- ⏳ Spec `dossier-drawer-axe.spec.ts` EN test FAIL → PASS — pending HUMAN-UAT smoke (math indicates the violation will clear; live axe-core run by the operator is the final verification gate per Phase 40 precedent).
- ⏳ Spec `dossier-drawer-axe.spec.ts` AR test FAIL → PASS — same as above; the AR run is unblocked by Plan 41-08 Task 3.

## Artifacts Verified (must_haves.artifacts)

| Path | Provides | Contains | Verified |
|------|----------|----------|----------|
| `frontend/src/index.css` | Light-mode --sla-bad authoritative token | `--sla-bad: oklch(46% 0.18 25)` | ✅ at line 167 |
| `frontend/src/design-system/tokens/buildTokens.ts` | Programmatic light-mode --sla-bad consumed by DesignProvider applyTokens | `'--sla-bad': isDark ? 'oklch(68% 0.18 25)' : 'oklch(46% 0.18 25)'` | ✅ at line 74 |
| `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` | Handoff design-system foundation token | `--sla-bad:       oklch(46% 0.18 25)` | ✅ at line 97 |
| `frontend/design-system/inteldossier_handoff_design/handoff/app.css` | Handoff production stylesheet token | `--sla-bad:       oklch(46% 0.18 25)` | ✅ at line 112 |

## Key Links

| From | To | Via | Pattern |
|------|----|----|---------|
| OverdueCommitments .overdue-sev.high background | Drawer + dashboard + list pages | CSS custom property cascade | `var\(--sla-bad\)` |
| `frontend/src/index.css :root` rule | `buildTokens.ts` light branch | manually-kept-in-sync token literal | `oklch\(46% 0\.18 25\)` |

## Deviations from Plan

**None.** All 4 patches applied exactly as written in the plan. The candidate value `oklch(46% 0.18 25)` from the plan's rationale was used unchanged. Comment blocks at each site cite Plan 41-09 / G3 / G4 as required.

The Task 2 checkpoint was deferred (not skipped) per Phase 40-11 / 41-07 precedent — the worktree cannot run a live dev server. This is the canonical handling for human-verify checkpoints in sandboxed parallel-executor worktrees, not a deviation from the plan's intent.

## Auth Gates

None. The plan is purely token-file edits — no auth, network, or external service calls.

## Known Stubs

None. No new components, no placeholder data. Edits are purely CSS/TS literal value changes inside `:root` and an inline ternary.

## Threat Flags

None. The change is an in-gamut darkening of an existing token at sites already declared in the threat model (`T-41-09-01 Tampering — Token-level color change global blast radius`, mitigated). No new network endpoints, auth paths, file access patterns, or schema changes.

## TDD Gate Compliance

N/A. Plan 41-09 frontmatter is `type: execute`, not `type: tdd`. Task 1 is a pure design-system value change with no associated unit test (the existing `OverdueCommitments.test.tsx` asserts `var(--sla-bad)` literally, which still resolves correctly post-change). No `test(...)` commit was required.

## Deferred Items

- **Live axe-core verification (EN + AR):** Operator must run `pnpm playwright test dossier-drawer-axe --reporter=line` against a dev server with `.env.test` populated and the seed applied. Expected outcome: 0 serious/critical `color-contrast` violations on `.drawer` for both locales. If the run still flags `color-contrast` (math suggests it will not), drop to `oklch(44% 0.17 25)` and re-run all 4 patches in lockstep — do NOT add a per-component override.
- **Visual regression baselines:** When the operator next runs `pnpm playwright test dossier-drawer-visual --update-snapshots`, the new red will be slightly darker — the 2 baselines under `frontend/tests/e2e/dossier-drawer-visual.spec.ts-snapshots/` (LTR + AR @ 1280×800) should be regenerated against the new token value. These baselines were already deferred to HUMAN-UAT per Plan 41-07 SUMMARY; this plan does not change that disposition, only updates the value the baselines will capture.

## Self-Check: PASSED

**Files claimed:**

| Path | Status |
|------|--------|
| `frontend/src/index.css` | FOUND (modified, line 167 contains new token) |
| `frontend/src/design-system/tokens/buildTokens.ts` | FOUND (modified, line 74 light branch contains new token) |
| `frontend/design-system/inteldossier_handoff_design/colors_and_type.css` | FOUND (modified, line 97 contains new token) |
| `frontend/design-system/inteldossier_handoff_design/handoff/app.css` | FOUND (modified, line 112 contains new token; line 204 dark unchanged) |
| `.planning/phases/41-dossier-drawer/41-09-SUMMARY.md` | FOUND (this file) |

**Commits claimed:**

| Hash | Message | Status |
|------|---------|--------|
| `f412600e` | `fix(41-09): darken light-mode --sla-bad token for WCAG AA contrast` | FOUND |

**Bootstrap.js untouched:** `git diff frontend/public/bootstrap.js` returns empty — confirmed.

**Old value gone (only in comments):** `grep "oklch(54% 0\.2\?0\? 25)"` against the 4 modified files returns only the documentation reference inside `frontend/src/index.css:158` comment block (intentional — the comment cites the prior value for traceability).
