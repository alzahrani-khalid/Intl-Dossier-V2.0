# Phase 98 — Plan Check A (independent pre-execution verification)

**Seat:** gsd-plan-checker (seat A) · **Tree:** `87b2d040e` · **Date:** 2026-08-18
**Scope read:** all nine plans (`98-01` … `98-09`), `98-CONTEXT.md`, `98-VALIDATION.md`,
`ROADMAP.md` §Phase 98 at HEAD, `REQUIREMENTS.md:145-192`, `CLAUDE.md`. `98-RESEARCH.md` and
`98-UI-SPEC.md` were consulted by reference through the plans, not read end to end — every
finding below is anchored to a plan line or to a command re-run against the tree, not to those
two documents.

## ISSUES FOUND

**Plans:** 9 · **Tasks:** 24 · **9 BLOCKING, 9 ADVISORY**

---

## Criterion → plan → oracle walk

| #   | Criterion                                | Plan          | Named oracle                                                                | Closes?                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------- | ------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No DB value renders as user copy         | 98-05         | `98-copy01-labels` (run in 98-05.t2)                                        | **NO** — gate runs before 98-05.t3 lands the week header (B9); repair targets a namespace that does not exist (B4)                                                                                                                                                                                                                                                                                            |
| 2   | No raw i18n key, either locale           | 98-04         | `98-copy02-rawkeys` (run in 98-04.t2)                                       | **NO** — gate runs before 98-04.t3 fixes regions (B8); recurrence class closes on grep only (B7); console leg is dead (B3); class-sweep finder cannot see the class (B6)                                                                                                                                                                                                                                      |
| 3   | No seed/test instruction ships           | 98-06         | `98-copy03-dashboard` (98-06.t1)                                            | YES — spec asserts byte-equality on CDP-forced empty/error states, both locales. Backstop gate's `ar` half is vacuous (A2)                                                                                                                                                                                                                                                                                    |
| 4   | Project voice                            | 98-06 + 98-08 | `98-copy04` `@values` (98-06.t3), `@case` (98-08.t2)                        | YES — exclamation floor 1/1 is reachable; the D-20 bound is recorded and graded in `98-CAPTURED-LABELS.md`                                                                                                                                                                                                                                                                                                    |
| 5   | One date format; dev string out of build | 98-02 + 98-07 | `98-copy05` + extended `check-date-formatting.mjs` + bundle grep (98-07.t3) | **PARTIAL** — routing and guard close; the bundle oracle cannot detect the failure it claims to (B5)                                                                                                                                                                                                                                                                                                          |
| 6   | Default mutation toast localized         | 98-04         | `98-copy06-toast` (98-04.t3)                                                | **NO** — drives a mutation on which the subject never fires (B2)                                                                                                                                                                                                                                                                                                                                              |
| 7   | EO popover complete + Crown/primary      | 98-03         | `98-copy08-eo-popover` (98-03.t1)                                           | YES — verified on disk: `getTypeIcon` default `<Globe/>` at `DossierTypeGuide.tsx:78`, `getTypeColors` default muted at `:136`, `country` = `bg-primary/10 / text-primary / border-primary/30`, header renders `getTypeIcon(type, cn('h-5 w-5', colors.text))`. `lucide-crown` + `text-primary` are satisfiable and discriminating (only `country` and, post-fix, EO carry `text-primary`; `person` is muted) |
| —   | COPY-07 stats card                       | 98-03         | `98-copy07-statscard` (98-03.t2)                                            | YES — the label renders unconditionally (`DossierTypeStatsCard.tsx:228`, outside the `percentage === null` branch), so the EO card is drivable; the `?lng=ar` leg is a real discriminator                                                                                                                                                                                                                     |

### What passed, stated so it is not re-derived

- Exogenous paths (`CLAUDE.md`, `AGENTS.md`, `tickmarkr.spec.md`, `.agents/skills/*`,
  `.claude/skills/*`, `_archive-98-attempt1-260818/`) appear in **no** plan's `files_modified` —
  only as prose citations in 98-01, 98-03, 98-05, 98-08.
- No same-wave file collisions. `DossierTypeStatsCard.tsx` has one owner (98-03), `common.json`
  one owner (98-04). Wave/`depends_on` graph acyclic and consistent (waves 1→6).
