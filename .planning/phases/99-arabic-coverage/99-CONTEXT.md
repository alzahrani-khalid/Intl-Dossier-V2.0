# Phase 99: Arabic Coverage - Context

**Gathered:** 2026-08-18
**Status:** Awaiting overseer confirmation — **not yet released to the planner**
**Source:** `RULING-P99-01`, `RULING-P99-02`, `RULING-P99-03` (`.tickmarkr/overseer/`), assembled by
the orchestrator from `99-RESEARCH.md` at sha1 `200c4d1ef34e8fccd7136c829be0e1743b671dc3`
(`RESEARCH-END`, hash re-verified stable). **No `/gsd:discuss-phase` ran.** Every decision below
was ruled by the OVERSEER, or is transcribed from committed text, or is a derived fact with its
command on record. **None was made by a planning seat.** Where this file says "derive", the
planner derives — it does not mean a number below is already true.

<domain>

## Phase Boundary

An Arabic session reads as Arabic: one glossary, localized dates, no English leakage. **Four
requirements** (`AR-01`…`AR-04`, `REQUIREMENTS.md:275-400`) against **four success criteria**
(`ROADMAP.md` §Phase 99, lines 584-597). RTL _layout_ infrastructure is verified sound and is
explicitly OUT — this phase is about what the words say, not where they sit.

`AR-04` is **two independent fixes with separate acceptance** and they must not be collapsed:
`AR-04a` removes the English-default MASK; `AR-04b` fixes namespace RESOLUTION. Neither implies
the other — `t('common:logout', 'Logout')` is fully colon-form and still renders "Logout" when the
key misses.

**IN:** the Arabic glossary sweep and the nav-label↔page-title agreement; Arabic date/time
rendering; the English-under-`dir="rtl"` surfaces; the mask population; the resolution tail; the
`common.json` structural flatten.

