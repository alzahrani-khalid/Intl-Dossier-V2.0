---
phase: 95-routes-that-don-t-render
verified: 2026-08-16T21:15:03Z
verifier: gsd-verifier (fable), independent — ACCEPTANCE-P95-EXEC condition 3
verifier_ran_own_derivations: true
status: passed-with-concerns
score: 5/5 success criteria verified; 8/8 requirements satisfied
tree_verified_at: HEAD of milestone/v10.0-trust (36 commits past phase-95-base a3d2d269a)
---

# Phase 95 — Routes That Don't Render — INDEPENDENT VERIFICATION

**Phase goal (ROADMAP §Phase 95):** Every route either renders its page or says why it can't,
and the route tree has one owner per slot.

**Stance:** goal-backward, adversarial. The nine SUMMARYs and `95-CLOSING-REGISTER.md` were
used as MAPS only. Every verdict below rests on a derivation I ran in my own process; where a
re-run was impossible, the item is in §5 with what I checked instead. The ruled item
(`RULING-P95-03-BLOCKED-9505.md`) is honored, not re-litigated.

---

## 1. Per-criterion verdicts — my own derivations

### SC1 — `/search` returns results for a typed query and each suggestion chip, no forEach crash — VERIFIED

My derivations:

- Unit oracle re-run: `pnpm exec vitest run src/domains/dossiers/repositories/__tests__/dossiers.repository.search.test.ts` → **7 passed (7)**.
- Static: `adaptSearchEnvelope` defined at `dossiers.repository.ts:210` and called at `:305`
  inside `getDossierFirstSearch`, with a real second request to `quickswitcher-search`. The
  crash site `useDossierFirstSearch.ts:109` is a bare `searchQuery.data.dossiers.forEach` —
  no `?.forEach`, no `|| []` guard was added there (the `|| []` at `:172-173` pre-exist at
  `phase-95-base` — return-object initial defaults, not the banned crash-site guard; verified
  by `git show phase-95-base:` of the file). `DossierSearchPage.tsx` imports `QueryErrorState`
  (`:24`) and renders it on `isError` (`:182-186`).
- Behavioural, against the live stack: `tests/e2e/95-search-renders.spec.ts` — observed
  `TYPED-STATE: UN -> rows` and all four `CHIP-STATE: {Saudi Arabia, UN, G20, climate} -> rows`.
  The register's positive claim (results, not merely no-crash) **reproduces**.
- **Flake observed and disclosed:** my FIRST run failed the chip test (1 failed / 1 passed);
  three subsequent runs (two standalone + one inside my gate drill) passed 2/2 with exit 0.
  Classified as live-staging flakiness of the oracle, not a code regression — the failing
  attempt was followed by rows on every chip in the same environment minutes later.

### SC2 — `/tasks/queue` renders its queue against a deployed `assignments-queue` — VERIFIED, WITH THE NAMED BOUND STANDING

My derivations:

- Static: `useAssignmentQueue.ts` imports `apiGet` (`:11`) and calls
  `apiGet('/assignments-queue?...')` (`:56`); non-comment `functions.invoke` count 0.
- Deploy re-derived read-only: `supabase functions list --project-ref zkrcjzdemdmwhearhfgg` →
  **assignments-queue version 12** (> the v11 baseline). I did not redeploy anything.
- Probe re-run (read-only GET): `bash scripts/probe-edge-auth.sh assignments-queue` →
  `assignments-queue -> 404` with `404-kind: function  body: {"error":"User profile not found"}`
  — the DEPLOYED function answering its own 404, which is exactly 95-02's staff_profiles
  derivation (test user has no `staff_profiles` row). The 404-kind disambiguation the plan
  shipped is live and discriminating.
- Behavioural: `tests/e2e/95-queue-renders.spec.ts` → **2 passed**, observed
  `QUEUE-STATE: error` — the truthful error render, matching the bound.
- **The NAMED BOUND stands and I confirm it verbatim in substance:** criterion 2 is closed as
  renders-against-a-deployed-function; the POPULATED-rows render has still never been observed
  by anyone, including me. On this data (test user without `staff_profiles`, empty
  `assignment_queue`) it is unreachable, and I inserted no rows to force it. An unbounded
  SC2 pass would be a false green; this is a bounded one.

### SC3 — `/scenario-sandbox` loads or shows an error; a 500 is never pixel-identical to loading — VERIFIED

My derivations:

- Static: `scenario-sandbox.tsx` imports and renders `QueryErrorState` (`:37`, `:313`); the
  bare `Retry` literal count is 0; `useScenarioSandbox.ts` carries the bounded retry
  (`:42-47` — 4xx final, max 2 otherwise).
