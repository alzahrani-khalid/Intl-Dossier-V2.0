---
phase: 94-write-paths
plan: 11
type: verification
author: 94-11 executor (single author, whole plan set, one pass)
base_tag: phase-94-base (3d63da95f, SSH-signed, verified)
created: 2026-08-16
---

# Phase 94 — Closing Verification

**What this document is.** The phase's closing derivations, each with its POPULATION stated; the
whole-set gate drill (GATE-STANDARD C1, both directions); the behavioural oracle set re-run; the
C9b cross-phase consumer table with its mock-vs-real column; the intended-broken register; and the
disposition of all nine requirements.

**What it is NOT.** It is not the independent verifier's artifact — that is
`94-VERIFICATION-INDEPENDENT.md`, written by the independent `gsd-verifier`, and this plan neither
writes nor claims it (`D-29`). It is not a statement that the phase is clean: §9 names what these
derivations did not establish, and every derivation below carries what falls outside it.

---

## 0. Instrument preconditions (asserted before any number below was believed)

<!-- prettier-ignore -->
| precondition | command | result |
| --- | --- | --- |
| base tag exists and is signed | `git rev-parse phase-94-base^{commit}` · `git tag -v phase-94-base` | `3d63da95f63102bc7739603d112f8e34385e523c`; verification prints the tag body, exit 0 |
| `grep` is a `.gitignore`-honouring ugrep wrapper | — | every sweep below uses `command grep`, explicit file arguments, `find … \| xargs`, or `node`. No bare recursive `grep` from the repo root. |
| exit codes captured directly | — | never through a pipe. Where a pipe was unavoidable the value read is `$pipestatus[N]` (zsh), stated at the site. |
| `timeout` does not exist here | — | no gate or derivation invokes it. |
| zsh does not word-split | — | every multi-root sweep ran under `bash` or inside `node`. |

**Every zero below was instrument-tested against a token known to be present before it was
believed.** Where a first instrument failed that test it is recorded as a discarded measurement
(derivation 6 has one), not silently replaced.

---

## 1. THE GATE DRILL — whole plan set, both directions

**Procedure (`D-23`, GATE-STANDARD "The pass procedure"): one author, all 31 gates, all eleven
plans, in one pass.** The mechanical half is `scripts/gate-drill.mjs`; the construct-the-done-state
half is per-gate and stays authored.

### 1.1 The two whole-set runs

<!-- prettier-ignore -->
| direction | tree | command | result |
| --- | --- | --- | --- |
| RED | undone (pre-execution), run by the orchestrator today | `node scripts/gate-drill.mjs .planning/phases/94-write-paths` | `31 gates · 31 parsed · 0 parse-fail · **0 exited 0**` |
| GREEN | done (this tree, all ten plans executed) | `node scripts/gate-drill.mjs .planning/phases/94-write-paths --timeout 900` | `31 gates · 31 parsed · 0 parse-fail · **28 exited 0**` |

The three that did not exit 0 in the GREEN run are `94-11_g1` (exit 1), `94-11_g2` (exit 2) and
`94-11_g3` (exit 2) — this plan's own gates, all three of which assert against **this file**, which
did not exist while that run executed. Their both-directions rows are in `94-11-SUMMARY.md`, which
is where the executor brief requires them.

**`0 exited 0` → `28 exited 0` is the phase's red→green observation, measured by one instrument, in
two runs, over the whole set.** It is not a substitute for the per-gate C1 work below: the script's
own header says so, and a green from it is not evidence a gate is sound.

### 1.2 Per-gate C1 table

`C1 red` = the observation on the undone tree. `C1 green construction` = how the work-done state was
built. `verdict` ∈ `SOUND` / `REPAIRED` / `CANNOT CONSTRUCT`.

Rows for `94-01..94-10` cite the executing lane's recorded observation **and** the two whole-set
drills above. The lane observations are claims checked against the drill, not copied: every one of
the 28 is independently green in the GREEN run, and every one was `exit != 0` in the RED run.

