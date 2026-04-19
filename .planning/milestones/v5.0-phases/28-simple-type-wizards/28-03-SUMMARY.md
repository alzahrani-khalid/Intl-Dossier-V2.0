---
phase: 28-simple-type-wizards
plan: 03
subsystem: frontend/wizard
tags: [wizard, topic, dossier-creation]
dependency_graph:
  requires: [28-01]
  provides: [topic-wizard]
  affects: [topics-list-page]
tech_stack:
  added: []
  patterns: [2-step-wizard, inline-extension-field, fragment-composition]
key_files:
  created:
    - frontend/src/components/dossier/wizard/config/topic.config.ts
    - frontend/src/components/dossier/wizard/steps/TopicBasicInfoStep.tsx
    - frontend/src/components/dossier/wizard/review/TopicReviewStep.tsx
    - frontend/src/routes/_protected/dossiers/topics/create.tsx
  modified:
    - frontend/src/routes/_protected/dossiers/topics/index.tsx
decisions:
  - Topic wizard uses 2 steps (basic + review) with theme_category inline in basic step
  - Single ReviewSection in review step since only 1 editable step exists
metrics:
  duration: 114s
  completed: 2026-04-16
---

# Phase 28 Plan 03: Topic Wizard Summary

2-step topic creation wizard with inline theme_category dropdown using fragment composition pattern

## Tasks Completed

| Task | Name                                                         | Commit   | Key Files                                                    |
| ---- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| 1    | Create topic config, TopicBasicInfoStep, and TopicReviewStep | 1f15aaa9 | topic.config.ts, TopicBasicInfoStep.tsx, TopicReviewStep.tsx |
| 2    | Create topic wizard route and update list page Create button | 353f2808 | topics/create.tsx, topics/index.tsx                          |

## Implementation Details

### Topic Config (topic.config.ts)

- 2-step wizard: basic + review (simplest wizard per D-08)
- filterExtensionData passes theme_category to API

### TopicBasicInfoStep

- Fragment composition: SharedBasicInfoStep + theme_category Select below it
- SharedBasicInfoStep renders its own FormWizardStep internally
- theme_category is a single-select with 4 options (policy, technical, strategic, operational)

### TopicReviewStep

- Single ReviewSection combining basic info + topic details
- onEdit navigates to step 0 (the only editable step)
- theme_category displayed with translated label (Pitfall 5 covered)

### Route and List Page

- topics/create.tsx follows countries/create.tsx pattern with 2 children in CreateWizardShell
- topics/index.tsx Create buttons updated from /dossiers/create to /dossiers/topics/create

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation: No frontend errors (pre-existing backend-only errors unrelated)
- topic.config.ts exports topicWizardConfig with 2 steps (basic + review)
- TopicBasicInfoStep wraps SharedBasicInfoStep with inline theme_category
- TopicReviewStep includes theme_category in review display
- Topics list page Create buttons link to /dossiers/topics/create

## Self-Check: PASSED

All 4 created files found on disk. Both commit hashes (1f15aaa9, 353f2808) verified in git log.