- `formatDistanceToNow`/`formatDistance(` population re-derived = **21 files**, exactly 98-07's
  6 sanctioned + 15 migrate.
- Exclamation population re-derived = **31 EN / 30 AR** across 17 files — matches D-21 exactly.
  The 1/1 floor is reachable because the only banned-file member (`common.json`
  `auth.loginSuccess` = `Login successful!`) is repaired upstream in 98-04; `dossier.json`,
  `signals`-family, and `engagements.json` carry zero.
- All six `"Due Date"` / `Deadline / Due Date` en-bundle files are owned: calendar, commitments,
  meeting-minutes, working-groups → 98-06; dossier (`:962`) → 98-03; common (`:712`) → 98-04.
- All 37 distinct static `calendar:recurrence.*` paths resolve in **both** locales, so D-22's
  "routing, not key authoring" holds. (The count does not — see B1.)
- 98-09's register-row assertions match HEAD: `^| COPY-09 | Phase 102`, and NAV-01's row reads
  `Complete (BOUNDED …`. `.planning/REQUIREMENTS.md` is declared by exactly one plan.
- Task caps: 22 of 24 tasks are within D-15. 98-07.t2 is 16 files with the deviation stated and
  caused (`98-07-PLAN.md:39`).

---

## BLOCKING

### B1 — the recurrence gate is mutually unsatisfiable; 16 is a re-quoted figure

- **Plan:** `98-04-PLAN.md:230` (also `:18`, `:199`, `:232`)
- **Breaks:** D-04 (populations RE-DERIVED, never re-quoted) — pre-commitment 1
- The gate asserts `grep -c "calendar\.recurrence\." == 0` **and**
  `grep -o "calendar:recurrence\." | wc -l == 16`. Re-derived at HEAD: **43** occurrences —
  41 single-quoted `t('calendar.recurrence.…')` plus 2 template-literal forms
  (`daysOfWeek.${dayKey}` at `RecurrencePatternEditor.tsx:458`, `monthly.positions.${pos}` at
  `:525`) — across 37 distinct paths. Flip all 43 and the `-eq 16` clause fails; leave 27 and the
  zero clause fails. `:232` defends the constant: _"16 is reachable because the 16 sites were
  verified by ruling (D-22)"_ — the exact re-quote D-04 forbids, while `98-CONTEXT.md:156` states
  in the same breath that "the lowercase family has 43 hits."
- **Fix:** derive the count at execution, hardcode the derived value, state the delta.

### B2 — criterion 6's oracle drives a mutation that cannot fire the subject

- **Plan:** `98-01-PLAN.md:84-88` (the `<interfaces>` claim), consumed by `98-04-PLAN.md:230`
- **Breaks:** D-11 (the toast renders localized **on a real mutation**), D-07
- The plan states as "Verified on disk 2026-08-18": _"`useCreateEntityLink` (~:56) and the delete
  mutation (~:235) both lack their own `onSuccess`."_ On disk: `useCreateEntityLink` **has**
  `onSuccess` at `frontend/src/hooks/useEntityLinks.ts:123` (a shadcn `toast()`, not sonner);
  `useDeleteEntityLink` begins at `:140` and **has** `onSuccess` at `:181`; `:235` is
  `useReorderEntityLinks`, not delete. TanStack Query shallow-merges
  (`node_modules/@tanstack/query-core/build/modern/queryClient.js:289-292` —
  `...defaultOptions.mutations, ...options`), so a per-mutation `onSuccess` **overrides** the
  global default. The PRIMARY oracle therefore never produces a `[data-sonner-toast]` and
  98-04.t3's gate is red forever.
- The plan's own FALLBACK is the correct oracle: `useUnifiedKanbanStatusUpdate`
  (`frontend/src/hooks/useUnifiedKanban.ts:388`) carries `onError` at `:547` and **no**
  `onSuccess`.
- **Fix:** promote the kanban stage move to PRIMARY (respecting the `aa_commitments` no-`review`
  hazard the plan already names).

### B3 — the copy02 console-capture leg is dead code