<!-- prettier-ignore -->
| plan.gate | C1 red (undone tree) | C1 green construction | C2–C10 exceptions | verdict |
| --- | --- | --- | --- | --- |
| `94-01_g1` (:117) | `EXIT=1`; vitest passed, so the chain reached its assertion — `create_mode_count=0` (needs ≥3) | create-mode cases authored; `create_mode_count=5`, `Tests 31 passed` | greps instrument-tested both directions | SOUND |
| `94-01_g2` (:144) | `EXIT=1`; `grep -c 'canPublish' after-action.tsx` → `0` | route passes `canPublish` + two-step `onPublish` | C8: the surviving `toast.error(t(…))` carries no `.message` | SOUND |
| `94-01_g3` (:191) | `EXIT=1`; probe reached its subject, created a draft, then `[status=404]` from the deployed fn | `after-actions-publish` id-source repaired and **deployed v13**; probe reads back `published` | C2: the red was a true product defect, not tooling. Green required a deploy, obtained | SOUND — and the only gate in the phase whose green needed an out-of-scope repair (`PARK-EXEC-01`, `RULING-P94-09`) |
| `94-02_g1` (:98) | `EXIT=1`; vitest **passed** in the red run, so the red is `test 0 -ge 2` on the `shouldValidate` clause | two single-line `setValue('dossierId', …, { shouldValidate: true })` sites; `Tests 4 passed` | C2 satisfied explicitly (chain reached its assertion of record) | SOUND |
| `94-02_g2` (:122) | `EXIT=1`; `RFC-9562` → 0, `35 of 44` → 0, positive control `WRITE-03` → 2 | register prose rewritten with the zod derivation | C8: markers are derivation content, not prose about them | SOUND |
| `94-03_g1` (:136) | `EXIT=1`; `No test files found` — the guard module did not exist | `commitment-stage-guard.ts` + 14-test oracle | — | SOUND |
| `94-03_g2` (:165) | `EXIT=1`; D-08 clause instrument-tested in the CAN-FIRE direction first (`description: .*error.message` → 1) | mutation-layer refusal, four bilingual keys, D-08 repair; clause now 0 | trap 10 addressed head-on: the clause was proven able to fire before it was relied on | SOUND |
| `94-03_g3` (:189) | `EXIT=1`; vitest **passed**, red came from `resolveBoardStage(item)` → 0 | no-op guard rewritten; `Tests 15 passed`; negative control failed exactly the 3 new assertions | C7 present (`phase-94-base` anchored) | SOUND |
| `94-04_g1` (:94) | `EXIT=1`; non-comment `.upsert(` = **2** (wants 1), `description: detail` = **1** (wants 0) | `.update(…).eq('id', user.id)`; counts 1 / 0 | **C10/vacuity: clause 2 (`.eq('id', user.id)`) was ALREADY GREEN at the base tag** — line 155 is the SELECT. See §1.3 | SOUND overall; one inert clause |
| `94-04_g2` (:118) | `EXIT=1`; `settings-save.spec.ts` `No such file or directory` — the existence precondition | 2-test reload-persistence spec; `2 passed (17.0s)` | C6: frontend config has no dependency projects, so `--list` is not inflated — verified, not assumed | SOUND |
| `94-05_g1` (:109) | `EXIT=1`; migration file absent | migration authored | **file-shape only** — cannot distinguish written from applied. Covered by `g2` + the MCP apply/`pg_policies` paste | SOUND (stated-narrow) |
| `94-05_g2` (:142) | `EXIT=1` twice: literal (script absent) and **substantive** — probe authored first and run pre-migration: `42P17 infinite recursion detected in policy for relation "custom_reports"` | migration applied via MCP; `A=1 / B=1 / C=0`, schedule created, fixtures cleaned | C2: the `42P17` baseline as `authenticated` had never been observed before; observed here, then made unobservable by the fix | SOUND — the strongest red in the phase |
| `94-05_g3` (:166) | `EXIT=1`; arm-(b) residue count `3` (lines 17/74/88) | arm (b) deleted; `1 passed (3.8s)` | C6/D-26/D-27: `--no-deps`, inline auth, hardcoded count. Ordered strictly after the migration (D-02) | SOUND |
| `94-06_g1` (:114) | `EXIT=1`; `_shared/` held 16 helpers, none audit | `_shared/audit.ts` authored | **file-shape only** — a correct shape against a wrong table would pass. Compensated by live PostgREST insert/read-back/delete | SOUND (stated-narrow) |
| `94-06_g2` (:143) | `EXIT=1`; all six clauses red independently | both backend writers repaired; `tsc` clean | **C8 positive dual: four of six clauses are bare substring greps a comment alone would satisfy.** Satisfied here by real code | SOUND but weaker than it reads |
| `94-06_g3` (:165) | `EXIT=1`; `No test files found` | `backend/tests/unit/audit-write.test.ts`; `Tests 4 passed` | was plan-check blocker `B5` (piped exit code) — confirmed repaired; oracle positive-controlled by injecting a non-column key → `Tests 1 failed` | SOUND |
| `94-07_g1` (:129) | `EXIT=1`; probe absent, `!inner` count **2**, `.in('id'` absent | two-query rewrite + **redeploy**; probe: `rows with engagement === null : 0`, `PASS` | **NOT CONSTRUCTED: the probe was never run against a live inner-join bundle** (would mean redeploying a known-broken fn to shared staging). The old failure mode was reproduced read-only: `PGRST200` | SOUND, with a named unconstructed arm |
| `94-07_g2` (:165) | `EXIT=1`; all five clauses red, incl. `err.message` count **1** | bilingual keys + colon form + degraded row; `Tests 10 passed`, spec `1 passed` | D-26: `--list` asserted `Total: 1 test in 1 file` **before** the run | SOUND |
| `94-07_g3` (:193) | `EXIT=1`; `PGRST200` → 0, `PARK-94-05` → 0 | register + context corrections | **clause 3 (`**D-12:`) was ALREADY GREEN — a REGRESSION GUARD, declared as such.** It stops the correction being written by deleting the marker the coverage extractor keys on | SOUND; 1 of 3 clauses is a guard |
| `94-08_g1` (:121) | `EXIT=1` at clause 1 (`useDndContext` absent) | droppable predicate against real dnd-kit 6.3.1 | **clause 3 (`data-droppable-id`) already green — REGRESSION GUARD** for the Phase 39 selector contract five e2e specs key on | SOUND; 1 of 3 clauses is a guard |
| `94-08_g2` (:150) | `EXIT=1`; probe absent | live write-then-read-back through a user JWT + past-due coercion control | not a credentials-absent exit 2; every assertion reached its subject | SOUND |
| `94-08_g3` (:173) | `EXIT=1`; parity artifact absent | live `pg_proc.prosrc` + sha-pinned client map; all five cells MATCH | **SELF-CERTIFYING: the gate cannot distinguish a live derivation from a hand-typed `PARITY: MATCH`.** Its red-direction power depends on the author writing the failing verdict | SOUND *given an honest author* — recorded, not repaired |
| `94-09_g1` (:100) | `EXIT=1`; every clause decomposed and measured red **independently** | rename + pure mapping + bilingual key | `g1.c7` (`type-check`) was green at baseline — labelled a **no-regression clause**, not counted as a red | SOUND |
| `94-09_g2` (:129) | `EXIT=1`; `generate-entry.ts` absent (`exit=2`) | pure mapping module + 5 cases; falsified by reproducing `PARK-94-06`'s forbidden shape → `EXIT=1` | clause 3 is satisfied by the **import line alone**; the pairing is closed by `c5`/`c4` in combination | SOUND; clause 3 weak |
| `94-09_g3` (:155) | `EXIT=1`; `DEAD-09` count 0, `PARK-94-06` absent | `DEAD-09` filed with entry + status-table row | marker-shape check; falsified by deleting the table row → `count 1`, `EXIT=1` | SOUND |
| `94-10_g1` (:134) | `EXIT=1`; printed `NOT REPAIRED <fn>` for **all 27** and **zero** `NO FILE` lines | 27 source repairs through the shared helper | **import-presence only** — a file importing the helper and still hand-rolling a broken insert would pass. Compensated by the residual-raw-insert sweep (0), the bad-key sweep (151→0) and the live probe | SOUND but weaker than it reads |
| `94-10_g2` (:162) | `EXIT=1` at its first clause; both artifacts absent | **27 real deploys + a real HTTP round trip through a deployed fn.** `count 1 → 2`, `AUDIT ROW LANDED` | `NOT CONSTRUCTED: nothing.` Ledger counter positive-controlled in both directions **before** the first real row (C9a) | SOUND — had never been observed green before this phase |
| `94-10_g3` (:192) | `EXIT=1`; `38 files` → 0, `default_organization_id` → 0 | both register corrections with derivations inline | **C8 positive dual: two-token presence anywhere in a 576-line file, comments included.** Cannot see whether the derivations are correct | SOUND but weaker than it reads |
| `94-11_g1` (:122) | `exit=1` (whole-set drill and re-observed directly; `ls` → `No such file or directory`) | this file authored → `g1_exit=0` | green-constructed during planning; re-drilled under `RULING-P94-05` with the independent verifier's artifact PRESENT as the discriminating control | SOUND |
| `94-11_g2` (:153) | `exit=2` (whole-set drill — the chain reached its **last** clause, so every spec, probe and tag check ahead of it passed; `2` is `grep`'s file-not-found) | full oracle set re-run + this file → **`GATE_94-11_g2_EXIT=0`**, §4.2 | **This gate had never been observed green in this phase.** It is now. Gate text run verbatim; outputs echoed only after `$?` was captured | SOUND |
| `94-11_g3` (:203) | `exit=2` (whole-set drill; the marker loop completed with `$BAD` empty, so the red is the final `grep` on the absent file) | §3 written → `g3_exit=0` | population is content-identified (four markers), not path-identified — see §3 for why the path-identified form could never pass | SOUND |

### 1.3 Gate concerns carried forward — for a ruling, never an edit

**Zero gate text was edited anywhere in this phase.** Every concern below is recorded, not repaired.
None makes its gate unpassable-when-done, so **none is a PARK**; all are "weaker than it reads".

<!-- prettier-ignore -->
| gate | concern | raised by |
| --- | --- | --- |
| `94-04_g1` clause 2 | `grep -qE "\.eq\('id', *user\.id\)"` was **already green at `phase-94-base`** (line 155, the SELECT). It cannot distinguish a repaired write from the 23502 upsert, and it is not a regression guard either — nothing in that plan touches line 155. Inert. | 94-04 |
| `94-06_g1`, `94-05_g1` | file-shape checks: they prove an artifact exists and mentions tokens, never that it reaches the live table / applied policy. | 94-06, 94-05 |
| `94-06_g2` (4 of 6 clauses), `94-10_g3` (both clauses) | the **positive dual of C8** — bare substring greps that a comment alone satisfies, in plans whose own action text instructs the author to mention those tokens in comments. | 94-06, 94-10 |
| `94-08_g3` | self-certifying: asserts a literal `PARITY: MATCH` in a document the same task authors. | 94-08 |
| `94-09_g2` clause 3 | satisfied by the import line alone. | 94-09 |
| `94-10_g1` | import-presence only. | 94-10 |

Two clauses are **declared regression guards**, not passes: `94-07_g3` clause 3 (`**D-12:` marker)
and `94-08_g1` clause 3 (`data-droppable-id` selector contract). Both were green before their plan's
work and exist to stop a correct-looking change from deleting a contract.

---

## 2. CLOSING DERIVATIONS

Every derivation states its **POPULATION** (search root, matching rule) and what falls **outside**
it (`D-24`). A population partitioned by origin states its seams.

### Derivation 1 — `WRITE-04` reverse mapping (`D-31`, `RULING-P94-02`)

**POPULATION.** The five values the live `aa_commitments` CHECK constraint admits, mapped to the
board column each renders in, read from the shipped `resolveBoardStage` at
`frontend/src/pages/WorkBoard/WorkBoard.tsx:105-118` and the pre-bucketing filter at `:214`.

Constraint re-derived LIVE one final time (`D-03` orders re-derivation, not trust — including of
`D-03` itself), Supabase MCP `execute_sql`, staging `zkrcjzdemdmwhearhfgg`, 2026-08-16:

```
CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'overdue'::text])))
```

**Five values. No `review`.** Matches `94-STAGE-PARITY.md` and the corrected `CLAUDE.md` paragraph.

<!-- prettier-ignore -->
| stored status | renders in | mechanism |
| --- | --- | --- |
| `pending` | Todo | `default` branch |
| `in_progress` | In progress | explicit `case` |
| `completed` | Done | explicit `case` |
| `cancelled` | **not rendered** | filtered by `isCancelled` at `:214`, before bucketing — deliberate and correct |
| `overdue` | Todo | `default` branch, **indistinguishable from never-started**. Undesigned, stated. Handling it is Phase 96 (`COUNT-04`), not this phase. |

There is no `review` branch: it was dead code and was removed, with this mapping documented in its
place.

**OUTSIDE THIS POPULATION.** The task and intake reverse mappings (different sources, different
lifecycles). The forward mapping (columns→statuses), which is a different derivation and is covered
by `94-STAGE-PARITY.md`. `commitment_status_history`, which records the **coerced** status and is
therefore not evidence of user intent (`F3`).

### Derivation 2 — the `/settings` population (`D-16`)

**POPULATION A (IN).** The nine sections `SettingsPage` renders — `profile`, `general`,
`appearance`, `notifications`, `email-digest`, `integrations`, `accessibility`, `data-privacy`,
`security` — whose fields all flow through the ONE shared `saveMutation`. That is the single broken
path the audit found. The statement lives in the oracle's own header
(`frontend/tests/e2e/settings-save.spec.ts:18-40`), where the measurement is, not only here.

**POPULATION B (OUT, on assumption A4, CARRIED).** The five `/settings` child routes, derived from
disk rather than memory — `ls frontend/src/routes/_protected/settings/` returns `calendar-sync.tsx`,
`email-digest.tsx`, `integrations.tsx`, `notifications.tsx`, `webhooks.tsx`, plus a `calendar`
directory; `settings.tsx` is the layout route. Each child owns a **separate** save path against its
own RLS-enabled tables and none was part of the filed defect. **This is an untested exclusion,
stated as one** — not a claim that they work.

**OUTSIDE EITHER POPULATION.** `/settings/calendar/callback` (no save affordance — a redirect
handler). `security` (the MFA write is deliberately absent; there is no write to observe).
`data-privacy` (action buttons, not saved values).

### Derivation 3 — `AUDIT-ZERO-01` key-diff, BOTH quote styles

**POPULATION.** Every file under `supabase/functions` (recursive, enumerated with
`fs.readdirSync` — **not** `grep -r`, which is a `.gitignore`-honouring ugrep wrapper here) whose
source contains `from('audit_logs')` **or** `from("audit_logs")`, with `.insert(` or `.upsert(`
within 900 characters after the match. For each such site the top-level keys of the first
object-literal argument are diffed against the LIVE column set.

Live column set re-derived by MCP against staging today — **not inherited from research**:

```
id,entity_type,entity_id,action,old_values,new_values,user_id,user_role,ip_address,
user_agent,required_mfa,mfa_verified,mfa_method,correlation_id,session_id,created_at
```

**Both directions, one instrument** (`phase-94-base` materialised with `git archive`):

<!-- prettier-ignore -->
| tree | files scanned | matched | writers | read-only | clean | **broken** | exit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `phase-94-base` (positive control) | 323 | 38 | 36 | 2 | 9 | **27** | 1 |
| HEAD (the derivation of record) | 324 | 12 | 10 | 2 | 10 | **0** | 0 |

The base run reproduces the filed population exactly — **38 files / 36 writers / 27 broken / 9 clean
/ 2 read-only** — and names all 27 with their bad keys, so the HEAD zero is a measured absence and
not a blind instrument.

**Read this transition correctly.** The population **shrank** (38 → 12) because the repair moves
files _out_ of it: the 27 repaired writers no longer call `from('audit_logs')` at all — they call
`writeAuditLog`, and `_shared/audit.ts` is now itself one of the ten clean writers. A count that
went down is not, by itself, evidence; the base-tree control is what makes the zero mean something.

**OUTSIDE THIS POPULATION,** carried forward unclosed:

- **payloads assembled as variables and spread** (`.insert(payload)` with keys built elsewhere) —
  the parser reads literal objects only. **Still unmeasured**, in the register, not closed here.
- the backend tree (`backend/src/**`) — a different table with a different column set
  (`public.audit_log`, singular); covered separately by `94-06`'s oracle and its live probe.
- `link_audit_logs` — a different table, out of phase.
- nested keys inside jsonb values — moot, `old_values`/`new_values` are jsonb.

### Derivation 4 — i18n key-set equality, and one correction to the claimed instrument

**POPULATION.** The four namespace subtrees this phase authored keys into:
`common.afterActions`, `unified-kanban.errors`, `after-actions-page.degraded`,
`report-builder.generate` — EN vs AR, flattened, compared as sets, plus a **string-inequality**
check (key-set equality catches _absent_, never _untranslated_).

<!-- prettier-ignore -->
| subtree | EN keys | AR keys | key sets | EN===AR values |
| --- | --- | --- | --- | --- |
| `common.afterActions` | 231 | 231 | EQUAL | 0 |
| `unified-kanban.errors` | 12 | 12 | EQUAL | 0 |
| `after-actions-page.degraded` | 1 | 1 | EQUAL | 0 |
| `report-builder.generate` | 1 | 1 | EQUAL | 0 |

Negative control at `phase-94-base`: `after-actions-page.degraded` and `report-builder.generate`
report `SUBTREE MISSING` in both locales, and `unified-kanban.errors` is 8=8 rather than 12=12 —
so the derivation can tell an added key from an absent one.

`node scripts/check-i18n-namespaces.mjs` → exit 0, `1715 file(s) scanned, 802 static namespace
literal(s) checked against 128 registered namespaces`.

**CORRECTION to this plan's own interfaces text.** It says `pnpm lint` "carries
`scripts/check-i18n-namespaces.mjs`" as the key-set-equality gate. That script's header says what it
actually asserts: **namespace REGISTRATION** — that every `useTranslation('ns')` literal resolves to
a namespace registered in `src/i18n/index.ts`. It is not a key-set-equality gate and never was.
Key-set equality in this phase was carried by per-plan node assertions inside `94-03_g2`,
`94-07_g2` and `94-09_g1.c6`, and is re-run directly above. The property holds; the instrument named
for it was misattributed, and that is corrected here rather than repeated.

**FINDING, OPEN — `common.json` is NOT key-set-equal as a whole namespace.** EN **1087** keys, AR
**1099**: twelve AR-only keys, all under `dossierLinks.entityTypes.*` (`dossier`, `position`, `mou`,
`engagement`, `assignment`, `commitment`, `intelligence_signal`, `organization`, `country`, `forum`,
`working_group`, `topic`), and **zero** EN-only keys.

- **Not a Phase 94 regression, measured:** at `phase-94-base` the same delta is 1084 / 1096 — the
  identical twelve keys. This phase added exactly 3 keys to each locale and preserved the gap.
- **Unguarded:** `frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts` covers five namespaces —
  `briefs-page`, `after-actions-page`, `tasks-page`, `activity-feed`, `settings` — and **not**
  `common`, `unified-kanban` or `report-builder`.
- **Direction matters:** surplus AR keys are inert at runtime (an unused AR key renders nothing),
  unlike missing AR keys which silently render English in both locales. Low severity, real.
- **Recorded OPEN, needs an orchestrator id and owner** (Phase 99 — Arabic Coverage is the natural
  home). This plan does not write `.planning/REQUIREMENTS.md`.

**OUTSIDE THIS POPULATION.** Every namespace this phase never touched. Arabic **naturalness** — see
§7. Pixel RTL — an operator park.

### Derivation 5 — deploy evidence (`D-19`)

**POPULATION.** The verdict-last rows of `94-DEPLOY-LEDGER.md`, matched by
`command grep -cE '\| *OK *\|[[:space:]]*$'` — the same regex shape whose C9a failure in Phase 92
(`92-04`'s six-column table vs `92-09_g1`'s verdict-last regex) is the reason this contract is
positive-controlled at the producer rather than checked for the first time downstream.

```
verdict-last OK rows   : 27      (threshold ≥ 27; max achievable 27 — C4 reachability holds)
verdict-last FAIL rows :  0
```

`94-10` positive-controlled this counter **in both directions before the first real row was
written**: header-only → 0; plus a verdict-last synthetic row → 1 (counted); plus a six-column
`92-04`-shaped row → still 1 (correctly not counted); both removed → 0.

Plus `after-actions-list-all`, deployed in `94-07` with its own recorded evidence
(`Deployed Functions on project zkrcjzdemdmwhearhfgg: after-actions-list-all`, `DEPLOY_EXIT=0`), and
`after-actions-publish` **v12 → v13** in the `94-01A` lane, evidenced against the deployed artifact
by version + `ezbr_sha256` change, not by the CLI's exit code.

**OUTSIDE THIS POPULATION.** The other ~112 edge functions in the tree, which this phase neither
touched nor redeployed. The ledger counts deploys, not correctness — that is `94-10_g2`'s live
row-landing probe.

### Derivation 6 — `D-08` copy sweep over the five repaired surfaces

**POPULATION.** Exactly the five named repaired surfaces, and nothing else:

```
frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx   (94-01)
frontend/src/hooks/useUnifiedKanban.ts                                      (94-03)
frontend/src/pages/settings/SettingsPage.tsx                                (94-04)
frontend/src/routes/_protected/after-actions/$afterActionId.tsx             (94-07)
frontend/src/pages/reports/ReportsPage.tsx                                  (94-09)
```

**MATCHING RULE.** For every `toast*(` / `showToast(` call, the **balanced** parenthesised argument
text is extracted and searched for `.message`.

**ONE DISCARDED MEASUREMENT, recorded rather than replaced.** The first form of this sweep was
line-oriented (`grep -cE "toast[A-Za-z.]*\([^)]*\.message"`). It returned `0` on every file at HEAD
**and `0` on every file at `phase-94-base`**, where three leaks are known to exist. A clause that is
0 in both directions can never fire — instrument trap 10, caught by running the positive control
before believing the zero. Discarded; rewritten balanced-argument-aware.

<!-- prettier-ignore -->
| tree | result |
| --- | --- |
| `phase-94-base` (positive control) | **3 leaks** — `after-action.tsx:103` `toast.error(… .message …)`, `useUnifiedKanban.ts:481` `toast(… .message …)`, `$afterActionId.tsx:109` `toast.error(… .message …)`. Exit 1. |
| HEAD (the derivation of record) | **0 leaks** across 13 toast calls in 5 files. Exit 0. |

The three leaks the control finds are exactly the three named in `94-CONTEXT` `D-08` and the plan
summaries — so the instrument sees the subject it was built for.

**A BLIND SPOT OF THIS SWEEP, found by running it.** `SettingsPage.tsx` reads **0 leaks at the base
tag too**, yet it carried one: `const detail = error instanceof Error ? error.message : null` at
`:315`, consumed at `:318` as `description: detail ?? undefined`. **A leak routed through a local
binding is invisible to any sweep that reads the toast's arguments.** Closed here by direct
observation instead: at HEAD, `command grep -nE "const detail|description: detail|error\.message"
frontend/src/pages/settings/SettingsPage.tsx` exits **1** with zero matching lines, and at the base
tag it returns both lines. The general class — an `error.message` laundered through one or more
intermediate variables before rendering — is **NOT swept** and is stated as outside.

**OUTSIDE THIS POPULATION.** The rest of the app. In particular `COPY-06` (the global success toast
at `frontend/src/lib/query-client.ts:71`, owner Phase 98) and the double-toast question (deferred,
no Phase 94 criterion). Non-toast render paths that could interpolate `.message` into JSX directly.

**Related, same population, measured because a copy fix can create a mask:** over the **27**
`frontend/src` files this phase changed, the count of `t('key', 'English default')` two-argument
sites is **9 at `phase-94-base` and 9 at HEAD** — this phase added **zero** i18n masks. Instrument
positive-controlled: the same regex returns 5 on `ErrorBoundary.tsx`, a file known to carry masks.

### Derivation 7 — `ARMA-01`

**POPULATION.** The single file `tests/e2e/93-report-notfound.spec.ts`, the whole file.

```
command grep -c 'query-error-state' tests/e2e/93-report-notfound.spec.ts   -> 0
command grep -c 'notFoundPage'      tests/e2e/93-report-notfound.spec.ts   -> 2   (positive control)
```

Arm (b) — the locator, the `expect.poll` disjunction summing both arms, and the arm-recording block
— is gone; the 404 arm is asserted alone. The zero is discriminating because the positive control on
the same file in the same run is non-zero. Behavioural half in §4: `1 passed`, `--no-deps`, inline
auth, count hardcoded.

**OUTSIDE THIS POPULATION.** Every other spec that uses `query-error-state` legitimately — the
Phase 93 error-state specs listed in §6, whose surfaces are on the intended-broken register and
whose disjunctions are **not** `ARMA-01`'s subject. Deleting those would destroy the register's own
oracles.

---

## 3. THE RETROSPECTIVE same-commit sweep (`RULING-P94-06` B2)

**Why here and not per-task.** `execute-plan.md:175` verifies **before** committing, so a per-task
`git log -1` shows the _previous_ task's commit and can never see the task's own edit. Those four
clauses were removed; the property is measured here, retrospectively, where it is both satisfiable
and unfakeable.

**POPULATION — content-identified, not path-identified.** The register **corrections** this phase
ships, each identified by the marker string it introduces. For each, `git log -S<marker>
phase-94-base..HEAD -- .planning/REQUIREMENTS.md` finds the commit that introduced it; that commit
must ALSO touch a `frontend/`, `supabase/` or `backend/` path.

**Why NOT "every commit touching `REQUIREMENTS.md`".** That population was tried first and is wrong:
this phase's own **planning** leg contains six legitimately docs-only register commits (the
`D-30..D-34` relabel, `GATESTD-02` ×2, the `COUNT-03`/`COUNT-04` filings, the dangling-citation fix).
A sweep over that set could never go green — it would be a gate that cannot pass when the work is
done, the exact class this phase has already caught twice.

