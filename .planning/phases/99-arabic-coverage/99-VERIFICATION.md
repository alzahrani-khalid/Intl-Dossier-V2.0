---
phase: 99-arabic-coverage
plan: 41
status: blocked
attempt: 2
verified_at_local: 2026-09-02T22:44:24+03:00
verified_at_utc: 2026-09-02T19:44:24Z
head: c975d61f8e859aaa885a2fb78ccf73ce1e2f29ef
---

# Phase 99 consolidated re-proof register — P99-41 residue and operator sign-off

## Verdict and evidence law

**BLOCKED — the D-38 human checkpoint is OPEN.** No overseer/operator answer or subsequent
`tickmarkr approve` is present. Commit `2a79b80da` is an agent-session repair commit (it carries
`Co-Authored-By: Claude Opus 5` and a `Claude-Session` trailer); its author metadata is not evidence
that the operator saw and answered the P99-41 presentation. This worker does not reinterpret that
commit as human sign-off.

The static battery was rerun fresh at `c975d61f8e859aaa885a2fb78ccf73ce1e2f29ef` and is green.
The task-level criterion-2 command gate reported exit 0 after the prior attempt and remains the only
authoritative rendered result for criterion 2. The fresh local AR-03 attempt collected the hardcoded
10 leaves but the safety wrapper refused before Playwright started because this sandbox could not
read the birth identity of the pre-existing port-5001 holder. Therefore criterion 3 and the rendered
checkpoint pack are parked red by name. The P99-40 AR-03 green predates the position-H1 repair and
is lineage only.

There are zero authorized bounds. An instrument refusal is not a bound or a pass.

## Criterion -> plan -> oracle -> observed result

| Criterion | Closing plan(s) | P99-41 instrument | Control beside the result | Observed result |
| --- | --- | --- | --- | --- |
| 1. One Arabic term per core object, and each nav label agrees with its page-title object term | P99-23–29; consolidated by P99-39/P99-41 | Fresh `nav-title-agreement.mjs` control/live and `glossary-census.mjs` control/`--census` | Planted mismatch caught with a true agreement retained; planted illegal senses caught with legal senses retained | **GREEN, fresh at recorded HEAD.** 28/28 adjudicated, 25 agreements, 3 value-locked escalations, zero defects; 17,022 Arabic leaves across 129 files, `ruled=1657 allowlisted=292 UNCLASSIFIED=0`. |
| 2. Arabic dates/times, no English weekday or month names, deliberate Latin digits | P99-09; P99-41 typed gate | Exactly one existing `99-ar02-dates.spec.ts` path under `chromium-en --no-deps`; `EXP=8` literal | Three Arabic absolute-date legs beside three English controls; Arabic and English relative-time legs paired | **GATE GREEN.** The harness-reported task gate exited 0. The local retry collected 8 and then refused before rendering; that refusal is not the green. |
| 3. No English under `dir="rtl"` on the named surfaces | P99-04/05/06/08 and P99-40/P99-41 | Exactly one existing `99-ar03-leak.spec.ts` path; `EXP=10` literal | English controls exist for 404/intake and all three fixture banner leaves collect | **RED / PARKED: `99-ar03-leak.spec.ts`.** Fresh collection was 10; execution exited 90 before Playwright started. No post-repair rendered green exists in this task. |
| 4. No English-default mask and no unresolved key under the shipped resolver | P99-30–38 and P99-45–62; consolidated by P99-39/P99-41 | Fresh strict self-check/live, mask control/live, TaskCard negative control, resolver live, and date-format control/live | Strict fixture walks 10 masks and 2 raw keys; mask four-polarity control; 3 TaskCard misses plus resolver miss/hit controls; dead-import zero beside 29 live importers | **GREEN, fresh at recorded HEAD.** 1,532 files, `twoArgTotal=0`, `rawKeyTotal=8518`, all EN/AR unresolved counters 0; mask prefixes 0; 214 bilingual lookups with 0 misses; date debt 0. |

