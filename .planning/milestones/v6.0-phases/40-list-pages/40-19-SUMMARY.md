---
plan_id: 40-19
phase: 40
phase_name: list-pages
mode: gap_closure
gaps_addressed: [G1, G2, G3, G4, G5, G6, G7, G8]
status: SUCCESS-WITH-DEVIATION
date: 2026-04-26
files_modified:
  - frontend/tests/e2e/list-pages-visual.spec.ts
  - .planning/phases/40-list-pages/VERIFICATION.md
  - .planning/phases/40-list-pages/40-HUMAN-UAT.md
---

# 40-19 — Final reconciliation pass + verdict refinement

## Outcome

`SUCCESS-WITH-DEVIATION`. The 8 code-level gap closures from plans 40-12..40-18
are documented and attributed in `VERIFICATION.md`. The plan-mandated verdict
flip from `PASS-WITH-DEVIATION` to `PASS` is **NOT** applied — the live
Playwright run that would E2E-verify the closures fails at the same
`loginForListPages` auth gate that put Phase 40 into PASS-WITH-DEVIATION
posture in the first place. Promoting to PASS without that verification would
falsify the verdict.

## What landed

1. **Followup from 40-18 patched.** `frontend/tests/e2e/list-pages-visual.spec.ts`
   line 17: hyphenated `working-groups` route → underscored `working_groups`
   to match the as-built filesystem path (`frontend/src/routes/_protected/dossiers/working_groups/index.tsx`).
   Lint + tsc on the patched file remain clean.

2. **`VERIFICATION.md` gap-closure section appended** with a full G1..G8
   attribution table (gap → plan → resolution → code-level verified → E2E
   verified). Verdict line refined to make the "code-level vs E2E-verified"
   split explicit. Added a 4-step recipe for the operator to flip to PASS
   once the auth helper is fixed.

3. **`40-HUMAN-UAT.md` Gaps section rewritten** — every G1..G8 heading prefixed
   `~~CLOSED~~` with citation to the closing plan SUMMARY and the verification
   evidence (unit tests + greps + lint + tsc). New "Live E2E gate" entry
   replaces the original "run the suite" item — narrows the remaining work
   to one selector update in `tests/e2e/support/list-pages-auth.ts`.
   Summary block updated: 8 gaps closed at code-level; UAT items remain
   `partial` because live verification is blocked on the same auth gate.

## Live E2E run — best-effort, captured

Ran the full 6-spec suite from `frontend/` with the as-built project name
`chromium` (plan referenced `chromium-darwin` which does not exist in the
shipped `frontend/playwright.config.ts`):

```
pnpm exec playwright test list-pages-render list-pages-rtl list-pages-engagements \
  list-pages-a11y list-pages-touch-targets list-pages-visual \
  --project=chromium --reporter=line
```

**Result:** 68 / 68 failed. Single root cause across every spec — `loginForListPages()`
at `frontend/tests/e2e/support/list-pages-auth.ts:32` calls
`page.fill('[name="email"], input[type="email"]', TEST_EMAIL)` and times out at
30 s waiting for that locator. The `/login` page on the dev server booted by
Playwright's `webServer` config does not expose a form input matching that
selector. This is the same auth gate that gated Phase 40 into PASS-WITH-DEVIATION
on 2026-04-26 and is environment/selector-specific — out of scope for the
gap-closure plans (which deliberately did not touch the auth helper).

Run log archived at `/tmp/40-19-final-run.txt` (4101 lines).

## Triple-replay visual stability — DEFERRED

Cannot execute: depends on a green single run, which depends on auth.
Determinism stack from 40-13 + 40-17 is in place and `playwright --list`
resolves all 14 visual tests; the 3-replay proof remains a HUMAN-UAT item.

## Gap closure attribution

| Gap | Plan          | Code verified | E2E verified |
| --- | ------------- | ------------- | ------------ |
| G1  | 40-14         | YES           | DEFERRED     |
| G2  | 40-15         | YES           | DEFERRED     |
| G3  | 40-13         | YES           | DEFERRED     |
| G4  | 40-18         | YES           | DEFERRED     |
| G5  | 40-16         | YES           | DEFERRED     |
| G6  | 40-12         | YES           | DEFERRED     |
| G7  | 40-13 + 40-17 | YES           | DEFERRED     |
| G8  | 40-18 + 40-19 | YES           | DEFERRED     |

## Verification

| Check                                            | Result                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Visual spec hyphenated → underscored route patch | PASS — `grep -n "working-groups" list-pages-visual.spec.ts` returns only `…visual working-groups` test-name strings (cosmetic) |
| eslint on patched spec                           | PASS — clean                                                                                                                   |
| tsc --noEmit on patched spec                     | PASS — clean                                                                                                                   |
| `playwright test list-pages-visual --list`       | PASS — 14 tests resolve                                                                                                        |
| Vitest list-page suite (regression check)        | PASS — 30/30 (5 ListPageShell, 5 GenericListPage, 5 DossierTable, 7 EngagementsList, 7 PersonsGrid) in 981 ms                  |
| Live 6-spec run                                  | FAILED — 68/68 fail at auth gate (selector mismatch in `loginForListPages`); same root cause as Phase 40 PASS-WITH-DEVIATION   |

## Why the verdict is NOT flipped

The plan's success criteria require:

- 6/6 E2E spec files green ← FAILED (auth gate)
- 14/14 visual baselines stable across 3 replays ← UNREACHABLE (depends on above)

Both hard prerequisites are unmet. Per the auto-chain protocol's distinction:
human-verify checkpoints auto-approve, but human-action checkpoints (auth
gates, OS permissions, environment setup) genuinely require a human. The
auth helper selector mismatch falls in the latter category. Flipping
`PASS-WITH-DEVIATION → PASS` without an end-to-end run would falsify the
verdict and remove the signal that the auth helper still needs an update.

## STATE.md / ROADMAP.md

Per the same logic, `STATE.md`'s `Phase 40 — COMPLETE (PASS-WITH-DEVIATION)`
line is correct as-stamped and is **not** updated to PASS. The 8 gap
closures are recorded in `VERIFICATION.md` and surface to `/gsd-progress` and
`/gsd-audit-uat` via `40-HUMAN-UAT.md`.

## Recommended next step

Land a small targeted fix to `frontend/tests/e2e/support/list-pages-auth.ts`
that either:

- updates `page.fill` selectors to match the as-built login form, or
- swaps DOM-driven login for a token-endpoint shortcut (e.g. set the
  Supabase auth cookie directly via `page.context().addCookies(...)` after a
  programmatic `auth.signInWithPassword` call).

Then re-run the 6-spec suite. If green, capture and 3×-replay the visual
spec. If both gates clear, a single follow-up plan can flip the verdict to
PASS.

## Files modified

- `frontend/tests/e2e/list-pages-visual.spec.ts` — single-line route fix
- `.planning/phases/40-list-pages/VERIFICATION.md` — gap-closure section + recipe
- `.planning/phases/40-list-pages/40-HUMAN-UAT.md` — Gaps section rewritten + new Live E2E gate item
- `.planning/phases/40-list-pages/40-19-SUMMARY.md` — this file (NEW)
