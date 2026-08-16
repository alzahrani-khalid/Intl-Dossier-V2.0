# Phase 94: Write Paths - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

**Every advertised write path actually writes, and a failed write says so.**

Five named write paths — after-actions (create/save/publish, list, detail), intake submission,
kanban commitment drag, `/settings` save, report generation + scheduling — plus the two audit-write
paths that have never recorded a row, plus the deletion of a test disjunction that `WRITE-06`
unblocks.

**Nine requirements**, not six. `ROADMAP.md` §Phase 94 listed only `WRITE-01..06` until 2026-08-16;
`AUDIT-DROP-01`, `AUDIT-ZERO-01` and `ARMA-01` are assigned to this phase by `REQUIREMENTS.md`
(§WRITE block, and `ARMA-01`'s own "Owner: Phase 94 — Write Paths"). The roadmap line was aligned in
commit `ba19751c6` with the rationale inline. Phase 93's line carried its four inherited ids, so
this is the house convention rather than new scope.

**This phase does not** widen error-visibility work (Phase 93 closed that), fix routes that do not
render (Phase 95), or reconcile counts (Phase 96). `RETENTION-CAST-01` (P95),
`DR-SUBPATH-01`/`RLS-AUTHUSERS-01` (P100), `DELEG-02`/`GATESTD-01` (P102) are explicitly out.

</domain>

<decisions>
## Implementation Decisions

Numbering restarts per phase (P92 used `D-01..D-30`, P93 `D-01..D-26`). Decisions carried forward
from Phase 93 are marked **[inherited]** and cite their origin, so a downstream agent can tell a
standing law from a fresh call.

### Scope and requirement mapping

- **D-01: The phase closes 9 requirements.** `WRITE-01..06`, `AUDIT-DROP-01`, `AUDIT-ZERO-01`,
  `ARMA-01`. Source: `.planning/REQUIREMENTS.md` §WRITE (`WRITE-01..06`, `AUDIT-DROP-01`,
  `AUDIT-ZERO-01`) and §`ARMA-01` ("Owner: Phase 94 — Write Paths, alongside `WRITE-06`, which is
  the event that unblocks it"); `.planning/ROADMAP.md` §Phase 94 as amended by `ba19751c6`.
- **D-02: `ARMA-01` rides inside the plan that closes `WRITE-06`, ordered strictly AFTER the
  `42P17` fix.** Not a separate plan, not a separate wave. Source: `REQUIREMENTS.md` §`ARMA-01` —
  "Leaving the disjunction in place after `WRITE-06` converts a rejection into a pass and makes the
  green permanent and false." The action is a **deletion**: arm (b) of
  `tests/e2e/93-report-notfound.spec.ts`'s `404 OR query-error-state` disjunction is removed and the
  404 arm asserted alone. Sequencing it before the policy fix would red a spec for the right reason
  at the wrong time.

### WRITE-04 — the kanban commitment drag

- **D-03: The commitment lifecycle is FIVE values, and every document that said four was wrong.**
  Re-derived by live catalog query against staging `zkrcjzdemdmwhearhfgg` on 2026-08-16
  (`RULING-P94-01` order 2): `aa_commitments_status_check` is
  `status IN ('pending','in_progress','completed','cancelled','overdue')`. `CLAUDE.md`,
  `REQUIREMENTS.md` WRITE-04 and this phase's own park all repeated the same four-value list; all
  three were corrected. **Re-derive it again before writing the mapping** — do not trust this line
  either. `review` is absent under both readings.

  > **RELABEL NOTE, 2026-08-16 — five decisions were renumbered so the coverage gate can see them.**
  > They were first written as sub-lettered ids `D-03a`–`D-03e`. `scripts/decision-coverage.mjs:43`
  > extracts decisions with `/\*\*(D-\d{2})[:*]/` — **exactly two digits followed by `:` or `*`** — so
  > a sub-lettered id never becomes a tracked decision at all. Measured, not inferred: the extractor
  > reported `total: 29` with `D-03a`–`e` absent from the id list, meaning five decisions (including
  > the `PARK-94-04` trigger split and the order-4 sweep) could be cited by no plan and coverage would
  > still read green. Relabelled by **appending** to the end of the sequence, never by renumbering, so
  > every id already cited elsewhere (`D-08`, `D-22`, `D-24`, `D-26`) stays valid:
  >
  > <!-- prettier-ignore -->
  > | was | now | subject |
> | --- | --- | --- |
> | `D-03a` | **`D-30`** | the stage→status map is one cell, not four |
> | `D-03b` | **`D-31`** | the reverse mapping is part of the population |
> | `D-03c` | **`D-32`** | the `BEFORE UPDATE` trigger overwrites the kanban write |
> | `D-03d` | **`D-33`** | `PARK-94-04` ruled (a), SPLIT |
> | `D-03e` | **`D-34`** | the order-4 trigger sweep, as input |
  >
  > The script defect itself is tracked as `GATESTD-03`. Lineage: Phase 93 found the _coverage_ regex
  > misreads `D-06a` as `D-06`; this is the _extraction_ regex, which drops it entirely — same class,
  > two instruments.

- **D-30: The stage→status map is ONE cell, not four, and the plan must say so.** Measured at
  `WorkBoard.tsx:67,78-84`: `todo→pending`, `in_progress→in_progress`, `done→completed` are
  **already valid** commitment statuses today. Only `review→review` is rejected by the constraint.
  The filed requirement text reads as four mappings; the defect is one. A four-way remap would
  produce three no-change edits and a gate that cannot distinguish them from work.
- **D-31: `WRITE-04`'s population definition states the REVERSE mapping — where each of the five
  live statuses renders — or excludes one explicitly with what falls outside.** [`RULING-P94-01`
  order 2.] Columns→statuses is the direction everyone asked; statuses→columns is the direction that
  hides cards. Derived: `pending`→Todo, `in_progress`→In-progress, `completed`→Done,
  `cancelled`→**not rendered** (filtered at `WorkBoard.tsx:203` before bucketing — deliberate and
  correct), `overdue`→**Todo via the `default` branch**, indistinguishable from never-started.
  Handling `overdue` is **not** Phase 94 work; it is filed as `PARK-94-03` with a recommendation to
  own it in Phase 96. Phase 94 states the population and stops there.
- **D-32: A `BEFORE UPDATE` trigger overwrites the kanban's commitment write, and this — not the
  status mapping — is what actually breaks success criterion 4 today. PARKED as `PARK-94-04`; it
  BLOCKS the criterion's wording.** `commitment_overdue_check` runs `check_commitment_overdue()`
  before every update: `IF NEW.due_date < CURRENT_DATE AND NEW.status IN ('pending','in_progress')
THEN NEW.status := 'overdue'`. On staging, **8 of 10 commitments are already `overdue`** and the
  other 2 are past-due `pending` (the trigger is UPDATE-only and never fires on INSERT). So for a
  past-due card: a drag to In-progress writes `in_progress`, the trigger rewrites it to `overdue`,
  `resolveBoardStage` sends `overdue` to `todo`, and **the card snaps back to Todo after a success
  toast**. A drag to Todo writes `pending` and is likewise coerced. Only Done persists. Proven by a
  rolled-back transaction (write `in_progress` → read back `overdue`; census 8/2 unchanged after).
  **Consequences the planner must not miss:** (i) no `WRITE-04` oracle may assert persistence by
  asserting "no error" — the write succeeds and is silently overwritten; (ii) an oracle that drags a
  commitment on staging will, with probability 8/10, be dragging a past-due one; (iii) a round-trip
  oracle that drags out and back cannot restore the original stored value.
- **D-33: `PARK-94-04` RULED (a), SPLIT (`RULING-P94-03`). The trigger is correct and stays.**
  Phase 94 owns the **criterion wording and the honest interaction**; Phase 96 owns the rendering.
  Candidate (c) — wording only — was REFUSED: it leaves a success toast followed by a visible
  snap-back on the board's most common drag, which is the lie this phase exists to end.
  - **The interaction:** the `PARK-94-01` machinery **extends to drags the trigger would coerce**.
    The droppable predicate and the mutation-layer guard refuse them **before the write**, with a
    bilingual `role="alert"` message naming the derived state and the remedy the trigger itself
    honours (extend the due date, or complete it).
  - **The predicate mirrors the trigger's own condition** — `due_date < CURRENT_DATE` and the
    status about to be written is `pending` or `in_progress`. One condition, two enforcement
    points, **no drift by construction**. Do not paraphrase the condition; mirror it.
  - **The criterion sentence is authorized to change** from the roadmap's "persists" to this
    invariant: _a commitment drag persists exactly when the DB's own state machine permits it; a
    drag the trigger would coerce is refused before the write with the real bilingual reason; the
    stored value always equals either what was written or what the user was told; never a success
    signal followed by a snap-back._ **Strength must not drop** — "no error shown" remains
    insufficient to pass, and the oracle **must include the coercion case** (a forced past-due drag
    observed refused). The per-column table in `PARK-94-04` is the oracle's row set.
  - **Switch note the plan carries:** whether refusal remains the right interaction once `overdue`
    renders distinctly is Phase 96's to revisit; the ruling does not settle it.
- **D-34: The `RULING-P94-03` order-4 trigger sweep is DONE and its findings are inputs, not
  homework** — `.tickmarkr/overseer/P94-TRIGGER-SWEEP.md`. Swept: every `BEFORE` trigger in schema
  `public` whose body assigns to a `NEW.` column (29 across 25 tables), then intersected with the
  write paths — derived schema-wide, **not** by listing the tables I already suspected. Results:
  `tasks.trg_sync_task_status` derives `status` from `workflow_stage`, making `WorkBoard.tsx`'s
  `STAGE_TO_STATUS` a **second copy of a DB rule that nothing keeps in sync** (they agree today, by
  authorship not construction) — so no oracle asserts the client's task `status` payload reached
  the row; `intake_tickets.calculate_ticket_priority` derives `priority` from `urgency`+
  `sensitivity` and the form never sends `priority` — benign; `report_schedules` derives
  `next_run_at`, and an inactive schedule legitimately has it **NULL** — a `WRITE-06` oracle
  asserting non-null would fail a correct row; `commitment_status_history` records the **coerced**
  status, so it is **not** evidence of user intent. **Clean (no rewriting BEFORE trigger):**
  `after_action_records`, `custom_reports`, `report_shares`, `users`,
  `notification_category_preferences`, `audit_log`, `audit_logs`, `engagements`. The sweep's own
  stated blind spots (AFTER triggers, `INSTEAD OF` on views, non-literal assignment forms, and
  RLS `WITH CHECK` silent zero-row updates — the closest sibling class) carry forward; its
  completeness is **asserted, not proven** — no synthetic negative control was run against the regex.
- **D-04: A commitment dragged to `review` — RULED (b) + (a).** `RULING-P94-01` on `PARK-94-01`:
  `review` is a non-droppable target for commitment cards, **with** the mutation-layer reject as the
  safety net, because a visual guarantee is not a mutation-layer guarantee and criterion 4's own text
  ("a rejected drag shows the real message") demands the net regardless. The plan carries a one-line
  switch note. **The ruling explicitly does NOT establish that a per-card droppable predicate is
  expressible in the installed dnd-kit version** — the oracle must PROVE it, not assume it. If it is
  not expressible, **(a) alone is the fallback** and the switch note says so. Adding `review` to the
  lifecycle stays refused (D-06).
- **D-05: The no-op guard is a SECOND, distinct defect inside `WRITE-04`, and it is the one that
  produces the false success.** `WorkBoard.tsx:307` short-circuits on
  `targetStage === item.workflow_stage`. `workflow_stage` is **tasks-only** and is `null` for every
  commitment (`work-item.types.ts:70`), so **no commitment drag is ever recognised as a no-op** — a
  card dropped back on its own column still fires a mutation, the mutation succeeds writing the
  value it already held, and the app-wide success toast fires. Fix: compare against
  `resolveBoardStage(item)`, which is already the function the board uses to place the card.
- **D-06: `aa_commitments`' columns and enums are never renamed or extended; the mapping lives at
  the mutation layer.** Source: `CLAUDE.md` §Source-Specific Column Carve-Outs ("do **not** rename
  them to match the glossary… map these columns at the query layer"); ORCH-BRIEF §3 `WRITE-04`.
  Adding `review` to the commitment lifecycle is refused, and the refusal is recorded (PARK-94-01
  candidate (d)) so it reads as a decision rather than an oversight.
- **D-07: The app-wide success toast — RULED NARROW.** `RULING-P94-01` on `PARK-94-02`: Phase 94
  fixes the no-op guard and **does not edit** the global handler. The string
  `Operation completed successfully` is not kanban code; it is the global mutation `onSuccess` at
  `frontend/src/lib/query-client.ts:71`, firing for every mutation in the app, with no Phase 94
  oracle watching those paths. **The literal is TRACKED, not noted** — filed as `COPY-06` in
  `.planning/REQUIREMENTS.md` §COPY, owner **Phase 98 — Copy Truth**. An audit line is not a queue;
  nothing fails if a "deferred idea" is never read. Any plan or agent that treats `COPY-06` as
  in-scope for Phase 94 is wrong.

### What "a failed write says so" means

- **D-08: A surfaced failure is a SPECIFIC TRANSLATED message, never a server-originated
  `error.message`.** [inherited — P93 `D-08`: "No server-originated `error.message` reaches the
  user"; `CLAUDE.md` §Security: "User-facing errors never leak internals… diagnostics go to logs".]
  **Reinforced as `RULING-P94-01` order 1, and it is an ACCEPTANCE CRITERION, not a comment:** the
  `WRITE-04` reject message is a bilingual i18n key rendered with `role="alert"`, EN+AR under the
  key-set-equality gate. Rendering the raw supabase CHECK-violation string would reintroduce the
  `LEAK-ATTACH-01` class this milestone just repaired.
  **`RULING-P94-03` order 3 — there are now TWO reject causes and they need TWO DISTINCT KEYS,**
  both locales: (i) the board's `review` stage has no counterpart in the commitment lifecycle;
  (ii) the drag would be coerced because the commitment is past its due date. **A single generic
  "cannot move" message is REFUSED** — criterion 4's own text says the REAL message, and one string
  covering two causes tells the user neither the reason nor the remedy.
  This resolves the apparent tension in `WRITE-04`'s "failures surface the real message": _real_
  means specific and true, not _raw_. Two live violations are already in this phase's own files and
  are in scope because this phase's criteria pass through them:
  `useUnifiedKanban.ts` onError toast (`description: error.message`, plus a hardcoded English
  title) and `after-actions/$afterActionId.tsx:109`
  (`(err instanceof Error ? err.message : null) ?? t(...)` — the raw message wins whenever one
  exists, so the fallback key is nearly dead).
- **D-09: Error and success copy introduced by this phase lands in BOTH locales, gated by the
  i18n key-set-equality pattern Phase 93 proved.** [inherited — P93 `D-04`.]
- **D-10: Every `t()` call this phase adds or repairs uses the COLON namespace form.** The dot form
  resolves against the aliased default namespace and renders the raw key — which is exactly the
  `WRITE-02` detail defect (`$afterActionId.tsx:65`: `t('afterActions.loadError')`). A fix that
  keeps the dot form and merely adds the key to the wrong namespace reproduces the bug silently.
- **D-11: Reuse the shared query-error component Phase 93 extracted rather than authoring new error
  markup.** [inherited — P93 `D-03`.] `role="alert"`, bilingual, internal-string-free (P93 `D-04`).

### WRITE-02 — after-actions list and detail

- **D-12: The list fix repoints the embed at the table that holds the FK.**
  `supabase/functions/after-actions-list-all/index.ts:89` embeds
  `engagement:engagements!inner (…)`. Two failure modes, and the plan addresses both explicitly:
  the wrong relation, and `!inner`, which **hides** any after-action whose join misses.
- **D-13: An after-action whose engagement row is missing is LISTED in a named degraded state, not
  hidden.** [inherited — P93 `D-07`: an engagement whose extension row is missing renders a named,
  degraded state rather than a titleless shell.] `!inner` silently deletes rows from a list the user
  is told is complete, which is the confident-empty class Phase 93 closed. Dropping `!inner` without
  handling the null join would trade a hidden row for a titleless one — also refused by P93 `D-07`.

### WRITE-05 — /settings

- **D-14: The `users` write becomes `.update(…).eq('id', user.id)`.**
  `frontend/src/pages/settings/SettingsPage.tsx:211` uses `.upsert({ id, full_name, … })` with **no
  `email`**. PostgREST upsert is `INSERT … ON CONFLICT DO UPDATE`; the INSERT tuple must satisfy
  `NOT NULL email` before conflict resolution is reached, so the write fails for an existing row —
  every Save. This is a _second_ defect in the same call: a prior phase already repaired a 23-column
  version of it (see the comment in place at :205-209), which is why the file looks fixed and is not.
- **D-15: The notification-bridge step is unreachable, not broken.** Steps 2 and 3 of the same
  `mutationFn` (`SettingsPage.tsx:225-280`) are written correctly and never execute, because step 1
  throws first. The plan states this: the fix to D-14 is what makes the bridge run, and the
  acceptance criterion must observe the bridge's effect, not merely that Save stops erroring.
- **D-16: "Every `/settings` tab" is a POPULATION, and it is derived and stated, never assumed.**
  `/settings` is a layout route (`routes/_protected/settings.tsx`) rendering `SettingsPage` at the
  exact path and an `<Outlet/>` for five child routes (`calendar-sync`, `email-digest`,
  `integrations`, `notifications`, `webhooks`) plus a `calendar` directory. The criterion says
  "every tab saves"; the plan states which surfaces are in the population, which are outside it, and
  why — including whether a child route counts as a "tab".

### The two audit-write defects

- **D-17: Column maps are re-derived against live staging (`zkrcjzdemdmwhearhfgg`) BEFORE the helper
  is written.** [inherited — the verify-constraints-before-seed law; ORCH-BRIEF §3.] Both
  `REQUIREMENTS.md` column lists were derived on 2026-08-15 and are evidence, not a substitute for
  re-derivation. `public.audit_log` (singular, backend Express, `AUDIT-DROP-01`) and
  `public.audit_logs` (plural, edge functions, `AUDIT-ZERO-01`) are **different tables with
  different column sets** — a single shared helper across both runtimes would have to reconcile
  them, and the plan must not assume they can be.
- **D-18: The insert error is surfaced, not swallowed.** Both defects are the same class as
  `TRUST-01` — a failure rendered as success. `auth.service.ts:847`'s `try/catch` calls `logError`
  and returns; the edge sites mostly `await` without destructuring `error`. "Surfaced" here means
  reaching a log with the failure distinguishable from success, and — where an audit write is a
  precondition of the action — failing the action. Which sites are precondition-grade is a planning
  call the plan states per site.
- **D-19: A fixed edge function that is not REDEPLOYED has not been fixed.** The phase goal is that
  the write actually writes; source-only repair leaves the deployed function writing the old shape.
  Deploy via Supabase CLI/MCP; `scripts/probe-edge-auth.sh` exists and works for deploy evidence
  (ORCH-BRIEF §3). P92's 139-deploy round is the precedent.
- **D-20: `AUDIT-ZERO-01`'s population is re-derived, and its stated blind spots are carried
  forward.** `REQUIREMENTS.md` already names them: nested-object keys were not individually
  validated, `.upsert()` and RPC-mediated writes were not searched. The plan either widens the
  search or restates the exclusion — it does not inherit the number silently.

### WRITE-06 — reports

- **D-21: The `42P17` fix is a migration file applied through the Supabase MCP, never ad-hoc DDL.**
  Source: `CLAUDE.md` §Security ("Schema changes only via migration files (`apply_migration`)").
- **D-22: The recursion fix must not widen the visible row set, and that is asserted, not assumed.**
  Breaking a mutual `custom_reports` ↔ `report_shares` SELECT recursion is commonly done with a
  `SECURITY DEFINER` helper, which bypasses RLS by construction. The acceptance criterion is
  therefore two-sided: no `42P17`, **and** a user still sees only their own rows plus rows genuinely
  shared with them. An oracle that only proves the error is gone would pass a policy that returns
  everything to everyone. This is the phase's sharpest security risk and it is named here so the
  planner cannot treat it as a footnote.

### Gates, oracles and derivations — standing law

- **D-23: `.planning/GATE-STANDARD.md` C1–C10, including C9a and C9b, governs every gate from
  authoring.** [inherited — P93 `D-17`.] Both directions observed per gate; a gate whose done state
  cannot be constructed is labelled **UNPROVEN with what it needs**, never folded into a pass.
  `GATESTD-01` (the standard's own sed/unsafe-id defect) is filed to Phase 102 — work around it, do
  not repair the standard mid-phase without a ruling.
- **D-24: Every closing derivation states its POPULATION DEFINITION and what falls outside it.**
  [inherited — P93 `D-18`.] A population partitioned by ORIGIN states its seams: the
  `LEAK-ATTACH-01` lesson is that two instruments sharing a partition agreed with each other and
  were both blind.
- **D-25: Behavioural criteria carry behavioural oracles; producers are ordered before consumers.**
  [inherited — P93 `D-19`.] All five success criteria are write-then-observe claims. Each plan says
  how its criterion is **observed** — spec, probe, or explicitly manual-with-owner — not only
  grepped. An oracle that cannot run until execution is labelled as such.
- **D-26: Playwright oracles assert spec-file existence FIRST and hardcode the expected count.**
  Spec paths are **filters**: ≥2 paths with ≥1 match silently drops the rest and exits 0. A
  list-derived count cannot fail. Any command naming a project with `dependencies:` passes
  `--no-deps`, including `--list` (GATE-STANDARD C6).
- **D-27: No oracle may depend on the e2e `setup` project.** [inherited — P93 `D-20`.] `E2ECRED-01`
  is an operator act that has not happened; the phase's code criteria must be closeable without it.
  Route around per the P92/P93 precedent (`--no-deps` + inline auth) or park.
- **D-28: C9b rows carry the mock-vs-real column from authoring.** A consumed-verification counts
  only when the consumer exercises the REAL subject; a mocked consumer is recorded as a
  **NON-ORACLE** and never folded into the defence count.
- **D-29: No two writers share an output path.** The independent `gsd-verifier` artifact in
  particular must not collide with an executor's register — two writers on one path destroyed a
  verdict in P92 planning.

### Claude's Discretion

Technical shape is the planner's and researcher's, within the constraints above: how the `42P17`
recursion is broken (subject to D-22), whether the audit-write helper is one module or two
(constrained by D-17's two-table finding), how the non-droppable predicate is expressed in dnd-kit,
and the internal structure of the `after-actions-list-all` query. None of these change what the user
sees, so none is parked.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements

- `.planning/ROADMAP.md` §Phase 94: Write Paths — goal, 9 requirements, 5 success criteria
- `.planning/REQUIREMENTS.md` §WRITE — `WRITE-01..06`, `AUDIT-DROP-01`, `AUDIT-ZERO-01` with the
  live-staging-derived column lists
- `.planning/REQUIREMENTS.md` §`ARMA-01` — the arm-(b) deletion and why order matters
- `.tickmarkr/overseer/PARK-P94.md` — the forks. `PARK-94-01`/`-02` are RULED; `PARK-94-03`
  (`overdue` handling) is open and blocks nothing. Read before writing `WRITE-04`'s criterion
- `.tickmarkr/overseer/RULING-P94-01-PARKS.md` — the ruling and its three orders. Order 1 (bilingual
  reject key), order 2 (five-value lifecycle + reverse mapping), order 3 (`COPY-06` filed)
- `.planning/REQUIREMENTS.md` §`COPY-06` — the tracked global-toast literal, owner Phase 98. Named
  here so no Phase 94 plan folds it back in

### Standing law inherited from Phases 92-93

- `.planning/GATE-STANDARD.md` — C1–C10 incl. C9a, C9b. The bar every gate is authored against
- `scripts/gate-drill.mjs` — mechanical half; a green from it is **not** evidence a gate is sound
- `scripts/decision-coverage.mjs` — the decision-coverage gate; scans frontmatter
  `must_haves`/`truths`/`objective` and matching body headings ONLY
- `.planning/phases/93-failure-visibility/93-CONTEXT.md` — `D-03`/`D-04` (shared error component,
  bilingual, `role="alert"`), `D-07` (named degraded state), `D-08` (no server `error.message`),
  `D-17`/`D-18`/`D-19`/`D-20` (gate standard, populations, behavioural oracles, no e2e `setup`)

### House rules

- `CLAUDE.md` §Source-Specific Column Carve-Outs — `aa_commitments` uses `due_date`/`owner_*`;
  `tasks` uses `sla_deadline`/`workflow_stage`; intake `urgency` keeps `critical`. Do not normalize
- `CLAUDE.md` §Security (via `~/.claude/rules/core.md`) — migrations only via `apply_migration`;
  RLS on every end-user table; user-facing errors never leak internals
- `CLAUDE.md` §Deployment Configuration — staging `zkrcjzdemdmwhearhfgg`, eu-west-2
- `frontend/DESIGN.md` then `frontend/src/design-system/CLAUDE.md` — the Linear spec and the runtime
  token engine, in that order, before any UI edit

### The seams, pinned

- `frontend/src/components/after-action-form/AfterActionForm.tsx:130-134` — `if (!initialData) return`
- `frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx` — the route that must
  pass `canPublish` + `onPublish`
- `supabase/functions/after-actions-list-all/index.ts:85-89` — the embed and its `!inner`
- `frontend/src/routes/_protected/after-actions/$afterActionId.tsx:65,109` — the dot-form key and
  the raw-`err.message` publish toast
- `frontend/src/routes/_protected/intake/new.tsx` — the dossier picker / Zod field mismatch
- `frontend/src/pages/WorkBoard/WorkBoard.tsx:67,78-84,97-98,307-311` — stages, the task-status map,
  the dead `review` branch, the no-op guard
- `frontend/src/hooks/useUnifiedKanban.ts:300-330,368-386,405-490` — the intake mapper the commitment
  branch never got, the raw commitment write, the leaking onError toast
- `frontend/src/lib/query-client.ts:62-72` — global mutation `onError`/`onSuccess`
- `frontend/src/pages/settings/SettingsPage.tsx:205-280` — the `.upsert()` and the unreachable bridge
- `backend/src/services/auth.service.ts:847` — `logSecurityEvent`
- `supabase/functions/assign-role/index.ts:244` — representative `audit_logs` shape mismatch
- `tests/e2e/93-report-notfound.spec.ts` — the disjunction `ARMA-01` deletes

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable assets

- **The shared query-error component from Phase 93** (`D-03`/`D-04`): bilingual, `role="alert"`,
  internal-string-free. Every error surface this phase adds should reuse it rather than author new
  markup.
- **`mapToValidIntakeStatus`** (`useUnifiedKanban.ts:303-326`) is the exact pattern `WRITE-04` needs
  for commitments — a source-specific column-key→lifecycle mapper with an explicit unknown-key
  branch. The commitment branch is the one source that never got one. Mirror it rather than invent.
- **`resolveBoardStage`** (`WorkBoard.tsx:92-106`) already computes a commitment's board column from
  its status. The no-op guard (D-05) should call it instead of reading `workflow_stage`.
- **`applySettingsTogglesToCategoryPrefs`** — the read-modify-write bridge in `SettingsPage.tsx` is
  written and correct; it is unreachable, not wrong. Do not rewrite it.
- **`scripts/probe-edge-auth.sh`** — proven deploy evidence for edge functions (P92).

### Established patterns that constrain this phase

- **Result-shaped data clients.** `~/.claude/rules/core.md`: data-access clients return
  `{ ok: true, … } | { ok: false, error }` and never throw; never mix exceptions and result unions
  within one API. The kanban mutation currently throws; whatever it does must be consistent within
  its own API surface.
- **The three-copy palette parity rule** (`tokens/directions.ts` / `public/bootstrap.js` /
  `index.css`) — only relevant if this phase touches color, which it should not.
- **Logical properties only** (`ms-*`/`ps-*`/`text-start`) and `dir` handling for any markup added.

### Integration points

- `after-actions-list-all` is an **edge function**, so `WRITE-02`'s list fix is a deploy, not just a
  source edit (D-19 applies to it too — easy to miss because `WRITE-02` reads like frontend work).
- `SettingsPage`'s save touches `users`, `notification_category_preferences`, and localStorage in
  one `mutationFn`; partial failure semantics across those three are a real design point.
- The `42P17` policy fix is the only schema-level change in the phase, and Phase 96 depends on it
  (`ROADMAP.md` §Phase 96 "Depends on: … Phase 94").

</code_context>

<specifics>
## Specific Ideas

- **The filed text of `WRITE-04` overstates its own defect.** Three of four board columns already
  write valid commitment statuses. The plan states the measured table rather than restating the
  requirement, because a four-way remap would produce three no-change edits that no gate can
  distinguish from work.
- **`SettingsPage.tsx` carries a repair comment for a defect that is not the live one.** The
  comment at :205-209 explains a fixed 23-column upsert; the missing NOT NULL `email` is a different
  failure in the same call. A reader who trusts the comment concludes the file is fixed. Say this in
  the plan.
- **The i18n dot-vs-colon form is the actual `WRITE-02` detail bug**, not a missing translation. A
  fix that adds `afterActions.loadError` to the wrong namespace makes the key resolve and leaves the
  class alive.

</specifics>

<deferred>
## Deferred Ideas

- **The global success toast is a hardcoded English literal — NOW TRACKED, not deferred.**
  `frontend/src/lib/query-client.ts:71`. Ruled out of Phase 94 scope (`RULING-P94-01`, narrow) and
  filed as **`COPY-06`** in `.planning/REQUIREMENTS.md` §COPY, **owner Phase 98**. Left in this list
  only as a pointer to the tracked entry — the entry is the queue, this line is not.
- **Double-toast on a failed mutation.** The global `onError` (`query-client.ts:62-66`, sanitized)
  and a mutation-level `onError` both fire in TanStack Query v5, so a failed kanban drag shows two
  toasts. This phase fixes the _leaking_ one (D-08); whether the app should show one or two is a
  broader interaction question with no Phase 94 criterion.
- **`resolveBoardStage`'s dead `review` branch for commitments** (`WorkBoard.tsx:97-98`) — harmless
  today, and its removal depends on how `PARK-94-01` is ruled. Clean up with that ruling, not before.
- Out-of-phase by prior ruling, listed so no plan folds them in: `RETENTION-CAST-01` → Phase 95;
  `DR-SUBPATH-01`, `RLS-AUTHUSERS-01` → Phase 100; `ORACLECAP-01`, `E2ECRED-01` → Phase 101;
  `DELEG-02`, `GATESTD-01` → Phase 102; `NOTFOUND-COMPONENT-01` → Phase 95.

</deferred>

---

_Phase: 94-write-paths_
_Context gathered: 2026-08-16_
