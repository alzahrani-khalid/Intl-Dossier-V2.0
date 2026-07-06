# ADR-008: Retire the ConsistencyPanel Frontend Surface

Status: Accepted

Date: 2026-07-06

## Context

The position ConsistencyPanel entered Phase 86 as a permanently-inert UI surface.
Its provenance is verification item E-8: the L7 "honest-disable" round unmounted the
panel from `routes/_protected/positions/$id.tsx` because it rendered inert
modify/accept/escalate controls with no wired data source, leaving only a comment
where the mount used to be.

The build-vs-delete call for FEAT-04 was explicitly delegated by the user to the
research and planning stages rather than pre-decided. The research
(`86-RESEARCH.md` § "FEAT-04: ConsistencyPanel — Build vs Delete") returned
HIGH-confidence evidence for DELETE. The four pivotal points:

1. **The vector similarity leg is dead.** The edge function's
   `find_similar_positions` RPC joins `position_embeddings`, and nothing in the
   repository ever writes `position_embeddings` (repo-wide grep — only type
   definitions reference it). The RPC returns empty and the function's try/catch
   already swallows the result.
2. **The LLM leg is gated on Phase 91.** Recommendations require `VLLM_BASE_URL`
   (the on-prem GPU inference stack = LIVE-01, the final phase of this milestone).
   Until that path exists the function always reports
   `ai_service_available: false`.
3. **What remains is a false-positive generator.** With both real signals absent,
   the only live logic is a keyword heuristic: `detectContradiction` flags a
   HIGH-severity conflict whenever a new position contains any positive keyword and
   an existing one contains any negative keyword (near-certain co-occurrence across
   real policy prose, evaluated pairwise against every approved position);
   `detectAmbiguity` emits a conflict row per existing position from hedging words
   in the new draft alone. The score deductions crater `overall_score` for
   essentially any submission. Surfacing this as a numeric "consistency score"
   would be misleading UI replacing dead UI.
4. **Contract drift is total and the actions are undefined.** The panel expects the
   old `consistency_checks` shape (`consistency_score`, `conflict_position_id`,
   3 severities); the edge function returns the newer `position_consistency_checks`
   shape (`overall_score`, `risk_level`, `conflicting_position_id`, 6 conflict
   types, 4 severities, bilingual `description_en/ar` + `evidence_en/ar`). Wiring
   would require rewriting the panel's data layer and its rendering. On top of that,
   `positions-consistency-reconcile` is a 13-line 501 stub, so the panel's
   accept/escalate actions have no backend meaning.

A corroborating detail recorded during planning: `SubmitPositionResponse` declared a
`consistency_check` field, but `positions-submit` returns `{ position }` only — the
type was a lie with no runtime consumer.

## Decision

**DELETE the ConsistencyPanel frontend surface.** Removed in this phase:

- `frontend/src/components/consistency-panel/` (the `ConsistencyPanel.tsx` component)
- `frontend/src/components/__tests__/ConsistencyPanel.test.tsx` (17 tests against the old stub contract)
- The `consistency` i18n block in `frontend/src/i18n/en/positions.json` and `frontend/src/i18n/ar/positions.json` (kept EN/AR symmetric)
- The stale mount comment in `frontend/src/routes/_protected/positions/$id.tsx`
- The dead `ConsistencyCheck` interface in `frontend/src/types/position.ts` and the `SubmitPositionResponse.consistency_check` field in `frontend/src/domains/positions/types/index.ts`

**RETAIN dormant — do not remove — the backend assets:**

- `positions-consistency-check` edge function (979 lines)
- `positions-consistency-reconcile` edge function (501 stub)
- The `position_consistency_checks` table, its RLS policies, and the
  `get_latest_consistency_check` / `can_auto_approve_position` RPCs
- Migrations `20250101008` and `20260111100001`
- The generated `position_consistency_checks` schema in
  `frontend/src/types/database.types.ts`

This is a frontend-only retirement. The backend schema and functions stay in the
repository and migrations as the substrate for a future, properly-scoped feature.
This research file and this ADR are the revisit map.

## Revisit Trigger

After Phase 91 lands LIVE-01 / LIVE-03 (live on-prem GPU inference), **if** position
consistency is still wanted, re-scope it as an **"LLM-backed consistency review"**
that is fed by a real **`position_embeddings` backfill pipeline** (which does not
exist in any current phase). Reference `86-RESEARCH.md` § FEAT-04 as the revisit map.

**Hard constraint:** never resurrect the keyword heuristic as a numeric consistency
score. Its contradiction/ambiguity detectors are false-positive generators; presenting
their output as an AI signal is strictly worse than the panel's absence.

## Residual Risk Accepted

- The retained `positions-consistency-check` function has no UI consumer after this
  plan. It still ships wildcard CORS and `supabase-js@2.39.0`; the CORS hardening is
  Phase 90 scope (T-86-11 disposition: accept). Deleting the panel removes the
  integrity risk of shipping a misleading keyword-derived score (the deletion is the
  mitigation, not the exposure).
- If a future feature reintroduces consistency UI without first standing up the
  embeddings backfill, it risks re-shipping the same noisy heuristic. The revisit
  trigger and hard constraint above exist to prevent that.

## Related

- `86-RESEARCH.md` § "FEAT-04: ConsistencyPanel — Build vs Delete" — the delegated
  research decision and full evidence.
- ROADMAP Phase 86 success criterion 4 ("ConsistencyPanel fully deleted with the
  decision recorded"); closes E-8.
- ADR-007 — the sibling record of v7.0 deploy-gated intelligence work; LIVE-01 is the
  same on-prem GPU path referenced there.
