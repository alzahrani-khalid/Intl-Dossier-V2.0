---
phase: 94-write-paths
plan: 01
subsystem: ui
tags: [react, after-actions, i18n, rls, edge-functions, vitest, playwright]

requires:
  - phase: 93
    provides: 'D-08 (no server error.message reaches the user), D-10 (colon-form t()), D-20/D-27 (no oracle depends on the e2e setup project)'
provides:
  - 'Create-mode Save enablement on AfterActionForm, content-derived, never on mount'
  - 'canPublish + two-step create->publish wiring on the engagement after-action route'
  - 'D-08/D-10 repair of the save/publish failure toasts on that route'
  - 'scripts/probe-after-action-publish.mjs — behavioural create/publish/read-back probe'
  - 'frontend/tests/component/after-action-route-wiring.test.tsx — the wiring oracle'
  - 'MEASURED: after-actions-publish cannot be published by ANY client (see BLOCKED)'
affects: [94-07, 94-11, phase-95, phase-98]

tech-stack:
  added: []
  patterns:
    - 'A component test may unmock react-i18next to assert real translated copy; under the global setup mock every copy assertion measures the mock'
    - 'A probe provisions and removes its own fixture, including a temporary dossier_owners grant'

key-files:
  created:
    - scripts/probe-after-action-publish.mjs
    - frontend/tests/component/after-action-route-wiring.test.tsx
  modified:
    - frontend/src/components/after-action-form/AfterActionForm.tsx
    - frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx
    - frontend/tests/component/AfterActionForm.test.tsx

key-decisions:
  - 'canPublish adopts the SERVER role set [staff, supervisor, admin] per RULING-P94-04 A2, not UI-SPEC §5 as originally written'
  - 'Save enablement gates on the existing content-derived hasContent in create mode; edit mode keeps isDirty byte-equivalent'
  - 'The wiring test unmocks react-i18next so the D-10 assertion reads src/i18n rather than tests/setup.ts:131'
  - 'The publish probe grants itself a temporary dossier_owners row and revokes it, because the test user owns exactly one engagement and it is already taken'

patterns-established:
  - 'Probe exit 2 = UNABLE TO MEASURE, never a pass; every fixture id it touched is printed on every exit path'
  - 'Playwright evidence runs are attributed by proving the asserted locator/route is absent from the tree, not by asserting staleness'

requirements-completed: []

duration: 35min
completed: 2026-08-16
---

# Phase 94 Plan 01: WRITE-01 Create / Save / Publish Summary

**Create-mode Save and the Publish affordance are both fixed and behaviourally proven; the probe
that Task 3 exists to provide then measured that `after-actions-publish` cannot be published by any
client, because it reads the record id out of a URL path that `functions.invoke` never supplies.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3/3 executed
- **Files modified:** 5 (2 source, 2 component tests, 1 probe)
- **Gates:** g1 GREEN, g2 GREEN, g3 **RED — blocked on an out-of-scope defect**

## Commits

<!-- prettier-ignore -->
| sha | message |
| --- | ------- |
| `fc7155b87` | test(94-01): failing create-mode enablement oracle for AfterActionForm (TDD RED) |
| `36f9e43e9` | feat(94-01): create-mode Save enables on content, never on mount (TDD GREEN) |
| `7d4183df9` | feat(94-01): wire canPublish + two-step onPublish on the engagement route |
| `bdd139798` | test(94-01): publish probe + route-wiring oracle for criterion 1 |

Scope diff against `phase-94-base` (`3d63da95f`) is exactly the plan's `files_modified`:

```
frontend/src/components/after-action-form/AfterActionForm.tsx
frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx
frontend/tests/component/AfterActionForm.test.tsx
frontend/tests/component/after-action-route-wiring.test.tsx
scripts/probe-after-action-publish.mjs
```

