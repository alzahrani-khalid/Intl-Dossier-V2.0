# Phase 98: Copy Truth - Context

**Gathered:** 2026-08-18
**Status:** Ready for planning
**Source:** `RULING-P98A2-01-SCOPE` (`.tickmarkr/overseer/RULING-P98A2-01-SCOPE.md`) + the digest
repair it ships with, commit `98824ca77`. **No `/gsd:discuss-phase` ran for this phase.** Every
decision below was made by the OVERSEER in that ruling under the operator's standing delegation, or
is transcribed from committed text; none was made by a planning seat and none by the orchestrator.
Where this file says "derive", it means the planner derives — it does not mean a number below is
already true.

<domain>

## Phase Boundary

The UI speaks to users, not to developers — one vocabulary, one date format, the project's own
voice. **Eight requirements** (`COPY-01`…`COPY-08`, register rows 742–749 at HEAD `98824ca77`;
definitions at `REQUIREMENTS.md:149-183`) against **seven success criteria**
(`ROADMAP.md` §Phase 98). The ROADMAP requirement line and the register **agree at this HEAD** —
they did not before `98824ca77`, and the derivation still runs by command and states the match
rather than assuming it.

**This phase is judged on rendered surfaces.** Copy that cannot be observed is not done copy
(`RULING-P98A2-01-SCOPE` F3 basis 1).

**OUT of this phase (named, not assumed):**

- **`GUIDE-HOLLOW-01` → Phase 102.** The `typeGuide.{type}.*` body is hollow for all eight dossier
  types. Phase 98 fills **Elected Officials only**, via `COPY-08`. After this phase EO is the only
  type with a full guide body; the seven siblings render header + description only. **That
  asymmetry is the tracked state, not a defect of this phase** — a plan that "fixes" the other
  seven is out of scope (net-new domain content authoring, 7 × 4 × 2).
- **Per-mutation success copy.** Criterion 6 ends at generic-but-localized. Rewriting every mutation
  call site to carry specific copy is explicitly NOT required (`RULING-P98A2-01-SCOPE` F1-b, scope
  set aside and stated).
- **`NAV-01` is NOT edited by any plan.** It is a Phase 97 row, `Complete (BOUNDED)` on exactly the
  `COPY-08` handoff. Its status cell gets a dated note at close-out by the overseer if criterion 7
  goes green. A planning or execution seat that edits a Phase 97 register row is a REJECT.
- **Arabic naturalness and pixel RTL → Phase 99** (`AR-01..04`). Phase 98 lands keys in **both**
  locales because that is what "renders in both locales" requires; it does not judge whether the
  Arabic reads naturally, and it does not own the glossary.
- **Phase 99 `AR-04a` interaction, stated:** removing `t()` English-default masks is P99's. Where
  Phase 98 touches a silent-default call site (`DossierTypeGuide.tsx:162,165`), it records the
  interaction; it does not pre-empt P99's sweep.

**Working-tree paths that stay out of every plan's file scope** (exogenous, harness-owned):
`CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`, `.claude/skills/*`, and
`.planning/phases/_archive-98-attempt1-260818/`. Never edit, commit, revert, or list them.

</domain>

<decisions>

## Implementation Decisions

Numbering restarts per phase. Every row below cites the ruling or committed text. **No decision
here was made by this orchestrator.** Acceptance-semantics questions that arise during planning go
to the overseer — a seat that resolves one correctly has still failed.

### Scope and requirement mapping

- **D-01: The phase closes 8 requirements** — `COPY-01`…`COPY-08`, each mapped in plan frontmatter
  to the success criterion it serves, re-derivable by command against the register
  (`.planning/REQUIREMENTS.md` rows 742–749; definitions 149–183). A silent drop of any requirement
  is a REJECT. Source: `RULING-P98A2-01-SCOPE` F1-a, F2.
