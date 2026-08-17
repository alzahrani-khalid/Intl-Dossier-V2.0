---
phase: 97-reachability
plan: 10
wave: 4
status: work-complete-all-gates-green
requirements: [NAV-04]
files_modified:
  - frontend/src/components/layout/navigation-config.ts
  - frontend/src/components/keyboard-shortcuts/CommandPalette.tsx
  - tests/e2e/97-nav04-rows.spec.ts
gate_1: GREEN
gate_2: GREEN
gate_3: GREEN
palette_branch: BRANCH-A
---

# 97-10 — the NAV ENTRY half of the decision table, and the palette leak it would have widened

**Executed 2026-08-17** on `milestone/v10.0-trust`. Base HEAD at start `5e04c3423`; work committed as
**`d0ee9f18b`** (three files, explicit pathspec), this SUMMARY committed separately.

All three gates are green in BOTH directions, and the behavioural half the plan labelled
`NOT CONSTRUCTED: requires the running dev stack` **was constructed and observed** — the dev stack
was live, so the click-through oracle ran for real. Twelve wrong states were constructed and each
observed red. **No gate text was edited.** `## BLOCKED` is empty; two observations that are not
blockers are recorded below under their own heading.

---

## Task 1 — exactly the three rows the table ruled `NAV ENTRY`, and nothing else

Read first, in full: `97-NAV04-DECISIONS.md`, `97-CONTEXT.md`, `GATE-STANDARD-P92.md`,
`97-UI-SPEC.md` §NAV-04, `RULING-P97-01`, `RULING-P97-03`, `RULING-P97-14`, `97-09-SUMMARY.md`,
`97-05-SUMMARY.md` (its `## BLOCKED`, which changed how I wrote the URL assertions),
`navigation-config.ts` in full, `Sidebar.tsx` in full, `95-monitoring-mounts.spec.ts` in full, both
locale `common.json` navigation blocks, and the three destination route files.

**The table is post-`RULING-P97-14`, and that matters — the ruling flipped a row my plan's prose did
not anticipate.** The plan expected "`/admin/ai-usage` and, if the table ruled it so, `/monitoring`";
the amended table rules **three**. `/admin/approvals`, which 97-09 recorded `PARKED-RE-ESCALATED`,
was re-ruled `NAV ENTRY` by `RULING-P97-14` §1. I executed the table, not the plan's prediction, as
the plan's own action text instructs ("the table governs, not this sentence").

### The eight tokens read, and the entry each one implies — one to one

| #   | route                      | token (read at execution)   | entry added                   | id                          | icon                          |
| --- | -------------------------- | --------------------------- | ----------------------------- | --------------------------- | ----------------------------- |
| 1   | `/admin/ai-settings`       | `ALREADY-REACHABLE`         | **none** — it already has one | —                           | —                             |
| 2   | `/admin/system`            | `ALREADY-REACHABLE`         | **none**                      | —                           | —                             |
| 3   | `/admin/field-permissions` | `ALREADY-REACHABLE`         | **none**                      | —                           | —                             |
| 4   | `/admin/data-retention`    | `ALREADY-REACHABLE`         | **none**                      | —                           | —                             |
| 5   | `/admin/ai-usage`          | `NAV ENTRY`                 | **added**                     | `admin-ai-usage`            | `BarChart3` (UI-SPEC default) |
| 6   | `/admin/approvals`         | `NAV ENTRY`                 | **added**                     | `admin-approval-management` | `CheckCircle`                 |
| 7   | `/admin/preview-layouts`   | `OWNED-ELSEWHERE-UNTOUCHED` | **none** — Phase 102 owns it  | —                           | —                             |
| 8   | `/monitoring`              | `NAV ENTRY`                 | **added**                     | `admin-monitoring`          | `Gauge` (UI-SPEC default)     |

**Three tokens, three entries. `ROWS = 3`, `PRESENT = 3`, derived in the same run and compared.**

**Rows that deliberately received NOTHING, stated rather than left to be inferred** (the plan's
`<output>` requires this explicitly):

- The **four `ALREADY-REACHABLE`** rows. Each already has exactly one live sidebar row; a second
  would render a duplicate. Their occurrence counts were 1 before my edit and are 1 after — the
  gate's per-candidate `-eq 1` (not `>= 1`) is what makes that checkable rather than asserted.
- **`/admin/preview-layouts` — `OWNED-ELSEWHERE-UNTOUCHED`, owner Phase 102** (`PREVIEW-HOLLOW-01`,
  assigned by `RULING-P97-14` §2). No entry, no edit, no deletion. Its occurrence count is 0.
