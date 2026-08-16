---
phase: 94-write-paths
verified: 2026-08-16T16:38:44Z
status: human_needed
score: 5/5 success criteria verified (as currently worded); 9/9 requirements dispositioned
verifier_ran_own_derivations: true
gaps: []
human_verification:
  - test: 'Read the Arabic strings authored this phase (unified-kanban:errors.* ×4, common:afterActions.{loadError,notFound,notFoundDescription}, after-actions-page:degraded.engagementMissing, report-builder:generate.unavailable) as a native reader'
    expected: 'Natural, on-register Arabic — not merely grammatical'
    why_human: 'Key-set equality and EN≠AR string inequality are machine-checkable and were checked; naturalness is not. Standing operator park (RULING-P94-07); no artifact in this phase may claim it, including this one.'
  - test: 'Render the five repaired surfaces under dir="rtl" and inspect pixel layout'
    expected: 'No mirrored-layout defects'
    why_human: 'Pixel RTL is the inherited operator park (RULING-P93-06 order 2). Not measured by any Phase 94 artifact.'
---

# Phase 94 — INDEPENDENT Verification (gsd-verifier)

**Author:** the independent `gsd-verifier` seat — a population independent of the work
(`ACCEPTANCE-P94-EXEC.md` condition 3; the debt owed since `D-74`). This file is
`94-VERIFICATION-INDEPENDENT.md` by hard rule; `94-VERIFICATION.md` is the 94-11 executor's
closing register and was read as CLAIMS, never as evidence, and never edited (`D-29`).

**Mandate:** the five ROADMAP success criteria, goal-backward, by my own derivations. Every number
below that matters was re-measured by this seat with its own commands; where I relied on a recorded
observation instead (a state the fix made unobservable, or a run I chose not to repeat), I say so
explicitly in §8.

**Verdict up front.** The phase goal — _every advertised write path actually writes, and a failed
write says so_ — is delivered on the five criteria **as they are now worded**, and I reproduced the
closing register's load-bearing claims without finding a false one. My independent extensions found
one measured defect in a supporting instrument (the trigger sweep, §6.1 — a WARNING with a Phase 96
inheritance risk, not a criterion breach), and several state-changes and wording corrections (§6).
Status is `human_needed`, not `passed`, because two human items are genuinely open (frontmatter) —
both standing operator parks that no automated pass can absorb.

---

## 0. Instrument preconditions (this seat's own)

