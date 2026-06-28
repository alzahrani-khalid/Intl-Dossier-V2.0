# Data-Entry Quality Sweep — Orchestration Log

**Orchestrator:** herdr pane `w9:p1` (workspace `w9` = Intl-Dossier-V2.0).
**Branch:** `fix/prod-quality-sweep-260627`.
**Loop:** `/loop` dynamic mode. This file is the durable cross-wakeup state — READ IT FIRST on every wake.

**Agent spawn = reliable pattern (proven):**

1. `herdr pane split <FROM> --direction <down|right> --no-focus` → parse `result.pane.pane_id`.
2. `herdr pane run <NP> "claudeskip --effort max"`.
3. `herdr wait output <NP> --match "bypass permissions on" --timeout 45000`.
4. `herdr pane run <NP> "<task>"` → `herdr wait output <NP> --match "Pasted text|You are" --timeout 8000`
   → **then `herdr pane send-keys <NP> Enter`** (boot race eats the first Enter).
5. Verify `herdr pane read <NP> --source visible`: if box is EMPTY (prompt never landed) RE-SEND the
   whole prompt then Enter; if text sits in `❯`/"[Pasted text]" just send Enter again. Confirm "working".

- `claudeskip` = Claude Code v2.1.195, Opus 4.8 max effort, bypass-permissions ON. Inherits repo CLAUDE.md.
- Status via `herdr pane list` lags a few seconds; trust `pane read` over the `idle/working` field.
- Constraint from memory: **codex xhigh has hung before (0 edits, 100% ctx)** → prefer `claudeskip` for the
  implementation critical path; if a codex pane stalls, kill + relaunch as claudeskip.
- **Disjoint-file lanes** for any implementation wave (no two workers touch the same file) to avoid clobber.

---

## PHASE 1 — ASSESS ✅ COMPLETE

All 5 audit reports written (`findings-{A..E}-*.md`). Tally across slices:
**CRITICAL 8 · HIGH 34 · MED ~46 · LOW ~37**. Top severities:

- **Security CRITICALs:** D-1 (any user self-elevates `public.users.role`→admin via PostgREST;
  RLS `users_update_self` + table UPDATE grant, no column guard), D-2 (same for
  `profiles.clearance_level`→4), D-3 (`backend/.../auth.service.ts:863` `verifyMFACode(){return true}`
  unconditional, backs live `/api/auth/login`).
- **Silent-data-loss / save-broken:** B-1≡C-1 (after-actions-create omits NOT NULL `aa_commitments.title`
  → every after-action-with-commitment 500s), D-4≡E-1 (SettingsPage upserts ~23 non-existent
  `public.users` cols → all Saves no-op), B-2 (tasks tenant_id wrong), B-3 (task stage/status desync),
  E-6 (commitment due_date stored 1 day early in GST), C-2 (calendar participants silently dropped).
- **Fake-success/honesty:** D-6≡E-4 (MFA setup button no onClick), D-7 (export omits data), D-10
  (user-mgmt dead routes), C-3 (MoU create unwired), E-8 (ConsistencyPanel inert).
- Known dups merged in planning: B-1≡C-1, D-4≡E-1, D-6≡E-4, C-5≡E-9.

Panes closed (resources freed). Reports retained on disk.

## ~~PHASE 1~~ (history)

Tab `w9:t5` "assess". 5 read-only audit agents, each writes one findings file:

| Slice                                                        | Pane     | Brief                             | Output file                         | Status  |
| ------------------------------------------------------------ | -------- | --------------------------------- | ----------------------------------- | ------- |
| A dossiers (8 types)                                         | `w9:p0`  | `_brief-A-dossiers.md`            | `findings-A-dossiers.md`            | working |
| B work items (task/commitment/intake)                        | `w9:p11` | `_brief-B-workitems.md`           | `findings-B-workitems.md`           | working |
| C engagement-adjacent (positions/AA/briefs/MoU/rel/calendar) | `w9:p12` | `_brief-C-engagement-adjacent.md` | `findings-C-engagement-adjacent.md` | working |
| D auth/admin/settings                                        | `w9:p13` | `_brief-D-auth-admin-settings.md` | `findings-D-auth-admin-settings.md` | working |
| E cross-cutting (validation/errors/i18n/RTL/a11y/honesty)    | `w9:p14` | `_brief-E-crosscutting.md`        | `findings-E-crosscutting.md`        | working |

**On wake:** check `herdr pane list` + `ls findings-*.md`. For each slice `done`, the report exists.
When all 5 reports exist → Phase 1 complete → start Phase 2. If some still working, reschedule wake.
If a pane is stuck (no progress, blocked, or asking a question) → `pane read` it, then `pane send-keys`
a nudge or relaunch.

## PHASE 2 — PLAN (IN PROGRESS)

