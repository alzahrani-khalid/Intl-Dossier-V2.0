# 97-11 SUMMARY — the DELETE half of the NAV-04 decision table

**Plan:** `97-11` (Wave 4, `autonomous: true`, `depends_on: [97-09]`)
**Requirement:** NAV-04 · **Serves criterion 4** (this plan executes DELETE rows; it decides nothing)
**Branch:** `milestone/v10.0-trust` · **Base HEAD at start:** `1a0dabb0b`
**Commits:** `e6ac817f3` (the two module deletions), plus this SUMMARY
**Date:** 2026-08-17

---

## The headline, stated before the detail

**ZERO routes were deleted.** Both conditional route triggers were REFUTED by `97-09` and resolved
by `RULING-P97-14`, so neither route row says `DELETE`:

```
DECISION /admin/approvals: NAV ENTRY
DECISION /admin/preview-layouts: OWNED-ELSEWHERE-UNTOUCHED
```

**Two modules were deleted**, both on anchored `DELETE` tokens:

```
DECISION frontend/src/services/auth.ts: DELETE
DECISION frontend/src/components/layout/QuickNavigationMenu.tsx: DELETE
```

`routeTree.gen.ts` was **not touched and needed no regeneration** — neither deleted file is a route
file. This plan performed no judgement: every deletion points at a row written a wave earlier by a
different plan.

---

## What was done, per task

### Task 1 — the authorised route deletions: none, and the tree left alone

Read first, in full: `97-NAV04-DECISIONS.md`, both approvals route files,
`admin/preview-layouts.tsx`, `95-DEAD-04-DECISION.md`, `RULING-P97-01`, `RULING-P97-03`,
`RULING-P97-14`, `97-CONTEXT.md`, `GATE-STANDARD-P92.md`, `97-09-SUMMARY.md`.

The table authorises no route deletion. Per the plan's action, the rows' evidence was
**re-confirmed against the tree as it stands now** rather than trusted from a wave ago — a stale
authorisation is not an authorisation, and this direction matters just as much when the verdict is
"keep": a row that has gone stale in the KEEP direction would leave a route standing that should
not.

**`/admin/approvals` — the row's decisive fact re-derived, and it holds.** `RULING-P97-14` turned on
this route being the sole path to a real capability:

```
$ command grep -rn "approvals-reassign" <repo>/frontend/src --include='*.ts' --include='*.tsx'
frontend/src/routes/_protected/admin/approvals.tsx:69:  const response = await fetch(`${API_BASE_URL}/approvals-reassign?id=${approvalId}`, {
REASSIGN-RC=0        <- exactly ONE reference, and it is the route file itself
CONTROL (same shape, "positions-list") = 3 hits   <- the instrument sees edge-function names
```

The rest of the comparison also still holds, re-derived on the day: 294 vs 132 lines,
`AdminApprovalsPage` + `beforeLoad: requireAdmin` (`:34`, `:41`) vs `MyApprovalsPage` with no guard,
i18n `admin` vs `approvals`, query keys `['admin','approvals','under_review']` vs `['approvals','my']`.

**`/admin/preview-layouts` — the hollow-loop evidence re-derived, and it holds.**

```
importers of usePreviewLayouts:
  frontend/src/routes/_protected/admin/preview-layouts.tsx     <- one, and it is the route itself
entity_preview_layouts, by file:
  frontend/src/hooks/usePreviewLayouts.ts | frontend/src/types/database.types.ts
  backend/src/types/database.types.ts | supabase/migrations/{20260115100001,20260627000001,20260627000002}
CONTROL (same shape, "aa_commitments") = 16 files              <- the instrument sees table names
```

Owner **Phase 102** per `RULING-P97-14` §2. Untouched here, as the row says.

Neither authorisation proved stale. Nothing was deleted, and no nav entry was improvised for
`/admin/approvals` — that entry is `97-10`'s and it landed independently at `d0ee9f18b`.

