# Implementation Plan: Smart Dossier Context Inheritance

**Branch**: `035-dossier-context` | **Date**: 2025-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/035-dossier-context/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement smart dossier context inheritance so all activities (tasks, commitments, intakes, engagements) automatically connect to dossiers through context resolution chains. When users create work items from pages already linked to a dossier (e.g., creating a task from an engagement page), the system inherits dossier context without redundant selection. Technical approach: React Context with URL sync for frontend state, junction table for flexible work-item-to-dossier links, and RPC function for sub-100ms context resolution.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), React 19+, Node.js 18+ LTS
**Primary Dependencies**: TanStack Router v5 (routing + URL state), TanStack Query v5 (server state), Supabase JS v2 (client), i18next (i18n), Tailwind CSS, Aceternity UI
**Storage**: PostgreSQL 15+ (Supabase) with RLS, new junction table for work-item-dossier links
**Testing**: Vitest (unit), Playwright (E2E), Supabase local for integration
**Target Platform**: Web (desktop + mobile responsive), RTL/LTR support
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <100ms context resolution, <2s activity timeline load for 500 activities
**Constraints**: Mobile-first responsive, Arabic RTL support, WCAG 2.1 AA, offline-graceful
**Scale/Scope**: Support dossiers with up to 500 linked activities, 5+ dossier types

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                 | Status  | Notes                                                                           |
| ------------------------- | ------- | ------------------------------------------------------------------------------- |
| §1 Bilingual Excellence   | ✅ PASS | Spec requires bilingual dossier names (FR-010), RTL support explicit            |
| §2 Type Safety            | ✅ PASS | TypeScript strict mode, explicit types for CreationContext, WorkItemDossierLink |
| §3 Security-First         | ✅ PASS | RLS on junction table, permission filtering on inherited dossiers (FR-011)      |
| §4 Data Sovereignty       | ✅ PASS | No external cloud dependencies, Supabase self-hostable                          |
| §5 Resilient Architecture | ✅ PASS | Fallback to manual selector when context cannot be resolved                     |
| §6 Accessibility          | ✅ PASS | WCAG 2.1 AA required per CLAUDE.md, keyboard navigation for selector            |
| §7 Container-First        | ✅ PASS | No new services, uses existing Supabase infrastructure                          |

**Pre-Design Gate Result**: ✅ PASS - No constitution violations

### Post-Design Constitution Re-Check

| Principle                 | Status  | Design Verification                                                                       |
| ------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| §1 Bilingual Excellence   | ✅ PASS | DossierReference includes name_en/name_ar; DossierContextBadge displays bilingual names   |
| §2 Type Safety            | ✅ PASS | All types defined in dossier-context.types.ts with explicit return types                  |
| §3 Security-First         | ✅ PASS | RLS policies defined for work_item_dossiers; polymorphic access checks per work item type |
| §4 Data Sovereignty       | ✅ PASS | All data stored in Supabase; no external cloud calls                                      |
| §5 Resilient Architecture | ✅ PASS | Fallback to DossierSelector when context cannot resolve; graceful error handling          |
| §6 Accessibility          | ✅ PASS | Components will include ARIA labels; keyboard navigation required in quickstart           |
| §7 Container-First        | ✅ PASS | Edge Function deploys to existing Supabase; no new containerized services                 |

**Post-Design Gate Result**: ✅ PASS - Design complies with all constitution principles

## Project Structure

### Documentation (this feature)

```text
specs/035-dossier-context/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (existing)
supabase/
├── migrations/
│   └── YYYYMMDD_create_work_item_dossiers.sql  # New junction table
└── functions/
    └── resolve-dossier-context/               # New Edge Function for context resolution

frontend/
├── src/
│   ├── contexts/
│   │   └── dossier-context.tsx               # New: DossierContextProvider
│   ├── hooks/
│   │   ├── useDossierContext.ts              # New: Context hook
│   │   ├── useResolveDossierContext.ts       # New: Resolution hook
│   │   └── useDossierActivityTimeline.ts     # New: Activity timeline hook
│   ├── components/
│   │   ├── dossier/
│   │   │   ├── DossierContextBadge.tsx       # New: Visual badge component
│   │   │   ├── DossierSelector.tsx           # New: Multi-select picker
│   │   │   └── DossierActivityTimeline.tsx   # New: Aggregated activity view
│   │   └── work-creation/
│   │       └── hooks/useCreationContext.ts   # Modified: Add dossier resolution
│   ├── types/
│   │   └── dossier-context.types.ts          # New: Context types
│   └── routes/
│       └── dossiers/$dossierId/
│           └── activity.tsx                  # New: Activity timeline route
└── tests/
    ├── unit/
    │   └── dossier-context/
    ├── integration/
    │   └── dossier-resolution.test.ts
    └── e2e/
        └── dossier-context-inheritance.spec.ts
```

**Structure Decision**: Web application (frontend + backend). Feature adds new React Context, hooks, components to existing frontend structure, plus one new junction table and Edge Function to Supabase backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations - complexity tracking not required.

---

## Generated Artifacts

| Artifact     | Path                                                           | Description                                 |
| ------------ | -------------------------------------------------------------- | ------------------------------------------- |
| Research     | `specs/035-dossier-context/research.md`                        | Phase 0: Technical research and decisions   |
| Data Model   | `specs/035-dossier-context/data-model.md`                      | Phase 1: Database schema, types, validation |
| API Contract | `specs/035-dossier-context/contracts/dossier-context-api.yaml` | Phase 1: OpenAPI 3.0 specification          |
| Quickstart   | `specs/035-dossier-context/quickstart.md`                      | Phase 1: Developer setup guide              |

## Next Steps

Run `/speckit.tasks` to generate actionable implementation tasks from this plan.
