# 97-09 SUMMARY — the NAV-04 single-writer per-route decision record

**Plan:** `97-09` (Wave 3, `autonomous: true`, `depends_on: [97-03]`)
**Requirement:** NAV-04 · **Serves criterion 4** (this plan DECIDES; it changes no code)
**Branch:** `milestone/v10.0-trust` · **Base HEAD at start:** `fa4ce7393`
**Commits:** `5d26cc824` (the decision record), plus this SUMMARY
**Date:** 2026-08-17

---

## What was done, per task

### Task 1 — the nine route rows

Read first, in full: `97-POPULATIONS.md`, `95-DEAD-04-DECISION.md`,
`RULING-P97-01-ADMIN-DISPOSAL.md`, `RULING-P97-03-OMISSION-FINDINGS.md`,
`97-PARALLEL-TRUTH-CLASS.md`, `97-CONTEXT.md`, `GATE-STANDARD-P92.md`, `97-03-SUMMARY.md`,
plus both approvals route files and `admin/preview-layouts.tsx`.

Wrote `.planning/phases/97-reachability/97-NAV04-DECISIONS.md` in the `95-DEAD-04-DECISION.md`
shape: population + delta first, then one row per candidate with decision / why / owner / cited
evidence, then the conditional triggers performed, the dead-module rows, the palette election, the
`PARALLEL-TRUTH-01` residue routing, the intended-broken exclusions, and a closing section stating
what no row claims.

**The nine decisions:**

| route                      | decision              | basis                                         |
| -------------------------- | --------------------- | --------------------------------------------- |
| `/admin/ai-settings`       | `ALREADY-REACHABLE`   | live nav row `navigation-config.ts:185`       |
| `/admin/system`            | `ALREADY-REACHABLE`   | `:191`                                        |
| `/admin/field-permissions` | `ALREADY-REACHABLE`   | `:203`                                        |
| `/admin/data-retention`    | `ALREADY-REACHABLE`   | `:215`                                        |
| `/admin/ai-usage`          | `NAV ENTRY`           | ruled `RULING-P97-01` §1                      |
| `/admin/approvals`         | `PARKED-RE-ESCALATED` | conditional trigger **REFUTED** (§3a below)   |
| `/admin/preview-layouts`   | `PARKED-RE-ESCALATED` | conditional trigger **REFUTED** (§3b below)   |
| `/monitoring`              | `NAV ENTRY`           | route KEEP ruled `RULING-P95-01`; nav only    |
| `/admin/` (index)          | row, **no token**     | redirect-only; see "the term that is missing" |

Eight anchored tokens emitted, one per loop candidate, inside fenced blocks so the pre-commit
prettier pass cannot reflow them.

### Task 2 — the two dead-module rows, and the palette answer

Read first, in full: `frontend/src/components/layout/QuickNavigationMenu.tsx` (all 468 lines),
`navigation-config.ts`, `services/auth.ts` (the persist block and the module-level subscription),
`CommandPalette.tsx:100-112` and `:515-532`, `Sidebar.tsx:45-60`.

Appended §4 (both modules, each with a re-run control-tested derivation), §5 (the palette
election), §6 (the `PARALLEL-TRUTH-01` residue `97-04` handed over, routed with owners). Three
more anchored tokens: `PALETTE-ADMIN-01: BRANCH-A`, and `DELETE` for each module.

---

## The execution-time admin population and the delta, re-derived on the day

```
$ sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts \
    | command grep -o "'/admin[^']*'" | sort -u
'/admin/'  '/admin/ai-settings'  '/admin/ai-usage'  '/admin/approvals'
'/admin/data-retention'  '/admin/field-permissions'  '/admin/preview-layouts'  '/admin/system'
```

**Eight.** `REQUIREMENTS.md:135` says nine. **Delta −1, stated not absorbed.** The eighth is the
redirect-only `/admin/` index (`admin/index.tsx:3-8`). Candidate set = 8 + `/monitoring` = **nine**.