## THE GATE DRILL — every gate, both directions, real output

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| ---- | ------------------------------------ | ------------------------------------- | ----- |
| `94-01_g1` (:114) | Full chain run on the undone tree → `GATE_94-01_g1_EXIT=1`. Vitest passed (`Test Files 1 passed (1)` / `Tests 28 passed (28)`), so the red came from the grep clauses. Attributed: `create_mode_count=0` (needs ≥3) and `untouched_exit=1`. | Same chain → `FINAL_GATE_94-01_g1_EXIT=0`. `Tests 31 passed (31)`; `create_mode_count=5`; `untouched_exit=0`; `tsc --noEmit` clean. | Red is for the gate's subject (the create-mode cases did not exist). Greps instrument-tested both directions before being believed — see below. |
| `94-01_g2` (:141) | Full chain → `GATE_94-01_g2_EXIT=1`. Isolated first clause: `grep -c 'canPublish' …after-action.tsx` printed `0`, `clause1_canPublish_exit=1`. | Same chain → `FINAL_GATE_94-01_g2_EXIT=0` (`tsc --noEmit` clean, negative `.message` grep count 0). | Red for its subject: the route did not pass `canPublish`. The negative grep does not trip on prose — the surviving `toast.error(t('afterActions.conflict.warning', …))` has no `.message` before its first `)`. |
| `94-01_g3` (:188) | `pnpm exec vitest run tests/component/after-action-route-wiring.test.tsx` → `GATE_94-01_g3_EXIT=1`, `No test files found, exiting with code 1`. | **STILL RED — `GATE_94-01_g3_EXIT=1`.** Clauses 1–4 now pass (`Tests 3 passed (3)`; `test -f` ok; both greps ok). Clause 5 fails: `FAIL — after-actions-publish: … [status=404] {"error":"After-action record not found"}`. | The gate is **SOUND** and its red is correct: criterion 1's publish half genuinely does not work. The repair is outside this plan's `files_modified` — see **BLOCKED**. Not `UNABLE TO MEASURE`: the probe reached its subject, created a draft, and cleaned up. |

### Instrument tests run before any zero was believed

```
# g1's greps, both directions, on the undone tree
create_mode_count=0                      # target token, absent  -> can fire
untouched_exit=1                         # target token, absent  -> can fire
AfterActionForm_count=34                 # positive control, present
readonly_positive_control_exit=0         # positive control, present
```

