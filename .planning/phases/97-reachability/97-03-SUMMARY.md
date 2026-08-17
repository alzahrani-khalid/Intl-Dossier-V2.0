# 97-03 SUMMARY — the INBOUND-LINK instrument + both closing derivations

**Plan:** `97-03` (Wave 1, `autonomous: true`, `depends_on: []`)
**Requirement:** NAV-04 · **Serves criterion 4** (evidence only — this plan decides no route)
**Branch:** `milestone/v10.0-trust` · **Base HEAD at start:** `4cf27100e`
**Commits:** `fa932230f` (instrument), plus the `.planning/` commit carrying this file
**Date:** 2026-08-17

---

## What was done, per task

### Task 1 — `scripts/inbound-link-classify.mjs` (NEW, 362 lines)

Read in full first: `scripts/trigsweep-classify.mjs` (the analog), `97-RESEARCH.md`
§INBOUND-LINK instrument, `97-PATTERNS.md` §NAV-04(d), `navigation-config.ts` (all 242 lines).

Mirrors trigsweep's four structural moves:

- **(a) POPULATION enumerated mechanically** — parses `FileRoutesByFullPath` out of
  `frontend/src/routeTree.gen.ts` and **re-derives it on every run**. D-08 is printed on the
  population line itself, so a consumer cannot read the count as a constant. `--route-tree <path>`
  overrides the input (implemented — it is what makes the fail-closed path drivable).
- **(b) UNION of the ten known forms**, each a named regex in a `FORMS` array, tested against a
  4-line context window so multi-line JSX (`<Link\n  to=`) and multi-line option objects
  (`navigate({\n  to:`) are not invisible. The output names WHICH form matched. Search root
  `frontend/src`, excluding `routeTree.gen.ts` and `**/__tests__/**`. Every match is additionally
  tagged `LIVE` / `NON-RENDERED (demo-only)` (`components/modern-nav/`,
  `routes/modern-nav-standalone.tsx`) / `NON-RENDERED (dead module)` (`--dead <file,...>`, which
  **exits 2 if a named file is absent** rather than reporting its no-hits as a zero). Only `LIVE`
  counts.
- **(c) FULL-PATH BOUNDARY MATCH, LONGEST WINS.** A reference matches a route when it equals it or
  continues it at `/`, `?` or `#`, and is attributed to the **longest** route it matches. That one
  rule satisfies both halves of the plan's clause (c): `/approvals` cannot satisfy
  `/admin/approvals` (prefix-anchored), and `/dossiers/persons/$id` cannot satisfy
  `/dossiers/persons` (longest-match gives the deeper route its own references). The generated tree
  spells index routes with a trailing slash (`/approvals/`, `/admin/`), so route paths are
  trailing-slash-normalised and a caller may query either spelling — **203 raw spellings, 186
  distinct destinations**, both printed.
- **(d) RESIDUAL PRINTED** — every route-shaped reference resolving to a reported path but matching
  no known form, with `file:line`, rendered class and the raw line.