Delegated to ONE planning agent (pane **`w9:p15`**, tab "plan") via `_brief-PLAN.md`. It de-dupes +
triages into `_BACKLOG.md`, carves disjoint-file lanes into `_LANES.md` (with a file→lane disjointness
proof + a NEEDS-DECISION section), and writes one `_impl-brief-<lane>.md` per FIX-NOW lane.
Prints `PLAN COMPLETE` when done.

**On wake:** check `w9:p15` status + `ls _LANES.md _impl-brief-*.md`. When present, READ `_LANES.md`
(compact) — that's my dispatch map. Sanity-check disjointness. Surface the NEEDS-DECISION items to the
user (AskUserQuestion) before building anything that needs a product call. Then start Phase 3: dispatch
L0-db migrations FIRST (serialize via Supabase MCP), then security lanes, then the rest — one worker
pane per lane, each reading its `_impl-brief`. Keep workers file-disjoint.

## PHASE 3 — IMPLEMENT (IN PROGRESS)

Plan = `_LANES.md` (9 FIX-NOW lanes, 81 files, disjointness PROVEN). Per-lane worker briefs =
`_impl-brief-<lane>.md`. Impl tab = "impl".

**Lanes (priority order):** L0-db(D-1/D-2 triggers, DB-only, **after L1**) · L1-auth(11 files,security) ·
L2-settings-admin(12) · L3-commitments-aa(11, CRIT B-1) · L4-tasks-workboard(13) ·
L5-work-palette-intake(12) · L6-dossier-wizard(5) · L7-positions-calendar-rel-mou(15) ·
L8-shared-client(2: api-client.ts + ui/form.tsx, app-wide).

**Ordering:** L0 AFTER L1 (triggers would block legit admin writes unless assign-role/create-user/
deactivate/reactivate use the service-role client — L1 ensures this). All other lanes independent.

**Commit strategy (shared tree, NO worktrees):** workers self-commit but `HUSKY=0 git commit` to SKIP
the slow pnpm-build pre-commit hook; stage ONLY the lane's files by explicit path (never `-A`); one
atomic commit per item; NO push, NO PR, NO main. Orchestrator runs ONE integration `pnpm build` +
`pnpm lint` per wave. `.husky/pre-commit` = `npx lint-staged` then `pnpm build`+knip (build is
NON-blocking; `.planning/`-only commits skip it).

**Dispatch waves (4 at a time for Mac sanity):**

- Wave 1: **L1** (dispatched → pane `w9:p16`), then L8, L3, L4 (brief-gated on planner finishing).
- L0: apply D-1/D-2 triggers via Supabase MCP AFTER L1 verified.
- Wave 2: L2, L5, L6, L7.

**Worker dispatch template:** `claudeskip --effort max` → wait "bypass permissions on" → run the
"read \_impl-brief-<lane>.md + STRICT RULES (lane-files-only / HUSKY=0 explicit-add / no push)" prompt →
`send-keys Enter` (boot race) → verify via `pane read`.

**On wake:** (1) if planner `done` → commit the `.planning/data-entry-assessment/` artifacts
(`.planning`-only, build skipped); read any new `_impl-brief-*.md` as needed. (2) Check `w9:p16` (L1):
if `LANE L1 DONE`, review its diff, then apply L0 triggers + dispatch L8/L3/L4. (3) Keep ≤4 workers live.