### Task 2 — the two parallel-truth modules, both deleted

Read first, in full: both decision rows, `QuickNavigationMenu.tsx` (all 468 lines),
`store/authStore.ts`, `navigation-config.ts`, and the `services/auth.ts` persist/subscription block.

Row claims re-verified on disk before deleting:

```
frontend/src/services/auth.ts:76    persist(
frontend/src/services/auth.ts:624     name: 'auth-storage',        <- SECOND store on the live key
frontend/src/services/auth.ts:635   supabase.auth.onAuthStateChange(async (event, _session) => {
frontend/src/store/authStore.ts:272   name: 'auth-storage',        <- the LIVE owner of that key
```

Deleted with `git rm`, committed with an explicit pathspec in `e6ac817f3` (2 files, 1125 deletions,
nothing else).

---

## The route count — BEFORE, AFTER, DELTA, and its cause

```
BEFORE : sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts | command grep -c "':"
         203
AFTER  : (same instrument, same tree, post-deletion)
         203
DELTA  : 0
```

**Named cause of the delta: none, and that is the honest result.** Both conditional route deletions
were refuted, so no route left the tree and `routeTree.gen.ts` is byte-unchanged
(`git status --porcelain frontend/src/routeTree.gen.ts` → 0 lines). D-08 required that route-count
gates survive a legitimate deletion; here they survive a legitimate **non**-deletion, which is the
same law read in the other direction. **`97-03-SUMMARY.md:79` predicted this number was "expected to
move — 97-11 deletes routes".** It did not move. Nothing breaks, because — exactly as that row also
said — no gate anywhere froze it; this plan's own gate derives `N` at run time and only bounds it
(`> 100`). The prediction is recorded as unmet rather than quietly absorbed.

---

## All four zero-importer derivations, RE-RUN at execution, with both controls

Unpiped, exit codes captured directly. `command grep` here resolves to `/usr/bin/grep`
(BSD, GNU-compatible) — **verified with `whence -a grep`**, which is what makes it bypass the ugrep
wrapper that honours `.gitignore`.

### `frontend/src/services/auth.ts`

```
SUBJECT — every import spelling, frontend/ + tests/:
$ command grep -rnE "from '(@/services/auth|\.\./services/auth|\./services/auth|\.\./auth|\./auth)'" \
    frontend tests --include='*.ts' --include='*.tsx'
A-RC=1                       <- 1 = no hits

CONTROL — identical command shape, live sibling module in the same directory:
$ command grep -rnE "from '(@/services/dossier-api|\.\./services/dossier-api|\./dossier-api|\.\./dossier-api)'" \
    frontend tests --include='*.ts' --include='*.tsx'
B-RC=0   B-lines=38          <- non-empty in the SAME run: the zero is a measurement
```

### `frontend/src/components/layout/QuickNavigationMenu.tsx`

```
SUBJECT — bare-identifier sweep, frontend/ + tests/, minus its own declaring file:
$ command grep -rnw "QuickNavigationMenu" <repo>/frontend <repo>/tests --include='*.ts' --include='*.tsx'
  1 line, and it is  components/layout/QuickNavigationMenu.tsx:206:export function QuickNavigationMenu({
$ ... | command grep -v "components/layout/QuickNavigationMenu.tsx:"
  C-ext-lines=0              <- zero EXTERNAL references

CONTROL — identical shape, subject Sidebar, minus its own declaring file:
  D-ext-lines=81             <- non-empty in the SAME run
```

> Minor divergence from `97-09`, recorded rather than smoothed over: 97-09 reported **3** in-file
> self-hits, this run reports **1**. Cause is the `-w` flag — `QuickNavigationMenuProps` (`:191`,
> `:213`) is not a whole-word match for `QuickNavigationMenu`. The external count, which is the one
> the decision rests on, is **0 in both runs**.

