# Phase 100 — Security Posture: Database & Client — CONTEXT

**Branch** `milestone/v10.0-trust` · **Planned from HEAD** `c9ef9bf4e` · **Planned** 2026-09-08
**Staging** Supabase project `zkrcjzdemdmwhearhfgg` (`aws-1-eu-west-2.pooler.supabase.com:5432/postgres`)

Every number in this file was re-derived live on 2026-09-08. The command that produced each one is in
`100-RESEARCH.md` beside it. Where a roadmap number did NOT reproduce, this file records the number that
did and names the population that produced it — a wrong number in the roadmap is a finding, not an
obstacle, and three of them are recorded in `100-RESEARCH.md` §7.

---

## 1. What this phase touches

Two surfaces that share a phase but not a mechanism.

**Server side (criteria 1–5)** — the PostgreSQL authorization boundary on staging. 33 views, 12
materialized views, 2 RLS-enabled-no-policy tables, 548 functions with a mutable `search_path`, and one
Auth platform setting. All DDL lands as idempotent migration files under `supabase/migrations/` AND is
applied to staging, because every criterion closes on **live catalog state**, never on a file.

**Client side (criteria 6–7)** — what the browser keeps after the analyst leaves. Five persisted zustand
stores and two raw `localStorage` writers survive sign-out today; production builds ship 304 `.map`
files carrying `sourcesContent`.

## 2. The live-verified facts this phase is built on

### D-01 — The `SECURITY DEFINER` view population is 33, and every one of them is client-reachable

`public` holds exactly 33 views. All 33 are `SECURITY DEFINER` (the advisor flags 33; the catalog holds
33; the sets coincide). All 33 grant `SELECT` to `authenticated`; 32 of them also grant it to `anon`
(`event_details` is the single `authenticated`-only view). Zero currently carry
`security_invoker=true`. So "client-reachable" is not a subset to be discovered — it is the whole
population, and criterion 1's "converted, restricted, or justified" must dispose of all 33.

### D-02 — The bypass is DEMONSTRATED, not inferred, and it is the phase's discriminating measurement

Under `role authenticated` with `request.jwt.claims.sub` set to a **non-owner** (`test.user@gmail.com`):

| read path | rows returned at HEAD |
| --------- | --------------------- |
| `unified_work_items` (the view) | **21** |
| `tasks` + `aa_commitments` + `intake_tickets` (its three base tables, same session) | **0 + 0 + 2** |

The owner (`kazahrani@stats.gov.sa`) sees 21 through both paths. The view returns a non-owner every row
in the system; the base tables return them two. That gap IS the defect, it is measurable in one command,
and it is what criterion 1 must close. Post-conversion expectations, simulated by running the view's own
`UNION ALL` body against the RLS-bearing base tables under each caller: **owner 21, non-owner 2.**

### D-03 — Conversion and revocation are NOT interchangeable; the consumer's ROLE decides which

A view read by an edge function that builds its client from `SUPABASE_ANON_KEY` + the caller's
`Authorization` header executes as `authenticated`. Revoking `authenticated` breaks it. A view with no
application consumer at all cannot break, so revoking is the cheaper and safer disposition.

Measured consumer census (`git grep` over tracked sources, `.from('<view>')` call sites):

- **12 views have a live caller running as `authenticated`** → convert to `security_invoker=on`
  (re-proven together in P100-12).
  Frontend-direct: `unified_work_items`, `mous_frontend`, `event_details`, `working_group_stats`.
  Edge-function-with-caller-JWT: `theme_details`, `relationship_health_summary`,
  `v_country_engagement_metrics`, `v_country_relationship_flows`, `v_regional_engagement_summary`,
  `engagement_recommendations_summary`, `dossier_activity_timeline`, `entity_comments_with_details`.
