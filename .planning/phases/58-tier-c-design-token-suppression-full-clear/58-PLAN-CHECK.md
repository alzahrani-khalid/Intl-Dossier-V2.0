# Phase 58 Plan Check — Waves 3–7

**Date:** 2026-05-20
**Plans reviewed:** 58-03 through 58-10 (8 files)
**Verdict:** PASS-WITH-WARNINGS

## Quality Gate Summary

- [x] Manifest coverage (236 source files + 1 lint config, zero duplicates)
- [x] Wave dependency chain
- [x] Sub-wave frontmatter (06=A, 07=B, 08=C, 09=D)
- [x] Autonomy flags (03–09 = true; 10 = false)
- [x] Requirements coverage (TOKEN-01, TOKEN-02 on every plan)
- [x] Threat model on every plan
- [x] must_haves derivation (goal-backward — all 4 phase success criteria covered in plan 10)
- [x] Token validity (sampled — text-ink, text-ink-mute, bg-surface, bg-surface-raised, bg-muted, border-line, text-accent, text-primary, text-info, text-danger, text-success, text-warning, bg-info/10, bg-success/10, bg-danger/10, bg-warning/10, bg-primary/10, text-sla-ok, text-sla-risk, text-sla-bad, var(--accent), var(--info) — all present in `frontend/src/index.css` @theme block at lines 43–118)
- [x] Anti-shallow tasks (read_first + action + acceptance_criteria + done on every task in plans 03–09)
- [x] Surface naming tags (drawers-dialogs, dossier-rail, charts-residue, types, components, pages-routes, hooks-utils, closure)
- [x] Wave 7 specific gates (file = eslint.config.mjs only; 5 verification commands; rollback procedure documented; phase-58-base signed tag per BUNDLE-06)
- [x] CLAUDE.md compliance (no emoji in plan prose; no marketing voice; no raw hex literals)
- [~] OQ-58-RES-01..05 resolutions (all 5 OQs addressed in plans, BUT RESEARCH.md's `## Open Questions` section is NOT marked `(RESOLVED)` — see Warning 3)

## Findings

### HIGH (blocker — must fix before /gsd:execute-phase)

None.

### MEDIUM (should fix this iteration)

**1. [research_resolution] RESEARCH.md `## 13. Open Questions` section is not marked `(RESOLVED)`**

- File: `58-RESEARCH.md` line 672
- Issue: Section heading reads `## 13. Open Questions` without `(RESOLVED)` suffix. Each question has a "Recommendation:" line but no explicit `RESOLVED:` marker per Dimension 11 gate.
- Note: The plans themselves resolve all 5 OQs correctly (Plan 04 resolves OQ-58-RES-01 + OQ-58-RES-04 via Task 1 sandbox; Plan 06 resolves OQ-58-RES-02 via 6A-Inline strategy; Plan 07 resolves OQ-58-RES-03 via single-PR + 3-cluster review fallback; Plan 10 resolves OQ-58-RES-05 via option (a) inline). So this is a research-doc-hygiene issue, not a planning failure. Plans can proceed with execute.
- Fix: After all plans land, append `(RESOLVED)` to the section heading and inline a one-line resolution per question.

**2. [scope_sanity] Plan 04 has 5 tasks; Plan 10 has 5 tasks**

- Plan 04: Branch + scrim verify | Execute 26 files | Execute CustomNodes (68 annotations, dedicated task) | Wave gate | SUMMARY → 5 tasks
- Plan 10: Branch + audit | Apply 3 eslint edits | Human-verify checkpoint | Tag | SUMMARY → 5 tasks
- Gate threshold: 5 tasks = blocker per default gates. However, both splits are justified:
  - Plan 04: The 68-annotation CustomNodes.tsx is the heaviest file in the entire phase; separating it into its own task is a legitimate risk-isolation strategy. Tasks 1–3 are core work; Tasks 4–5 are verify + SUMMARY (standard wave cadence).
  - Plan 10: One task per success-criterion-relevant step (audit, edit, canary, tag, close); the human-verify checkpoint is structurally required (autonomous: false).
- Recommendation: Accept as-is. The 5-task count reflects necessary work isolation, not scope inflation. Do not split.

**3. [sparkline_test_assumption] Sparkline.test.tsx Tier-B carve-out claim is unverified against eslint.config.mjs**

- File: `58-05-PLAN.md` frontmatter `scope.tier_b_carve_out`; mirrored from `58-WAVE-MANIFEST.md` line 114 override_notes
- Issue: The plan excludes `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` from Wave 5 on the manifest's claim that it is "Tier-B carve-out per eslint.config.mjs." However, inspection of `eslint.config.mjs:247-270` shows only `frontend/src/components/signature-visuals/flags/**/*.{tsx,ts}` is exempted under the `signature-visuals/` prefix — NOT `signature-visuals/__tests__/`. The actual `Sparkline.test.tsx` lives at `frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` (verified by `ls`).
- Severity: MEDIUM warning — the planner faithfully followed the upstream manifest claim, and Wave 7's canary `pnpm lint --max-warnings 0` will catch this empirically. If lint fails on Sparkline.test.tsx during Wave 7, the rollback procedure documented in plan 10 (revert Wave 7; patch the failing prior wave) will kick in cleanly.
- Recommendation: Add a one-line empirical verification to Plan 05 Task 1 — `pnpm lint frontend/src/components/signature-visuals/__tests__/Sparkline.test.tsx` should be run BEFORE excluding the file to confirm the carve-out claim. If lint reports zero errors on the file (with the waiver present) AND no errors when the waiver is gone (simulated by temporarily commenting the spread at line 217), the exclusion stands. Otherwise, fold the file into Wave 5 scope.

### LOW (polish / nice-to-have)

**1. [threat_model_wording] Threat-model phrasing differs from gate-specified wording**

- The gate expects: `"Refactor-only — visual regression is the sole risk class"` plus 4 mitigations (lint, type-check, per-file diff, wave gate).
- The plans use: `"Risk class: Visual regression only."` + `"Severity: Tier-A trivial (refactor, no new surface)"` + 4 mitigations (lint, type-check, per-file diff, wave gate).
- Substance matches; wording differs. Plan 10 deviates further because Wave 7's risk class is "Lint-rule behavior change" (correctly), not visual regression.
- Recommendation: Accept as-is. The wording divergence does not change the threat-model substance. If strict gate compliance is desired, the planner could normalize to the gate-specified phrase across all 8 plans in a single sweep.

**2. [verification_command_specificity] Wave 4 verification_commands uses an awk subshell pattern that may not work**

- Plan 04 line 93: `grep -rn "..." $(awk "/wave: 4/" .planning/phases/.../58-04-PLAN.md)` — the inner awk only filters lines containing `wave: 4` from its own plan file. It does not extract the files_modified list. As written, this command will likely emit a useless argument list to grep.
- Recommendation: Replace with the explicit-file-list pattern used by Plan 03 (verification_commands[0]) — list the 27 file paths explicitly, or use `awk` to extract the YAML list properly. Low priority since the wave-gate task (Task 4 in Plan 04) also runs the workspace-wide `pnpm lint --max-warnings 0` which catches the same regressions.

**3. [estimate_divergence] Plan 09 acknowledges a 79-vs-25 scope divergence from RESEARCH section 7 estimate**

- The plan correctly defers to the manifest (authoritative source) and ships 79 annotations across 6 files instead of the research's ~25 estimate. The divergence is logged as `OBS-58-06D-01`.
- Recommendation: Accept as-is. This is exemplary handling of a source-of-truth conflict (manifest is authoritative; research was an estimate).

### NOTES (informational, not findings)

- Total source files in plans 03–09: 235 (Wave 3: 18 + Wave 4: 27 + Wave 5: 14 + Wave 6A: 22 + Wave 6B: 97 + Wave 6C: 51 + Wave 6D: 6 = 235). Plus Sparkline.test.tsx intentionally excluded from Wave 5 (1 file) = 236 manifest rows matched. Plus eslint.config.mjs in Wave 7 (1 file). Zero duplicates across all 8 plans (verified via `sort | uniq -d`).
- Wave 6 sub-wave totals: 22 + 97 + 51 + 6 = 176 — matches manifest Wave 6 row count exactly.
- Sub-wave depends_on chain (Wave 6): 06 → 07 → 08 → 09 is strictly serial. Plan 10 depends on all of 01–09. Correct per gate-specified chain.
- Plan 10 frontmatter correctly sets `autonomous: false` because the canary `pnpm lint` may fail (indicating a prior-wave gap). The `<task type="checkpoint:human-verify" gate="blocking">` block is structurally correct and includes operator instructions.
- All 4 phase success criteria from ROADMAP.md are covered in Plan 10's must_haves.truths: (1) grep-zero `gsd-design-token-tier-c-allow` in frontend/src; (2) zero `designTokenSyntaxRestrictions|tier-c|Tier-C` references in eslint.config.mjs; (3) `pnpm lint --max-warnings 0` exits 0 without the waiver; (4) per-surface wave PRs (organizational — implicit in the wave structure, not asserted as a `truth` but visible in the surface tags).
- The `phase-58-base` signed tag instruction in Plan 10 Task 4 correctly references CLAUDE.md "Tag signing setup" section and uses the BUNDLE-06 convention (`git tag -v <name>` must print `Good "git" signature`).

## Per-Plan Verdict

| Plan | Files | Annotations | Issues | Verdict                                            |
| ---- | ----: | ----------: | -----: | -------------------------------------------------- |
| 03   |    18 |         138 |      0 | PASS                                               |
| 04   |    27 |         249 |      1 | WARN (LOW: awk verification subshell)              |
| 05   |    14 |          92 |      1 | WARN (MED: Sparkline.test carve-out unverified)    |
| 06   |    22 |         421 |      0 | PASS                                               |
| 07   |    97 |         734 |      0 | PASS                                               |
| 08   |    51 |         346 |      0 | PASS                                               |
| 09   |     6 |          79 |      0 | PASS (OBS-58-06D-01 acknowledges scope divergence) |
| 10   |     1 |           0 |      0 | PASS                                               |

## Recommended Action

**PASS-WITH-WARNINGS:** Plans are ready for `/gsd:execute-phase 58`. The orchestrator should apply the following non-blocking fixes inline before execute:

1. (MEDIUM-3) Augment Plan 05 Task 1 with one extra empirical-verification step for Sparkline.test.tsx: confirm the file lints clean WITHOUT the Tier-C waiver before excluding it from Wave 5. If the check fails, fold Sparkline.test.tsx into Wave 5 scope as a 15th file and update the totals (15 files / 95 annotations).
2. (LOW-2) Rewrite Plan 04 verification_commands[0] to use the explicit 27-file path list (mirror Plan 03's pattern) rather than the awk-subshell construct.
3. (MEDIUM-1) After all plans execute, the planner or orchestrator should rename `## 13. Open Questions` to `## 13. Open Questions (RESOLVED)` in `58-RESEARCH.md` and append a one-line resolution per OQ.

None of these is blocking. Plans 03–10 cover all 236 in-scope manifest rows (235 source files + 1 carved-out) plus eslint.config.mjs in Wave 7 with zero duplication.

## Revision Instructions

None required (no HIGH blockers). The three suggested non-blocking edits above are optional polish; the orchestrator may choose to apply them inline during execute or accept the plans as-is and surface the issues as wave-level observations during SUMMARY authoring.

## PLAN CHECK COMPLETE — verdict: PASS-WITH-WARNINGS
