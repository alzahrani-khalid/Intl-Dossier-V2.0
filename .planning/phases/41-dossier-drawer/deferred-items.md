# Phase 41 — Deferred Items

Tracking surface-level work that was discovered but intentionally deferred during Phase 41 execution. Each row names what was deferred, why, and the planned follow-up.

## OverdueCommitments dossierType propagation — DEFERRED

**Source:** Phase 41 plan-checker WARNING #5 (revision 2026-05-02); plan 41-06 Task 1.

**Reason:** The `usePersonalCommitments` hook returns `GroupedCommitment[]` whose interface (in `frontend/src/hooks/usePersonalCommitments.ts`) does NOT expose `dossierType` on group objects. The schema permits non-country dossiers in `dossier_groups`; without `group.dossierType` propagation Phase 41 falls back to `'country'`, which would produce incorrect drawer state for non-country groups (drawer would render with mismatched `dossierType` search-param).

**Mitigation in Phase 41 (plan 06):** `OverdueCommitments.handleHeadClick` calls `openDossier({id, type: group.dossierType ?? 'country'})` plus `console.warn` whenever the fallback fires. Dev environment surfaces drift; production behaves correctly for the dominant country case.

**Track:** revisit in a polish phase by either
1. extending `usePersonalCommitments` to surface `dossierType` from the joined `dossiers.type` column, or
2. adding a per-row dossier lookup for groups missing the field.

## MyTasks open-trigger — DEFERRED

**Source:** 41-RESEARCH.md §9 row 2; plan 41-06 Task 2 (documentation).

**Reason:** MyTasks renders DossierGlyph + title with no clear dossier affordance. The natural row click target conflicts with the existing checkbox + the row-level work-item navigation. RESEARCH recommendation: skip for Phase 41 to avoid degrading the existing widget UX. Re-evaluate with explicit user feedback on click-target precedence.

**Decision:** Phase 41 ships with 3 dashboard triggers (RecentDossiers, OverdueCommitments, ForumsStrip) + calendar event click; MyTasks excluded.

**Track:** revisit in Phase 42 with user feedback on whether MyTasks should expose a secondary dossier-context affordance (e.g. a small chip-shaped button distinct from the row click).