- **D-02: The register is the queue; the ROADMAP entry is its digest.** They agree at
  `98824ca77`. The plan re-derives the mapping by command and states the match — it does not assume
  it. Source: `RULING-P98A2-01-SCOPE` F1-a; the digest-repair note in `ROADMAP.md` §Phase 98.
- **D-03: Out-of-phase surfaces are named, not assumed** — the OUT list in the Phase Boundary above
  is the record. Source: `RULING-P98A2-01-SCOPE` F3 bound; `97-CLOSING-DERIVATION.md:227`.

### Populations — the binding method (pre-commitment 1)

- **D-04: Populations are RE-DERIVED, never re-quoted.** Only `COPY-03` carries `[V]`
  ("independently re-verified against source or the live database", `REQUIREMENTS.md:8`). Every
  other number the criteria quote — **46** exclamation marks, **8** first-person-plural strings,
  **seven** competing date formats, the **five** `entityLinks.*` keys, the **four**
  `dashboard-widgets.json` strings' siblings — is an **unverified audit figure**. Each plan states
  its population definition, runs the derivation, and lets the count fall out. **A plan that quotes
  an old count as truth fails grading.** Source: `RULING-P98A2-01-SCOPE` pre-commitment 1.
- **D-05: State what falls OUTSIDE each population.** A correct command returns a correct number
  about the wrong set. Every derivation names its exclusions (which namespaces, which file globs,
  which locales, whether inline defaults and non-`t()` literals are in or out).
- **D-06: The repo `grep` wrapper honors `.gitignore`** — recursive sweeps are blind to
  `.tickmarkr/` and friends. Instrument-test every zero: a sweep that returns 0 proves nothing until
  the same instrument is shown returning non-zero on a known-present case.

### Oracles — the binding method (pre-commitment 2)

- **D-07: Every criterion closes on a rendered surface or a drilled instrument — never a
  source-text grep alone**, and every green states its **locale** and its **role**. A grep may
  _find_ a defect; it may not _close_ a criterion. Source: `RULING-P98A2-01-SCOPE`
  pre-commitment 2.
- **D-08: A criterion no oracle names fails grading.** Seven criteria; each needs a named oracle in
  the plan set. Source: `RULING-P98A2-01-SCOPE` pre-commitment 3.
- **D-09: Playwright spec paths are FILTERS** — two or more paths with at least one match silently
  drops the rest and exits 0. Assert file existence first; hardcode the expected count, never derive
  it from the list you just passed.
- **D-10: i18n reality.** Translations are **static-bundled** in `frontend/src/i18n/index.ts`;
  `public/locales` is dead — editing it changes nothing. An unregistered namespace falls back to its
  inline English default in **both** languages. Dot-form `t()` leaks raw keys; **colon namespaces**
  are correct. Any new namespace lands registered, in both locales, in the same commit.

### Per-criterion decisions carried by the ruling

- **D-11 (criterion 6, `COPY-06`): the default mutation success toast is produced via `t()` and
  renders localized in both locales on a real mutation** — the hardcoded
  `toast.success('Operation completed successfully')` at `frontend/src/lib/query-client.ts` is gone.
  **Generic-but-localized is the accepted end state.** Criterion 2 (raw keys) and criterion 4 (voice)
  do NOT cover this — the defect is _unlocalized and unspecific_, which neither names; that is why it
  has its own criterion. Source: `RULING-P98A2-01-SCOPE` F1-b.
- **D-12 (criterion 7, `COPY-08`): the five EO keys and the render guard land in the SAME change or
  not at all.** Author `dossier:typeDescription.elected_official` +
  `dossier:typeGuide.elected_official.{whenToUse,examples,commonLinks,notFor}` in **both** locales
  AND delete the `type !== 'elected_official' &&` guard in `DossierTypeStatsCard.tsx`. Atomicity is
  proven, not assumed: guard-without-keys prints the raw key on screen (observed live, recorded at
  `DossierTypeStatsCard.tsx:161-164`; `DossierTypeGuide.tsx:175,208` call `t()` with no default);
  keys-without-guard are dead bytes with no rendered surface. Closes on the **rendered popover** —
  header, description, and all four sections resolved, no raw key, no empty section, both locales.
  Source: `RULING-P98A2-01-SCOPE` F3 (Reading B, bounded).
