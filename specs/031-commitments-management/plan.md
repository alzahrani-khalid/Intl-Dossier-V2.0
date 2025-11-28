# Implementation Plan: Commitments Management v1.1

**Branch**: `031-commitments-management` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/031-commitments-management/spec.md`

## Summary

Transform the existing read-only commitments list into a full lifecycle management system with CRUD operations, inline status updates, advanced filtering with URL sync, and evidence upload capabilities. Builds on Feature 030's `aa_commitments` table and health score infrastructure. Mobile-first, RTL-compatible implementation using direct Supabase calls for CRUD and Edge Functions for file uploads.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode)
**Primary Dependencies**: React 19, TanStack Router v5, TanStack Query v5, Supabase JS v2, i18next, Framer Motion, Aceternity UI
**Storage**: PostgreSQL 15+ (Supabase), Supabase Storage (evidence files)
**Testing**: Vitest (unit), Playwright (E2E), MSW (API mocking)
**Target Platform**: Web (React), iOS 14+/Android 10+ (responsive PWA)
**Project Type**: Web application (frontend + Supabase backend)
**Performance Goals**: List rendering <500ms, status update <200ms, evidence upload <10s for 5MB
**Constraints**: Mobile-first (320px+), RTL support, 44x44px touch targets, <10MB evidence files
**Scale/Scope**: Up to 1,000 commitments per dossier, 50+ concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file is a template (not yet customized for this project). Applying implicit project standards from CLAUDE.md:

| Principle | Status | Notes |
|-----------|--------|-------|
| Mobile-First | ✅ PASS | All components will use mobile-first Tailwind breakpoints |
| RTL Support | ✅ PASS | Logical properties (ms-*, me-*), dir attribute, icon flipping |
| Aceternity UI First | ✅ PASS | Will use Aceternity file-upload, timeline, expandable-card |
| Supabase Backend | ✅ PASS | Direct Supabase calls + Edge Functions per existing patterns |
| TanStack Query | ✅ PASS | Query hooks with optimistic updates per existing patterns |
| TypeScript Strict | ✅ PASS | All new code in strict mode |

## Project Structure

### Documentation (this feature)

```text
specs/031-commitments-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── commitments.openapi.yaml
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Web application structure (existing)
backend/
├── src/
│   └── api/
│       └── commitments.ts          # Express routes (minimal, mostly Supabase)
└── tests/

frontend/
├── src/
│   ├── components/
│   │   └── commitments/
│   │       ├── CommitmentsList.tsx      # Enhanced list (existing)
│   │       ├── CommitmentCard.tsx       # New card component
│   │       ├── CommitmentForm.tsx       # New create/edit form
│   │       ├── CommitmentFilterDrawer.tsx  # New filter panel
│   │       ├── CommitmentDetailDrawer.tsx  # New detail view
│   │       └── EvidenceUpload.tsx       # New evidence upload
│   ├── hooks/
│   │   └── useCommitments.ts            # Enhanced with mutations
│   ├── services/
│   │   └── commitments.service.ts       # Enhanced CRUD operations
│   ├── routes/
│   │   └── _protected/
│   │       └── commitments.tsx          # Enhanced route
│   └── i18n/
│       ├── en/commitments.json          # Enhanced translations
│       └── ar/commitments.json          # Enhanced translations
└── tests/
    ├── unit/
    └── e2e/

supabase/
├── migrations/
│   └── YYYYMMDDHHMMSS_commitments_v11.sql  # Schema evolution
└── functions/
    └── commitment-upload-evidence/         # File upload Edge Function
```

**Structure Decision**: Web application structure with frontend (React) and Supabase backend. Minimal Express routes - most logic handled directly via Supabase client with RLS.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale |
|----------|-----------|
| Direct Supabase vs API layer | RLS provides security; reduces API surface; matches existing patterns |
| Edge Function for uploads | File handling requires server-side validation; signed URLs need server |
| Status History table | Required for audit trail per FR-024; separate table for query efficiency |