- **Plan:** `98-01-PLAN.md:72-73` (interfaces), `:123` (the leg), `:33` (the must-have token)
- **Breaks:** D-06 (instrument-test every zero), D-07
- `frontend/src/i18n/index.ts` sets **`saveMissing: false`**, and i18next invokes
  `missingKeyHandler` only inside `if (this.options.saveMissing)`
  (`node_modules/i18next/dist/cjs/i18next.js:691-704`). The `Missing translation key: …` warn can
  never fire, so "assert zero missing-key warnings in BOTH locale legs" passes vacuously at HEAD
  and forever — the green-by-vacuum class this phase exists to prevent. Secondary: the handler
  body reads `process.env.NODE_ENV`, undefined in browser app code, so it is dead twice over.
  `frontend/src/i18n/index.ts` is in **no** plan's `files_modified`.
- **Fix:** enable `saveMissing` dev-only with `i18n/index.ts` in scope, or delete leg (a) and
  state the loss in the spec header.

### B4 — `signals.json` does not exist and the namespace is not registered

- **Plan:** `98-05-PLAN.md:13-14` (frontmatter), `:30-32`, `:38-40`, `:100`, `:112`, `:125-126`
  (the gate hardcodes the path)
- **Breaks:** D-10 (an unregistered namespace falls back to its inline English default in BOTH
  languages), D-16
- Neither `frontend/src/i18n/en/signals.json` nor `ar/signals.json` exists.
  `frontend/src/components/signals/SignalRow.tsx` has **no** `useTranslation` at all — it receives
  `t: TFunction<'intelligence-signals'>` as a prop (`SignalRow.tsx:30`). The registered namespace
  is `intelligence-signals` (`frontend/src/i18n/index.ts:402,538`). Executing the gate literally
  creates an unregistered namespace file; with no inline default,
  `t('sourceType.human_entered')` renders the raw key — converting a criterion-1 repair into a
  criterion-2 defect. `frontend/src/i18n/index.ts` is in no plan's scope, and lint's
  `check-i18n-namespaces.mjs` would flag the hook form.
- **Fix:** target `frontend/src/i18n/{en,ar}/intelligence-signals.json`, or add `i18n/index.ts`
  to 98-05's file scope and register `signals` in both locales in the same commit.

### B5 — the built-bundle oracle cannot catch the failure it names

- **Plan:** `98-07-PLAN.md:175` (the inlined literal) versus `:185` (the grep); claim at `:187`
- **Breaks:** D-26 ("absent from a production build" means the built bundle does not contain it)
- The DEV block is inlined with **`Fill with mock data`** (`:175`); the bundle grep searches for
  **`Fill with Mock Data`** (`:185`, case-sensitive, no `-i`). Since the key is deleted from
  `frontend/src/i18n/en/intake.json:86` — the only home of the Title Case string — `DEVHIT=0` is
  unconditionally true regardless of whether Vite's DCE strips the block. `:187` claims _"if Vite
  DCE fails to strip the inline literal (A2), the DEVHIT clause catches it"_; it demonstrably
  cannot. The string that actually ships is never checked.
- **Fix:** grep the bundle for both casings (or for the inlined literal specifically), keeping
  the `Changes saved` positive control in the same run.

### B6 — the D-23 class-sweep finder cannot see the class it is assigned

- **Plan:** `98-04-PLAN.md:92-93` (the finder + its named control), `:221-227` (the sweep),
  `:25` (the must-have)
- **Breaks:** D-23 (every named criterion-2 instance is a CLASS, swept as a population), D-06
- `scripts/i18n-mask-audit.mjs:41` matches only `t('key', 'string default')` — the `TWO_ARG`
  regex. The population that renders **raw keys** is one-arg calls: all 43 recurrence sites and
  52 of the 80 `entityLinks.*` paths are structurally invisible to it. The named control at
  `:93` — _"its known-present control at HEAD is `entityLinks.title` unresolved"_ — is **false**:
  `frontend/src/components/entity-links/EntityLinkManager.tsx:236` is `t('entityLinks.title')`,
  one-arg, and does not appear in the finder's result set. `must_haves:25` ("the finder reports
  entityLinks and calendar.recurrence resolved") is unsatisfiable as written.
- Separately, the script prints only `nsAwareMissing.slice(0, 8)` (`scripts/i18n-mask-audit.mjs:79`),
  so "record the FULL unresolved list" (`98-04-PLAN.md:221`) cannot be done with the named
  instrument — and the script is **not** in 98-04's `files_modified`.