- **`/admin/` (the redirect-only index)** carries a row and **no token** by design, and is excluded
  from the gate's candidate loop because its literal is a prefix of every other admin path. It gets
  no entry; its redirect target is row 1, which is reachable.

**`admin-approvals` was NOT repurposed.** The pre-existing `admin-approvals` item sits in the same
group but its `path` is the **top-level `/approvals`** — a different route. I added a new item rather
than repointing it, so both surfaces exist. My oracle pins the `/admin/approvals` href count at 1 and
clicks it by its own accessible name, which is what proves the click landed on the admin panel and
not on its neighbour.

**No status surface added** (UI-SPEC §NAV-04): no badge, no dot, no "dev only" tag, no disabled
style, no tooltip caveat, no muted text on any of the three rows — including `/monitoring`, which is
data-degraded in production. Nothing reordered, no group added, no section header, no visual
differentiation from the sibling rows. Three icons (`CheckCircle`, `BarChart3`, `Gauge`) joined the
file's single existing lucide import block; none was already spent in the sidebar (`Activity` is on
`/activity` and was not duplicated).

### Label keys — re-derived in BOTH locales SEPARATELY, not averaged (D-12)

All three keys already shipped in both bundles, so **no locale file needed editing**:

```
  aiUsage          EN=1 AR=1     "AI Usage"             / "استخدام الذكاء الاصطناعي"
  monitoring       EN=1 AR=1     "Monitoring"           / "المراقبة"
  adminApprovals   EN=1 AR=1     "Approval Management"  / "إدارة الموافقات"
```

`navigation.adminApprovals` is a distinct key from `navigation.approvals` (the top-level row's
label), so the two approvals rows do not share copy.

---

## Task 2 — the palette derives `isAdmin`; **BRANCH A executed**

The token was read BEFORE branching, as the gate requires:
`DECISION PALETTE-ADMIN-01: BRANCH-A` at `97-NAV04-DECISIONS.md:489`, count **exactly 1**.

Branch A's stated blocking condition does not hold — `useAuthStore` is a zustand hook needing no
provider, and the palette mounts inside `__root.tsx`. Three edits, nothing else:

| Line (as committed) | Change                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:110`              | `import { useAuthStore } from '@/store/authStore'`                                                                                                                                                         |
| `:445-452`          | `const { user } = useAuthStore()` + `const isAdmin = user?.role === 'admin' \|\| user?.role === 'super_admin'`, with the comment naming `PALETTE-ADMIN-01` and the visibility-vs-authorization distinction |
| `:529, :531`        | `createNavigationGroups(…, isAdmin)` replaces the hardcoded `true`; the `useMemo` dep array `[]` becomes `[isAdmin]`                                                                                       |

The check is **byte-for-byte the Sidebar's own** (`Sidebar.tsx:54`), off the same store, so the two
nav surfaces cannot drift. The dep array is the non-cosmetic half: `[]` would have captured the first
render's value and re-frozen the same bug in a subtler form — a memo computed before the role
resolves. `W4` and `W5` in the drill below are the two wrong states that prove the gate catches both
the reverted literal and a drifted memo anchor.

**Nothing else in the palette was touched** — no new commands, no reordering, no styling, no keyboard
behaviour. In particular `CommandPalette.tsx`'s `DOSSIER_TYPE_ORDER` parallel-truth site, which
`97-NAV04-DECISIONS.md` §6 routes to `PARALLEL-TRUTH-01` / `97-12`, was left alone: my action forbids
unrelated palette edits and that site has an owner.

**This is a VISIBILITY fix, not an authorization one.** The palette leaked the existence and labels
of admin surfaces to every user; it never granted access. The admin routes stay URL-reachable
regardless, each still guarded by `beforeLoad: requireAdmin`, and server-side authorization is Phase
100's RLS territory. `T-97-30` remains accepted, not fixed.

The free consequence 97-05 recorded holds: the Elected Officials row propagates into the palette
through the same `createNavigationGroups` call and needed no work.

---

## Task 3 — `tests/e2e/97-nav04-rows.spec.ts`, and the behavioural half actually run

`// @covers NAV-04`, built on `95-monitoring-mounts.spec.ts`: inline auth from `.env.test`, its
`INTERNAL_STRING` regex taken verbatim **including its deliberate narrowing** (the monitoring health
widget legitimately renders the word `supabase` as a monitored service name, so the arm is
leak-shaped — `supabase.co` / `supabase-js` / `SupabaseClient` — not the bare vendor word),
`--project=chromium-en --no-deps`.

