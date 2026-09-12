# Phase 99: Arabic Coverage — Research

**Seat:** `p99-research` (research only; nothing repaired, no source file touched).
**Derived at:** HEAD `9ffa2b80cc82fb3fe29e11354818d13f537e67b9`, 2026-08-18 (UTC), branch `milestone/v10.0-trust`.
Working tree at derivation time carried modified harness-synced files only (`.agents/`, `.claude/`,
`CLAUDE.md`, untracked `AGENTS.md`/`tickmarkr.spec.md`/archive dir) — none inside `frontend/`,
`backend/`, `supabase/`, `scripts/`, so every source-tree derivation below is a derivation of the
committed tree at that sha. (`git status --porcelain` printed beside the sha at session start.)
**Environment:** `bash -lc` resolves `node` v24.19.0 at `/opt/homebrew/bin/node` — above the repo
`engines` floor `>=22.22.0` (`package.json:8`). Verified before any script ran.
**Scratch scripts:** this report used two scratch instruments, declared per the brief, at
`/tmp/p99-research/p99-census.mjs` and `/tmp/p99-research/p99-strict.mjs`. Both MIRROR
`scripts/i18n-mask-audit.mjs`'s regexes and file walk byte-for-byte and extend it
**[CAUTION, added 2026-08-18 per RULING-P99-21 §2: this sentence is DESCRIPTIVE — it records what the
scratch scripts did — and what it records is now a NAMED DEFECT. The mirrored `USE_NS` regex is
wrong in both directions (array bindings truncated to their first namespace, bare bindings read as
zero), so every population measured with it is untrusted, and the pattern must NOT be imitated.
Note that the disclaimer two clauses down did not prevent the propagation: the PLANS carried the
copy instruction, and a disclaimer does not stop propagation — only the operative channel does.]** (both locales;
strict namespace model; classification). Their raw outputs sit beside them in `/tmp/p99-research/`.
They are scratch, not instruments of record; anything a plan relies on must re-derive.

**Addendum honoured:** `BRIEF-99-RESEARCH-ADDENDUM-01.md` (`RULING-P99-01` §3) — Phase 99 ships no
separate UI-SPEC; §5 and §6 below carry the numbered UI contract ids `UI99-C1…` and are the
released UI contract for this phase.

Report discipline: every number sits beside its command; populations are stated as sets with what
falls outside them; where two instruments disagree both numbers are printed with their populations.

---

## §0 — The four success criteria (ROADMAP §Phase 99, read at HEAD) and where each is treated

1. One Arabic term per core object + nav label matches page title → §4 (AR-01).
2. Arabic dates/times, no English weekday/month names, Latin digits deliberate → §5 (AR-02).
3. No English under `dir="rtl"`, four named surfaces included → §6 (AR-03).
4. No dot-form `t()` with English default; a miss shows as missing → §1 (AR-04a) + §2 (AR-04b)
   - §3 (the class both acceptance greps cannot see).

---

## §1 — AR-04a: the MASK population (2-arg English defaults)

### 1.1 The acceptance grep (check (a)), re-derived

```
$ grep -rhoE "t\(\s*'[^']+'\s*,\s*'[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l
1680
$ command grep -rhoE "t\(..." (same pattern, bypassing the ugrep wrapper)
1680
# positive control: -l form lists files (engagements.repository.ts, useEngagementBriefs.ts, …) — the zero-target grep can find things
```