## Fresh static population register

| Instrument | Population | Outside the population | Fresh P99-41 result |
| --- | --- | --- | --- |
| Nav/title agreement | 28 modern-nav rows with named bundle/source title anchors | Routes outside that list and Arabic naturalness beyond ruled object terms | control PASS; 25 agreement + 3 escalation = 28 adjudicated; all defect counters 0 |
| Glossary census | Every Arabic string leaf in `frontend/src/i18n/ar/*.json`: 17,022 leaves in 129 files | Source literals, English bundles, and naturalness outside ruled/sense-overlay terms | planted control PASS; ruled 1,657; allowlisted 292; unclassified 0 |
| Strict i18n audit | 1,532 production TS/TSX files under `frontend/src`, both locales, canonical binding model | tests, locale data, runtime-only nonliteral domains, and non-frontend source | 18-check self-test PASS; live nonempty raw population 8,518; masks/unresolved 0 |
| Dynamic-prefix maskfinder | Production dynamic template/concatenation prefixes under `frontend/src` | Static keys, reachability, rendering, unmodelled prop-bound translators | four expected true/false controls; unresolved prefixes 0 |
| Resolution check | 11 named routing families × 2 locales = 214 lookups | Routings outside the table, rendering, interpolation, plural behavior | 3 expected TaskCard misses before live; live positive/negative controls; routing misses 0 |
| Date-format checker | 1,533 non-test frontend files, 2-file allowlist, 6 named exemptions | Test files, runtime rendering, named allowlist/exemptions | exemption importers 0 beside live-control importers 29; unexcused/debt 0 |

The commands, verbatim outputs, and exit statuses are reproduced in `99-41-SUMMARY.md`. Every
claimed zero has a nonempty or positive/negative control beside it.

## Rendered population and D-09 controls

The rendered population is two independent, one-path invocations under `chromium-en --no-deps`:

- `tests/e2e/99-ar02-dates.spec.ts`, file asserted, hardcoded expected count 8;
- `tests/e2e/99-ar03-leak.spec.ts`, file asserted, hardcoded expected count 10.

Outside: every other spec/project, multi-path filtering, source/bundle text, a response from another
checkout, and any attempt refused before browser execution. The local results were:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
EXIT=90

collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
pw-run-reaped: pre-spawn birth-identity lookup unavailable for pid 67828 on port 5001 — refusing to spawn (an unproven holder identity is not a known holder)
EXIT=90
~~~

The task-level criterion-2 gate later ran the unchanged AR-02 command outside this restricted
process-census context and reported exit 0. No corresponding task-level AR-03 gate exists, so the
AR-03 row remains red.

## Human checkpoint presentation under Arabic

**RENDERED PRESENTATION NOT PRODUCED IN P99-41.** The table below names every required leg and its
current evidence state; it is an execution inventory, not a reconstruction from i18n bundle strings.
The operator has not been asked to sign off on bundle text.

| Required surface | Constructed rendered leg | P99-41 state |
| --- | --- | --- |
| 404 under `ar` | `UI99-C5 ar 404` | **NOT PRODUCED:** AR-03 invocation refused before Playwright started |
| Intake queue under `ar` | `UI99-C6 ar intake queue` | **NOT PRODUCED:** same refused invocation |
| Search chips under `ar` | `UI99-C8 ar search chips` | **NOT PRODUCED:** same refused invocation |
| Dated surface under `ar` | `UI99-C1C2C4 ar /calendar` (plus `/dossiers` and `/events`) | task-level AR-02 gate reported exit 0; no capture artifact was retained |
| `/activity` relative time under `ar` | `UI99-C3 ar /activity relative time` | task-level AR-02 gate reported exit 0; no capture artifact was retained |
| Position banner `under_review` under `ar` | `UI99-C7 ar banner under_review` | **NOT PRODUCED:** AR-03 invocation refused before Playwright started |
| Position banner `approved` under `ar` | `UI99-C7 ar banner approved` | **NOT PRODUCED:** same refused invocation |
| Position banner `published` under `ar` | `UI99-C7 ar banner published` | **NOT PRODUCED:** same refused invocation |