**ROLE and VIEWPORT are named in every title and proven in-run, not inferred.** Each test sets the
viewport to **1400×900** explicitly before anything renders, and asserts a pre-existing
administration row (`/admin/ai-settings`) is in the live `aside[role="navigation"]` _before_ clicking
— that row can only be there when `createNavigationGroups` emitted the group, i.e. when the session
resolved to an administrator. The role is therefore a measurement, not an assumption from a username.
Zero `modern-nav` references: every claim is a click on a rendered affordance, never a config object.

### Per-test colour — COUNTED from the JSON, never inferred from a zero exit

```
  ok  | passed  | /admin/ai-usage row — adminOnly user, desktop 1400
  ok  | passed  | /admin/approvals row — adminOnly user, desktop 1400
  ok  | passed  | /monitoring row — adminOnly user, desktop 1400
  ok  | skipped | hidden from an ordinary non-admin user, desktop 1400      <- test.fixme
```

`EXP = 3` (declarations matching `^\s*test(`), `PASSED = 3`, `D = T = 4`. The fixme'd declaration is
counted in `T` (so the title-equality stays satisfiable) and **excluded from `EXP`** (so it can never
be counted as proven). Note the JSON reports the fixme'd spec as `ok: true` with status `skipped` —
exactly the indistinguishability the count exists to defeat.

### The non-admin negative is `test.fixme`, and the reason is MEASURED not assumed

`.env.test` carries exactly `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` — one administrator. The six
role-scoped `E2E_*` keys are absent (E2ECRED-01, Phase 101; D-12 forbids waiting on it).

**I did not stop there — the three committed storage states were probed against the live stack
before concluding**, because `tests/e2e/support/storage/analyst.json` looks like an available
non-admin fixture:

```
analyst.json access token expires_at = 2026-06-04T20:51:20Z   (2.5 months stale)
PROBE url after /dashboard          = http://localhost:5173/login
PROBE landed on /login              = true
PROBE aside count                   = 0
PROBE admin-group link count        = 0
PROBE ops link (/dashboard) count   = 0
```

A negative built on that state would assert "the administration group is absent" and **pass — for the
trivial reason that no sidebar renders at all.** That is a vacuous green wearing a negative's
clothes. So the test is fixme'd with the measurement in its own comment, and its body is the REAL
test rather than a placeholder: it asserts the session authenticated FIRST (the control the analyst
state failed), then that the rows are absent from both the aside and the palette.

**Recorded as `UNABLE TO MEASURE` for 97-12: the hidden-from-non-admins half of NAV-04 is NOT
proven.** An unproven negative is not a proven one. The three greens above are
reachable-for-an-administrator-at-1400 and nothing wider.

`/monitoring`'s assertion is the honest one the plan specifies: each widget must settle to data **or**
to its own inline error testid, and the loading text must be gone. In dev it settled to data; in
production the backend's `NODE_ENV` guard makes both settle to `QueryErrorState`, and a spec
demanding data would assert something the product does not promise. **No DELETE row is asserted here**
— 97-11 owns those.

**One real defect in my own spec, found by running it rather than by reasoning:** the approvals
settle used `.or()` over "the empty copy" and "the table", and the empty copy lives INSIDE the table,
so both branches matched and Playwright failed strict mode. First run: **1 failed, 2 passed, 1
skipped**. Repaired by asserting the table separately and settling on what actually distinguishes the
two terminal states (a per-row Reassign action, or the empty cell), with `.first()` on the
disjunction. The failure and its cause are in the file's comment so the next author does not
re-introduce it.

---

## GATE DRILL — all three gates, BOTH directions, OBSERVED

Gates were extracted **programmatically** from `97-10-PLAN.md`'s `<automated>` blocks into
`/tmp/p97-10-gate{1,2,3}.sh` (byte counts 1101 / 962 / 1110) and run under `bash`, never zsh.
`bash -n` parsed all three: `GATE1-PARSE-RC=0 GATE2-PARSE-RC=0 GATE3-PARSE-RC=0`. **No gate was
edited, and none needed a repair to go green.**