Population of this command: **lines** in `.ts`/`.tsx` under `frontend/src` (including `__tests__`
and `.test.` files; `frontend/src/.understand-anything` holds zero `.ts(x)` files at HEAD, so the
wrapper-vs-`command grep` distinction is moot here — both return 1680). What falls outside it:
**multi-line calls** (`\s` cannot cross a line boundary in grep, and prettier at print-width 100
wraps long `t()` calls), and it over-includes **identifier tails** (`…format('key', 'x')` matches
`t\(` — the artefact `REQUIREMENTS.md`'s dated note records as exactly +26 once before).

### 1.2 The operative instrument, re-derived

```
$ node scripts/i18n-mask-audit.mjs        # exit 0; full JSON at /tmp/p99-research/mask-audit.json
total_two_arg_sites: 1768   non_key_literals: 0
naive (defaultNS only):     1562 sites / 1300 distinct / 88.3%
namespace-aware:            473 sites / 410 distinct / 26.8%
```

The audit's matcher is `\b`-anchored and file-scoped (multi-line capable), so **1768 vs 1680 are
two populations, not a contradiction**: the grep misses wrapped calls and gains identifier tails;
net −88 at this HEAD. Prior figures for the trail: 1800 (2026-08-15, two instruments coinciding),
1778 (`0d69760bb`, mid-P98), 1768 now. Nothing frozen; the tree moves.

### 1.3 The model correction this seat found: the audit is LOOSER than the shipped app

`frontend/src/i18n/index.ts:550` initializes i18next with **no `fallbackNS` and no `defaultNS`
override** (read at HEAD; the init block sets resources/fallbackLng/detection/react/saveMissing
only). Real i18next therefore **never consults `common` for a `t` bound by `useTranslation('ns')`**.
The committed audit appends `common` to every candidate list, and also does not model the
`translation:` alias (`index.ts:274/410` install `translation: enCommon/arCommon`). Measured
(`/tmp/p99-research/p99-strict.mjs`, same regexes/walk, strict candidates = declared namespaces
only, alias modelled):

```
two-arg strict-model misses: 481 sites   (committed audit: 473)
  hidden by the loose model:   9 sites / 5 distinct / 3 files   (resolve ONLY via the appended common)
  rescued by the alias:        1 site                            (the audit lacks translation→common)
raw-key strict-model misses: 335 sites   (committed audit: 297) — see §2.2
  hidden by the loose model:  42 sites / 33 distinct
```

Consequence for the planner: **the committed acceptance check (b) under-reports**. The 9 (and 42)
hidden sites render raw keys / defaults in the real app today while the audit calls them resolved.
Small in count, structural in kind — the check-(b) instrument needs the strict model (or the plan
consumes `resolve-check.mjs`-style real-i18next resolution) before "0 unresolved" means anything.
(What falls outside even the strict model: `t` functions passed as props from a differently-bound
file, dynamic keys (§3), `Trans` components, and anything outside `frontend/src`.)

### 1.4 Both locales, and the finding that reshapes the authoring estimate

Extended census (`p99-census.mjs`, committed-audit model, both locales):

| class                                      | sites | distinct keys |
| ------------------------------------------ | ----: | ------------: |
| resolve in EN and AR                       |  1295 |          1049 |
| resolve EN only (need AR authoring)        | **0** |         **0** |
| resolve AR only                            |     0 |             0 |
| resolve in NEITHER (the destructive class) |   473 |           410 |

**The EN-unresolved and AR-unresolved sets are IDENTICAL — 473 sites / 410 distinct each, overlap
410/410.** Independently corroborated by a structural bundle-parity check run beside it: 129
namespace files per locale, 125 with byte-identical leaf-key sets, 4 where **AR carries extra
leaves** (assignments +4, common +12, tags +4, workspace +4), and **zero EN-only leaves in any
namespace**. So there is **no "EN exists / AR missing" class at all** in the two-arg population:
every missing key is missing in both locales, and every authored key must be authored twice.

Of the 473 (412 distinct `ns:path` pairs — two key strings recur under two namespaces):

- **wrong-namespace, nearly free:** 51 sites / 38 distinct — the path exists under some OTHER
  namespace bundle (same split in both locales). Repair is a re-bind or colon-prefix, not authoring.
- **truly absent, the authoring work:** 422 sites / **372 distinct keys × 2 locales ≈ 744 strings**
  to write, plus review. This is the number the phase's resourcing turns on. Scoping AR-04a as a
  find-and-replace under-resources it by exactly this.

### 1.5 Namespace and file distribution (what tells the planner how to cut lanes)

Distinct unresolved `ns:path` pairs by the namespace the key would land in (loose model; the
strict model shifts a handful):

```
common 284 · intake 86 · admin 6 · graph 5 · dossier-context 4 · dossier 3 · forums 3 ·
lifecycle 3 · field-permissions 3 · dashboard-widgets 2 · guided-tours 2 · milestone-planning 2 ·
settings 2 · work-creation 2 · translation 2 · ai-admin 2 · entity-linking 1   (Σ = 412)
```

The `common 284` bucket is an artifact of **binding, not belonging**: those keys sit in files that
declare no namespace, so they default to `common`. Whether Phase 99 authors 284 keys into
`common.json` or first re-binds those files to feature namespaces is a placement decision with
long-term cost — flagged in §7 (#3).

Top files by unresolved two-arg site count (full list in `/tmp/p99-research/census-summary.json`):

| file                                                      | unresolved sites |
| --------------------------------------------------------- | ---------------: |
| `components/triage-panel/TriagePanel.tsx`                 |               40 |
| `pages/Countries.tsx`                                     |               29 |
| `pages/Organizations.tsx`                                 |               28 |
| `components/tasks/TaskDetail.tsx`                         |               23 |
| `pages/TicketDetail.tsx`                                  |               23 |
| `components/waiting-queue/ReminderButton.tsx`             |               20 |
| `utils/ai-errors.ts`                                      |               20 |
| `components/duplicate-comparison/DuplicateComparison.tsx` |               19 |
| `pages/WaitingQueue.tsx`                                  |               19 |
| `pages/IntakeQueue.tsx`                                   |               17 |
| `components/relationships/GraphVisualization.tsx`         |               15 |
| `components/work-creation/forms/IntakeQuickForm.tsx`      |               13 |
| `components/query-error-boundary/QueryErrorBoundary.tsx`  |               11 |

Ten files carry ~48% of the unresolved sites; the intake/triage family alone (TriagePanel,
TicketDetail, IntakeQueue, IntakeQuickForm) is ~93 sites — a natural lane.

### 1.6 The order constraint, re-affirmed at HEAD

`RULING-P92-08`'s destructive-satisfiability warning holds at HEAD with these numbers: running
check (a) to zero by deleting second arguments converts **473 sites into raw-key renders in BOTH
locales at once**. Authoring first (372 keys × 2 locales + 38 re-binds), verification second
(strict-model or real-i18next), deletion last. The conjunction is not optional.

---

## §2 — AR-04b: RESOLUTION, and the ⚠ INVERSION

### 2.1 The two acceptance greps, with their populations named

```
$ grep -rhoE "t\(\s*'[^']*\.[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l   # dot-form
7986
$ grep -rhoE "t\(\s*'[^']*:[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l    # colon-form
1051
$ grep -rhoE "t\(\s*'[^']*:[^']*\.[^']*'" frontend/src --include='*.ts' --include='*.tsx' | wc -l
900   # sites counted by BOTH greps (colon-form keys with dotted paths, e.g. 'ns:a.b')
```

(2026-08-15 baseline for the trail: 8003 / 992.) Populations: line-bound, test files included
(90 test files carry 288 of the dot-form matches), identifier-tail over-inclusive, multi-line
blind — same caveats as §1.1. **The two sets overlap by 900**: "dot-form" as this command defines
it includes 900 already-colon-form sites whose _path_ is dotted. The true convert-target
population ("dot-form key with no explicit namespace") is **7986 − 900 = 7086 site-matches**, and
any plan that treats the 7986 as the conversion queue double-counts the 900. Also note both greps
are blind to variable second arguments (§3) and to backtick-template keys.

### 2.2 The unresolved tail — the 306/353 gap RECONCILED

First, the harness and its negative control, run in the required order:

```
$ node scripts/neg-taskcard.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0
  TaskCard t('priority.low')        ns=translation -> "priority.low"        MISS=true
  TaskCard t('status.in_progress')  ns=translation -> "status.in_progress"  MISS=true
  TaskCard t('work_item.task')      ns=translation -> "work_item.task"      MISS=true
  (contrast) t('priority.low') ns=assignments -> "Low"
  exit 0 — the harness CAN fail; the numbers below are falsifiable
$ node scripts/resolve-check.mjs /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0
  214 lookups across 11 routings x 2 locales — routings with a miss: 0
  CONTROL negative: detected-as-miss=true   CONTROL positive: "Human entered"   exit 0
```

Every P98 routing still resolves at HEAD; both polarities discriminate.

The tail itself, re-derived by BOTH of P98's population definitions at HEAD:

- **306-style** (the `98-04` instrument: `i18n-mask-audit.mjs`'s raw-key class — one-arg +
  options-without-`defaultValue`, all files, per-file namespace model):
  `297 sites / 269 distinct / 61 files` unresolved-EN; minus the same USE_NS first-namespace-only
  false-positive class 98-04 measured (re-measured here: **3 sites**) → **294**. (P98 recorded
  309−3=306 at `0d69760bb`; the delta is P98's own later repairs.) Under the **strict** model of
  §1.3 this class is **335 sites** — the committed instrument under-reports by 42 sites / 33
  distinct.
- **353-style** (the overseer's definition per `P98A2-EXEC-W2-COPY02-SCOPE.md`: distinct dotted
  keys, ANY call shape, in files with a **bare** `useTranslation()` hook, checked against
  `common.json` only): **345 distinct keys / 39 files** at HEAD (was 353/42).

**The reconciliation (set arithmetic at HEAD, `/tmp/p99-research/`):** 269-set ∩ 345-set = **138**.
The 345-set's 207 extras: **202 are two-arg mask sites** — the overseer's shape-blind matcher
swept AR-04a's population into AR-04b's count — and 5 are option-object/edge shapes the raw-key
class excludes. The 269-set's 131 extras are keys in namespace-DECLARING files, colon-form keys,
and undotted keys — all outside the 353-style file/shape scope. **The gap is fully explained by
three population axes: call shape (two-arg in/out), file scope (bare-hook-only vs all), and
namespace model (common.json-only vs per-file).** Neither number was wrong; they answer different
questions. The plan should consume the raw-key class (strict model) as AR-04b's population and the
two-arg class as AR-04a's, and never cite a blended figure.

### 2.3 The `common.json` inversion, verified on disk AND by resolution

On disk, both locales (`node` walk of `frontend/src/i18n/{en,ar}/common.json`):

```
en: top-level keys=38  top-level scalars=0  nested 'common' subtree: 56 keys / 67 leaves / 54 scalar children
ar: top-level keys=38  top-level scalars=0  nested 'common' subtree: 56 keys
```

By RESOLUTION (real i18next, the app's exact init mirrored, `fallbackLng` off):

```
t('common.all')            -> "All"              (dot-form RESOLVES via the nested duplicate)
t('common:all')            -> "all"              (colon-form MISSES, renders the BARE token)
t('common:actions.cancel') -> "actions.cancel"   (dotted-path colon miss renders a dotted token)
```

The ⚠ INVERSION (`RULING-P98A2-11`) **holds at HEAD exactly as recorded**: for this one namespace
the project-wide rule is inverted, and a mechanical dot→colon conversion over `common.*` breaks
currently-working copy.

P98's two figures re-derived:

```
colon-form common:* sites:      185 sites / 94 distinct     (P98: 185/94 — EXACT match)
  of those, MISSES:              72 sites / 52 distinct
    undotted-path (bare token):  42 / 29                    (P98's "37/27" is THIS population; +5/+2 since)
    dotted-path:                 30 / 23                    (outside P98's stated figure)
```

The 37/27-vs-42/29 delta is time (tree moved between derivations), not method; the 30/23
dotted-path misses (e.g. `common:common.actions.approve` — double-prefixed — and
`common:forms.min_items`) are a sub-class P98's bare-token figure never covered.

### 2.4 The structural call: FLATTEN vs KEEP — both options costed. **Decision is §7 #1; not taken here.**

Blast-radius numbers (strict model, `/tmp/p99-research/common-dot-sites.json`):

- Dot-form `t('common.X')` sites: **194 sites / 78 distinct / 70 files** repo-wide. Of these,
  **120 sites / 45 distinct / 46 files actually resolve through the nested subtree today** (file
  is bare-hook or binds common/translation). 38 more would resolve only under the loose model —
  i.e. they are **already broken in the real app** (part of §2.2's strict tail). 36 miss outright.
- Of the 72 colon-form misses: **33 sites / 20 distinct are fixed by flatten alone** (their path
  exists in the nested subtree); **39 sites / 32 distinct still miss after flatten** (need
  authoring or rewriting either way — they are broken today, so no option regresses them).
- Flatten merge-collision check: nested keys `error` and `search` share names with top-level
  subtrees, but their child key sets are disjoint (0 same-name children each) — **the flatten
  merge is clean at leaf level; 67 leaves move; zero overwrites**, both locales (AR's 12 extra
  `common.json` leaves ride along untouched).

**Option A — FLATTEN the nested subtree into the namespace root, then convert dot→colon
project-wide with NO exception.**
What breaks at the moment of flatten: the **120 resolving dot-form sites in 46 files** (and any
bare `t('all')`-style lookups that today hit top-level subtrees — none found; top level has 0
scalars). What must land in the SAME commit: both locales' `common.json` flatten + the 120-site
`common.X`→`common:X` (or bare-key) rewrite. What it buys: 33 colon-miss sites fix themselves; the
project-wide dot→colon sweep becomes mechanically safe; AR-04b's acceptance needs no permanent
carve-out; the inversion class dies. Failure mode: the atomic commit is wide (2 JSON files + 46
source files) — a partial land breaks up to 120 sites at once. Mitigation exists and is committed:
run `resolve-check.mjs`-style resolution before/after in the same gate.

**Option B — KEEP the nested subtree; encode `common` as a named exception to dot→colon.**
What it costs: the 72 colon-miss sites must be repaired _backwards_ (colon→dot for the 33
nested-resolvable, authoring for the 39); every future sweep, lint rule, and acceptance command
must carry the exception forever; **AR-04b's own acceptance grep can never reach a clean number**
— the 120+ legitimate dot-form `common.*` sites stay dot-form permanently, so the criterion's
"keys resolve through explicit colon namespaces" is unsatisfiable as written without a documented
carve-out. Enforcement mechanism: a lint guard banning NEW `common:*` colon-forms and allowing
dot-form `common.*` — the exact inverse of the rule everywhere else, encoded in tooling nobody
will expect. Failure mode: the exception erodes — one future sweep forgets it and silently breaks
120 sites, which is precisely the destructive conversion `RULING-P98A2-11` warns about, made
permanent instead of retired.

**Recommendation (not a decision): Option A.** It is the only option under which AR-04b's
acceptance is satisfiable without a permanent documented exception, its collision check is clean
(derived above, 0 overwrites), and its failure mode is bounded by an instrument that already
exists and is committed. Its cost is one wide atomic commit; Option B's cost is a permanent
inverted rule plus an unsatisfiable acceptance. §7 #1 records both readings for the overseer.

### 2.5 Sequencing constraint (MANDATORY, carried from `RULING-P98A2-11`)

Whichever way §7 #1 is ruled, the `common` exception/flatten must be encoded **before** any
project-wide dot→colon conversion runs. The conversion order inside the phase is therefore:
(1) rule on flatten-vs-keep → (2) land the `common` structural change (or exception encoding) with
its atomic rewrite → (3) only then run the mechanical sweep over the remaining ~7,086-minus-common
dot-form population. A sweep that runs first destroys 120 working sites.

---

## §3 — The MASK CLASS both acceptance greps cannot see

`t('prefix.' + value, value)` / ``t(`prefix.${value}`, value)`` — variable second argument.
AR-04a's grep requires a literal second arg; AR-04b's requires a dot-form literal key. **Both are
blind to this class BY CONSTRUCTION** (proven by direct test in `RULING-P98A2-12`; not re-proven
here — the construction is visible in the regexes themselves). The instrument of record, run with
its controls first:

```
$ python3 scripts/partA_maskfinder.py <repo-root> --control
  True / True / False / False        # both polarities discriminate
$ python3 scripts/partA_maskfinder.py <repo-root>
  UNRESOLVED dynamic t() key prefixes: 24 total  (19 mask a raw value -> criterion 1; 5 render a RAW KEY -> criterion 2)
```

**24 / 19 / 5 — byte-identical to P98's figure at `13d5094ea` and its close-time re-derivation.**
Nothing in this class moved. The named sites (full output at `/tmp/p99-research/maskfinder.out`):

**MASKED-RAW-VALUE (19 — a raw DB value renders behind the default):**
`EntityBreadcrumbTrail.tsx:125` (`entityTypes`) · `RelationshipNavigator.tsx:166,212` (`dossier.type`), `:218` (`dossier.status`) ·
`AddContributorDialog.tsx:258` (`tasks.contributorRole`), `:264` (`tasks.roleDescription`) · `ContributorsList.tsx:78` (`tasks.contributorRole`) ·
`TaskCard.tsx:51` (`priority`), `:54` (`status`), `:58` (`work_item`) · `TaskDetail.tsx:124,414,487` (`work_item`) ·
`AssignmentDetailsModal.tsx:213` (`waitingQueue.status`), `:223` (`waitingQueue.priority`), `:260` (`waitingQueue.entityType`) ·
`pages/Countries.tsx:275` (`countries.status`) · `pages/Organizations.tsx:300` (`organizations.status`) · `pages/TicketDetail.tsx:189` (`ticketDetail.tabs`, ns=intake)

**RAW-KEY (5 — the miss renders a raw key, no mask):**
`CommitmentEditor.tsx:120` (`afterActions.commitments.tracking`) · `DossierRecommendationCard.tsx:165` (`types`) ·
`TriagePanel.tsx:321` (`intake.form.requestType.options`) · `Dashboard/components/AttentionItem.tsx:92` (`stages`, ns=operations-hub) ·
`intelligence/IntelligencePage.tsx:65` (`intelligence.classification`)

**The P98 broken exemplar still does not resolve at HEAD.** `98-05-SUMMARY.md` records that a P98
plan cited `frontend/src/components/tasks/TaskCard.tsx:51-54` as "the existing, correct enum-keyed
`t()` idiom" while all three of its routings MISS — existence-in-JSON mistaken for resolution.
Re-verified here twice at HEAD: `neg-taskcard.mjs` prints `MISS=true` for all three
(`priority.low`, `status.in_progress`, `work_item.task` through ns `translation`), and
`TaskCard.tsx:51/54/58` appear in the maskfinder's MASKED list above. Any Phase 99 plan that names
an exemplar idiom must name one that RESOLVES — `t('priority.low')` bound to ns `assignments`
resolves ("Low") and is the correct near-neighbour.

What falls outside this instrument (its own header, verified against its code): static keys
(§2.2's class), any tree outside `frontend/src`, the `ar` bundle (EN-only — `resolve-check.mjs`
covers ar), reachability (dead code scans like live code), namespace binding beyond the three
shapes it parses, and whether a reported site actually renders (a driven surface's job).

---

## §4 — AR-01: the Arabic glossary

### 4.1 The two anchors a planner needs

- **The nav list lives at `frontend/src/components/modern-nav/navigationData.ts`** — 28
  `NavigationItem`s across 6 categories, each with a hardcoded English `label`, an i18n
  `labelKey` (`navigation.*` → the `navigation` subtree of `common.json`), and a `path`.
- **Nav labels render through a MASK**: `components/modern-nav/ExpandedPanel/NavigationSection.tsx:139`
  is `{t(item.labelKey, item.label)}` — a two-arg English default. A missing `navigation.*` key
  renders the hardcoded English label under `dir="rtl"` silently. Measured at HEAD: **3 of 28
  labelKeys are missing in BOTH locales** (`navigation.dashboardOverview`, `navigation.taskQueue`,
  `navigation.taskEscalations` — scratch resolver over `navigationData.ts` × both `common.json`s),
  so "Dashboard Overview", "Task Queue" and "Escalations" render in English in an Arabic session
  today. One category tooltip key (`navigation.workflow`) is also missing. **This makes the nav
  itself a member of AR-04a's population and an AR-03 leak surface** — three requirements
  intersect on one mechanism.
- **Page titles come from each page's own namespace**, one anchor per page (table below). There is
  no central title registry; that is why nav/title drift happens.

### 4.2 The nav-label ↔ page-title derivation (per entry, both anchors named)

| nav label (ar, `common.json navigation.*`) | path → resolved page                            | page title anchor                                                        | title (ar)                | verdict                                                                                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| البلدان (`countries`)                      | `/countries` → redirect → `/dossiers/countries` | `routes/_protected/dossiers/countries/index.tsx:247` → `countries:title` | الدول                     | **MISMATCH** (the named one)                                                                                                                                                                                   |
| الارتباطات (`engagements`)                 | `/engagements`                                  | `engagements:title` (`i18n/ar/engagements.json`)                         | المشاركات                 | **MISMATCH** (the named one)                                                                                                                                                                                   |
| الأشخاص (`persons`)                        | `/persons` → `/dossiers/persons`                | `-PersonsListPage.tsx` → `persons:title`                                 | جهات الاتصال الرئيسية     | **MISMATCH** (third term entirely)                                                                                                                                                                             |
| المواقف (`positions`)                      | `/positions`                                    | `routes/_protected/positions.tsx` → `positions:library.title`            | مكتبة المواقف             | **MISMATCH** (label vs "library of")                                                                                                                                                                           |
| مذكرات التفاهم (`mous`)                    | `/mous` → `pages/MoUs/MousPage.tsx`             | bare hook → `common.json mous.title`                                     | **العنوان** (en: "Title") | **MISMATCH + WRONG VALUE** — the page title key resolves to the generic "Title" label in BOTH locales; a mis-anchored key, not a translation                                                                   |
| قائمة الاستقبال (`intake`)                 | `/intake` → redirect → `/my-work/intake`        | `intake.json queue.title` family                                         | قائمة الانتظار            | **MISMATCH + TERM COLLISION** — "الانتظار" is the WAITING queue's term; a separate WaitingQueue page exists (`navigation.waitingQueue` = قائمة الانتظار). Two different queues currently share one Arabic name |
| (missing key `dashboardOverview`)          | `/dashboard`                                    | `dashboard.json title`                                                   | لوحة الملفات              | **MASKED ENGLISH label** vs Arabic title                                                                                                                                                                       |
| المنظمات (`organizations`)                 | `/organizations` → `/dossiers/organizations`    | `organizations:title`                                                    | المنظمات                  | match                                                                                                                                                                                                          |
| المنتديات (`forums`)                       | `/forums` → `/dossiers/forums`                  | `forums:pageTitle`                                                       | المنتديات                 | match                                                                                                                                                                                                          |
| مجموعات العمل (`workingGroups`)            | `/working-groups` → `/dossiers/working_groups`  | `working-groups:title`                                                   | مجموعات العمل             | match                                                                                                                                                                                                          |
| مكتبي (`tasks`)                            | `/tasks` → `pages/MyTasks.tsx`                  | `tasks-page:title`                                                       | مكتبي                     | match                                                                                                                                                                                                          |
| التقويم (`calendar`)                       | `/calendar`                                     | `calendar:page.title`                                                    | التقويم                   | match                                                                                                                                                                                                          |
| الملخصات (`briefs`)                        | `/briefs` → `pages/Briefs/BriefsPage.tsx`       | `briefs-page:title`                                                      | الملخصات                  | match                                                                                                                                                                                                          |

**Derivation bound, stated:** 13 of the 28 nav entries are resolved above (plus the elected-officials
hub page, `elected-officials:list.title` = المسؤولون المنتخبون = nav المسؤولون المنتخبون, match —
it is reached via the dossiers hub, not a top-level nav item). The remaining nav targets
(`events`, `reports`, `scheduledReports`, `analytics`, `intelligence`, `monitoring`,
`dataLibrary`, `wordAssistant`, `users`, `settings`, `help`, `admin`, `taskQueue`,
`taskEscalations`, `newEvent`) route to pages whose heading anchors did not surface under the
`title`-key greps this seat ran (their headings come from deeper layout components); their
per-page anchors remain to be walked by the AR-01 lane with the same two-anchor method. **What is
established:** 7 of the 13 derived pairs mismatch — the two the requirement names are not
exceptional; drift is the norm, and the fix must be a glossary applied to BOTH anchors, not two
spot edits.

### 4.3 The competing-terms census (all 129 `i18n/ar/*.json`, 16,227 leaf values scanned)

Command: `/tmp/p99-research/p99-glossary.mjs` (substring census over leaf VALUES; negative control
0 on a nonsense stem; counts are value-occurrences, not sites — a stem inside a longer word counts,
so senses pollute some rows and the table says where).

| object           | competing Arabic terms (values / files)                                           | census note                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| dossier          | دوسيه 199/8 · دوسييه 2/1 (brand `shell.appName` only) · ملف/الملف 561/89 + 319/64 | ملف counts heavily polluted by the "file/attachment/profile" senses (الملف الشخصي = profile)                    |
| engagement       | ارتباط 173/33 · مشارك 251/60 · تفاعل 114/26                                       | مشارك pollutes with "participant/share"; تفاعل with "interaction"                                               |
| commitment       | التزام 212/51 · تعهد 0                                                            | **uncontested**                                                                                                 |
| position         | موقف 108/22 + مواقف 85/20 · منصب 53/18                                            | منصب is the "office/post" sense (elected officials) — a different object, keep both but bind each to its object |
| task             | مهمة 102/33 + مهام 81/28 · تكليف 33/8                                             | تكليف is the assignments family's term                                                                          |
| work item        | عناصر العمل 30/17 · عنصر العمل 13/5 · بند عمل/بند العمل 10/3                      | عنصر العمل dominant                                                                                             |
| forum            | منتدى 85/29 + منتديات 40/24 · ملتقى 0 · محفل 0                                    | **uncontested**                                                                                                 |
| working group    | مجموعة عمل/مجموعة العمل/مجموعات العمل 65/24 · فريق/فرق العمل 25/9                 | فريق pollutes with generic "team"                                                                               |
| elected official | مسؤول منتخب 11/9 · المسؤولون المنتخبون 4/4 · منتخب 27/12                          | consistent stem; plural form varies                                                                             |
| intake           | استقبال 32/15 · الوارد 5/4                                                        | plus the قائمة الانتظار collision (§4.2)                                                                        |
| brief            | ملخص 154/44 · موجز 124/28 · إحاطة 66/17                                           | three live terms — the widest genuine competition                                                               |
| country          | دولة 149/48 + دول 389/73 · بلد 13/5 · بلدان 2/2                                   | بلدان survives in exactly 2 values, one of them the nav label                                                   |

### 4.4 The proposed glossary table (one term per object; contested rows go to §7)

| object                | proposed term                     | basis (one line)                                                                                                                         |
| --------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| dossier               | **دوسيه** (pl الدوسيهات)          | nav + hub already say الدوسيهات/مركز الدوسيهات; دوسييه stays ONLY in the brand mark; but ملف is 5× more frequent → **CONTESTED, §7 #2a** |
| country               | **دولة / الدول**                  | page title الدول; دول family 538 values vs بلدان 2 — the nav label is the outlier                                                        |
| engagement            | **مشاركة / المشاركات**            | page title; AR-01's own arrow (الارتباطات → المشاركات) reads in this direction — **CONTESTED, §7 #2b** (ارتباط has 173 uses to sweep)    |
| commitment            | التزام                            | uncontested (تعهد = 0)                                                                                                                   |
| position (stance doc) | موقف / المواقف                    | positions namespace; منصب reserved for office/post of officials                                                                          |
| task                  | مهمة                              | dominant; تكليف reserved for assignment                                                                                                  |
| assignment            | تكليف                             | assignments family consistently uses it (`تكليفاتي`)                                                                                     |
| work item             | عنصر العمل / عناصر العمل          | 43 values vs 10 for بند                                                                                                                  |
| forum                 | منتدى / المنتديات                 | uncontested                                                                                                                              |
| working group         | مجموعة عمل / مجموعات العمل        | nav + title agree; فريق = "team" sense                                                                                                   |
| elected official      | مسؤول منتخب / المسؤولون المنتخبون | consistent stem already                                                                                                                  |
| intake                | استقبال (قائمة الاستقبال)         | and RENAME the intake queue title out of قائمة الانتظار (waiting-queue collision)                                                        |
| brief                 | **ملخص / الملخصات**               | nav + briefs-page agree; إحاطة reserved for "briefing (session)"; موجز → **CONTESTED, §7 #2c**                                           |

Applying the glossary is then a per-namespace value sweep (129 ar files), with §4.2's two-anchor
rule as the acceptance for criterion 1's second clause.

---

## §5 — AR-02: Arabic date/time localization — AND THE UI CONTRACT (per `RULING-P99-01` §3, no separate UI-SPEC ships; the `UI99-Cn` ids below are the citable contract)

### 5.1 The sanctioned formatter — and the finding that criterion 2's defect lives INSIDE it

`frontend/src/lib/format-date.ts` (113 lines, read in full at HEAD) exports five functions.
The four absolute ones — `formatDayFirst`, `formatTime`, `formatDayFirstYear`, `formatDateTime` —
**hardcode `en-GB`** and their doc comments state Policy D (Phase 82): output is "Latin and
byte-identical for `en` and `ar`", `_locale` deliberately unused. So the ONE sanctioned formatter
**emits English weekday and month names (`Tue 28 Apr`) into Arabic sentences by design**, across
its **154 consumer files** (`grep -rln "lib/format-date" frontend/src --include='*.ts' --include='*.tsx' | wc -l` → 154).
Phase 98's routing work (COPY-05) therefore made Arabic dates MORE uniformly English, and AR-02's
repair is **a change to the formatter itself, not a sweep of its consumers** — one edit fixes 154
files at once. Only `formatRelativeTime` (`:107-113`, landed by 98-02) already localizes: it reads
`i18n.language` at call time and passes the date-fns `ar` locale OBJECT, keeping Latin digits.
Note the tension to resolve in planning, not silently: Policy D's comment says "byte-identical
across locales"; AR-02 says Arabic names with Latin digits. AR-02 is the phase requirement;
Policy D's DIGIT half survives, its NAME half is what this phase amends. (Design choice inside the
repair — reuse the retained `_locale` param (13 files already pass it) vs read `i18n.language` at
call time like `formatRelativeTime` — is planner discretion; call-time read is the consistent
idiom and survives mid-session flips.)

### 5.2 The guard — exactly what it can and cannot see

`scripts/check-date-formatting.mjs` (533 lines, read at HEAD; runs STRICT — 0 burn-down rows, 6
named permanent exemptions incl. the `EnhancedActivityFeed` dead-code one with its VOID
CONDITION). Its checks: month-BEFORE-day `format()` literals (check 2 `monthFirst` — a textual
month token preceding a standalone `d`), `.toLocaleDateString`/`.toLocaleTimeString` outside the
formatter, Indic-producing locale literals (`'ar-SA'`), date-fns relative calls outside the
formatter, 12-hour tokens, date-named `.toLocaleString(` receivers, `Intl.RelativeTimeFormat`,
local `*relative*` declarations, and the `${n}d`/`${n}ي` short-suffix shape.

**What it CANNOT see, each line load-bearing for this phase:**

- **Day-first English-name literals** — `'d MMM'`, `'EEE d MMM'`, `'MMMM yyyy'` pass `monthFirst`
  (no day token, or day precedes month). The guard checks ORDER, never LOCALE. Derived at HEAD:
  **10 non-test date-fns sites emit English month/weekday names** under `ar`:
  `ForumDetailsDialog.tsx:328`, `EscalationDashboard.tsx:184`, `UnifiedCalendar.tsx:141` (`MMMM yyyy`),
  `DossierDrawer/UpcomingSection.tsx:68` (`EEE d MMM`), `ForumsPage.tsx:141`,
  `Dashboard/widgets/MyTasks.tsx:71`, `Dashboard/widgets/WeekAhead.tsx:53` (`EEE`),
  `WorkBoard/KCard.tsx:90`, `reports/ReportsPage.tsx:433`, `events/EventsPage.tsx:77` (`MMMM yyyy`).
  The two `MMMM yyyy` month-nav headers were ruled OUT of P98 by D-25 **with their Arabic
  explicitly routed to AR-02 — they are IN scope here**, as are the other eight.
- **The formatter's own output** (§5.1) — the guard's design assumes routing onto the formatter IS
  the fix; it asserts nothing about what the formatter emits.
- **Hardcoded full-word relative/date phrases** — no check covers them; the two live members P98
  named are re-verified at HEAD: `Notifications/NotificationList.tsx:125-126` (hardcoded
  bilingual `اليوم/أمس/Today/Yesterday` section headers — NOTE: these render correct ARABIC under
  `ar`, so they are a hardcoded-copy maintenance defect, NOT a criterion-2 English-leak; a plan
  that "fixes" them buys no criterion-2 progress) and
  `empty-states/NotificationPreviewTimeline.tsx:306` (`{notification.timeAgo} {t('preview.ago')}` —
  cross-component assembly; whether `timeAgo` arrives English under `ar` needs the component walk).
- Test files, i18n JSON values, and every tree outside `frontend/src`.

### 5.3 Latin digits — the mechanism, confirmed, and what would break it

`frontend/src/lib/format-locale.ts:9`: `language === 'ar' … ? 'ar-u-nu-latn' : language` — Latin
digits are pinned EXPLICITLY (`-u-nu-latn`), with the file's own comment noting bare `'ar'`
merely _happens_ to resolve `latn` in current Chrome/Node. The guard separately bans `'ar-SA'`
literals (Indic-producing). **What would break policy: an AR-02 repair that formats dates with
bare `'ar-SA'` or default `'ar'` number formatting** — Arabic-Indic digits would appear and would
be a REGRESSION, not a fix. The repair must route through `toFormatLocale`/`'ar-u-nu-latn'` (or
date-fns `ar` locale object, which interpolates with `String()` — the `formatRelativeTime` idiom).

### 5.4 How a criterion-2 oracle DISCRIMINATES (fails today, passes after)

On any settled `?lng=ar` surface rendering dates from the formatter (e.g. `/commitments`,
`/dossiers`, `/calendar` — 154 consumer files guarantee reach):

- **RED today:** the main region matches `/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/`
  inside a date-shaped cell (the formatter's own `Tue 28 Apr` output). Verified mechanism: the
  formatter hardcodes these token shapes via `en-GB`.
- **GREEN after:** the same cells match Arabic month/weekday names (`[؀-ۿ]`) AND Latin
  digits `[0-9]` AND **zero Arabic-Indic digits `[٠-٩]` anywhere in `main`** (the
  regression guard), AND the `en` leg of the same spec still renders `Tue 28 Apr` byte-exact (the
  non-regression leg that makes the `ar` green discriminating rather than ambient).

### 5.5 The UI contract rows (dates/times)

- **UI99-C1** — Under `?lng=ar` (locale asserted per UI99-C11), no English weekday or month token
  (`Mon…Sun`, `Jan…Dec`, full names included) appears inside the `main` region on the criterion-2
  route set; date cells render Arabic month/weekday names. Basis: `format-date.ts:38/55/73`
  hardcode `en-GB`; 154 consumer files; the 10 date-fns sites in §5.2. Checkable by: settled DOM
  capture + the token regex above, per route, both locales (en leg asserts `Tue 28 Apr` survives).
- **UI99-C2** — Every date/time digit on `?lng=ar` surfaces is Latin: `main` contains **zero**
  codepoints in `[٠-٩]` (and `[۰-۹]`). Latin digits are DELIBERATE POLICY; an
  Arabic-Indic-digit formatter is a REGRESSION. Basis: `lib/format-locale.ts:9` (`ar-u-nu-latn`),
  Policy D (Phase 82 / DESIGN §7.4), guard check 3 banning `'ar-SA'`. Checkable by: DOM text scan
  for the two Indic ranges, per surface, `ar` leg.
- **UI99-C3** — Relative time under `ar` renders Arabic phrases (`منذ …` family) produced ONLY by
  `formatRelativeTime` (`format-date.ts:107`), with Latin digits, on feed/timeline recency
  surfaces only (D-25 sanction). Basis: 98-02's landing + `check-date-formatting.mjs` check 5.
  Checkable by: the existing `98-copy05` oracle shape — `/activity?lng=ar` cells match
  `منذ \d+` (Latin digits inside an Arabic phrase); guard stays green at 0 rows.
- **UI99-C4** — Calendar-grid month headers (`UnifiedCalendar.tsx:141`, `EventsPage.tsx:77`) and
  the other eight §5.2 date-fns sites render Arabic month/weekday names under `ar`. Basis: D-25's
  explicit routing of their Arabic to AR-02. Checkable by: `/calendar?lng=ar` and `/events?lng=ar`
  header text matches Arabic month name + Latin year, no `Jan…Dec` token.
- _(open, §7 #4)_ the `GST` suffix inside `formatTime` output is an English token inside Arabic
  sentences that is neither weekday nor month; whether AR-02 covers it (e.g. `توقيت الخليج` vs
  keeping the mono `GST` tag) is an overseer call — the contract row is written either way once
  ruled.

---

## §6 — AR-03: English under `dir="rtl"` — AND THE UI CONTRACT (continued `UI99-Cn` ids)

### 6.1 The four named surfaces — component, exact string, MECHANISM (the mechanism decides which plan owns it)

| surface                              | component (HEAD)                                                      | exact English observed                                                                                                                          | mechanism                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 404 page                             | `routes/__root.tsx:21-42` (`NotFoundPage`)                            | "Page not found", "The page you are looking for does not exist or has been moved.", "Go back", "Dashboard"                                      | **AR-04a MASK on keys missing in BOTH locales** (`errors.pageNotFound`, `errors.pageNotFoundDescription`, `common.goBack`, `common.dashboard` — none exist in either `common.json`; re-verified by JSON walk). The translated copy ALREADY EXISTS at the **nested-common** path `common.notFound.{title,message,goBack,goHome}` in both locales — the repair is a key REPOINT, and its key shape RIDES §7 #1 (the nested-`common` flatten call). "بحث" renders because `common.search` resolves via the nested subtree — one resolving key beside four masked ones, which is why the surface reads half-translated |
| intake queue header + primary button | `pages/IntakeQueue.tsx:278,287,298,321` (binds `['common','intake']`) | "Review and classify incoming requests", "New Request", "Pending Triage"                                                                        | **AR-04a MASK**: `t('intake.description', …)`, `t('intake.createNew', …)`, `t('intake.filters.pendingTriage', …)` — dot-form paths that resolve in NEITHER candidate namespace (`common.json` has no `intake.*` subtree; `intake.json` has no top-level `intake` key — verified by JSON walk). Route note: `/intake` redirects to `/my-work/intake`; the audit observed the leak there                                                                                                                                                                                                                             |
| position read-only banner            | `routes/_protected/positions/$id/index.tsx:59-63`                     | "Position Under Review - Read Only. …", "Position Approved - Read Only. …", "Position Published - Read Only. …" (three status ternary branches) | **HARDCODED English literals** — no `t()` call at all. Repair = i18n extraction + authoring, the COPY-09-shaped class                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| search suggestion chips              | `pages/DossierSearchPage.tsx:311`                                     | `['Saudi Arabia', 'UN', 'G20', 'climate']` rendered as chips                                                                                    | **HARDCODED English data-as-copy array** — no `t()` call. Repair = i18n extraction (and a glossary question: proper nouns like `G20` may legitimately stay Latin — the allowlist in UI99-C9 must name them)                                                                                                                                                                                                                                                                                                                                                                                                        |

So the four split **2 mask / 2 hardcoded**: the mask pair belongs to the AR-04a lane (authoring +
repoint) and the hardcoded pair to an extraction lane — a plan that assigns all four to one
mechanism will mis-scope two of them.

### 6.2 The rest of the population — derived as CLASSES (a rendered census from here is not possible; §8)

Source-derived classes that render English under `dir="rtl"`, with §1–§4 counts:

1. **The 2-arg mask class** — every §1 unresolved site that mounts on an Arabic screen renders its
   English default: 473 sites / 179-file-order spread (§1.4). The four named surfaces contain 7 of
   them; the class is the population.
2. **Hardcoded-literal class** — invisible to every committed instrument BY CONSTRUCTION
   (`RULING-P98A2-13` B4); known members: the banner + chips above, `HelpPage:166`,
   `useBriefingBooks:164-165`, `PositionTrackerCard:93` (COPY-09 → P102 owns those three),
   `EntitySearchDialog.tsx:555,576,584` (`Match:`/`Level:`/`Last used:`),
   `AISuggestionPanel.tsx:294`, `monitoring/Dashboard.tsx:81,85` (`Overall:`). Only a rendered
   Latin-run scan (UI99-C9) can bound this class.
3. **Bare-token class** — colon-form `common:*` misses render lowercase English words (`all`,
   `cancel`, `loadMore` — 42 sites / 29 distinct, §2.3) that read as plausible copy; every
   dotted-token detector is blind BY MECHANISM.
4. **Nav mask class** — 3 of 28 nav labels render hardcoded English via
   `NavigationSection.tsx:139` (§4.1).
5. **Date-token class** — the formatter's English weekday/month output (§5), on every dated cell.
6. **Raw-key class** — 335 strict-model unresolved no-default sites (§2.2) render dotted keys,
   which contain English words.

**Driven vs UNDRIVEN, per the four named surfaces** (derived from `tests/e2e` at HEAD):

- `/intake/queue` → `/my-work/intake`: **surface DRIVEN** (`98-copy04` VISITED_SURFACES, capture
  floor 34) — but its `@case` leg is `en`-only, so **the Arabic-leak defect itself is UNDRIVEN**:
  no existing oracle visits it under `ar` asserting no-English.
- `/search` chips: `95-search-renders.spec.ts` drives `/search` — whether it reaches the
  empty-state chips and under which locale needs that spec read by the planning lane; treat the
  `ar` chip assertion as **UNDRIVEN** until shown otherwise.
- 404 route: **UNDRIVEN** — no spec navigates a nonexistent route (grep over `tests/e2e` finds
  none).
- Position read-only banner: **UNDRIVEN**, and it carries a **DATA PRECONDITION** — it needs a
  position in `under_review`/`approved`/`published` state reachable by the admin login; whether
  staging holds one is not knowable from this seat (§8).

### 6.3 Settle primitives — what exists TODAY, and the law every criterion-2/3 oracle inherits

The pre-P98 e2e suite had NO settle primitives; **any pre-P98 green on these surfaces proves the
nav shell rendered, nothing more.** What exists now, committed, at HEAD:

- **`settle(page)`** — `tests/e2e/98-copy04-voice.spec.ts:248-252`: `main` visible →
  best-effort `networkidle` (60 s, `.catch`) → **3 s dwell** (proven sufficient: 3 s vs 8 s
  byte-identical captures on all eight surfaces; `networkidle` alone never fires on surfaces
  holding open subscriptions).
- **`expectLocale(page, lng, surface)`** — same file `:262-265`: asserts
  `document.documentElement.lang` equals the requested locale. Not ceremony: `?lng=` does NOT
  survive the `/intake/queue` → `/my-work/intake` redirect (the file documents this), so the
  landed locale must be ASSERTED, never inherited.
- **Per-surface capture FLOORS** — `:163` (`'/intake/queue': 34`, etc.), from 98-09's known-good
  run: a regression to shell-capture REDS instead of passing quietly (blind mode captured 20 on
  `/intake/queue`).
- **The stronger form** — a post-hydration DATA locator wait (`98-copy01/03/08` style: await the
  row/card/popover the shell cannot satisfy) — stronger than any dwell because it cannot succeed
  early.

**These live INSIDE individual spec files — there is NO shared settle module.** A Phase 99 spec
must either import-by-copy (the P98 pattern) **[REVOKED 2026-08-18 by RULING-P99-21 §2 — import-by-copy is a copy-propagation vector of the same family that moved one defective USE_NS regex through three generations of instrument. Instruments that must agree SHARE CODE; do not copy. The phase took the hoisting branch below, which is the correct one.]** or the phase first hoists `settle`/`expectLocale`
into a shared helper; either way the contract is UI99-C11.

**Locale-project correction (checked at HEAD, and it corrects a P98 close-out sentence):** the
root `playwright.config.ts:40-48` DOES define a `chromium-ar-smoke` project (`locale: 'ar-SA'`,
`testMatch: '**/ar-smoke/**'`), and three specs exist under `tests/e2e/ar-smoke/`
(`login`, `command-palette`, `dossier-navigation`). P98's evidence-bounds line "there is no
`chromium-ar` project" is therefore wrong as a statement about the tree, though right about P98's
own runs — the project's `testMatch` confines it to the three smoke specs, so **every spec
outside `ar-smoke/` (including any Phase 99 oracle placed beside the `98-copy0N` files) runs both
locale legs inside `chromium-en` via `?lng=` + `expectLocale`**. Two cautions if a plan reaches
for the ar-smoke project instead: its `locale: 'ar-SA'` is the BROWSER locale (exactly the
Indic-digit-producing tag the date guard bans in APP code — the app's own `ar-u-nu-latn` pinning
is what keeps digits Latin, which UI99-C2 asserts rather than assumes), and the three smoke specs
predate the P98 settle law, so their greens carry the pre-settle caveat until re-read.

### 6.4 The UI contract rows (English-free RTL + typography + settle)

- **UI99-C5** — Navigating any nonexistent route under `?lng=ar` renders the 404 surface with
  ZERO of the four English strings of §6.1 row 1; heading/message/buttons render the
  `common.notFound.*` Arabic values (`الصفحة غير موجودة` family). Basis: `__root.tsx:21-42` +
  both `common.json`s. Checkable by: goto `/definitely-not-a-route?lng=ar` → settle →
  `expectLocale` → assert the Arabic strings present and `/Page not found|Go back|Dashboard/`
  absent from `main`. RED today by mechanism (keys missing in both locales).
- **UI99-C6** — `/my-work/intake` under asserted `ar`: the header subtitle, the primary button,
  and the triage filter render Arabic; the strings "Review and classify incoming requests",
  "New Request", "Pending Triage" appear nowhere in `main`. Basis: `IntakeQueue.tsx:278,287,298,321`
  - the missing-key derivation in §6.1. Checkable by: settled capture with floor ≥34 (the
    committed floor for this surface), string-absence + Arabic-presence assertions.
- **UI99-C7** — A position in each read-only state (`under_review`, `approved`, `published`)
  renders its banner in Arabic under asserted `ar`; the literal "Read Only" and all three §6.1
  sentences appear nowhere. Basis: `positions/$id/index.tsx:59-63` hardcoded literals. Checkable
  by: drive `/positions/<id>` for a fixture in each state (data precondition — §8), assert
  banner-region text is Arabic-script majority with no `[A-Za-z]{3,}` run outside the allowlist.
- **UI99-C8** — The `/search` empty-state suggestion chips under asserted `ar` render from i18n
  (not the hardcoded array), Arabic where the glossary says Arabic; Latin proper nouns only per
  the UI99-C9 allowlist. Basis: `DossierSearchPage.tsx:311`. Checkable by: settled `/search?lng=ar`
  capture, chip texts ∉ {`Saudi Arabia`,`UN`,`G20`,`climate`} as raw literals unless allowlisted.
- **UI99-C9** — On the criterion-3 route set (minimum: the four surfaces above + `/dashboard`,
  `/dossiers`, `/my-work`, `/calendar` — the plan fixes the final set), under asserted `ar` after
  settle, **no `[A-Za-z]{3,}` run appears in the `main` region**, excepting a NAMED allowlist
  (proper nouns/brands: `GST` pending §7 #4, `G20`, `IntelDossier` brand mark, ISO codes, mono
  SLA `T±N` tokens, Latin digits). Basis: the addendum's contract form; the six §6.2 classes are
  exactly what this predicate catches. Checkable by: DOM text scan per route; the allowlist lives
  in the spec and every addition carries a reason. RED today on every §6.1 surface.
- **UI99-C10** — Typography: under `dir="rtl"`, rendered body text resolves to **Tajawal** —
  asserted on a RENDERED surface via
  `getComputedStyle(el).fontFamily` beginning with `Tajawal` for a sampled text node inside
  `main` (and for one heading), NOT from CSS source. Basis: `index.css:294-295` (`--font-arabic`),
  `:500-505` (RTL override `font-family: 'Tajawal', …`); the audit observed Tajawal correctly
  applied on the 404 page, so this is a KEEP-TRUE contract, not a repair. Checkable by: one
  `page.evaluate` per `ar` leg of any criterion-3 spec.
- **UI99-C11** — **The settle law**: every criterion-2/3 oracle, before its first assertion,
  (a) awaits a post-hydration data locator OR runs the committed `settle()` sequence
  (`main` visible → best-effort `networkidle` → 3 s dwell), AND (b) asserts its locale via
  `expectLocale` (`document.documentElement.lang`), AND (c) where a known-good capture count
  exists, enforces the committed floor. _A capture is a SETTLED render — locale ASSERTED, never
  inherited._ Basis: `98-copy04-voice.spec.ts:248-265` + the P98 shell-capture false-green
  (`RULING-P98A2-20`: a deterministic 3/3 false green from capturing the synchronous nav shell).
  Checkable by: spec review at plan-gate + the floor mechanism going RED when the settle is
  neutered (the drill 98-09 ran).

---

## §7 — OPEN DECISIONS for the overseer

**#1 — FLATTEN the nested `common` subtree, or KEEP it and encode the exception?** (the
highest-leverage structural call in the phase; full derivation §2.3–2.4)

- _Reading A — FLATTEN._ Evidence: merge is collision-free (67 leaves move, 0 same-name child
  overwrites, both locales); 33 of the 72 colon-form misses fix themselves; the project-wide
  dot→colon sweep then needs NO permanent exception; AR-04b's acceptance becomes satisfiable as
  written. Cost: one wide atomic commit — both `common.json`s + the 120-site/46-file
  `common.X`→`common:X` rewrite — and a partial land breaks up to 120 working sites at once
  (bounded by running the committed resolution harness before/after in the same gate).
- _Reading B — KEEP + exception._ Evidence: no JSON restructuring risk; the 120 dot-form sites
  stay untouched. Cost: the 72 colon-miss sites must be repaired backwards (colon→dot ×33,
  authoring ×39); every future sweep/lint/acceptance carries an INVERTED rule for one namespace
  forever; AR-04b's "keys resolve through explicit colon namespaces" can never read clean without
  a documented permanent carve-out; the exception's erosion failure mode is precisely the
  destructive conversion `RULING-P98A2-11` exists to prevent — made permanent.
- **Recommendation: A.** Its failure mode is bounded by a committed instrument; B's failure mode
  is unbounded in time. Either way the MANDATORY SEQUENCING of §2.5 holds: the ruling lands
  before any conversion runs. Note the 404 repair (UI99-C5) repoints onto `common.notFound.*`,
  which lives in the NESTED subtree — its final key shape depends on this ruling; the plan should
  express that repair relative to the ruling, not hardcode either shape.

**#2 — Glossary rows where two terms are defensible** (census §4.3; each needs one ruled term):

- _a) dossier:_ **دوسيه** (nav/hub already standardized; distinctive, transliterated) vs **ملف**
  (5× more frequent, natural Arabic — but collides with "file"/"profile" senses: `الملف الشخصي`,
  `مرفق ملف`). Recommendation: دوسيه for the OBJECT, ملف remains legal for files/profiles — and
  the sweep must therefore be sense-aware, not mechanical.
- _b) engagement:_ **مشاركة** (page title; AR-01's own arrow points this way) vs **ارتباط**
  (nav + 173 existing uses; مشاركة also means "participation/sharing"). Recommendation: مشاركة,
  accepting the ambiguity cost, because the requirement text itself reads الارتباطات → المشاركات.
- _c) brief:_ **ملخص** (nav + briefs-page agree) vs **موجز** (124 uses) vs **إحاطة** (66 uses,
  arguably the correct diplomatic register for "briefing"). Recommendation: ملخص for the brief
  ARTIFACT, إحاطة reserved for briefing SESSIONS; موجز swept.
- _d) the queue-name collision:_ intake queue currently titles itself **قائمة الانتظار**, which is
  the WAITING queue's name (`navigation.waitingQueue` = قائمة الانتظار) — two different surfaces
  share one Arabic name. Recommendation: intake = قائمة الاستقبال everywhere (nav already says
  it); waiting = قائمة الانتظار. Also ruled here per the audit's F18 note: `تطوير المنصب` for
  "Position Development" is the wrong SENSE of position (post, not stance) — the glossary's
  موقف/منصب split (§4.4) decides it.

**#3 — Where do the 284 default-namespace keys get authored?** (§1.5) The unresolved keys whose
binding defaults to `common` sit there only because their files declare no namespace.

- _Reading A:_ author all 284 into `common.json` — smallest diff, but `common.json` (already the
  largest namespace, carrying the nested-subtree history) becomes a dumping ground and every one
  of those files stays namespace-less.
- _Reading B:_ re-bind the heavy files (§1.5's table: TriagePanel, Countries, Organizations,
  TicketDetail, …) to their feature namespaces and author the keys there — more edits, but the
  keys land where the glossary sweep and future authoring will look for them.
- Recommendation: B for the top ~10 files (which carry ~48% of the sites), A for the long tail.
  This is resourcing-shaped, so it is the overseer's call, not the planner's default.

**#4 — Does AR-02 cover the `GST` suffix?** `formatTime` emits `14:30 GST` — `GST` is an English
token inside an Arabic sentence, but it is neither a weekday nor a month name, and criterion 2
names only those. _Reading A:_ out of scope — `GST` is a mono timezone tag like the SLA `T±N`
tokens `RULING-P98A2-17` carved out; it joins UI99-C9's allowlist. _Reading B:_ in scope — the
criterion's INTENT is "Arabic sentences read as Arabic", and `توقيت الخليج` exists as the natural
form. Recommendation: A (carve out, allowlist, revisit only if the operator's Arabic review
objects) — it keeps the date repair mechanical and the allowlist honest. The UI99-C9 allowlist
entry is written conditionally on this ruling.

**#5 — What does AR-04b's acceptance MEAN numerically?** The committed acceptance prints two
counts with no target. Two readings, 20× apart in scope:

- _Reading A — full conversion:_ the row text ("keys resolve through explicit colon namespaces
  rather than dot form") reads as: every no-namespace dot-form key converts — the
  7,986-minus-900-overlap ≈ 7,086-site population (§2.1), minus the `common` exception if #1
  rules KEEP, with the 288 test-file sites either converted or excluded by a stated carve-out.
- _Reading B — behavioral only:_ ROADMAP criterion 4 says "No `t()` call resolves **through a
  dot-form key with an English default**" — the defect is the mask+dot conjunction plus the
  unresolved tail (§2.2's 335 strict-model sites + §1's 473 masks), and already-resolving
  dot-form keys inside their bound namespace are working code a conversion merely churns.
- Recommendation: B for what the phase must FIX, A only if the overseer wants the convention
  landed wholesale — and if A, it must be sequenced after #1 and instrumented by resolution
  checks, because §2.3 proves a mechanical conversion can break working copy. The two readings
  produce different lane counts; the plan cannot start until this is ruled.

---

## §8 — Hazards, and what is NOT knowable from here

### 8.1 Instrument blindness, one line each (committed instruments; §5.2 covers the date guard)

- **AR-04a grep (a)** — line-bound (multi-line calls invisible), unanchored (identifier tails
  match), literal-second-arg only; blind to §3's class BY CONSTRUCTION.
- **AR-04b greps** — dot/colon populations overlap by 900 (§2.1); count matches, not defects;
  blind to template-literal keys and §3's class BY CONSTRUCTION.
- **`scripts/i18n-mask-audit.mjs`** — namespace model LOOSER than the shipped app (no-fallbackNS
  gap hides 9 two-arg + 42 raw-key sites; no `translation` alias — §1.3); EN bundles only; walks
  `frontend/src` only; does not exclude `.understand-anything` (moot at HEAD: 0 `.ts(x)` files
  there, instrument-tested by `find`).
- **`scripts/partA_maskfinder.py`** — its own §3 negative-scope list: static keys, ar bundle,
  reachability, prop-shape `t` bindings, rendering; `frontend/src` only.
- **`scripts/resolve-check.mjs`** — checks its hand-written ROUTINGS table ONLY; no rendering; no
  interpolation/plural validation; nothing about sites the table does not list.
- **`tests/e2e/98-copy02-rawkeys.spec.ts`** — driven surfaces only; blind to bare undotted tokens
  BY MECHANISM (§2.3) and to masked sites (a default hides the key it would detect).
- **The glossary census (scratch)** — substring over VALUES: senses pollute counts (§4.3 says
  where); it counts occurrences, not rendered surfaces.
- **Repo `grep`** — a ugrep wrapper honouring `.gitignore`; every zero above that mattered was
  paired with a positive control, and `command grep` cross-checks agreed where run (§1.1).

### 8.2 Documentation defects found (reported, not fixed — the overseer owns the ledger)

1. **`REQUIREMENTS.md:326` detector path cite — FIXED-BY-OVERSEER** (per
   `BRIEF-99-RESEARCH-ADDENDUM-01`): verified at read time, the line now reads
   `tests/e2e/98-copy02-rawkeys.spec.ts`, which exists (20,928 bytes at HEAD);
   `frontend/tests/e2e/98-copy02-rawkeys.spec.ts` does not exist and was never created — the
   standing rule (never create the file a dangling cite names) held.
2. **Units mislabel in `REQUIREMENTS.md` AR-04b's dated note (~line 314):** "306 **distinct
   unresolved keys** by one instrument" — 98-04's own derivation records 306 as **SITES**
   (309 sites − 3 FPs; 280 distinct keys). The 353 figure IS distinct keys. The note compares a
   site-count to a key-count without saying so; §2.2 reconciles the populations properly.
3. **P98 close-out evidence-bounds line "there is no `chromium-ar` project"** is false as a
   statement about the tree — `playwright.config.ts:40` defines `chromium-ar-smoke` (3 specs,
   `ar-smoke/` only). Right about P98's runs, wrong as written; §6.3 carries the correction.

### 8.3 What only a RUNNING APP can answer, and what it would take

- **The rendered criterion-3 census** (UI99-C9's first red run): which Latin runs actually appear
  per route under `ar`. Takes: the P98 rig — dev server + Playwright `--workers=1`, admin login
  (`.env.test`), `?lng=ar` + `expectLocale`, settle per UI99-C11.
- **The position read-only banner's three states** (UI99-C7): does staging hold a position in
  `under_review` / `approved` / `published` reachable by admin? Not derivable from source; if
  absent, the leg is UNDRIVEN-by-data exactly like P98's intake-ticket leg (staging held ZERO
  intake tickets at P98 close — which also bears on any `/intake` DETAIL leg here).
- **Whether `95-search-renders` reaches the suggestion chips**, and under which locale (§6.2) —
  one spec-read plus one run answers it.
- **`NotificationPreviewTimeline`'s `timeAgo` provenance** (§5.2) — a component walk plus one
  rendered check decides whether it is a criterion-2 member or Arabic-safe.
- **Whether the three `ar-smoke` specs still pass under the P98 settle law** — they predate it;
  one run answers.

### 8.4 Scratch artifacts (declared)

`/tmp/p99-research/`: `p99-census.mjs`, `p99-strict.mjs`, `p99-glossary.mjs` (instruments),
`mask-audit.json`, `maskfinder.out`, `resolve-check.out`, `census-summary.json`,
`census-twoarg-sites.json`, `census-rawkey-sites.json`, `census-353-style.json`,
`census-common-colon.json`, `common-dot-sites.json`, `strict-loose-only-*.json` (outputs).
Nothing was written anywhere else outside this file and the heartbeat.

---

## Closing

Every §1–§6 number above was derived at HEAD `9ffa2b80cc82fb3fe29e11354818d13f537e67b9` on
2026-08-18 with its command printed beside it; nothing was quoted forward from the brief,
`REQUIREMENTS.md`, or the P98 record without re-derivation, and where a re-derivation disagreed
with the record (37/27 → 42/29+30/23; 306/353 → 294-strict-335 / 345; "no chromium-ar project")
both numbers stand with their populations named. The five §7 decisions gate planning; #1 and #5
gate every AR-04b lane. The phase's single largest resourcing fact is §1.4: **372 distinct keys ×
2 locales of genuine authoring**, in a tree where EN and AR key sets are already structurally
identical — the work is writing strings, not reconciling structures.

RESEARCH-END