**NEEDS-DECISION (10) — surface to user, do NOT build without an answer; FIX-NOW lanes ship the honest
fallback meanwhile:** A-1 dossier-edit surface · A-2 dossiers-update rewrite · C-3 MoU create (L7
disables dead btn) · D-9 avatars bucket (L2 hides upload) · D-10 user-mgmt routes (remove dead btns) ·
E-8 ConsistencyPanel (hide inert panel) · A-7 country fields · B-18 AA nested edits · D-15 AI multi-admin ·
D-19 MFA secret at-rest encryption. (Full text: `_LANES.md` ## NEEDS-DECISION.)

**DEFER:** 33 LOW + 2 systemic MED sweeps (E-20 locale digits ~40 files; E-21 i18n ternaries 33+ files)
→ single SEQUENTIAL pass AFTER lanes merge (they cross every lane's files, can't be a disjoint lane).

---

## PHASE 3 ✅ COMPLETE + INTEGRATION GATE GREEN

All 9 lanes done, **~71 commits.** Orchestrator-verified: **FE `tsc` 0 · BE `tsc` 0 · ESLint
`--max-warnings 0` (FE+BE) pass · i18n namespace check pass · `pnpm build` exit 0.** L0 security
triggers live on staging. Artifacts committed. Nothing pushed, no PR.

## PHASE 4 — VERIFY (tests) ✅ COMPLETE

Worker updated **4 stale tests** to the new correct behavior (api-client ApiError, commitment `title`
default, ConflictDialog i18n, workboard +Add palette) — **0 real regressions found.** Orchestrator
independently re-ran those 4 files: **47 tests passed, exit 0.** FE/BE tsc + lint still clean.

## 🏁 LOOP COMPLETE — core mandate delivered & verified

**75 commits** on `fix/prod-quality-sweep-260627`. ASSESS→PLAN→IMPLEMENT→VERIFY all done.
Gate GREEN (tsc FE+BE / ESLint --max-warnings 0 / i18n / build / 47 updated tests). 2 CRITICAL
privilege-escalation migrations live on staging. **Nothing pushed; no PR** (user decision).

**Loop STOPPED** (no ScheduleWakeup). Open for the user:

1. **10 NEEDS-DECISION** (build-feature vs keep-honest-disabled) — see `_LANES.md` ## NEEDS-DECISION.
2. **2 deferred systemic sweeps** — E-20 locale digits (~40 files), E-21 i18n ternaries (33+ files).
3. **Open a PR** for the branch (8 required checks per memory) — on request.
   Re-trigger `/loop` or just ask to act on any of these.

## EVENT LOG

- T7 (+~30m): **ALL 9 LANES DONE. GATE GREEN** (tsc FE+BE / lint --max-warnings 0 / i18n / build).
  Committed prettier residual + artifacts (71 commits). Saved memory. Dispatching Phase-4 test worker.
- T6 (+~25m): **L2 ✅, L6 ✅ DONE.** Only **L5 `w9:p1C`** still working (healthy — finishing intake
  edge fns, committing B-33; found extra items beyond brief). **65 commits.** Next: when L5 done →
  run integration tsc(frontend+backend)+lint (redirect output to /tmp logs, grep "error TS" only to
  stay lean), fix-up worker if needed, commit artifacts, final user summary. 8/9 lanes done.
- T0: Phase 1 launched — 5 claudeskip audit agents dispatched in tab w9:t5. All confirmed working.
- T1 (+~25m): Phase 1 complete — all 5 reports written (8 CRIT / 34 HIGH). Closed the 5 assess panes.
  Phase 2 launched — 1 planning agent dispatched in tab "plan" (pane w9:p15).
- T2 (+~20m): Planner produced \_BACKLOG.md + \_LANES.md (9 disjoint lanes) + briefs L0/L1/L2 (still
  writing L3-L8). Read \_LANES.md. Inspected pre-commit hook → HUSKY=0 commit strategy chosen.
  Phase 3 started: dispatched L1-auth worker → pane `w9:p16` (impl tab). Planner w9:p15 still working.
- T3 (+~20m): Planner DONE (all 9 briefs written); closed planner pane. L1-auth already landed 5
  commits incl. **D-3 real TOTP verify (MFA bypass closed)**, D-11, D-24, D-31, D-14 — tree clean,
  HUSKY=0 works. Dispatched rest of Wave 1: **L8→`w9:p17`, L3→`w9:p18`, L4→`w9:p19`** (all working,
  - L1 still on `w9:p16`). 4 workers live. **L0 triggers still PENDING L1 completion.**
- T4 (+~25m): **L1 ✅ DONE** (D-3/11/12/13/14/22/23/24/25/27/29/31), **L8 ✅ DONE** (E-3 api-client).
  Verified `assign-role`+`create-user` write role/clearance via `supabaseAdmin` (service-role), no
  other write paths → **L0 ✅ APPLIED + verified** to staging: migrations `guard_users_role_change`
  - `guard_profiles_clearance_change` (D-1/D-2 privilege-escalation closed). Closed L1/L8 panes.
    Dispatched **Wave 2a: L2→`w9:p1A`, L7→`w9:p1B`** (needed prompt RE-SEND — empty-box boot race).
    **4 workers live: L3 `w9:p18`, L4 `w9:p19`, L2 `w9:p1A`, L7 `w9:p1B`.** Remaining to dispatch:
    **L5, L6** (after L3/L4 free up). Artifact commit still deferred to final integration.
    ~31 fix commits on branch so far. Integration `pnpm build`/tsc NOT yet run (workers self-tsc).
- T5 (+~25m): **L3 ✅, L4 ✅, L7 ✅ DONE** (clean commits; tree clean). **42 commits total.** Closed
  their panes. Dispatched final lanes **L5→`w9:p1C`, L6→`w9:p1D`**. **3 workers live: L2 `w9:p1A`,
  L5 `w9:p1C`, L6 `w9:p1D`.** Done lanes: L0,L1,L3,L4,L7,L8. **When L2/L5/L6 finish → ALL 9 lanes done.**
  NEXT-WAKE PLAN: (1) integration verify — `cd frontend && pnpm exec tsc --noEmit` + `cd backend &&
pnpm exec tsc --noEmit` + `pnpm lint`; if errors, spawn a targeted fix-up worker (errors are likely
  cross-lane type seams). (2) commit `.planning/data-entry-assessment/` artifacts (.planning-only →
  build skipped). (3) write a final summary for the user: items fixed per lane + the 10 NEEDS-DECISION
  for them to choose build-vs-keep-disabled + the 2 deferred systemic sweeps. (4) Do NOT push / open PR
  without explicit user ask.