<!-- prettier-ignore -->
| marker | introducing commit | code paths in the same commit | verdict |
| --- | --- | --- | --- |
| `RFC-9562` (WRITE-03) | `6d0456699` | 1 (`frontend/src/components/intake-form/IntakeForm.tsx`) | rode with its code |
| `PGRST200` (WRITE-02) | `76b46bb8d` | 2 | rode with its code |
| `DEAD-09` (WRITE-06 mock filing) | `68414f219` | 5 | rode with its code |
| `38 files` (AUDIT-ZERO-01) | `4aba197e5` | 27 | rode with its code |
| `default_organization_id` (AUDIT-DROP-01, A3) | `4aba197e5` | 27 | rode with its code |

**DOCS-ONLY LIST: EMPTY.** No register correction in this phase shipped without its code.

**Restated limit — five markers map to FOUR commits.** `38 files` and `default_organization_id` are
both written by `94-10` Task 3, so the fifth marker guards against that task being **split**; it is
**not** an independent fifth observation today. `default_organization_id` is also the weakest of the
five: it is a real column name a future tenancy entry could legitimately mention, which would point
the pickaxe at the wrong commit. It is scoped to `-- .planning/REQUIREMENTS.md`, so its many
occurrences under `backend/src` are invisible to it.

**OUTSIDE THIS POPULATION.** Every register edit that is not one of these corrections; anything
before `phase-94-base`; and a correction whose marker string is later reworded — which the gate
reports as `missing:<marker>` rather than passing silently, so a reworded marker and a docs-only
correction are distinguishable and need opposite responses.