- **21 views have no application caller** → `REVOKE SELECT` from `anon` and `authenticated`
  (criterion 1's "restricted"), which is also how `upcoming_milestones` satisfies criterion 2.

12 + 21 = 33. The split is exhaustive. The per-object grant proof is an acceptance item in **P100-12**;
the 33/12/12 **arithmetic** is an acceptance item in **P100-15** (D-37). These were one sentence until round 5;
the merged form still attributed the arithmetic to the grants plan after the round-2 split moved it, and
D-37 is the authority whenever this paragraph and it disagree.

### D-04 — `security_invoker` does NOT fix an `auth.users` join; it breaks it

Both criterion-2 views join `auth.users` and select `email` / `raw_user_meta_data`. `authenticated` holds
no grant on `auth.users`, so converting such a view to invoker turns a data leak into a permission
error. Criterion 2's fix is therefore **structural**: `entity_comments_with_details` must stop reading
`auth.users` (its three joins move to `public.users`, which carries `id, email, full_name, avatar_url,
username`) before it can be converted; `upcoming_milestones` has no caller and is revoked instead.
A plan that converts `entity_comments_with_details` without first re-pointing the join ships a 500.

### D-05 — The 548 mutable-`search_path` functions live in three schemas, and the catalog reproduces the advisor EXACTLY

`public` 532 + `read_models` 9 + `events` 7 = **548**, counting `prokind='f'`, no `search_path=` in
`proconfig`, and excluding extension-owned functions. That is the advisor's own number to the unit. This
exactness is what licenses a `psql` oracle to stand in for the advisor inside a worker's worktree — see
D-08 for why the advisor itself cannot be called there.

### D-06 — Criterion 4's two tables are NOT the same problem

`public.intelligence_email_queue` grants `SELECT` to `anon` and `authenticated` and has **zero**
policies: those roles are granted a table they can never read. Its only writer is
`backend/src/adapters/intelligence/smtp-adapter.ts` via `supabaseAdmin` (service_role, which bypasses
RLS). `events.idempotency_keys` grants nothing to `anon` or `authenticated` at all and has no tracked
application reader or writer outside its creating migration. Same advisor class, two different intents —
"policies matching intent" means writing down each intent, not applying one template twice.

### D-07 — All 12 materialized views have ZERO frontend callers

No `frontend/src/**` file calls `.from()` on any of the 12. Four have a backend/edge caller
(`dossier_engagement_stats`, `dossier_commitment_stats`, `mv_tag_usage_analytics`,
`stakeholder_network_summary`); `service_role` holds `SELECT` on all 12 and is unaffected by revoking
`anon`/`authenticated`. Criterion 3 is therefore a pure revocation with no consumer to repair.

### D-08 — Leaked-password protection is not in the Postgres catalog, but it IS behaviourally observable

There is no `auth.config` table in this project (`information_schema.tables` where `table_schema='auth'`
returns 23 tables, none of them a config table), the Supabase CLI is unauthenticated on this machine, and
no `SUPABASE_ACCESS_TOKEN` exists in the environment — so no worker can call the Management API or the
advisor endpoint. It is still closable, because the setting has an **observable behaviour**: signing up
with a known-breached password. Drilled at HEAD on 2026-09-08 — `POST /auth/v1/signup` with
`Pa55w0rd!` returned **HTTP 200 and created a user**, which is exactly what protection-OFF looks like.
The probe account was deleted through the admin API and `auth.users` re-queried to 0 residual rows.
Criterion 5's Auth half is a live behavioural check with a self-cleaning fixture, plus an operator
attestation for the dashboard toggle itself.

### D-09 — Criterion 6 names six persisted stores; FIVE exist

`persist(` appears at exactly five sites in `frontend/src/**`: `authStore.ts:41` (`auth-storage`),
`dossierStore.ts:229` (`dossier-store`), `entityHistoryStore.ts:66` (`entity-history-storage`),
`pinnedEntitiesStore.ts:61` (`pinned-entities-storage`), `uiStore.ts:52` (`ui-storage`). The sixth —
"the duplicate in the dead `services/auth.ts`" — **was deleted in Phase 97** (commit `e6ac817f3`,
"NAV-04 — delete the two DELETE-row parallel-truth modules"). The criterion's named set is therefore 5
stores + 2 raw writers = **7 keys**, and a plan that hunts for a sixth store will not find one.

**The two raw writers, by literal key** (added 2026-09-09 — this decision previously asserted the
arithmetic "5 + 2 = 7" while naming only the five, so a worker ordered to assert the seven individually
could enumerate just five from its inputs; the other two existed only in `ROADMAP.md`, which is not in
`100-10`'s `files_modified`. Seeding five, sweeping, and passing exact-equality would have read as
criterion 6 satisfied with two named stores never tested — **fail-open**):

- `advanced-search-history`
- `quickswitcher_recent_items`

**The seven keys in full:** `auth-storage`, `dossier-store`, `entity-history-storage`,
`pinned-entities-storage`, `ui-storage`, `advanced-search-history`, `quickswitcher_recent_items`.

### D-10 — The named seven are a SUBSET of the residue; the fix is a seam, not seven deletions

`frontend/src/**` writes `localStorage` at 48 `setItem` sites spanning roughly two dozen distinct keys —
recent navigation, quick-switcher recents, dossier-picker recents, saved widget layouts, per-entity view
preferences, intake queue filters, role preference, dossier drafts, command-palette usage counts, tour
progress. Criterion 6's own words are *"the next user on a shared analyst workstation cannot see which
dossiers the previous analyst opened or what they searched for"* — and `useRecentNavigation`,
`DossierPicker` recents and `useViewPreferences` all answer exactly that question. Enumerating seven keys
satisfies the sentence and leaves the workstation leaking.

The disposition, stated so it can be argued with: the sign-out seam clears `localStorage`
**by allowlist** — everything goes except an explicitly named set of machine preferences that carry no
user identity (`id.locale`, `i18nextLng`, and the design-system `id.*` keys). The seven keys the roadmap
names are then asserted individually as a hardcoded subset, so the criterion is satisfied *literally* as
well as *in intent*. One guard at one seam, rather than 48 call sites and a 49th that lands next week.

### D-11 — The sign-out seam already exists and Phase 92 left this half of it deliberately open

`useAuthStore.handleAuthStateChange('SIGNED_OUT', …)` in `frontend/src/store/authStore.ts` already
clears the in-memory query cache and navigates. `frontend/src/store/authStore.signout.test.ts` carries a
`BOUNDED CLAIM (D-30)` header naming this exact residue as "a pre-existing leak filed as CLIENTSEC-01 and
owned by Phase 100", and warns that a green there must not be read as residue cleared. Phase 100 both
closes the leak and retires that comment — the comment is part of the deliverable, because a stale
bounding note is how a closed defect gets re-opened by a future reader.

### D-12 — `sourcemap: true` is real, the maps carry sources, and 305 is a stale number

`frontend/vite.config.ts:141` reads `sourcemap: true` inside `build`. The `frontend/dist` tree on disk
holds **304** `.map` files (not the roadmap's 305, which was measured at a different commit,
`87b2d040e`), and a sampled map carries a populated `sourcesContent` array. The criterion closes on a
**fresh** build, never on the stale tree, and on the config value — the count is evidence, not the claim.

### D-13 — Migration files do not change staging; applying them does

`supabase_migrations.schema_migrations` holds 639 rows with a latest version of `20260817005132`, while
`supabase/migrations/` holds 492 files reaching `20260817500006` — the ledger and the tree already
diverge, and the six P96 migrations are on disk and applied but absent from the ledger. Phase 100
follows that precedent rather than repairing it: **migrations are written idempotent and applied with
`psql -v ON_ERROR_STOP=1 -f`; no ledger row is fabricated.** The ledger divergence is recorded as a
finding for Phase 102/103, not fixed here.

### D-14 — A worker CAN reach staging, and that is what makes every DB criterion closable

`.tickmarkr/config.yaml`'s `setup` hook runs `p99-worktree-test-env.sh` in every task worktree, which
materialises the gitignored `.env.test` — carrying `SUPABASE_DB_URL`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — and fails closed if it cannot. `psql` is present at
`/opt/homebrew/bin/psql`. Gate commands and `command:`/`test:` oracles inherit the daemon's environment;
a herdr **worker pane** does not. So every DB fact this phase asserts lives in a `command:` oracle, never
in a worker's prose report, which is impossible under one driver and free under the other.

### D-15 — Per-object assertions, never global counts, because the DB plans run in parallel

Seven plans mutate one shared database concurrently in wave 1, and P100-08 follows in wave 2. If each asserted a global total ("13 client-selectable
views remain"), every plan's oracle would read its siblings' effects and the wave would be
order-dependent and flaky. Each plan therefore asserts **only the objects it owns, by name**. The
per-object state is then re-proven fresh in wave 3 by **P100-12** (grants and invoker flags),
**P100-13** (function configuration and the caller census) and **P100-14** (policy rows, criterion-2
state and the behavioural reads); the global arithmetic is asserted once, in **P100-15**.

### D-16 — `search_path` pinning runs AFTER the view conversions, and P100-13 re-runs the census

Three functions referenced by the RLS policies that criterion 1 relies on (`is_assigned_to_dossier`,
`get_user_units`, `check_user_is_contributor`) are inside the 548. Pinning them could in principle move
the very row counts criterion 1 asserts. The roadmap's own sequencing note — *"so a query regression is
attributable to the view change"* — settles the order: conversions land first and are measured alone
(wave 1), pinning lands second (wave 2), and **P100-13** re-runs the criterion-1 census unchanged in
wave 3 — P100-08 having already re-run it immediately after the pinning, so the two runs bracket every
later change. If the numbers moved, they moved because of the pinning, and the phase says so.

### D-17 — The phase directory must be COMMITTED before the first engine wave (overseer directive D1)

A tickmarkr worker reads its plan and context from the checkout it is given. An untracked phase
directory does not exist in a task worktree, and Phase 99 lost a full attempt to exactly that. The
orchestrator commits `.planning/phases/100-security-posture/` — this file, `100-RESEARCH.md`, and all
**FIFTEEN** `100-NN-PLAN.md` — **together with the annotated `.planning/ROADMAP.md`** on
`milestone/v10.0-trust` **before** `tickmarkr compile`. Every one of the **fifteen** plans depends on
that commit; none can read its own `<context>` block without it, and the three plans added by the
round-2 split (`100-13`, `100-14`, `100-15`) are the ones a stale twelve-file instruction would omit. The planner
does not perform this commit; it is named here so it is a scheduled step rather than a discovery.

### D-18 — A read that neither answers nor is denied is an INSTRUMENT fault, not a regression

Derived live 2026-09-08: under `ON_ERROR_STOP=1`, `psql` exits **0** when a caller-scoped read is
answered and **3** when it is denied (`ERROR: permission denied for table users`). Every read oracle in
this phase therefore classifies into four states — `answered` (rc 0, numeric), `denied` (rc 3 with a
permission-denied ERROR), `malformed` (rc 0, non-numeric) and `broken` (any other failure) — and only
the first two are verdicts. A timeout, a dropped connection or an unrelated SQL error exits 3 as
`INSTRUMENT-CANNOT-RUN`; the first draft mapped all of them to "the conversion broke the read path",
which would have charged an application regression for a network blip.

### D-19 — `public.users` is broadly readable, and that number is derived

Both census identities read **415** rows from `public.users` (the command is in `100-RESEARCH.md` §5).
Re-pointing `entity_comments_with_details` at it removes an `auth.users` exposure and narrows nothing
about who can see a colleague's display name. The number is derived rather than asserted because an
earlier draft carried it with no query behind it.

### D-20 — A source census is a PLANNING BOUND, never a gate

The `git grep` census that chose the 21 restricted views says why they were chosen. It cannot say the
system is correct: a green there means twenty strings were not found, which is equally true in a repo
where the feature was never built. It is recorded in each SUMMARY as a bound, and what GRADES those
plans is the exact live grant set plus a live denied read.

### D-21 — The policy name is part of the contract

Criterion 4's oracles match the policy name `p100_service_role_only` exactly. An equivalent policy under
another name fails, deliberately: pinning the name is what ties the green to the row this phase's
migration created rather than to any row that happens to exist.

### D-22 — 35 functions already carry a different explicit `search_path`, and stay that way

Of 591 non-extension functions in `public` / `read_models` / `events`: **8** already carry the value this
phase would set, **35** carry some other explicit value, and **548** carry none. P100-08 pins only the
548. The end state is therefore **556 at the approved value, 35 elsewhere, 0 unpinned** — and the oracle
exits 3 if that 35 moves, because re-pinning them would be an unrequested behaviour change.

### D-23 — A control on AVAILABILITY is not a control on DISCRIMINATION

The overseer's words, recorded because they generalise: *"The strong-password-must-be-accepted control
is real, but it guards whether the signup path works — not whether the rejection means what the oracle
claims."* Criterion 5's Auth oracle therefore carries BOTH: an availability arm (a strong password must
be accepted) and a **discrimination arm** — a too-short password must be rejected `422` /
`weak_password` / reason `length`, which fires TODAY and proves the status, the `error_code` parse and
the reasons parse all work before any of them is asked to judge the subject.

### D-24 — The rejection contract is DERIVED, and a 4xx class is not a verdict

Live, 2026-09-08: a password-policy rejection is **HTTP 422** with `error_code:"weak_password"` and a
`weak_password.reasons` array; a generic validation failure is **HTTP 400** with
`error_code:"validation_failed"`. Matching the `4*` class accepted a 429 rate-limit, a 400 and a 401
identically as *"protection is on"*. The oracle now matches 422 exactly, and 429 / 400 / transport
failures all exit 3. The subject password is 9 characters and so passes the length policy — proven,
because a 9-character strong password is accepted today — which is how the reasons check discriminates
without hardcoding a vendor constant nobody has yet observed.

### D-25 — Exact equality of enumerated storage replaces two absence tests

Criterion 6's acceptance is not that seeded keys vanished; that is still an absence, and it passes on a
store that was empty to begin with. It is that after the PRODUCTION `SIGNED_OUT` entry point runs, the
enumerated contents of browser storage **equal a non-empty hardcoded allowlist key/value map**. One
positive observable that cannot pass on an empty store, cannot pass on an over-clearing sweep, and
cannot pass if the production caller never invoked the sweep.

### D-26 — Criterion 7 grades the EXECUTED config, not the absent artifact

The primary observable is `frontend/vite.config.ts` loaded twice through Vite's own
`loadConfigFromFile` and asked what `build.sourcemap` is: **`false`** with the Sentry variables absent,
**`"hidden"`** with them present. That is a positive statement about what the changed hunk DOES. At HEAD
it returns `true` and `true`. The artifact counts are the confirmation, not the claim.

### D-27 — A detector that has never seen its subject may not report a zero

Criterion 7's map counter and `sourceMappingURL` matcher are run first against a scratch fixture built
to yield exactly one hit each over two JS files — anything else exits 3.

**Superseded in part by D-35, recorded rather than rewritten.** This decision originally continued
*"completeness is then established positively: every `/assets/` file `dist/index.html` references must
resolve on disk"*. That proof was **rejected in checker pass 3**: it distinguishes a broken reference
from a valid one, not a complete build from an internally consistent partial one, and it enumerated only
top-level `assets/*.{js,css}`, so an orphan image or font passed. The completeness proof is now the
build's own manifest checked in both directions over the whole tree — **D-35 is the authority**; this
paragraph survives only so a reader who remembers the old rule can see it was retired and why.

### D-28 — A green produced before a later change is not evidence about the state after it

Eight database plans asserted per-object, concurrently. P100-12, P100-13 and P100-14 re-execute those
same oracles unchanged against the FINAL tree and record the output; no number in their registers is
quoted forward from a sibling SUMMARY, and a disagreement with a sibling's recorded number is reported
rather than reconciled.

### D-29 — The five-empty-view bound must be VISIBLE after the phase closes

Six of the twelve converted views hold zero rows on staging: `event_details`, `theme_details`,
`relationship_health_summary`, `v_country_relationship_flows`, `engagement_recommendations_summary`,
`entity_comments_with_details` (the sixth was recorded empty by P100-04/P100-14 and added here by the
overseer on 2026-09-11 after the P100-15 attempt-0 review; the D-29 heading keeps its original name).
For those six, criterion 1 establishes an unbroken read path and **NOT row scoping**. That sentence
must appear in `100-VERIFICATION.md` **and in the completion text this phase hands the ROADMAP**, not
only inside a plan's prose. Phase 92's failure was not the gap — it was the gap being invisible
afterwards, and nobody may read "criterion 1 COVERED" as "row scoping verified".

### D-30 — The global posture numbers are ARITHMETIC DIAGNOSTICS

`client_but_not_invoker=0` and its siblings tie the per-object proofs together; they are not themselves
the evidence for any criterion. The evidence is the per-object positive rows in P100-12, P100-13 and
P100-14. P100-15 asserts the positive triple — 33 views, 12 invoker-enabled, 12 client-reachable — and
prints the zeros as the arithmetic they are.

### D-31 — What the leaked-password probe proves, what it does NOT, and when that changes

**The interim bound, verbatim — this sentence is carried into P100-09's SUMMARY and into the phase
completion text, and it is not a footnote:**

> The leaked-password oracle establishes that a known breached password is rejected with HTTP 422 and
> error code `weak_password` for a non-`length` reason. It does **NOT** establish that it was rejected
> BECAUSE it is breached — another `weak_password` rule rejecting the same password would pass
> identically. The breach-specific discriminator is unobservable until leaked-password protection is
> enabled; see the operator handoff.

**Status: CLOSED 2026-09-10** — the operator enabled leaked-password protection; the live rejection carries `reasons=["pwned"]`, the breach-specific discriminator (`100-09-ATTESTATION.md`, operator's D-31 answer). Historical status while the setting was off: OPEN — DEFERRED TO TOGGLE. Not accepted, not cut. `OVERSEER-RULING-C2-04` (2026-09-09)
ruled **DEFER-AND-TIGHTEN**, and the reasoning changes what the failure was: `weak_password` is a family
— length, character class, breach — and the breach-specific reason string appears only **once
leaked-password protection is enabled**, which is the very thing this oracle verifies. The clause was
never a repair failure; it was **unsatisfiable as sequenced**. (Its sibling, the `find`-traversal clause,
was unsatisfiable *structurally* — a here-document command substitution has no reachable exit status.
Three rounds against each bought nothing, because effort was never the missing ingredient.)

**The five steps that close it, owned by P100-09's checkpoint and executed AT the toggle:**

1. Immediately after the operator flips the setting, run the probe **once**.
2. Capture the **actual** reason string and message from the live 422 response, verbatim.
3. Record them in `100-RESEARCH.md` **with the command that produced them** — live-derived, never
   quoted forward.
4. Tighten the oracle to assert that exact discriminator, and re-run it.
5. In the same credentialed session, call the Supabase security advisor and record the result
   (D-38). **This step is MANDATORY TO ATTEMPT: run it and record the result** — not *"run it if
   you can"*. It is **corroboration, never an acceptance gate**: the acceptance oracle stays the
   catalog calibrated proxy, because no worker can reach that endpoint (D-08) and a gate there would
   be capability-impossible. It may report any of D-38's three outcomes, and **recording "endpoint
   unavailable — no verdict" is COMPLIANCE with this step, not failure of it.** What is not
   compliance is the toggle finishing with no attempt in the record: the falsification is lost by
   omission, not by an endpoint honestly out of reach.

**NO fourth repair attempt is made before the toggle.** Anyone reading this row as OPEN and assuming it
was missed should stop here: an attempt now could only invent a constant — recreating the original
defect behind a narrower mask — or loosen the assertion, and the ruling forbids both.

**Recorded fallback, deliberately NOT built.** A companion negative control (a non-breached password
violating a *different* `weak_password` rule, proving the two 422s are distinguishable) would close the
clause without the toggle. The overseer rejected it as scope: it requires enumerating the project's
other password rules, which this phase does not own. It is written down here so a later phase can pick
it up if the toggle slips.

### D-32 — An ACL check that filters grantees cannot see a PUBLIC grant

The first repair rendered only `anon`, `authenticated` and `service_role`. A `GRANT SELECT … TO PUBLIC`
on any restricted relation would leave that filtered row looking service-role-only while both client
roles inherit the access. Every grant assertion now renders **every grantee**, PUBLIC included, and
pairs it with the authoritative `has_table_privilege` answer — which also catches a grant arriving
through role membership, which no ACL row shows. The derived end state is postgres + service_role, eight
privileges each, with `has_table_privilege` false for both client roles.

### D-33 — One representative denial says nothing about the other nineteen

Behavioural reads now cover **every** named relation: all twenty restricted views, all twelve
materialized views, and in the wave-3 re-proof the criterion-2 and criterion-4 runtime paths as well. A
revoke that lands on nineteen of twenty is caught by name.

### D-34 — A zero called "confirmation" is still an absence

Criterion 7's `.map` and `sourceMappingURL` counts are **printed as diagnostics and do not touch the
exit code**. The graded changed-hunk assertion is the executed config's returned values; the second gate
is whole-tree completeness. Prose cannot demote a predicate — only removing it from the exit path can.
The same rule retired `client_but_not_invoker` as a gate in P100-15.

### D-35 — Completeness is what the build itself vouches for; cleanup is a checked finalizer

"Every `/assets/` reference in `index.html` resolves" cannot tell a complete build from an internally
consistent partial one, and one fresh file cannot vouch for a tree. Criterion 7 therefore requires
`build.manifest`, and checks it **in both directions** — no file on disk unnamed, no named file missing
— plus **whole-tree freshness**: every file under `dist` must postdate the config being graded.
Measured on this app: 473 entries, 478 named files, 312 js/css on disk, 0 orphans, 0 ghosts, and a
build-time spread of 2.1 seconds.

Criterion 5's Auth probe has the same shape of repair on its cleanup: an **always-run finalizer** that,
per created account, checks the pre-delete uuid, the delete curl status and HTTP code, the refetch code
and the post-delete catalog read — on the red path as well as the green one. A silent trap that skipped
unresolved ids and ignored delete statuses could not produce the lifecycles the plan promised.

### D-36 — Bucket sizes survive a balanced swap; identities do not

`556 approved / 35 other / 0 unpinned / 591 total` is preserved exactly by moving one approved function
into the "other" bucket and one of the 35 into the approved bucket. The 35 are therefore pinned by an
**md5 digest of their signature-to-configuration pairs**, derived live:
`a10d3e1256979bf019d8a9b68c959cb8`. Aggregates establish that the census is populated; the digest
establishes that it is the same 35.

### D-37 — The fifteen-plan ownership map

The round-2 split moved three ownerships that earlier prose still attributed to P100-12. Current state:

| what | owner |
| ---- | ----- |
| grant sets and the twelve invoker flags, re-proven fresh | **P100-12** |
| function configuration and the final caller census, re-proven fresh | **P100-13** |
| policy rows, criterion-2 state and the behavioural reads, re-proven fresh | **P100-14** |
| the register, the posture arithmetic and the operator sign-off | **P100-15** |
| the Wave 0 commit | fifteen plans **plus** the annotated `.planning/ROADMAP.md` |

P100-15 consumes **all fourteen** predecessor SUMMARYs. Enabling `build.manifest` in P100-11 is a
**second deliberate config line**, added because the acceptance needs a whole-tree invariant the build
itself produces; its cost is one extra file in the bundle output.

### D-38 — The advisor call is CORROBORATION, and its reading is pre-registered

The overseer can call the Supabase security advisor; **no worker can** (D-08). So the acceptance oracle
for criterion 5 stays the catalog-based **calibrated proxy** — calibrated at HEAD, where the catalog
query reproduced the advisor's 548 to the unit (§2). Rewriting acceptance to require an advisor call
would make the task **capability-impossible for the seat executing it** — the same shape as C2-08
(structurally impossible) and C2-04 (ordering-impossible), each of which cost two rounds. Not a third.

**What the advisor call is worth:** it can *falsify* the calibration. The proxy was calibrated before
the change; if the advisor disagrees with the catalog afterwards, the proxy is invalid. An instrument
that can only confirm is worth much less than one that can disagree — so the reading is fixed **before**
it runs:

| outcome | meaning |
| ------- | ------- |
| advisor ≡ catalog after the change | calibration holds; the clause closes by **observation**, recorded as corroboration beside the proxy |
| advisor ≠ catalog after the change | the proxy is **INVALIDATED** — a finding, not a number to reconcile. Criterion 5 reverts to open pending diagnosis |
| endpoint unavailable | no verdict either way; the proxy stands and the Phase 101/103 deferral is unchanged |

Provenance is mandatory, because it comes from outside the engine: who ran it, when, the exact call, and
the raw output verbatim. It is P100-09's **fifth** post-toggle step, in the same credentialed session as
the C2-04 discriminator capture — one human moment closes both.

### D-39 — Producer status: the class, and the two in-phase exemplars

A producer's failure must never be downgraded to a functional result. The class was sighted five times
in one night, and round 5 swept it at the template level rather than site by site — 30 defective sites
across 6 templates, all in shared helpers.

**Two exemplars, both already in this phase — neither invented for the sweep:**

- **Shape A (a producer piped into `tail`/`head`/`wc` loses its status):** the fix is the `READ`/`SR_READ`
  pattern — capture into a variable, take `$?` **immediately**, fail closed, and only then extract the
  value. Now shared as `DBQ` / `resolve_uid` / `census_count` / `COUNT1`.
- **Shape B (two independently-failable fields concatenated into one test):** the fix is
  `100-11`'s per-field non-empty check — validate each field on its own and exit 3 on either, so the
  message names *which* field. `case "$OWN$OTH" in …|"")` only caught BOTH empty; one empty and one
  valid passed.

**Sixteen sites were deliberately left alone.** Fourteen already used shape A's exemplar. The two in
`100-11`'s config oracle extract values from an **already-captured** variable whose producer status was
taken at line 33, and the extraction is followed by `[ -n "$OFF" ] && [ -n "$ON" ]` with `exit 3` on
either — it fails closed, and it is the shape-B exemplar, not a defect. A census keyed on text will keep
matching those two lines; that is the census's resolution, not a finding.

---

## 3. What is OUT of scope

- **The remaining ~17 non-roadmap `localStorage` keys** (D-10). The allowlist sweep clears them as a
  consequence of closing the class, but no acceptance item names them individually and no plan owns a
  per-key audit of them. If the allowlist is later narrowed, that coverage is lost silently.
- **The migration-ledger divergence** (D-13): 639 ledger rows vs 492 files. Recorded, not repaired.
- **The 4 `extension_in_public` advisor warnings** (`pg_trgm`, `vector`, `pgjwt`, `http`). Not named by
  any criterion; moving an extension schema is a breaking change with its own blast radius.
- **The 336 + 334 `*_security_definer_function_executable` advisor warnings.** Criterion 5 names the
  `function_search_path_mutable` class only. Pinning `search_path` does not revoke `EXECUTE`, and this
  phase does not attempt the executable-grant class — 670 warnings whose remediation is a grant audit,
  not a config pin. **This is the largest single body of advisor noise the phase leaves standing** and
  Phase 103's re-sweep will see it.
- **`intake_tickets.ticket_select`'s `(assigned_unit IS NULL)` clause**, which grants every authenticated
  caller every unassigned-unit ticket. Observed while reading the policies for D-02; it is a policy
  breadth question, not a `SECURITY DEFINER` question, and no criterion names it. Filed here so it is
  not re-discovered as new.
- **Production/droplet deployment of the client changes.** Criteria 6 and 7 close on the repository and a
  fresh build; shipping them to `138.197.195.242` is the existing deploy pipeline's job.
- **Any exploitation.** The DB work is stated throughout as *completeness*: enumerate every input a check
  depends on, confirm each is bound, and state what the check does NOT establish. No plan asks anyone to
  find a bypass, and a worker that reports one instead of a bound has answered the wrong question.

## 4. What this phase does NOT establish even when green

- That RLS is **correct**, only that it is **reached**. Converting a view to `security_invoker` makes the
  base tables' policies apply; whether those policies encode the right rule is a different phase.
  `unified_work_items`' non-owner count falling from 21 to 2 proves the boundary now exists — the
  remaining 2 rows are what `intake_tickets`' policy deliberately permits (D-03 out-of-scope note).
- That the 548 pinned functions are **safe**, only that their `search_path` is no longer caller-mutable.
- That `localStorage` is empty on a **shared** machine after a browser crash, only after a sign-out that
  reaches the seam. A killed tab never runs the handler.
- That staging's numbers are production's. Every hardcoded count in this phase is a staging count with
  21 work items and 415 auth users; the re-deriving query travels with each one.
