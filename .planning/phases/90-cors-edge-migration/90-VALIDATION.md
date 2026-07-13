---
phase: 90
slug: cors-edge-migration
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-13
signed_off: 2026-07-13
---

# Phase 90 — Validation Strategy (CORS Edge-Function Migration)

> Per-phase validation contract. Phase 90 is a mechanical-but-wide security
> migration: the deterministic backstop is a repo-wide wildcard-CORS grep (SC-4),
> and the behavioral proof is a per-batch **response-path** smoke (not just
> preflight) against staging.

---

## Success-Criteria → Evidence Map

| SC  | What must be TRUE                                                               | Evidence                                                                                                                                                                              | Status |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `ALLOWED_ORIGINS` verified present + correct before any batch ships             | 90-01 CORS-01 (operator/overseer-delegated). Single Supabase project `zkrcjzdemdmwhearhfgg` = staging AND the droplet-frontend backend; no separate prod project (org listing proof). | ✅     |
| 2   | ~171 handler-scope fns (batch A) migrated, deployed, smoke-checked              | 90-32-SUMMARY: 170 Group-A fns deployed to staging + CORS smoke green.                                                                                                                | ✅     |
| 3   | ~101 module-scope fns incl. 83 local `const corsHeaders='*'` (batches B/C) done | 90-33 (batch B, 74) + 90-34 (batch C, 34) deployed; response-path smoke 15/15 green (allowed→echoed, evil→null, no `*`).                                                              | ✅     |
| 4   | Repo-wide grep for the deprecated wildcard pattern returns 0                    | FINAL SC-4 gate (widened regex incl. `_shared` + expression-form `origin \|\| '*'`): GATE1=0, GATE2=0, WIDENED=0.                                                                     | ✅     |

Requirements **CORS-01, CORS-02, CORS-03 — all complete.**

---

## The SC-4 gate (standing regex — use the WIDENED form)

The initial narrow grep (`ACAO: '\*'`) missed two live forms found during close-out;
the gate regex was widened and is the canonical form going forward:

```
Access-Control-Allow-Origin['"]?\s*[:,][^,}]*\*
```

Repo-wide result at sign-off: **0 matches** (function-level AND `_shared` helpers).

---

## Coverage-gap fixes folded in (surfaced, not closed over)

- **3 `_shared` response-path wildcard sites** (`utils.ts`, `validation-schemas.ts`,
  dead `cors.ts:99` export) — 11 fns emitted `*` on the RESPONSE path though migrated
  at index level. Fixed in `3f289dee`; deployed; response-path smoke 11/11 green.
- **Straggler `_shared/security.ts:217` `origin || '*'`** (8 importers) — overseer-caught,
  dead-code-safe but failed SC-4's letter. Fixed in `2d6b411c`; gate grep widened.
- Lesson baked in: **response-path** smoke (POST, not just OPTIONS preflight) is the
  standard — preflight smokes do not cover response headers.

---

## Deviations / honest carve-outs

- **`queue-processor` un-deployable** — `index.ts:11` imports non-existent
  `backend/src/services/queue.service.ts` (bundler 400). PRE-EXISTING, NOT a CORS
  regression (its CORS migration is intact). **Routed OUT of Phase 90** into Phase 88/89
  backend scope. Batch deploy = 114/115 OK; this is the 1 expected fail.
- **`sentry.ts` dual-import smell** (main.tsx dynamic + app-error-boundary static →
  Rollup `(!)` warning) was the source of the class-1 harness test-fingerprint
  false-negatives during the run. Pre-existing, out of CORS scope → Phase 89.
- Frontend/backend `tsc`/`lint`/`vitest` are **N/A** to `supabase/functions` (Deno) —
  their configs don't include it. `deno check` on touched files was baseline-identical
  (0 new errors, proven by git-stash A/B). No test mirrors exist for the 11 fns.

---

## Wave 0 Requirements

- [x] Repo-wide SC-4 grep = 0 (widened regex) — the deterministic completion backstop
- [x] Per-batch response-path smoke green (A: 90-32; B: 90-33; C: 90-34) on staging
- [x] `ALLOWED_ORIGINS` verified on the deploy target before any batch shipped

_All gates green at sign-off. `OPERATOR VERDICT 90-33/34: signed` (2026-07-13, relayed by overseer)._