---

## 4. THE BEHAVIOURAL ORACLE SET, RE-RUN (`D-25`/`D-26`/`D-27`)

Every Playwright command asserts spec-file existence FIRST and hardcodes its expected count (spec
paths are FILTERS — two or more with at least one match gives a silent partial run at exit 0). Every
root-config command runs `--no-deps` with the spec's own inline auth; **no oracle depends on the
Playwright `setup` project** (`E2ECRED-01`). No credential value is echoed anywhere.

### 4.1 Vitest — the phase suites

<!-- prettier-ignore -->
| runner | files | tests | exit |
| --- | --- | --- | --- |
| `frontend` — AfterActionForm, IntakeForm, commitment-stage-guard, WorkBoard, BoardColumn, kanban `__tests__`, AfterActionsTable, generate-entry | **13 passed (13)** | **112 passed (112)** | 0 |
| `backend` — `tests/unit/audit-write.test.ts` | **1 passed (1)** | **4 passed (4)** | 0 |

The frontend invocation passes 8 path arguments and matched 13 files — **enumerated, not assumed**,
because a vitest path is a filter too: `pnpm exec vitest list --filesOnly <same args>` returns
exactly those 13 (the `src/components/kanban/__tests__` argument expands to 6). No target was
silently dropped.

### 4.2 Playwright + probes