**The gate additionally runs the `store/authStore'` control ITSELF** and refuses to trust any zero
without it (23 lines in `frontend/src`). Drilled: see W9 below.

---

## FINDING — the "ZERO importers" claim is too broad, and both prior derivations missed it

**This is the most important thing in this SUMMARY and it is not a green.**

Both `97-09`'s derivation and this plan's _specified_ derivations are scoped to `frontend/` +
`tests/` and shaped as `from '<spelling>'`. The gate's own importer probe is scoped to
`frontend/src` alone. A broader sweep over **all git-tracked files** — which no derivation in the
record had run — found **30 lines across 4 files** that reference the module:

```
tests/unit/components/Header.test.tsx           vi.mock('../../../frontend/src/services/auth', …)
tests/unit/components/MFASetup.test.tsx         + require('../../../frontend/src/services/auth')
tests/unit/components/MFAVerification.test.tsx
tests/unit/components/Sidebar.test.tsx

why every prior sweep missed them:
  spelling  '../../../frontend/src/services/auth'  matches none of the five alternatives swept
  form      vi.mock(…) / require(…)                is not  from '…'
  root      repo-root tests/                        is outside the gate's frontend/src root
gate probe root frontend/src -> 0    |    repo-root tests/ -> 30    (both from the same instrument)
```

**Why the deletion still proceeded, measured rather than reasoned.** I ran those four files:

```
$ pnpm exec vitest run --config vitest.config.ts tests/unit/components/{Header,MFASetup,MFAVerification,Sidebar}.test.tsx
Test Files  4 failed (4)
     Tests  no tests
Error: Failed to resolve import "@/lib/utils" from "frontend/src/components/layout/Sidebar.tsx"
```

They are **already broken at HEAD, before any change of mine** — the root `vitest.config.ts` aliases
`@` → `<repo-root>/src`, a directory that does not exist, so they die at import resolution and run
**zero tests**. Counted, not inferred from an exit code. And nothing invokes them: `pnpm test` is
`turbo run test` (per-workspace only), `frontend/vitest.config.ts` is rooted at `frontend/`, and CI
runs `pnpm --filter intake-frontend test`, `pnpm --filter intake-backend test` and Playwright — no
job reaches the root config.

So the module's **deadness holds**: zero live importers, never evaluated, and the four referencing
files execute nothing. But the record's flat phrase _"ZERO importers"_ is wrong as written, and the
plan's own instruction — _"if a derivation now finds an importer, do NOT delete"_ — deserves the
explicit accounting that its two **specified** derivations both returned zero **with controls**, and
that the references I found are textual, in pre-broken non-executing files, and could never load the
real module anyway (`vi.mock` with a factory never evaluates the subject).

**Handed to `97-12` for the closing record, unfixed and unowned:** four tracked test files now carry
a dangling reference to a deleted module, on top of the `@`-alias break they already carried. They
sit outside this plan's `files_modified` and I did not touch them.

---

## What `QuickNavigationMenu`'s route list contained that `navigation-config.ts` does not

**Nothing — because it has no route list at all.** `RULING-P97-03` §1's premise is refuted by
reading the file, and `97-09` reached the same conclusion independently; this run confirms it before
the file disappeared. All 468 lines render pinned and recently-viewed **entities**, and every
`route` it links is a runtime value read off two zustand stores and passed straight into
`<Link to={entry.route as any}>` at `:125`, `:360`, `:449`. There is no hardcoded path in the file.
Its nearest structural analogue, `entityIcons` / `entityColors` (`:54-82`), is keyed by the canonical
`EntityType` imported from `@/store/entityHistoryStore` — agreement by **construction**, the opposite
of the parallel-truth class. **Nothing was discarded and nothing needed carrying forward.**