| precondition                 | how held                                                                                                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| working tree at start        | **DIRTY with 7 pre-existing operator paths** (4× SKILL.md, CLAUDE.md, untracked AGENTS.md + tickmarkr.spec.md). Not clean as the brief assumed; none is mine, none was touched; `git status --porcelain` re-checked before this file was written: byte-identical to start. |
| `grep` wrapper trap          | every sweep used `command grep`, explicit file args, `find … \| xargs`, or `node`. Zeros instrument-tested (e.g. ARMA-01's 0 against a positive control of 2 on the same file in the same run).                                                                            |
| exit codes                   | captured directly (`echo "X_EXIT=$?"` immediately after the command), never through a pipe.                                                                                                                                                                                |
| Playwright paths are filters | one spec path per invocation, `test -f` first, expected count hardcoded (1, 2, 1).                                                                                                                                                                                         |
| `E2ECRED-01`                 | no run here depends on the `setup` project; the three specs used their own inline auth; no credential echoed.                                                                                                                                                              |
| `ORACLECAP-01`               | my oracle runs were spaced ~2.5 h after the register's recorded runs; none hit the auth wall.                                                                                                                                                                              |
| shell                        | derivation loops ran under `bash` or `node`; drill identity not needed (no drill commits made by this seat); no `git config` write of any kind.                                                                                                                            |

---

## 1. Repo-state derivations (the population everything else sits on)

- `git tag -v phase-94-base` → exit 0, prints the tag body; `rev-parse` →
  `3d63da95f63102bc7739603d112f8e34385e523c`. **VERIFIED.**
- Exec leg `d5c582e0f..HEAD` = **53 commits, all authored `Khalid Alzahrani`**. The two
  `drill <drill@local>` commits in `phase-94-base..HEAD` are **planning-leg** (both are ancestors of
  `d5c582e0f`): `13d79a454` (the ruled `94-11_g1` gate edit, `RULING-P94-05`, drilled red + green
  twice with the independent-artifact-present discriminating control — which is also why my writing
  this file cannot red that gate) and `c58d124df` (ROADMAP plans-block repair). No repo-local
  `user.*` override exists in `.git/config` — the worktree-identity trap left no residue.
- **Changed-file population** `phase-94-base..HEAD`: 104 paths; 73 outside `.planning/.tickmarkr`
  (list pinned in this seat's run log). Exactly **1 migration**
  (`20260816500001_p94_report_rls_recursion.sql` — "the phase's only schema change" holds).
  Exactly **30** `supabase/functions` paths = `_shared/audit.ts` + **27** writers +
  `after-actions-list-all` + `after-actions-publish` — the claimed populations, reproduced from the
  diff, not from any document.
- **PLAN-file edits inside the exec leg**: exactly one — `94-01-PLAN.md`, a `files_modified`
  frontmatter addendum citing `RULING-P94-09` (the PARK-EXEC-01 scope authorization). **Not gate
  text.** Zero `<automated>` gate text moved in the exec leg (condition 2 holds as stated for this
  leg).
- `GRANT SELECT ON auth.users`: **0 occurrences** in the phase's migration diff and in the shipped
  migration file. The standing prohibition held.

**Outside this population:** anything before `phase-94-base`; the operator's dirty-tree files;
`.tickmarkr/` history (read as claims only).

---

## 2. The five success criteria — each re-derived by this seat

Populations: the named files at HEAD (static), live staging `zkrcjzdemdmwhearhfgg` (DB facts), and
my own oracle executions (behavioral). "Register agrees" means I checked its claim _after_ my own
measurement and they matched.

| #   | criterion (as now worded)                                                                                                                                                                                              | my derivation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | status     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 1   | after-action create/save/publish from engagement UI                                                                                                                                                                    | Static: `AfterActionForm.tsx:476` `disabled={saving \|\| publishing \|\| (initialData ? !isDirty : !hasContent)}` — create-mode Save gates on content, the `:132` guard is edit-mode-only by design (the criterion's _pin_ is broken in effect: create-mode Save no longer reads `isDirty` at all). Route `:43` derives `canPublish` from role; `:204-205` passes `canPublish` + `onPublish`; `handlePublish` = create → publish → navigate, catch → translated toast, no `.message`. Behavioral: my vitest run — `AfterActionForm.test.tsx` + `after-action-route-wiring.test.tsx` green (in the 14-file battery below). Deployed: `after-actions-publish` **v13 ACTIVE** re-read from the live function list by MCP.                                                                                                                                                                                                                           | ✓ VERIFIED |
| 2   | `/after-actions` lists; detail renders translated copy, not the raw key                                                                                                                                                | Static: `after-actions-list-all` composes with two batched `.in('id', …)` lookups, zero `!inner`; detail route `role="alert"` at `:66`, colon-form `t('common:afterActions.loadError')` at `:70`. Behavioral, my runs: `node scripts/probe-after-actions-list.mjs` → exit 0, `engagement===null: 0`, `dossier===null: 0`; `after-action-detail-error.spec.ts` → **1 passed** (forced query error renders translated copy, no raw key). Population limit stands: staging holds ONE record — a partial-drop cannot be exercised (register agrees, §8 item 4 there).                                                                                                                                                                                                                                                                                                                                                                                | ✓ VERIFIED |
| 3   | `/intake/new` submits; picker writes the field the schema reads                                                                                                                                                        | Static: `dossierId: z.string().min(1, …)` — no `.uuid()`; `setValue('dossierId', …, { shouldValidate: true })` at both sites (`:86`/`:89`). Live: **44 dossiers, 35 non-RFC-9562** by my own SQL — the register correction's exact numbers. Behavioral: `IntakeForm.test.tsx` green in my battery (real Zod schema is the subject).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | ✓ VERIFIED |
| 4   | commitment drag persists exactly when the DB permits; coercible drags refused pre-write, bilingual reason; stored value = written-or-told; no success-then-snap-back; no "Operation completed successfully" on a no-op | Live: `aa_commitments_status_check` re-derived by my own MCP query — **five values, no `review`**, byte-identical to the guard module's header. Static: one shared decision module (`commitment-stage-guard.ts`, discriminated union, no-throw) consumed by BOTH enforcement points (`useUnifiedKanban.ts` reject with 4 bilingual keys; `BoardColumn.tsx` droppable predicate via real `useDndContext`); `resolveBoardStage` matches derivation 1's five-row mapping; `isCancelled` filters before bucketing. Behavioral, my runs: guard 14 + WorkBoard 15 + BoardColumn tests green; `probe-commitment-readback.mjs` → exit 0 — future-due write **persisted verbatim** (read-back `in_progress`), past-due control **observed coerced** to `overdue`, census `{overdue:8, pending:2}` identical before/after. Trigger source re-read live: coercion fires only on `pending`/`in_progress` — which also confirms the W4 hole's mechanism (§7). | ✓ VERIFIED |
| 5   | every `/settings` tab saves (nine-section population; child routes named exclusion) + survives reload; report reads, CRUD, schedule creation without `42P17`                                                           | Static: users write is `.update(…).eq('id', user.id)` (`:219-229`); the one surviving `.upsert(` targets `notification_category_preferences` with `onConflict` — legitimate. Live: the three `report_shares` policies re-read from `pg_policies` by my own query — all route through `is_report_owner`, **zero** `custom_reports` references remain; the definer function pins `search_path`. Behavioral, my runs: `settings-save.spec.ts` → **2 passed** (profile save + notification-bridge toggle both survive a full reload); `probe-report-rls.mjs` → exit 0, **A=1 / B=1 / C=0**, no `42P17`, schedule created, fixtures cleaned to 0/0/0. Population B (five child routes) remains a **stated untested exclusion** — the criterion's own wording carries it.                                                                                                                                                                              | ✓ VERIFIED |

**Score: 5/5.**

### The rewordings, judged as instructed

- **Criterion 4** (`RULING-P94-03` order 2): **not weaker — stronger, and narrower in one honest
  way.** It adds the coercion-refusal, the stored-equals-told invariant, and the snap-back
  prohibition, and it forbids "no error shown" as a pass. The narrowing: the original's "Kanban
  accepts commitment drags" implicitly promised acceptance of drags the live trigger would silently
  rewrite — a promise whose keeping _was the lie_ (success toast, then snap-back, proven against
  staging in `PARK-94-04`). Refusing those drags with the real reason is the honest form of the
  same promise. The original's four-value-lifecycle premise was factually wrong (five, measured).
- **Criterion 5** (`RULING-P94-04` §PARK-94-06): **WEAKER than the original, and I say so.** The
  original `WRITE-06` said "Report generation works." The reworded criterion delivers the field-name
  contract (`template`→`type`, verified in the invoke body at `ReportsPage.tsx:187`) **paired with an
  honest `unavailable` terminal state** — and defers actual generation, because the deployed
  function's generate path is a mock (`setTimeout` + `console.log`, `reports/index.ts:266-285`,
  verified untouched since base by my diff: 0 lines). A user still cannot generate a real report
  after Phase 94. The debt is filed (`DEAD-09`, owner Phase 95, queued in the status table — row
  verified present at line 520). The weakening is disclosed, ruled, and owned; it is still a
  weakening of the user-visible promise, and any accept ruling should read it as one.

---

## 3. The nine requirements

`WRITE-01..06`, `AUDIT-DROP-01`, `AUDIT-ZERO-01`, `ARMA-01` — each checked against my §2/§4/§5
derivations. All nine are dispositioned as the register's §7 states, and I found no disposition
whose evidence failed under my re-derivation. Named residue I re-confirmed as real (not silently
absorbed): the parse CLASS behind `WRITE-01` (`EDGEPATH-01` → P100, status row present), Population
B (`WRITE-05`), `DEAD-09` (`WRITE-06` → P95), the spread-payload class (`AUDIT-ZERO-01`, see §4),
W4 (§7). The nine ROADMAP/REQUIREMENTS checkboxes are still unflipped — correct at this stage; the
flip is the orchestrator's single close-out act after acceptance.

Highlights of my own requirement-level measurements (beyond §2):

- **AUDIT-DROP-01** — `logSecurityEvent` inserts the real `audit_log` columns (`entity_type:
'security'`, `additional_context`, derived `tenant_id` via `profiles.user_id` →
  `users.default_organization_id`, loud SKIP when unresolvable), **destructures `error` and logs it
  loudly**. Live: `audit_log` columns re-derived by my own query — the 13-column set matches the
  code exactly. Backend oracle re-run by me: `audit-write.test.ts` + `auth.service.test.ts` →
  **2 files, 28 tests, exit 0**.
- **AUDIT-ZERO-01** — see §4. Live `audit_logs` count at my read: **9** (→10 after my probe run) —
  the "no longer empty for the first time" claim is a live fact.
- **ARMA-01** — my own greps: `query-error-state` → **0**, positive control `notFoundPage` → **2**,
  same file, same run; my own spec run: `93-report-notfound.spec.ts --project=chromium-en
--no-deps` → **1 passed** (the 404 arm alone).

---

## 4. AUDIT-ZERO-01, both directions, my own instrument

I authored my own key-diff parser (not the register's), enumerated `supabase/functions` with
`fs.readdirSync` recursion, matched `from('audit_logs')`/`from("audit_logs")` + `.insert/.upsert`,
extracted top-level literal keys, and diffed against the live column set fetched by my own MCP
query in the same session.

| tree                                              | scanned   | matched | writers | broken |
| ------------------------------------------------- | --------- | ------- | ------- | ------ |
| `phase-94-base` (positive control, `git archive`) | 320 `.ts` | 38      | 35      | **26** |
| HEAD (derivation of record)                       | 321 `.ts` | 12      | 9       | **0**  |

The base run names 26 of the filed 27 with exactly the filed bad-key classes (`event_type`,
`resource_type`, `changes`, `metadata`, `target_user_id`, `details`, `actor_id`). The 27th —
`complete-access-review` — was **missed by MY parser** (its nested `changes:{before,after}` literal
defeats my lazy match); reading the file at base shows the broken insert plainly, so the register's
**27 is correct and my instrument under-matched by one**. I state this adjudication rather than
hiding it: the two instruments disagree by one, the disagreement was resolved by reading the
subject, and it resolved **against** my instrument.

Because my parser has a demonstrated miss-mode, I closed the HEAD zero a second way: enumerated
every HEAD file still touching `audit_logs` (`find | xargs command grep -l`) and read each insert's
keys directly — all real columns (the intake family, `delegate-permissions`, `revoke-delegation`
— whose suspicious `is_active` is a nested jsonb key inside `old_values` — and the helper);
`dossier-export-pack` is a **reader** (`.select`), not a writer. **Deploy evidence:** my own regex
count of `94-DEPLOY-LEDGER.md` verdict-last rows → **27 OK / 0 FAIL**; live function list re-read by
MCP: the writer fleet (sample: `assign-role` v6, `create-user` v7, `inactive-users` v6,
`setup-mfa` v6, `commitments-update-status` v13) all redeployed today; `probe-audit-row.mjs` under my
own run → exit 0, count 9→10, row `entity=commitment … user_role=admin` through the **deployed**
function, fixture deleted HTTP 204. (Per the phase's standing decision, that evidence row is kept;
my verification therefore added one row to `audit_logs`.)

**Outside my population, same as the register's:** variable-assembled spread payloads
(`.insert(payload)`) — still unmeasured, still open; the backend tree (covered separately, §3);
`link_audit_logs`.

---

## 5. Where I checked the register's own numbers with my own hands

| register claim                                                                                                  | my measurement                                                                                                                                                                                                                                                                                                                                                                                                  | verdict                                              |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| derivation 1 (five-value constraint; reverse mapping)                                                           | constraint re-derived live: identical; `resolveBoardStage` read at HEAD: identical mapping                                                                                                                                                                                                                                                                                                                      | CONFIRMED                                            |
| derivation 3 (38/36/27/9/2 base; 12/10/0 HEAD)                                                                  | my parser: 38 matched at base ✓, 26 vs 27 broken (adjudicated against my parser, §4); HEAD 12 matched ✓, 0 broken ✓                                                                                                                                                                                                                                                                                             | CONFIRMED (with one instrument-delta explained)      |
| derivation 4 (231/231, 12/12, 1/1, 1/1, all EQUAL, 0 identical)                                                 | my own flattener: byte-for-byte the same four subtree results                                                                                                                                                                                                                                                                                                                                                   | CONFIRMED                                            |
| derivation 4's OPEN finding (`common.json` EN 1087 / AR 1099, twelve `dossierLinks.entityTypes.*` AR-only keys) | my own whole-namespace diff: **exactly reproduced, key for key**                                                                                                                                                                                                                                                                                                                                                | CONFIRMED — real, open, correctly routed to Phase 99 |
| derivation 5 (27 verdict-last OK rows)                                                                          | my own `command grep -cE` → 27 OK, 0 FAIL                                                                                                                                                                                                                                                                                                                                                                       | CONFIRMED                                            |
| derivation 7 / ARMA-01 (0 vs control 2)                                                                         | my own greps + my own spec run (1 passed)                                                                                                                                                                                                                                                                                                                                                                       | CONFIRMED                                            |
| §4.2 oracle set green                                                                                           | re-run by me: 4 probes exit 0; 3 specs 1+2+1 passed; vitest 14 files/115 + 2 files/28                                                                                                                                                                                                                                                                                                                           | CONFIRMED                                            |
| 94-08_g3 parity (self-certifying gate)                                                                          | **re-derived by my own hands**: live `prosrc` of `sync_task_status_from_workflow_stage` vs `STAGE_TO_STATUS` at HEAD — all five cells MATCH. The gate is self-certifying; its content is honest.                                                                                                                                                                                                                | CONFIRMED                                            |
| WRITE-03 correction (35 of 44 dossiers non-RFC)                                                                 | my own SQL: total 44, non-RFC 35                                                                                                                                                                                                                                                                                                                                                                                | CONFIRMED                                            |
| §6.5 (four ids queued nowhere)                                                                                  | **STATE CHANGED since the register was written:** all four rows (`COPY-06`, `COUNT-04`, `EDGEPATH-01`, `FUNC-GRANT-01`) now exist in the status table (commits `79bdf0eb5`, `febe7f134`). The finding was real and has been discharged.                                                                                                                                                                         | CONFIRMED-THEN-DISCHARGED                            |
| §8 item 1 (user-management consumer not run)                                                                    | **STATE CHANGED:** run once at HEAD under `RULING-P94-11` (`PARK-EXEC-04` addendum, commit `38fc132e2`): **RED**, timeout at the create leg, labelled _run-blocked-by-pre-existing-defect_ (the Phase 86 create-user hang), no repair, staging clean (0 users created). The gap is now a labelled measured state, not an unmeasured one — and the consumer has still **never been observed green post-change**. | CONFIRMED, now labelled                              |
| A1 (the `42P17` RED baseline as `authenticated`, pre-migration)                                                 | `94-05-SUMMARY` carries the live observation (`HARD FAIL — 42P17 … as A (HTTP 500)`, probe exit 1) made BEFORE the migration; the fix then made it unobservable. Inherently unreproducible now — I verified the recorded observation exists with its output, which is the strongest available check. The negative is **no longer inherited**.                                                                   | CONFIRMED (recorded observation)                     |

**Discrepancies found (none load-bearing):** (a) §1.3's sentence "Zero gate text was edited anywhere
in this phase" is overbroad — one **ruled** gate edit exists in the planning leg (`13d79a454`,
`RULING-P94-05`), disclosed by the register's own §1.2 row; the sentence is true of the exec leg
only. (b) §6.2's `conflict.*` line-number cites (`:106, :166-167, :179`) have drifted (now ~`:111,
:174, :188`) — cosmetic. (c) The register's derivation-3 file counts (323/324) differ from mine
(320/321) because I walked `.ts` only — same population conclusion.

---

## 6. Independent extensions — what I measured that no phase artifact had

### 6.1 The trigger sweep's completeness: no longer "asserted" — MEASURED INCOMPLETE (WARNING)

The plan leg's `P94-TRIGGER-SWEEP.md` (D-34) matched BEFORE-trigger bodies with
`prosrc ~* 'NEW\.[a-z_]+\s*:='` and reported **29 triggers / 25 tables**, itself flagging that a
"differently-spaced assignment" would be missed and that no negative control was run. I ran the
control it never had, live:

- The sweep's own regex reproduces **exactly 29/25** — its number is honest for its rule.
- Plain-`=` assignment (**legal PL/pgSQL**) at statement position matches **164 further BEFORE
  triggers across 157 tables** the sweep structurally could not see. The true class is ~193; the
  sweep saw **15% of it**.
- **On Phase 94's write-path tables the missed set is 8 triggers, every one a bare
  `NEW.updated_at = now()`** — benign, so **no Phase 94 criterion is affected** and the sweep's
  "clean" list is right in substance while wrong as worded ("no rewriting BEFORE trigger" should
  read "no _semantically meaningful_ rewriting").
- Schema-wide, the missed set includes **meaningful** rewrites: `staff_profiles.version`,
  `assignments._version`, `entity_comments.is_edited`/`edit_count`,
  `organization_leadership.is_current`, `legislations.version`, `intelligence_sources.next_scan_at`.
  **Phase 96 (Real Numbers) inherits a sweep that misses 85% of its class** — the ruling's own logic
  ("a confirmed single-site miss is a class") applies to the instrument itself. Needs an owner id
  from the orchestrator; the natural home is the Phase 96 planning inputs.

### 6.2 `is_report_owner` and PUBLIC EXECUTE — converged, not new

I independently observed that the migration issues no `REVOKE … FROM PUBLIC`, so the new definer
function carries the default PUBLIC grant. This is **exactly `PARK-EXEC-02`**, already parked, ruled
not-repaired-here, and generalized as `FUNC-GRANT-01` (P100, queued). Two seats reaching the same
defect independently is corroboration; nothing new to file.

### 6.3 Condition-9 precision: one plan closes on a ruled park, not an empty BLOCKED

The BLOCKED law says a plan closes when its BLOCKED section is read **and is empty**. My read of all
11: nine say "None"; `94-01`'s is cleared by a ruled in-file addendum (`RULING-P94-09`, repair
landed, gate green); **`94-10`'s BLOCKED is NOT empty** — it carries the user-management consumer
item, since converted to the labelled park `PARK-EXEC-04` under `RULING-P94-11` (run RED,
attributed, no repair). As worded, condition 9 is met by ten plans and met-by-ruling on the
eleventh. The grading of that substitution belongs to the acceptance seat; I state the fact.

---

## 7. The intended-broken register — re-verified from the population side

My check is structural and stronger than re-running the error-state specs: the **full changed-file
population** (§1) contains **no** delegations, analytics, tasks-queue, data-retention, or
`reports/index.ts` path — no plan _could have_ repaired an intended-broken surface without
appearing in this diff. `DEAD-09`'s mock is byte-untouched since base (diff: 0 lines; mock read at
`:266`). `COPY-06`'s literal is untouched (`query-client.ts` not in the diff). No
`GRANT SELECT ON auth.users` anywhere (§1). The register's four live spec re-runs (each green _by
asserting the error state_) stand as the exec leg's own evidence; I did not repeat them — the
population proof covers the "no repair" half, which is the REJECT-bearing half, and my one root-spec
run (§3, ARMA-01) doubles as a live sample of that config. One live observation to hand Phase 95:
`assignments-queue` **is deployed** (v11, ACTIVE, deployed ~July) — `/tasks/queue`'s breakage is
therefore not "function absent"; its mechanism is Phase 95's to characterize.

**W4 stays open and unpinned, and its mechanism is now live-confirmed by this seat:** the coercion
trigger fires only on `pending`/`in_progress`, so a `completed` write on a past-due row persists —
a release over the disabled In-progress column that dnd-kit retargets to Done writes `completed`
behind the global success toast. As reworded, criterion 4 is not violated (the landing is visible;
stored equals told); the hazard is real, recorded, and has **no oracle**. It should carry an id and
an owner (Phase 96 revisits the interaction per the ruling's switch note).

---

## 8. What THIS verification did NOT establish

1. **The whole-set gate drill was not re-run by this seat.** Re-running all 31 gate texts verbatim
   would have doubled today's auth-heavy load against `ORACLECAP-01` for little marginal truth: I
   re-ran every behavioral component of `94-11_g2` individually (4 probes, 3 specs, both vitest
   batteries, the tag check) and re-derived the substance of the drill-covered gates I could reach
   statically. The claim "0 exited 0 → 28 exited 0, one instrument, two runs" rests on the
   register's recorded runs plus the per-SUMMARY both-direction tables, which I checked
   mechanically (11/11 SUMMARYs carry gate tables with red AND green observations) and deep-read
   for 94-01, 94-05, 94-10, 94-11.
2. **The RED direction was sampled, not reproduced wholesale.** I verified red-direction evidence
   as recorded per SUMMARY and spot-verified base-tree absences (guard module, migration, canPublish,
   broken audit keys at base by my own parser); I did not rebuild the undone tree and re-run 31 gates
   against it.
3. **`user-management.spec.ts` has still never been seen green post-change** (§5). The labelled
   state is honest; the coverage hole is real until Phase 90/ops clears the create-user hang.
4. **The spread-payload audit class and RLS `WITH CHECK` zero-row class** remain unmeasured — I
   confirmed the boundary, I did not close it.
5. **Arabic naturalness and pixel RTL** — outside every automated instrument, including mine
   (frontmatter). I verified key-sets and EN≠AR inequality and stopped, as required.
6. **The list oracle's population is one record** — re-confirmed; a partial drop is unexercisable
   on today's staging data.
7. **`P94-EXEC-REPORT.md` did not exist when this file was written** — condition 11's artifact was
   pending at my verification time; whatever it says, it was not an input to this seat.

## 9. Why this green would have caught a defect

Every criterion was checked at **two independent levels with different failure modes**: a static
read of the exact seam the criterion names (which fails on a stub, a wrong field, a missing branch)
and a live oracle run by my own process (which fails on a deploy gap, an RLS surprise, a regression
between the register's run and now). The probes carry their own negative halves (C=0 through the
same path that returned A=1/B=1; the coercion control differing from the persist case only in
`due_date`; the audit delta pinned to a named row through a deployed function), so a blanket-empty
or blanket-pass defect reads as a FAIL, not a pass. Where my instrument and the register disagreed
(26 vs 27), the disagreement was surfaced and adjudicated by reading the subject — in the
register's favor, which is exactly the behavior that would have caught the opposite case. And the
independent extensions (§6.1) prove this pass had teeth: the same battery that confirmed the
criteria **did** find a measured defect where one existed — in the instrument this phase leaned on
but never controlled.

---

_Independent verifier · fable · 2026-08-16 · base `phase-94-base` (`3d63da95f`) · staging `zkrcjzdemdmwhearhfgg`_

VERIFIER-INDEPENDENT-END
