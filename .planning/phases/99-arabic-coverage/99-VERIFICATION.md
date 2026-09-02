---
phase: 99-arabic-coverage
plan: 39
status: complete
attempt: 6
verified_at_local: 2026-09-02T06:16:47+03:00
verified_at_utc: 2026-09-02T03:16:47Z
head: c26c392010921745352426b90abb01536176e33d
---

# Phase 99 consolidated re-proof register

## Verdict

The consolidated re-proof is **complete for every criterion this task owns**. All four criteria
have a controlled, named proof, each instrument preceded by its own control. The plan-owned
rendered gate — blocked in attempts 0 through 4 by a foreign dev server on TCP 5173 — **executed**
and reported `18/18 (ar02 8 + ar03 10)` with exit status 0. Each spec was then run separately for
per-test evidence: `99-ar02-dates` 8/8, `99-ar03-leak` 10/10 including all three
`UI99-C7 ar banner` fixture states.

**Which session produced what.** The instrument battery and the two per-spec runs are attempt 5's
session. All three plan-owned typed gates were **re-run in attempt 6** from command text extracted
byte-exact from `99-39-PLAN.md`, after review found attempt 5 had written them into the record as
`bash <oracle 1>` placeholders rather than as commands; attempt 6 changed no instrument, no spec
and no oracle, only this register and the SUMMARY. Every capture is this task's own — none is
quoted from another task's summary.

`head` above is the tree this attempt's evidence was taken against; this record's own commit is
that commit's child, so `git show c26c39201:<path>` shows the previous revision of this file rather
than this one.

Nothing in this register is quoted from an earlier summary. Every number below was produced by a
command run in this task, and each of those commands is reproduced with its verbatim output in
`99-39-SUMMARY.md`.

## Criterion -> plan -> oracle -> observed result

| Criterion | Closing plan(s) | Fresh oracle in this task | Control beside the result | Observed result |
| --- | --- | --- | --- | --- |
| 1. One Arabic term per core object, and each nav label agrees with its page-title object term | P99-23–29; consolidated by P99-39 | `nav-title-agreement.mjs` control then live; `glossary-census.mjs` control, live verdict, then `--census` over every ruled row repo-wide | Nav control caught a planted mismatch and preserved a true agreement. Glossary control caught the unlisted profile sense, the planted plural, the planted brief-plural and the planted دوسييه, while preserving the legal senses. | **GREEN.** Nav/title `28/28 adjudicated; 25 agree; 3 escalated; 0 unruled mismatch; 0 missing anchor; 0 missing navigation locale key; 0 duplicate term pattern; 0 cross-matching term row; 0 row coverage issue; 0 common repair issue; 0 decision artifact issue`. Glossary `17022 Arabic leaf values across 129 file(s)`, all seven ruled rows drilled, `classification totals: ruled=1657 allowlisted=292 UNCLASSIFIED=0`. |
| 2. Arabic dates/times, no English weekday or month names, deliberate Latin digits | P99-09 and the P99-39 consolidated gate | Plan-owned typed Playwright gate, then `99-ar02-dates.spec.ts` alone for per-test evidence | Collection control ran first and hardcoded 8; the static date checker carries the 29-importer live control beside the zero exempt-file importers. | **GREEN.** Collection 8; execution `8 passed (16.2s)`, exit 0, every one of the eight listed tests `✓`. Static date checker: `1533 non-test file(s) scanned, 0 unexcused ad-hoc date/number formatting sites`, named debt `0 row(s) excusing 0 site(s)`. |
| 3. No English under `dir="rtl"` — 404, intake queue, search chips, Latin-run scan, Tajawal, and the three fixture-driven position banners | P99-04/05/06/08; consolidated by P99-39 | Plan-owned typed Playwright gate, then `99-ar03-leak.spec.ts` alone for per-test evidence | Collection control ran first and hardcoded 10, and the three banner tests are named inside that ten. | **GREEN.** Collection 10; execution `10 passed (50.2s)`, exit 0. The three fixture-driven banners each passed by name: `UI99-C7 ar banner under_review (11.0s)`, `UI99-C7 ar banner approved (8.2s)`, `UI99-C7 ar banner published (11.1s)`. No leg is recorded `NOT CONSTRUCTED`. |
| 4. No English-default mask and no unresolved key under the shipped resolver | P99-30–38 and P99-45–62; consolidated by P99-39 | strict audit `--self-check` then live `--json`; maskfinder `--control` then live; `neg-taskcard` **before** `resolve-check` | Strict self-check passes its 18 named predicates and the live `rawKeyTotal=8518` is the positive control against a walked-nothing zero. Maskfinder asserts two-true/two-false polarities. `neg-taskcard` prints its three `MISS=true` rows first, so the live routing zero cannot be a dead instrument. | **GREEN.** Strict audit `scannedFiles: 1532`, `twoArgTotal: 0`, `rawKeyTotal: 8518`, and `twoArgUnresolved / rawKeyUnresolved / twoArgUnresolvedEn / rawKeyUnresolvedEn / twoArgUnresolvedAr / rawKeyUnresolvedAr` all `0`. Maskfinder `UNRESOLVED dynamic t() key prefixes: 0 total`. Resolution `214 lookups across 11 routings x 2 locales — routings with a miss: 0`. Negative control 3/3 `MISS=true`. |

