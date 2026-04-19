---
phase: 28-simple-type-wizards
plan: 04
subsystem: frontend/wizard
tags: [person, wizard, dossier, file-upload, rtl]
dependency_graph:
  requires: [28-01]
  provides: [person-wizard, person-create-route]
  affects: [persons-list-page]
tech_stack:
  added: []
  patterns: [wizard-config, file-upload-with-preview, review-step]
key_files:
  created:
    - frontend/src/components/dossier/wizard/config/person.config.ts
    - frontend/src/components/dossier/wizard/steps/PersonDetailsStep.tsx
    - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
    - frontend/src/routes/_protected/dossiers/persons/create.tsx
  modified:
    - frontend/src/routes/_protected/dossiers/persons/index.tsx
    - frontend/src/routeTree.gen.ts
decisions:
  - Used 'attachments' bucket with 'person-photos' path prefix for photo uploads since no dedicated person-photos bucket exists
  - Upload uses onComplete callback to set photo_url since uploadFile returns uploadId not URL
metrics:
  duration: 224s
  completed: 2026-04-16
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 2
---

# Phase 28 Plan 04: Person Wizard Summary

Person wizard with 3-step flow (Basic Info, Person Details, Review), photo file picker with Supabase Storage upload and thumbnail preview, bilingual title/biography fields.

## Task Results

| Task | Name                                                      | Commit   | Files                                                         |
| ---- | --------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| 1    | Create person config, PersonDetailsStep, PersonReviewStep | 24512dc8 | person.config.ts, PersonDetailsStep.tsx, PersonReviewStep.tsx |
| 2    | Create person wizard route and update list page           | 7e4fcc07 | create.tsx, index.tsx, routeTree.gen.ts                       |

## Implementation Details

### Person Config (person.config.ts)

- 3 steps: basic, person-details, review
- filterExtensionData strips empty strings, preserves person_subtype

### PersonDetailsStep

- Bilingual title fields (free-text Input, not dropdown) per D-02
- Photo file picker with thumbnail preview per D-03: hidden file input triggered by button, immediate blob URL preview, async upload to Supabase Storage via useUploadStore
- Bilingual biography Textarea fields with min-h-[88px]
- RTL support: dir={direction} on Arabic inputs
- Touch-friendly: min-h-11 on all interactive elements

### PersonReviewStep

- 2 ReviewSections: Basic Info (step 0) and Person Details (step 1)
- Photo thumbnail (12x12 rounded) when photo_url is non-empty, fallback to "--" placeholder
- Biography truncated at 120 characters with ellipsis

### Route and Navigation

- Person wizard route at /\_protected/dossiers/persons/create
- TanStack Router route tree regenerated to include new route
- Persons list page Create button updated from /dossiers/create to /dossiers/persons/create (2 instances)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upload store returns uploadId, not URL**

- **Found during:** Task 1
- **Issue:** Plan assumed uploadFile returns a public URL directly, but it returns an uploadId string. The actual URL is delivered via onComplete callback.
- **Fix:** Used onComplete callback in upload options to call form.setValue('photo_url', url)
- **Files modified:** PersonDetailsStep.tsx

**2. [Rule 3 - Blocking] Used 'attachments' bucket instead of 'person-photos'**

- **Found during:** Task 1
- **Issue:** Plan suggested 'person-photos' bucket which may not exist in Supabase Storage
- **Fix:** Used existing 'attachments' bucket with path prefix 'person-photos' for organization
- **Files modified:** PersonDetailsStep.tsx

**3. [Rule 3 - Blocking] Route tree regeneration required**

- **Found during:** Task 2
- **Issue:** New route file caused TS2345 because TanStack Router route tree did not include the new route path
- **Fix:** Ran `npx @tanstack/router-cli generate` to regenerate routeTree.gen.ts
- **Files modified:** routeTree.gen.ts

## Known Stubs

None - all data sources are wired (form fields, upload store, wizard config).

## Self-Check: PASSED