- **Fix:** author or extend a one-arg-aware finder with its control shown firing, put the script
  in scope, and bucket the 501-site / 436-distinct-key result by class rather than demanding a
  verdict per member.

### B7 — criterion 2's recurrence class closes on a source grep alone

- **Plan:** `98-01-PLAN.md:123-128` (copy02's driven surfaces), `98-04-PLAN.md:230` (the only
  assertion)
- **Breaks:** D-07 (a grep may FIND; it may not CLOSE), D-24 (undriveable surfaces close on
  census plus a named UNDRIVEN line, never silently)
- No 98-spec drives `RecurrencePatternEditor`. copy02 visits the intake ticket detail, the
  country wizard region step, and an auth loading state; the `calendar\.recurrence` prefix sits
  in copy02's DOM regex but never on a surface where those keys render. There is no census over
  the 37 derived paths and no named UNDRIVEN line. The sole closure is the (broken) count
  assertion.
- **Fix:** drive the recurrence editor in copy02, or add a static census over the derived paths
  **plus** a named UNDRIVEN scope line in the spec header and the SUMMARY.

### B8 — 98-04 Task 2's gate runs `98-copy02` before Task 3 repairs regions

- **Plan:** `98-04-PLAN.md:190` (the gate) versus `:213-215` (the fix)
- **Breaks:** the gate-reachability rule — a gate must be green when its own task's work is done
- copy02 drives the country wizard region step and asserts no `regions.` dotted token.
  `frontend/src/i18n/en/form-wizard.json` keys are lowercase (`africa, americas, antarctic, asia,
europe, oceania`) while `CountryDetailsStep.tsx:99` and `CountryReviewStep.tsx:34` interpolate
  the capitalized data value, so `regions.Europe` renders raw. The `toLowerCase` normalization
  lands in Task 3 of the same plan.
- **Fix:** move the copy02 run into Task 3, or move the regions normalization into Task 2.

### B9 — 98-05 Task 2's gate runs `98-copy01` before Task 3 lands the week header

- **Plan:** `98-05-PLAN.md:155` (the gate); the backwards claim at `:185`
- **Breaks:** the same gate-reachability rule
- copy01 asserts zero `\b\d{4}-W\d{2}\b` tokens, and
  `frontend/src/components/list-page/EngagementsList.tsx:142,145` render `group.key` (the ISO
  token) in both the heading and the aria-label until Task 3. Task 3's acceptance then states
  _"The rendered closure … is carried by the 98-copy01 spec run in Task 2's gate"_ — pointing
  backwards at a gate that ran before the repair existed.
- **Fix:** run copy01 in Task 3.

---

## ADVISORY

### A1 — `98-01-PLAN.md:133` "floor: 82 keys" is not a static-path floor

Re-derived: **80 static** `entityLinks.*` paths across the 8 files, plus **2 dynamic families**
(`linkTypes.${…}`, `entityTypes.${…}`) = the ruled 82. A spec asserting `static >= 82` is
permanently red and invites quietly editing the number. 98-04's instrument floor of 60
(`98-04-PLAN.md:178`) is safe. State the 80 + 2 decomposition in the spec comment.

### A2 — the COPY-03 `ar` gate is vacuous

`98-06-PLAN.md:29` (must-have), `:117` (EN-only sweep), `:127` (the pattern). The regex
`\bseed(ed)?\b|\bstaging\b|test data` returns **0 hits on `ar/dashboard-widgets.json` at HEAD**,
yet all four Arabic values carry the instruction (`الموجز جاهز للمنشورات المزروعة.`,
`طبّق بيانات لوحة التحكم التجريبية، ثم حدّث الموجز.`, `تعذر تحميل الموجز. تحقق من بيانات الاختبار…`,
`أضف بيانات المشاركين … إلى بيانات لوحة التحكم…`). The must-have "matches nothing in either
locale" is already true today. The sibling sweep is EN-namespaces-only with that exclusion
unstated (D-05). Criterion 3 still closes via the copy03 spec's byte-equality, so this is a weak
backstop rather than a missing closure. Fix: add the Arabic terms, or check `ar` by key-parity
against the EN hits.

### A3 — undeclared derived file scope; one unstated D-15 deviation

