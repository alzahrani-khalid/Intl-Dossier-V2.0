# 97-NAV04-DECISIONS — the single-writer per-route decision record for criterion 4

**Written by plan `97-09` (Wave 3), 2026-08-17, at HEAD `fa4ce7393`. Single writer.**

Criterion 4's own text demands that the disposal be **RECORDED per route either way**, so this
document is not a byproduct of the work — it **is** the deliverable. `97-10` acts on its
`NAV ENTRY` rows, `97-11` acts on its `DELETE` / `OWN` rows, and neither writes into it. Nothing
else in Phase 97 records a per-route decision anywhere.

**This plan decides; it changes no code.** No route is deleted here, no nav entry is added here.
Deciding and executing are split so a deletion cannot happen without a row authorising it first,
and so a refuted conditional trigger stops the work rather than being improvised around.

**NOT-CHECKED beats silence.** A fact that could not be established says so, with what was tried.

Record shape mirrors `.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md`.
Inbound-link evidence is CITED from `97-POPULATIONS.md` (plan `97-03`'s measured, control-tested
derivation) and re-derived at execution rather than copied forward — line numbers moved when
`97-05` inserted the Elected Officials row into the same nav file in wave 2.

---

## §0 — the population, re-derived at execution

### The admin sub-population, mechanically derived

```
$ sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts \
    | command grep -o "'/admin[^']*'" | sort -u
'/admin/'
'/admin/ai-settings'
'/admin/ai-usage'
'/admin/approvals'
'/admin/data-retention'
'/admin/field-permissions'
'/admin/preview-layouts'
'/admin/system'
```

**Eight.** `.planning/REQUIREMENTS.md:135` says _"9 admin routes plus `/monitoring`"_.

> **delta −1 versus the register's 9, stated not absorbed.**

The eighth member is **`/admin/`** — the redirect-only index at
`frontend/src/routes/_protected/admin/index.tsx:3-8`, which throws
`redirect({ to: '/admin/ai-settings' })` in `beforeLoad` and renders no page of its own. A reader
counting admin _pages_ says **seven**; a reader counting registered _paths_ says **eight**; the
register says **nine**. This table records the delta rather than picking a number. One plausible
origin of the nine is that it counted the eight paths _and_ `/monitoring` and then wrote "plus
`/monitoring`" as well — a hypothesis, not a derivation, and this document does not resolve it.

**The candidate set criterion 4 operates on is NINE:** the eight admin paths plus `/monitoring`.

### "Candidate" ≠ "measured to have no inbound link" — the two sets differ by four rows

Re-derived at execution with `scripts/inbound-link-classify.mjs` (exit 0, control pin green in the
same run — `/admin/ai-settings` resolved **2 LIVE** inbound links, so every zero below was produced
by an instrument proven able to see a link):

```
NAV-CONFIG ENTRY: /admin NONE
NAV-CONFIG ENTRY: /admin/ai-settings frontend/src/components/layout/navigation-config.ts:185
NAV-CONFIG ENTRY: /admin/ai-usage NONE
NAV-CONFIG ENTRY: /admin/approvals NONE
NAV-CONFIG ENTRY: /admin/data-retention frontend/src/components/layout/navigation-config.ts:215
NAV-CONFIG ENTRY: /admin/field-permissions frontend/src/components/layout/navigation-config.ts:203
NAV-CONFIG ENTRY: /admin/preview-layouts NONE
NAV-CONFIG ENTRY: /admin/system frontend/src/components/layout/navigation-config.ts:191
NAV-CONFIG ENTRY: /monitoring NONE
```

**FOUR of the nine candidates already have a live sidebar row.** Those four are
`ALREADY-REACHABLE` and `97-10` adds NOTHING for them. Reading "named by criterion 4" as "measured
to have no inbound link" is the population-definition error — inside the one requirement whose
subject is population correctness — and its concrete cost would have been four duplicate sidebar
rows.

**Line numbers moved since `97-POPULATIONS.md` §2b** (`:178→:185`, `:184→:191`, `:196→:203`,
`:208→:215`) because `97-05` inserted `/dossiers/elected-officials` at `:148` in wave 2. The
citation is to the evidence, not to the line number; the numbers above are today's re-derivation.