### g3 verbatim, final state

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
granted temporary ownership of 00000000-0000-0052-0000-000000000001 (revoked on exit)
created daffbdb6-cbf1-4ac6-9081-1e83d06a1ee6 (publication_status=draft)
FAIL — after-actions-publish: Edge Function returned a non-2xx status code [status=404] {"error":"After-action record not found"}
--- probe subjects ---
run_id                  = p94-probe-2026-08-16T14-31-31-569Z
engagement_dossier_id   = 00000000-0000-0052-0000-000000000001
after_action_id         = daffbdb6-cbf1-4ac6-9081-1e83d06a1ee6
granted_ownership       = true
fixture_cleaned_up      = true
ownership_revoked       = true
GATE_94-01_g3_EXIT=1
```

Every fixture the probe created was removed on every run — `fixture_cleaned_up = true`,
`ownership_revoked = true`. Staging carries no `p94-probe-…` residue.

## Accomplishments

### Task 1 — create-mode Save enablement (TDD)

`AfterActionForm.tsx:131-134`'s `if (!initialData) return` pinned `isDirty` false in create mode, so
Save draft was permanently disabled. The content-derived expression the file already computed inside
the `onDirtyChange` effect (`:140-151`) is now hoisted to a render-scope `hasContent`, and the Save
button reads `saving || publishing || (initialData ? !isDirty : !hasContent)`. Edit-mode behaviour is
unchanged. The effect got shorter, not longer — its dependency array collapsed from eight fields to
`[hasContent, onDirtyChange]`.

The TDD RED was real: `× create mode: Save draft enables once the user enters content`, 1 failed /
30 passed. The trap case (`untouched empty form → disabled`) passes both before and after — it is
**the regression net against the naive fix**, and it is stated as such rather than counted as a win.

### Task 2 — route wiring + D-08/D-10 toast repair

- `canPublish = ['staff','supervisor','admin'].includes(user?.role ?? '')`, with the citation comment
  to `after-actions-publish/index.ts:60-71` and `RULING-P94-04 A2`. Verified against the server:
  the deployed function's own check is `!['staff','supervisor','admin'].includes(userRole)` → 403.
- `onPublish` is create-then-publish. `after-actions-create/index.ts:134` hardcodes
  `publication_status: 'draft'` — confirmed live: the probe's create returned
  `publication_status=draft` despite the client sending it.
- The create call was extracted to one `createRecord()` used by both handlers, so the
  `follow_ups → follow_up_actions` rename cannot drift between save and publish.
- `:103` now renders `t('common:afterActions.saveFailed')` alone with `console.error(err)`; the new
  publish catch mirrors it with `common:afterActions.publishFailed`. Both keys pre-exist in EN and AR.

### Task 3 — the probe and the wiring oracle

Both landed. The wiring test drives the **real** route component and the **real** `AfterActionForm`,
with only the two mutation hooks stubbed; the Publish button therefore has to actually render for the
click to happen, which is a reachability assertion rather than a stub click. It asserts create-once,
publish-once **with the id create returned**, no-publish-on-create-failure, and no Publish button for
a role the server rejects.

## Findings worth other plans' attention

### 1. `tests/setup.ts:131` globally mocks `react-i18next` — no component test can verify copy

This cost real time and it will cost other plans in this phase more, because several of them assert
translated reject/error copy. The setup file replaces `useTranslation` with a hardcoded key→string
map; keys outside the map return the key. Measured through the hook under the default harness:

<!-- prettier-ignore -->
| call | resolves to |
| ---- | ----------- |
| `t('afterActions.form.saveDraft')` | `"Save Draft"` (in the setup map) |
| `t('afterActions.publishFailed')` | `"afterActions.publishFailed"` (raw key) |
| `t('common:afterActions.publishFailed')` | `"common:afterActions.publishFailed"` (raw key) |
| `i18n.t('common:afterActions.publishFailed')` (real instance) | `"Failed to publish after action"` |

So the colon form is **correct at runtime** — D-10 is safe — and a mocked-`t` failure is not evidence
against it. The remedy used here is `vi.unmock('react-i18next')` in the one file that asserts copy;
the cost is that queries must then use the real EN values. Note the drift that exposes: the setup
map's attendee placeholder is `'Enter attendee names (comma-separated)'` while `src/i18n` says
`'Type a name and press Enter'`. The shipped `AfterActionForm.test.tsx` asserts the stale one and
passes — a live instance of the mocked-consumer class, left alone as out of scope.

### 2. `after_action_records` is UNIQUE on `engagement_id`

`after_action_records_engagement_id_key`. One after-action per engagement; a second create returns 500. Staging has 5 engagement dossiers, 4 free, and the test user owned only the taken one — which
is why the probe provisions and revokes its own `dossier_owners` grant.

### 3. GATE-STANDARD C9b's escaping `sed` is unbalanced on this machine (BSD sed)

`sed -E 's/[][.*+?^${}()|\\]/\\\\&/g'` errors `unbalanced brackets ([])`, leaving `id` **empty**, so
`\b\b` matched 100+ files — the "implausibly total" output the clause itself warns about. Caught by
the clause's own advice. Not a gate, so not a GATE CONCERN; recorded so the next author does not read
that output as coupling.

## C9b — consumer sweep

Population: the two `frontend/src` files this plan modifies. Roots **derived**, not named:
`./frontend/tests ./tests ./backend/tests ./e2e/tests` — 599 spec/test files. Instrument-tested both
directions first (known-present token → 2 files; known-absent token → 0 files).

<!-- prettier-ignore -->
| file | consumer | disposition |
| ---- | -------- | ----------- |
| `AfterActionForm.tsx` | `frontend/tests/component/AfterActionForm.test.tsx` | **Updated in the SAME task** as the guard change (Task 1). All 28 shipped cases still pass. |
| `AfterActionForm.tsx` | `frontend/tests/component/after-action-route-wiring.test.tsx` | Created by this plan. |
| `after-action.tsx` (route) | 14 Playwright specs that navigate to an after-action URL | **NAMED non-consumers of the change.** They target a multi-step wizard at `/after-action/create` that does not exist: `grep -c 'after-action/create' routeTree.gen.ts` → **0**, control `grep -c 'engagements/$engagementId/after-action'` → **10**; `grep -c 'name="title"' AfterActionForm.tsx` → **0**. Their failures cannot be caused by adding a Publish button. |

## Evidence (recorded, NOT gated) — `frontend/tests/e2e/after-action-create.spec.ts`

Run once against the live dev server (`E2E_BASE_URL=http://localhost:5173`, `--project=chromium`).
`test -f` asserted first; exactly one spec path passed, so a filter miss would exit 1, not partially
pass.

**Result: 6 failed / 6.** Exit 1. Failure locators: `locator('form')`,
`locator('input[name="title"]')`, `locator('button:has-text("Next")')`,
`page.waitForURL(/\/after-action\/create/)`. Attribution is measured, not asserted: both the route
and the `name="title"` input are absent from the tree (counts above). This is the **E2ESTALE**
ambient, judged at phase close against the known-red inventory per `94-VALIDATION.md`. It is not a
regression from this plan.