**The recorded cost, re-derived and unchanged:** `usePinnedEntitiesStore` had exactly one consumer,
this file, so `frontend/src/store/pinnedEntitiesStore.ts` is now dead code. It is outside this row's
subject and was **NOT** deleted. `useEntityHistoryStore` is safe — `EntityBreadcrumbTrail.tsx` and
`hooks/useEntityNavigation.ts` also consume it.

---

## Closed gates elsewhere in the phase whose subjects this plan changed (the post-close mutation law)

Derived mechanically over every other P97 plan's gate text, not by recall:

| plan               | gate text names my subjects      | verdict now | attributed to     |
| ------------------ | -------------------------------- | ----------- | ----------------- |
| 97-09 gate @`:326` | **YES**                          | **RED**     | **ME**            |
| 97-09 gate @`:248` | no (count 0; control on 326 = 1) | RED         | **97-10**, not me |
| 97-01/03/07        | no                               | untouched   | —                 |

**`97-09` gate `:326` — RED, and it is mine.** Its opening clause is
`test -f "$R/frontend/src/services/auth.ts" && test -f "$R/frontend/src/components/layout/QuickNavigationMenu.tsx"`.
It asserts both modules **exist** — true while 97-09 ran (that plan changed no code), and necessarily
false the moment 97-11 executes the very `DELETE` rows 97-09 wrote. Attribution is exact: stripping
**only** those two `test -f` clauses (diff = 1 changed line) makes the rest of the gate pass.

```
G09-326-RC=1
G09-326-WITHOUT-FILE-EXISTENCE-RC=0     <- the ONLY red is the two test -f clauses
test -f services/auth.ts        -> RC=1  (deleted, authorised)
test -f QuickNavigationMenu.tsx -> RC=1  (deleted, authorised)
```

I did not edit it. Gate text is frozen and it belongs to another plan; this is filed for the
overseer, not worked around.

**`97-09` gate `:248` — RED, and it is NOT mine.** It requires that a path present in
`navigation-config.ts` carry a decision that is **not** `NAV ENTRY`. `97-10` landed `d0ee9f18b`
mid-run and added exactly the three ruled `NAV ENTRY` rows, so:

```
/admin/ai-usage       nav=LINKED  token=NAV ENTRY   *** FAILS ***
/admin/approvals      nav=LINKED  token=NAV ENTRY   *** FAILS ***
/monitoring           nav=LINKED  token=NAV ENTRY   *** FAILS ***
(the other five paths pass)
```

The discriminating fact, not an inference: `command grep -c "services/auth\|QuickNavigationMenu"`
against gate 248's text is **0**, while the same grep on gate 326 is **1** — the instrument works,
and gate 248 never reads my subjects, so my deletion cannot be its cause.

---

## GATE DRILL — both directions, OBSERVED, per gate

Gates **byte-identical** to the accepted set at `d561738fa`. **No gate was edited.** Extracted
verbatim to `/tmp/p97-11-gate{1,2}.sh`; `bash -n` parsed both.

```
GATE1-PARSE-RC=0     GATE2-PARSE-RC=0
```

| plan.gate   | C1 red                                                                                                                                                                                                                                                                                                                                            | C1 green                                                                | C2–C10 notes                                                                                                                                                    | verdict   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 97-11.task1 | **Not reachable on the undone tree — and that is a property of the work, not a gap.** The authorised route-deletion set is EMPTY, so the done state IS the undone state and `GATE1-UNDONE-RC=0`. Red is instead observed on **five constructed WRONG states** (W1–W5), which is exactly the drill this gate's own acceptance criteria prescribes. | `GATE1-GREEN-RC=0`, re-run post-commit and after 97-10 landed under me. | C4: `N` derived at run time, only bounded `>100` (203 today). C5: `test -f "$T"`/`"$G"` precede every read. C10: per-path loop, so a red names WHICH iteration. | **SOUND** |
| 97-11.task2 | `GATE2-UNDONE-RC=1`, attributed in the same step (below).                                                                                                                                                                                                                                                                                         | `GATE2-GREEN-RC=0` after both deletions.                                | C5: the gate runs the `store/authStore'` control ITSELF and fails closed if it is ever empty — drilled at W9. C2: build output captured for attribution.        | **SOUND** |

