# Phase 58: Tier-C Design-Token Suppression Full Clear - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 58-tier-c-design-token-suppression-full-clear
**Areas discussed:** Wave taxonomy & ordering, Purple-family disposition, Dark-variant + alpha-suffix policy, Visual-baseline + per-wave verification

---

## Wave Taxonomy & Ordering

### Q1: How should the 271 Tier-C files be carved into waves?

| Option                                    | Description                                                                                                                                                                                                                         | Selected |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Strict ROADMAP 5 surfaces + 6th catch-all | Forms, tables, charts (residue post-Tier-B), drawers/dialogs, dossier rail + 6th catch-all `pages-routes-misc` for routes/\_protected (18) + pages/\* (~15) + long-tail dirs. Honors ROADMAP §4 verbatim. 6 wave PRs.               | ✓        |
| Top-N directory buckets                   | 5-7 waves keyed to top component dirs: dossier+sections, routes/\_protected+pages/\*, commitments+positions+waiting-queue, calendar+timeline+stakeholder-timeline, bulk-actions+forms+empty-states, remainder. Matches file layout. |          |
| 3 mega-waves                              | Wave 1 = leaf components, Wave 2 = composite surfaces, Wave 3 = routes/pages. Fewer PRs, larger diffs.                                                                                                                              |          |
| Hybrid: 5 ROADMAP + per-dir fallback      | Files that fit forms/tables/charts/drawers/dossier-rail go to those 5; everything else (~170 files) splits by top-level dir. ~8-9 PRs.                                                                                              |          |

**User's choice:** Strict ROADMAP 5 surfaces + 6th catch-all.
**Notes:** Honors ROADMAP §"Phase 58 — Success Criterion 4" wording verbatim. 6th catch-all (`pages-routes-misc`) absorbs the 18 routes/\_protected files + ~15 pages/\* files + long-tail dirs (compliance, audit-logs filters, calendar, etc.) that don't map to the 5 named surfaces.

---

### Q2: What order do the 6 waves ship in, and how granular is each PR?

| Option                                     | Description                                                                                                                                               | Selected |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Low-risk → high-risk, 1 PR per wave        | Order: forms → tables → drawers/dialogs → dossier rail → charts-residue → pages-routes-misc. 1 PR per wave. Verification gate green between waves. 6 PRs. | ✓        |
| Dossier rail first (highest-value visible) | dossier rail → drawers → forms → tables → charts-residue → pages-routes. Higher visual-diff churn early.                                                  |          |
| Alphabetical by surface                    | Deterministic, no risk-prioritization.                                                                                                                    |          |
| 1 PR per wave + bonus pre-flight PR        | Wave 0 manifest PR + 6 surface PRs + 1 closure PR = 8 PRs.                                                                                                |          |

**User's choice:** Low-risk → high-risk, 1 PR per wave.
**Notes:** Forms is leaf-most and least cross-coupled, validates swap pattern before dossier rail (most user-visible). (Wave-0 manifest PR was still adopted from the other option per Q3.)

---

### Q3: How is the file→surface mapping locked?

| Option                             | Description                                                                                                      | Selected |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| Wave 0 commit: 58-WAVE-MANIFEST.md | First plan emits deterministic manifest mapping every Tier-C row → wave label. Manifest commits before any swap. | ✓        |
| Per-wave plan does its own scoping | Each surface plan opens 51-DESIGN-AUDIT.md, filters rows it claims. Risk: orphans or double-claims.              |          |
| Path-glob in PLAN.md (no manifest) | Each wave PLAN.md declares its file globs. Implicit ordering dependency.                                         |          |

**User's choice:** Wave 0 commit: 58-WAVE-MANIFEST.md.
**Notes:** Single source of truth; per-row override columns (blue+purple collision, dark-variant ladder, multi-Literal-per-line, regen targets, test-grep hits) all live in the manifest. Schema captured in CONTEXT.md `<specifics>`.

---

### Q4: Atomic commit granularity inside a wave PR?

| Option                              | Description                                                                                        | Selected |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| 1 commit per file                   | Atomic per-file commits. Each commit: swap literals + delete annotations + lint green. Bisectable. | ✓        |
| 1 commit per wave (squash-style)    | Single commit per wave; big diff, harder to bisect.                                                |          |
| 1 commit per N files (batched, N=5) | Compromise.                                                                                        |          |

