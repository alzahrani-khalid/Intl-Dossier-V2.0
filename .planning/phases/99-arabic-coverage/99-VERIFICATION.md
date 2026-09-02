---
phase: 99-arabic-coverage
plan: 40
status: complete
attempt: 1
verified_at_local: 2026-09-02T13:31:05+03:00
verified_at_utc: 2026-09-02T10:31:05Z
head: 6be6bfb0a79272dacb9c4b2bcb6c2659a91d910c
---

# Phase 99 consolidated re-proof register — P99-40 rendered battery

## Verdict

P99-40 is **GREEN**. Its two own command oracles each proved the target file exists, collected
exactly its hardcoded one-file population — 8 for `99-ar02-dates.spec.ts`, 10 for
`99-ar03-leak.spec.ts` — and then **executed** that population under `chromium-en --no-deps`,
exiting `0`:

```text
99-ar03-leak.spec.ts   collected 10, executed 10 -> {"expected":10,"skipped":0,"unexpected":0,"flaky":0}
99-ar02-dates.spec.ts  collected  8, executed  8 -> {"expected":8,"skipped":0,"unexpected":0,"flaky":0}
```

Both rendered rows below close on output produced by **this** gate in **this** run. No green is
quoted forward from P99-39 or any earlier wave to close them. No leg is recorded
`NOT CONSTRUCTED`, and no bound is recorded — none is needed, because every leg this task owes
ran. The complete commands, their verbatim output, the per-test tables and the exit statuses are
in `99-40-SUMMARY.md`.

The static rows attributed below to P99-39 remain **lineage evidence, explicitly labelled as
such**. They are retained because this is the consolidated phase register, and they are outside
P99-40's rendered-only population, which the acceptance items define.

## Criterion -> plan -> oracle -> observed result

| Criterion | Closing plan(s) | Fresh oracle in this task | Control beside the result | Observed result |
| --- | --- | --- | --- | --- |
| 1. One Arabic term per core object, and each nav label agrees with its page-title object term | P99-23–29; consolidated by P99-39 | P99-39's control/live nav and glossary battery; outside P99-40's rendered-only population | The P99-39 controls remain named; P99-40 did not rerun them. | **LINEAGE GREEN, not a P99-40 claim.** Nav/title 28/28 adjudicated with 25 agreements and 3 value-locked escalations; glossary 17,022 leaves in 129 files with zero unclassified. |
| 2. Arabic dates/times, no English weekday or month names, deliberate Latin digits | P99-09; P99-40 own rendered gate | P99-40 exact one-path `99-ar02-dates.spec.ts` command | Each of the three Arabic surfaces ran beside its `en control` leg in the same invocation. | **GREEN in P99-40.** Collected 8, executed 8, **8 passed**, `skipped:0 unexpected:0 flaky:0`, exit 0. |
| 3. No English under `dir="rtl"` — 404, intake queue, search chips, Latin-run scan, Tajawal, and the three fixture-driven position banners | P99-04/05/06/08; P99-40 own rendered gate | P99-40 exact one-path `99-ar03-leak.spec.ts` command | `en control` legs for the 404 and the intake queue ran in the same invocation; `EXP=10` asserted before execution. | **GREEN in P99-40.** Collected 10, executed 10, **10 passed**, `skipped:0 unexpected:0 flaky:0`, exit 0. All three banner states passed with real durations. |
| 4. No English-default mask and no unresolved key under the shipped resolver | P99-30–38 and P99-45–62; consolidated by P99-39 | P99-39's strict/mask/resolve battery; outside P99-40's rendered-only population | The P99-39 controls remain named; P99-40 did not rerun them. | **LINEAGE GREEN, not a P99-40 claim.** Strict zero, maskfinder zero, and 214-route resolution zero remain registered. |

No earlier SUMMARY contributes a green to either P99-40 rendered row. Earlier summaries are used
only for lineage, population history, and named residues.

## Static battery register — P99-39 lineage, outside P99-40's rendered-only population

