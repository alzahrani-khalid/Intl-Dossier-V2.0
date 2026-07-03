---
phase: 79-aceternity-removal
plan: 03
subsystem: infra
tags: [shadcn, components-json, registry, supply-chain, docs, dead-code]

# Dependency graph
requires:
  - phase: 75-ui-component-migration-audit
    provides: Residue inventory (registry entry, .aceternity docs, README claims, 4 comments, dead ui/timeline.tsx)
provides:
  - '@aceternity-pro shadcn registry entry removed from components.json (ACET-02 letter)'
  - All repo Aceternity doc/comment residue purged except the intentional ban policy
affects: [79-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Ban documentation (eslint.config.mjs no-restricted-imports + COMPONENT_REGISTRY.md) is NOT residue — it names Aceternity to forbid it; keep it, and scope the fully-gone grep to functional patterns / exclude ban context'

key-files:
  created: []
  modified:
    - frontend/components.json
    - frontend/README.md
    - frontend/src/components/timeline/UnifiedVerticalTimeline.tsx
    - frontend/src/components/timeline/EnhancedVerticalTimelineCard.tsx
    - frontend/src/components/dossier/ExpandableDossierCard.tsx
    - frontend/src/routes/_protected/dossiers/index.tsx
  deleted:
    - frontend/.aceternity/ (10 legacy migration docs)
    - frontend/src/components/ui/timeline.tsx

key-decisions:
  - 'Replaced the whole README component-library priority list (not just the Aceternity line) with the real HeroUI v3 -> Radix -> build-yourself cascade — the list was incoherent otherwise (Kibo, also banned, was listed as an active fallback)'
  - "Left COMPONENT_REGISTRY.md's Aceternity mentions intact: they are ban policy (like eslint.config.mjs), not residue, and were not in the plan's residue scope"

patterns-established:
  - "Importer gate before dead-file delete: grep for 'ui/timeline' importers (0) before git rm"

requirements-completed: [ACET-02]

# Metrics
duration: ~20min
completed: 2026-07-03
---

# Phase 79-03: Registry removal + Aceternity residue purge

**The `@aceternity-pro` shadcn registry entry and all repo Aceternity residue (10 legacy docs, README claims, 4 comments, one dead demo file) are gone — leaving only the live SearchableSelect (79-04's) and the intentional Aceternity _ban_ documentation.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-07-03T11:58:00Z
- **Tasks:** 2
- **Files modified:** 6 edited, 11 deleted (.aceternity/×10 + ui/timeline.tsx)

## Accomplishments

- ACET-02's letter: `registries` block (sole entry `@aceternity-pro`) removed from `components.json`; `rtl:true` + all other keys intact; valid JSON. Removes a scaffold-time supply-chain ingress.
- `frontend/.aceternity/` (10 git-tracked migration docs) deleted.
- Dead `frontend/src/components/ui/timeline.tsx` (0 importers, verbatim Aceternity demo template using `motion/react`) deleted.
- README component-library section + 4 live-file doc comments reworded to remove Aceternity naming.

## Task Commits

1. **Task 1: remove @aceternity-pro registry from components.json** — `7f636847` (chore)
2. **Task 2: purge doc/comment residue** — `64f1068b` (chore)

## Files Created/Modified

- `frontend/components.json` — deleted `registries` block.
- `frontend/README.md` — tree comment + component-library priority list reworded to HeroUI v3 → Radix → build-yourself.
- 4 timeline/dossier files — one-line comment rewording, zero code change.
- Deleted: `frontend/.aceternity/` (×10), `frontend/src/components/ui/timeline.tsx`.

## Decisions Made

- See frontmatter key-decisions: whole-list README rewrite (coherence) and COMPONENT_REGISTRY.md ban-doc retention.

## Deviations from Plan

- **Minor (justified):** the plan said "touch only the Aceternity-referencing lines" for README ~line 291, but I replaced the entire 3-item priority list, because the plan _also_ instructed to "describe the real cascade (HeroUI v3 → Radix → build-yourself)" and leaving Kibo-UI (also banned) listed as an active fallback would be incoherent and wrong. Net: more accurate, still surgical to the one list.

## Issues Encountered / Flag for 79-04

- **`frontend/src/components/ui/COMPONENT_REGISTRY.md` retains 4 "Aceternity" mentions** — all are **ban policy** ("Aceternity UI (BANNED)", "Do not install or import", "banned by no-restricted-imports in eslint.config.mjs"). This is an anti-regression control in the SAME category as the `eslint.config.mjs` no-restricted-imports block the plan explicitly leaves untouched — you cannot document a ban without naming the banned thing. It was correctly NOT in the plan's residue scope; NOT touched.
- **Consequence for 79-04's "fully-gone" proof:** the grep battery must target _functional_ Aceternity (`variant="aceternity"`, Aceternity `motion/react` usage, the registry entry) or exclude the two ban-doc paths (`eslint.config.mjs`, `ui/COMPONENT_REGISTRY.md`). After 79-04 strips SearchableSelect, the only literal-"aceternity" matches repo-wide will be these intentional ban references — that is the correct, honest end state, not residue.

## Next Phase Readiness

- Repo-wide `aceternity` in `frontend/src` now reduces to the 3 refs in `SearchableSelect.tsx` (79-04-owned) plus the ban docs. 79-04 can run its fully-gone proof with the ban-doc carve-out documented above.

---

_Phase: 79-aceternity-removal_
_Completed: 2026-07-03_