## Deviations from Plan

**1. [Rule 3 — blocking] The wiring test's copy assertion measured the harness mock, not the bundle.**

- **Found during:** Task 3
- **Issue:** `expect(toast.error).toHaveBeenCalledWith('Failed to publish after action')` failed with
  `common:afterActions.publishFailed`, which reads as a D-10 violation in the shipped code.
- **Diagnosis:** four discriminating probes isolated it to `tests/setup.ts:131`'s global
  `react-i18next` mock (`i18n.exists is not a function` proved the hook's `i18n` was not a real
  instance). The colon form resolves correctly on the real instance.
- **Fix:** `vi.unmock('react-i18next')` in that one file; queries repointed to the real EN strings.
- **Commit:** `bdd139798`

**2. [Rule 3 — blocking] The probe could not obtain a fixture.**

- **Found during:** Task 3
- **Issue:** the unique constraint on `engagement_id` plus the test user owning exactly one
  engagement (already taken) meant every create returned 500.
- **Fix:** the probe selects a free engagement with the service-role key and grants itself a
  temporary `dossier_owners` row, revoked on every exit path. The **assertion** path (create /
  publish / read-back) still runs entirely as the user.
- **Commit:** `bdd139798`

**3. Task 3's leaf-component mocks reduced from six to one.**