- **D-13 (criterion 1, `COPY-07`): the hardcoded English `"% of total active dossiers"` in
  `DossierTypeStatsCard.tsx` is routed through `t()` and closes on the rendered card in both
  locales.** **The string is the anchor, not the line number** — the residue table said `:229`, the
  ruling verified `:228`; the file's comments move. Source: `RULING-P98A2-01-SCOPE` F2-a.
- **D-14 (criterion 4, named instance): `elected-officials:list.add` = `"Add Elected Official"`** is
  Title Case in `en` (`ar` is fine) and sits inside `COPY-04`'s sentence-case population by
  definition. It is named in criterion 4 so it has a line to object to; it gets **no register row of
  its own** — a row per single string is queue noise. Source: `RULING-P98A2-01-SCOPE` F2-c.

### Acceptance semantics — `RULING-P98A2-02`, criteria text repaired at `7b9d5348f`

Five readings that were genuinely ambiguous went up and came back ruled. **Read the criteria at HEAD
`7b9d5348f`** — criteria 2, 4 and 5 were rewritten by that commit; the pre-repair text is stale.

- **D-20 (criterion 4, Q1 — sentence case is BOUNDED).** The clause closes on (a) the named instance
  `elected-officials:list.add`, and (b) **every label the phase's oracle set captures on the surfaces
  it visits** — buttons, nav labels, page titles, tab labels, section/empty-state headings. **The
  plan's spec set defines "visited"; the oracle's captured set defines "label."** A surface this
  phase drives may not ship a Title Case label; copy no oracle renders is out. The ~4.5k-string long
  tail is **`COPY-09`, owner Phase 102** (register row 181; status row 761) — filed, not absorbed and
  not dropped. Derived magnitude: 4,471 (researcher) / 4,562 (orchestrator), two independently
  written instruments. **Criterion 4's other three clauses close in FULL**, on derived populations.
- **D-21 (criterion 4 — the derived exclamation count governs).** **31 EN / 30 AR**, not the audit's 46. Both instruments agree exactly. Grading uses the derived figure (pre-commitment 1). First-person
  plural is still to be re-derived — the register's "8" is unverified.
- **D-22 (criterion 2, Q2 — the `calendar.recurrence` instance is REAL; the repair is ROUTING).**
  `RecurrencePatternEditor.tsx:328` calls `t('calendar.recurrence.title')` against a namespace-less
  `useTranslation()` at `:176`, so lookups resolve into `common`, whose `calendar` subtree holds only
  weekday abbreviations — **16 dot-form `calendar.recurrence.*` call sites in that one file render
  their raw keys.** The content already exists under the `calendar` namespace (`calendar.json` →
  `recurrence.title`, `recurrence.summaryText.*`), reachable colon-form only. **One file, mechanical,
  no key authoring, and no wider backend/`public/locales` hunt is owed.**
  **Cautionary note, recorded because it cost a wrong escalation:** the orchestrator reported this
  instance ABSENT on an uppercase byte-grep for `CALENDAR.RECURRENCE` (0 hits) with a working
  positive control. The control proved the instrument _ran_; it did not prove the _population_ was
  defined right. The lowercase family has 43 hits. **A correct command can return a correct number
  about the wrong set** — always ask what falls outside the set you just searched.
- **D-23 (criterion 2, binding generalization): every named instance is a CLASS, never a string.**
  The plan sweeps dot-form-vs-namespace misses as a derived population, not just the strings the
  criterion happens to name.