No earlier SUMMARY contributes a green to this table. Earlier summaries are used only for lineage,
population bounds, and named residues.

## Static battery register

| Instrument | Population and what falls outside it | Fresh control -> live result |
| --- | --- | --- |
| Nav/title agreement | Exactly the 28 live modern-nav rows and their named rendered-title anchors in both locale bundles and source anchors. Outside: routes not in the modern-nav population, and Arabic naturalness beyond the ruled object term. | planted mismatch caught + true agreement preserved -> 28/28 adjudicated; 25 agree; 3 escalated; zero unruled/missing/coverage defects |
| Glossary census | Every Arabic string leaf in `frontend/src/i18n/ar/*.json`: 17,022 leaves across 129 files, seven ruled rows. Outside: source literals, the English bundles, and Arabic naturalness outside the ruled and sense-overlay terms. | synthetic illegal senses caught, legal senses retained -> `ruled=1657 allowlisted=292 UNCLASSIFIED=0`, and every one of the seven rows reports `unclassified=0` individually |
| Strict i18n audit | 1,532 production `.ts/.tsx` files under `frontend/src`, tests and i18n data excluded; both locales; canonical resolver with the `translation -> common` alias. Outside: runtime-only rendering, nonliteral dynamic domains, and anything outside `frontend/src`. | 18 self-check predicates green with fixture `rawKeyTotal: 2` -> live `rawKeyTotal: 8518`, `twoArgTotal: 0`, every EN/AR unresolved counter `0` |
| Dynamic-prefix maskfinder | Production `.ts/.tsx` dynamic template and concatenation prefixes under `frontend/src`. Outside: static keys, reachability, rendering, unmodelled prop-bound `t`, and non-frontend source. | four known true/false object-prefix polarities, `4/4` asserted -> zero unresolved prefixes |
| Resolution check | Its 11 explicitly enumerated routing families, 214 bilingual lookups. Outside: routings not in that table, rendering, interpolation, plural behaviour, and Arabic quality. | the fixed broken TaskCard routing prints 3 × `MISS=true` plus a resolving contrast **before** the live run; the live run then prints its own negative and positive controls -> zero routing misses |
| Date-format checker | 1,533 non-test frontend files, with a 2-file allowlist and six named permanent exemptions; an import census guards the dead-code exemption. Outside: runtime rendering, test files, and the named allowlist and exemptions. | dead-code exemption importers `0` while the live comparison component has `29` -> zero unexcused sites, zero debt |
| Completion contract | Every `99-NN-SUMMARY.md` that exists in the phase directory. Outside: summaries not yet written — the guard asserts presence-implies-marker, never existence. An empty directory is refused rather than passed. | drilled directory with one marked and one markerless member -> `1/2` and exit 1; empty directory -> `INSTRUMENT-CANNOT-RUN` and exit 3 -> live phase directory `60/60`, exit 0 |

Both plan-owned typed gates were then run verbatim as compiled. The static gate exited 0 and the
rendered gate exited 0. Their full outputs are in `99-39-SUMMARY.md`.

