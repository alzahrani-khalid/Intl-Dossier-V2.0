# Phase 98 — Plan Check 2 (re-verification after revisions 1 + 2)

**Seat:** gsd-plan-checker (re-verify) · **Tree:** `ddb6ec1f1`, plans uncommitted · **Date:** 2026-08-18

**Tree state this verdict is pinned to** (mtimes, `stat -f %Sm`, read after the round-2 race warning):
`98-01` 02:58:40 · `98-02` 02:47:35 · `98-03` 02:04:06 · `98-04` 02:55:19 · `98-05` 02:53:28 ·
`98-06` 02:56:04 · `98-07` 02:55:19 · `98-08` 02:55:19 · `98-09` 02:48:30 · `98-VALIDATION` 02:48:30 ·
`98-REVISION-1` 02:57:19 · `98-REVISION-2` 02:59:18. **No plan file has moved since.**
`98-01` was re-read after the residue fix: its `:218` read_first already pointed at
`useUnifiedKanban.ts ~:380-600` when I read it, so item 2 was verified against the post-fix text, not
the superseded one. `useEntityLinks` appears in `98-01` **exactly once**, at `:96`, as the
disqualifying statement — the residue is closed, no finding.

**Read in full:** both check verdicts, both revision records, `98-01`/`98-04`/`98-05`/`98-06`/`98-07`
end to end, `98-08` frontmatter+objective, `98-02` gate lines, `98-VALIDATION.md:70-113`.
**Re-derived on disk, not taken from any seat:** recurrence parent-blob counts, dist/assets sourcemap
contents, `intelligence-signals.json` state, `i18n-mask-audit.mjs` regex + truncation, frontend package
scripts, the 9-plan wave/file-ownership matrix, and the full exclamation population.

## The nine

| #   | Issue                                            | Verdict                                                  | Citation                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 98-04 recurrence gate hardcoded 16               | **FIXED**                                                | `98-04:257` freezes no literal — `dot -eq 0`, `PRE -ge 1`, `POST -eq "$PRE"`, PRE from `git show "$LASTC^:…"`. Re-derived: last commit touching the file is `46e943459`, parent blob holds **43** dot-form, identical to the worktree — so PRE=43 whether the gate runs pre- or post-commit. Conservation is 1:1 by construction (each template-literal form carries exactly one token). Both polarities on one instrument. |
| 2   | copy06 primary oracle was `useEntityLinks`       | **FIXED**                                                | `98-01:89-100` promotes `useUnifiedKanbanStatusUpdate`, forbids windowed scans, disqualifies entity-links on its four own `onSuccess`; `98-01:218` read_first retargeted; `98-04:259` drives a TASK card only.                                                                                                                                                                                                              |
| 3   | copy02 console leg dead (`saveMissing:false`)    | **FIXED**                                                | Dropped with the loss stated: `98-01:74-78`, `:141-143`; artifact retargeted to `contains: 'UNDRIVEN'` at `:34`; `98-VALIDATION.md:83` now reads "console leg DROPPED rev 1 … e2e DOM detector + census backstop". The only surviving `Missing translation key` token in `98-01` is `:76`, the sentence explaining why the leg cannot fire.                                                                                 |
| 4   | 98-05 scoped a non-existent `signals.json`       | **FIXED**                                                | `98-05:13-14`, `:71-74`, `:104`, `:128-133` target `{en,ar}/intelligence-signals.json` and state the D-10 no-op. Verified on disk: both files exist, `sourceType` absent (the repair is real work), `signals.json` absent, `SignalRow.tsx:30` carries `t: TFunction<'intelligence-signals'>`. Zero `signals.json` refs remain in `98-05`.                                                                                   |
| 5   | 98-07 bundle grep case-mismatched                | **FIXED — but the fix regressed into a new blocker, N1** | `98-07:185` `grep -ril` catches both casings; negative control `grep -ci` on the source literal + positive control `Changes saved`, same run. The casing defect is genuinely gone.                                                                                                                                                                                                                                          |
| 6   | 98-04 mask-audit blind to the one-arg class      | **FIXED**                                                | Script in `files_modified:14` and Task 3 `<files>:212`; `:240-247` specifies the one-arg matcher, removal of the truncation, and both polarities on `EntityLinkManager.tsx:236`; the false control claim retracted at `:101-107`; must-have rewritten at `:26`. On disk the script still shows only `TWO_ARG` (`:42`) and `slice(0, 8)` (`:79`) — the extension is owed, not already present.                               |
| 7   | criterion 2's recurrence class on a grep alone   | **FIXED**                                                | `98-01:164-171` adds census leg (c) over the derived dot-form path set against `{en,ar}/calendar.json`, plus the literal named UNDRIVEN header line — the D-24 shape.                                                                                                                                                                                                                                                       |
| 8   | 98-04 T2 gate ran copy02 before T3's regions fix | **FIXED**                                                | Gone from T2 (`:206` records the move), now in T3's gate (`:257`) — the task that lands `toLowerCase`. Both spec paths existence-asserted before the two-path invocation (D-09).                                                                                                                                                                                                                                            |
| 9   | 98-05 T2 gate ran copy01 before T3's week header | **FIXED**                                                | Gone from T2 (`:163` records the move), now at `:184` in T3; the backwards-pointing sentence replaced by "runs IN THIS GATE" at `:186`.                                                                                                                                                                                                                                                                                     |