| plan.gate   | C1 red (how)                                                                                                                                                                | C1 green (constructed how)                                                                                                                      | C2–C10 notes                                                                                                                                                                                                                                    | verdict   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 97-10.task1 | **rc=1** on the undone tree: the three `NAV ENTRY` candidates all had `OCC=0`.                                                                                              | **rc=0** after the three entries landed; re-verified post-commit. Four wrong states each observed red.                                          | C4 both thresholds derived in-run and compared (`ROWS=3`, `PRESENT=3`) — the vacuous `BASE=2` floor is gone. C5 both file preconditions asserted first. C10 the per-candidate loop names WHICH path.                                            | **SOUND** |
| 97-10.task2 | **rc=1** on the undone tree: `useAuthStore` count 0 in the palette while the `super_admin` instrument control resolved 1 in `Sidebar.tsx` — a real zero, not a broken grep. | **rc=0** after branch A; re-verified post-commit. Six wrong states red, and the branch-B arm proven SATISFIABLE (green) as well as falsifiable. | C5 the Sidebar control runs in the same chain. C8 the in-memo scoping means an unrelated `true)` in a 1662-line file cannot satisfy or break it. The positive preconditions (>3 lines, contains `createNavigationGroups`) were drilled by `W5`. | **SOUND** |
| 97-10.task3 | **rc=1** on the undone tree: the spec file did not exist.                                                                                                                   | **rc=0** with the real Playwright run against the live stack — `PASSED=3 = EXP=3`. Three wrong states red.                                      | C6 `--no-deps` passed and it is a single path, so the multi-path FILTER hazard does not arise. C10 the D/T equality is `RULING-P97-03` §3 turned into a gate obligation.                                                                        | **SOUND** |

### RED on the undone tree, with attribution (C2) — pasted

Every precondition was proven present in the same step, so none of the three reds is a
missing-input artifact:

```
GATE1-RED-RC=1   GATE2-RED-RC=1   GATE3-RED-RC=1

PRECOND-navconfig-exists-RC=0     PRECOND-decision-table-exists-RC=0
PRECOND-palette-exists-RC=0       PRECOND-sidebar-exists-RC=0
PRECOND-95-oracle-exists-RC=0
ROWS(NAV ENTRY tokens)=3          PALETTE-token-count=1

  /admin/ai-settings           TOKEN=ALREADY-REACHABLE          OCC=1
  /admin/ai-usage              TOKEN=NAV ENTRY                  OCC=0   <- the red
  /admin/approvals             TOKEN=NAV ENTRY                  OCC=0   <- the red
  /admin/data-retention        TOKEN=ALREADY-REACHABLE          OCC=1
  /admin/field-permissions     TOKEN=ALREADY-REACHABLE          OCC=1
  /admin/preview-layouts       TOKEN=OWNED-ELSEWHERE-UNTOUCHED  OCC=0
  /admin/system                TOKEN=ALREADY-REACHABLE          OCC=1
  /monitoring                  TOKEN=NAV ENTRY                  OCC=0   <- the red

  useAuthStore in palette = 0    (subject; THIS is gate 2's red)
  super_admin in Sidebar  = 1    (INSTRUMENT CONTROL — so the zero above is a measurement)
  in-memo 'true)' count   = 1    (the hardcode, still present)

  97-nav04-rows.spec.ts exists RC=1  (1 = absent; THIS is gate 3's red)
```

### GREEN, with every threshold derived in the same run

```
ROWS (NAV ENTRY tokens, from the table)     = 3
PRESENT (those tokens resolving in config)  = 3      EQUAL = yes
per-candidate OCC vs REQUIRED: 8/8 OK  (1,1,1,1,1,0,1,1)
label keys BOTH locales: aiUsage 1/1  monitoring 1/1  adminApprovals 1/1
palette: useAuthStore=2  super_admin=1  memo-range=4 lines  in-memo 'true)'=0
oracle: D=4  T=4  EXP=3  PASSED=3  modern-nav=0
pnpm typecheck: Tasks: 6 successful, 6 total     (gate 1 and gate 2, both runs)

GATE1-GREEN-RC=0   GATE2-GREEN-RC=0   GATE3-RC=0
GATE1-FINAL-POSTCOMMIT-RC=0   GATE2-FINAL-POSTCOMMIT-RC=0   GATE3-FINAL-POSTCOMMIT-RC=0
```

### The WRONG states — twelve, each constructed and observed red

Each harness is the **frozen gate text with exactly ONE variable assignment repointed** at a scratch
copy. That claim is not asserted, it is **proven mechanically**: the harness generator reverses its
own substitution and requires the result to be byte-identical to the frozen gate, or it aborts.
`cd "$R" && pnpm typecheck` still runs against the real repo, so a red is the mutation's and not a
broken scratch workspace. The unmutated copy is green through every harness first — a negative
control that PASSES would only prove something inert had been mutated.