The full set ran as the drill's `94-11_g2` and is re-run with output captured in
`94-11-SUMMARY.md`. Composition, with the counts that are hardcoded in the gate:

- root config — `tests/e2e/93-report-notfound.spec.ts`, `--project=chromium-en --no-deps`, **1**
- frontend config — `tests/e2e/settings-save.spec.ts` (**2**) + `tests/e2e/after-action-detail-error.spec.ts` (**1**) = **3**
- `node scripts/probe-report-rls.mjs` — the `D-22` two-sided oracle (`A=1 / B=1 / C=0`)
- `node scripts/probe-commitment-readback.mjs` — write-then-read-back + past-due coercion control
- `node scripts/probe-after-actions-list.mjs` — deployed-artifact list oracle, "hides nothing" arm
- `node scripts/probe-audit-row.mjs` — live `audit_logs` row-landing delta

**OBSERVED GREEN, whole set, one run: `GATE_94-11_g2_EXIT=0`.** The gate text was executed
verbatim; `$OUT` / `$OUT2` were echoed only **after** the exit code was captured, so nothing was
added inside the `&&` chain.

<!-- prettier-ignore -->
| oracle | expected | observed |
| --- | --- | --- |
| `93-report-notfound.spec.ts` (root, `--no-deps`) | 1 | `✓ 1 [chromium-en] › …:49:7 › absent report id renders the 404 page, never a fresh builder (2.6s)` · **`1 passed (2.8s)`** |
| `settings-save` + `after-action-detail-error` (frontend) | 3 | `[1/3] … profile save survives reload` · `[2/3] … forced query error renders the translated load error and no raw key` · `[3/3] … notification toggle survives reload (the D-15 bridge effect)` · **`3 passed (12.4s)`** |
| `probe-report-rls` | exit 0 | `A sees custom_reports: [aa707d21-…]` · `B sees custom_reports: [aa707d21-…]` · `C sees custom_reports: []` · **`PROBE PASSED — no 42P17; A=1 / B=1 / C=0; schedule created; fixtures cleaned`** · post-cleanup counts `{"custom_reports":0,"report_shares":0,"report_schedules":0}` |
| `probe-commitment-readback` | exit 0 | census BEFORE `10 rows {"overdue":8,"pending":2}` · future-due `read-back A -> status "in_progress"` (persisted verbatim) · past-due `read-back B -> status "overdue"` (**coercion control fired**) · census AFTER identical · **`PROBE PASSED`** |
| `probe-after-actions-list` | exit 0 | `records visible to this user : 1` · `rows with engagement === null : 0` · `rows with dossier === null : 0` · **`PASS — deployed function answers 200 with the composed shape and hides nothing`** |
| `probe-audit-row` | exit 0 | `audit_logs count BEFORE: 8` → `AFTER: 9 (delta 1)` · `AUDIT ROW LANDED: id=d7cdc528-… entity=commitment/… action=status_update user_role=admin` · **`PASS — audit_logs went 0 -> >=1 through a deployed repaired function.`** · fixture deleted `HTTP 204` |
| `git tag -v phase-94-base` | exit 0 | `Good "git" signature for alzahrani.khalid@gmail.com with ED25519 key SHA256:YlslD6Lyam…` |

The two probes' negative halves are what make this more than a smoke test: `C=0` is reached through
the same code path that returned rows to A and B (so a blanket-empty defect would read `A=0 / B=0`,
not `C=0`), and the coercion control's two sides differ only in `due_date` — same PATCH, same
identity, different stored result — so the drift alarm can fire.

**`ORACLECAP-01` is live and is a labelled state, not a regression.** Back-to-back auth-heavy runs
red at the provider's rate limit. Runs in this leg were deliberately **spaced** — the whole-set
drill, then the register specs (§6.1), then this run — and none hit the wall. Had one, it would be
recorded as **UNABLE TO MEASURE** and re-run after the window, never as a regression. A probe that
exits **2** is reporting absent credentials — also a labelled state, never a pass and never a red.

**Staging left as found**, except deliberately: all report/commitment fixtures deleted and the live
`aa_commitments` census re-asserted unchanged (`{"overdue":8,"pending":2}` before and after). The one
`audit_logs` row this run added is **kept**, per `94-10`'s standing decision that rows written by
deployed functions during genuine staging actions are the `AUDIT-ZERO-01` closure evidence, not
litter.

### 4.3 Shipped-suite reds, attributed rather than assumed

`94-01` ran `frontend/tests/e2e/after-action-create.spec.ts` once against a live dev server:
**6 failed / 6**. Attribution is **measured, not asserted** — the spec drives
`/after-action/create`, and `grep -c 'after-action/create' routeTree.gen.ts` → **0** against a
control `grep -c 'engagements/$engagementId/after-action'` → **10**; `grep -c 'name="title"'
AfterActionForm.tsx` → **0**. The route and the input the spec targets do not exist in the tree.
This is the **`E2ESTALE-01`** ambient (Phase 101), not a Phase 94 regression, and it is judged
against that inventory per `94-VALIDATION.md` rather than against absolute green — absolute E2E
green is Phase 101's criterion and claiming it here would import another phase's debt.

`_phase52-mid-drag-capture.spec.ts` is pre-existing red **by DATA** (`P52FIXTURE-01`, Phase 102).
`tests/unit/services/MoUService.test.ts` fails 18 of 24 — pre-existing, verified by
`git show phase-94-base:backend/src/services/mou.service.ts | grep -c 'getAllMoUs'` → **0**, i.e.
the method never existed at the base tag either.

---

## 5. C9b — CROSS-PHASE CONSUMER TABLE

**POPULATION.** Shipped tests, across **every** phase (not only this one), coupled to the files this
phase modified. Roots **derived, never named** — `find . -maxdepth 3 -type d -name tests` returns
four (`./tests`, `./frontend/tests`, `./backend/tests`, `./e2e/tests`), widened by the per-plan
sweeps to the colocated `**/__tests__` directories the standard's `-maxdepth 3` structurally misses
(54–64 roots depending on the lane, 599–794 test files).