- **D-24 (criterion 2, Q3 — the whole `entityLinks` namespace resolves).** **82 keys across 8 files,
  zero bundle coverage in either locale** — register the namespace and author all 82, both locales.
  This is **not** the `GUIDE-HOLLOW` class and the distinction is load-bearing: `typeGuide.*` has
  silent defaults and renders nothing, holds domain prose, and is named by no criterion;
  `entityLinks.*` has **no defaults, renders raw keys on screen**, holds short mechanical UI labels,
  and is criterion 2's exact subject. **Oracle closes on driveable rendered surfaces** — the plan
  derives which of the 8 files' surfaces can be driven and asserts no raw `entityLinks.*` key renders
  there; the 82/82 census is the instrument **backstop, not the closure**. **Any surface the oracle
  set cannot drive closes on census + a named UNDRIVEN scope line — never silently.**
- **D-25 (criterion 5, Q4 — population boundings).** Relative time is **SANCTIONED on feed/timeline
  recency surfaces ONLY**, through **one shared localized helper living in the formatter module**;
  **the plan enumerates the feed surfaces and that enumeration is graded.** Every other
  `formatDistanceToNow` site (21 files, derived) migrates to `formatDayFirst` / `formatTime`, so
  `9 months ago` as a hardcoded English pattern disappears everywhere. **`MMMM yyyy` calendar-grid
  month headers are navigation chrome, OUT of this population** — their Arabic rides `AR-02`/Phase 99.
- **D-26 (criterion 5, Q5 — the dev-affordance string leaves the BUILD).** "Absent from a production
  build" means the built bundle does not contain it. Delete `intake:fillMock` (`intake.json:86`, both
  locales), inline the label inside the DEV-gated block, and **grep the BUILT bundle with a positive
  control** (a string that must be present). Same treatment for any sibling dev-affordance string the
  derived population turns up. Rationale: one key's deletion buys a provable oracle; the weaker
  reading closes on a claim no instrument can distinguish from the gate never having run.

### Glyph coherence on the criterion-7 surface — `RULING-P98A2-03`, criterion 7 amended at `b5ba2ac37`

- **D-27: the EO popover's icon and colors are IN scope, inside `COPY-08`'s atomic unit.** Deleting
  the guard makes `DossierTypeGuide.tsx` render for a ninth case whose switches have no arm for it:
  `getTypeIcon`'s `default:` (`:78`) returns **`<Globe/>` — the country glyph** — and
  `getTypeColors`'s default (`:136`) is **muted**, while `DossierTypeStatsCard.tsx:95` maps EO to
  `<Crown/>`. Un-amended, criterion 7 was satisfiable with the wrong glyph. Therefore, in the same
  change:
  - `getTypeIcon` gains `case 'elected_official': return <Crown {...iconProps} />` (+ the import).
  - `getTypeColors` gains `case 'elected_official'` returning the **country/primary** set, with a
    comment citing **WR-07** — verified on disk: `semantic-colors.ts:84` is
    `dossierTypeColors[type] ?? dossierTypeColors.country!`, and `elected_official` appears **0
    times** in that map, so country/primary IS the canonical fallback for EO today. Popover == card
    == canonical fallback. ~6 lines, one file the phase already edits.
  - **Grading: a criterion-7 green with a Globe or a muted popover is a FAIL.**
- **D-28: allocating EO its OWN color family is OUT, explicitly.** The seven semantic families are
  exhausted by seven types; an eighth is a design-system decision (D-07 collision rules) — a visual
  call adjacent to the operator's parks, with zero copy content. **No-ship, named, with its
  condition:** revisit if/when a designer allocates an eighth family.
- **D-29: no new register row for the glyph fix, and none is to be invented.** Option B was
  **REFUSED**: a residue row for a ~6-line coherence fix inside a file the phase already edits is
  queue noise — **the row mechanism is for work that LEAVES the phase, not work that fits inside
  it.** The plan's shape is unchanged; there is no filing task. Separately, the guide's local color
  switch duplicating the canonical map is **pre-existing drift** (its muted default vs WR-07's
  country fallback is the proof) — refactoring it onto `dossierTypeColors` is **NOT this phase's
  diff**; it is queued as one line on `GUIDE-HOLLOW-01`, which P102 already owns for this component.