Inbound-link evidence re-derived with `scripts/inbound-link-classify.mjs` (exit **0**), whose
control pin resolved `/admin/ai-settings` → **2 LIVE** links in the same run as every zero. The
nav-config line numbers **moved** since `97-POPULATIONS.md` §2b (`178→185`, `184→191`, `196→203`,
`208→215`) because `97-05` inserted the Elected Officials row at `:148` in wave 2 — which is why
the plan said re-derive rather than copy.

**Four of the nine already have a live sidebar row.** Without `ALREADY-REACHABLE` in the
vocabulary those four rows would have been forced into `NAV ENTRY`, and `97-10` Task 1 reads this
table as its instruction list — it would have added duplicate sidebar rows.

**The term that is still missing, recorded rather than forced.** The closed vocabulary has no true
term for the `/admin/` index: `ALREADY-REACHABLE` is false (it has no nav row of its own),
`NAV ENTRY` would instruct a duplicate, `NOT-CHECKED` is false because it was checked. It gets a
row and no token, and the record says why. The plan already excluded it from every consuming
gate's loop, so this costs nothing downstream.

---

## Conditional trigger verdicts, with the comparisons that produced them

### §3a `/admin/approvals` — **REFUTED**

Comparison performed against both route files AND both live pages:

|                 | `/admin/approvals`                                           | `/approvals`                       |
| --------------- | ------------------------------------------------------------ | ---------------------------------- |
| component       | `AdminApprovalsPage` (294 lines)                             | `MyApprovalsPage` (132 lines)      |
| guard           | `beforeLoad: requireAdmin`                                   | none                               |
| i18n ns / query | `admin` / `['admin','approvals','under_review']`             | `approvals` / `['approvals','my']` |
| backing fetch   | `positions-list?status=under_review`                         | **identical**                      |
| mutation        | `approvals-reassign` PUT — **sole caller in the whole tree** | none                               |
| rendered h1     | "Admin: Approval Management"                                 | "My Approvals"                     |
| rendered body   | audit banner + 5-col table + Reassign action                 | one Pending stat + link list       |

They share exactly one thing (the query) and differ in component, guard, namespace, key, copy,
layout and **capability**. `/admin/approvals` is the only surface that can reassign a stuck
approval. The shared query reads as the top-level page being unfinished — its own comment at `:29`
says _"This would need a dedicated endpoint, but for now we'll filter positions"_ — not as the
admin page being redundant. Per `RULING-P97-01` §2 a refuted trigger gets **no improvised nav
entry**; the park re-escalates with the comparison as evidence.

### §3b `/admin/preview-layouts` — **REFUTED on both conjuncts**

**Conjunct 1 — the Phase-30–32 reference the trigger names does not exist**, control-tested:

```
SUBJECT : command grep -rn -i "preview.layout" <the three v5.0 phase-30/31/32 dirs>   -> RC=1, 0 hits
CONTROL : same command shape, token "elected", same three dirs                        -> 693 hits
```

The instrument sees matches; the zero is real. A trigger whose premise cannot be located cannot
fire.