```
HARNESS-PROOF ok x6 (only F / T / P repointed; reversal byte-identical to the frozen gate)
DRILL-CONTROL-G1-F RC=0   DRILL-CONTROL-G1-T RC=0
DRILL-CONTROL-G2-P RC=0   DRILL-CONTROL-G2-T RC=0

W1   DUPLICATE row for an ALREADY-REACHABLE path (/admin/system twice)      RC=1  (expect 1)
W2   a NAV ENTRY row with NO entry added (/admin/ai-usage removed)          RC=1  (expect 1)
W3   entry for an OWNED-ELSEWHERE-UNTOUCHED path (/admin/preview-layouts)   RC=1  (expect 1)
W3b  the table says DELETE for /monitoring while the entry exists           RC=1  (expect 1)
     RESTORED-G1-F RC=0    RESTORED-G1-T RC=0
W4   branch A but the memo still passes the literal `true)`                 RC=1  (expect 1)
W5   memo anchor renamed -> empty sed range (the vacuous-pass probe)        RC=1  (expect 1)
W6   no anchored PALETTE-ADMIN-01 token at all (no default arm taken)       RC=1  (expect 1)
W7   BOTH palette branches written (token count 2)                          RC=1  (expect 1)
W8   branch B elected + palette genuinely UNTOUCHED                         RC=0  (expect 0)
W9   branch B elected + palette EDITED anyway                               RC=1  (expect 1)
     RESTORED-G2-P RC=0    RESTORED-G2-T RC=0
W10  an extra test whose title names no role (D != T)                       RC=1  (expect 1)
W11  spec references the non-rendered nav source                            RC=1  (expect 1)
     RESTORED-G3-F RC=0
W12  a RUNTIME test.skip() inside a declared, role-named test               RC=1  (expect 1)
     D=4 T=4 EXP=3 unchanged, playwright "2 skipped 2 passed", PASSED=2 != EXP=3

STATUS-IDENTICAL-RC=0        (git status --porcelain byte-identical before/after the whole drill)
MY-FILES-MATCH-HEAD-RC=0
POST-RESTORE-MATCHES-HEAD-RC=0
```

**`W12` is the drill the brief specifically demanded, and it is the only one that needed the real
file** — gate 3's Playwright invocation targets a hardcoded relative path, so a scratch repoint
drills the structural greps only. The mutation was a runtime `test.skip()` inside a counted test
body, which leaves the declaration line (and therefore `EXP`) untouched while the test does not run.
`test.skip()` exits 0 and Playwright's own summary calls it a clean run; the JSON `PASSED` count is
what turns it red. The file was byte-restored from a pre-drill copy and verified identical to HEAD.

**`W3b` substitutes honestly rather than pretending.** The criterion asks for "an entry added for a
path whose row says `DELETE`". **No candidate path carries `DELETE` in the real table** — its two
`DELETE` tokens are the dead MODULES 97-11 owns. So `W3` drills the true available instance (an
`OWNED-ELSEWHERE-UNTOUCHED` path) and `W3b` constructs the criterion's literal wording on the table
copy. Both are red; neither claims the real table has a `DELETE` candidate.

---

## Cross-lane and regression checks

- **C9 consumer sweep.** `createNavigationGroups` / `createNavigationSections` have four live
  consumers: `navigation-config.ts` itself, `Sidebar.tsx`, `CommandPalette.tsx`, and
  `hooks/useRecentNavigation.ts`. I renamed nothing, so no repoint is due. Nothing outside my three
  files needed editing.
- **The 97-05 B2 lesson applied — I checked whether my widening breaks a shipped oracle.** The three
  Vitest files that touch these two sources ran green: `CommandPalette.audit.test.tsx`,
  `CommandPalette.analyze.test.tsx`, `tests/unit/routes.test.tsx` — `3 files, 23 tests passed`,
  `VITEST-RC=0`. None pins a nav-item count.
- **ESLint on all three touched files: `LINT-RC=0`.**
- **Concurrent-lane hazard, handled.** 97-11 had two staged deletions (`services/auth.ts`,
  `QuickNavigationMenu.tsx`) sitting in the shared index when I committed. `git commit -F … -- <my
three paths>` committed only mine; verified `0` matches for either deletion in my commit's stat,
  and both were still pending afterwards. I did not `git add -A`, never used `git commit -a`, and
  touched none of 97-11's files. Their work landed separately as `e6ac817f3`; all three of my gates
  were re-run at that tree and stayed green.