`98-06-PLAN.md:168` declares 2 files for Task 3, but the derived exclamation set spans **17 files
× 2 locales**; the frontmatter (`:7-21`) omits ~13 namespaces (`actionable-errors`, `ai-brief`,
`briefing-books`, `calendar-sync`, `comments`, `contextual-suggestions`,
`dossier-recommendations`, `engagement-recommendations`, `export-import`, `integrations`,
`notification-center`, `positions`, `sample-data`). `98-05-PLAN.md:136` and `98-08-PLAN.md:105`
share the shape. 98-07.t2 states its 16-file deviation with cause; 98-06.t3 does not. No actual
collision results, but the declared scope is the input to collision checking.

### A4 — `98-08-PLAN.md:9-10, :105`: `navigation.json` does not exist

Nav labels live in `common.json` under the `navigation` subtree. Same unregistered-namespace
hazard as B4 if the frontmatter is taken literally; mitigated by the plan's own "the ACTUAL file
set is the reverse-lookup … derived at execution" caveat.

### A5 — Wave 0's central requirement has no machine gate

`98-01-PLAN.md:254`. Task 3's `<automated>` asserts only that 8 spec files exist and that none
references `chromium-ar-smoke`. Nothing asserts any spec is RED; the attributing text lands in
SUMMARY prose only. `98-VALIDATION.md:102` makes RED-at-HEAD a Wave 0 checkbox. Fix: assert the
JSON reporter reports 8 failing specs.

### A6 — `98-04-PLAN.md:253` (T-98-09) rests on a false premise

It claims "default escapeValue stays on". `frontend/src/i18n/index.ts` sets
`interpolation: { escapeValue: false }`. The phase adds no interpolation of user data, so the
actual risk is unchanged — but the mitigation's stated basis is wrong and should not be inherited.

### A7 — `98-05-PLAN.md:112, :167`: `week.of` already exists

Present in both locales (`en: "Week of"`, `ar: "أسبوع"`). The repair is dropping the redundant
`defaultValue` and the ISO token, not registering a key. The gate's `d['week']['of']` clause
passes at HEAD, so it discriminates nothing.

### A8 — `98-09-PLAN.md:154`: stale extractor figure

States the decision-coverage extractor tracks 19 of 30. After the CONTEXT header normalization it
reports `total: 30, covered: 30`. The gate (`uncovered: []`) is unaffected — prose only.

### A9 — `98-01-PLAN.md:114-117`: copy01's snake-token zero is aggressive

`/\b[a-z]+(?:_[a-z]+)+\b/` over main-region `innerText` on five surfaces will also match data
values, slugs, and file names that no plan repairs. The stated exclusions (email addresses, mono
ID chips) may not be sufficient. Expect an unfixable red unless the asserted region is narrowed
per surface.

---

## Recommendation

**9 blockers require revision before execution.** Four of them (B1, B2, B3, B6) are the failure
mode this phase's own pre-commitments name: a figure or an instrument asserted as "verified on
disk" that the tree contradicts. B5 and B7 are oracles that would report green while their
criterion is false. B8 and B9 are gates that cannot pass when their own task's work is done. B4
would ship a criterion-2 defect as a criterion-1 repair.

The three criteria that close cleanly today are 3, 4 and 7 (plus COPY-07). Criterion 7's oracle
is the strongest in the set: the glyph and colour assertions are discriminating against the real
switch defaults, and the atomicity is enforced in one task, one commit.

## Acceptance-semantics question (NOT resolved here — both readings stated)

**Criterion 2 / D-22, the recurrence count.** The ruling and the ROADMAP both say "16 call
sites"; the tree has 43 (41 single-quoted, 2 template-literal), 37 distinct paths.

- **Reading A:** 16 was a mis-derivation. Pre-commitment 1 says the derived population governs,
  so the repair covers all 43 and the plan states the delta.
- **Reading B:** the ruling deliberately bounded the repair to 16 sites — e.g. only those
  rendering on the editor's visible surface, excluding the 13 `summaryText.*` computed-string
  sites at `RecurrencePatternEditor.tsx:75-156` — and flipping all 43 exceeds the ruled bound.

The two readings differ in what a criterion-2 green means. This is the overseer's call, not a
planning or checking seat's.

PLAN-CHECK-END