**Conjunct 2 — a live claim exists**, dated two days before this decision:
`.planning/audits/live-audit-2026-08-15/sweeper.md:132` ("real feature, fully wired… Selecting
'Country' live pulled a real seeded 'Default Country Preview' layout… **Genuinely fine — don't
delete**"), `:153`, and `INDEX.md:169` ("real, wired features. Nothing there needs deleting").
Re-observed live at execution: `h1 = "Manage Preview Layouts"`, all twelve entity types rendered.

**Why the row is `PARKED-RE-ESCALATED` and not `OWNED-ELSEWHERE-UNTOUCHED`.** The ruling's refuted
branch says "record OWNED-ELSEWHERE **with the owner named**". That branch is not executable
honestly: `preview` appears **zero** times in `.planning/ROADMAP.md` and **zero** times in
`.planning/REQUIREMENTS.md`, and the sweep found no phase, register row or backlog item claiming
the route. The only claim-holder is an audit record, which is a liveness verdict, not an owner.
Writing a fabricated owner to satisfy a branch's wording is the defect class this phase exists to
kill, so the row re-escalates instead. **This is a deviation from the ruling's literal alternate
branch and needs the overseer — see `## BLOCKED`.**

**One finding recorded with the park** (not a disposal, not acted on): the config surface is live
but **nothing consumes what it configures**. `entity_preview_layouts` resolves to a closed loop —
`usePreviewLayouts.ts` (4 refs) is its only reader/writer, and that hook has exactly **one**
importer, the admin route itself. No preview, search-result or embedded-reference surface reads
the layouts its JSDoc says it governs.

**Consequence for `97-11`: ZERO route deletions.** Both conditional deletes were refuted. `97-11`'s
Task 1 gate handles this correctly — a non-`DELETE` token requires the route to still be PRESENT
in the regenerated tree.

---

## Both zero-importer derivations, RE-RUN at execution with their control output

### `frontend/src/services/auth.ts`

```
SUBJECT — every import spelling, frontend/ + tests/:
  from '@/services/auth' | '../services/auth' | './services/auth' | '../auth' | './auth'   -> 0
CONTROL — identical command shape, live sibling module in the same directory:
  from '@/services/dossier-api' | '../services/dossier-api' | './dossier-api' | '../dossier-api' -> 38
```

Dual-store evidence verified on disk: `services/auth.ts:76` `persist(` … `:624`
`name: 'auth-storage'` — the SAME persist key as the live store `store/authStore.ts:272` — plus
`:635` a module-level `supabase.auth.onAuthStateChange` that never registers. **Recommend DELETE**
per `RULING-P92-06`; `97-11` executes after re-running the derivation itself.

### `frontend/src/components/layout/QuickNavigationMenu.tsx`

**A control BROKE during this derivation, and that is the most useful thing in this section.**

```
CONTROL ATTEMPT 1 : command grep -rn "layout/Sidebar'" frontend/src   -> 0
    Mis-specified. Sidebar is imported RELATIVELY (AppShell.tsx:93  import { Sidebar } from './Sidebar'),
    so a path-shaped control could never match. Had I not tested it, this broken instrument would
    have "confirmed" the subject's zero.
CONTROL ATTEMPT 2 : SidebarSearch                                     -> 0 external refs
    Rejected: it is itself dead, so it cannot serve as a KNOWN-IMPORTED control.
SUBJECT  : command grep -rnw "QuickNavigationMenu" frontend/ tests/  minus its own file  -> 0
CONTROL 3: identical shape, subject "Sidebar",              minus its own file  -> 81
```

**`RULING-P97-03` §1's premise is REFUTED by reading the file.** It characterises this component as
"a second route list beside `navigation-config.ts`". It contains **no route list at all** — it
renders pinned/recent ENTITIES, and every `route` it links is a runtime value off two zustand
stores, passed into `<Link to={entry.route as any}>` at `:125`, `:360`, `:449`. So the "say what
its list contained that the live config does not" obligation is discharged with **nothing is
discarded**: there is no forgotten intent, because there is no parallel list. Its nearest
structural analogue (`entityIcons` / `entityColors`, `:54-82`) is keyed by the canonical
`EntityType`, i.e. agreement by CONSTRUCTION — the opposite of the class.

**Cost of DELETE, recorded:** `usePinnedEntitiesStore` has exactly one consumer, this file, so
`store/pinnedEntitiesStore.ts` becomes dead code. That is a consequence to record, not a reason to
keep an unrendered component — a component nothing imports pins nothing today either. The store is
outside this row's subject and is NOT deleted. (`useEntityHistoryStore` is safe: two other live
consumers.)

---

## The palette branch elected, and on what evidence

**`DECISION PALETTE-ADMIN-01: BRANCH-A` — fix in-phase. Owner: `97-10` Task 2.**

Evidence, all re-derived at execution:

- `CommandPalette.tsx:521-524` — `createNavigationGroups({...}, true)` with `isAdmin` hardcoded and
  a `[]` dep array; the file does not import `useAuthStore`.
- `97-10` already owns BOTH `CommandPalette.tsx` and `navigation-config.ts` — exactly the condition
  `RULING-P97-01`'s filing order names for branch A.
- The honest check exists one file away: `Sidebar.tsx:51,53` (`useAuthStore()` then
  `user?.role === 'admin' || user?.role === 'super_admin'`). **The plan cited `:54`; re-derived it
  is `:53`.**