**The conflation trap, recorded so no reader re-introduces it.** The administration group also
holds `admin-approvals` at `navigation-config.ts:221`, whose **id** looks like `/admin/approvals`
but whose **`path`** is the TOP-LEVEL `/approvals` — a different route. The instrument's boundary
pin proves the matcher is doing work (`/admin/approvals=0` vs `/approvals=1`). A substring sweep
would report `/admin/approvals` as linked when it is not.

**FLOOR/CEILING, restated from the instrument** (`97-POPULATIONS.md` §"FLOOR and CEILING"): an
inbound-link count is a FLOOR for the ABSENCE claim and a CEILING for the PRESENCE claim, and
`LIVE` means "in the rendered tree by file location", never "proven mounted".

---

## §1 — the decision vocabulary, and the machine-readable token contract

Permitted decisions are exactly these nine terms:

| term                        | meaning                                                                     | who acts                        |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| `NAV ENTRY`                 | no live nav entry today; one is to be ADDED                                 | `97-10` adds it                 |
| `ALREADY-REACHABLE`         | a live nav entry ALREADY EXISTS; nothing to do                              | nobody — `97-10` adds NOTHING   |
| `DELETE`                    | the route/module is removed                                                 | `97-11` deletes it              |
| `OWN`                       | a dead module is KEPT with a named owner and a header comment               | `97-11` annotates it            |
| `OWNED-ELSEWHERE-UNTOUCHED` | another phase owns it; this phase does not act                              | nobody                          |
| `PARKED`                    | evidence underdetermines the disposal                                       | nobody                          |
| `PARKED-RE-ESCALATED`       | a conditional trigger was REFUTED; back to the overseer with the comparison | overseer                        |
| `NOT-CHECKED`               | could not be established, with what was tried                               | nobody                          |
| `BRANCH-A` / `BRANCH-B`     | the `PALETTE-ADMIN-01` filing-order election only                           | `97-10` (A) / `97-12` files (B) |

Every decision is ALSO emitted as an anchored machine-readable token on its own line, at column 0,
in exactly this form and nothing else:

`DECISION <subject>: <TERM>`