## Rendered population and the port guard

The population is exactly these two files under `chromium-en`, `--no-deps`:

- `tests/e2e/99-ar02-dates.spec.ts`: hardcoded expected count 8.
- `tests/e2e/99-ar03-leak.spec.ts`: hardcoded expected count 10, including
  `UI99-C7 ar banner under_review`, `approved`, and `published`.

Outside: every other Playwright spec and project, screenshots or prose from older waves,
diagnostic alternate-port runs, and any response served by another checkout.

The main-checkout dev server that blocked attempts 0 through 4 (PID 95414, rooted at
`.../Intl-Dossier-V2.0/frontend`) was released before attempt 5. **No process outside this worktree
was touched by this task at any point**, then or since.

The gate's stated verdict line, from the run recorded in `99-39-SUMMARY.md` §5:

```text
rendered battery executed by THIS gate: 18/18 (ar02 8 + ar03 10)
```

**Which branch of the guard has actually been exercised, stated precisely.** Attempt 6 invoked the
unchanged gate twice. The first invocation found TCP 5173 held by a server rooted **in this
worktree** — leaked by this task's own earlier runs — so it took the **own-holder reuse** branch,
exported `PW_REUSE=1`, and then hung when that leaked server died mid-run and was killed at a
ten-minute ceiling. The second invocation found the port free and took the **no-holder** branch:
Playwright started and supervised its own dev server rooted in this worktree, and that is the run
that reports 18/18 above.

The **foreign-holder** branch has therefore never been exercised by a live foreign holder in
attempt 5 or 6; an earlier revision of this register said it had, conflating the own-holder path
with it, and that claim is withdrawn. What is known about that branch is that attempts 0 through 4
each took it against PID 95414 and exited 3, which is the branch behaving correctly. A holder rooted
anywhere else is refused, never silently reused.

The earlier register said RULING-P99-537 forbade *terminating* a foreign holder. That was an
overreach and is corrected here: RULING-P99-537 forbids **silently reusing** a holder not rooted
in this worktree. Not killing a main-checkout process is still correct, but the reason is
**authority** — it is another tree's process and outside this task's write scope — not the ruling.

## D-19 reversal record

Carried from the nav/title lane, presented for the human reversal window that closes at the D-38
gate below. While that window is open a term swap is still a mechanical leaf-rename.

| Decision | Before | After |
| --- | --- | --- |
| Countries requirement arrow | nav `البلدان`; title `نظرة عامة على الدول` | nav `الدول`; title unchanged |
| Engagements requirement arrow | nav `الارتباطات`; title `المشاركات` | nav/title `المشاركات` |
| PERSONS tie-break | AR nav `الأشخاص`; AR title `جهات الاتصال الرئيسية`; EN title `Key Contacts` | AR nav/title `الأشخاص`; EN title `Persons` |
| POSITIONS tie-break | nav `المواقف`; title `مكتبة المواقف` | **NO EDIT** |
| DASHBOARD tie-break | nav `نظرة عامة على لوحة الدوسيهات`; title `لوحة الملفات` | nav/title `لوحة الدوسيهات` |
| Intake collision | nav `قائمة الاستقبال`; title `قائمة الانتظار` | nav/title `قائمة الاستقبال`; waiting queue stays `قائمة الانتظار` |
| MoUs title anchor | H1 `common:mous.title`; generic copy `Title` / `العنوان` | H1 `common:mous.pageTitle`; page copy/nav `MoUs` / `مذكرات التفاهم` |

Three further pairs remain **escalated and value-locked**, and are not silently counted as
agreements — the live nav/title run reprints all three every time:

```text
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.admin="الإدارة"	ai-admin:settings.title="إعدادات الذكاء الاصطناعي"	ruled=الإدارة
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.taskQueue="قائمة المهام"	assignments:queue.title="قائمة انتظار التعيينات"	ruled=قائمة المهام
ESCALATED-UNRULED OBJECT-TERM MISMATCH	common:navigation.newEvent="فعالية جديدة"	calendar:new_event.title="إدخال تقويم جديد"	ruled=فعالية جديدة
```