- `useAuthStore` is zustand and needs no provider, so the only stated condition that would force
  branch B (render context cannot reach the auth store) does not hold.

The record states plainly that this is a **VISIBILITY** defect, not an authorization one.

---

## Live observation — role and viewport NAMED (RULING-P97-03 §3)

The plan requires every `NAV ENTRY` row to name its destination's current state, and the dev stack
is live, so the two destinations were **OBSERVED**, not cited. Run via a scratch Playwright config
in `/tmp/p97-09-observe/` (repo tree untouched; `node_modules` symlinked; single project, **no
`dependencies`**, so the `setup` project that throws without six `E2E_*` keys never runs —
E2ECRED-01 was not waited on). Inline auth from `.env.test`; no credential value echoed.

- **ROLE: `adminOnly`, PROVEN IN-RUN** — the session renders the administration group, which
  `createNavigationGroups` emits only when `isAdmin` is true (asserted as
  `aside[role="navigation"] a[href="/admin/ai-settings"]`, count 1). Not assumed from a username.
- **VIEWPORT: desktop 1400×900**, the `<aside>` — **not** the mobile drawer. Nothing here is a
  claim about the mobile treatment.

```
Run 1 — 3 passed (14.5s)
ROLE=adminOnly-visible VIEWPORT=desktop-1400x900 aside=present
AI-USAGE content-type: text/html
AI-USAGE h1: AI Usage Dashboard
AI-USAGE body: "… AI Usage Dashboard … Total Runs 0 … Total Cost $0.0000 … Success Rate 0.0%
                … Usage by Feature: No usage data available … Cost by Provider: No usage data available"
AI-USAGE leak: false            (PG codes / permission denied / supabase-js / FunctionsHttpError)
AI-USAGE url: http://localhost:5173/admin/ai-usage    (no guard redirect)

MONITORING content-type: text/html
MONITORING h1: Monitoring Dashboard
MONITORING health statuses: [200]      MONITORING alerts statuses: [200]
MONITORING health-error testid count: 0    alerts-error testid count: 0    still-loading: 0
MONITORING body: "… Health  Overall: healthy  database: healthy (39 ms)  api: healthy (13 ms) …"

Run 2 — 2 passed (16.5s)
PREVIEW h1: Manage Preview Layouts    (12 entity types rendered; url stayed /admin/preview-layouts)
ADMIN-APPROVALS h1: Admin: Approval Management
  "Reassign stuck approvals and manage approval chains / Admin Privileges Active /
   Position Current-Stage Category Submitted Actions / No positions under review"
TOP-APPROVALS   h1: My Approvals
  "Positions pending your review and approval / 0 Pending / No positions pending your approval"
```

**Counted, not inferred from a zero exit:** run 1 = **3 tests run, 3 passed**; run 2 = **2 tests
run, 2 passed**. No `test.skip()` anywhere in either scratch spec, so no test could have passed by
being skipped.

---

## NOT-CHECKED and PARKED rows — the phase's honest edges (`97-12` must name these)