### RED on the undone tree — pasted, with attribution

```
GATE2-UNDONE-RC=1
SUBJECT-auth-absent-RC=1              (1 = still present — THIS is the red)
SUBJECT-qnm-absent-RC=1               (1 = still present)
PRECONDITION-table-RC=0               (0 = the cited input exists → not a missing-input artifact)
PRECONDITION-control-nonempty-RC=0    (0 = instrument proven able to see imports)
```

### GREEN on the done state — pasted

```
GATE1-GREEN-RC=0        GATE2-GREEN-RC=0
GATE1-FINAL-RC=0        GATE2-FINAL-RC=0     (re-run after 97-10's d0ee9f18b landed under me)
gate2 tail:  ✓ built in 12.14s               (pnpm typecheck AND pnpm --filter intake-frontend build)
```

### Baselines captured BEFORE any deletion, so a post-deletion red would be attributable

```
TYPECHECK-BEFORE-RC=0        BUILD-BEFORE-RC=0     (both green at 1a0dabb0b)
```

### The drill harness, and its one honest scoping statement

Harness = the frozen gate text with **one changed line**: `R=` repointed at a scratch copy, and the
trailing `cd "$R" && pnpm typecheck …` clause removed (both edits fall on the same single line;
`diff` shows `g1=1  g2=1`).

**Why the tail was truncated, stated rather than hidden.** I first built a full scratch monorepo and
ran the untruncated harness. Its control came back **RC=2, then RC=1 — a TOOLING red**
(`agent-runtime#build, intake-backend#build`), not a subject red. Under C2 that is not a valid red,
and a harness whose control cannot go green cannot attribute anything. Truncation is **conservative**:
it removes an assertion rather than weakening one, and **every** wrong state below short-circuits the
`&&` chain long before the tail, so the tail could not have masked any of them. The tail is verified
separately in the real tree — `pnpm typecheck` and `pnpm --filter intake-frontend build`, both green,
pasted above.

```
DRILL-CONTROL-G1-RC=0 (expect 0)      DRILL-CONTROL-G2-RC=0 (expect 0)
```

The unmodified scratch is green through the harness FIRST — a negative control that passes on an
inert mutation would prove nothing (`fa4ce7393`).

### The WRONG states — nine, each constructed and observed red, each attributed

```
=== GATE 1 ===
W1  a route whose row is NOT DELETE removed from the tree            W1-RC=1
      -> iteration '/admin/approvals' EXIT at else-arm (route ABSENT but row is not DELETE)
W2  a DELETE-row route left in place (token flipped, route stays)    W2-RC=1
      -> iteration '/admin/preview-layouts' EXIT at DELETE-arm (route still PRESENT)
W3  a conditional route's decision token OMITTED entirely            W3-RC=1
      -> iteration '/admin/approvals' EXIT at token-existence (-eq 1), NOT silently else-arm
W4  PROSE CONTAMINATION: token replaced by a sentence in which
    the subject and the word DELETE merely co-occur                  W4-RC=1
      old unanchored pattern "/admin/approvals.*DELETE"  -> 1   (the defect, reproduced)
      anchored "^DECISION /admin/approvals: "            -> 0   (the repair, holding)
W5  EXCLUSION CONTROL: /delegations removed from the tree            W5-RC=1
      -> delegations-present-check=0 (Phase 102's surface protected)
RESTORED-G1-RC=0

=== GATE 2 ===
W6  a SINGLE import of services/auth added to a live file            W6-RC=1
      -> IMP probe lines=1 (the importer assertion fired — the acceptance's named drill)
W7  services/auth.ts restored while its row says DELETE              W7-RC=1
W8  QuickNavigationMenu.tsx restored while its row says DELETE       W8-RC=1
W9  THE CONTROL BLINDED: store/authStore renamed so CTRL is empty    W9-RC=1
      -> CTRL lines=0 — the gate fails CLOSED on a blind instrument
RESTORED-G2-RC=0
```

