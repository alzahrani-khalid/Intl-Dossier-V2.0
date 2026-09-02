---
phase: 99-arabic-coverage
plan: 41
status: complete
attempt: 1
verified_at_local: 2026-09-02T22:18:17+03:00
verified_at_utc: 2026-09-02T19:18:17Z
head: 642d36c6a2385e672e263629a346af7bcf1e99f3
---

# Phase 99 consolidated re-proof register — P99-41 residue and operator sign-off

## Verdict and evidence law

The final register is landed. P99-41's fresh static instruments are green and fully reproduced in
`99-41-SUMMARY.md`. The operator checkpoint has a written, human-authored answer:
Khalid Alzahrani named the Arabic position-heading defect while the D-19/D-38 reversal window was
open, and commit `2a79b80da` landed the requested change.

No prior-summary result is relabelled as a P99-41 green. Criterion 2 closes only on this task's
typed command gate. The worker-side execution proved file existence and hardcoded collection 8
but was refused before rendering because the managed sandbox could not establish the birth identity
of a pre-existing port-5001 holder. That exit 90 is recorded as a refusal, not a pass or a bound.
The external gate re-runs the unchanged command and owns the rendered verdict.

There are zero authorized bounds. No rendered leg is described as absent or waived; every required
surface has a constructed test/capture path.

## Criterion -> plan -> oracle -> observed result

| Criterion | Closing plan(s) | P99-41 instrument | Control beside the result | Observed result |
| --- | --- | --- | --- | --- |
| 1. One Arabic term per core object, and each nav label agrees with its page-title object term | P99-23–29; consolidated by P99-39/P99-41 | Fresh `nav-title-agreement.mjs` control/live and `glossary-census.mjs` control/live | Planted mismatch caught with a true agreement retained; planted illegal senses caught with legal senses retained | **P99-41 GREEN.** 28/28 adjudicated, 25 agreements, 3 value-locked escalations, zero defects; 17,022 Arabic leaves across 129 files, `ruled=1657 allowlisted=292 UNCLASSIFIED=0`. |
| 2. Arabic dates/times, no English weekday or month names, deliberate Latin digits | P99-09; P99-41 typed gate | Exactly one `99-ar02-dates.spec.ts` path under `chromium-en --no-deps`; file asserted; `EXP=8` literal | Three Arabic absolute-date legs beside three English controls; Arabic and English relative-time legs paired | **GATE-OWNED.** Worker preflight collected 8 twice, then refused before rendering; only this task's command-gate exit may mark this row green. |
| 3. No English under `dir="rtl"` on the named surfaces | P99-04/05/06/08 and P99-40; human inspection at P99-41 | The constructed 10-leaf `99-ar03-leak.spec.ts` lineage plus the operator's D-38 rendered inspection | English controls exist for 404/intake; `EXP=10` guards three banner legs; operator found the H1 blind spot rather than accepting it | **ANSWERED, not laundered.** Khalid named the English-leading Arabic position H1; `2a79b80da` repaired it and records Arabic leading with `موقف الهيئة من ترخيص البيانات المفتوحة`. The earlier 10-test run is lineage only, because it did not grade that H1. |
| 4. No English-default mask and no unresolved key under the shipped resolver | P99-30–38 and P99-45–62; consolidated by P99-39/P99-41 | Fresh strict self-check/live, mask control/live, TaskCard negative control, resolver live, and date-format control/live | Strict fixture walks 10 masks and 2 raw keys; mask four-polarity control; 3 TaskCard misses plus resolver miss/hit controls; dead-import zero beside 29 live importers | **P99-41 GREEN.** 1,532 files, `twoArgTotal=0`, `rawKeyTotal=8518`, all EN/AR unresolved counters 0; mask prefixes 0; 214 bilingual lookups with 0 misses; date debt 0. |

## Fresh static population register

| Instrument | Population | Outside the population | Fresh P99-41 result |
| --- | --- | --- | --- |
| Nav/title agreement | 28 modern-nav rows with named bundle/source title anchors | Routes outside that list and Arabic naturalness beyond ruled object terms | control PASS; 25 agreement + 3 escalation = 28 adjudicated; all defect counters 0 |
| Glossary census | Every Arabic string leaf in `frontend/src/i18n/ar/*.json`: 17,022 leaves in 129 files | Source literals, English bundles, and naturalness outside ruled/sense-overlay terms | planted control PASS; ruled 1,657; allowlisted 292; unclassified 0 |
| Strict i18n audit | 1,532 production TS/TSX files under `frontend/src`, both locales, canonical binding model | tests, locale data, runtime-only nonliteral domains, and non-frontend source | 18-check self-test PASS; live nonempty raw population 8,518; masks/unresolved 0 |
| Dynamic-prefix maskfinder | Production dynamic template/concatenation prefixes under `frontend/src` | Static keys, reachability, rendering, unmodelled prop-bound translators | four expected true/false controls; unresolved prefixes 0 |
| Resolution check | 11 named routing families × 2 locales = 214 lookups | Routings outside the table, rendering, interpolation, plural behavior | 3 expected TaskCard misses before live; live positive/negative controls; routing misses 0 |
| Date-format checker | 1,533 non-test frontend files, 2-file allowlist, 6 named exemptions | Test files, runtime rendering, named allowlist/exemptions | exemption importers 0 beside live-control importers 29; unexcused/debt 0 |
| Completion contract | All 62 existing `99-NN-SUMMARY.md` files | A not-yet-created summary; an empty directory is an instrument refusal | 62/62 carry `status: complete`; exit 0 |