| item                                                        | state                 | what was tried                                                                                                                                                                                                 |
| ----------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/monitoring` **production** render                         | `NOT-CHECKED`         | dev stack driven end-to-end (200/200, no error testids); guard read at `backend/src/index.ts:83-89`. No production build was stood up — the degradation claim is **derived from the code path, not observed**. |
| `/admin/data-retention` + `/admin/field-permissions` render | `NOT-CHECKED`         | the 2026-08-15 audit recorded 401s; P92/P93 worked that territory after. Both are `ALREADY-REACHABLE`, so no new entry points at them; their state is unestablished here and is not assumed repaired.          |
| `/admin/approvals`                                          | `PARKED-RE-ESCALATED` | comparison performed and pasted; trigger refuted                                                                                                                                                               |
| `/admin/preview-layouts`                                    | `PARKED-RE-ESCALATED` | both conjuncts checked and refuted; no owner exists to name                                                                                                                                                    |
| `/admin/` index                                             | row, no token         | no true term in the closed vocabulary; covered by the `delta` sentence                                                                                                                                         |

`PARALLEL-TRUTH-01` residue from `97-04` (three sites) is routed in §6 of the record with the owner
`97-12` to file into the register — **not executed**, because all three files sit outside this
plan's `files_modified`, two sit outside every P97 plan's scope, and the third
(`CommandPalette.tsx:305`) belongs to `97-10` whose action forbids unrelated palette edits.

---

## GATE DRILL — both directions, OBSERVED, per gate

Gates are **byte-identical** to the accepted set at `d561738fa`. **No gate was edited.** Both were
run under `bash` (not zsh), extracted verbatim into `/tmp/p97-09-gate{1,2}.sh`; `bash -n` parsed
both (`RC=0`).

| plan.gate   | C1 red (how)                                                                                                                                                                                                                         | C1 green (how the done state was constructed)                                                                                                                                       | C2–C10 notes                                                                                                                                                                                   | verdict   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 97-09.task1 | **rc=1** on the undone tree. Attributed in the same step: `test -f <F>` → rc=1 (subject absent) while `test -f 97-POPULATIONS.md` → rc=0 (the cited precondition exists), so the red is the subject's, not a missing-input artifact. | **rc=0** on the real tree once the record was written; re-verified post-commit (post-prettier). Four WRONG states additionally constructed in a scratch copy and each observed red. | C4: all four thresholds derived and shown reachable (below). C5: `97-POPULATIONS.md`'s existence asserted first. C10: the per-path loop checks one path at a time, so a miss names WHICH path. | **SOUND** |
| 97-09.task2 | **rc=1** on the undone tree, same attribution.                                                                                                                                                                                       | **rc=0** after the module + palette rows were written; re-verified post-commit. Three WRONG states constructed and each observed red.                                               | C5: the gate runs the `store/authStore'` control itself and requires non-empty output, captured into a variable rather than piped — condition AND exit code.                                   | **SOUND** |

### RED, on the undone tree — pasted

```
GATE1-PARSE-RC=0
GATE2-PARSE-RC=0
=== RED (undone tree) ===
GATE1-RED-RC=1
GATE2-RED-RC=1
=== red attribution ===
SUBJECT-PRESENT-RC=1 (1 = subject absent, THIS is the red)
PRECONDITION-97-POPULATIONS-RC=0 (0 = the cited evidence exists, so the red is NOT a missing-precondition artifact)
```

### GREEN, on the done state — pasted, with every derived threshold shown reachable

```
=== GREEN (done state) ===
GATE1-GREEN-RC=0
GATE2-GREEN-RC=0
--- derived thresholds ---
  TOK    (^DECISION lines, floor 8)                       = 11
  LINKED (path: '/admin/ in nav config, floor 1)          = 4
  BAD    (tokens outside the 9-term vocabulary, must be 0)= 0
  per-candidate token counts (each must be exactly 1):
    /admin/ai-settings 1   /admin/ai-usage 1   /admin/approvals 1   /admin/data-retention 1
    /admin/field-permissions 1   /admin/preview-layouts 1   /admin/system 1   /monitoring 1
  gate-2 token counts (each must be exactly 1):
    PALETTE-ADMIN-01 1   services/auth.ts 1   QuickNavigationMenu 1

=== post-commit (post-prettier) re-run ===
GATE1-POSTCOMMIT-RC=0
GATE2-POSTCOMMIT-RC=0
```

### The WRONG states — seven, each constructed and observed red

Drilled through a harness that is the frozen gate text with **only the `F=` assignment repointed**
at a scratch copy (`diff` shows exactly one changed line, pasted in the run log). The unmodified
copy is green through the harness first, so a red below is the mutation's and not the harness's —
a negative control that PASSES would only prove something inert had been mutated.

