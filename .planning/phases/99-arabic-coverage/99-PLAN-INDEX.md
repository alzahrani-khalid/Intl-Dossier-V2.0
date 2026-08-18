# Phase 99 "Arabic Coverage" — PLAN INDEX (REVISION 1)

**Seat:** `p99-planner-2`. **Written:** 2026-08-18 (UTC), repo HEAD
`9ffa2b80cc82fb3fe29e11354818d13f537e67b9`, branch `milestone/v10.0-trust`. Supersedes the
ten-plan index of the first draft. Every figure below was RE-DERIVED at this sha by this seat;
where two instruments disagree, both numbers are stated (D-04/D-05).

**Twenty-five plans**, compiled against tickmarkr **1.93.0**. Executor: the tickmarkr ENGINE per
OPORD98. The repair round is recorded blocker-by-blocker in `99-REVISION-1.md`.

The count is 25 and not 10 for three ruled reasons: `RULING-P99-05` §5 A-02 ordered the mask
conjunction split into a verification-only node plus deletion; `RULING-P99-07` ordered BOTH the
glossary sweep and the mask drop split into file-disjoint lanes under a ~45,000-byte budget; and
two further lanes measured over that budget at plan time and were re-cut before the work starts
rather than parked after it (constraint 4 of that ruling).

> **SUPERSEDED IN SHAPE, 2026-08-18 — see `99-RECUT.md`.** `tickmarkr compile` rejected the
> twenty-five-task cut with 82 task-unit-contract errors (`RULING-P99-09`); the exit probe this
> index quotes was `compileGsd()` in-process, which the CLI wraps with a contract that function
> never applies. **Every number below about CONTENT still stands** — the criterion→plan→oracle map,
> the decision-coverage reading, the derivation register, the honest red decomposition. **Every
> number about the CUT is stale**: the set is now **41 tasks**, cut to ≤6 acceptance items, ≤3
> files[] patterns and ≤18 surface each, and it compiles at exit 0. `99-RECUT.md` carries the
> traceability table, the per-task table, and the verbatim CLI output.

---

## 1. The wave table (DAG levels; the engine schedules by deps, not by labels)

| wave | plan             | owns                                                                                                                                                                              | deps        | est. logic bytes               |
| ---- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------ |
| 1    | **99-01**        | Rendered oracles: `settle.ts`, `99-ar02-dates` (8 tests), `99-ar03-leak` (10 tests), the UI99-C7 three-status fixture                                                             | —           | ~28k authored                  |
| 1    | **99-02**        | Static instruments: `i18n-audit-strict.mjs`, `nav-title-agreement.mjs`, `glossary-census.mjs` + the sense allowlist                                                               | —           | ~30k authored                  |
| 2    | **99-03**        | The `common.json` FLATTEN, atomic: both locales, the two TYPE CLASHES relocated to `error.label`/`search.label`, 130 dot-form + 100 double-prefixed sites rewritten in ONE commit | 01,02       | **~41.4k measured**            |
| 3    | **99-04**        | Intake/triage authoring ×2 locales; UI99-C6 rendered                                                                                                                              | 02,03       | ~12k                           |
| 3    | **99-05**        | Dossier-family authoring; UI99-C8 chips extraction, rendered                                                                                                                      | 02,03       | ~12k                           |
| 3    | **99-06**        | Tasks/queues/positions authoring; TaskCard exemplar (D-11); UI99-C7 banner ×3, rendered                                                                                           | 02,03       | ~13k                           |
| 3    | **99-07**        | Common + 19 small namespaces: AUTHORING ONLY, zero source files                                                                                                                   | 02,03       | **~37.1k measured**            |
| 4    | **99-08**        | Chrome REWRITES: nav unmask, 404 repoint, 4 dynamic carriers, chrome literals; UI99-C5 rendered                                                                                   | 07          | **~14.0k measured**            |
| 5    | **99-09**        | AR-02 dates: the formatter's name tokens, 26 raw date-fns sites; 99-ar02 all 8 tests rendered                                                                                     | 02,03,07,08 | ~8k                            |
| 6    | **99-10**        | Glossary A: 28-row nav↔title walk, the three RULED tie-breaks, the queue collision, MoUs anchor                                                                                   | 04..09      | ~7k                            |
| 7    | **99-11**        | Glossary B: `ارتباط`→`مشاركة` (32 ar bundles)                                                                                                                                     | 10          | **31.8k measured**             |
| 7    | **99-12**        | Glossary C: `موجز`→`ملخص`, wrong-sense `منصب`→`موقف` (42 ar bundles)                                                                                                              | 11          | **24.6k measured**             |
| 8    | **99-13**        | Glossary D1: the `ملف` sense split, ar bundles `advanced-search`…`email-digest` (37)                                                                                              | 12          | **39.9k measured**             |
| 8    | **99-14**        | Glossary D2: `ملف`, `empty-states`…`preview-layouts` (32)                                                                                                                         | 12          | **43.6k measured**             |
| 8    | **99-15**        | Glossary D3: `ملف`, `progressive-disclosure`…`workspace` (18)                                                                                                                     | 12          | **10.8k measured**             |
| 9    | **99-16**        | AR-04a GATEKEEPER — repo-wide strict zero, both locales. **Edits nothing.**                                                                                                       | 13,14,15    | 0                              |
| 10   | **99-17..99-24** | Mask deletion ×8, file-disjoint, deletion-only                                                                                                                                    | 16 each     | **31.4k–44.7k each, measured** |
| 11   | **99-25**        | Consolidated re-proof + **operator sign-off** (D-38 human gate; D-19 window closes here)                                                                                          | 17..24      | 0                              |

