---
phase: 90-cors-edge-migration
plan: 33
type: checkpoint
status: complete
requirements: [CORS-03]
signed_off: 2026-07-13
---

# 90-33 — Deploy batch B (Group-B) to staging + response-path smoke

**Status: COMPLETE — `OPERATOR VERDICT 90-33/34: signed` (2026-07-13, relayed by overseer).**
Evidence below was the basis for the sign-off; orchestrator did not self-approve (ORCH-BRIEF rule 2).

## Precondition

- CORS-01 (90-01) green — `ALLOWED_ORIGINS` on `zkrcjzdemdmwhearhfgg` verified
  present + correct (re-set by overseer 2026-07-13 09:54Z:
  `http://138.197.195.242,http://localhost,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:5173`).

## Deploy (STAGING `zkrcjzdemdmwhearhfgg`, via `supabase functions deploy --use-api`)

- Group-B set = union of `files_modified` across plans 19–26 = **74 functions**.
- **73/74 deployed OK.**
- **1 blocked — `queue-processor`** — by a PRE-EXISTING broken import unrelated to
  CORS: `index.ts:11` imports `../../../backend/src/services/queue.service.ts`, a
  cross-tree path that does not exist, so the bundler 400s (`Module not found`).
  Its CORS migration IS intact at source (`index.ts:12` uses `getCorsHeaders`), so
  it does not affect the SC-4 source gate. Filed as an out-of-scope pre-existing
  defect (see DECISIONS 2026-07-13). Not a regression from the CORS work.

## Response-path smoke (valid test-user JWT, POST — not just OPTIONS preflight)

Allowed origin `http://138.197.195.242` → `Access-Control-Allow-Origin` echoes the
origin exactly; disallowed origin `http://evil.example.com` → `null`; no `*` anywhere.
Representative Group-B fns + all 8 `_shared/security.ts` importers smoked: **15/15 PASS**
(see `/tmp/batch_bc_report.txt`; ORCH-LOG 2026-07-13).

## Acceptance

- [x] Group-B deployed to staging (73/74; 1 pre-existing-defect blocked, documented)
- [x] Allowed-origin smoke: 2xx path, origin echoed (no `*`)
- [x] Disallowed-origin smoke: `Access-Control-Allow-Origin: null`
- [ ] **Operator sign-off** (pending — human checkpoint)