**User's choice:** 1 commit per file.
**Notes:** Matches Phase 51 Plan 04 atomic-per-file precedent.

---

## Purple-Family Disposition

### Q5: How should the 5 purple-family color families (purple/violet/fuchsia/pink/indigo, ~102 files, ~450 literals) be mapped?

| Option                                               | Description                                                                                                    | Selected |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| Map all → text-accent family                         | Mechanical swap to accent (brand hue oklch 58%/0.14/32). Honors 'mechanical swaps' clause + OOS no-new-tokens. | ✓        |
| Map all → text-muted-foreground (neutralize)         | Conservative; drops purple semantic signal entirely.                                                           |          |
| Per-row semantic re-interpretation                   | Read audit + surrounding code, pick by MEANING. Most faithful, ~3-4× cost.                                     |          |
| Hybrid: per-row for lookup tables, accent for inline | Lookup-table type files get judgment; inline uses bulk-swap to accent.                                         |          |

**User's choice:** Map all → text-accent family.
**Notes:** Single mechanical rule; v6.4 OOS clause forbids net-new tokens like `--purple`. Brand hue accent is closest "category alt" semantic.

---

### Q6: Edge case — purple+blue in same file (visual collision after accent mapping)?

| Option                          | Description                                                                             | Selected |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| accent vs accent-soft split     | Blue → accent, purple → accent-soft (via existing `secondary` token).                   | ✓        |
| Override audit map: blue → info | Blue → info, purple → accent. Slight deviation from 51-DESIGN-AUDIT proposed_token_map. |          |
| Per-row in 58-WAVE-MANIFEST     | Manifest's per-row override resolves case-by-case. Slow but precise.                    |          |
| Accept the collision            | Both → text-accent. Semantic distinction lost.                                          |          |

**User's choice:** accent vs accent-soft split.
**Notes:** Uses existing `--color-secondary` = `var(--accent-soft)` token (no new tokens). Manifest flags collision per file in `blue_purple_collision` column.

---

## Dark-Variant + Alpha-Suffix Policy

### Q7: How are `dark:` variants handled during the Tier-C swap?

| Option                                     | Description                                                                                                                                            | Selected |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Preserve dark, tweak alpha                 | `bg-X-100 dark:bg-X-900/30` → `bg-{semantic}/10 dark:bg-{semantic}/30`. Alpha ladder: 100→10, 900→30 (one tier up). Matches Phase 51 Tier-A precedent. | ✓        |
| Drop dark variant entirely                 | Semantic tokens mode-invariant; arguably redundant. Smaller diff.                                                                                      |          |
| Always-paired even when source lacked dark | Add `dark:` even if source didn't have one. Diverges from 80%-no-dark convention.                                                                      |          |
| Per-file judgment (no rule)                | Each file decides; slow.                                                                                                                               |          |

**User's choice:** Preserve dark, tweak alpha.
**Notes:** Bg/border-level only. Text-\* handled separately per Q8.

---

### Q8: Edge case — `text-X-700 dark:text-X-300` mapping rule?

| Option                                             | Description                                                                                                                      | Selected |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Drop dark variant on text-\*                       | `text-X-700 dark:text-X-300` → `text-{semantic}`. Ink tokens mode-invariant. Reduces diff churn. Matches 80%-no-dark convention. | ✓        |
| Preserve text dark variant too                     | Adds redundant CSS.                                                                                                              |          |
| Map to text-{semantic} + dark text-{semantic}-soft | Only accent has `-soft`/`-ink`; falls back to drop-dark for non-accent.                                                          |          |

**User's choice:** Drop dark variant on text-\*.
**Notes:** Combined D-08 (bg/border preserves) + D-09 (text drops) shrinks the dark-prefixed literal count from ~1368 to ~600.

---

## Visual-Baseline + Per-Wave Verification

### Q9: Visual-baseline regen strategy (2336 swaps will diff against Phase 57 D-22 locked baselines)?

| Option                                    | Description                                                                                                                               | Selected |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Per-wave regen + LTR≠RTL byte check       | Per-wave: re-run affected visual specs with `--update-snapshots`, reassert LTR vs RTL byte-distinct (D-22 contract), commit PNGs same PR. | ✓        |
| Big-bang regen at end (Wave 7 closure)    | Visual specs fail across waves (annotated 'EXPECTED'); regen all in closure PR. Noisy CI.                                                 |          |
| Skip regen, treat as pixel-stable         | OKLCH may render close enough; try first. Risk of false-positive pass.                                                                    |          |
| Visual-spec carve-out: skip until closure | `.skip` visual specs at start, re-enable in closure.                                                                                      |          |