Concurrency is machine-checked: **44 concurrent pairs, 0 file collisions** (over every pair where
neither task is an ancestor of the other, `files[] ∩ files[] = ∅` outside `.planning/`). D-14
holds by transitive closure — every plan after 99-03 is its descendant. D-24 holds the same way —
all eight deletion lanes are descendants of 99-16.

## 2. Criterion → plan → oracle map

Every rendered row below is a `command:` truth in the named plan's own acceptance. `<verify>`
blocks are **not compiled** and are documentation only (`P99-COMPILE-CONTRACT.md` §3 as amended).

| ROADMAP criterion                                  | closing plans                                                                | oracle(s), instrument of record                                                                                                                                                                                                                                              |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — one Arabic term per object + nav↔title         | **99-10** (agreement + tie-breaks), **99-11..99-15** (the term families)     | `scripts/nav-title-agreement.mjs` at 28 rows with `--control` and a `--json` row-count assertion + `scripts/glossary-census.mjs` classifying EVERY occurrence of every ruled row against a committed sense allowlist, per-row and per-slice; fresh repo-wide re-run at 99-25 |
| 2 — Arabic dates, Latin digits                     | **99-09**                                                                    | `tests/e2e/99-ar02-dates.spec.ts` run by 99-09's own `command:` oracle — one path, `--list` count hardcoded at 8, incl. the UI99-C3 `/activity` relative-time pair; + `check-date-formatting.mjs` kept green; fresh re-run at 99-25                                          |
| 3 — no English under `dir="rtl"`, 4 named surfaces | 99-04 (C6), 99-05 (C8), 99-06 (C7 ×3), 99-08 (C5)                            | `tests/e2e/99-ar03-leak.spec.ts`, each surface's own test invoked by its lane via `-g` with the count hardcoded; the C7 banner driven by a committed three-status fixture, never a skip; full 10-test run at 99-25                                                           |
| 4 — no dot-form key with English default           | 99-04..99-08 (authoring), **99-16** (the proof), **99-17..99-24** (the drop) | `scripts/i18n-audit-strict.mjs` `twoArgTotal === 0` as the closing predicate (the acceptance grep is demoted to a diagnostic); `partA_maskfinder.py` zero unresolved prefixes; `resolve-check.mjs` green + `neg-taskcard.mjs` 3× `MISS=true` text-asserted                   |

Requirements (D-01): AR-01 → 99-02/99-10..99-15 (+01,25); AR-02 → 99-09 (+01,25); AR-03 →
99-04/05/06/08 (+01,25); AR-04a → 99-04..08 authoring + 99-16 proof + 99-17..24 drop; AR-04b →
99-03 flatten + 99-04..08 resolution + 99-16 strict zero.

## 3. Decision coverage — the honest reading

`node scripts/decision-coverage.mjs` now reports **passed: true, 39/39**. That number needs its
mechanism stated rather than banked:

- **34 are substantive citations** — the decision is named in a plan whose body acts on it.
- **D-29 was the one REAL gap** the overseer identified, and it is repaired with substance:
  99-01, 99-04, 99-05, 99-06, 99-08, 99-09 and 99-10 each cite a `UI99-Cn` row AND carry the
  rendered `command:` oracle that closes it.