**OUT, named rather than assumed:** RTL layout/pixel work; Arabic _naturalness_ review beyond the
ruled glossary (operator's); the ~7,086-site wholesale dot→colon conversion (**D-21**); the
`COPY-09` hardcoded-literal members already owned by Phase 102 (`HelpPage:166`,
`useBriefingBooks:164-165`, `PositionTrackerCard:93`); `EDGECOPY-01`'s two edge functions;
`GUIDE-HOLLOW-01`'s seven hollow guide bodies.

**Executor:** the tickmarkr ENGINE, per operator order OPORD98. The GSD planning layer is
unchanged; `tickmarkr compile` ingests this plan set. A plan that does not compile is not a plan
(**D-30**, and `.tickmarkr/overseer/P99-COMPILE-CONTRACT.md`, binding per `RULING-P99-02` §1).

</domain>

## Implementation Decisions

<decisions>

### Scope and requirement mapping

- **D-01: The phase closes four requirements** — `AR-01`, `AR-02`, `AR-03`, `AR-04` (whose `a` and
  `b` halves carry separate acceptance and must be mapped separately in plan frontmatter). Every
  plan names its requirement ids in `requirements:`.
- **D-02: Four success criteria, and a criterion no oracle names fails grading.** Criterion 1 =
  glossary + nav↔title (AR-01); 2 = Arabic dates/times (AR-02); 3 = no English under `dir="rtl"`
  (AR-03); 4 = no `t()` resolving through a dot-form key with an English default (AR-04a is _"the
  clause that closes criterion 4"_ per the requirement's own text).
- **D-03: Exogenous paths are untouchable** — `CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`,
  `.agents/skills/*`, `.claude/skills/*`, `.planning/phases/_archive-98-attempt1-260818/`. They
  appear in no `files_modified`, no plan-body write directive, and no commit.

### Method — populations and instruments (carried from Phase 98; still binding)

- **D-04: Populations are RE-DERIVED, never re-quoted.** Every figure in this file and in
  `99-RESEARCH.md` is stale by construction. Print the command, print the number, state the sha.
- **D-05: State what falls OUTSIDE each population.** A correct command returns a correct number
  about the wrong set. Phase 98's single transferable finding was a nine-dimension
  population-definition failure; it is not to be re-earned.
- **D-06: The repo `grep` wrapper honours `.gitignore`** and is blind to ignored trees.
  Instrument-test every zero: pair each "0 found" with a positive control that finds something.
- **D-07: Every criterion closes on a RENDERED surface or a drilled instrument** — never on a
  source-text grep alone, and never phrased as an absence over whole build output.
- **D-08: Every `command:` oracle is proven RED against the UNFIXED tree before the plan ships.**
  An oracle that passes with the work undone is vacuous.
- **D-09: Playwright spec paths are FILTERS** — two or more paths with at least one match silently
  drops the rest and exits 0. Assert file existence; hardcode the expected count; never derive it
  from the list just passed.
- **D-10: i18n reality, corrected at HEAD.** Translations are **static-bundled** in
  `frontend/src/i18n/index.ts`; `public/locales` is dead. **That init declares NO `fallbackNS` and
  NO `defaultNS`** (verified independently by the orchestrator and the research seat — neither key
  appears anywhere in the file), so real i18next **never consults `common` for a `t` bound by
  `useTranslation('ns')`**. The built-in `translation` namespace is aliased to `common` at
  `index.ts:274/410`.
- **D-11: An exemplar idiom must RESOLVE, not merely exist in JSON.** `TaskCard.tsx:51/54/58` is
  the recorded counter-example — a Phase 98 plan cited it as the correct enum-keyed `t()` idiom
  while all three routings MISS through ns `translation`, re-verified at HEAD. `t('priority.low')`
  bound to ns `assignments` resolves and is the correct near-neighbour.

### The `common.json` structural call — `RULING-P99-03` #1

- **D-12: FLATTEN.** The nested duplicate subtree literally named `common` (38 top-level keys, 0
  top-level scalars, 56 keys / 67 leaves, both locales) is merged into the namespace root.
  **CORRECTED 2026-08-18 (`RULING-P99-06`, checker B B-01): the original sentence here claimed
  "proven collision-free — 0 overwrites". That was FALSE — the check compared child key sets,
  which a scalar trivially satisfies. TWO TYPE CLASHES exist in both locales: nested
  `common.error` (scalar "Error"/"خطأ") vs root `error` (OBJECT, 2 leaves) and nested
  `common.search` (scalar "Search"/"بحث") vs root `search` (OBJECT, 10 leaves). A naive merge in
  either direction destroys live copy. RULED REPAIR: relocate the scalars to `error.label` /
  `search.label` (target verified absent, both locales) and repoint their 13 dot-form consumers
  (5 `common.error`, 8 `common.search` — the 404 surface rides `common.search`) in the SAME
  atomic commit as the flatten. The 99-02 collision oracle is TYPE-AWARE with a scalar-vs-object
  positive control.** The other 54 nested keys move clean; AR's 12 extra leaves ride along
  untouched.
- **D-13: The flatten is ONE ATOMIC ENGINE TASK.** Both locales' `common.json` **plus** the
  `common.X`→`common:X` rewrite land in ONE commit. Its `command:` oracle runs the COMMITTED
  resolution harness `scripts/resolve-check.mjs` **before AND after in the same gate**, plus
  `scripts/neg-taskcard.mjs` — **run the negative control or the harness is unfalsifiable.**
  Re-derive the rewrite set at plan time (research measured 120 sites / 45 distinct / 46 files
  resolving through the subtree today).
- **D-14: MANDATORY SEQUENCING, absolute.** The flatten lands and is PROVEN before any dot→colon
  conversion of any kind runs anywhere in the phase. A sweep that runs first destroys up to 120
  working sites. This ordering lives in `depends_on`, not in prose.
- **D-15: UI99-C5's 404 repair is expressed relative to the POST-FLATTEN key shape.** The
  translated copy already exists at the nested path `common.notFound.{title,message,goBack,goHome}`
  in both locales, so the repair is a key REPOINT whose final shape rides D-12. **No plan hardcodes
  the pre-flatten shape.**

### The glossary — `RULING-P99-03` #2, the delegated product call

- **D-16: The queue-name collision is a DEFECT, not taste.** Intake queue and waiting queue both
  title themselves `قائمة الانتظار` today. Intake becomes **`قائمة الاستقبال`** (the nav already
  says it); waiting keeps `قائمة الانتظار`. Two surfaces sharing one Arabic name fails criterion
  1's own nav-label↔page-title clause.
- **D-17: dossier = `دوسيه`** for the OBJECT; `ملف` remains legal for files/profiles
  (`الملف الشخصي`, `مرفق ملف`). **The sweep is therefore SENSE-AWARE by construction, never
  mechanical** — a blanket `ملف`→`دوسيه` rewrite is the same destructive-conversion class as the
  nested-`common` inversion.
- **D-18: engagement = `مشاركة`** (the requirement text itself reads الارتباطات → المشاركات;
  `ارتباط`'s 173 uses are swept, and the participation/sharing ambiguity is an accepted, recorded
  cost). **brief = `ملخص`** for the ARTIFACT, `إحاطة` reserved for briefing SESSIONS, `موجز` swept
  — the artifact/session split is glossary law. **position-as-stance = `موقف`**, `منصب` reserved
  for office/post; the `تطوير المنصب` wrong-sense instance repairs to the `موقف` family.
- **D-19: The glossary rows are operator-reversible up to phase close** at a stated cost — a term
  swap is a mechanical leaf-rename plus a parity re-run. Plans keep term values in the i18n leaves,
  never inlined in code, so that cost stays true.

### AR-04b's acceptance semantics — `RULING-P99-03` #5

- **D-20: READING B — BEHAVIORAL.** What the phase must FIX is every `t()` site where the mask+dot
  conjunction or the unresolved tail makes a missing Arabic key render English or a raw key —
  the **strict-model** populations. Already-resolving dot-form keys inside their bound namespace
  are working code; converting them is churn with proven breakage risk and zero behavioral delta.
- **D-21: Reading A is NOT owed and is NOT silently dropped.** The remaining working dot-form tail
  (~7,086 site-matches, after subtracting the 900 sites both acceptance greps double-count) is a
  recorded **NO-SHIP-THIS-PHASE** with its condition: if the operator wants the convention landed
  wholesale, that is NEW SCOPE, queued explicitly (candidate: Phase 102's debt tail), sequenced
  after D-12's flatten, and instrumented by resolution checks.
- **D-22: The acceptance instrument goes STRICT, and the delta set is its positive control.**
  `scripts/i18n-mask-audit.mjs`'s namespace model is looser than the shipped app (D-10), so
  acceptance check (b) under-reports. The phase repairs it (or ships a strict variant beside it).
  **REQUIRED CONTROL: the strict instrument must FIND the 9 two-arg sites the loose
  model hides (that half stands) and, under the CORRECTED binding model of RULING-P99-20, a re-derived raw-key delta —
  **42 is RETRACTED: 39 of it was an artifact of the binding bug and no plan, oracle or summary may
  quote it.** The concrete control is that Topbar/IntelligencePage/PositionDossierLinker contribute
  ZERO rawKeyUnresolved. The loose
  model hides. An instrument that cannot see that delta is not strict** and its zero means nothing.
- **D-23: Direction of travel is preserved.** Every binding this phase TOUCHES — new keys,
  re-binds, repairs — lands in explicit **colon form**. The convention advances through every
  repaired site without churning working ones. **Clarification (overseer, 2026-08-18,
  `RULING-P99-05` §4): "touches" means a BINDING-LEVEL change — a new key, a re-bind, a
  resolution repair. Deleting a redundant second argument at a site whose resolution was just
  verified is NOT a binding change; the mask-drop stays deletion-only, and forcing colon form
  there would be D-21's wholesale conversion arriving early.**

### AR-04a — the mask, and the order that is the requirement

- **D-24: Acceptance is a CONJUNCTION and the order is FIXED.** (1) author the missing keys in `en`
  AND `ar`; (2) verify every referenced key resolves in both locales; (3) **only then** drop the
  second arguments. Running check (a) alone is **destructively satisfiable** — it converts the
  unresolved sites into raw-key renders in BOTH locales at once while passing the command. The
  order is a property of the DAG, not of a worker's good intentions.
- **D-25: Every missing key is missing in BOTH locales — there is no "EN exists / AR missing"
  class.** Verified twice independently: 129/129 namespace files per locale, 125 byte-identical
  leaf-key sets, 24 AR-extra leaves (assignments +4, `common` +12, tags +4, workspace +4), **zero
  EN-only leaves anywhere**. **Every authored key is authored twice.** This is a
  translation-authoring task; scoping it as a find-and-replace under-resources it by the whole
  authoring load (research floor: ~372 distinct keys × 2 locales, plus ~38 wrong-namespace
  re-binds — re-derive).
- **D-26: The 284 default-namespace keys SPLIT** (`RULING-P99-03` #3): re-bind the heavy files to
  their feature namespaces and author the keys there; the long tail authors into `common`. **The
  re-bind set is ENUMERATED by name in the plan** from `99-RESEARCH.md` §1.5's table, never carried
  as a bare count, and the count is re-derived at plan time.
- **D-27: The dynamic-prefix mask class is invisible to BOTH acceptance greps BY CONSTRUCTION** —
  AR-04a's matches literal second args only, AR-04b's matches dot-form literals only.
  `scripts/partA_maskfinder.py` is the instrument of record, run with `--control` first. Research
  re-derived 24 unresolved prefixes / 19 masking a raw value / 5 rendering a raw key, byte-identical
  to Phase 98 — this class has not moved, and it is enumerable by name.
- **D-28: Never cite a blended AR-04a/AR-04b figure.** The 306-vs-353 gap is fully explained by
  three population axes (call shape, file scope, namespace model) and neither number was wrong.
  Plans consume the raw-key class as AR-04b's population and the two-arg class as AR-04a's.

### AR-02 / AR-03 — rendered surfaces, and the UI contract

- **D-29: `99-RESEARCH.md` §5.5/§6.4 IS this phase's UI contract.** No `99-UI-SPEC.md` ships
  (`RULING-P99-01` §3 — a deliberate, recorded artifact-set delta, not a gap). Plans cite
  `UI99-C1`…`UI99-C11` the way Phase 98's plans cited `98-UI-SPEC.md §Cn`.
- **D-30: `GST` is ALLOWLISTED** (`RULING-P99-03` #4). `formatTime` emits `14:30 GST`; the project's
  own design spec mandates that format, and criterion 2 names weekday and month names, which `GST`
  is neither. It joins `UI99-C9`'s named allowlist, same class as the SLA `T±N` mono tokens.
  Revisit trigger: the operator's Arabic review objecting.
- **D-31: Latin digits are DELIBERATE POLICY.** An Arabic-Indic-digit formatter is a REGRESSION,
  not a fix (`UI99-C2` asserts zero `[٠-٩]`/`[۰-۹]` codepoints). The app's `ar-u-nu-latn` pinning is
  what keeps digits Latin — assert it, never assume it.
- **D-32: The four named criterion-3 surfaces split 2 MASK / 2 HARDCODED, and the mechanism decides
  the lane.** 404 page and intake queue header are AR-04a masks (authoring + repoint); the position
  read-only banner and the search suggestion chips are hardcoded English literals with no `t()` at
  all (extraction + authoring). **A plan that assigns all four to one mechanism mis-scopes two.**
- **D-33: The settle law binds every criterion-2/3 oracle** (`UI99-C11`): post-hydration data
  locator or the committed `settle()` sequence, **plus** `expectLocale` asserting
  `document.documentElement.lang`, plus the committed per-surface capture floor where one exists.
  _A capture is a SETTLED render — locale ASSERTED, never inherited._ `?lng=` does NOT survive the
  `/intake/queue`→`/my-work/intake` redirect. **There is no shared settle module** — the primitives
  live inside `98-copy04-voice.spec.ts:248-265`; a plan either import-copies them or hoists them.
  **Amendment (overseer, 2026-08-18, at confirmation):** FOUR divergent per-spec settle helpers
  exist (`95-search-renders`, `95-queue-renders`, `96-count-agreement`, `98-copy04-voice` — grep
  `const settle`); ONLY `98-copy04-voice`'s pair is law-conformant (settle + `expectLocale`,
  asserted locale). The 95/96 helpers are pre-law and mechanism-divergent — they are NOT the
  primitives this decision names, and an oracle that builds on or extends those specs still
  applies THIS decision's law itself.
- **D-34: Both locale legs run inside `chromium-en` via `?lng=` + `expectLocale`.** The root
  `playwright.config.ts:40-48` DOES define `chromium-ar-smoke`, but its `testMatch` confines it to
  the three specs under `tests/e2e/ar-smoke/`. Its `locale: 'ar-SA'` is the BROWSER locale — the
  Indic-digit-producing tag the date guard bans in app code — and those three specs predate the
  settle law. **This corrects Phase 98's close-out sentence "there is no `chromium-ar` project"**,
  which was right about P98's runs and wrong about the tree.
- **D-35: The AR-03 population is derived as CLASSES, not as a rendered census** — six are named in
  §6.2, of which the hardcoded-literal class is invisible to every committed instrument BY
  CONSTRUCTION and only a rendered Latin-run scan (`UI99-C9`) bounds it. Surfaces UNDRIVEN at HEAD
  are named, not assumed driven: the 404 route (no spec navigates a nonexistent route), the `ar`
  leg of the intake queue (`98-copy04` visits it `en`-only), the `/search` chips, and the position
  banner — which additionally carries a **DATA PRECONDITION** (a position in
  `under_review`/`approved`/`published` reachable by the admin login) that is not knowable without
  running the app.

### Engine execution — `RULING-P99-02`

- **D-36: Every plan lists its own `99-NN-SUMMARY.md` in `files_modified`**, or the set does not
  compile (`assertWriteScope` rejects the GSD template's own boilerplate). **This is an INTERIM
  operator-local workaround for an upstream product defect that is queued; its removal condition is
  that fix shipping.** No summary file exists before the run — a pre-existing summary compiles its
  task as `done` and the engine silently skips it.
- **D-37: Every `command:` oracle carries its own interpreter resolution inline.** The PATH pin in
  `gates:` does NOT reach a task's own oracles, and that pin currently names a deleted directory.
- **D-38: Human checkpoints are NEVER auto-answered.** Any plan needing a human product or visual
  sign-off sets `autonomous: false`. Deciding a release is the overseer's, in writing; executing
  `tickmarkr approve` afterwards is the orchestrator's. Over-gating is recoverable; under-gating is
  not.
- **D-39: Within a wave, plans are FILE-DISJOINT.** Where a file is genuinely contended
  (`common.json` will be), it gets ONE owner and the rest sequence behind it. One plan = one engine
  task = one full seven-gate battery: neither shatter the phase to look thorough, nor fuse
  unrelated work into a scope the gate will reject.

### Claude's Discretion

- Plan/wave count and lane boundaries, subject to D-39 and the sequencing in D-14.
- Which oracle file each criterion's assertions land in, subject to D-09 and D-33.
- Whether `settle`/`expectLocale` are hoisted into a shared helper or import-copied (D-33).
- The order of independent authoring lanes among themselves.

</decisions>

<deferred>

- The wholesale ~7,086-site dot→colon conversion — **D-21**, recorded NO-SHIP-THIS-PHASE with its
  condition; candidate home Phase 102.
- Arabic _naturalness_ review beyond the ruled glossary rows — operator's, `RULING-P99-03` #2.
- `COPY-09`'s three named hardcoded-literal members — Phase 102.
- `EDGECOPY-01` (two edge functions shipping now-relative bilingual copy) — Phase 102.
- `GUIDE-HOLLOW-01` (seven hollow dossier-type guide bodies) — Phase 102.
- The 39 criterion-1 members Phase 98 triaged by READING — Phase 103's re-sweep.

</deferred>