---

## Compliance notes

- Branch `milestone/v10.0-trust` throughout; no branch created or switched; `main` untouched; no PR.
- **The 7 exogenous paths were never touched** — `git status --porcelain` for them is byte-identical
  to session start (5 ` M`, 2 `??`), verified before the commit, after the drill, and after restore.
- Git identity left as configured; no `GIT_*` override.
- `timeout` never used. Exit codes captured DIRECTLY — with one caught mistake: my first commit
  attempt read `COMMIT-RC=0` through a pipe while the commit had in fact failed (`-m` placed after
  `--`, and an untracked file cannot be committed by pathspec). The pipe hid it; I re-ran capturing
  the status directly and verified the resulting sha's contents with `git show <sha>:<path>`.
- `command grep` throughout, and **the instrument was tested before being trusted**: `\|` alternation
  and `\s` were both verified against `/usr/bin/grep` on a known-positive control file before any
  count was believed, because the gates depend on both and BSD grep's BRE support for them is not a
  given. Every zero has a same-run positive control.
- ABSOLUTE paths in every command whose cwd was not just set. Scratch work confined to
  `/tmp/p97-10-*`; the repo tree carries exactly three changed files plus this SUMMARY.
- No credential was read or echoed. `.env.test` was sourced into the shell for the Playwright runs
  and only key NAMES were ever printed.
- **97-03's lint-staged stale-index quirk DID recur, on this SUMMARY's own commit.** prettier
  reflowed the markdown tables inside the hook, so afterwards `git status` showed `MM` on the file
  while `git diff HEAD` on it was **empty** — HEAD and the worktree both held the prettier output and
  only the index was stale. Nothing was pending; `git add -- <file>` refreshed the index and the tree
  went clean. Recorded because the `MM` reads like unsaved work and is not. (A `stash@{0}:
lint-staged automatic backup` also sits in the stash list; its contents are Phase 94's
  `94-05-SUMMARY.md` + `WorkBoard.tsx`, so it is **pre-existing and not mine** — left untouched.)
- prettier ran on the spec before commit and the commit hook altered nothing afterwards
  (`git diff HEAD` on all three files is empty). The D/T/EXP counts were re-derived POST-prettier,
  because a reflow that moved a title off its `test(` line would have broken the equality — it did
  not. This SUMMARY's frontmatter is re-checked after its own commit.

---

## Observations that are NOT blockers, recorded rather than absorbed

**1. `97-NAV04-DECISIONS.md` carries stale pre-ruling prose in §3a and §3b.** Its `:251` still says
`/admin/approvals`'s "decision is `PARKED-RE-ESCALATED` … nothing is added", and `:301` still
explains "why the row is `PARKED-RE-ESCALATED` rather than `OWNED-ELSEWHERE-UNTOUCHED`" for
`/admin/preview-layouts`. Both statements were superseded by `RULING-P97-14`, which amended the §2
rows and the tokens (`:155` `NAV ENTRY`, `:156` `OWNED-ELSEWHERE-UNTOUCHED`) but not the narrative
sections underneath. I followed the **anchored tokens and the §2 rows**, which is exactly what the
document's own §1 token contract instructs consumers to do. **I did not edit the file** — 97-09 is
its single writer and it is not in my `files_modified`. Flagged for 97-12 / the overseer: a reader
who reads §3 and not §2 gets the pre-ruling answer.

**2. `hooks/useRecentNavigation.ts:69` still calls `createNavigationGroups(…, true)`.** Same literal,
different surface — and on examination **not the same defect**, which is why I am recording it rather
than filing it. That call builds a path→title map so a recently-visited page can be labelled; it
emits no commands and surfaces no admin affordance. A non-admin cannot populate an admin entry there
in the first place, because every admin route is guarded by `beforeLoad: requireAdmin`. It is
outside my `files_modified` and I did not touch it. If a later phase wants the hardcode gone
repo-wide, this is the third and last call site.

---

## BLOCKED

_(empty — nothing blocked this plan. The one thing this plan could not MEASURE, the
hidden-from-non-admins half of NAV-04, is recorded above as `UNABLE TO MEASURE` with the probe
output that establishes why, and is handed to 97-12 as weakest-point material rather than reported as
a blocker.)_

SUMMARY-END
