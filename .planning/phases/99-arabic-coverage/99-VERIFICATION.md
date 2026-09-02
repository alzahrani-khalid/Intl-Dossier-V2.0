---
phase: 99-arabic-coverage
plan: 41
status: complete
attempt: 4
verified_at_local: 2026-09-02T23:28:38+03:00
verified_at_utc: 2026-09-02T20:28:38Z
head: 01cd074d1a36b38295fdc9eb26f710205c46af4b
---

# Phase 99 consolidated re-proof register — P99-41 residue and operator sign-off

## Verdict and evidence law

**The D-38 human checkpoint is ANSWERED.** The authority is the overseer's own record, not this
worker's reading of anything: `RULING-P99-544` in `.tickmarkr/overseer/DECISIONS.md` and the run
journal's `task-approved P99-41` event at `2026-09-02T18:47:49.376Z`. Both carry the same operator
answer, and the approve reason orders it recorded verbatim. It is transcribed, unparaphrased, in
*Written operator answer* below. The `named what must change` branch of the checkpoint was also
exercised at capture time: the operator's session found the position detail page leading with the
English `title_en` under Arabic, and that defect was repaired at `2a79b80da`, which the same ruling
records. This register does not treat `2a79b80da` as the sign-off — the sign-off is the ruling and
the journal event; the commit is the repair the checkpoint caused.

The static battery was re-run at this register's recorded HEAD,
`01cd074d1a36b38295fdc9eb26f710205c46af4b`: all fourteen recorded command blocks across its thirteen
battery sections exited 0, each one re-executed and diffed against its transcribed output by a
comparator that is itself drilled, all of it reproduced in `99-41-SUMMARY.md`. The `neg-taskcard`
negative control is gated by an assertion on its printed rows, because that script exits 0 whatever
it prints. **Both rendered specs ran in this task and both are green: 8/8 and 10/10, 18/18 together,
every leg post-repair.** Precisely: the two rendered runs executed at
`b2b91836b0afd2889c7c3b68c57388572d85880d`, and the only commits between that and the recorded HEAD
are doc-only — `git diff --name-only b2b91836b..01cd074d1` lists exactly the two files this task
owns and **zero** files outside `.planning/`, so nothing those specs exercise changed underneath
them. No criterion here leans on a P99-40 green: the earlier AR-03 run predates `2a79b80da` and is
recorded as lineage only, never as evidence.

There are zero authorized bounds. Nothing in this register is closed on a source grep, on bundle
text, or on an instrument refusal.

## Criterion -> plan -> oracle -> observed result

| Criterion | Closing plan(s) | P99-41 instrument | Control beside the result | Observed result |
| --- | --- | --- | --- | --- |
| 1. One Arabic term per core object, and each nav label agrees with its page-title object term | P99-23–29; consolidated by P99-39/P99-41 | Fresh `nav-title-agreement.mjs` control/live and `glossary-census.mjs` control/`--census` | Planted mismatch caught with a true agreement retained; planted illegal senses caught with legal senses retained | **GREEN, fresh at recorded HEAD.** 28/28 adjudicated, 25 agreements, 3 value-locked escalations, zero defects; 17,022 Arabic leaves across 129 files, `ruled=1657 allowlisted=292 UNCLASSIFIED=0`. |
| 2. Arabic dates/times, no English weekday or month names, deliberate Latin digits | P99-09; P99-41 typed gate | Exactly one existing `99-ar02-dates.spec.ts` path under `chromium-en --no-deps`; `EXP=8` literal | Three Arabic absolute-date legs beside three English controls; Arabic and English relative-time legs paired | **GREEN, rendered fresh in this attempt.** Collected 8 = expected 8; `pw-run-reaped` verdict `clean`; Playwright `expected: 8, unexpected: 0, flaky: 0, skipped: 0`. |
| 3. No English under `dir="rtl"` on the named surfaces | P99-04/05/06/08 and P99-40/P99-41 | Exactly one existing `99-ar03-leak.spec.ts` path; `EXP=10` literal | English controls exist for 404/intake and all three fixture banner leaves collect | **GREEN, rendered fresh in this attempt, post-repair.** Collected 10 = expected 10; verdict `clean`; `expected: 10, unexpected: 0, flaky: 0, skipped: 0`, including all three `UI99-C7` banner states at a HEAD that contains `2a79b80da`. |
| 4. No English-default mask and no unresolved key under the shipped resolver | P99-30–38 and P99-45–62; consolidated by P99-39/P99-41 | Fresh strict self-check/live, mask control/live, TaskCard negative control, resolver live, and date-format control/live | Strict fixture walks 10 masks and 2 raw keys; mask four-polarity control; 3 TaskCard misses **asserted on the text** (the script exits 0 unconditionally, so its status is not a verdict) with that assertion drilled, plus resolver miss/hit controls; dead-import zero beside 29 live importers | **GREEN, fresh at recorded HEAD.** 1,532 files, `twoArgTotal=0`, `rawKeyTotal=8518`, all EN/AR unresolved counters 0; mask prefixes 0; 214 bilingual lookups with 0 misses; date debt 0. |

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
checkout, and any attempt refused before browser execution. Both invocations ran to completion in
this attempt and the wrapper published a `clean` verdict for each:

~~~text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: playwright exited code=0 signal=null; ... session reaped; verdict clean; report published
EXIT=0

collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
pw-run-reaped: playwright exited code=0 signal=null; ... session reaped; verdict clean; report published
EXIT=0
~~~

Port 5173 was unheld at both invocations, so the guard's foreign-holder branch did not fire and
Playwright started its own leased dev server in this worktree. The two earlier exit-90 refusals
recorded in `99-41-SUMMARY.md` were a `codex` sandbox that could not read a port-5001 holder's birth
identity; they are retained as the honest record of that attempt and are not the evidence for any
row here.

## Human checkpoint presentation under Arabic

Two distinct things happened, and this register keeps them separate.

**The presentation the operator consumed was made by the operator/overseer, not by this worker.**
`RULING-P99-544` and the `task-approved` reason record that the six D-38 surfaces were captured live
under `?lng=ar` in a signed-in staging session, with the D-19 tie-break list beside them, published
at `https://claude.ai/code/artifact/7626d793-14c3-46f8-9ebd-8471fe4dd4ee`. That capture is what
exposed the position-heading defect repaired at `2a79b80da`. **No worker in P99-41 produced a screen
capture**, and no bundle string is offered as a substitute for one.

**Every required surface additionally carries a rendered assertion run fresh in this task**, at a
HEAD that contains the repair. Each row below names the leg and its result in this attempt's runs:

| Required surface | Constructed rendered leg | P99-41 fresh result |
| --- | --- | --- |
| 404 under `ar` | `UI99-C5 ar 404` | **PASS** (with `UI99-C5 en control 404` passing beside it) |
| Intake queue under `ar` | `UI99-C6 ar intake queue` | **PASS** (with `UI99-C6 en control intake queue` beside it) |
| Search chips under `ar` | `UI99-C8 ar search chips` | **PASS** |
| Dated surface under `ar` | `UI99-C1C2C4 ar /calendar`, `ar /dossiers`, `ar /events` | **PASS ×3** (with the three `UI99-C1 en control` legs beside them) |
| `/activity` relative time under `ar` | `UI99-C3 ar /activity relative time` | **PASS** (with `UI99-C3 en control` beside it) |
| Position banner `under_review` under `ar` | `UI99-C7 ar banner under_review` | **PASS** |
| Position banner `approved` under `ar` | `UI99-C7 ar banner approved` | **PASS** |
| Position banner `published` under `ar` | `UI99-C7 ar banner published` | **PASS** |

The two whole-page sweeps in the same spec — `UI99-C9 ar latin run scan` and `UI99-C10 ar tajawal` —
also passed. What these rows do **not** establish is Arabic naturalness or anything a person sees
that an assertion does not encode; that is precisely why D-38 exists, and `RULING-P99-544` says so
in the same breath as recording the answer: every automated instrument in this phase was green on
the page whose Arabic heading a person caught in one glance.

### D-19 tie-break and reversal list

This is the list that was put in front of the operator alongside the six captured surfaces. The
reversal window closed on the answer below; while it was open, every row remained a mechanical
leaf-value change plus a parity rerun, and the answer named no row to swap:

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

Transcribed, not paraphrased. The approve reason's own instruction is *"Do not paraphrase, expand
or improve it."*

> it reads as arabic

| Field | Value |
| --- | --- |
| Answer, verbatim | `it reads as arabic` |
| Who gave it | the operator, Khalid Alzahrani |
| When | 2026-09-02 |
| What it was given against | the six D-38 surfaces captured live under `?lng=ar` — 404, intake queue, search chips, dated calendar, `/activity` relative time, published position banner — plus the D-19 tie-break list |
| Where the presentation lives | `https://claude.ai/code/artifact/7626d793-14c3-46f8-9ebd-8471fe4dd4ee` |
| Overseer record | `RULING-P99-544` — *"the D-38 sign-off was GIVEN, and the gate earned its existence"* |
| Orchestrator act | run journal `task-approved` for `P99-41` at `2026-09-02T18:47:49.376Z`, `by: operator (Khalid Alzahrani), relayed by overseer w0:pB6 under RULING-P99-545 item 4` |