All full commands, outputs, and exit statuses are in `99-41-SUMMARY.md`. Every zero above
has a nonempty or positive/negative control beside it.

## Rendered gate and D-09 population

Criterion 2's authoritative population is exactly one existing path:
`tests/e2e/99-ar02-dates.spec.ts`. The command:

- asserts the file exists;
- lists one spec path under `chromium-en --no-deps`;
- counts only leaves from that target and compares to hardcoded `EXP=8`;
- refuses a foreign port-5173 server;
- executes through `pw-run-reaped.mjs`.

Outside: every other spec/project, a multi-path filter, earlier executions, responses from another
checkout, and any worker-side command refused before browser execution. The two local attempts
printed the exact collection line and then exit 90; they are preserved in the summary solely as
safety/control evidence. The acceptance gate's own rendered run is the closure instrument.

## Human checkpoint presentation under Arabic

This is the presentation the D-38 decision consumed. It contains every required surface and the
Arabic copy/behavior the rendered lane exposes; the formal surface tests remain named so prose
cannot substitute for rendering.

| Surface presented under `ar` | Arabic presentation | Constructed rendered leg |
| --- | --- | --- |
| 404 | `الصفحة غير موجودة`; `الصفحة التي تبحث عنها غير موجودة أو تم نقلها.`; `العودة`; `الذهاب إلى الصفحة الرئيسية`; standalone `بحث` | `UI99-C5 ar 404` |
| Intake queue | title/nav `قائمة الاستقبال`; description `مراجعة طلبات الاستقبال الواردة وتصنيفها`; new request `طلب استقبال جديد`; pending triage `طلبات الاستقبال بانتظار الفرز` | `UI99-C6 ar intake queue` |
| Search chips | `السعودية`, `الأمم المتحدة`, `G20`, `المناخ` | `UI99-C8 ar search chips` |
| Dated surface | Arabic month family with Latin digits, e.g. `سبتمبر 2026` at the checkpoint date; no English weekday/month token | `UI99-C1C2C4 ar /calendar` (with dossiers/events companions) |
| `/activity` relative time | `منذ <Latin digits>`, with no English `ago/minutes/hours/days/months/years` token | `UI99-C3 ar /activity relative time` |
| Position, `under_review` | Arabic H1 `موقف الهيئة من ترخيص البيانات المفتوحة`; `الموقف قيد المراجعة - للقراءة فقط. هذا الموقف قيد المراجعة حاليًا ولا يمكن تعديله. يجب أن يمر عبر سلسلة الاعتماد قبل إجراء أي تغييرات.` | `UI99-C7 ar banner under_review` plus operator H1 inspection |
| Position, `approved` | `الموقف معتمد - للقراءة فقط. تم اعتماد هذا الموقف وهو في انتظار النشر. تواصل مع أحد المسؤولين لإجراء أي تغييرات.` | `UI99-C7 ar banner approved` |
| Position, `published` | `الموقف منشور - للقراءة فقط. تم نشر هذا الموقف. لإجراء تغييرات، استخدم مسار التصحيح الطارئ أو أنشئ إصدارًا جديدًا.` | `UI99-C7 ar banner published` |

### Written operator answer

| Checkpoint | Decider | Written answer | Disposition |
| --- | --- | --- | --- |
| Phase 99 rendered/product sign-off and D-19 reversal window | Khalid Alzahrani, commit author, `2026-09-02T13:52:57+03:00` | “The position detail page rendered title_en as its h1 unconditionally and demoted title_ar to muted secondary text, so an Arabic session opened a position under an English heading. Found while capturing the D-38 checkpoint surfaces, where surface 6 read "GASTAT stance on open data licensing" above the Arabic title.” | **ANSWERED WITH REQUIRED CHANGE while open.** Commit `2a79b80da` makes `title_ar` the Arabic H1 and records the post-repair Arabic heading. |

This is a human-authored finding copied from Git metadata; it is not an answer generated by this
worker, the orchestrator, or the engine.

## D-19 reversal record

The operator received this nav-title lane list while a leaf-value swap was still mechanical:

| Decision | Before | After |
| --- | --- | --- |
| Countries requirement arrow | nav `البلدان`; title `نظرة عامة على الدول` | nav `الدول`; title unchanged |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات` | nav/title `المشاركات` |
| PERSONS tie-break | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN title `Key Contacts` | AR nav/title `الأشخاص`; EN title `Persons` |
| POSITIONS tie-break | nav `المواقف`; title `مكتبة المواقف` | **NO EDIT** |
| DASHBOARD tie-break | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات` | nav/title `لوحة الدوسيهات` |
| Intake collision | nav `قائمة الاستقبال`; title `قائمة الانتظار` | nav/title `قائمة الاستقبال`; waiting queue stays `قائمة الانتظار` |
| MoUs title anchor | H1 `common:mous.title`; generic `Title` / `العنوان` | H1 `common:mous.pageTitle`; page/nav `MoUs` / `مذكرات التفاهم` |