- **(e) PINS** — control (`/admin/ai-settings` ≥ 1 LIVE), boundary
  (`/admin/approvals` ≠ `/approvals`, with a message that says re-derive rather than loosen), demo
  (`navigationData.ts`'s `/monitoring` is `NON-RENDERED (demo-only)`). A broken pin is **exit 1**.
- **(f) EXIT CONTRACT** — `0` classified / `1` pin broke / `2` `UNABLE TO MEASURE — <reason>`.
- **(g)** `POPULATION DEFINITION:` / `FLOOR:` / `CEILING:` / `LIVE means …` lines before the table.
- **(h)** `NAV-CONFIG ENTRY: <path> <file>:<line>` or `… NONE` per reported path.

House style matches the analog: `.mjs`, no semicolons, single quotes, no dependencies, all reads via
`node:fs` so the ugrep wrapper is never in the path.

**One deliberate addition to the stated blind spots.** The independent cross-check (below) surfaced
`CommandPalette.tsx:283`'s `pattern: /^\/admin/` — an unquoted route-shaped **regex literal**, which
the quoted-string extractor cannot see. Excluding it is correct (it is a section predicate, not a
link origin) but its invisibility is a blind spot, not a proof of absence, so it was added verbatim
to the instrument's own `POPULATION DEFINITION` line and therefore to the record that quotes it.

### Task 2 — `.planning/phases/97-reachability/97-POPULATIONS.md` (NEW)

Both closing derivations, each in the `95-DEAD-04-DECISION.md` §"Ruling condition 1" shape (command,
output pasted, INSIDE, OUTSIDE, the instrument test proving the zeros are real):

- **§1 ROUTE population** — the P95 command and its number, D-08 stated, blind spots stated, then
  the ADMIN sub-population and the delta.
- **§2 INBOUND-LINK population** — the nine-candidate run pasted in full, the residual
  hand-classified, blind spots quoted verbatim from the instrument so document and tool cannot
  drift, FLOOR and CEILING both restated, the control result recorded, plus **§2c** a second
  independent instrument test of all five zeros.
- **§2b LIVE NAV STATE** — the nine `NAV-CONFIG ENTRY:` lines re-derived at HEAD, as a table, with
  the "candidate ≠ measured-zero" warning stated plainly.
- **§3** — what this file does not decide, and the four intended-broken exclusions by name.

---

## The numbers this SUMMARY is required to record

| item                                   | value                                                                                                                                                                          | note                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ROUTE count, derived on the day        | **203** full paths (186 distinct after trailing-slash normalisation)                                                                                                           | **expected to move** — 97-11 deletes routes and the tree regenerates (D-08). P95 pinned 202; `/calendar` landed in P96. No gate here freezes it.                           |
| ADMIN sub-population, derived          | **8** — `/admin/`, `/admin/ai-settings`, `/admin/ai-usage`, `/admin/approvals`, `/admin/data-retention`, `/admin/field-permissions`, `/admin/preview-layouts`, `/admin/system` | the register (`REQUIREMENTS.md:135`) says 9                                                                                                                                |
| stated delta                           | **−1 versus the register's 9, stated not absorbed**                                                                                                                            | the eighth member is the redirect-only `/admin/` index (`admin/index.tsx:6`). A reader counting _pages_ would say 7. `97-09` records the delta; it does not pick a number. |
| criterion-4 candidate set              | **9** = 8 admin + `/monitoring`                                                                                                                                                |                                                                                                                                                                            |
| residual count (nine-candidate run)    | **0**                                                                                                                                                                          | a real zero, not an unrun channel — the three-path control query printed **RESIDUAL (1)** in the same session                                                              |
| residual lines hand-classified         | **3** — R1 `not-a-link`, N1 + N2 `non-rendered`                                                                                                                                | R1 = `positions/$id.tsx:49` `routeId.endsWith('/approvals')`, a tab-state predicate over the current match, not a navigation origin                                        |
| pinned control result                  | **`/admin/ai-settings` → 2 LIVE inbound links** in the same run as every zero                                                                                                  | `navigation-config.ts:178` (nav data) + `admin/index.tsx:6` (redirect)                                                                                                     |
| pinned boundary result                 | `/admin/approvals=0` vs `/approvals=1` — **different**, matcher doing work                                                                                                     | `navigation-config.ts:212-217`'s item **id** is `admin-approvals` but its **path** is the top-level `/approvals`                                                           |
| pinned demo result                     | `navigationData.ts:262` `/monitoring` → `NON-RENDERED (demo-only)`                                                                                                             |                                                                                                                                                                            |
| paths marked `needs-execution-recheck` | **NONE**                                                                                                                                                                       | all nine resolved statically; no candidate needs a runtime recheck for its inbound-link state                                                                              |
| live nav state                         | **4 of 9 candidates already have a sidebar row** (`:178`, `:184`, `:196`, `:208`); 5 do not                                                                                    | this is the fact the plan set was previously blind to — without it, 97-10 would add four duplicate rows                                                                    |

---

## GATE DRILL — both directions, OBSERVED, per gate

Gates are byte-identical to the accepted set at `d561738fa`. **No gate was edited.** Both were run
under `bash` (not zsh) because gate 2 relies on word-splitting a `$(…)` expansion in its `for` loop;
zsh does not word-split, so a zsh run would silently loop once over one joined word.

`97-12` consolidates the two rows below into `97-GATE-DRILL.md`, of which it is the single writer.

| plan.gate   | C1 red (how)                                                                                                                                                                                                                            | C1 green (how the done state was constructed)                                                                                                                                                                                                                                                                        | C2–C10 notes                                                                                                                                                                                                                                                                                                                                                              | verdict   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- | --------- |
| 97-03.task1 | **rc=1** — gate run against a constructed scratch tree `/tmp/p97-03-undone/` holding the ANALOG (`trigsweep-classify.mjs`, clause 1 `rc=0`) but **not** the subject (clause 2 `rc=1`). Red attributable to the subject, not to tooling. | **rc=0** on the real tree with the instrument written. The gate itself additionally drives the **constructed failure state** (`--route-tree` at an absent file → **exit 2** + `UNABLE TO MEASURE`) and the constructed success state (exit 0) in the same run, so no separate scratch tree was needed for that half. | C4: the only numeric threshold is the fail-closed probe's `-eq 2`, an exit code the script's own contract defines — reachable by construction. C5: the analog's existence is asserted first as the instrument control on the search root. No `2>/dev/null`. The expected-nonzero probe's exit code is read directly inside a brace group, so the `&&` chain is preserved. | **SOUND** |
| 97-03.task2 | **rc=1** — run on the **undone tree**, before `97-POPULATIONS.md` existed. Attribution proved in the same step: `test -f <F>` → `rc=1`, subject absent.                                                                                 | **rc=0** after the record was written. Re-verified post-commit.                                                                                                                                                                                                                                                      | C4: all four thresholds shown reachable with their measured values (below). C10: the per-path loop checks each of the eight paths **one at a time** (`                                                                                                                                                                                                                    |           | exit 1`), so a miss names WHICH path rather than hiding in a count. | **SOUND** |

### Gate 1 — `97-03` Task 1, pasted output

RED (constructed undone tree):

```
=== GATE1 RED (scratch tree, subject absent) ===
GATE1-RED-RC=1
--- red attribution: analog control present, subject absent ---
  analog(clause 1) rc=0 (0 = present, so the red is NOT a missing-analog artifact)
  subject(clause 2) rc=1 (1 = absent, THIS is the red)
```

GREEN (real tree):

```
=== GATE1 GREEN (real tree) ===
GATE1-GREEN-RC=0
--- fail-closed probe output (the constructed failure state the gate itself drives) ---
UNABLE TO MEASURE — route tree absent: /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/does-not-exist.ts
--- its exit code, read directly ---
FAILCLOSED-RC=2
```

Post-commit re-verify: `GATE1-RC=0`.

### Gate 2 — `97-03` Task 2, pasted output

RED (undone tree, before the record existed):

```
GATE2-RED-RC=1
SUBJECT-PRESENT-RC=1 (1 = subject absent, the reason for the red)
```

GREEN (done state), with every derived threshold shown reachable:

```
=== GATE2 GREEN (done state) ===
GATE2-GREEN-RC=0
--- derived thresholds in that gate, shown reachable ---
  RESIDUAL lines           = 4   (threshold >= 1)
  verdict-vocabulary lines = 9   (threshold >= 1)
  NAV-CONFIG ENTRY lines   = 18   (threshold >= 9)
  LINKED admin nav paths   = 4   (threshold >= 1)
  looped nav paths         : /admin/ai-settings /admin/data-retention /admin/field-permissions /admin/system
```

Post-commit re-verify: `GATE2-RC=0`.

### Third direction — the instrument's own exit 1, falsified and restored

The gates drive exits 0 and 2. Exit 1 (a pinned invariant breaking) is the path that stops a
loosened matcher from passing quietly, and asserting it works is not the same as observing it. It
was drilled in a scratch repo skeleton at `/tmp/p97-03-pinbreak/` (the script derives its repo root
from its own location, so a copy reads that skeleton's tree):

```
=== PIN FALSIFICATION DRILL: control /admin/ai-settings deleted from nav config ===
  BROKEN   control  /admin/ai-settings is known-linked (navigation-config.ts)
      ZERO — the sweep can no longer see a link it is KNOWN to see, so every zero in this run is uninterpretable. Fix the classifier; do not read the zeros.
  ok       boundary /admin/approvals vs /approvals resolve to DIFFERENT counts
  ok       demo     navigationData.ts /monitoring entry is NON-RENDERED (demo-only)
INVARIANT BROKE — 1 pin(s): control  /admin/ai-settings is known-linked (navigation-config.ts)
PINBREAK-RC=1 (expected 1)

=== same scratch tree, control RESTORED — pin must go green again ===
PINRESTORED-RC=0 (expected 0)
```

All three exit codes of the declared contract are now OBSERVED, not asserted: `0` / `1` / `2`.

---

## Instrument-testing the zeros — two independent tests, not one

Five of the nine candidates measured **0 LIVE inbound links** (`/admin`, `/admin/ai-usage`,
`/admin/approvals`, `/admin/preview-layouts`, `/monitoring`). A zero from an untested instrument is
not a measurement, so both of these ran:

1. **The pinned control, in the same run** — `/admin/ai-settings` resolved 2 LIVE links. The
   classifier can still see links.
2. **An independent raw substring sweep** (separate code path: plain `String.includes`, no forms, no
   boundary rule) over the same file set, with `/admin/ai-settings` as its own control (4 hits,
   including `navigation-config.ts:178`). Every hit in every zero row was accounted for: JSDoc
   `Route:` banners and `createFileRoute` self-declarations, `/api/…` paths (a different
   population), `i18n` JSON imports, the demo-only `modern-nav` tree, and
   `CommandPalette.tsx:283`'s `/^\/admin/` regex predicate. **No hit in any zero row was an inbound
   link the classifier missed.** Recorded as §2c of the record.

---

## Compliance notes

- **Standing laws:** branch `milestone/v10.0-trust` throughout; no branch created or switched; `main`
  untouched; no PR. Both commits used explicit pathspecs (`git commit … -- <paths>`); `git commit -a`
  was never used. Git identity left as configured.
- **The 7 exogenous paths were never touched.** `git status --porcelain` for them is byte-identical
  to session start (5 ` M`, 2 `??`), verified after the code commit.
- **The tree is shared with parallel Wave-1 workers.** Other workers' artifacts
  (`frontend/src/lib/dossier-type-guards.ts`, four `tests/e2e/97-*.spec.ts`) appeared in
  `git status` during this plan and were **left alone** — neither staged nor committed here.
- **No gate text was edited**, and neither gate needed a repair to go green.
- `timeout` was not used. Exit codes were captured directly, never through a pipe. Absolute paths
  throughout. Scratch work was confined to `/tmp`; the repo tree carries only the two planned files.
- No credential was read or echoed; the instrument reads source text only and prints route paths and
  `file:line`.

## What 97-09 gets from this

Nine rows of measured, bounded, control-tested evidence, with the one distinction its decision
vocabulary was missing: **4 of the 9 candidates already have a live sidebar row**, so "no inbound
link" and "named by criterion 4" are different sets and the table must not conflate them.

## BLOCKED

_(empty — nothing blocked this plan)_

SUMMARY-END