- Behavioural: `tests/e2e/95-sandbox-error.spec.ts` → **2 passed** — CDP-blocked request
  renders `query-error-state` with no spinner and no internal string; unblocked settles
  within the budget.
- Note (named omission 3, unchanged): the backend still 500s and its cause is undiagnosed and
  unowned. The criterion asks only for an honest failure, which now exists. See §6 concern (d).

### SC4 — `/monitoring` resolves to the SPA route, decision recorded — VERIFIED

My derivations:

- Proxy population re-derived at both ends: `phase-95-base` = **7** entries including
  `'/monitoring'`; HEAD = **6**, exactly the `/monitoring` entry deleted, siblings untouched.
- Backend: `app.use('/api/monitoring', monitoringContractRouter)` at `backend/src/index.ts:89`,
  INSIDE the `NODE_ENV === 'development' || 'test'` guard (read in situ, `:83-89`).
- Dashboard callers: both queries go through `apiGet('/api/monitoring/{health,alerts}',
{baseUrl: 'express'})` (`Dashboard.tsx:50,61`); gate g1's tree-wide `'/monitoring` sweep
  (excluding routeTree.gen/navigationData/the route file) = 0, run verbatim, exit 0.
- nginx: zero `location /monitoring` across all four conf files, with `location /api/` = 6 as
  the same-command positive control. No nginx file changed vs the tag.
- Behavioural: `tests/e2e/95-monitoring-mounts.spec.ts` → **2 passed** — the `/monitoring`
  document request reaches the SPA (HTML, not raw JSON) and both enumerated callers resolve.
- Decision record: `95-DEAD-04-DECISION.md` exists, cites `RULING-P95-01`, ends
  `DECISION-RECORD-END` (gate 95-09_g3 run verbatim, exit 0). The P97 inheritance is intact:
  `frontend/src/components/modern-nav/navigationData.ts:262` still links `/monitoring`,
  deliberately untouched.

### SC5 — one route file per slot; legislation Outlet; approvals/versions drive tab state — VERIFIED

My derivations:

- Route population re-derived with the register's verbatim command at BOTH ends:
  `phase-95-base` = **201**, HEAD = **202**; the diff is exactly
  `+/legislation/`, `+/positions/$id/`, `-/positions/$positionId` — nothing else moved.
- Static (gates 95-05_g1/g2 clauses run verbatim, exit 0): `$positionId.tsx` absent from disk;
  `positionId` count in `routeTree.gen.ts` = **0** with `/positions/$id/approvals` = 10 as the
  instrument control; `<Outlet` in `$id.tsx` = 2 and in `legislation.tsx` = 2;
  `legislation/index.tsx` exists with `getRouteApi`; `validateSearch` retained on the layout.
- Behavioural: `tests/e2e/95-slots-tabs.spec.ts` → **3 passed** — deep-linked approvals opens
  that tab and back moves tab state without remounting the header; tab selection navigates;
  out-of-set deep link redirects; legislation detail renders its own surface, not the list.
- The one unmeasured direction (tests 1-2 pre-fix red) is **RULED**
  (`RULING-P95-03-BLOCKED-9505.md`, ACCEPT-AS-RECORDED) and honored per its condition 3 — no
  retroactive red was manufactured here.

---

## 2. Per-requirement disposition — 8/8

Coverage loop re-run by me, verbatim: eight matches, zero `MISSING` lines. REQUIREMENTS.md
register rows re-checked by running gate 95-09_g3 verbatim (all eight `Complete`, and the
tag-anchored REQUIREMENTS diff touches no non-Phase-95 register row — exit 0).

| requirement           | disposition                                         | my evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEAD-01               | SATISFIED                                           | SC1 above — 7/7 unit, rows on typed + all four chips, crash site contract-fixed                                                                                                                                                                                                                                                                                                                                                                                       |
| DEAD-02               | SATISFIED (bounded)                                 | SC2 above — v12 > v11 re-derived, apiGet transport, truthful error render; populated render never observed (named bound transcribed)                                                                                                                                                                                                                                                                                                                                  |
| DEAD-03               | SATISFIED                                           | SC3 above — QueryErrorState + bounded retry + 2/2 CDP oracle                                                                                                                                                                                                                                                                                                                                                                                                          |
| DEAD-04               | SATISFIED                                           | SC4 above — proxy 7→6, /api/monitoring remount in-guard, nginx zero, 2/2 e2e, decision on disk; nav entry inherited by P97 as recorded                                                                                                                                                                                                                                                                                                                                |
| DEAD-08               | SATISFIED                                           | SC5 above — population delta exact, one owner per slot, 3/3 e2e                                                                                                                                                                                                                                                                                                                                                                                                       |
| DEAD-09               | SATISFIED (one leg not independently re-run — §5.1) | Mock excised: `setTimeout`=0, `job_id`=0, `status:202`=0 in `supabase/functions/reports/index.ts`; real path present: `.from('private').upload` (`:420-422`) + `createSignedUrl` (`:432-433`); deployed **v14** answering GET `reports -> 200` (my read-only probe); truthful `pending/failed/completed/unavailable` keys in EN **and** AR; `generate-entry` pin test **5/5**; the `private` bucket migration `20260816500002_p95_private_storage_bucket.sql` on disk |
| NOTFOUND-COMPONENT-01 | SATISFIED                                           | Rule module + fixture exist; registered at `error` in both relevant `eslint.config.mjs` blocks (`:245/:250`, `:376/:381` — the CI-blocking chain); POSITIVE control run by me: rule id present in the JSON output (4 occurrences); NEGATIVE controls (three real sites) exit 0. Known ceiling (aliased import invisible) recorded in named omission 11 — no such spelling exists today                                                                                |
| RETENTION-CAST-01     | SATISFIED                                           | `unwrapListEnvelope<T>` (`useRetentionPolicies.ts:47-51`) is validate-or-throw (`throw new Error('malformed retention envelope')` — never coerce-to-empty), routed through all **six** list queryFns (`:86,144,205,221,237,245`); `as Promise<` count 0; `asRows` count in `data-retention.tsx` = 0; 17/17 unit oracle re-run; `93-admin-surfaces-error.spec.ts` re-run **4/4** with 16 real policy rows                                                              |

Orphaned requirements: none — REQUIREMENTS.md maps exactly these eight IDs to Phase 95 and
every one is claimed by exactly one wave-1 plan.

---

## 3. Gate drill — re-run in my own process

- **Gate byte-identity first:** every `<automated>` block in all nine plans hashed at HEAD vs
  the accepted plan HEAD `2c8013208` — **IDENTICAL, 9/9 files** (and `git diff --stat` on the
  plan files is empty). No gate was edited.
- **Drill re-run:** `node scripts/gate-drill.mjs` over the plan set **minus 95-06** (see §5.1
  for why 95-06 was excised): **21/21 gates, all exit 0**, `DRILL_EXIT=0`. This includes the
  six live behavioural gates (95-01_g3, 95-02_g3, 95-03_g2, 95-04_g3, 95-05_g3, 95-08_g2)
  executed against the running dev stack and staging, in my process.
- **95-06's three gates, clause-by-clause in a live shell:** g1 static clauses exit 0; g2
  (i18n keys node-check + `generate-entry` vitest 5/5 + type-check) exit 0; g3's static
  clauses (`test -f` + `process.exit(2)` grep + `probe-edge-auth.sh reports` → `reports -> 200`)
  exit 0. The final clause (`node scripts/probe-report-generate.mjs`) was **not run** — §5.1.
- One shared `pnpm type-check` (frontend) run once for the gates whose only remaining clause
  it was: exit 0. Decomposition disclosed: identical clauses, run once instead of eight times.
- Unit oracles re-run standalone: 95-01 **7/7**, 95-08 **17/17**, 95-06 pin **5/5**,
  95-04's mocked dashboard test **1/1** (a NON-ORACLE per D-16 — run for the gate clause, not
  counted as criterion evidence).

## 4. Register derivations spot-re-derived — all reproduce

| register claim                                                                                           | my re-derivation                                                                                                                          | match                                                                                               |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Route population 201 → 202, delta = 3 DEAD-08 moves                                                      | same command, both ends                                                                                                                   | EXACT                                                                                               |
| Requirement coverage 8/8, zero MISSING                                                                   | loop re-run                                                                                                                               | EXACT                                                                                               |
| Decision coverage 20/20 green                                                                            | `decision-coverage.mjs` re-run: `passed: true, covered: 20, uncovered: []`                                                                | EXACT                                                                                               |
| Vite proxy 7 → 6, only `/monitoring` deleted                                                             | grep at tag and HEAD                                                                                                                      | EXACT                                                                                               |
| nginx: 0 `/monitoring`, 6 `location /api/` control                                                       | re-run                                                                                                                                    | EXACT                                                                                               |
| c9b-sweep control: 619 of 752 across 4 roots                                                             | `bash scripts/c9b-sweep.sh phase-95-base data-retention` — `CONTROL OK: \bdescribe\b -> 619 file(s) of 752`, finds `admin-surfaces-error` | EXACT                                                                                               |
| Intended-broken untouched: delegations / legal-holds / analytics zero changed files, positions control 6 | tag-anchored `git diff --name-only` sweep re-run                                                                                          | EXACT (control 6; the one `legal` line is the deleted `asRows` workaround, as the register records) |
| `phase-95-base` signed, at `a3d2d269a`, `git tag -v` exit 0                                              | re-run                                                                                                                                    | EXACT                                                                                               |
| Reservation held (this path absent until now)                                                            | `ls` → No such file, before this write                                                                                                    | HELD                                                                                                |

The register's changed-file control (52) reads 51 committed at my HEAD — the difference is the
close-out artifacts landing around the register's own sweep moment; the five extra working-tree
paths in an uncommitted-inclusive diff are tickmarkr SKILL/CLAUDE.md edits unrelated to this
phase. No debt markers (`TBD|FIXME|XXX`) exist in any phase-changed file, and the phase added
zero new `TODO/HACK/PLACEHOLDER` lines (pre-existing eslint.config.mjs TODOs are outside the
phase's added hunks).

## 5. What I could NOT check — labelled

1. **DEAD-09's generation POST probe (`scripts/probe-report-generate.mjs` / gate 95-06_g3
   final clause).** Running it creates report artifacts in staging storage — a staging
   mutation my brief prohibits. What I checked instead, all read-only: the deployed function
   is **v14** (`supabase functions list`); it answers `reports -> 200` through the real auth
   probe; the source at HEAD has no mock residue and carries the storage-upload + signed-URL
   path; the bucket migration exists; the client pin test passes 5/5. The claim "6 types × 2
   formats generated and fetched back (200, 249–4002 bytes)" therefore rests on 95-06's
   SUMMARY transcript, corroborated but not reproduced.
2. **The assignments-queue redeploy** was not re-performed (prohibited); its effect (v12) was
   re-derived read-only, and the deployed function's own 404-kind response observed.
3. **95-05 oracle tests 1-2's pre-fix red** — unmeasured by anyone, RULED ACCEPT-AS-RECORDED
   (`RULING-P95-03-BLOCKED-9505.md`); honored per its no-retroactive-manufacture condition.
   Tag-anchored static reds (routeTree with `$positionId` at base) re-derived by me instead.
4. **The full baseline (red-direction) drill at the tag** was not re-executed in a detached
   worktree. Spot re-derivations at the tag done instead: proxy population 7 including
   `/monitoring`; route population 201 including `/positions/$positionId`; the unguarded
   `forEach` at `useDossierFirstSearch.ts:109` present at base.
5. **Prod behaviour on the droplet** — config-level only (nginx greps); nothing deployed.
6. **Operator parks unchanged and unclaimed:** Arabic naturalness of 95-06's three new keys
   (presence in both locales verified; naturalness not judged) and pixel-level RTL.

## 6. Concerns (why passed-with-concerns, not a clean pass)

- **(a) SC2's success path has still never been observed** — the phase's thinnest criterion,
  closed on a truthful error render + version increment. Bounded and transcribed everywhere,
  including here; still a path no human or machine has seen work.
- **(b) The search chip oracle flaked once in my hands** (1 failed on first attempt, then
  green ×3). A live-staging-coupled oracle that can red without a code change will eventually
  red CI or, worse, teach people to re-run until green.
- **(c) DEAD-09's end-to-end generation evidence is single-witness** (95-06's probe
  transcript); independently corroborated read-only but not reproduced (§5.1).
- **(d) `/scenario-sandbox` still 500s, cause undiagnosed, owner none** (named omission 3).
  The phase goal is honestly met — the route says why it can't — but the route still can't.
- **(e) The C9b population blind spots the register itself measured** (186 co-located test
  files invisible; deploys diff-less; stoplist degeneracy at 447 candidates) — the phase's
  cross-consumer defence held by executor reading, not by instrument. Register's own weakest
  point; I concur with the ranking.
- **(f) Close-out state:** ROADMAP's Phase 95 checkbox and plan checkboxes are still unchecked
  (REQUIREMENTS rows already flipped Complete, correctly gated). Expected to land in the GSD
  close-out commit after acceptance; noted so nobody mistakes it for a silent drop.

## 7. Verdict

**passed-with-concerns.** All five ROADMAP success criteria are TRUE in the codebase by my own
derivations — statically, and behaviourally against the running stack. All eight requirements
are satisfied with exactly one owning plan each. Gates are byte-identical to the accepted plan
set and 21/21 re-drilled green in my process (95-06's three gates green clause-by-clause, its
staging-mutating probe excepted and labelled). The intended-broken surfaces are untouched and
the legal-holds region is behaviourally still red (4/4 oracle whose header makes a green there
a REJECT). The ruled item is honored as recorded. The concerns in §6 are recorded, not
repaired, and none of them makes a criterion false.

VERIFICATION-INDEPENDENT-END