- **D-01, D-03, D-36, D-37 reach the matcher through ONE truth in 99-25** — the truth that orders
  the honored-evidence table for the five waived decisions to travel verbatim into the register.
  That truth is load-bearing (it is the waiver's stated condition), but it is also the whole
  reason those four tokens now match. **The honest reading is 34 substantive + 5 waived on
  machine evidence, not 39 earned.** No citation was added to move the matcher, and none was
  removed to lower it — the mechanism is reported instead.
- **D-39** is cited substantively in fifteen plans, because the lane cuts this revision performs
  ARE the D-39 act.

## 4. Oracle RED register (contract §10 item 6) — with the honest decomposition

All **59** compiled `command:` oracles were extracted FROM THE COMPILED GRAPH and executed under
`bash -lc` against the unfixed tree: **59/59 exit non-zero (RED)**, plus 1 `judge` oracle.

The decomposition, because "59/59 RED" carries an implication it does not support on its own:

- **9 are defect-observed** — the oracle sees the live defect and names it: the nested subtree
  present (99-03 ×2), the dynamic carriers listed by the maskfinder (99-04, 99-05, 99-06), the
  inversion guard firing on the pre-flatten tree (99-07), the nav mask literal (99-08), the 26
  English-name date literals (99-09), the intake title (99-10).
- **50 are instrument-absent** — they fail because a 99-01/99-02 artifact does not exist yet.
  They CANNOT pass with the work undone, and their discriminating clauses activate the moment the
  instruments land; 99-01's and 99-02's own gates are what prove those instruments discriminating
  (fixture self-check with a wrapped positive control, planted nav mismatch, planted banned
  glossary occurrence) before any repair lane leans on them.

This ratio is worse than the first draft's 11/9 and that is a consequence, not an accident: this
revision replaced two closing instruments with drilled ones and moved every rendered proof from
inert `<verify>` prose into compiled `command:` truths, so more oracles now route through
artifacts that do not exist at HEAD.

Keep-true clauses (resolve-check green, neg-taskcard 3×MISS, the date guard, `قائمة الاستقبال`
presence) are NEVER an oracle's only content and are labelled keep-true where they appear.

## 5. Contract §10 checklist — walked, machine-checked

1 ✓ 25 files `99-NN-PLAN.md`. 2 ✓ every plan lists its own SUMMARY. 3–4 ✓ compile passed; 59
`command` + 1 `judge`, exact-shaped. 5 ✓ all 59 carry an inline `PATH="/opt/homebrew/bin:$PATH"`
(machine-checked: 0 missing). 6 ✓ §4 — 59/59 RED. 7 ✓ deps resolve. 8 ✓ `assertWriteScope`
passed. 9 ✓ **0 `@` refs dropped at compile** (machine-checked per plan; the first draft's
surviving `$id` casualty is now named in prose and carried in `files_modified`). 10 ✓
`routing.floor: frontier` on all 25. 11 ✓ no `99-NN-SUMMARY.md` exists. 12 ✓ exogenous paths:
**0 hits** across every compiled `files[]`.

## 6. Compile probe — verbatim output

```
25 tasks
P99-01 [] 5 14
P99-02 [] 6 15
P99-03 [ 'P99-01', 'P99-02' ] 110 12
P99-04 [ 'P99-02', 'P99-03' ] 10 10
P99-05 [ 'P99-02', 'P99-03' ] 26 10
P99-06 [ 'P99-02', 'P99-03' ] 21 10
P99-07 [ 'P99-02', 'P99-03' ] 39 13
P99-08 [ 'P99-07' ] 50 13
P99-09 [ 'P99-02', 'P99-03', 'P99-07', 'P99-08' ] 25 8
P99-10 [ 'P99-04', 'P99-05', 'P99-06', 'P99-07', 'P99-08', 'P99-09' ] 12 14
P99-11 [ 'P99-10' ] 34 9
P99-12 [ 'P99-11' ] 44 9
P99-13 [ 'P99-12' ] 39 9
P99-14 [ 'P99-12' ] 34 9
P99-15 [ 'P99-12' ] 20 9
P99-16 [ 'P99-13', 'P99-14', 'P99-15' ] 1 9
P99-17 [ 'P99-16' ] 45 9
P99-18 [ 'P99-16' ] 31 9
P99-19 [ 'P99-16' ] 37 9
P99-20 [ 'P99-16' ] 36 9
P99-21 [ 'P99-16' ] 29 9
P99-22 [ 'P99-16' ] 38 9
P99-23 [ 'P99-16' ] 15 9
P99-24 [ 'P99-16' ] 26 9
P99-25 [
  'P99-17', 'P99-18',
  'P99-19', 'P99-20',
  'P99-21', 'P99-22',
  'P99-23', 'P99-24'
] 2 12 HUMANGATE
```

## 7. UNSETTLED — one item, and it is not a default

The first draft carried two. Both are closed: the nav↔title tie-breaks were RULED
(`RULING-P99-05` §3) and the title-wins default is dead; D-23's boundary at the mass drop was
confirmed (`RULING-P99-05` §4) and amended into the context.

What remains open is not a planner default but a standing escalation route: **any FURTHER
disagreeing nav pair discovered during 99-10's 28-row walk escalates to the overseer by name and
is left unrepaired**, leaving that task RED. A worker never applies an invented Arabic
information architecture. This is written into 99-10's acceptance, not left to judgement.

PLAN-INDEX-END
