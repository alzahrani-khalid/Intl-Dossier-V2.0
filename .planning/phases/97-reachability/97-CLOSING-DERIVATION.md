# 97-CLOSING-DERIVATION — coverage re-derived, populations closed, the weakest green named

**Written by plan `97-12` (Wave 5), 2026-08-17. Single writer of this file.**

The phase can be accepted or rejected from its own records. Nothing here is quoted where it could
be derived; every number below was produced by a command run at close, and the commands are pasted
beside their output.

---

## §1 — REQUIREMENT COVERAGE, DERIVED BY COMMAND

### The register, re-derived rather than sought at a pinned offset

```
$ command grep -n "^| NAV-0" .planning/REQUIREMENTS.md
599:| NAV-01 | Phase 97 — Reachability | Pending |
600:| NAV-02 | Phase 97 — Reachability | Pending |
601:| NAV-03 | Phase 97 — Reachability | Pending |
602:| NAV-04 | Phase 97 — Reachability | Pending |
```

(as measured immediately before this plan's Task 3 rewrote the four status cells)

**The rows have MOVED TWICE, and a pinned line number would have missed them both times.**
`97-CONTEXT.md` and `ACCEPTANCE-P97-PLAN.md` say **543–546**; `97-12-PLAN.md` corrected that to
**551–554** on 2026-08-17; at close they sit at **599–602**. The register grows every phase, so a
pinned offset is a decaying claim. The gates use a row-prefix grep and are line-independent, which
is why none of this cost anything. **The two out-of-plan documents still carry `543–546`; that
correction is the orchestrator's — this phase's commit pathspec is the plan directory and the
register.**

### The ROADMAP-versus-register comparison — RUN, not assumed

```
$ REG=$(command grep -o "^| NAV-0[0-9]" .planning/REQUIREMENTS.md | tr -d '| ' | sort)
$ DEF=$(command grep -oE '^- \[[ x]\] \*\*NAV-0[0-9]' .planning/REQUIREMENTS.md | grep -o 'NAV-0[0-9]' | sort)
$ RM=$(sed -n '/^### Phase 97: Reachability/,/^### Phase 98/p' .planning/ROADMAP.md \
        | command grep '^\*\*Requirements\*\*:' | grep -o 'NAV-0[0-9]' | sort)

register rows : NAV-01 NAV-02 NAV-03 NAV-04
definitions   : NAV-01 NAV-02 NAV-03 NAV-04
ROADMAP line  : NAV-01 NAV-02 NAV-03 NAV-04
REGISTER == ROADMAP     : IDENTICAL (4/4, checked not assumed)
REGISTER == DEFINITIONS : IDENTICAL
counts: register=4 definitions=4 roadmap=4
```

**The agreement is REAL this phase — first time in four phases — and it is stated because it was
checked.** A match that is assumed and a match that is verified are indistinguishable in a report
and different in fact; the derivation is what makes this one the second kind. Definitions sit at
`REQUIREMENTS.md:132-135`; the ROADMAP line at `ROADMAP.md:481`.

### 4/4, each mapped to the success criterion it serves and to the plans that closed it

| id       | ROADMAP success criterion                                                                                                                          | plans that closed it                                                                                                                                  | what shipped                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NAV-01` | 1 — all 8 declared dossier types on the sidebar, the hub type cards, `/dossiers/create` and `/compare`                                             | `97-01` (oracle), `97-04` (canonical type home), `97-05` (sidebar + hub cards + the real count), `97-06` (`/compare`)                                 | one literal 7-member list plus one spread-derived 8-member card set, single-homed, with a compile-time anti-merge guard proven by mutation; the Elected Officials row on the sidebar (observed at desktop 1400 AND in the mobile drawer, plus the command palette for free); the hub card with a REAL count equal to an independently fetched total, and the fabricated `0` removed at its source (an absent figure renders the shipped em dash for EVERY type, not just this one); `/compare` widened with a subtype-filtered fetch arm, a `person_subtype` predicate, a 12-field EO configuration and both locales. `/dossiers/create` already shipped 8/8 and was verified by click-through rather than edited |
| `NAV-02` | 2 — every `/settings/*` page renders navigation; the prefix and exact-match checks agree                                                           | `97-01` (oracle), `97-07` (subject)                                                                                                                   | ONE shared predicate module (`isSettingsPath` / `isSettingsPathExact`) consumed by both disagreeing sites — never a second synced copy; the nav column moved to the ROUTE layout so it mounts for the index and every child alike; the column became route-driven (`validateSearch` whitelist = the rendered row list, so accepted values and rendered rows agree by construction). Observed at BOTH viewports                                                                                                                                                                                                                                                                                                    |
| `NAV-03` | 3 — the engagement Digests tab, and a create affordance on every list page                                                                         | `97-02` (oracles), `97-08` (subject)                                                                                                                  | one `WORKSPACE_TABS` entry after `signals`, `tabs.digests` in both locales from the shipped `intelligence-digests` string; one `actions` slot on `ListPageShell` and the EO recipe copied verbatim to seven call sites with zero new copy and zero new CSS                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `NAV-04` | 4 — every route with no inbound link resolved; the 9 admin routes and `/monitoring` each given a nav entry or deleted, decision recorded per route | `97-03` (instrument + populations), `97-09` (the single-writer decision table), `97-10` (the NAV ENTRY half + the palette), `97-11` (the DELETE half) | a mechanical INBOUND-LINK instrument with pinned controls and a printed residual; nine per-route decisions with why, owner and cited evidence; three nav entries added (`/admin/ai-usage`, `/admin/approvals`, `/monitoring`), four rows left alone as already-reachable, one assigned to Phase 102; **zero routes deleted** (both conditional triggers refuted); two dead MODULES deleted; the command palette's hardcoded `isAdmin=true` replaced with the Sidebar's own check                                                                                                                                                                                                                                  |

### NAV-04's filed sub-items, BOTH named — a silent drop of either is a REJECT

- **`frontend/src/services/auth.ts`** — filed on the requirement itself
  (`REQUIREMENTS.md:135`'s note, `RULING-P92-06`). **Resolved: DELETE.** The zero-importer
  derivation was RE-RUN at execution against a known-imported control in the same run (subject: 0
  hits across five import spellings; control `services/dossier-api`: 38 hits), the dual-store
  evidence re-verified on disk (`:76 persist(`, `:624 name: 'auth-storage'` — the same key as the
  live `store/authStore.ts:272` — and `:635` a module-level `onAuthStateChange`), and the module
  removed in `e6ac817f3`. Typecheck and build were green BEFORE the deletion (so a post-deletion
  red would have been attributable) and green after.
- **`frontend/src/components/layout/QuickNavigationMenu.tsx`** — filed by `RULING-P97-03` §1 rather
  than by the register text. **Resolved: DELETE.** Zero external references (control: `Sidebar`,
  81). The ruling's premise — that it held "a second route list beside `navigation-config.ts`" — was
  **REFUTED by reading the file**: it contains no route list at all, only pinned/recent ENTITIES
  whose `route` is a runtime value off two zustand stores. So the record's obligation to "say what
  its list contained that the live config does not" is discharged with **nothing was discarded**.
  Recorded cost: `store/pinnedEntitiesStore.ts` is now dead code; it is outside the row's subject
  and was NOT deleted.

**No requirement, sub-item or route was silently dropped.** Every candidate route carries an
anchored decision token; the two modules carry theirs; the four out-of-phase surfaces are named in
§3 with their owners.

---

## §2 — DECISION COVERAGE, GREEN, AND ITS FALSIFICATION DRILL ON DISK

```
$ node scripts/decision-coverage.mjs .planning/phases/97-reachability \
       .planning/phases/97-reachability/97-CONTEXT.md
DC-RC=0
{
  "passed": true,
  "skipped": false,
  "plans_scanned": [ 97-01 … 97-12, all twelve ],
  "total": 13,
  "covered": 13,
  "coverage": {
    "D-01": ["97-12-PLAN.md"],
    "D-02": ["97-04-PLAN.md","97-09-PLAN.md","97-10-PLAN.md"],
    "D-03": ["97-04-PLAN.md","97-05-PLAN.md","97-06-PLAN.md"],
    "D-04": ["97-07-PLAN.md"],
    "D-05": ["97-02-PLAN.md","97-08-PLAN.md"],
    "D-06": ["97-09-PLAN.md","97-10-PLAN.md"],
    "D-07": ["97-09-PLAN.md","97-11-PLAN.md"],
    "D-08": ["97-03-PLAN.md","97-11-PLAN.md"],
    "D-09": ["97-03-PLAN.md"],
    "D-10": ["97-01-PLAN.md","97-02-PLAN.md","97-10-PLAN.md"],
    "D-11": ["97-12-PLAN.md"],
    "D-12": ["97-01","97-05","97-06","97-07","97-08"],
    "D-13": ["97-12-PLAN.md"]
  },
  "uncovered": []
}
```

Exit **0**, `uncovered: []`, 13/13. The instrument is STRICTER than the real gate — it implements the
mechanical `\bD-NN\b` match only and not the real gate's six-word soft-phrase match — so this green
is conservative.

### THE FALSIFICATION DRILL — both colours, run in a scratch copy at `/tmp/p97-12/dcdrill`

A coverage gate that has never been seen red is a gate nobody has tested.

```
=== scratch baseline (unmutated copy of all 12 plans + the context) ===
SCRATCH-BASE-RC=0        passed true  covered 13/13  uncovered []

=== the mutation: strip the ONLY D-01 citation from 97-12's `truths` ===
(D-01 is cited by exactly one plan, so removing that one citation is a true falsification
 rather than a partial one)

=== RED direction ===
SCRATCH-MUTATED-RC=1
passed false  covered 12/13
uncovered: [
 { "id": "D-01",
   "text": "**D-01: The phase closes 4 requirements** — `NAV-01..04`, each mapped in plan frontmatter to" }
]

=== RESTORED ===
SCRATCH-RESTORED-RC=0    passed true  covered 13/13  uncovered []
```

**A second fact the drill produced, worth more than the red itself.** After the mutation, `D-01`
still appears **8 times** across the scratch plan set — in prose, task bodies and acceptance
criteria — and the scanner reported it UNCOVERED anyway. That is positive evidence the scanner is
correctly SCOPED to frontmatter `truths`/`must_haves`/`objective` and the matching body sections,
and does not accept a decision id mentioned in passing. The repo tree was untouched throughout
(`git status --porcelain` on the phase directory: no drill residue).

---

## §3 — CLOSING POPULATION STATEMENTS

Population-definition blindness is the failure this section exists to prevent: **a correct command
returns a correct number about the wrong set.** So each population says what is inside it and what
falls outside it.

### §3a — the ROUTE population (mechanical, `frontend/src/routeTree.gen.ts`)

```
$ sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts | command grep -c "':"
203                                        # at HEAD, 2026-08-17
$ git show phase-97-base:frontend/src/routeTree.gen.ts | sed -n '…' | command grep -c "':"
203                                        # at phase-97-base
$ git diff --name-only phase-97-base -- frontend/src/routeTree.gen.ts | wc -l
0
```

**203 → 203, delta 0, and `routeTree.gen.ts` is byte-unchanged.** `97-03-SUMMARY.md` predicted this
number was "expected to move — 97-11 deletes routes". **It did not move**, because both conditional
route triggers were refuted, and the prediction is recorded as UNMET rather than absorbed. D-08 is
honoured in the other direction: no gate anywhere froze 203, and `97-11` task1 derives `N` at run
time and only bounds it.

**INSIDE:** full route paths registered in `FileRoutesByFullPath` (203 spellings, 186 distinct after
trailing-slash normalisation — both true, answering different questions; swapping one for the other
is the population error).
**OUTSIDE, stated:** lazy children invisible to that interface; redirect targets with no file of
their own; routes reachable only through search-param state; anything outside `frontend/src` — the
Express API surface is a different population entirely.

**ADMIN sub-population: 8** (`/admin/`, `ai-settings`, `ai-usage`, `approvals`, `data-retention`,
`field-permissions`, `preview-layouts`, `system`) against the register's **9**. **Delta −1, stated
not absorbed.** The eighth member is the redirect-only `/admin/` index. A reader counting _pages_
would say seven, registered _paths_ says eight, the register says nine. The candidate set criterion 4
operates on is **9** = 8 admin paths + `/monitoring`.

### §3b — the INBOUND-LINK population (`scripts/inbound-link-classify.mjs`)

**INSIDE:** quoted route-shaped strings in `frontend/src` `*.ts`/`*.tsx`, excluding
`routeTree.gen.ts` and `**/__tests__/**`, resolved by full-path boundary match with longest-wins
attribution.
**OUTSIDE, verbatim from the instrument's own output so the document and the tool cannot drift:**
computed paths via `getDossierDetailPath` / `getDossierRouteSegment` (33 files); template-literal
`to={}` props assembled at runtime; runtime-built strings passed through variables; redirects held
in server data; `useRecentNavigation` (a replay of visited paths — derivative, not an origin); e2e
`page.goto` (not a product link); and UNQUOTED route-shaped text — regex literals over paths
(`CommandPalette.tsx:283 pattern: /^\/admin/`) and JSDoc `Route:` banners.

**FLOOR and CEILING, both restated because they point in opposite directions:** a count is a FLOOR
for the ABSENCE claim (a zero may under-count — a link form was missed) and a CEILING for the
PRESENCE claim (a non-zero may over-count — the linking file may itself never be mounted).
**`LIVE` means "in the rendered tree by file location, and not classified otherwise" — never "proven
mounted".** `/monitoring` is the in-repo proof of the second half: its only link lived in a tree
mounted by one demo route.

Every zero was instrument-tested TWICE: the pinned control `/admin/ai-settings` resolved 2 LIVE
links in the same run as every zero, and an independent raw-substring sweep (separate code path, no
forms, no boundary rule) accounted for every hit in every zero row. **Residual: 0 in the
nine-candidate run — a real zero, proven by the same binary printing `RESIDUAL (1)` on a three-path
control query in the same session.**

### §3c — the PHASE-LEVEL population: what the four criteria cover, and what they deliberately do not

**COVERED:** the four NAV-01 exposure surfaces; the `/settings/*` subtree's navigation at two
viewports; the engagement tab bar and the eight list pages' create affordances; the nine criterion-4
route candidates and the two filed dead modules.

**DELIBERATELY NOT COVERED — named with owners, not left to be inferred:**

| surface                                                                                                                                                                                                                                                                                                                                                                    | owner                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `COPY-*`, including the global English toast (`COPY-06`), the hardcoded English `"% of total active dossiers"` at `DossierTypeStatsCard.tsx:229`, the missing `dossier:typeDescription.elected_official` + four `typeGuide.elected_official.*` keys in both locales, and `elected-officials:list.add`'s Title Case divergence from the sentence-case `empty-states` family | **Phase 98**                                          |
| Arabic naturalness and pixel RTL — including the operator's own sitting; no visual baseline was committed anywhere in this phase, and none was produced                                                                                                                                                                                                                    | **Phase 99** + the OPERATOR parks (claimed by no one) |
| RLS and residue — server-side authorization for every admin surface this phase made _visible_. `T-97-30` remains ACCEPTED, not fixed: the palette change is a VISIBILITY fix, never an authorization one, and the admin routes stay URL-reachable behind `beforeLoad: requireAdmin` regardless                                                                             | **Phase 100**                                         |
| CI, and `E2ECRED-01` (the six absent `E2E_*` keys) and `ROOTALIAS-01` (the root `vitest.config.ts` aliasing `@` → a nonexistent `<repo-root>/src`)                                                                                                                                                                                                                         | **Phase 101**                                         |
| `/delegations`, `GATESTD-01`, `WRITER-ROUTE-01`, `INSERT-SYNC-01`, plus `PREVIEW-HOLLOW-01` (assigned by `RULING-P97-14` §2) and the `GATESTD-04` third-direction remedy                                                                                                                                                                                                   | **Phase 102**                                         |

### §3d — the intended-broken exclusions, RE-VERIFIED AS UNTOUCHED at close

Not asserted — derived:

```
$ git diff --name-only phase-97-base -- 'frontend/src/routes/_protected/delegations*' 'frontend/src/pages/delegations*'   -> 0 files
$ git diff --name-only phase-97-base -- '*legal-hold*' '*legalHold*'                                                      -> 0 files
$ git diff --name-only phase-97-base -- frontend/src/routes/_protected/admin/data-retention.tsx                           -> 0 files
$ …routeTree.gen.ts | grep -o "'/delegations[^']*'"   -> '/delegations'          (still registered)
$ …routeTree.gen.ts | grep -o "'[^']*sandbox[^']*'\|'[^']*responsive[^']*'"
   '/responsive-demo'   '/scenario-sandbox'                                       (both still registered)
$ …routeTree.gen.ts | grep -o "'/engagements'\|'/dossiers/engagements/'"
   '/engagements'   '/dossiers/engagements/'                                       (the double-mount, both doors intact)
```

`/delegations` (Phase 102) and the legal-holds region (Phase 100, hosted in
`admin/data-retention.tsx`) keep their owners: no nav entry, no deletion, no re-homing, no edit.
The `/engagements` double-mount, `scenario-sandbox` and `responsive-demo` are all still present —
a reachability sweep must not "fix" them and did not.

**The four `ALREADY-REACHABLE` admin routes received no duplicate entries.** Derived per route from
the live nav config: `/admin/ai-settings` = 1, `/admin/system` = 1, `/admin/field-permissions` = 1,
`/admin/data-retention` = 1 — occurrence counts asserted with `-eq 1`, not `>= 1`, which is what
makes a duplicate detectable. `/admin/preview-layouts` = 0, as its `OWNED-ELSEWHERE-UNTOUCHED` row
requires. Without the term `ALREADY-REACHABLE` in the decision vocabulary, those four rows would
have been forced into `NAV ENTRY` and `97-10` would have added four duplicate sidebar entries.

---

## §4 — BOUNDS AND OPEN EDGES

The phase's honest edges, in one list. Two were known at plan time and are recorded first.

### The two plan-time bounds

1. **`97-RESEARCH.md`'s `## Open Questions` heading carries no `RESOLVED` marker** —
   `command grep -c 'RESOLVED' 97-RESEARCH.md` → **0**, verified at close. All three questions are
   substantively disposed of (Q1 → D-06 plus the CONTEXT's Claude's-Discretion clause, Q2 → the
   evidence-at-execution PARK policy carried into `97-09`, Q3 → `97-08` electing
   `ListPageShell.actions`), but the heading still reads open. The plan-revision round DECLINED to
   edit it because that round's commit pathspec was the PLAN files only, and editing a research
   artifact under a plan-file pathspec would have left an uncommitted change in a tree carrying
   exogenous paths. **Open documentation edge; owner: the orchestrator.** Not a resolved item.
2. **Coarse-aggregate gates redirect stdout to stderr so the drill captures the attributing text** —
   26 `1>&2` occurrences across the 29 gate bodies. A full per-gate tee-to-file was DECLINED as a
   worse trade: it multiplies edits across a dozen long single-line gates and risks the
   exit-code-through-a-pipe defect the phase is trying to avoid. **Consequence: a very long compiler
   output may be TAIL-truncated in the drill record** (the instrument keeps the last 3 stderr lines).
   Where that happened, `97-GATE-DRILL.md` quotes the message from a hand re-run and says so —
   `97-04` task1's `TS6196` and `TS2344`, `97-05` task1's scratch `TS2322` control, `97-07` task2's
   `error TS` count of 0.

### The bounds execution recorded

| #   | bound                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | owner                                                                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **The engagements read path.** `/engagements` and `/dossiers/engagements` both fail to render rows over data that exists (5 engagement dossiers, 3 `engagement_dossiers` rows, verified by live catalog query). Three observations are blocked: both Digests-tab tests and the engagements affordance test. The read path resolves to the Supabase Edge Function `engagement-dossiers`, NOT the local Express backend — `97-02`'s `curl localhost:5001 → 401` was probing the wrong tier                                                                                                                                                                                                                                                                                                                            | **UNABLE TO MEASURE**, both runs, never a pass. `RULING-P97-13` §2 requires it be filed with an owner and the three observations BOUNDED. Criterion 3's create half is behaviourally proven on **7 of 8 pages plus its positive control**; the Digests half is proven at the tab-entry level by a supplementary probe and unmeasurable by its oracle                                                                                                                                                                          | **ALREADY FILED** as `ENGREAD-01`, **Phase 102**, with a register bullet and row — verified at close, not assumed. The row correctly records the DISAMBIGUATION (rows exist + an ERROR state, so not a fixture gap and not RLS, whose denial reads as an empty 200) |
| B2  | **`tests/e2e/93-dossier-list-counts-error.spec.ts` is RED and unrepaired.** Measured at close: `Expected: 7 / Received: 8` at `:83`. `97-05` widened the counts-error branch from the DB-7 to the CARD-8 as its plan directed; that Phase-93 oracle freezes `DOSSIER_TYPE_COUNT = 7`. `git log phase-97-base..HEAD` on the file is empty                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **RED**. `97-05` disclosed it and declined to edit a file outside its `files_modified`; two repairs were offered (repoint the literal / derive it from `DOSSIER_CARD_TYPES.length`, or revert the branch to the DB-7 with the asymmetry recorded) and neither was chosen                                                                                                                                                                                                                                                      | unassigned at close — needs a ruling, then an owner                                                                                                                                                                                                                 |
| B3  | **The non-admin negative for NAV-04 was never run.** `97-10`'s fourth test is `test.fixme`, and the reason is MEASURED not assumed: the committed `tests/e2e/support/storage/analyst.json` expired 2026-06-04, and a negative built on it would pass for the trivial reason that no sidebar renders at all — a vacuous green wearing a negative's clothes                                                                                                                                                                                                                                                                                                                                                                                                                                                           | **UNABLE TO MEASURE.** The hidden-from-non-admins half of NAV-04 is NOT proven. An unproven negative is not a proven one                                                                                                                                                                                                                                                                                                                                                                                                      | `E2ECRED-01`, **Phase 101**                                                                                                                                                                                                                                         |
| B4  | **Two `CANNOT CONSTRUCT` gates** — `97-08` task1 (ceiling 0 of 2) and task3 (ceiling 8 of 9). Their structural halves are fully satisfied and their behavioural halves RAN; the ceiling is B1, not their subject                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | recorded as `CANNOT CONSTRUCT`, never `SOUND`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | see B1                                                                                                                                                                                                                                                              |
| B5  | **Two `NOT-CHECKED` decision rows.** `/monitoring`'s **production** render (the dev stack was driven end to end, 200/200 with no error testids, and the guard read at `backend/src/index.ts:83-89` — but no production build was stood up, so the degradation claim is derived from the code path, not observed). `/admin/data-retention` and `/admin/field-permissions` render state (a 2026-08-15 audit recorded 401s; both are `ALREADY-REACHABLE` so no new entry points at them, and their state is unestablished here rather than assumed repaired)                                                                                                                                                                                                                                                           | `NOT-CHECKED` beats silence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | recorded, unowned                                                                                                                                                                                                                                                   |
| B6  | **`/admin/` (the redirect-only index) has NO true term in the closed vocabulary.** `ALREADY-REACHABLE` is false (no nav row of its own), `NAV ENTRY` would instruct a duplicate, `NOT-CHECKED` is false because it WAS checked. It carries a row and no token                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | recorded, excluded from every consuming gate's loop                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | see §4b                                                                                                                                                                                                                                                             |
| B7  | **Two settings children show a nav column over a visibly blank pane for 0.6–1.0 s.** `NotificationPreferences.tsx:149-155` and `EmailDigestSettings.tsx:245` return a text-free spinner. Measured: first content at 968 ms / 648 ms against a passing sibling at 344 ms, and `97-07` ruled out its own `validateSearch` change BY EXPERIMENT (same timings with the param already present)                                                                                                                                                                                                                                                                                                                                                                                                                          | the ORACLE was repaired (`RULING-P97-13` §1); the SPINNER is filed and unfixed. A spinner with no accessible text is invisible to a screen reader as well as to a probe. **Fixing the components is the SHIPPING fix; relaxing the oracle alone fixes the measurement and leaves the pane blank**                                                                                                                                                                                                                             | **ALREADY FILED** as `SPINNER-A11Y-01`, **Phase 99**, with a register bullet and row carrying both `file:line` citations and the measured timings — verified at close                                                                                               |
| B8  | **Four tracked test files carry a dangling reference to the deleted `services/auth`** — `tests/unit/components/{Header,MFASetup,MFAVerification,Sidebar}.test.tsx`, via a spelling (`../../../frontend/src/services/auth`) and a repo root that every zero-importer derivation in the record was blind to. They were **already broken pre-phase** (root `vitest.config.ts` aliases `@` → a nonexistent `<repo-root>/src`; measured: 4 files failed, **zero tests ran**) and no script or CI job reaches that config                                                                                                                                                                                                                                                                                                 | `RULING-P97-16` §4 rules a DATED NOTE on the existing row, not a new row and not a repair here                                                                                                                                                                                                                                                                                                                                                                                                                                | `ROOTALIAS-01`, **Phase 101**                                                                                                                                                                                                                                       |
| B9  | **Nine C9b consumer specs were found and NOT RUN** — the four `frontend/tests/e2e/list-pages-*` specs (the seven list pages gained a header actions node), `settings-{page,save}` + `92-signout` (the settings nav rows moved `<button>` → `<a href>`), and `03-dossier-navigation` / `04-command-palette` / `08-export-import` / `ar-smoke/dossier-navigation.ar` (the hub grid went 7 → 8 cards and the palette's admin rows became role-conditional)                                                                                                                                                                                                                                                                                                                                                             | the sweep FOUND them; running them was not done. Stated as a bound rather than reported as a clean sweep                                                                                                                                                                                                                                                                                                                                                                                                                      | unassigned at close                                                                                                                                                                                                                                                 |
| B19 | **The register has a SECOND writer this phase, and it is not a plan.** `97-12` is declared its only writer and the mechanical check agrees — exactly one plan names `.planning/REQUIREMENTS.md` in its `files_modified`, and no plan SUMMARY reports writing it (the four SUMMARY hits are CITATIONS of `:135`, not edits). But `git log phase-97-base..HEAD -- .planning/REQUIREMENTS.md` returns **`b78b2333a docs(97): file ENGREAD-01 … + SPINNER-A11Y-01 — both register arms`** — the orchestrator, writing under `RULING-P97-13`'s filing order                                                                                                                                                                                                                                                              | **Not a plan-level violation by the rule's own definition, and disjoint in fact:** that commit is +50 lines adding two new sections, and it touched **0** of the four `NAV-0*` rows and **0** of the four definitions (derived, not assumed). So nothing was overwritten and the two writers never met. It is recorded anyway, because "exactly one writer" measured over PLAN files is a narrower claim than "exactly one writer", and reporting the narrow result as the general one is this phase's own named failure mode | recorded; the ruled filings are correct and are cited by B1 and B7                                                                                                                                                                                                  |
| B17 | **The register's OWN documented derivation command is blind to 18 of its 94 requirements — 19%.** `REQUIREMENTS.md` calls its traceability table "the single source of truth for the requirement count — derive it, do not restate it elsewhere" and publishes two commands anchored on `[A-Z]+-[0-9]+`. That pattern cannot match a MULTI-SEGMENT id: `PARALLEL-TRUTH-01`, `SPINNER-A11Y-01`, `E2ECRED-01`, `INSERT-SYNC-01`, `WRITER-ROUTE-01`, `DR-SUBPATH-01`, `FUNC-GRANT-01`, `RETENTION-CAST-01`, `SANDBOX-500-01`, `RLS-AUTHUSERS-01`, `LEAK-ATTACH-01`, `NOTFOUND-COMPONENT-01`, `AUDIT-DROP-01`, `AUDIT-ZERO-01`, `E2ESTALE-01`, `P52FIXTURE-01`, `PIN-2390-01`, `SEED-DELEG-01`. Measured at close: documented commands **76 / 76**; a hyphen-tolerant `[A-Z0-9]+(-[A-Z0-9]+)*-[0-9]+` gives **94 / 94** | The published derivation still AGREES with itself (76 == 76), so the "0 orphaned, 0 duplicated" claim it makes is true about the set it can see and silent about the other 18. Checked with the corrected instrument at close: **94 bullets, 94 rows, zero bullets without a row, zero rows without a bullet, zero duplicates.** This is population-definition blindness in the document that exists to prevent restating counts                                                                                              | unassigned at close — a register-instrument defect, not a Phase 97 deliverable                                                                                                                                                                                      |
| B18 | **`PREVIEW-HOLLOW-01` was ASSIGNED an owner by `RULING-P97-14` §2 (Phase 102) and has NO register row.** Verified at close: 0 bullets, 0 rows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `97-12`'s Task 3 action authorizes exactly two new rows (`PALETTE-ADMIN-01` conditionally, `PARALLEL-TRUTH-01` conditionally) and this is neither, so it was NOT filed here rather than filed outside the plan's declared scope. **A finding named only in a ruling and a SUMMARY reaches nobody** — it is named in the NAV-04 register row's bound text so it is at least on the durable surface                                                                                                                             | needs the orchestrator to file the row                                                                                                                                                                                                                              |
| B10 | **`PARALLEL-TRUTH-01` residue: three same-class copies found by `97-04`, routed by `97-09`, and NOT re-pointed** — `components/dossier/DossierTypeGuide.tsx:380` (the DB-7 in a FOURTH distinct order), `components/dossier/wizard/hooks/useDraftMigration.ts:14`, `components/keyboard-shortcuts/CommandPalette.tsx:305` (`DOSSIER_TYPE_ORDER`, the CARD-8, its own comment saying "all 8 dossier types"). So the class was **six copies, not nine — the register undercounts by three**                                                                                                                                                                                                                                                                                                                           | filed with owners, unexecuted: all three sit outside `97-04`'s files, two outside every P97 plan's scope, and the third belongs to `97-10` whose action forbids unrelated palette edits                                                                                                                                                                                                                                                                                                                                       | **FILED at close** as `PARALLEL-TRUTH-01`, **Phase 102** (bullet + row). `97-NAV04-DECISIONS.md` §6 named the FILER (`97-12`) but no owning phase; the phase assignment is this plan's judgement and is stated as such in the row itself                            |
| B11 | **`hooks/useRecentNavigation.ts:69` still calls `createNavigationGroups(…, true)`** — the same hardcoded literal the palette fix removed, on a different surface. Examined and judged NOT the same defect: it builds a path→title map for labelling recently-visited pages, emits no commands and surfaces no admin affordance, and a non-admin cannot populate an admin entry there because every admin route is guarded                                                                                                                                                                                                                                                                                                                                                                                           | recorded, untouched. The third and last call site if a later phase wants the hardcode gone repo-wide                                                                                                                                                                                                                                                                                                                                                                                                                          | unassigned                                                                                                                                                                                                                                                          |
| B12 | **`97-NAV04-DECISIONS.md` carries stale pre-ruling PROSE.** Its `:251` still says `/admin/approvals`'s decision is `PARKED-RE-ESCALATED`, and `:301` still explains why `/admin/preview-layouts` is `PARKED-RE-ESCALATED` rather than `OWNED-ELSEWHERE-UNTOUCHED`. `RULING-P97-14` amended the §2 rows and the anchored tokens (`NAV ENTRY`, `OWNED-ELSEWHERE-UNTOUCHED`) but not the narrative underneath. `97-10` followed the tokens, which is what the document's own §1 token contract instructs                                                                                                                                                                                                                                                                                                               | **a reader who reads §3 and not §2 gets the pre-ruling answer.** `97-09` is the file's single writer and `97-10` correctly did not edit it                                                                                                                                                                                                                                                                                                                                                                                    | the orchestrator                                                                                                                                                                                                                                                    |
| B13 | **`97-06` edited two files outside its declared `files_modified`** (`types/entity-comparison.types.ts` 4 lines, `pages/entity-comparison/EntityComparisonPage.tsx` 2 lines). Measured, not predicted: the widening was landed across the five declared files first and `tsc` produced five `TS2345` errors in those two; both gates end in `pnpm typecheck`, so leaving them would have made both gates permanently red                                                                                                                                                                                                                                                                                                                                                                                             | `RULING-P97-12` §4 AUTHORIZED it and records it as a **PLAN-SCOPE defect**, not worker overreach — the plan was not executable within its declared set. A `files_modified` sweep across all twelve plans was REPORTED, not asserted: neither path appears in any of the twelve                                                                                                                                                                                                                                                | closed by ruling                                                                                                                                                                                                                                                    |
| B14 | **The `/admin/preview-layouts` hollow-feature finding.** The config surface is live but nothing consumes what it configures: `entity_preview_layouts` is read/written only by `usePreviewLayouts.ts`, whose sole importer is the admin route itself, while its declared consumers (hover previews, search results, embedded references) never read it. Re-derived at close by `97-11` and unchanged                                                                                                                                                                                                                                                                                                                                                                                                                 | not a reachability disposal; recorded with the row rather than acted on                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `PREVIEW-HOLLOW-01`, **Phase 102** (`RULING-P97-14` §2)                                                                                                                                                                                                             |
| B15 | **The `git checkout` loss during the repair round.** An unstaged working-tree change to `97-09-PLAN.md` was discarded. Verified by the overseer: the file is byte-identical to the accepted `d561738fa` content, so nothing ruled, accepted or graded was lost, and an unstaged change never enters the object store so nothing was recoverable                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `RULING-P97-17`: record it as "most likely my own mangled edit; unprovable either way; nothing accepted was lost". The standing project law (never `git checkout` a file with uncommitted changes) was violated, at a measured cost of approximately zero                                                                                                                                                                                                                                                                     | closed by ruling; the process rule stands                                                                                                                                                                                                                           |
| B16 | **Side effect, stated plainly:** the NAV-01 create-submit test writes a real row to the dev stack's database each run (`e2e-97-01-elected-official-<timestamp>`). **Counted at close rather than estimated: 21 such rows are in the database** (`dossiers` where `type='person'` and `name_en ILIKE 'e2e-97-01-elected-official-%'`). No spec cleans them up, and every future run of that test adds one. The shipped `elected-official-create.spec.ts` already did the same, so this is an existing pattern rather than a new one                                                                                                                                                                                                                                                                                  | recorded, not cleaned up. Note the second-order effect: the NAV-01 count assertion is an EQUALITY against an independently fetched total, so a growing row count does not weaken it — but any future gate that pins a literal EO count would rot immediately                                                                                                                                                                                                                                                                  | unassigned                                                                                                                                                                                                                                                          |

### The operator parks — claimed by no one, and that is the correct state

Arabic naturalness, pixel RTL, and the `/calendar` four-point baseline remain OPERATOR parks. **No
visual baseline was committed anywhere in this phase** (D-12), and none was produced. What WAS
observed of Arabic is structural, not aesthetic: eight `/compare` options render real Arabic under
`dir="rtl"` with zero raw-key leaks; the settings nav renders translated rows under `dir="rtl"` with
the same single `aria-current` marker; the nine engagement tabs render Arabic including the new
`الملخصات`. None of that is a naturalness claim.

---

## §4b — CLOSED-VOCABULARY REGISTER

A missing term in a closed vocabulary does not merely fail to describe a state; it **FORCES A WRONG
DESCRIPTION, and the wrong description becomes an instruction downstream.**

| vocabulary                                                                                                 | owner                       | verdict                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NAV-04 route decisions                                                                                     | `97-09`                     | **TERM ADDED — `ALREADY-REACHABLE`** — four candidates already have live nav rows and would have been forced into `NAV ENTRY`, instructing `97-10` to add duplicates                                                                                                                                                                                                                                             |
| NAV-04 route decisions                                                                                     | `97-09`                     | **TERM ADDED — `PARKED-RE-ESCALATED`** — the action already used it for a refuted trigger while the permitted list did not contain it                                                                                                                                                                                                                                                                            |
| NAV-04 route decisions                                                                                     | `97-09`                     | **STILL INCOMPLETE — `/admin/` (the redirect-only index) has no true term.** It carries a row and NO token, and the record says why. Costs nothing downstream because it is excluded from every consuming gate's loop, but it is an incompleteness, not a resolution — recorded here rather than smoothed over (B6)                                                                                              |
| dead-module decisions (`DELETE` / `OWN`)                                                                   | `97-09` → `97-11`           | COMPLETE                                                                                                                                                                                                                                                                                                                                                                                                         |
| palette branch (`BRANCH-A` / `BRANCH-B`)                                                                   | `97-09` → `97-10`           | COMPLETE — closed by `RULING-P97-01`'s filing order, which permits exactly two answers. Both arms were drilled: branch B proven SATISFIABLE as well as falsifiable                                                                                                                                                                                                                                               |
| instrument RENDERED classes (`LIVE` / demo-only / dead-module)                                             | `97-03`                     | COMPLETE, with `LIVE`'s MEANING restated: "in the rendered tree by file location", never "proven mounted" — which is what makes an inbound count a FLOOR for absence and a CEILING for presence                                                                                                                                                                                                                  |
| residual hand-classification verdicts (`link` / `not-a-link` / `non-rendered` / `needs-execution-recheck`) | `97-03`                     | COMPLETE for the instrument's stated population; no residual in any run needed a fifth term, and no candidate was `needs-execution-recheck`                                                                                                                                                                                                                                                                      |
| comparison outcome states                                                                                  | `97-06`                     | **TERM ADDED — `LOADING`** — an in-flight query rendering the empty state says "there are none" when the truth is "not yet known". Implemented as `isPending`, deliberately not TanStack's `isLoading` (`isPending && isFetching`), because on the first render after a type is selected `isFetching` is still false and the empty state would flash for one frame                                               |
| data-precondition outcomes (rows present / `DATA-PRECONDITION UNMET` / `SKIPPED`)                          | `97-02`                     | **INCOMPLETE, measured by `97-08`: a THIRD cause exists and mis-files as the second.** `unmetCause()` distinguishes query-error-state from "seeding gap" and attributes every silent zero to seeding — but data present + read returns empty 200 is a distinct cause with the opposite remedy, and `working_groups` (6 dossiers in staging) hit exactly that. Recorded, not repaired: the spec is `97-02`'s file |
| gate-drill verdicts (`SOUND` / `REPAIRED` / `CANNOT CONSTRUCT`)                                            | `97-12`                     | COMPLETE by GATE-STANDARD, with the partial-construction rule made explicit at the top of `97-GATE-DRILL.md`: **half-constructed is `CANNOT CONSTRUCT`, never `SOUND`**                                                                                                                                                                                                                                          |
| oracle outcome states                                                                                      | `97-01` / `97-02` / `97-10` | COMPLETE once `SKIPPED` was separated from `PASSED` — see §4c                                                                                                                                                                                                                                                                                                                                                    |

---

## §4c — THE SKIPPED-IS-NOT-PASSED RULE, STATED ONCE FOR THE WHOLE PHASE

**`test.skip()` exits 0, so a skipped test and a passing test are indistinguishable to any gate that
reads only an exit code.** Every Playwright-running gate in this phase therefore derives an EXPECTED
count from the spec's own declaration lines and requires the JSON reporter's PASSED total to equal
it. A run count is COUNTED, never inferred from a zero exit.

Instrument controlled before any count was believed, on a fixture with one non-matching line:

```
$ printf 'xx test(\n  test(\n  test.describe(\n  test.use(\n' > probe
$ command grep -c '^\s*test('    probe   ->  1    # correct: excludes "xx test(", describe, use
$ command grep -c '^\s*test[.(]' probe   ->  3    # the OVER-COUNTING form, retired by RULING-P97-12
```

| spec                                     | declarations                 | `test.fixme` | expected                                                             | actual PASSED   | note                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ---------------------------- | ------------ | -------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `97-elected-officials-reachable.spec.ts` | 5                            | 0            | 4 (`97-05` task3; the compare test is `97-06`'s) + 1 (`97-06` task2) | **4** and **1** | as frozen it counted 2 of 4, on an unsatisfiable `$` URL anchor; after `RULING-P97-12` §1 repaired the anchor the gate exits 0, so PASSED == EXP == 4                                                                                                                                 |
| `97-settings-nav.spec.ts`                | 16 (8 desktop + 8 `@mobile`) | 0            | 8 desktop + 8 mobile                                                 | **8** and **8** | derived from the gate being green: it asserts desktop `PASSED -eq EXPD` (16 − 8 = 8) and mobile `PASSED -eq EXPM` (8). Baseline before the work was 2/16 and 1/8; mid-execution it read 6/8 and 6/8 until `RULING-P97-13` §1 repaired the oracle's fixed-moment content probe         |
| `97-digests-tab.spec.ts`                 | 2                            | 0            | 2                                                                    | **0**           | both `UNABLE TO MEASURE` on B1. Never counted as passes                                                                                                                                                                                                                               |
| `97-list-create-affordances.spec.ts`     | 9                            | 0            | 9                                                                    | **8**           | the ninth is `engagements`, blocked on B1. The one `test.skip(` hit in this file is a COMMENT stating the specs never call it — a C8-shaped hit in a count, verified by reading the line                                                                                              |
| `97-nav04-rows.spec.ts`                  | 3 + 1 fixme                  | 1            | 3                                                                    | **3**           | the fixme'd declaration is counted in the title-equality total `T` (so `D == T` stays satisfiable) and EXCLUDED from `EXP` (so it can never be counted as proven). The JSON reports it `ok: true` with status `skipped` — exactly the indistinguishability the count exists to defeat |

**A `test.fixme` is excluded from the expected count and named in §4 as a bound (B3); a SKIP is
not — it is red.** `97-10` drilled that directly: W12 inserted a RUNTIME `test.skip()` inside a
declared, role-named test, leaving the declaration count and therefore `EXP` untouched. Playwright's
own summary called it a clean run ("2 skipped 2 passed"); only the JSON `PASSED` count turned the
gate red.

---

## §5 — WEAKEST POINT

`ACCEPTANCE-P97-PLAN` condition 10 makes a uniform pass a DOWNGRADE, so finding nothing weak would
itself be the finding. That is not the situation. There is a specific weakest green, it is the one
the phase's own remedy was supposed to prevent, and it was found by running a discriminating command
rather than by adjudicating between two reports.

> **THE WEAKEST POINT: thirty-two test titles across four specs assert that they prove the surface
> for an "ordinary authenticated user", and every one of them ran as an ADMIN — the `.env.test`
> credential resolves to `public.users.role = "admin"`, measured at close. The role label is not
> merely unverified; it is wrong, and `97-01`'s and `97-02`'s gates PIN that exact phrase as a
> `D == T` equality, so the wrong label is now machine-enforced.**

### Why this is the weakest green rather than one of the others

**It was a live contradiction inside the record, and the record could not settle it.** `97-05` B3
probed the account and found the admin-only "AI Settings" sidebar row visible to it; `97-09`,
`97-10` and `97-11` each recorded `ROLE=adminOnly, PROVEN IN-RUN`. `97-06`'s scope note says the
opposite in as many words — _"the **ordinary authenticated user** (`TEST_USER_EMAIL`, not an admin
role)"_ — and cites no measurement. Four plans, one credential, two incompatible role claims.

So the discriminating command was run rather than the reports ranked:

```
$ node /tmp/p97-12/roleprobe.cjs          # reads .env.test, prints ONLY the resolved role
SIGNIN: ok, session for a uid ending ff96
public.users.role = "admin"
isAdmin by the app's own predicate (role === admin || super_admin) = true
```

No credential value was printed. The app's own predicate is
`Sidebar.tsx:54  user?.role === 'admin' || user?.role === 'super_admin'`, so this is the same
computation the product performs, not an analogue of it.

**The count, derived:**

```
$ command grep -c '^\s*test(.*ordinary authenticated user' tests/e2e/97-*.spec.ts   -> 32 total
   97-digests-tab 2 · 97-elected-officials-reachable 5 · 97-list-create-affordances 9 · 97-settings-nav 16
$ command grep -c '^\s*test.*adminOnly'                    tests/e2e/97-*.spec.ts   ->  3
```

**Thirty-two titles carry a role claim no run in this phase exercised. Three carry a correct one** —
`97-10`'s, whose author measured the role in-run instead of assuming it from a username.

### Why it matters more than it looks

1. **It is the exact defect `RULING-P97-03` §3 created the role-naming rule to prevent** — a scoped
   result reported as a general one. The remedy was adopted and then filled with the wrong value, so
   the phase now ships a _more confident_ wrong claim than it would have with no role named at all.
   The class migrated to wherever nobody was looking, one layer up, which is this phase's own
   recurring finding applied to its own remedy.
2. **A gate enforces it.** `97-01`'s gate asserts `D == T` on the literal phrase "ordinary
   authenticated user" across every declaration line, so correcting the label is a two-artifact edit
   under a ruling, not a drive-by — and until then the gate actively keeps the wrong word in place.
3. **The substantive claims mostly survive, and "mostly" is the whole problem.** NAV-01's row is
   structurally not admin-scoped (`navigation-config.ts` gates only the `administration` group on
   `isAdmin`; the `dossiers` group is emitted unconditionally); `/settings` and `/compare` are not
   role-gated; the list pages are not role-gated. Those are **arguments from reading the source, not
   measurements**, and this phase's own standard is that a click-through claim is observed, not
   derived. What is actually OBSERVED for all four criteria is _reachable for an administrator at
   the stated viewport_ — narrower than what 32 titles say.
4. **It compounds with B3.** The one test in the phase that would have exercised a non-admin session
   is `test.fixme`, because the only committed non-admin storage state expired 2026-06-04. So the
   phase has **no non-admin observation of any kind** — neither a positive one (an ordinary user
   reaching these surfaces) nor a negative one (an ordinary user NOT seeing the admin rows). The
   role dimension is unmeasured in both directions, and 32 titles assert one of them.

### What would close it

Correct the 32 titles to the role that was actually exercised (and re-point `97-01`'s `D == T`
literal in the same edit — the two are one artifact pair), OR obtain a working non-admin credential
and run the four specs as one, which closes B3 in the same motion. **Both are Phase 101 territory
via `E2ECRED-01`; neither is a code defect in what this phase built.** The greens are real about the
surfaces; the sentence describing WHO they are real for is wrong.

### The runners-up, named so the choice is legible rather than asserted

- **`97-06` task2's consumed oracle has a permanent floor of 1** — `button[aria-pressed]` matches the
  app's theme toggle on every page at all times, and the settle poll is satisfied by EITHER the empty
  state or a row, so the gate would stay green on a dead fetch arm. Mitigated, not by the gate, but
  by a separate discriminating observation that measured 5 cards against an independent API total of
  5, name for name.
- **`97-05` task2's whole-file clause passes on a COMMENT** — `97-04` landed prose at
  `DossierListPage.tsx:69` saying "Widening it to DOSSIER_CARD_TYPES belongs with the count fix", so
  a `grep -q 'DOSSIER_CARD_TYPES'` clause was green on the undone tree. The gate went red one clause
  later on its real subject, so nothing was concealed — but the criteria's claim about which clause
  would be the red was false.
- **B2, the unrepaired Phase-93 oracle.** Weaker as a _weakest-green_ candidate precisely because it
  is not a green: it is a loud, measured, disclosed red. It is the more serious BUG; it is not the
  most dangerous CLAIM.

**Seventeen of 29 gates carry no green-on-WRONG observation** (`97-GATE-DRILL.md`, third-direction
section). That is the phase's broadest bound rather than its weakest green: it is a stated absence
of evidence, and stated absences are the safe kind.

CLOSING-DERIVATION-END