**User's choice:** Per-wave regen + LTR≠RTL byte check.
**Notes:** Each wave PR self-validates against Phase 57 D-22 invariant. Diff between LTR and RTL post-regen must be non-zero. Specs to regen captured per-wave in manifest's `regen_targets` column.

---

### Q10: Per-wave verification gate + criterion #2 ("eslint.config.mjs Tier-C waiver token removal") interpretation?

| Option                                                | Description                                                                                                                                                                                             | Selected |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Full gate + criterion #2 = N/A documented             | Per-wave gate: lint + type-check + visual specs + unit tests + grep-zero. Criterion #2 = N/A by absence; no Tier-C block exists or ever existed in eslint.config.mjs. Documented in 58-VERIFICATION.md. | ✓        |
| Lint+type-check only between waves                    | Fast gate per wave; visual+unit at closure. Risk of slip across waves.                                                                                                                                  |          |
| Strict gate + add then delete a Phase 58 marker block | Performative; pointless ceremony.                                                                                                                                                                       |          |
| Reinterpret criterion #2 — strengthen the rule        | Add a new ESLint check that BLOCKS `Phase 51 Tier-C:` from reappearing. Positive-failure enforcement.                                                                                                   |          |

**User's choice:** Full gate + criterion #2 = N/A documented.
**Notes:** ROADMAP §criterion-2 uses paraphrased marker `gsd-design-token-tier-c-allow` that never existed in code. Actual marker is per-line `// eslint-disable-next-line no-restricted-syntax -- Phase 51 Tier-C:`. 58-VERIFICATION.md documents this as: "Criterion #2 satisfied by absence — no Tier-C waiver token, block, or exception in eslint.config.mjs at planning baseline; closure verified by repeat grep returning zero matches."

---

## Claude's Discretion

- Exact swap-pattern script per file (sed / codemod / manual hand-edit) — selected per file complexity during planning.
- Wave-internal task ordering inside each wave PLAN.md (Claude picks atomic-file order from manifest).
- Visual-spec selection per wave if a spec touches the wave's files but is not yet in the manifest's `regen_targets` column — regen anyway.
- PR titles + branch names follow v6.4 milestone naming convention: `phase-58/wave-N-<surface>`.
- Closure-commit message format follows existing repo `git log phase-57-base..HEAD` precedent.
- 51-DESIGN-AUDIT.md closure-annotation table column ordering (Claude picks; must include wave/files/annotations_cleared/nodes_swapped/regen_targets/commit_sha_range).
- Whether to extract a reusable jscodeshift transform to `tools/codemods/` (Claude can decide to preserve it; not a Phase 58 deliverable).

---

## Deferred Ideas

- **Net-new design tokens for purple/violet category color** — OOS per v6.4 REQUIREMENTS.md; revisitable in v7.0+ if Intelligence Engine adopts category coding.
- **Tier-B carve-out audit / shrinking** — `eslint.config.mjs:247-270` (charts, flags, bootstrap, signature-visuals) is intentional per Phase 51 D-03/D-13; future chart-token phase could shrink.
- **Codemod tool generalization** — if Wave 1 produces a reusable jscodeshift transform, preserve in `tools/codemods/` for v7.0+; not a Phase 58 deliverable.
- **Snapshot-spec consolidation** — multiple visual specs touch overlapping surfaces; consolidation belongs in a future polish phase.
- **51-DESIGN-AUDIT.md migration to historical archive** — after Phase 58 closure annotation lands, doc serves as a historical record; v7.0+ cleanup could move it to milestones archive.
- **`gsd-design-token-tier-c-allow` marker rename in ROADMAP** — the ROADMAP §criterion-2 paraphrase implies this marker exists; never did. A v6.5 cosmetic phase could rewrite the wording; OOS for Phase 58 execution.
- **Wave-7 closure-only PR** — considered (option in Q2); rolled into Wave-6 + manifest-commit instead. If closure scope grows during execution, can be promoted to a 7th PR without re-planning.