**`D-28`: the mock-vs-real column is BY SUBJECT, and NON-ORACLES are never folded into the defence
count.** Each verdict below was re-checked against the executed tree by reading `vi.mock` calls'
**import paths**, not their names — a basename collision (`logSecurityEvent` exists twice in this
codebase) is exactly how a mocked consumer gets miscounted as a defence.

<!-- prettier-ignore -->
| subject (modified this phase) | consumer | mock or REAL *for this subject* | verdict |
| --- | --- | --- | --- |
| `AfterActionForm.tsx` | `frontend/tests/component/AfterActionForm.test.tsx` | **REAL** component; children + i18n mocked | **ORACLE** — updated in the SAME task; 31/31 |
| `engagements/$engagementId/after-action.tsx` | `frontend/tests/component/after-action-route-wiring.test.tsx` | **REAL** route + real `AfterActionForm`; only the two mutation hooks stubbed; `vi.unmock('react-i18next')` so copy assertions read `src/i18n` | **ORACLE** — created by 94-01; 3/3 |
| same | 14 Playwright specs navigating an after-action URL | REAL Playwright | **NAMED non-consumers** — they target `/after-action/create`, which does not exist (counts in §4.3). Their failures cannot be caused by adding a Publish button. |
| `useAfterAction.ts` / `after-actions-list-all` | `frontend/src/hooks/__tests__/useAfterActionsAll.test.ts` | **MOCKED** — `vi.mock('@/lib/supabase')`, i.e. the subject's own import path; asserts invoke name + body | **NON-ORACLE** for the server fix. Re-run green; **not counted as a defence.** |
| `AfterActionsTable.tsx` | `frontend/src/components/after-actions/__tests__/AfterActionsTable.test.tsx` | **REAL** component (only `@tanstack/react-router` + `react-i18next` mocked) | **ORACLE** — extended in the same task; controlled A/B removed the degraded branch → `Tests 2 failed \| 8 passed`; restored → 10/10 |
| `IntakeForm.tsx` | `frontend/tests/component/IntakeForm.test.tsx` | **REAL Zod schema**; selector + `useIntakeApi` mocked | **ORACLE** — the schema *is* the subject; 4/4 |
| `WorkBoard.tsx` (drag-end decision) | `frontend/src/pages/WorkBoard/__tests__/WorkBoard.test.tsx` | mocks `@/hooks/useUnifiedKanban`, `@/components/kanban` **and `../BoardColumn`** | **ORACLE for the drag-end decision only** — `mutate` is the write at that boundary, so "refusal enqueues no mutation" is honestly assertable. **NON-ORACLE for BoardColumn's droppable predicate** — that module is mocked out. 15/15; negative control failed exactly the 3 new absence assertions. |
| `BoardColumn.tsx` (droppable predicate) | `frontend/src/pages/WorkBoard/__tests__/BoardColumn.test.tsx` | mocks only `react-i18next` and `../KCard`; the `@/components/kanban` module mock was **REMOVED** by 94-08 | **ORACLE** — drives real dnd-kit 6.3.1 and asserts against dnd-kit's own `droppableContainers` registry. A mocked `useDroppable` could only have proven the component computes a boolean. This is what closes `D-04` affirmatively. |
| `commitment-stage-guard.ts` | `frontend/src/pages/WorkBoard/__tests__/commitment-stage-guard.test.ts` | **zero `vi.mock` calls** | **ORACLE** — 14/14 |
| kanban primitives / barrel | `frontend/src/components/kanban/__tests__/*` (6 files) | REAL components + 3 ESLint-fence fixtures | **ORACLE** (regression) — all green; the barrel change is a pure additive re-export |
| same | `kanban-render`, `kanban-a11y`, `tasks-tab-*` e2e | REAL Playwright | **NAMED non-consumers** — `commitment` mentions = 0 in every drag spec, paired with a `test(` positive control on the same files. Selector contract `section.col` / `.col-head` / `data-droppable-id` unchanged. |
| same | `frontend/tests/e2e/_phase52-mid-drag-capture.spec.ts` | REAL | **NAMED pre-existing red by DATA** (`P52FIXTURE-01`, Phase 102) — not chased |
| `SettingsPage.tsx` | `frontend/tests/e2e/settings-page.spec.ts` | REAL | **NAMED non-consumer** — asserts the 240+1fr layout and mobile pill nav only, never Save |
| same | `tests/e2e/92-signout.spec.ts` | REAL (root config) | **NAMED non-consumer** — uses `/settings` for sign-out |
| `ReportsPage.tsx` / `generate-entry.ts` | `frontend/src/pages/reports/__tests__/generate-entry.test.ts` | **zero `vi.mock` calls** | **ORACLE** — 5/5; falsified by reproducing `PARK-94-06`'s forbidden shape → `EXIT=1` |
| `reports` edge fn + `ReportsPage` | `backend/tests/contract/reports-{generate,schedule}.test.ts`, `tests/contract/reports.test.ts` | — | **NON-ORACLES, verified mechanically:** `backend/vitest.config.ts:30-33` lists `tests/contract/**` in its **exclude** array, so they do not run in the required job. They also exercise the Express `/api/reports/*` surface with `template_id`, not the edge function. **Not counted.** |
| `auth.service.ts` | `backend/tests/unit/auth.service.test.ts` | REAL service | **ORACLE** — re-run after the change: exit 0, 24 passed |
| same | `backend/tests/unit/audit-write.test.ts` | REAL `AuthService.logSecurityEvent`; `vi.mock('../../src/config/supabase')` + `('../../src/utils/logger')` — **pinned by PATH**, because `logSecurityEvent` exists twice (`backend/src/utils/logger.ts:126` and `auth.service.ts:845`) | **ORACLE** — 4/4; positive-controlled by injecting a non-column key → `Tests 1 failed` |
| same | `backend/src/services/__tests__/auth.service.test.ts` | — | **NON-ORACLE, verified mechanically:** `backend/vitest.config.ts:22-29` includes `src/utils/__tests__/**` but **not** `src/services/__tests__/**`, so this file never runs. The boundary is that one directory, not "colocated backend tests". **Not counted.** |
| `mou.service.ts` | `tests/unit/services/MoUService.test.ts` | REAL service | Real consumer but does **not** exercise `logStateTransition`; 18/24 pre-existing failures, attribution measured (§4.3) |
| `_shared/audit.ts`, `writeAuditLog` | none at authoring | — | New surface; its first consumers are 94-10's 27 repairs |
| 27 edge audit writers | `backend/tests/contract/{6 files}` | — | **NAMED NON-ORACLES** — same `exclude` finding; none references `audit_logs`, `entity_type` or `user_role` |
| same | `frontend/src/components/keyboard-shortcuts/__tests__/CommandPalette.audit.test.tsx` | — | **NOT a consumer — basename collision.** Its `create-user` is a command-palette route id; its filename's "audit" is an unrelated F25 menu audit |
| same | `frontend/tests/e2e/user-management.spec.ts` | REAL Playwright | **A REAL C9b CONSUMER, AND IT WAS NOT RE-RUN. See §8 — this is a gap, not a named non-consumer.** |
| i18n `common` / `unified-kanban` / `after-actions-page` / `report-builder` | key-set derivation (§2.4) + `frontend/tests/unit/i18n/phase-42-i18n-parity.test.ts` | mechanical | ORACLE for the four subtrees; the parity test covers 5 namespaces and **not** these three — see the OPEN finding in §2.4 |
| `93-report-notfound.spec.ts` | itself | REAL | `ARMA-01`'s subject; 1/1 |

**REAL-ORACLE DEFENCE COUNT: 11 subjects** (the rows marked ORACLE). Four consumers are recorded as
**NON-ORACLES** and contribute nothing: the mocked hook test, the two excluded backend contract
tiers, and the never-running colocated `auth.service.test.ts`.