| Instrument | Population and what falls outside it | Fresh control -> live result |
| --- | --- | --- |
| Nav/title agreement | Exactly the 28 live modern-nav rows and their named rendered-title anchors in both locale bundles and source anchors. Outside: routes not in the modern-nav population, and Arabic naturalness beyond the ruled object term. | planted mismatch caught + true agreement preserved -> 28/28 adjudicated; 25 agree; 3 escalated; zero unruled/missing/coverage defects |
| Glossary census | Every Arabic string leaf in `frontend/src/i18n/ar/*.json`: 17,022 leaves across 129 files, seven ruled rows. Outside: source literals, the English bundles, and Arabic naturalness outside the ruled and sense-overlay terms. | synthetic illegal senses caught, legal senses retained -> `ruled=1657 allowlisted=292 UNCLASSIFIED=0`, and every one of the seven rows reports `unclassified=0` individually |
| Strict i18n audit | 1,532 production `.ts/.tsx` files under `frontend/src`, tests and i18n data excluded; both locales; canonical resolver with the `translation -> common` alias. Outside: runtime-only rendering, nonliteral dynamic domains, and anything outside `frontend/src`. | 18 self-check predicates green with fixture `rawKeyTotal: 2` -> live `rawKeyTotal: 8518`, `twoArgTotal: 0`, every EN/AR unresolved counter `0` |
| Dynamic-prefix maskfinder | Production `.ts/.tsx` dynamic template and concatenation prefixes under `frontend/src`. Outside: static keys, reachability, rendering, unmodelled prop-bound `t`, and non-frontend source. | four known true/false object-prefix polarities, `4/4` asserted -> zero unresolved prefixes |
| Resolution check | Its 11 explicitly enumerated routing families, 214 bilingual lookups. Outside: routings not in that table, rendering, interpolation, plural behaviour, and Arabic quality. | the fixed broken TaskCard routing prints 3 × `MISS=true` plus a resolving contrast **before** the live run; the live run then prints its own negative and positive controls -> zero routing misses |
| Date-format checker | 1,533 non-test frontend files, with a 2-file allowlist and six named permanent exemptions; an import census guards the dead-code exemption. Outside: runtime rendering, test files, and the named allowlist and exemptions. | dead-code exemption importers `0` while the live comparison component has `29` -> zero unexcused sites, zero debt |
| Completion contract | Every `99-NN-SUMMARY.md` that exists in the phase directory. Outside: summaries not yet written — the guard asserts presence-implies-marker, never existence. An empty directory is refused rather than passed. | drilled directory with one marked and one markerless member -> `1/2` and exit 1; empty directory -> `INSTRUMENT-CANNOT-RUN` and exit 3 -> live phase directory `61/61`, exit 0 |

P99-39 ran both of its typed gates verbatim and recorded them in `99-39-SUMMARY.md`. That history
is **not** what satisfies P99-40's two command truths — P99-40's own executions above are.

## Rendered population and the port guard

P99-40's rendered population is exactly two independent invocations under `chromium-en`,
`--no-deps`, with one path per invocation:

- `tests/e2e/99-ar02-dates.spec.ts`: hardcoded expected count 8.
- `tests/e2e/99-ar03-leak.spec.ts`: hardcoded expected count 10, including
  `UI99-C7 ar banner under_review`, `approved`, and `published`.

Outside: every other Playwright spec and project, screenshots or prose from older waves,
diagnostic alternate-port runs, and any response served by another checkout.

P99-40's own observed results are:

```text
collected-from-target-spec=99-ar02-dates.spec.ts count=8 expected=8
pw-run-reaped: playwright exited code=0 signal=null; ... session reaped; verdict clean; report published

collected-from-target-spec=99-ar03-leak.spec.ts count=10 expected=10
pw-run-reaped: playwright exited code=0 signal=null; ... session reaped; verdict clean; report published
```

Each command exited `0`. A spec path is a **filter**, never proof of existence, which is why each
command asserts `test -f` and a hardcoded literal count before it is allowed to execute.

**What the port guard proved, and what it did not.** The prior attempt exited `3` twice because
PID 39807, rooted at the main checkout's `frontend`, held TCP 5173. That holder was released by
its owner before this attempt; this worker terminated nothing. At guard time in this run `lsof`
found **no** holder, so `test -n "$HOLDER"` was false and *neither* guard branch ran — no refusal,
and no `reusing dev server pid ...` line. Passing by the absence of a holder proves only that no
foreign tree was measured. The affirmative claim that the measured surface is **this** tree's
rests on a direct reading taken mid-run: `lsof -a -p 78860 -d cwd -Fn` resolved the live dev
server's cwd to this worktree's `frontend`. The dates run's server was spawned by the same wrapper
from the same worktree root and reaped clean; its identity was not separately read, and that is
stated rather than implied. After both runs the port had no holder and a worktree-anchored
`pgrep -af vite` count was `0`, so this attempt leaked nothing for the next runner.

`RULING-P99-537` forbids silently **reusing** a foreign holder; it does **not** compel terminating
one. Leaving another tree's process alone during the prior attempt rested on this task's authority
boundary, not on that ruling.

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