Consumers match `^DECISION <subject>: <TERM>$`, anchored at both ends. This exists because the
consuming gates previously matched `<subject>.*DELETE` against this prose document — a pattern
satisfied by any line where the subject and the word DELETE merely **co-occur**, including a row
saying the opposite ("the CONDITIONAL DELETE trigger was REFUTED", "kept per DELETE-or-OWN
review"). Both literals appear in this record, so the contamination was near-certain rather than
hypothetical, and the arm it selected asserted the route was ABSENT — pressuring an unauthorised
deletion on the phase's one irreversible operation. No prose sentence can satisfy the anchored
form. Tokens are emitted inside fenced blocks so the pre-commit prettier pass cannot reflow them.

**The `/admin/` index carries a row but NO token, deliberately.** It is excluded from every
consuming gate's loop (its literal is a prefix of every other admin path), and the closed
vocabulary has no true term for "redirect-only index whose redirect target is itself reachable" —
`ALREADY-REACHABLE` would be false (it has no nav row of its own), `NAV ENTRY` would instruct a
duplicate, and `NOT-CHECKED` would be false because it WAS checked. Recording the absence of a fit
is more honest than forcing one; the `delta` sentence in §0 is where the index is accounted for.

---

## §2 — the nine route rows

| #   | route                      | decision                    | why (one line)                                                                                                                                                                                                                                     | owner / actor                       | inbound-link evidence           |
| --- | -------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------- |
| 1   | `/admin/ai-settings`       | `ALREADY-REACHABLE`         | live sidebar row exists at `navigation-config.ts:185`; adding another would duplicate it                                                                                                                                                           | nobody                              | `97-POPULATIONS.md` §2b, 2 LIVE |
| 2   | `/admin/system`            | `ALREADY-REACHABLE`         | live sidebar row at `:191`                                                                                                                                                                                                                         | nobody                              | `97-POPULATIONS.md` §2b, 1 LIVE |
| 3   | `/admin/field-permissions` | `ALREADY-REACHABLE`         | live sidebar row at `:203`                                                                                                                                                                                                                         | nobody                              | `97-POPULATIONS.md` §2b, 1 LIVE |
| 4   | `/admin/data-retention`    | `ALREADY-REACHABLE`         | live sidebar row at `:215`                                                                                                                                                                                                                         | nobody                              | `97-POPULATIONS.md` §2b, 1 LIVE |
| 5   | `/admin/ai-usage`          | `NAV ENTRY`                 | ruled `RULING-P97-01` §1; a working telemetry page with zero inbound links is the P95 KEEP class                                                                                                                                                   | `97-10` adds it                     | `97-POPULATIONS.md` §2, 0 LIVE  |
| 6   | `/admin/approvals`         | `NAV ENTRY`                 | trigger REFUTED (§3a) → **RULING-P97-14** rules NAV ENTRY, admin group, adminOnly: it is the SOLE caller of `approvals-reassign`, so leaving it unreachable is what NAV-04 exists to prevent                                                       | 97-10                               | `97-POPULATIONS.md` §2, 0 LIVE  |
| 7   | `/admin/preview-layouts`   | `OWNED-ELSEWHERE-UNTOUCHED` | trigger REFUTED (§3b); no owner existed, so **RULING-P97-14** ASSIGNS one. Untouched here. NOT deleted: a route-only deletion leaves an ORPHAN TABLE with no code trace of its purpose — worse than today; the finishing migration is out of scope | **Phase 102** (`PREVIEW-HOLLOW-01`) | `97-POPULATIONS.md` §2, 0 LIVE  |
| 8   | `/monitoring`              | `NAV ENTRY`                 | route KEEP already ruled (`RULING-P95-01`, `95-DEAD-04-DECISION.md`); this row decides only nav                                                                                                                                                    | `97-10` adds it                     | `97-POPULATIONS.md` §2, 0 LIVE  |
| 9   | `/admin/` (index)          | see §1 — no token           | redirect-only index; `beforeLoad` throws to `/admin/ai-settings`, which is row 1, `ALREADY-REACHABLE`                                                                                                                                              | nobody                              | `97-POPULATIONS.md` §2, 0 LIVE  |

Tokens for rows 1–8:

```
DECISION /admin/ai-settings: ALREADY-REACHABLE
DECISION /admin/system: ALREADY-REACHABLE
DECISION /admin/field-permissions: ALREADY-REACHABLE
DECISION /admin/data-retention: ALREADY-REACHABLE
DECISION /admin/ai-usage: NAV ENTRY
DECISION /admin/approvals: NAV ENTRY
DECISION /admin/preview-layouts: OWNED-ELSEWHERE-UNTOUCHED
DECISION /monitoring: NAV ENTRY
```

### Row 5 — `/admin/ai-usage`, destination state OBSERVED not assumed

Ruled `NAV ENTRY` (administration group, `adminOnly`) by `RULING-P97-01` §1. A `NAV ENTRY` row must
name its destination's current state, so it was observed against the live dev stack rather than
cited:

- **ROLE proven in-run: `adminOnly`.** The `.env.test` user's session renders the administration
  group, which `createNavigationGroups` emits only when `isAdmin` is true.
- **VIEWPORT: desktop 1400×900**, the `<aside role="navigation">` — not the mobile drawer.
- Observed: `content-type: text/html`, `h1 = "AI Usage Dashboard"`, URL stayed `/admin/ai-usage`
  (no guard redirect), and the page settles to an **honest zero state** — `Total Runs 0`,
  `Total Cost $0.0000`, `Success Rate 0.0%`, "No usage data available" per panel. No internal
  string leaked (PG codes / `permission denied` / `supabase-js` / `FunctionsHttpError` regex: no
  match).

The entry therefore points at a page that renders truthfully with no seeded data. Its own empty
state is the honest one; no badge or caveat belongs on the nav row.

### Row 8 — `/monitoring`, and the production data-degradation this row must name

The **route KEEP is already ruled** — `RULING-P95-01`, recorded in
`.planning/phases/95-routes-that-don-t-render/95-DEAD-04-DECISION.md`, which is this row's named
input. This row decides **only the nav entry**, and it decides `NAV ENTRY`.

Refinement of that input, verified on disk: the `/monitoring` link at
`frontend/src/components/modern-nav/navigationData.ts:262` lives in a nav tree mounted only by
`frontend/src/routes/modern-nav-standalone.tsx`, so **the live shell has NO monitoring entry
today** — the instrument classifies it `NON-RENDERED (demo-only)`, not an inbound link.

**Destination state, observed** (same role and viewport as row 5): `content-type: text/html`,
`h1 = "Monitoring Dashboard"`, `/api/monitoring/health` → **200**, `/api/monitoring/alerts` →
**200**, `monitoring-health-error` testid count **0**, `monitoring-alerts-error` count **0**, zero
widgets still claiming to load, real data rendered (`Overall: healthy`, `database: healthy (39 ms)`,
`api: healthy (13 ms)`).

**The condition-8 fact, named and not hidden:** that observation is **DEV**. The Dashboard's API
was moved under `/api/monitoring` INSIDE the backend's guard —
`backend/src/index.ts:83` `if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')`,
mounting at `:89` — so **in production the guard is false, `/api/monitoring` 404s from the real API
router, and both widgets settle to their inline `QueryErrorState`s** (testids
`monitoring-health-error`, `monitoring-alerts-error`). The page degrades honestly; it does not hang
and it does not lie. Scope is NOT widened to fix the guard.

> `NOT-CHECKED` — the **production** render of `/monitoring` was not observed. What was tried: the
> live dev stack at `:5173` was driven end-to-end (above), and the guard was read at
> `backend/src/index.ts:83-89`. A production build was not stood up, so the degradation above is
> **derived from the code path, not observed**. Stating it as observed would be the confident lie
> this milestone exists to kill.

> `NOT-CHECKED` — the current render state of `/admin/data-retention` and `/admin/field-permissions`
> (rows 3–4). The 2026-08-15 live audit recorded 401s on both; P92/P93 worked that territory
> afterwards. They are `ALREADY-REACHABLE`, so no nav entry is being added that could point at a
> broken surface, and their render state is out of this row's scope — but it is unestablished here
> and is recorded as such rather than assumed repaired.

---

## §3 — the two conditional triggers, performed at execution

### §3a `/admin/approvals` — trigger REFUTED

`RULING-P97-01` §2: **CONDITIONAL DELETE**, trigger = an execution-time comparison confirming it
duplicates the top-level `/approvals` surface by **component/feature identity**, the comparison
PASTED into the row. The comparison, performed against both files and both live pages:

| aspect            | `/admin/approvals`                                                   | `/approvals`                                            |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| route file        | `routes/_protected/admin/approvals.tsx` (294 lines)                  | `routes/_protected/approvals/index.tsx` (132 lines)     |
| component         | `AdminApprovalsPage`                                                 | `MyApprovalsPage`                                       |
| guard             | `beforeLoad: requireAdmin` (`:41`)                                   | none                                                    |
| i18n namespace    | `admin`                                                              | `approvals`                                             |
| query key         | `['admin','approvals','under_review']`                               | `['approvals','my']`                                    |
| backing fetch     | `positions-list?status=under_review`                                 | `positions-list?status=under_review` — **identical**    |
| mutation          | `approvals-reassign` PUT (`:69`) — **sole caller in the whole tree** | none                                                    |
| rendered h1       | "Admin: Approval Management"                                         | "My Approvals"                                          |
| rendered subtitle | "Reassign stuck approvals and manage approval chains"                | "Positions pending your review and approval"            |
| rendered body     | audit-compliance banner + 5-column table + per-row Reassign action   | one Pending stat card + a link list to `/positions/$id` |
| shared components | none beyond generic `components/ui/*` primitives                     | —                                                       |

Both pages were rendered live (role `adminOnly`, viewport desktop 1400×900) and both are currently
empty of data: "No positions under review" / "No positions pending your approval".

**Verdict: the comparison REFUTES duplication.** The two share exactly one thing — the backing
query — and differ in component, guard, namespace, query key, copy, layout and **capability**.
`/admin/approvals` is the only surface anywhere in the tree that can reassign a stuck approval;
deleting it would discard a capability, not a duplicate. The shared query is better read as the
top-level page being unfinished than as the admin page being redundant: `/approvals`'s own source
comment at `:29` says _"This would need a dedicated endpoint, but for now we'll filter positions"_,
i.e. "My Approvals" is not in fact filtered to the current user.

Per the ruling, a refuted trigger does **NOT** get an improvised nav entry. The decision is
`PARKED-RE-ESCALATED` and the park returns to the overseer with the comparison above as evidence.
Nothing is deleted; nothing is added.

Re-stated because a substring sweep gets this wrong: `navigation-config.ts:221`'s `admin-approvals`
item points at the TOP-LEVEL `/approvals`, a **different route**. It is not an inbound link to
`/admin/approvals`.

### §3b `/admin/preview-layouts` — trigger REFUTED

`RULING-P97-01` §3: **CONDITIONAL DELETE as a product route**, trigger = the Phase-30–32 reference
is confirmed historical tooling **with no live ownership claim**, the check recorded. The check
itself, not merely its verdict:

**Check 1 — the Phase-30–32 reference the trigger names could not be found.**

```
$ command grep -rn -i "preview.layout" .planning/milestones/v5.0-phases/30-elected-official-wizard \
    .planning/milestones/v5.0-phases/31-creation-hub-cleanup \
    .planning/milestones/v5.0-phases/32-person-native-basic-info
SUBJECT-RC=1   (1 = no hits)

$ (same command shape, control token those dirs certainly contain)
$ command grep -rn -i "elected" <the same three dirs> | wc -l
693            (the instrument sees matches — the zero above is a real zero)
```

The premise the trigger asks me to "confirm" does not exist in the phase-30–32 record. A trigger
whose subject cannot be located cannot fire.

**Check 2 — a live claim DOES exist, dated two days before this decision.** The 2026-08-15 live
audit examined this route against the running app and recorded, three separate times:

- `.planning/audits/live-audit-2026-08-15/sweeper.md:132` — _"**real feature, fully wired.** …the
  mutations/queries live in `frontend/src/hooks/usePreviewLayouts.ts`, which does call real
  Supabase RPCs (`get_entity_layouts`) and real tables (`entity_preview_layouts`,
  `preview_layout_fields`). Selecting "Country" live pulled a real seeded "Default Country Preview"
  layout with no errors. Admin-gated via `requireAdmin`. **Genuinely fine — don't delete.**"_
- `.planning/audits/live-audit-2026-08-15/sweeper.md:153` — _"real, wired, working admin feature."_
- `.planning/audits/live-audit-2026-08-15/INDEX.md:169` — _"`/admin/preview-layouts` and `/compare`
  are real, wired features. Nothing there needs deleting."_

**Check 3 — re-observed live at execution** (role `adminOnly`, viewport desktop 1400×900):
`h1 = "Manage Preview Layouts"`, URL stayed `/admin/preview-layouts`, and the page renders its
entity-type picker with all twelve `PREVIEW_ENTITY_TYPES` (Dossier, Organization, Country, Forum,
Position, MOU, Engagement, Commitment, Assignment, Signal, Working Group, Topic). It is live
tooling, not a historical artefact.

**Verdict: the trigger is REFUTED on both conjuncts.** It is not confirmed-historical, and a live
claim exists.

**Why the row is `PARKED-RE-ESCALATED` rather than `OWNED-ELSEWHERE-UNTOUCHED`.** The ruling's
refuted branch reads _"the row records OWNED-ELSEWHERE **with the owner named**, and nothing is
deleted"_ — and that branch is **not executable honestly here, because there is no owner to name**.
The sweep over `.planning` and `specs` found no phase, no register requirement and no backlog item
claiming this route; `preview` appears **zero** times in both `.planning/ROADMAP.md` and
`.planning/REQUIREMENTS.md`. The only claim-holder is an audit record, and an audit is a liveness
verdict, not an owner. Writing a fabricated owner into this table to satisfy a branch's wording
would be the exact defect class this phase exists to kill, so the row re-escalates with the check
above as evidence and **nothing is deleted and nothing is added**.

**One finding recorded with the row, because it is what the check surfaced and it is not a
disposal.** The configuration surface is live, but **nothing consumes what it configures**. Its
declared purpose (route JSDoc `:5-8`) is to control "hover previews, search results, and embedded
references", and the consumer sweep resolves to a closed loop:

```
entity_preview_layouts references, by file:
  frontend/src/hooks/usePreviewLayouts.ts            (4)   <- the only reader/writer
  frontend/src/types/database.types.ts               (3)   <- generated
  backend/src/types/database.types.ts                (3)   <- generated
  supabase/migrations/20260115100001_entity_preview_layouts.sql   (59)
  supabase/migrations/20260627000001_sec_helper_is_platform_admin.sql  (1)   <- RLS
  supabase/migrations/20260627000002_sec_be_01_admin_rls_db_role.sql   (9)   <- RLS

importers of usePreviewLayouts: frontend/src/routes/_protected/admin/preview-layouts.tsx  (1, and only)
```

No preview, search-result or embedded-reference surface reads the layouts. That is a hollow-feature
observation, **not** a reachability disposal, and it is handed to the overseer with the park rather
than acted on here.

---

## §4 — the two dead-module rows

Both are the same class (`97-PARALLEL-TRUTH-CLASS.md`): a second copy of a truth that already has a
canonical home, inert only because nothing imports it. Rows are added **here**, never by editing
that committed class record.

### §4a `frontend/src/services/auth.ts` — recommend DELETE

Filed basis `RULING-P92-06` (`.tickmarkr/overseer/DECISIONS.md` §D-7). Verified on disk at
execution:

- `frontend/src/services/auth.ts:76` `persist(` … `:624` `name: 'auth-storage'` — a **SECOND**
  zustand store on the live persist key. The live store is `frontend/src/store/authStore.ts:272`,
  same literal `'auth-storage'`. If anything ever imports this module, two stores race one
  localStorage key.
- `frontend/src/services/auth.ts:635` `supabase.auth.onAuthStateChange(async (event, _session) => {`
  — a module-level subscription that never registers, because the module is never evaluated.

**Zero-importer derivation, RE-RUN at execution with a control in the same run.** Exit codes read
directly, never through a pipe:

```
SUBJECT — every import spelling of this module, across frontend/ and tests/:
$ command grep -rn "from '@/services/auth'|from '../services/auth'|from './services/auth'|from '../auth'|from './auth'" \
    <repo>/frontend <repo>/tests --include='*.ts' --include='*.tsx' | wc -l
0

CONTROL — identical command shape, a known-imported sibling module in the same directory:
$ command grep -rn "from '@/services/dossier-api'|from '../services/dossier-api'|from './dossier-api'|from '../dossier-api'" \
    <repo>/frontend <repo>/tests --include='*.ts' --include='*.tsx' | wc -l
38
```

The control is non-empty in the same run, so the zero is a measurement and not a broken instrument.
(The gate on this task additionally runs the `store/authStore'` control itself and fails closed if
it ever comes back empty.)

**Recommendation: DELETE**, per `RULING-P92-06`. A dormant module that would hijack the live
`'auth-storage'` persist key on first import is not left undecided. `97-11` executes it, after
re-running the derivation itself.

```
DECISION frontend/src/services/auth.ts: DELETE
```

### §4b `frontend/src/components/layout/QuickNavigationMenu.tsx` — recommend DELETE

`RULING-P97-03` §1 scopes this in-phase as "the `services/auth.ts` class exactly". The
zero-importer half holds; **the parallel-route-list half does not, and saying so is the point of
re-deriving rather than quoting.**

**Zero-importer derivation, RE-RUN with a control — including a control that BROKE and was
replaced.**

```
FIRST CONTROL ATTEMPT — mis-specified, and it returned ZERO:
$ command grep -rn "layout/Sidebar'" <repo>/frontend/src --include='*.ts' --include='*.tsx' | wc -l
0        <- Sidebar is imported RELATIVELY (AppShell.tsx:93  import { Sidebar } from './Sidebar'),
            so the path-shaped control could never match. A zero from THIS instrument would have
            "confirmed" the subject's zero with a broken tool.

SECOND CONTROL ATTEMPT — SidebarSearch: also 0 external references. Rejected: it is itself dead,
so it cannot serve as a known-imported control.

SUBJECT — bare-identifier sweep, whole frontend/ + tests/, minus the declaring file:
$ command grep -rnw "QuickNavigationMenu" <repo>/frontend <repo>/tests --include='*.ts' --include='*.tsx' \
    | command grep -v "components/layout/QuickNavigationMenu.tsx:" | wc -l
0

CONTROL — identical command shape, subject Sidebar, minus its own declaring file:
$ command grep -rnw "Sidebar" <repo>/frontend <repo>/tests --include='*.ts' --include='*.tsx' \
    | command grep -v "components/layout/Sidebar.tsx:" | wc -l
81
```

Zero external references; the control resolves 81 in the same run. The three in-file hits are the
interface, the export and the props type — self-declaration, not use.

**What its list contained that `navigation-config.ts` does NOT — the obligation, discharged, with a
refutation attached.** `RULING-P97-03` §1 characterises this file as carrying "a second route list
beside `navigation-config.ts`". **Read in full (468 lines), it carries no route list at all.** It
renders pinned and recently-viewed ENTITIES, and every `route` it links is a runtime value read off
two zustand stores (`usePinnedEntitiesStore`, `useEntityHistoryStore`), passed straight into
`<Link to={entry.route as any}>` at `:125`, `:360` and `:449`. There is no hardcoded path anywhere
in the file.

So **nothing is discarded by deleting it**: there is no forgotten intent to salvage, because there
is no parallel list. The nearest structural analogue is `entityIcons` / `entityColors` (`:54-82`),
two `Record<EntityType, …>` maps keyed by the canonical `EntityType` imported from
`@/store/entityHistoryStore` — type-bound, so the key set agrees with its canonical home **by
construction** and a change to `EntityType` fails the build. That is the opposite of the
parallel-truth defect.

**One consequence the row must name, since it is a cost of DELETE.** `usePinnedEntitiesStore` has
exactly **one** consumer, this file:

```
$ command grep -rlw "usePinnedEntitiesStore" <repo>/frontend/src --include='*.ts' --include='*.tsx'
frontend/src/components/layout/QuickNavigationMenu.tsx
frontend/src/store/pinnedEntitiesStore.ts        <- the store's own declaration
```

Deleting this component leaves `store/pinnedEntitiesStore.ts` with no UI at all. (Its sibling
`useEntityHistoryStore` is safe — `EntityBreadcrumbTrail.tsx` and `hooks/useEntityNavigation.ts`
also consume it.) The pinned-entities store becoming dead code is a **consequence to record, not a
reason to keep an unrendered component**: a component nothing imports pins nothing today either.
`97-11` executes the deletion of this file only; the store is outside this row's subject and is
NOT deleted here.

```
DECISION frontend/src/components/layout/QuickNavigationMenu.tsx: DELETE
```

---

## §5 — `PALETTE-ADMIN-01`, the filing order's one written answer: **BRANCH A**

`RULING-P97-01` §"The filing order (the audit-is-not-a-queue law)" requires one of two written
answers, never a wrinkle note. **Branch A is elected: fix in-phase.**

The defect, verified on disk at execution:
`frontend/src/components/keyboard-shortcuts/CommandPalette.tsx:521-524`

```
const allNavPages = useMemo((): NavigationItem[] => {
  const groups = createNavigationGroups({ tasks: 0, approvals: 0, engagements: 0 }, true)
  return groups.flatMap((g) => g.items)
}, [])
```

The second argument is `isAdmin`, hardcoded `true`, so **every administration entry becomes a
palette command for every user**, and the `/admin/ai-usage` entry row 5 adds makes it one worse.
The palette imports `createNavigationGroups` at `:104` and does **not** import `useAuthStore`.

**Evidence for electing branch A** — it is exactly the condition the ruling names:

- `97-10` already owns BOTH `CommandPalette.tsx` (its Task 2) and `navigation-config.ts` (its
  Task 1). No new file ownership is created.
- The honest check already exists in-repo, one file away:
  `frontend/src/components/layout/Sidebar.tsx:51,53` — `const { user } = useAuthStore()` then
  `const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'`. (The plan cited `:54`;
  re-derived at execution it is `:53`.)
- `useAuthStore` is a zustand hook and needs no provider, so the palette's render context can reach
  it — the only stated condition that would force branch B does not hold.
- The `useMemo` dependency array is `[]`; branch A must add the derived `isAdmin` to it, or the
  memo re-freezes the same bug in a subtler form.

**Owner: `97-10` Task 2.** Branch B (a `PALETTE-ADMIN-01` register row handed to `97-12`, this
phase's only writer of `.planning/REQUIREMENTS.md`) is **not** taken; the id is recorded here so it
exists in the record either way.

**This is a VISIBILITY defect, not an authorization one.** The palette leaked the existence and
labels of admin surfaces to non-admins. It did not grant access.

```
DECISION PALETTE-ADMIN-01: BRANCH-A
```

---

## §6 — `PARALLEL-TRUTH-01` residue handed over by `97-04`, routed here

`97-04`'s re-derivation found three same-class copies outside its own seven-site table and outside
`97-PARALLEL-TRUTH-CLASS.md`'s register of six. They are routed here with owners, **not absorbed**,
and no token is emitted for them (no gate consumes them, and their disposal is a register filing
rather than a route decision):

| site                                                                                   | copy of                                  | disposal                                                                                           | owner                                 |
| -------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `components/dossier/DossierTypeGuide.tsx:380` `const types: DossierType[] = [...7...]` | the DB-7, in a FOURTH distinct order     | mechanical `DOSSIER_TYPES` re-point; NOT done here — the file is in no P97 plan's `files_modified` | `PARALLEL-TRUTH-01`, filed by `97-12` |
| `components/dossier/wizard/hooks/useDraftMigration.ts:14` `VALID_TYPES`                | the DB-7                                 | same                                                                                               | `PARALLEL-TRUTH-01`, filed by `97-12` |
| `components/keyboard-shortcuts/CommandPalette.tsx:305` `DOSSIER_TYPE_ORDER` (8)        | the CARD-8; its own comment says "all 8" | same — and explicitly NOT folded into `97-10` Task 2, whose action forbids unrelated palette edits | `PARALLEL-TRUTH-01`, filed by `97-12` |

`97-04`'s near-copy note (`pages/dossiers/DossierListPage.tsx:904`
`entityTypes={['dossier', ...the 7]}`) is **not** filed: it is a search-entity vocabulary carrying
a member the dossier type set does not have, i.e. legitimately its own set.

---

## §7 — intended-broken exclusions, considered and deliberately untouched

Named so a reader can see they were weighed rather than missed (`ACCEPTANCE-P97-PLAN.md`
condition 8, `97-CONTEXT.md` D-02). No row above touches any of them:

| surface                         | disposition                                          | owner                                      |
| ------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `/delegations`                  | **owned elsewhere, untouched**                       | **Phase 102**                              |
| the legal-hold region           | **owned elsewhere, untouched**                       | **Phase 100**                              |
| the `/engagements` double-mount | intentional — a reachability sweep must not "fix" it | — (route-namespace hygiene, already ruled) |
| `scenario-sandbox`              | kept deliberately                                    | — (already ruled)                          |
| `responsive-demo`               | kept deliberately                                    | — (already ruled)                          |

Repairing, removing or re-homing `/delegations` or any legal-hold surface is a REJECT.

---

## §8 — what no row here claims

**No row states or implies that a nav entry, or its absence, provides access control.** `adminOnly`
gating in `createNavigationGroups` is **client-side**: it decides what a sidebar renders, nothing
more. Every route above stays URL-reachable regardless of whether it has a nav row, and the route
guards that do gate access (`beforeLoad: requireAdmin`) are a separate mechanism this document does
not change. Server-side authorization is **Phase 100**'s RLS territory.

Likewise, `97-POPULATIONS.md`'s `LIVE` classification is a file-location fact, not a mount proof —
so no row here is a reachability guarantee. The click-through oracle that turns a `NAV ENTRY` row
into an observed reachability claim, at a named role and viewport, is `97-10` Task 3.

### The CONCRETE case this general principle was covering (`RULING-P97-18`, added 2026-08-17)

The paragraph above is TRUE and was doing too much work. Stated generally, it silently absorbed a
**specific, named asymmetry that no row owns** — the audit-is-not-a-queue shape: correct words,
nobody owning the thing.

**`/monitoring` (row 8) carries NO route guard, while the two other routes this phase gave nav
entries both do.** Measured: `admin/approvals` `requireAdmin` 2 / `beforeLoad` 1; `admin/ai-usage`
2 / 2; **`monitoring.tsx` 0 / 0** (control: 9 route files in the tree do use `requireAdmin`).

**Phase 97 did not open that door** — the route was unguarded before and URL-reachable. **It
changed the route's CONTEXT**, placing an unguarded route inside the `isAdmin`-gated
Administration group, so **group membership now implies a guarantee the route does not honour.**

**This row's destination was exercised ONLY AS AN ADMIN** ("same role as row 5"), so non-admin
behaviour at `/monitoring` is **unestablished by this phase**.

Filed as **`MONITORING-GUARD-01`, owner Phase 100**, resolvable in EITHER direction — guard the
route, or stop presenting it as an Administration peer — because which is right is a product
question about who `/monitoring` is for. **This document does not choose.**

DECISION-RECORD-END