**THE CLASS THIS SWEEP CANNOT SEE, stated as part of the rule rather than discovered later.** A test
coupled to a component by **shape alone** — `getByRole('alert')` plus visible text, naming neither
the file nor any identifier in it — matches no grep and appears in no candidate list. The residual
defence is not a sweep; it is **running the shipped suites and reading the reds against the
`E2ESTALE-01` inventory**, which §4.3 does. That defence is partial: it covers the suites that were
run, and `user-management.spec.ts` was not one of them.

---

## 6. THE INTENDED-BROKEN REGISTER

**These surfaces are deliberately broken. Repairing one is a REJECT of the leg, not a bonus.
Reporting one as a regression is as wrong as reporting it fixed.** Nothing below was approached for
repair by any plan in this phase; every plan's SUMMARY states so independently.

### 6.1 Re-verified LIVE, this leg

Each spec run individually (one path per invocation, so no filter-drop hazard), existence asserted
first, count hardcoded, `--project=chromium-en --no-deps` with the spec's own inline auth.

<!-- prettier-ignore -->
| surface | owning phase | oracle | expected | observed |
| --- | --- | --- | --- | --- |
| `/delegations` errors | **Phase 102** | `tests/e2e/92-delegations-error.spec.ts` | 2 | **2 passed (15.2s)**, exit 0 |
| `/tasks/queue` | **Phase 95** | `tests/e2e/93-tasks-queue-error.spec.ts` | 1 | **1 passed (9.9s)**, exit 0 |
| `/analytics` | **Phase 96** | `tests/e2e/93-analytics-error.spec.ts` | 1 | **1 passed (9.8s)**, exit 0 |
| `/admin/data-retention` legal-holds region | **Phase 100** | `tests/e2e/93-admin-surfaces-error.spec.ts` | 4 | **4 passed (10.8s)**, exit 0 |

Every one of these specs **passes by asserting the error state is present**. A green row here means
the surface is **still broken, as intended** — it does not mean the surface works. That inversion is
the whole point of the register, and it is why these greens are reported here rather than in §4.

### 6.2 Carried, with owners — not re-derived by this phase

<!-- prettier-ignore -->
| item | owner | note |
| --- | --- | --- |
| `DEAD-09` — the reports **mock generate path** (`supabase/functions/reports/index.ts:266-285`, a `setTimeout` that only `console.log`s) | **Phase 95** | Filed by 94-09 with mechanism, ruling citation and repair candidates. The function was **not** edited: the mock is filed dead, not shipped working. `94-09` deliberately built **no** browser oracle for it. |
| `COPY-06` — the app-wide hardcoded English success toast (`frontend/src/lib/query-client.ts:71`) | **Phase 98** | Fires on every mutation in the app, including an honest `unavailable` report generate and the `W4` retarget path. Ruled explicitly out of Phase 94 scope (`RULING-P94-01`, narrow). |
| `COUNT-03` / `COUNT-04` — overdue rendering + handling, two-signals unification, the INSERT gap | **Phase 96** | `overdue` renders in Todo via the `default` branch, indistinguishable from never-started (derivation 1). Phase 94 states the population and stops. |
| the `conflict.*` inline-English keys on `$afterActionId.tsx` (`:106`, `:166-167`, `:179`) | **Phase 99** | The AR-04a mask population. Left exactly as found; renders English under Arabic today. |
| the **22-mask floor** | Phase 99 / Phase 101 | Inherited from `93-15`'s register (26 → 22). **NOT re-derived here — it is another phase's number over another phase's population, and re-deriving it under a different rule would produce a number that looks comparable and is not.** It is a **floor, not a total**. What this phase *did* measure, in its own population, is that it added **zero** new masks (derivation 6). |
| `E2ESTALE-01` — six shipped e2e assertions red before Phase 93 | **Phase 101** | §4.3. Judged against the inventory, never against absolute green. |
| `ORACLECAP-01` — the auth rate-limit wall | **Phase 101** | §4.2. A rate-limit red is UNABLE TO MEASURE. |
| `E2ECRED-01` — the stale root `storageState` / `setup` project | **Phase 101** | An operator act that has not happened. Every oracle in this phase routes around it. |
| `P52FIXTURE-01` — `_phase52-mid-drag-capture` red by DATA | **Phase 102** | Not chased. |

### 6.3 Filed FROM this leg's parks — open, with owners

<!-- prettier-ignore -->
| id | owner | scope |
| --- | --- | --- |
| `EDGEPATH-01` | **Phase 100** | Edge functions deriving record ids from URL path structure that `functions.invoke('<slug>')` never supplies. **At least 61 edge functions in scope, of which 7 are mechanism-proven, 2 are cleared of this defect only, and 52 are entirely unassessed.** **61 is a SCOPE, never a defect count**, and the population is **open-ended by construction** — three successive form-scoped enumerations each under-counted. |
| `FUNC-GRANT-01` | **Phase 100** | `SECURITY DEFINER` functions carrying the default `PUBLIC EXECUTE` grant. Population **334**. A knowingly-accepted residual: measured impact is an existence oracle on a 122-bit random id for authenticated callers, and **no information** for `anon` (`auth.uid()` is NULL, so the function returns NULL whether or not the row exists). Not a Phase 94 regression. |

Both are recorded in `.tickmarkr/overseer/PARK-P94-EXEC.md` with their rulings (`RULING-P94-09`,
`RULING-P94-10`). **Neither belongs in the intended-broken register above** — they are open debt with
owners, not deliberate breakage.

### 6.4 Standing prohibition, re-affirmed

**No plan in this phase proposed or applied `GRANT SELECT ON auth.users`.** Postgres's own `HINT`
suggests it; it would convert 8 fail-closed RLS policies into a live self-service privilege
escalation through user-writable `raw_user_meta_data`. Every plan's SUMMARY states independently that
it was neither proposed nor applied.

### 6.5 Register-hygiene FINDING, OPEN

Four ids have a body entry in `.planning/REQUIREMENTS.md` but **no row in its status table** — the
table that is the actual queue:

```
COPY-06        entry present, status-table row: 0
COUNT-04       entry present, status-table row: 0
EDGEPATH-01    entry present, status-table row: 0
FUNC-GRANT-01  entry present, status-table row: 0
```

Control, same instrument, same file: `DEAD-09` → **1** row (`| DEAD-09 | Phase 95 — Routes That
Don't Render | Pending |`, line 520); `COUNT-03`, `E2ESTALE-01`, `ARMA-01`, `ORACLECAP-01` → 1 each.
The table holds 81 rows. So the four zeros are real absences, not a broken match.

**This is the "filed somewhere, queued nowhere" shape**: each of the four names its owner inside its
own prose, and each is invisible to anyone reading the queue. Recorded OPEN and handed to the
orchestrator — **this plan does not write `.planning/REQUIREMENTS.md`**, and the disposition of the
nine requirement checkboxes is a single act in the orchestrator's close-out, not a mid-phase edit.

---

## 7. REQUIREMENT DISPOSITION — all NINE (`D-01`)

**This section is prose disposition, not marking.** No checkbox in `.planning/REQUIREMENTS.md` is
flipped by this plan; the nine flips happen once, in the orchestrator's close-out, after the
overseer's acceptance ruling (`RULING-P94-09` set _when_ that becomes permissible, not _who_).