## D-38 human gate — OWNED BY P99-41

**The D-38 checkpoint owner is P99-41, not P99-40.** An earlier revision of this register claimed
P99-39 owned it. That claim was wrong and is withdrawn. It is settled by the compiled design, not
by a worker's reading of it:

- `99-39-PLAN.md` front matter carries `autonomous: true`, and none of its six `must_haves`
  requires an operator answer.
- `99-41-PLAN.md` front matter carries `autonomous: false`, and its must_have states: *"The human
  checkpoint presents: the 404, the intake queue, the search chips, a dated surface, the /activity
  relative-time surface and the position banner rendered under ar, plus the D-19 tie-break list
  from the nav-title lane — and the phase does not close until the operator answers"*.
- `rulings/RULING-P99-95-LAUNCH-ENGINE.md` names it twice: *"one human gate: terminal task
  P99-41"* and *"Human gate P99-41 remains blocked for the operator"*.

The D-38 sentence in `99-40-PLAN.md`'s `truths` — *"this plan is the phase's human gate"* — is the
lane's shared boilerplate: the identical string appears in `99-41-PLAN.md`'s `truths`. Where the
boilerplate and the compiled fields disagree, the fields and the ruling decide, and both name
P99-41. Reassigning ownership to an autonomous task would let an open landing decision read as
settled.

**What P99-40 produced:** the evidence package P99-41 puts in front of the operator, now refreshed
on **this task's own gate** rather than quoted from P99-39. Every surface the checkpoint must
present has a green from the two runs recorded above:

| Surface the checkpoint must present | Executed test | P99-40 own-gate result |
| --- | --- | --- |
| The 404 page in Arabic | `UI99-C5 ar 404` | `passed (8.7s)` — with `UI99-C5 en control 404 passed (6.2s)` beside it |
| `/my-work/intake` in Arabic | `UI99-C6 ar intake queue` | `passed (8.5s)` — with `UI99-C6 en control intake queue passed (6.1s)` beside it |
| The `/search` chips | `UI99-C8 ar search chips` | `passed (6.2s)` |
| One dated surface | `UI99-C1C2C4 ar /calendar`, `ar /dossiers`, `ar /events` | `passed (12.5s)`, `passed (14.2s)`, `passed (10.8s)` — each with its `en control` green |
| `/activity` relative time | `UI99-C3 ar /activity relative time` | `passed (12.9s)` — with `UI99-C3 en control passed (13.2s)` |
| The position banner in all three seeded states | `UI99-C7 ar banner under_review` / `approved` / `published` | `passed (11.8s)` / `passed (8.4s)` / `passed (11.4s)` |

Also prepared for that handoff: the D-19 tie-break table and the three escalated pairs above, the
swept-term census, and the residue register below.

**Deferred responsibility, not a bound:** the checkpoint asks the operator to see rendered
*captures*. P99-41 produces and presents those captures and blocks on the answer. P99-40 records
no bounded item; no overseer ruling id authorizes one, and none is needed.

**The answer is not P99-40's to record.** D-38 states that a human product or visual sign-off is
never auto-answered, and both lane plans restate it: *"the rendered sign-off is a HUMAN judgment,
never auto-answered by a worker, the orchestrator, or the engine"*.

| Checkpoint | Owning task | Who decides | Answer |
| --- | --- | --- | --- |
| Phase 99 rendered/product sign-off, and the D-19 reversal window | **P99-41** (`autonomous: false`) | Overseer, in writing; the orchestrator then executes `tickmarkr approve` | **OPEN — not reached.** P99-41 has not run. No worker, orchestrator, or engine answer is recorded, and none may be. |

**Why the front matter now says `status: complete`.** P99-40's deliverable was that both rendered
specs execute under its own gates. They did, both exiting 0. The marker records **this task's**
completion only. It is **not** a phase release and **not** a D-38 answer — that gate stays open
above, and flipping the ROADMAP/REQUIREMENTS rows remains the overseer's close-out act.

## Decision coverage