- **D-30: the UI-SPEC's prescribed literals are RATIFIED as written** — toast EN `Changes saved`,
  CTA `Add elected official`. Final copy is graded against the voice rules, the plan authors the
  `ar` equivalents, and **the operator's Arabic-naturalness park stands over ALL `ar` copy — it is a
  review debt, not a blocker.**

### House rules

- **D-15: Task file-scope caps carry from P88/P89** — roughly ≤10 files and ≤120 lines per task diff
  where feasible. Source: `RULING-P98A2-01-SCOPE` pre-commitment 3.
- **D-16: Both locales, same commit.** Any key added, renamed, or removed lands in `en` and `ar`
  together. A one-locale commit is a REJECT [inherited — P93 D-04, P94 D-10, P97 D-03].
- **D-17: Never write file content through a shell-embedded `node -e` string** (zsh backtick
  substitution corrupts it). Use editor tools.
- **D-18: Absolute paths in every command.** Shell cwd drifts between calls; two P96 defects came
  from exactly this.
- **D-19: The workspace package is `intake-frontend`.** `pnpm --filter frontend` matches ZERO
  projects and **exits 0** — a gate built on it is green-by-vacuum. The typecheck script is
  `type-check`, not `typecheck`.

### Claude's Discretion

Left to the planner and RESEARCH, explicitly not decided here: the mechanism for each repair (label
map vs namespace key for `COPY-01`; how dev affordances are gated out of a production build for
`COPY-05`); task decomposition and wave structure; which surfaces are drilled and how; the shape of
each population's derivation command. **Not discretion:** anything the ruling decided (D-11 … D-14)
and anything in the OUT list.

</decisions>

<canonical_refs>

## Canonical References

### Phase contract and inputs

- `.planning/ROADMAP.md` §Phase 98 — the seven criteria and the eight-id requirement line, repaired
  at `98824ca77`. **Read at HEAD, not from memory of the five-id version.**
- `.planning/REQUIREMENTS.md:149-183` (definitions) and rows 742–749 (ownership) — the queue.
- `.tickmarkr/overseer/RULING-P98A2-01-SCOPE.md` — the scope ruling and its four grading
  pre-commitments.

### Upstream handoffs this phase inherits

- `.planning/phases/97-reachability/97-CLOSING-DERIVATION.md:227` — the deliberately-not-covered
  table naming Phase 98 as owner.
- `.planning/phases/97-reachability/97-05-SUMMARY.md:101-112` — the EO popover withhold and the
  "whole repair" sentence; the `DossierTypeStatsCard` hardcoded-English observation.
- `.planning/REQUIREMENTS.md` `COPY-06` body — the `RULING-P94-01` order-3 provenance.

### Design truth (UI work — the ROADMAP marks this phase **UI hint: yes**)

- `frontend/DESIGN.md` — the Linear spec (token tables, type, radii, recipes).
- `frontend/src/design-system/CLAUDE.md` — the runtime token engine.
- Project copy law, `CLAUDE.md` §Design rules: **no emoji in user-visible copy; no marketing voice**
  (banned: "Discover", "Easily", "Unleash", exclamation marks, "you're in!", first-person plural);
  **sentence case** for titles and buttons, UPPERCASE only for classification ribbons, mono labels
  and table-column headers; dates `Tue 28 Apr` (day-first, no comma), times `14:30 GST`, SLA windows
  `T-3` / `T+2`. Criteria 4 and 5 are this text made checkable.
- `CLAUDE.md` §Work Management Terminology — the unified glossary (`Work Item`, `Assignee`,
  `Deadline`, `Priority` with `urgent` not `critical`) **and its source-specific carve-outs**:
  `intake_tickets.urgency` legitimately uses `critical`; `aa_commitments` uses `due_date` /
  `owner_*`; `tasks` uses `sla_deadline` / `workflow_stage`. Criterion 1 maps DB values to display
  labels — it does **not** rename columns, and the carve-outs are correct as they stand.