W4 is the one worth keeping: it reproduces, on this phase's one irreversible operation, the exact
contamination the anchored token form exists to stop — and confirms the anchored form refuses it.

---

## Live behavioural observation — ROLE and VIEWPORT named (RULING-P97-03 §3)

The dev stack was live, so the deadness claim got its behavioural half rather than resting on the
build alone. Scratch Playwright config in `/tmp/p97-11-observe/` (repo tree untouched;
`node_modules` symlinked; single project, **no `dependencies`**, `--no-deps`, so the `setup` project
that throws without six `E2E_*` keys never runs — E2ECRED-01 was not waited on). Inline auth from
`.env.test`; **no credential value read or echoed.**

- **ROLE: `adminOnly`, PROVEN IN-RUN** — the administration group renders, which
  `createNavigationGroups` emits only when `isAdmin` is true (`adminLinkCount=1`). Not assumed from
  a username.
- **VIEWPORT: desktop 1400×900**, the `<aside role="navigation">` (count 1) — **not** the mobile
  drawer. Nothing here is a claim about the mobile treatment.

```
3 passed (9.0s)

CONTROL-collector-hits=1        (MUST be >=1 for the observation's zero to be real)
VIEWPORT=desktop-1400x900 aside-count=1
ROLE=adminOnly-visible adminLinkCount=1
DELETED-MODULE-RESOLUTION-ERRORS=0
REQUESTS-FAILED-FOR-DELETED-MODULES=0
auth-storage-key-present=true
ADMIN-APPROVALS  url=/admin/approvals       h1=Admin: Approval Management
PREVIEW-LAYOUTS  url=/admin/preview-layouts h1=Manage Preview Layouts
```

**The zero in that run is instrument-tested.** `DELETED-MODULE-RESOLUTION-ERRORS=0` is only evidence
if the collector can see a hit, so a control spec emits an error matching the observation's own
regex through the same collector and asserts it is caught → `CONTROL-collector-hits=1`. A zero from
an untested instrument is not a measurement.

**Counted, not inferred from a zero exit:** 3 tests run, 3 passed; `test.skip` / `test.fixme`
occurrences in both specs = **0 and 0**, so nothing passed by being skipped. Spec-file existence was
asserted before the run and expected counts hardcoded (control = 1, suite = 3), because Playwright
paths are FILTERS.

**T-97-33 confirmed behaviourally:** `auth-storage` is present in localStorage and owned solely by
the live `store/authStore.ts`. Deleting the dormant duplicate disturbed nothing — as predicted, the
dead module never ran.

---

## Build output confirming deadness

```
BEFORE (baseline, 1a0dabb0b) : TYPECHECK-BEFORE-RC=0   BUILD-BEFORE-RC=0
AFTER  (both modules gone)   : pnpm typecheck -> 0 ; pnpm --filter intake-frontend build -> 0
                               ✓ built in 12.14s
                               dist/assets/app-CDsGULgF.js     1,812.12 kB │ gzip: 499.63 kB
                               dist/assets/vendor-cNn9MAFS.js  2,344.83 kB │ gzip: 744.69 kB
```

A module removed from a tree that still typechecks and still bundles is a module nothing needed.
Deletions only shrink, so the required Bundle Size Check is unthreatened.

---

## Compliance notes

- **Standing laws:** branch `milestone/v10.0-trust` throughout; no branch created or switched;
  `main` untouched; no PR. The commit used an explicit pathspec
  (`git commit -m "…" -- <2 paths>`), never `git commit -a`. Git identity left as configured.