<!-- prettier-ignore -->
| requirement | disposition | evidence | what stays open |
| --- | --- | --- | --- |
| **`WRITE-01`** create / save / publish | **CLOSED FOR PUBLISH SPECIFICALLY** | Create + save halves proven by 94-01 (`Tests 31 passed`, `Tests 3 passed`). Publish half was blocked by a real defect, parked as `PARK-EXEC-01`, authorised by `RULING-P94-09`, repaired by the `94-01A` lane: `after-actions-publish` deployed **v13**, proven BOTH directions including the `400` guard's **first observed fire in that function's history** (404 on v12 → 400 on v13, same diagnostic). | **The parse CLASS is not closed.** `EDGEPATH-01` (Phase 100). No derivation here implies otherwise. |
| **`WRITE-02`** list + detail | CLOSED | `after-actions-list-all` rewritten to two batched `.in('id', ids)` lookups (no FK exists to embed through — 5 FKs on `after_action_records`, all to `auth.users`) and **redeployed**; probe: `rows with engagement === null : 0`, `PASS`. Detail: bilingual keys, colon form, `role="alert"`; spec `1 passed`. | `dossier === null` arm has no live staging instance — **code-verified only**. The `conflict.*` inline-English group → Phase 99. |
| **`WRITE-03`** intake dossier id | CLOSED | Zod 4.3.6 `.uuid()` enforces RFC-9562 version/variant bits; 35 of 44 staging dossiers fail it. `.min(1)` keeps requiredness (pre-existing "zod blocks submit" case survives green). `Tests 4 passed`. Filed field-mismatch diagnosis measured FALSE and corrected in the same commit. | End-to-end submission against live staging is not component-level; the component oracle is what exists. |
| **`WRITE-04`** kanban commitment drag | CLOSED | Refusal before the write through ONE shared decision function, two enforcement points (`D-33`, no drift by construction); droppable predicate proven expressible in real dnd-kit 6.3.1 against its own registry (`D-04` closed **affirmatively**, fallback not taken); persistence proven by **read-back through a user JWT** with a live past-due coercion control. Reverse mapping stated (derivation 1). | **`W4` is OPEN and unpinned:** releasing a past-due card over the **disabled** In-progress column lets `closestCenter` retarget to Done, writing `completed` behind nothing but the global success toast. Tolerated because the landing is visible; **no oracle pins it.** `overdue` rendering → Phase 96 (`COUNT-04`). The `KanbanProvider.handleDragOver` in-place mutation needs a ruling on ownership. |
| **`WRITE-05`** `/settings` save | CLOSED **for Population A** | `.upsert({id,…})` → `.update(…).eq('id', user.id)`; the notification bridge became reachable and its **effect** was observed round-tripping through a full page reload. `2 passed (17.0s)`. | **Population B** (five child routes) is a **stated untested exclusion** on assumption A4 — carried, not verified (derivation 2). |
| **`WRITE-06`** reports | CLOSED | Policy half: `42P17` broken by a pinned-`search_path` `SECURITY DEFINER` owner check, applied via MCP — **the phase's only schema change** — with `D-22` proven two-sided (`A=1 / B=1 / C=0`; the negative half is not vacuous because A and B reached the row through the path C was refused on). Generate half: `template`→`type` shipped **paired** with a tested pure mapping that makes a fabricated `completed` impossible. | `DEAD-09` — the mock POST handler — filed dead with owner **Phase 95**, deliberately not fixed. |
| **`AUDIT-DROP-01`** backend audit write | CLOSED | `logSecurityEvent` rewritten against the live `public.audit_log` column set; `tenant_id` **derived, never invented** (`COALESCE(profiles.organization_id, users.default_organization_id)`, queried by `profiles.user_id` because `profiles` has no `id` column), unresolvable = loud SKIP. 4/4 in a directory that actually runs; exact payload shape proven to land live (HTTP 201 → read back → deleted). | Grade is LOG-LOUDLY-AND-CONTINUE at both backend sites, stated at each site. |
| **`AUDIT-ZERO-01`** edge audit writers | CLOSED | 27 writers / 33 insert sites through the shared helper, **all 27 redeployed** (27 verdict-last `OK`, 0 `FAIL`). `public.audit_logs` is **no longer empty for the first time in the project's history**, and the first row was written by the **deployed `inactive-users`** at 15:42:15Z, not by a probe. Key-diff re-run: **0 broken** with the base tree as positive control (derivation 3). | **Variable-assembled spread payloads were never in the population and remain unmeasured** — carried in the register, not closed. |
| **`ARMA-01`** the test disjunction | CLOSED | Arm (b) deleted, ordered strictly AFTER the migration (`D-02`); `query-error-state` count **0** against a positive control of 2; `1 passed (3.8s)` with `--no-deps` + inline auth and a hardcoded count. | — |

**Nothing was silently absorbed.** Every requirement is closed with named evidence or carries a
named open item with an owning id and phase.

---

## 8. WHAT THESE DERIVATIONS DID **NOT** ESTABLISH

A uniform pass is suspicious. Three independent plan-check rounds each found defects the previous
round missed; the honest prior is that more exist, not that the set is clean.

1. **A REAL C9b consumer was not run.** `frontend/tests/e2e/user-management.spec.ts` drives
   `create-user` and the `assign-role` role-change flow live — both now **precondition**-graded, so
   their failure paths changed. It needs a provisioned app plus the Playwright `setup` project for
   pre-auth, which `E2ECRED-01` forbids any oracle here from depending on. **Whether it passes today
   is unknown**, independently of the change. A Phase 86 finding has `create-user` POST hanging to
   500 from the browser (owner Phase 90/ops), so its create leg may already be red for an unrelated
   reason — **not verified, and not to be taken on anyone's word.** This is a genuine gap needing an
   orchestrator call: run it against a provisioned app, or park it with an owner.
2. **`W4` is unpinned.** The retarget-to-Done hole in `WRITE-04` has no oracle. It is recorded as a
   gap, not as coverage.
3. **`94-07_g1`'s inner-join arm was NOT CONSTRUCTED** — the probe was never run against a live
   inner-join bundle, because that means redeploying a known-broken function to shared staging. The
   old failure mode was reproduced read-only (`PGRST200`) instead.
4. **The list probe's population is ONE record.** Staging holds exactly one `after_action_record`.
   A one-row population cannot exercise a partial drop; the `dossier === null` arm is code-verified
   only.
5. **Arabic naturalness is UNREVIEWED.** See §7 note below. **Pixel RTL is unverified.**
6. **The i18n mask floor was not re-derived** (§6.2) and `common.json`'s whole-namespace asymmetry
   is unguarded (§2.4).
7. **The `.insert(payload)` spread class in edge audit writers is unmeasured** (§2.3).
8. **`RLS WITH CHECK` silent zero-row updates** are the trigger sweep's own stated blind spot and
   were **not** swept. So is the completeness of that sweep itself: `D-34` records it as
   **asserted, not proven** — no synthetic negative control was run against its regex.
9. **Six gates are weaker than they read** (§1.3). Each is passable-when-done, so none is a PARK,
   but four could be satisfied by a comment and two by a file-shape assertion.
10. **The C9b sweep cannot see shape-only coupling** (§5), and the residual defence — running the
    shipped suites — covers only the suites that were run.

### Arabic provenance (`RULING-P94-07`) — carried into the closing register verbatim

The Arabic strings this phase **authored** — 94-03's four `unified-kanban:errors.*` reject keys,
94-07's `loadError` / `notFound` / `notFoundDescription` / `degraded.engagementMissing`, and
94-09's `report-builder:generate.unavailable` — were written by a **non-native speaker** under
planning-round time pressure. They ship **as authored**. They are grammatical, on-glossary (94-03
verified its bodies against the shipped `columns.*` terms rather than assuming), key-set-equal to
their EN twins, and string-**unequal** to them (derivation 4: 0 identical values).

**Their naturalness is UNREVIEWED, and no artifact in this phase may be read as vetting it.**
Naturalness and pixel RTL are **OPERATOR parks** and join the standing sitting alongside the
Phase 93 error states (`RULING-P93-06` order 2). The key-set-equality gate proves the keys exist in
both locales; it proves nothing about how the Arabic reads.

---

_Phase: 94-write-paths · single author, whole plan set, one pass · base `phase-94-base` (`3d63da95f`)_