The swept terms are the seven ruled rows in the census above; each reports `unclassified=0`
individually, so the operator can reverse any single row without disturbing the others.

## D-38 human gate — OWNED BY P99-41; this task prepares its evidence handoff

**The D-38 checkpoint owner is P99-41, not this task.** The previous revision of this register
claimed P99-39 owned it. That claim was wrong and is withdrawn. It is settled by the compiled
design, not by a worker's reading of it:

- `99-39-PLAN.md` front matter carries `autonomous: true`, and none of its six `must_haves`
  requires an operator answer.
- `99-41-PLAN.md` front matter carries `autonomous: false`, and its must_have states: *"The human
  checkpoint presents: the 404, the intake queue, the search chips, a dated surface, the /activity
  relative-time surface and the position banner rendered under ar, plus the D-19 tie-break list
  from the nav-title lane — and the phase does not close until the operator answers"*.
- `rulings/RULING-P99-95-LAUNCH-ENGINE.md` names it twice: *"one human gate: terminal task
  P99-41"* and *"Human gate P99-41 remains blocked for the operator"*.

The D-38 sentence in `99-39-PLAN.md`'s `truths` — *"this plan is the phase's human gate"* — is
the lane's shared boilerplate: the identical string appears in `99-41-PLAN.md`'s `truths`. Where
the boilerplate and the compiled fields disagree, the fields and the ruling decide, and both name
P99-41. Reassigning ownership to a completed autonomous task would let an open landing decision
read as settled.

**What this task does own:** assembling the evidence P99-41 will put in front of the operator.
Every surface the checkpoint must present now has an executed, named, green rendered result
produced in this task, so P99-41 inherits a package rather than an assertion:

| Surface the checkpoint must present | Executed test | Result in this task |
| --- | --- | --- |
| The 404 page in Arabic | `UI99-C5 ar 404` | `✓ (8.4s)` — with `UI99-C5 en control 404 ✓ (6.5s)` beside it |
| `/my-work/intake` in Arabic | `UI99-C6 ar intake queue` | `✓ (8.4s)` — with `UI99-C6 en control intake queue ✓ (6.5s)` beside it |
| The `/search` chips | `UI99-C8 ar search chips` | `✓ (6.5s)` |
| One dated surface | `UI99-C1C2C4 ar /calendar`, `ar /dossiers`, `ar /events` | `✓ (13.6s)`, `✓ (13.7s)`, `✓ (12.1s)` — each with its `en control` green |
| `/activity` relative time | `UI99-C3 ar /activity relative time` | `✓ (11.6s)` — with `UI99-C3 en control ✓ (12.6s)` |
| The position banner in all three seeded states | `UI99-C7 ar banner under_review` / `approved` / `published` | `✓ (11.0s)` / `✓ (8.2s)` / `✓ (11.1s)` |

Also prepared for that handoff: the D-19 tie-break table and the three escalated pairs above, the
swept-term census, and the residue register below.

**Bounded honestly, and this bound is P99-41's to close, not this task's.** The checkpoint asks the
operator to see rendered *captures*. This task's write scope is exactly two planning files, so no
image artifact can be committed from here, and executed per-test evidence is **not** a substitute
for a capture the operator looks at. What is handed over is the evidence that each named surface
renders and passes; producing the captures themselves, presenting them, and blocking on the answer
belong to P99-41, which is `autonomous: false` for exactly that reason.

**The answer is not this task's to record.** D-38 states that a human product or visual sign-off is
never auto-answered, and both lane plans restate it: *"the rendered sign-off is a HUMAN judgment,
never auto-answered by a worker, the orchestrator, or the engine"*.

| Checkpoint | Owning task | Who decides | Answer |
| --- | --- | --- | --- |
| Phase 99 rendered/product sign-off, and the D-19 reversal window | **P99-41** (`autonomous: false`) | Overseer, in writing; the orchestrator then executes `tickmarkr approve` | **OPEN — not reached.** P99-41 has not run. No worker, orchestrator, or engine answer is recorded, and none may be. |

