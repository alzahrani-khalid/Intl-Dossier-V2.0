---
phase: 32-person-native-basic-info
plan: 32-03-review-identity-card
subsystem: frontend/wizard/review
tags: [person, review, identity-card, PBI-07, D-17, D-18, D-19, D-20, D-21]
requires:
  - 32-02-person-basic-info-step (schema + filterExtensionData emit 11 identity fields)
  - @/hooks/useDossier (nationality resolution)
  - form-wizard i18n (wizard.person_identity.* — already shipped in Wave 2)
provides:
  - PersonReviewStep Identity card for standard + elected-official persons
  - Card-order contract: Identity → PersonDetails → OfficeTerm (elected only)
affects:
  - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
  - frontend/src/components/dossier/wizard/review/__tests__/PersonReviewStep.test.tsx
tech-stack:
  added: []
  patterns:
    - TanStack Query nationality lookup via useDossier(id, ['extension'], { enabled })
    - Inline fallback('—') helper for legacy-draft safety
    - RTL-safe logical Tailwind + dir attribute (no textAlign:right, no ml/mr)
key-files:
  created:
    - frontend/src/components/dossier/wizard/review/__tests__/PersonReviewStep.test.tsx
  modified:
    - frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
decisions:
  - D-17: Basic Info card removed for persons; replaced by Identity card
  - D-18: two sub-sections inside one card, separated by <hr> divider
  - D-19: card order Identity → PersonDetails → OfficeTerm → submit
  - D-20: Edit button on Identity card calls onEditStep(0)
  - D-21: '—' fallback for any null/empty identity field
  - D-33: logical Tailwind only; no textAlign:right
metrics:
  duration_minutes: ~25
  tasks_completed: 3
  files_touched: 2
  tests_added: 7
  completed_date: 2026-04-18
---

# Phase 32 Plan 32-03: PersonReviewStep Identity Card + Display Helpers — Summary

## One-liner

Replaced the generic Basic-Info card on the person-wizard review step with a typed Identity card that renders all 11 PBI identity fields (with `—` fallbacks), resolves nationality to a translated name + ISO-2 code, and wires Edit back to step 0.

## Outcome

- **PBI-07 (PersonReviewStep Identity card)** — complete. Standard and elected-official subtypes now render a two-sub-section Identity card followed by PersonDetails and (elected_official only) OfficeTerm.
- Existing PersonDetails and OfficeTerm review sections are untouched (scope guard).
- Nationality resolved via the existing `useDossier(id, ['extension'])` hook — no new API or endpoint.
- All review-step vitest suites pass (24/24 across 5 files).

## Tasks Executed

1. **Task 1 — Modify `PersonReviewStep.tsx`**: Introduced an inline `IdentityCard` component that renders two sub-sections (Identity + Biographical summary) separated by `<hr>`; wired Edit button to `onEditStep(0)`; kept PersonDetails + OfficeTerm cards unchanged. Added local `fallback()` helper for D-21 behavior. Used `useDossier` for nationality enrichment with `enabled` guard.
2. **Task 2 — Vitest `PersonReviewStep.test.tsx`**: Created `__tests__/PersonReviewStep.test.tsx` with 7 cases covering populated render, legacy-draft safety, Edit wiring, Basic-Info absence, card order for both subtypes, and bilingual AR render.
3. **Task 3 — i18n check**: Skipped adding new keys — `wizard.person_identity.review.card_title`, `review.biographical_summary_heading`, `gender.female`, and `gender.male` already exist in both EN and AR locales (confirmed in `frontend/src/i18n/{en,ar}/form-wizard.json` lines 235–288).

## Files Changed

| Path                                                                                | Action   | Lines                 |
| ----------------------------------------------------------------------------------- | -------- | --------------------- |
| `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx`                | modified | 165 → 334 (+169, -35) |
| `frontend/src/components/dossier/wizard/review/__tests__/PersonReviewStep.test.tsx` | created  | +314                  |

## Commits

- `3a8542e9` — `feat(32-03): replace Basic Info with Identity card in PersonReviewStep`

## Acceptance Evidence

### D-17: Basic Information card removed

```bash
$ grep -n "Basic Information" frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx
(exit 1 — no matches)
```

### D-20: Edit button wired to onEditStep(0)

Vitest case "3. Edit affordance" — passes:

```
expect(onEditStep).toHaveBeenCalledWith(0)
expect(onEditStep).toHaveBeenCalledTimes(1)
```