```
DRILL-CONTROL-G1-RC=0 (expect 0)      DRILL-CONTROL-G2-RC=0 (expect 0)
W1  a LINKED path ruled NAV ENTRY (the duplicate-instruction defect)     W1-RC=1  (expect 1)
W2  an UNLINKED orphan dismissed as ALREADY-REACHABLE                    W2-RC=1  (expect 1)
W3  an INVENTED term outside the closed vocabulary (KEEP-FOR-NOW)        W3-RC=1  (expect 1)
W4  a candidate whose token line was OMITTED                             W4-RC=1  (expect 1)
W5  BOTH palette branches written (count 2)                              W5-RC=1  (expect 1)
W6  a term outside a closed set (module DELETE -> ARCHIVE, count 0)      W6-RC=1  (expect 1)
W7  both DELETE and OWN for one module                                   W7-RC=1  (expect 1)
RESTORED-G1-RC=0   RESTORED-G2-RC=0
STATUS-IDENTICAL-RC=0 (git status --porcelain identical before and after the whole drill)
```

---

## Compliance notes

- **Standing laws:** branch `milestone/v10.0-trust` throughout; no branch created or switched;
  `main` untouched; no PR. The commit used an explicit pathspec (`git add -- <path>` then
  `git commit`, never `git commit -a`). Git identity left as configured.
- **The 7 exogenous paths were never touched.** `git status --porcelain` for them is byte-identical
  to session start (5 ` M`, 2 `??`), verified before and after the drill and after the commit.
- **No gate text was edited**, and neither gate needed a repair to go green.
- **prettier re-wrapped the record inside the pre-commit hook** (table padding). Both gates were
  re-run against the committed content and stayed green. Tokens were deliberately placed inside
  fenced blocks, which prettier does not reformat. The file carries no frontmatter, so there was
  none to re-check. 97-03's lint-staged stale-index quirk did **not** recur here — post-commit
  `git status` shows no residue and `git diff HEAD` on the file is empty.
- **Scratch work confined to `/tmp`** (`/tmp/p97-09-observe/`, `/tmp/p97-09-drill/`,
  `/tmp/p97-09-gate{1,2}.sh`). The repo tree carries exactly one new file plus this SUMMARY.
- `timeout` was not used. Exit codes captured directly, never through a pipe. Absolute paths in
  every command whose cwd was not just set. `command grep` throughout, and **every zero was tested
  against a known-positive control in the same run** — one of which broke and was replaced.
- No credential was read or echoed. The Playwright observation signs in from `.env.test` env vars
  and prints only page text, statuses and testid counts.
- **This plan performed no deletion and added no nav entry**, as its own verification requires.

---

## BLOCKED

**One item needs an overseer ruling before criterion 4 can be graded closed. It did not block
producing the record — the record is complete and both gates are green — but it cannot be closed
by me.**

**`/admin/preview-layouts` deviates from `RULING-P97-01` §3's literal alternate branch.** The
ruling says a refuted trigger records "OWNED-ELSEWHERE **with the owner named**, and nothing is
deleted". Nothing is deleted — that half is honoured. But **no owner exists to name**: `preview`
appears zero times in `.planning/ROADMAP.md` and zero times in `.planning/REQUIREMENTS.md`, and the
sweep over `.planning` and `specs` found no phase, register row or backlog item claiming the route;
the only claim-holder is the 2026-08-15 live audit, which is a liveness verdict, not an owner. I
recorded `PARKED-RE-ESCALATED` rather than write an owner the evidence does not supply. **The
overseer must either name an owner (making the row `OWNED-ELSEWHERE-UNTOUCHED`) or ratify the
re-escalation.**

Two knock-on facts the overseer needs with that ruling:

1. **Both conditional deletes were refuted, so `97-11` will perform ZERO route deletions.** Its
   gates accommodate this (a non-`DELETE` token requires the route to still be PRESENT), and D-08's
   moving-route-count expectation simply will not move for these two. Nothing is broken by this; it
   is stated so the closing plan does not read a zero-deletion phase as work not done.
2. **`/admin/preview-layouts` is a live config surface whose output nothing consumes** —
   `entity_preview_layouts` is read/written only by `usePreviewLayouts.ts`, whose sole importer is
   the admin route itself, while its declared consumers (hover previews, search results, embedded
   references) never read it. That is a hollow-feature finding, not a reachability disposal, and it
   is filed here with the park rather than acted on. It has **no owner** either.

SUMMARY-END