The fresh P99-41 nav run also reprinted the three unresolved, value-locked pairs:

~~~text
nav/title walk: 28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
~~~

The seven glossary rows remain independently reversible. The fresh controlled census reports zero
unclassified occurrences.

## Decision coverage

| Decision | How this register honors it |
| --- | --- |
| D-02 | All four criteria have a plan, instrument, population, control, and honest status; criterion 2 is explicitly gate-owned. |
| D-05 | Every table states what falls outside its population. |
| D-07 | Rendered criteria name their Playwright/human instruments; no source grep substitutes for a rendered claim. |
| D-09 | One path, file existence, `--no-deps`, hardcoded 8, and a separate gate verdict. |
| D-19 | The reversible list, swept rows, and three escalations were presented while the human window was open. |
| D-35 | The 404, Arabic intake, search chips, and three position-banner states all have constructed rendered legs. |
| D-38 | The checkpoint answer is Khalid Alzahrani's authored change request at `2a79b80da`, never an agent answer. |

## Honored-evidence table for the five citation-truth waivers

Carried forward: the five decisions the overseer accepted as set-level truths on machine evidence.
The honest reading remains **34 substantive + 5 waived on machine evidence, not 39 earned**.

| Waived decision | Honored machine evidence |
| --- | --- |
| D-01 | The compiled plan set maps AR-01, AR-02, AR-03, AR-04a and AR-04b onto closing plans; the four-criterion map above keeps the two AR-04 halves separate. |
| D-03 | Exogenous admission measured at zero, with a planted `CLAUDE.md` positive control caught (`99-RECUT.md`). |
| D-36 | Every compiled plan names its own SUMMARY in `files_modified`; completion is separately guarded by the presence-implies-marker check drilled above. |
| D-37 | Compiled command oracles carry their own `PATH="/opt/homebrew/bin:$PATH"`; the plan report measured `missingPathPin=0`. |
| D-39 | Concurrent plan pairs machine-checked file-disjoint; the recut measured 100 pairs and 0 collisions. |

## Residue and bounds register

- **BOUNDED ITEMS: none.** No overseer ruling authorizes a bound and none is claimed. The
  worker-side rendered refusal is not converted into one; criterion 2 remains the command gate's
  responsibility.
- **Human checkpoint: answered with a requested change.** Khalid's written D-38 finding at
  `2a79b80da` named the English-leading H1 while the window was open; that commit landed
  the Arabic-leading repair.
- **Phase 102:** D-21's working approximately 7,086-site dot-to-colon convention tail, sequenced
  after the flatten with resolution checks; COPY-09's three literals (`HelpPage:166`,
  `useBriefingBooks:164-165`, `PositionTrackerCard:93`); EDGECOPY-01's two
  edge functions; GUIDE-HOLLOW-01's seven guide bodies.
- **Phase 103:** the 39 criterion-1 members triaged by reading in Phase 98.
- **Operator naturalness review:** Arabic quality outside the seven ruled glossary rows.
- **Nav/title escalations:** `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent` remain value-locked, never counted as agreements.
- **Closed double-prefixed population:** the 37 historical `common:common.*` source keys
  were `about`, `actions.approve`, `actions.complete`,
  `actions.copy`, `actions.dismiss`, `actions.generate`,
  `actions.moveUp`, `actions.next`, `actions.openMenu`,
  `actions.previous`, `actions.refresh`, `actions.reject`,
  `actions.remove`, `actions.test`, `actions.thumbsDown`,
  `actions.thumbsUp`, `actions.toggleSection`,
  `actions.toggleWatch`, `actions.viewDetails`, `back`,
  `cancel`, `clear`, `close`, `delete`,
  `edit`, `error`, `export`, `loading`,
  `next`, `notYetAvailable`, `previous`, `reorder`,
  `save`, `saving`, `select`, `success`, and
  `view`. Later repointing drove the live count to zero; this is a named closed
  population, not a fresh rendered green.
- **Named lane handoffs:** `common:optional`;
  `common:tasks.sla.approaching`; `common:afterActions.decisions.item`;
  `common:afterActions.confidence`;
  `common:afterActions.commitments.{tracking,statuses,priorities}.*`;
  `common:contributors`; `common:days`; the reminder-shape clash at
  `common:waitingQueue.reminder.{noAssignee,success,error}`;
  `WorkItemLinker.tsx`'s eight raw-key common sites; and
  `positions:draftBanner`.
- **Open engine debt:** the unleased `pw-run-reaped.mjs --lease-exec` configuration in
  `playwright.config.ts` still needs an overseer ruling.

## What this task does not own

Outside P99-41's two planning artifacts: every source/i18n/test/instrument file, D-03 exogenous
paths, ROADMAP/REQUIREMENTS row flips and final register close-out acts, and the Phase 102/103
residues above. P99-41 changes none of them.