Only `DecisionList` is stubbed (to reach `isFormValid()` without testing that component's own form).
Every other child of `AfterActionForm` renders for real — fewer mocks and a stronger oracle. The
remaining factories spread `vi.importActual` per `frontend/docs/test-setup.md §2`; `@/lib/supabase`
is the one full mock, because the real module throws at evaluation without `VITE_SUPABASE_*`.

## GATE CONCERN

None. All three gates are sound: each was observed red for its own subject and each clause was
instrument-tested. `94-01_g3`'s persisting red is a true negative about the product, not a defective
oracle — it is exactly the failure the plan says the probe exists to produce ("an oracle that fails
when the work is not done — it did not before").

## Self-Check: PASSED

- `scripts/probe-after-action-publish.mjs` — FOUND
- `frontend/tests/component/after-action-route-wiring.test.tsx` — FOUND
- Commits `fc7155b87`, `36f9e43e9`, `7d4183df9`, `bdd139798` — all FOUND in `git log`
- `git show HEAD:<file>` verified for the probe, the wiring test, `AfterActionForm.tsx` (the
  `hasContent` hoist and the button predicate at :476) and the route (canPublish at :43, the colon
  toast, the two-step publish)

## BLOCKED

**`after-actions-publish` reads the record id from a URL path that no caller can supply, so
publishing is broken for every client — including the shipped detail page. `94-01_g3` cannot go
green until it is repaired, and the repair is outside this plan's `files_modified`.**

**The defect.** `supabase/functions/after-actions-publish/index.ts:38-40`:

```ts
const pathSegments = url.pathname.split('/').filter(Boolean)
const afterActionId = pathSegments[pathSegments.findIndex((s) => s === 'after-actions') + 1]
```

Invoked as an edge function the pathname is `/functions/v1/after-actions-publish`, which contains no
segment equal to `after-actions`. `findIndex` returns `-1`, so the expression evaluates
`pathSegments[0]` = `'functions'` — truthy, so the `400 After-action ID required` guard never fires —
and `.eq('id','functions').single()` errors, producing **404 "After-action record not found"**.

**Confirmed against the DEPLOYED artifact, not source.** `get_edge_function` on
`zkrcjzdemdmwhearhfgg` returns slug `after-actions-publish`, **version 12, ACTIVE**, whose bundled
`index.ts` carries those two lines byte-identically. Source and deployment agree; there is no drift
to blame.

**Proven by a discriminating call, not by reading.** A throwaway diagnostic (not committed) invoked
the _same deployed function_ at
`${SUPABASE_URL}/functions/v1/after-actions-publish/after-actions/<id>/publish` — a path that does
contain the literal segment:

```
created d97b282f-02f9-4345-afa2-d80dd04bb0cf draft
path-shaped publish status = 200
read back publication_status = published
cleaned up
```

So the publish logic, the role check, the version bump and the RLS path are all sound. **The only
defect is the id source.** Fixture removed.

**Blast radius.** `frontend/src/hooks/usePublishAfterAction.ts:20-22` sends the id in the **body**
(`{ after_action_id, is_confidential }`). Every consumer of that hook is affected — this plan's new
`onPublish`, and the shipped detail page `routes/_protected/after-actions/$afterActionId.tsx`. No
after-action has ever been publishable through the UI.

**Why it was not fixed here.** `supabase/functions/after-actions-publish/index.ts` is not in this
plan's `files_modified`, no sibling plan in this phase names it (`grep` over `94-02..94-11`: zero
hits for `after-actions-publish` and `usePublishAfterAction`), and the executor brief requires an
orchestrator ruling before any out-of-scope repair. There is **no in-scope alternative**: prefixing
the invoke name (`functions.invoke('after-actions-publish/<id>')`) still yields segments
`['functions','v1','after-actions-publish','<id>']` with no `after-actions` member, so no client-side
change can satisfy the current parse.

**Proposed repair, for a ruling.** Read the id from the body, keeping the path form as a fallback so
the documented `POST /after-actions/{id}/publish` contract still works:

```ts
const body: PublishRequest = await req.json().catch(() => ({}))
const fromPath = pathSegments[pathSegments.findIndex((s) => s === 'after-actions') + 1]
const afterActionId =
  body.after_action_id ?? (pathSegments.includes('after-actions') ? fromPath : undefined)
```

This requires moving the `req.json()` read above the id extraction, adding `after_action_id?: string`
to `PublishRequest`, **and a redeploy** — source-only repair leaves the deployed bundle broken. Once
deployed, `node scripts/probe-after-action-publish.mjs` is the acceptance oracle and `94-01_g3`
should go green with no change to this plan's code or tests.

**Consequence for `requirements-completed`.** `WRITE-01` is **NOT** marked complete. Its create and
save halves are done and proven; its publish half is blocked on the above. The orchestrator owns
`REQUIREMENTS.md`; this plan does not write it.

## ADDENDUM — PARK-EXEC-01 repair under RULING-P94-09

**The `## BLOCKED` block above is CLEARED.** It is left verbatim as the history of why this
authorization exists. What cleared it: `supabase/functions/after-actions-publish/index.ts:39-51`'s
id source now reads the body, deployed to staging `zkrcjzdemdmwhearhfgg` as **version 13, ACTIVE**,
and `94-01_g3` is **GREEN for the first time in this phase**.

**Authorization:** `RULING-P94-09` (`.tickmarkr/overseer/RULING-P94-09-EXEC-PARKS.md`),
`PARK-EXEC-01` **ruled IN, scoped**. `PARK-EXEC-02` was ruled OUT and was not touched. No migration,
no second schema change, no other plan's files, no intended-broken-register entry repaired.

### Condition 1 — the edit is the id-source seam ONLY. The diff, verbatim

```diff
--- a/supabase/functions/after-actions-publish/index.ts
+++ b/supabase/functions/after-actions-publish/index.ts
@@ -4,6 +4,7 @@ import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
 import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'

 interface PublishRequest {
+  after_action_id?: string
   mfa_token?: string
 }

@@ -38,7 +39,16 @@ serve(async (req) => {

     const url = new URL(req.url)
     const pathSegments = url.pathname.split('/').filter(Boolean)
-    const afterActionId = pathSegments[pathSegments.findIndex((s) => s === 'after-actions') + 1]
+    const body: PublishRequest = await req.json().catch(() => ({}))
+
+    // The id arrives in the BODY: invoked as an edge function the pathname is
+    // /functions/v1/after-actions-publish, which carries no `after-actions` segment, so the
+    // path form alone resolved to pathSegments[0] === 'functions' and every publish 404'd.
+    // The path form is kept so the documented POST /after-actions/{id}/publish still resolves.
+    // RULING-P94-09.
+    const pathIndex = pathSegments.indexOf('after-actions')
+    const afterActionId =
+      body.after_action_id ?? (pathIndex >= 0 ? pathSegments[pathIndex + 1] : undefined)

     if (!afterActionId) {
       return new Response(JSON.stringify({ error: 'After-action ID required' }), {
@@ -47,7 +57,6 @@ serve(async (req) => {
       })
     }

-    const body: PublishRequest = await req.json().catch(() => ({}))
     const { data: user } = await supabaseClient.auth.getUser()

     if (!user.user) {
```

**11 insertions, 2 deletions, one file.** Five of the eleven inserted lines are the citation comment.
**Untouched:** the `Authorization` header check, `createClient`, the method check, `getUser()`, the
role set `['staff','supervisor','admin']` and its 403, the status gate, the MFA branch, the update,
the version snapshot, the notification fan-out, and the catch. The role set is byte-identical before
and after — verified in the deployed v13 bundle below, not only in source.

**One deviation from the patch proposed in `## BLOCKED`.** The proposal was
`body.after_action_id ?? (pathSegments.includes('after-actions') ? fromPath : undefined)`, which
scans the array twice (`findIndex` then `includes`). Shipped is a single `indexOf` with the same
semantics and the same seam. No behavioural difference: both yield the body id when present, the
segment after `after-actions` when the path carries it, and `undefined` otherwise (including when
`after-actions` is the final segment).

### Condition 2 — BOTH directions on the repaired function

**Arm A — the probe green with a NORMALLY-shaped caller URL. This arm had never passed.**
`scripts/probe-after-action-publish.mjs` invokes `functions.invoke('after-actions-publish', { body:
{ after_action_id, is_confidential } })` — the ordinary edge-function URL
`/functions/v1/after-actions-publish`, exactly what `usePublishAfterAction.ts:20-22` sends. The
pre-repair evidence in the gate table above and re-measured today is `[status=404]`; post-repair it
creates, publishes, and **reads the row back as `published`**. The 200 previously recorded in
`## BLOCKED` came from a hand-built _path-shaped_ URL and is NOT this arm.

**Arm B — the `400 After-action ID required` guard OBSERVED TO FIRE. It had never fired in the
history of this function.** Measured with a throwaway zero-dependency diagnostic (not committed,
`/tmp/p94-guard-probe.mjs`) that signs in inline from `.env.test` (D-27 / E2ECRED-01: no dependence
on the Playwright `setup` project; no credential is ever printed) and POSTs
`/functions/v1/after-actions-publish` with **no id anywhere** — no `after_action_id` in the body, no
`after-actions` path segment:

<!-- prettier-ignore -->
| direction | command | actual output |
| --------- | ------- | ------------- |
| RED — pre-repair, against deployed **v12** | `node /tmp/p94-guard-probe.mjs` | `missing-id publish status = 404`<br>`missing-id publish body   = {"error":"After-action record not found"}` |
| GREEN — post-repair, against deployed **v13** | `node /tmp/p94-guard-probe.mjs` | `missing-id publish status = 400`<br>`missing-id publish body   = {"error":"After-action ID required"}` |

The pre-repair 404 is the mechanism proven directly: the truthy `'functions'` sailed past the guard
and died at the row lookup. A repair that fixed the happy path and left the guard dead would have
kept printing `404` here.

### Condition 3 — deploy evidence, measured against the DEPLOYED bundle

Deployed with `supabase functions deploy after-actions-publish --project-ref zkrcjzdemdmwhearhfgg`
(CLI 2.106.0): `Bundling Function` / `Deploying Function: after-actions-publish (script size:
82.94kB)` / `Deployed Functions on project zkrcjzdemdmwhearhfgg: after-actions-publish`.

<!-- prettier-ignore -->
| | before | after |
| --- | ------ | ----- |
| `version` | **12** | **13** |
| `status` | ACTIVE | ACTIVE |
| `ezbr_sha256` | `907851cc131ae1b5eff8ae92a7b9e1802cc73334a1cf0b54290bb5ce74543eed` | `56054c81cae2753619c869b5b0e02826fa2c6557b6626e50e674dcef7736ca69` |
| `verify_jwt` | true | true |

Both readings are `mcp__supabase__get_edge_function` on `zkrcjzdemdmwhearhfgg`, i.e. the **deployed
artifact**, not source. The v13 bundle's `functions/after-actions-publish/index.ts` carries the
repaired seam byte-identically, and carries `!['staff', 'supervisor', 'admin'].includes(userRole)`
unchanged. Every probe run in this addendum ran **after** the deploy, against v13.

Two honest instrument notes:

- The deploy command was piped to `tail`, and `${PIPESTATUS[0]}` printed **empty** — this shell is
  zsh, where the array is `$pipestatus` and is 1-indexed. So the deploy's exit status was **not**
  captured (instrument trap 2, re-earned and reported rather than papered over). The deploy is
  evidenced instead by the version/sha/content readback above, which is the stronger oracle anyway.
- v13's bundled `functions/_shared/cors.ts` no longer lists the deprecated `corsHeaders` export that
  v12's bundle listed. `supabase/functions/_shared/cors.ts` was **not modified** — `git status`
  shows one modified file this lane — so this is CLI bundling of the reachable graph, not an edit.

### The gate drill — `94-01_g3` (`94-01-PLAN.md:188`), both directions

Gate text **unedited**. This gate had never been observed green.

<!-- prettier-ignore -->
| gate | RED before (command + actual output) | GREEN after (command + actual output) | notes |
| ---- | ------------------------------------ | ------------------------------------- | ----- |
| `94-01_g3` (:188) | Full chain re-run on today's tree before any edit → `GATE_94-01_g3_EXIT=1`. Clauses 1–4 pass (`Test Files 1 passed (1)` / `Tests 3 passed (3)`; `test -f` ok; both greps ok). Clause 5: `created 161e8912-5e57-4a07-ac52-af09f355e102 (publication_status=draft)` then `FAIL — after-actions-publish: Edge Function returned a non-2xx status code [status=404] {"error":"After-action record not found"}`; `fixture_cleaned_up = true`, `ownership_revoked = true`. | Same chain, unchanged → `FINAL_GATE_94-01_g3_EXIT=0`. `Tests 3 passed (3)`; `created 2d1dd62e-4246-4084-ad81-b5939870a1d7 (publication_status=draft)`; `read back publication_status = published`; `PASS — created, published and read back as published`; `fixture_cleaned_up = true`, `ownership_revoked = true`. | Red is for the gate's own subject and was re-observed today, not inherited from the first lane. Not a regression guard, not vacuous: the read-back assertion is what moved, and only the deployed function changed between the two runs — no test, probe or frontend file was touched. |

Verbatim GREEN:

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
granted temporary ownership of 00000000-0000-0052-0000-000000000001 (revoked on exit)
created 2d1dd62e-4246-4084-ad81-b5939870a1d7 (publication_status=draft)
read back publication_status = published
PASS — created, published and read back as published
--- probe subjects ---
run_id                  = p94-probe-2026-08-16T14-46-15-245Z
engagement_dossier_id   = 00000000-0000-0052-0000-000000000001
after_action_id         = 2d1dd62e-4246-4084-ad81-b5939870a1d7
granted_ownership       = true
fixture_cleaned_up      = true
ownership_revoked       = true
FINAL_GATE_94-01_g3_EXIT=0
```

Both probe runs in this addendum cleaned up: `fixture_cleaned_up = true` and
`ownership_revoked = true` on each. The guard diagnostic creates nothing. Staging carries no
`p94-probe-…` residue from this lane.

### Condition 4 — the scope addition is RECORDED, not smuggled

`94-01-PLAN.md`'s `files_modified` now carries
`supabase/functions/after-actions-publish/index.ts # RULING-P94-09`, above a two-line comment saying
it was added post-execution under that ruling and is the id-source seam only. This SUMMARY's own
frontmatter `key-files` is left exactly as the original lane wrote it — the instruction was to
append, not to rewrite what that lane recorded.

**`WRITE-01`:** condition 2's both directions are now on disk, above, so the requirement's publish
half is proven and `WRITE-01` is **complete on the evidence**. This lane does **not** write
`.planning/REQUIREMENTS.md` — the orchestrator owns that filing, as it owns `STATE.md` and
`ROADMAP.md`, none of which this lane touched.

### Commits (this addendum's lane)

<!-- prettier-ignore -->
| sha | message |
| --- | ------- |
| `9fa438067` | fix(94-01): read the after-action id from the request body in after-actions-publish |
| `9a86db9c0` | docs(94-01): ADDENDUM — PARK-EXEC-01 repair under RULING-P94-09 |
| `<this commit>` | docs(94-01): record the addendum's own commit sha |

A commit cannot contain its own sha, so the third row is self-referential by necessity: it is the
`HEAD` of this lane, resolvable with `git log --oneline -3` and reported in the lane's completion
message. `9fa438067` is the only commit in this lane that changed code; the other two are
`.planning/`-only.

### GATE CONCERN

None. `94-01_g3` was not edited, and it behaved as a sound oracle in both directions: red for a real
product defect, green only once that defect was repaired in the deployed artifact.

### BLOCKED

None.

ADDENDUM-01A-END