- **The 7 exogenous paths were never touched.** `diff` of `git status --porcelain` before and after
  the whole run: `STATUS-IDENTICAL-RC=0`, byte-identical (5 ` M`, 2 `??`).
- **No gate text was edited**, and neither of my gates needed a repair to go green.
- **A sibling worker was live in this tree.** `97-10` committed `d0ee9f18b` mid-run. My gates were
  re-run afterwards (`GATE1-FINAL-RC=0`, `GATE2-FINAL-RC=0`) and my commit carries exactly 2 files.
  My typecheck/build gates ran over a tree that included 97-10's work; both green.
- **Scratch work confined to `/tmp`** (`/tmp/p97-11-drill/`, `/tmp/p97-11-observe/`,
  `/tmp/p97-11-gate{1,2}.sh`). The importer probe writes to `${TMPDIR}` per the gate's own W-5
  repair, not into the phase directory.
- `timeout` was not used. Exit codes captured **directly**, never through a pipe. Absolute paths in
  every command whose cwd was not just set. `command grep` throughout — and **verified with
  `whence -a grep`** that it resolves to `/usr/bin/grep`, which is what makes it bypass the ugrep
  wrapper. The BRE alternation `\(DELETE\|OWN\)` was itself instrument-tested before being trusted
  (positive 1, negative control 0).
- **Every zero was tested against a known-positive control in the same run** — the import sweeps
  (38 / 81 / 23), the `approvals-reassign` sweep (3), the `entity_preview_layouts` sweep (16), the
  gate-text attribution sweep (0 vs 1), and the Playwright console collector (1).
- **Intended-broken exclusions untouched:** `/delegations` asserted still present in the regenerated
  tree by the gate and drilled at W5; the legal-holds region, the `/engagements` double-mount,
  `scenario-sandbox` and `responsive-demo` were not read, edited or removed.
- **This plan deleted no route and added no nav entry**, as its own verification requires.

---

## BLOCKED

**Two items need an overseer ruling. Neither blocked the work — both gates are green in both
directions and the deletions are committed — but neither can be closed by me.**

**1. `97-09`'s gate at `97-09-PLAN.md:326` is now RED, caused by this plan, by design.** Its opening
`test -f` pair asserts both deleted modules exist. That was true while 97-09 ran and is necessarily
false once 97-11 executes the `DELETE` rows 97-09 itself wrote. Attribution is exact: removing only
those two clauses turns the gate green
(`G09-326-WITHOUT-FILE-EXISTENCE-RC=0`). Gate text is frozen and belongs to another plan, so I did
not touch it. **The overseer must decide whether 97-09's gate 326 is re-scoped, retired as
spent-on-execution, or re-drilled with the deletion accounted for.** Note this is the same
post-close-mutation shape as `RULING-P97-14` §3 — a closed deliverable's gate moved by later
authorised work.

**2. `97-09`'s gate at `:248` is also RED, caused by `97-10`, not by me.** It forbids a
nav-config-LINKED path from carrying a `NAV ENTRY` decision; `97-10` landed the three ruled
`NAV ENTRY` rows at `d0ee9f18b`, so `/admin/ai-usage`, `/admin/approvals` and `/monitoring` now fail
that arm. I am reporting it because I measured it, not claiming it — it is `97-10`'s subject and
mine only by adjacency.

**One finding for `97-12`'s closing record, filed and unowned (not a blocker):** four tracked test
files — `tests/unit/components/{Header,MFASetup,MFAVerification,Sidebar}.test.tsx` — reference the
now-deleted `frontend/src/services/auth` via a spelling and a root that every derivation in the
record was blind to. They were **already broken before this phase** (root `vitest.config.ts` aliases
`@` → a nonexistent `<repo-root>/src`; measured: 4 files failed, **zero tests ran**) and no script or
CI job invokes them. They now carry a second, dangling reference. They sit outside this plan's
`files_modified` and were not touched. **They have no owner.**

SUMMARY-END