### Out-of-phase owners (do not repair)

`GUIDE-HOLLOW-01` → P102 · `AR-01..04` → P99 · RLS/residue → P100 · CI, `E2ECRED-01`,
`ROOTALIAS-01` → P101.

</canonical_refs>

<code_context>

## Existing Code Insights

### Anchored evidence — verified on disk 2026-08-18 at HEAD `98824ca77`

Cite these; do not spend research budget rediscovering them. **Every count is still to be derived —
nothing below asserts a population size.**

- `frontend/src/lib/query-client.ts` — exists; carries the TanStack Query `mutations.onSuccess`
  default that criterion 6 targets.
- `frontend/src/components/dossier/DossierTypeStatsCard.tsx` — exists; carries **both** `COPY-07`
  (the hardcoded `"% of total active dossiers"`) and the `COPY-08` render guard. Two criteria touch
  one file: plan the task boundaries so they do not collide.
- `frontend/src/components/dossier/DossierTypeGuide.tsx` — exists; the popover body. Looks up
  `typeGuide.${type}.*` with silent defaults, guarded by `Array.isArray` / `length > 0`, which is
  **why a raw-key detector returns clean over a hollow guide**. A criterion-2 instrument that only
  greps for raw keys cannot see this class.
- `frontend/src/i18n/index.ts` — the static `resources` registry. Both locale trees exist for the
  namespaces this phase touches: `dossier.json`, `elected-officials.json`, `dashboard-widgets.json`
  in `frontend/src/i18n/en/` and `frontend/src/i18n/ar/`.
- **The one shared date formatter already exists:** `frontend/src/lib/format-date.ts` exports
  `formatDayFirst`, `formatTime`, `formatDayFirstYear`, `formatDateTime` — i.e. criterion 5's
  `Tue 28 Apr` / `14:30 GST` contract has a home. `frontend/src/lib/format-locale.ts` is a
  locale-tag helper (`toFormatLocale`), **not** a competing formatter; `frontend/src/lib/date/`
  holds only `getISOWeek.ts`. So criterion 5 is a **routing** problem — move surfaces onto the
  existing formatter — not a "build a formatter" problem. Confirm before planning around it.

### Established patterns

- Colon-namespace `t()` calls; both-locale same-commit key changes; display-label maps rather than
  raw DB enum rendering.
- Arabic digits: `Intl.NumberFormat('ar')` yields Latin digits by deliberate policy — go through
  `lib/format-locale`, and do not "fix" Latin digits in Arabic.

### Integration points

Criterion 1 touches every surface that renders a status / source / tracking-type enum; criterion 5
touches every surface that renders a date or time; criterion 6 touches one app-wide handler whose
blast radius is every mutation. **Blast radius is the reason `COPY-06` waited for a phase whose
oracles span the app** — plan its verification accordingly.

</code_context>

<specifics>

## Specific Ideas

- Two criteria (1 and 7) and two requirements (`COPY-07`, `COPY-08`) land in the same file,
  `DossierTypeStatsCard.tsx`. Sequence or merge them deliberately; do not let two tasks edit it in
  parallel.
- `COPY-08` is the only criterion that re-opens a surface Phase 97 deliberately closed. Its oracle
  is a rendered popover in both locales — the one place in this phase where a render assertion, not
  a string assertion, is the whole proof.
- Criterion 5's "dev affordances absent from a production build" ("Fill with Mock Data") is a
  build-output claim, not a source claim — its oracle has to look at a production build.

</specifics>

<deferred>

## Deferred Ideas

- Per-mutation success copy (beyond generic-but-localized) — future feature work, `RULING-P98A2-01-SCOPE` F1-b.
- The seven sibling types' guide bodies — `GUIDE-HOLLOW-01`, Phase 102.
- Arabic naturalness, the single-term glossary, pixel RTL — Phase 99.

</deferred>