## New findings

**N1 — BLOCKING — `98-07:185`: the `DEVHIT -eq 0` clause is unsatisfiable (regression from the B5 fix).**
`frontend/vite.config.ts:141` sets `sourcemap: true`; `frontend/dist/assets` holds **305** `.map` files
carrying verbatim `sourcesContent`. Proven against the current build: `new-bLALrKMe.js.map` embeds
`src/components/intake-form/IntakeForm.tsx` whole — both `import.meta.env.DEV` and `actions.fillMock`
are present in its `sourcesContent`. After the repair the DEV block contains the literal
`Fill with mock data`, so `grep -ril "fill with mock data" frontend/dist/assets` returns ≥1 from the
sourcemap **whether or not Vite DCE stripped the block from the emitted JS**. The gate is red forever,
and the claim at `:187` ("if DCE fails to strip … the DEVHIT clause catches it") becomes unfalsifiable
in the other direction. Breaks D-26 as the revision itself re-states it.
**Fix:** ban the string in emitted code only — `--include='*.js' --include='*.css' --exclude='*.map'`,
or grep the non-`.map` file list — keeping both controls in the same run.

**N2 — ADVISORY — same line: the positive control is satisfiable by a sourcemap alone.**
`CTRL=$(command grep -rl "Changes saved" …)` passes on `common.json` text inside a `.map` even if the JS
chunk never emitted. Apply the same `--exclude='*.map'` in the N1 edit so the control proves output.

**N3 — ADVISORY — `98-06:82` and `:194` still name `signals.json` in the banned-file list.**
The B4 retarget did not propagate to 98-06's cross-lane ban, which now names a file that does not exist
while the file 98-05 actually owns this wave (`intelligence-signals.json`) is unnamed. Materially harmless
— I derived the full exclamation population and `{en,ar}/intelligence-signals.json` carry **0** `!` in
either locale, so no in-population member of 98-06's sweep lives in 98-05's file — but the ban is a
same-wave collision guard and it is currently pointed at the wrong filename. Rename in both places.

**N4 — ADVISORY — the both-polarity controls for items 3 and 6 are prose, not gate clauses.**
`98-04:257` machine-asserts only the one-arg marker token; the fire-on-`entityLinks.title` / pass-on-scratch
pair lives in the action text at `:244-247`. Same shape for `98-01:150-153`, `:162-163`. Real, but enforced
by the spec author rather than the gate. The SUMMARY close should name them explicitly.

**N5 — ADVISORY — 98-06 Task 3's D-15 file-count deviation is still unstated.**
The frontmatter expansion fixed the collision-input half of A3; the task at `98-06:206` still spans ~30+
files with no cause statement, where `98-07:147` states its 16-file deviation. Same gap at `98-05:142`.

## Regression watch — cleared, with derivations

- **The moved gates (8, 9) created no new ordering problem and no backwards pointer.** In both plans the
  moved spec now runs in the last task of its own plan, after the repair it asserts.
- **98-06's frontmatter expansion is verifiably complete, not merely declared.** I derived the exclamation
  population independently: **31 EN / 30 AR across 17 files**, matching D-21 exactly. Every carrier is
  declared by 98-06 except `common.json` (98-04, wave 2 — upstream, de-exclaimed before 98-06 runs) and
  `validation.json` (the stated carve-out, untouched). The 1/1 floor at `98-06:246` is therefore reachable.
- **Zero same-wave file collisions** across all nine plans (checked programmatically). The three cross-wave
  multi-owners — `check-date-formatting.mjs` 98-02→98-07, `{en,ar}/common.json` 98-04→98-08 — are correctly
  ordered by `depends_on`.
- **Criterion 2 remains closable without the console leg:** DOM detector on driven surfaces + entityLinks
  census + recurrence census/UNDRIVEN + 98-04's conservation gate. Thin if the intake-ticket surface is also
  UNDRIVEN, but the discipline is named, never silent.
- **No plan lost a requirement ID** (all 8 covered) and every plan retains ≥3 `D-NN` citations in `truths`.
- No exogenous path in any `files_modified`; no `pnpm --filter frontend`; no `timeout N`. Frontend scripts
  confirmed on disk: `build`, `lint`, `type-check` (never `typecheck`).

## ISSUES FOUND

**1 BLOCKING (N1 — new, introduced by the B5 fix), 4 ADVISORY. All nine original blockers are FIXED; none regressed.**
N1 is a one-clause edit at `98-07:185`, plus the matching sentence at `:187` and the must-have at `:44`.
Nothing in the wave structure, task decomposition, or file ownership needs to move.

PLAN-CHECK-END