### D-19 tie-break and reversal list

This list remains available while the checkpoint is open and a term swap remains a mechanical
leaf-value change plus parity rerun:

| Decision | Before | After |
| --- | --- | --- |
| Countries requirement arrow | nav `البلدان`; title `نظرة عامة على الدول` | nav `الدول`; title unchanged |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات` | nav/title `المشاركات` |
| PERSONS tie-break | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN title `Key Contacts` | AR nav/title `الأشخاص`; EN title `Persons` |
| POSITIONS tie-break | nav `المواقف`; title `مكتبة المواقف` | **NO EDIT** |
| DASHBOARD tie-break | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات` | nav/title `لوحة الدوسيهات` |
| Intake collision | nav `قائمة الاستقبال`; title `قائمة الانتظار` | nav/title `قائمة الاستقبال`; waiting queue stays `قائمة الانتظار` |
| MoUs title anchor | H1 `common:mous.title`; generic copy `Title` / `العنوان` | H1 `common:mous.pageTitle`; page copy/nav `MoUs` / `مذكرات التفاهم` |

The fresh nav run also reprinted the three unresolved, value-locked pairs:

~~~text
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
~~~

### Written operator answer

| Checkpoint | Decider | Answer | Disposition |
| --- | --- | --- | --- |
| Phase 99 rendered/product sign-off and D-19 reversal window | Overseer/operator in writing; orchestrator runs `tickmarkr approve` afterward | **OPEN — no qualifying answer found.** | **BLOCKING.** Do not close the phase. |

Commit `2a79b80da` is retained only as repair lineage. Its agent co-author/session trailers and its
own statement that the defect was found during an agent capture session do not prove operator review.

## Decision coverage

| Decision | How this register honors it |
| --- | --- |
| D-02 | All four criteria have a named plan and oracle; criterion 3 is explicitly red instead of omitted. |
| D-05 | Every population table states what falls outside it. |
| D-07 | Rendered claims use only executed Playwright evidence; source or bundle text does not substitute for the missing AR-03 run. |
| D-09 | Each invocation has one existing path and a hardcoded count (8 or 10). |
| D-19 | The reversible list and three escalations remain presented while the human window is open. |
| D-35 | Every formerly undriven leg has a constructed test path; the unexecuted post-repair AR-03 legs are parked red by spec name. |
| D-38 | The checkpoint remains OPEN until a qualifying operator/overseer answer and orchestrator approval exist. |

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

- **BOUNDED ITEMS: none.** No overseer ruling authorizes a bound and none is claimed.
- **BLOCKING — rendered AR-03:** `99-ar03-leak.spec.ts` collected 10 but did not execute after the
  position-H1 repair; the refusal is recorded above.
- **BLOCKING — checkpoint pack:** the six required surface families were not all freshly rendered
  or captured in P99-41, so no presentation has been placed before the operator.
- **BLOCKING — D-38:** no qualifying written operator answer and no orchestrator approval exist.
- **Phase 102:** D-21's working approximately 7,086-site dot-to-colon convention tail; COPY-09's
  three literals; EDGECOPY-01's two edge functions; GUIDE-HOLLOW-01's seven guide bodies.
- **Phase 103:** the 39 criterion-1 members triaged by reading in Phase 98.
- **Operator naturalness review:** Arabic quality outside the seven ruled glossary rows.
- **Nav/title escalations:** `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent` remain value-locked, never counted as agreements.
- **Open engine debt:** the unleased `pw-run-reaped.mjs --lease-exec` configuration in
  `playwright.config.ts` still needs an overseer ruling.

## What this task does not own

Outside P99-41's two planning artifacts: every source/i18n/test/instrument file, D-03 exogenous
paths, ROADMAP/REQUIREMENTS row flips and final close-out acts, and the Phase 102/103 residues.
P99-41 changes none of them.
