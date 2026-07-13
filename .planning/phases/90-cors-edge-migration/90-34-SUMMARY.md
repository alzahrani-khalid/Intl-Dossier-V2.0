---
phase: 90-cors-edge-migration
plan: 34
type: checkpoint
status: AWAITING-OPERATOR-SIGNOFF
requirements: [CORS-03]
---

# 90-34 — Deploy batch C (Group-C + Group-D) to staging + FINAL SC-4 gate

**Status: evidence complete, AWAITING OPERATOR SIGN-OFF (plan is `autonomous: false`;
this is the LAST Phase-90 checkpoint and closes SC-4).** Orchestrator does not
self-approve (ORCH-BRIEF rule 2).

## Precondition

- CORS-01 (90-01) green — `ALLOWED_ORIGINS` verified present + correct on staging.

## Deploy (STAGING `zkrcjzdemdmwhearhfgg`, `supabase functions deploy --use-api`)

- Group-C + Group-D set = union of `files_modified` across plans 27–31, 35, 36 =
  **34 functions**. **34/34 deployed OK.**
- (Deployed together with batch B and the 7 Group-A `_shared/security.ts` importers
  in one background run — 114/115 total OK; the single failure `queue-processor`
  belongs to batch B and is a pre-existing broken cross-tree import, not CORS — see
  90-33-SUMMARY.)

## Response-path smoke (valid JWT, POST — not just preflight)

Allowed origin `http://138.197.195.242` echoed exactly; disallowed origin
`http://evil.example.com` → `null`; no `*`. 15/15 representative + all 8
`security.ts` importers PASS (`/tmp/batch_bc_report.txt`).

## FINAL SC-4 GATE (verbatim from 90-34-PLAN, repo-wide)

- GATE 1 — `grep -rn "Access-Control-Allow-Origin': '*'" supabase/functions --include='*.ts' | grep -v _shared | wc -l` = **0**
- GATE 2 — non-`_shared` files mentioning `corsHeaders` but not `getCorsHeaders` = **0**
- WIDENED (orchestrator, catches expression-form `origin || '*'`, INCLUDING `_shared`):
  `Access-Control-Allow-Origin[...]*` repo-wide = **0**
  (added after the overseer caught `_shared/security.ts:217`; see DECISIONS 2026-07-13).

## Acceptance

- [x] Group-C (26) + Group-D (8) deployed to staging (34/34)
- [x] Allowed-origin smoke echoed; disallowed → `null`
- [x] FINAL repo-wide wildcard grep = 0 (both plan gates + widened)
- [ ] **Operator sign-off closing Phase 90 / SC-4** (pending — human checkpoint)

## Carry-forward for the (post-reset) run-end consolidation

- Consolidation merges already on `milestone/v9.0-drover`: run branch `39c56e83`,
  P90-20 `29599946`. Remaining code commits from THIS gap-fix session on milestone:
  `3f289dee` (3 `_shared` wildcard sites) + `2d6b411c` (security.ts straggler).
- Open item routed OUT of Phase 90: `queue-processor` un-deployable (missing
  `backend/src/services/queue.service.ts`).