| Decision | How this register honors it |
| --- | --- |
| D-02 | Each of the four ROADMAP criteria has a named plan, a named oracle, a control, a written population, and an observed result; the two rendered rows carry P99-40's own fresh results. |
| D-05 | Every instrument states both its population and what falls outside it; the rendered population states its exclusions explicitly, and the port paragraph states what the guard did *not* prove. |
| D-07 | Criteria 2 and 3 close on executed rendered surfaces, not on a source grep; both Playwright specs are `command:` truths in the plan's own acceptance and both were executed here. |
| D-09 | One spec path per invocation, file existence asserted, and the expected counts hardcoded at 8 and 10 before execution — a spec path is a filter, never proof of existence. |
| D-19 | The reversal table, the three escalated pairs, and the per-row swept-term census are presented while the human window is open. |
| D-35 | Every D-35-named undriven leg — the 404, the ar intake queue, the `/search` chips and the position banner in all three states — was **driven and green under P99-40's own gate**. No leg closes on "NOT CONSTRUCTED" and no bound substitutes for one. |
| D-38 | The checkpoint is **P99-41's** (`autonomous: false`, named by RULING-P99-95). P99-40 records no answer and its `status: complete` marks task completion, never sign-off. |

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

- **BOUNDED ITEMS: none.** P99-40 has no written overseer ruling with a ruling id authorizing a
  bound, and needs none — every leg it owes executed. Every item below is a residue, deferred
  scope, escalation, closed population, or open engine debt; none is a bounded pass.
- **CLOSED — the P99-40 instrument blocker.** PID 39807 held TCP 5173 from the main checkout's
  `frontend` during the prior attempt, which correctly exited 3 twice rather than measure a foreign
  tree. The owner released that holder before this attempt; the two unchanged oracles then ran and
  exited 0. No process outside this worktree was touched in either attempt.
- **CONTAINED, not fixed — the leaked dev server.** `playwright.config.ts` configures
  `pw-run-reaped.mjs --lease-exec`, which runs **unleased** when Playwright is invoked ad hoc and
  can leak its dev server after a green run. P99-40's oracles route through the wrapper's RUN mode
  (`node "$R/scripts/pw-run-reaped.mjs" --`) as P99-08's oracle does, so the wrapper reaps what it
  spawned: both runs reported `session reaped; verdict clean`, and the port was left with no
  holder. That contains the symptom; it does not remove the leak.
- **OPEN, engine residue, still needs a ruling:** the unleased wrapper configuration itself.
- **OPEN — D-38:** the overseer's written sign-off, per the table above.
- **Phase 102:** D-21's working ~7,086-site dot-to-colon convention tail (new scope, after flatten,
  with resolution checks); COPY-09's three literals (`HelpPage:166`, `useBriefingBooks:164-165`,
  `PositionTrackerCard:93`); EDGECOPY-01's two edge functions; GUIDE-HOLLOW-01's seven bodies.
- **Phase 103:** the 39 criterion-1 members Phase 98 triaged by reading.
- **Operator naturalness review:** Arabic quality outside the seven ruled glossary rows.
- **Nav/title overseer escalations:** `navigation.admin`, `navigation.taskQueue`, and
  `navigation.newEvent` remain value-locked escalations, never agreements or worker-invented
  repairs.
- **Closed double-prefixed population, named:** the 37 historical `common:common.*` source keys
  were `about`, `actions.approve`, `actions.complete`, `actions.copy`, `actions.dismiss`,
  `actions.generate`, `actions.moveUp`, `actions.next`, `actions.openMenu`, `actions.previous`,
  `actions.refresh`, `actions.reject`, `actions.remove`, `actions.test`, `actions.thumbsDown`,
  `actions.thumbsUp`, `actions.toggleSection`, `actions.toggleWatch`, `actions.viewDetails`,
  `back`, `cancel`, `clear`, `close`, `delete`, `edit`, `error`, `export`, `loading`, `next`,
  `notYetAvailable`, `previous`, `reorder`, `save`, `saving`, `select`, `success`, and `view`.
  Later source repointing drove the live double-prefix count to zero; this is a named closed
  population, not a P99-40 rendered green.
- **Named lane handoffs:** `common:optional`; `common:tasks.sla.approaching`;
  `common:afterActions.decisions.item`; `common:afterActions.confidence`;
  `common:afterActions.commitments.{tracking,statuses,priorities}.*`; `common:contributors`;
  `common:days`; the scalar/object reminder-shape clash at
  `common:waitingQueue.reminder.{noAssignee,success,error}`; `WorkItemLinker.tsx`'s eight raw-key
  `common` sites; and `positions:draftBanner`. They remain named handoffs rather than being
  silently converted into bounds.

## What this task does not own

Per the plan's population statement: every other task's files, the exogenous paths (D-03), the
ROADMAP and REQUIREMENTS row flips and register close-out acts (the overseer's, never a plan's),
and every obligation P99-40's acceptance items do not name — those belong to the lane parts named
in `depends_on` and to P99-41 after it.