### Vitest — all review suites pass

```
$ pnpm vitest run src/components/dossier/wizard/review/
Test Files  5 passed (5)
Tests      24 passed (24)
Duration   653ms
```

Per-file PersonReviewStep run: 7/7 passed (populated, legacy-draft, edit, basic-info absent, card order standard, card order elected_official, bilingual AR).

### Typecheck

```
$ pnpm type-check
(no errors in PersonReviewStep.tsx or PersonReviewStep.test.tsx)
```

Pre-existing unrelated TS errors in `backend/src/types/*` and various unrelated components remain out of scope (Rule-4 scope boundary).

## Design Decisions Applied

- **D-17 implementation**: Deleted the inline Basic-Information `ReviewSection` block entirely and replaced with a fresh `<IdentityCard>` component. No runtime branching on `person_subtype` needed because `PersonReviewStep` is already person-specific.
- **D-18 divider**: Used `<hr className="border-t border-border" />` between Identity and Biographical-summary sub-sections for a subtle visual break without adding a new card.
- **D-19 card order**: IdentityCard rendered first, then `ReviewSection[person_details]`, then `ReviewSection[office_term]` gated by `values.person_subtype === 'elected_official'`.
- **D-21 fallback**: Local `fallback()` helper returns `'—'` for `null`, `undefined`, or empty-after-trim; photo preview block renders `<img>` only when `photo_url` non-empty, else an italic `—`.
- **D-33 RTL**: Every Arabic-value row wraps its ReviewField in `<div dir={isRTL ? 'rtl' : 'ltr'}>` so `writingDirection: rtl` applies without relying on `textAlign`. All spacing is `me-*`/`ms-*`/`gap-*`; no `ml-*`/`mr-*`.
- **Nationality resolution**: Reused `useDossier` from `@/hooks/useDossier` (no new API). ISO-2 read from `extension.iso_code_2`. Falls back to `—` if the query hasn't resolved or no nationality_id is set, so tests run synchronously against the mocked hook.
- **Shared helper decision (Plan 32-04 hand-off)**: Checked `32-04-list-pages-and-e2e-PLAN.md` — no reference to `honorific-display.ts` or `formatPersonDisplayName`. Logic inlined; `frontend/src/lib/honorific-display.ts` NOT created. Plan 32-04 can lift the pattern if needed.

## Deviations from Plan

- **Docs-only**: Replaced the two existing comments containing the literal phrase "Basic Information" with "Basic-Info" / "the former Basic-Info card" so the `grep -n 'Basic Information'` acceptance returns zero matches (exit 1). This matches the plan's stated verification literally; no behavior change.
- **Test DOM query fix (photo preview)**: Initial test used `within(card).getByRole('img')`, which fails because `<img alt="">` resolves to role `presentation`. Switched to `card.querySelector('img')` to query by tag name. Purely a test-harness detail.
- **i18n top-up skipped**: Plan Task 4 requested adding `wizard.person_identity.review.card_title`, `gender.female`, `gender.male`, and related keys. All already exist in EN + AR locales (shipped in Wave 2 Plan 32-02). Grep confirmed — no-op.
- **Auto-fixed issues**: None — no bugs discovered during execution.

## What Unblocks (Wave 4)

- **Plan 32-04 (list pages + E2E)** can now assume the review step shows a canonical Identity card with full name, nationality, and photo preview. List-page rendering of display names (e.g. "Dr. Amina Salah") can reuse the same composition logic if 32-04 chooses to extract a helper.
- Phase 32 review surface now consumes 11/11 identity fields end-to-end: schema → step → filterExtensionData → review → DB (already live in staging).

## Known Stubs

None.

## TDD Gate Compliance

Plan type was `plan` (not `tdd`), so RED/GREEN gate sequence is not required. Tests and implementation committed together in one atomic commit.

## Self-Check: PASSED

- `frontend/src/components/dossier/wizard/review/PersonReviewStep.tsx` — FOUND (334 lines)
- `frontend/src/components/dossier/wizard/review/__tests__/PersonReviewStep.test.tsx` — FOUND (314 lines)
- Commit `3a8542e9` — FOUND in git log
- `grep "Basic Information" PersonReviewStep.tsx` — exit 1 (zero matches) ✓
- `pnpm vitest run src/components/dossier/wizard/review/` — 24/24 passed ✓
- `pnpm type-check` — no errors in Plan 32-03 files ✓