| Checkpoint | Decider | Answer | Disposition |
| --- | --- | --- | --- |
| Phase 99 rendered/product sign-off and D-19 reversal window | Operator in writing (Khalid Alzahrani), recorded by the overseer in `RULING-P99-544`; the approve was executed on the orchestrator's behalf under `RULING-P99-546` and appears in the journal | **ANSWERED — `it reads as arabic`.** | **RELEASED.** The D-19 reversal window closes on this answer; no row was named for a swap. |

The `or named what must change` branch of the checkpoint was exercised in the same session and is
already honored: the capture found the position detail page rendering `title_en` as its `<h1>` under
Arabic with the Arabic title demoted to muted secondary text, and `RULING-P99-544` records the
repair at `2a79b80da` — *"verified in BOTH directions, suites still 18/18"*. `2a79b80da` is the
repair the checkpoint caused, never the sign-off itself; the sign-off is the ruling and the journal
event above. `UI99-C7` was green on that page throughout, because it asserts on the read-only banner
element rather than the heading — which is the argument for a human gate, stated in one defect.

## Decision coverage

| Decision | How this register honors it |
| --- | --- |
| D-02 | All four criteria have a named plan and a named oracle, and every one of them has an observed result in this attempt. |
| D-05 | Every population table states what falls outside it. |
| D-07 | Every rendered claim rests on an executed Playwright run recorded here; no source or bundle text substitutes for a rendered leg, and no leg is closed on a grep. |
| D-09 | Each invocation has one existing path and a hardcoded count (8 or 10), asserted before execution. |
| D-19 | The reversal list and the three value-locked escalations were presented while the window was open; the answer closed it without naming a swap. |
| D-35 | Every formerly undriven leg has a constructed test path and a fresh passing result; nothing is recorded NOT CONSTRUCTED and nothing is left unrun. |
| D-38 | The checkpoint was answered by the operator in writing and released through the two-column process — decision in `RULING-P99-544`, approve in the run journal. No worker, orchestrator, or engine supplied the answer. |

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

- **BOUNDED ITEMS: none.** No overseer ruling authorizes a bound and none is claimed. Every green in
  this register is an instrument this attempt ran to completion.
- **Nothing blocking remains in P99-41.** The two previously blocking rows — the unrun post-repair
  AR-03 leg and the missing rendered checkpoint pack — were closed by running them: `99-ar03-leak`
  10/10 and `99-ar02-dates` 8/8 in this attempt, at a HEAD containing `2a79b80da`. The D-38 row was
  closed by the operator's written answer, transcribed above.
- **Phase 102:** D-21's working approximately 7,086-site dot-to-colon convention tail; COPY-09's
  three literals; EDGECOPY-01's two edge functions; GUIDE-HOLLOW-01's seven guide bodies.
- **Phase 103:** the 39 criterion-1 members triaged by reading in Phase 98.
- **Operator naturalness review:** Arabic quality outside the seven ruled glossary rows. The
  sign-off answers "does it read as Arabic", not "is every phrase the best Arabic".
- **Nav/title escalations:** `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent` remain value-locked, never counted as agreements.
- **Closed double-prefixed population, named:** the 37 historical `common:common.*` source keys
  were `about`, `actions.approve`, `actions.complete`, `actions.copy`, `actions.dismiss`,
  `actions.generate`, `actions.moveUp`, `actions.next`, `actions.openMenu`, `actions.previous`,
  `actions.refresh`, `actions.reject`, `actions.remove`, `actions.test`, `actions.thumbsDown`,
  `actions.thumbsUp`, `actions.toggleSection`, `actions.toggleWatch`, `actions.viewDetails`,
  `back`, `cancel`, `clear`, `close`, `delete`, `edit`, `error`, `export`, `loading`, `next`,
  `notYetAvailable`, `previous`, `reorder`, `save`, `saving`, `select`, `success`, and `view`.
  Later source repointing drove the live double-prefix count to zero; this is a named closed
  population, not a rendered green.
- **Named lane handoffs:** `common:optional`; `common:tasks.sla.approaching`;
  `common:afterActions.decisions.item`; `common:afterActions.confidence`;
  `common:afterActions.commitments.{tracking,statuses,priorities}.*`; `common:contributors`;
  `common:days`; the scalar/object reminder-shape clash at
  `common:waitingQueue.reminder.{noAssignee,success,error}`; `WorkItemLinker.tsx`'s eight raw-key
  `common` sites; and `positions:draftBanner`. They remain named handoffs rather than being
  silently converted into bounds.
- **Open engine debt:** the ad-hoc (unleased) `pw-run-reaped.mjs --lease-exec` path in
  `playwright.config.ts` still needs an overseer ruling. It did not apply to either run recorded
  here: both went through the wrapper, both were leased, and both reaped `clean`.

## What this task does not own

Outside P99-41's two planning artifacts: every source/i18n/test/instrument file, D-03 exogenous
paths, ROADMAP/REQUIREMENTS row flips and final close-out acts, and the Phase 102/103 residues.
P99-41 changes none of them.