**What `status: complete` in the front matter does and does not mean.** It is the engine's
presence-implies-marker bookkeeping for *this task's deliverable* — the static battery, the
rendered execution, and this register — which is what the completion-contract oracle measures and
what the next compile reads to decide whether to re-dispatch P99-39. P99-39 is `autonomous: true`
and its acceptance items do not include a checkpoint answer, so the marker is honest here. It is
**not** a phase release and **not** a sign-off; it does not answer the checkpoint above, it makes
no claim about P99-41, and the phase must not be closed on the strength of it.

## Decision coverage

| Decision | How this register honors it |
| --- | --- |
| D-02 | Each of the four ROADMAP criteria has a named plan, a named oracle, a control, a written population, and a fresh observed result. |
| D-05 | Every instrument states both its population and what falls outside it; the rendered population states its exclusions explicitly. |
| D-07 | Criteria 2 and 3 close on executed rendered surfaces, not on a source grep; both Playwright specs are `command:` truths in the plan's own acceptance. |
| D-09 | One spec path per invocation, file existence asserted, and the expected counts hardcoded at 8 and 10 before execution — a spec path is a filter, never proof of existence. |
| D-19 | The reversal table, the three escalated pairs, and the per-row swept-term census are presented while the human window is open. |
| D-35 | Every leg D-35 named as undriven at HEAD is now executed green: the 404, the ar intake queue, the `/search` chips, and all three position-banner states. None closes on "NOT CONSTRUCTED". |
| D-38 | The checkpoint is **P99-41's** (`autonomous: false`, named by RULING-P99-95); this task is `autonomous: true` and prepares its evidence handoff, leaving the answer unrecorded and the rendered captures to P99-41. The `status: complete` marker is explicitly scoped so it cannot be read as the sign-off. |

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

- **RESOLVED — the P99-39 port blocker.** The foreign main-checkout holder of TCP 5173 that
  blocked attempts 0 through 4 was released before this attempt. The unchanged typed gate then ran
  and exited 0. No process outside this worktree was touched at any point.
- **OPEN, engine residue, still needs a ruling:** the rendered oracle invokes Playwright ad hoc, so
  `playwright.config.ts`'s `pw-run-reaped.mjs --lease-exec` wrapper runs **unleased** and leaks its
  dev server after a green run. This reproduced twice inside this task: the plan gate leaked a
  server, and the per-spec `99-ar02-dates` run leaked another that then failed `99-ar03-leak` with
  `http://localhost:5173 is already used`. The in-repo fix is to route the oracle through
  `scripts/pw-run-reaped.mjs --` RUN mode as P99-08's oracle does, or to reap after each run. That
  is plan text outside this task's write scope. Consequence for the next runner: P99-40 and P99-41
  share these specs and will meet a holder — theirs to reuse if it is rooted in their own tree,
  and to refuse if it is not.
- **OPEN — D-38:** the overseer's written sign-off, per the table above.
- **Phase 102:** D-21's working ~7,086-site dot-to-colon convention tail (new scope, after flatten,
  with resolution checks); COPY-09's three literals (`HelpPage:166`, `useBriefingBooks:164-165`,
  `PositionTrackerCard:93`); EDGECOPY-01's two edge functions; GUIDE-HOLLOW-01's seven bodies.
- **Phase 103:** the 39 criterion-1 members Phase 98 triaged by reading.
- **Operator naturalness review:** Arabic quality outside the seven ruled glossary rows.
- **Nav/title overseer rulings:** `admin`, `taskQueue` and `newEvent` remain explicit escalations,
  never agreements.
- **Named lane handoffs:** `positions:draftBanner` remains an un-authored fourth banner branch; the
  `common:optional`, `afterActions.*`, `contributors`, `days`, reminder-shape and WorkItemLinker
  handoffs remain named in P99-13/P99-43. The double-prefixed authoring queue was closed by later
  source re-pointing, and this task's fresh strict/mask/resolve zeros find no AR-04 remainder from it.

## What this task does not own

Per the plan's population statement: every other task's files, the exogenous paths (D-03), the
ROADMAP and REQUIREMENTS row flips and register close-out acts (the overseer's, never a plan's),
and every obligation this task's acceptance items do not name — those belong to the lane parts
named in `depends_on`, and to P99-40 and P99-41 after it.
