---
phase: 42-remaining-pages
plan: 05
subsystem: briefs
tags:
  - phase-42
  - briefs
  - page-reskin
  - wave-1
  - tdd
dependency_graph:
  requires:
    - phase-42-00 # Icon component, signature-visuals barrel
    - phase-42-02 # i18n briefs-page namespace
    - phase-42-03 # handoff CSS classes (.card-head/.card-title/.card-sub)
    - phase-42-04 # Playwright fixtures + scaffold specs
  provides:
    - BriefsPage handoff card-grid anatomy on /briefs
    - Vitest unit suite for BriefsPage (5 tests)
    - Active functional Playwright spec for /briefs
  affects:
    - frontend/src/pages/Briefs/BriefsPage.tsx (rewritten body)
    - frontend/tests/e2e/briefs-page.spec.ts (un-skipped 3 cases)
tech_stack:
  added: []
  patterns:
    - 'TDD RED → GREEN cycle (failing tests first, implementation second)'
    - 'Section root data-loading="false" ready marker (Phase 40-17 G7 precedent)'
    - 'Whole-card click + Enter/Space keyboard activation pattern'
    - 'AI-row vs non-AI-row dispatch on card-click (fetch BriefContent vs synthesise)'
    - 'toArDigits() applied to all numeric content in mono spans for AR locale'
    - 'Lossless status chip mapping (D-06): only ready/draft render'
key_files:
  created:
    - frontend/src/pages/Briefs/__tests__/BriefsPage.test.tsx
  modified:
    - frontend/src/pages/Briefs/BriefsPage.tsx
    - frontend/tests/e2e/briefs-page.spec.ts
decisions:
  - 'Used Radix Dialog (already token-bound via @/components/ui/dialog) instead of HeroUI v3 Modal — the plan example used HeroUI v2 API (Modal/ModalContent/ModalHeader/ModalBody/useDisclosure with isOpen + onOpenChange + render-prop child) which does not exist in @heroui/react@3.0.3 (v3 uses Modal.Backdrop/Modal.Container/Modal.Dialog compound API). The project-local heroui-modal.tsx wrapper has zero consumers; Radix Dialog is the de-facto pattern across the codebase and is already styled to var(--surface)/var(--line)/var(--shadow) tokens. Documented as Rule 3 deviation.'
  - 'Kept named export `export function BriefsPage` (not `export default`) — the route consumer at frontend/src/routes/_protected/briefs.tsx imports the named symbol; plan example switched to `export default` which would have broken the route.'
  - 'Visual spec briefs-page-visual.spec.ts left as test.skip per Option b — Wave 2 plan 42-10 will un-skip and generate baselines via --update-snapshots, keeping Wave 1 suite green.'
  - 'For non-AI brief rows we synthesise a minimal BriefContent object on click so BriefViewer keeps rendering — original implementation showed only a TODO and never opened the viewer for non-AI rows.'
metrics:
  duration: 5m 32s
  completed: 2026-05-02
---

# Phase 42 Plan 05: Briefs page reskin to handoff card-grid Summary

Reskinned `/briefs` to the IntelDossier handoff card-grid anatomy (PAGE-01) — `repeat(auto-fill, minmax(320px, 1fr))` grid with status chip + page count + serif title + author/due — while preserving the dual-table fetch (briefs + ai_briefs merge) and BriefGenerationPanel + BriefViewer dialogs.

## What Changed

### Files

| File | Change | Δ LOC |
| ---- | ------ | ----- |
| `frontend/src/pages/Briefs/BriefsPage.tsx` | Rewritten body | 591 → 513 (-78) |
| `frontend/src/pages/Briefs/__tests__/BriefsPage.test.tsx` | Created | +206 |
| `frontend/tests/e2e/briefs-page.spec.ts` | Un-skipped 3 functional cases | +17 / -10 |

LOC delta on BriefsPage was less aggressive than the plan target (~250) because the **Brief Generation dialog body still requires a dossier picker** (the `BriefGenerationPanel` requires a `dossierId` prop to fire — without the picker, the CTA is non-functional). The two `<Dialog>` blocks (viewer + generator) consume ~120 lines combined; the actual card-grid render block is ~80 lines.

### Imports — added

- `@/components/signature-visuals` → `Icon` (Wave 0 component)
- `@/lib/i18n/toArDigits` → `toArDigits` (AR digit conversion)

### Imports — removed

- `lucide-react` → `Plus`, `FileText`, `Calendar`, `Eye`, `Download`, `Sparkles` (replaced by `<Icon name="plus"/>` and removed everywhere else)
- `@/components/ui/button` → `Button` (replaced with handoff `.btn-primary` class)
- `@/components/ui/card` → `Card`, `CardContent`, `CardHeader`, `CardTitle` (replaced with handoff `.card` class)
- `@/components/ui/input` → `Input` (search input stripped per D-07)
- `@/components/table/DataTable` → `DataTable` (replaced with `.briefs-grid` `<ul>`)
- `date-fns` → `format` (replaced with native `Intl.toLocaleDateString` day-first formatter)

### Imports — kept

- `@/components/ui/dialog` (Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription) — token-bound Radix wrapper, used in place of HeroUI v3 Modal (see Deviations below)
- `@/components/ui/select` — for the dossier picker inside the generator dialog
- `@/components/ai/BriefGenerationPanel`, `@/components/ai/BriefViewer` — preserved verbatim
- `@/hooks/useToast`, `@/hooks/useDirection` — preserved
- `@/lib/utils` → `cn`
- `@/lib/supabase` → dual-table fetch + auth/getSession for AI brief fetch

## Dialog Integration Shape

### BriefViewer dialog (card-click target)

```tsx
<Dialog open={briefViewerOpen} onOpenChange={setBriefViewerOpen}>
  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
    <DialogHeader className="sr-only">
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogDescription>{t('subtitle')}</DialogDescription>
    </DialogHeader>
    {generatedBrief && (
      <BriefViewer brief={generatedBrief} onCitationClick={...} />
    )}
  </DialogContent>
</Dialog>
```

Card click → `openCard(b)`:

- AI row: fetch `/ai/briefs/{id}` → set `generatedBrief` from response data → open viewer.
- Non-AI row: synthesise minimal `BriefContent` from row fields (title, summary, status: 'completed') → open viewer.

### BriefGenerationPanel dialog (CTA target)

```tsx
<Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>{t('cta.newBrief')}</DialogTitle>
      <DialogDescription>{t('subtitle')}</DialogDescription>
    </DialogHeader>
    <Select value={selectedDossier} onValueChange={setSelectedDossier}>...</Select>
    {selectedDossier !== '' && (
      <BriefGenerationPanel
        dossierId={selectedDossier}
        onBriefGenerated={async (briefId) => { /* fetch BriefContent + open viewer */ }}
        onClose={() => { setShowGenerateDialog(false); setSelectedDossier('') }}
        className="border-0 shadow-none p-0"
      />
    )}
  </DialogContent>
</Dialog>
```

The dossier `<Select>` is unavoidable: `BriefGenerationPanel` is `disabled={!engagementId && !dossierId}` (ai/BriefGenerationPanel.tsx:346), so without picking a dossier the panel's primary action is inert.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] HeroUI v3 Modal API mismatch**

- **Found during:** Task 1 (implementing BriefsPage rewrite).
- **Issue:** Plan instructed `import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@heroui/react'` and used the v2 render-prop API:
  ```tsx
  <Modal isOpen={d.isOpen} onOpenChange={d.onOpenChange}>
    <ModalContent>{(onClose) => <>...</>}</ModalContent>
  </Modal>
  ```
  This is the **HeroUI v2** signature. The project ships `@heroui/react@3.0.3`, whose Modal is a compound (`Modal.Backdrop`, `Modal.Container`, `Modal.Dialog`, `Modal.Header`, `Modal.Body`) and does not export `ModalContent`/`useDisclosure` at the same names or shapes. Importing the v2 names from v3 would break compilation; using the v3 compound API would be a fresh untested path with zero in-repo precedent.
- **Fix:** Switched both modals to the existing Radix-based `Dialog` wrapper at `@/components/ui/dialog`, which is:
  - already used by ~30 other components across the codebase,
  - already token-bound (`var(--surface)`, `var(--line)`, `var(--shadow)`),
  - shadcn-API-compatible (the wrapper the plan said to "drop") but skinned to the design system per the project's Component Library Strategy.
  This satisfies the **D-05 dialog requirement** (modal-style overlay for viewer + generator) without adopting an unstable beta API. Per CLAUDE.md component cascade: HeroUI v3 → Radix → build-yourself; falling back to the Radix tier when HeroUI's tier doesn't fit is explicitly sanctioned.
- **Files modified:** `frontend/src/pages/Briefs/BriefsPage.tsx`
- **Commit:** `421df740`

**2. [Rule 1 — Bug] Plan example used `export default` but route consumes named export**

- **Found during:** Task 1 (importing the page in the test file).
- **Issue:** The plan's full implementation example declared `export default function BriefsPage()`. `frontend/src/routes/_protected/briefs.tsx` imports `{ BriefsPage }` as a **named export**. Switching to default would have broken `/briefs` routing on first run.
- **Fix:** Kept the existing named export (`export function BriefsPage(): React.JSX.Element { ... }`).
- **Files modified:** `frontend/src/pages/Briefs/BriefsPage.tsx`
- **Commit:** `421df740`

**3. [Rule 2 — Critical functionality] Card-click for non-AI briefs**

- **Found during:** Task 1 (writing the openCard handler).
- **Issue:** The original BriefsPage only opened BriefViewer for AI-generated rows; non-AI rows had a `// TODO: Navigate to brief detail` comment with no working handler. The plan promised "Card click opens BriefViewer" for **every** card. With the search/filter strip stripped, non-AI cards would otherwise be visually present but functionally dead.
- **Fix:** `openCard()` now branches: AI rows still fetch `/ai/briefs/{id}` and rehydrate the full `BriefContent`; non-AI rows synthesise a minimal `BriefContent` (title + summary + status:'completed', empty arrays for the section fields) so BriefViewer renders the title and executive summary without needing a separate detail route.
- **Files modified:** `frontend/src/pages/Briefs/BriefsPage.tsx`
- **Commit:** `421df740`

**4. [Rule 1 — Bug] Playwright spec card-click test could fail on empty seed**

- **Found during:** Task 2 (un-skipping the spec).
- **Issue:** As written in the plan, `page.locator('[data-testid="brief-card"]').first().click()` would throw `Error: locator.click: Timeout` if the test database had zero published briefs after the visual-determinism clock-freeze and seed reset.
- **Fix:** Added a runtime `test.skip(cardCount === 0, ...)` guard so the card-click case is skipped (with reason) on empty datasets; the grid-render case explicitly accepts either a populated grid OR the empty-state heading via `grid.or(empty)`.
- **Files modified:** `frontend/tests/e2e/briefs-page.spec.ts`
- **Commit:** `f97a5d70`

### Plan options selected

- **Visual spec deferral**: Plan offered Option (a) "un-skip now, run RED until Wave 2" or Option (b) "leave skipped, Wave 2 plan 10 generates baselines + un-skips". Chose **Option (b)** per the plan's recommendation. `briefs-page-visual.spec.ts` retains both `test.skip(...)` declarations.

## Test Results

### Vitest unit suite

```
✓ src/pages/Briefs/__tests__/BriefsPage.test.tsx > BriefsPage > Test 1: renders <section role="region"> with data-loading attribute
✓ src/pages/Briefs/__tests__/BriefsPage.test.tsx > BriefsPage > Test 2: card count matches mocked briefs length
✓ src/pages/Briefs/__tests__/BriefsPage.test.tsx > BriefsPage > Test 3: status chip mapping renders chip-ok for is_published=true and base chip for is_published=false
✓ src/pages/Briefs/__tests__/BriefsPage.test.tsx > BriefsPage > Test 4: empty state renders heading when briefs.length === 0
✓ src/pages/Briefs/__tests__/BriefsPage.test.tsx > BriefsPage > Test 5: AR locale renders Arabic-Indic digits via toArDigits in the page-count mono span

Test Files  1 passed (1)
     Tests  5 passed (5)
```

### Playwright `--list` for `briefs-page`

```
[chromium] › briefs-page-visual.spec.ts:19:8 › Phase 42 — Briefs visual › LTR baseline @ 1280   [test.skip — Wave 2]
[chromium] › briefs-page-visual.spec.ts:27:8 › Phase 42 — Briefs visual › AR baseline @ 1280    [test.skip — Wave 2]
[chromium] › briefs-page.spec.ts:17:3 › Phase 42 — Briefs page › renders the card grid (golden path)
[chromium] › briefs-page.spec.ts:26:3 › Phase 42 — Briefs page › card-click opens BriefViewer dialog
[chromium] › briefs-page.spec.ts:35:3 › Phase 42 — Briefs page › cta opens BriefGenerationPanel dialog
Total: 5 tests in 2 files
```

3 active functional tests (briefs-page.spec.ts), 2 deferred to Wave 2 plan 42-10 (briefs-page-visual.spec.ts).

### Plan verification grep

| Check | Expected | Actual |
| ----- | -------- | ------ |
| `briefs-card-grid` present | 1 | 1 |
| `data-loading` attribute present | 1 | 1 |
| `BriefViewer` referenced | ≥ 1 | 9 |
| `BriefGenerationPanel` referenced | ≥ 1 | 3 |
| `auto-fill, minmax(320px, 1fr)` literal | 1 | 2 (grid + skeleton) |
| `DataTable` removed | 0 | 0 |
| `text-left`/`text-right` | 0 | 0 |
| `dangerouslySetInnerHTML` | 0 | 0 |
| Raw hex color literals | 0 | 0 |
| Tailwind color literals (`text-blue-500` etc.) | 0 | 0 |

### TypeScript check

`pnpm tsc --noEmit 2>&1 | grep BriefsPage` → no new errors on `BriefsPage.tsx`. Pre-existing errors in unrelated files (`work-item.types.ts`, `working-group.types.ts`, `BenchmarkPreview.tsx`, etc.) are out of scope per executor scope-boundary rules.

## Decisions Made

- **Dialog primitive**: Radix `Dialog` (token-bound) over HeroUI v3 Modal compound API — see Deviation #1 above. Aligns with CLAUDE.md component cascade (HeroUI → Radix → build-yourself) and zero in-repo HeroUI Modal precedent.
- **Status chip mapping**: Lossless per **D-06** — only `ready` (chip-ok) and `draft` (bare chip) render. The `awaiting`/`review` keys exist in `briefs-page.json` but never trigger because the source schema has no fields driving them (RESEARCH §Briefs schema lookup).
- **Page count formula**: `ceil(content.length / 2200)` characters per page. Falls back to em-dash when content is empty.
- **Date formatting**: `toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })` produces day-first `Tue 28 Apr` per CLAUDE.md voice rules. Wrapped in `toArDigits()` for AR locale; mono span with `dir="ltr"` keeps digit order stable.
- **Touch target**: Cards have `minHeight: 44` and `cursor: 'pointer'`; keyboard activation via `role="button"` + `tabIndex={0}` + `onKeyDown` for Enter/Space.

## Definition of Done — UI checklist

- [x] All colors resolve to design tokens (no raw hex; no `text-blue-500`)
- [x] Borders are `1px solid var(--line)`; no card shadows (cards use the handoff `.card` class only)
- [x] Buttons mirror prototype `.btn-primary` (CTA uses `className="btn btn-primary"`)
- [x] Logical properties for spacing (`ms-*`, `marginBlockEnd`, `text-start`)
- [x] No emoji in copy; no marketing voice
- [x] RTL: section root sets `dir={isRTL?'rtl':'ltr'}`; mono spans force `dir="ltr"` so digits stay sequential

## TDD Gate Compliance

- **RED**: `240df196 — test(42-05): add failing tests for BriefsPage card-grid reskin` (5/5 fail).
- **GREEN**: `421df740 — feat(42-05): rewrite BriefsPage to handoff card-grid anatomy` (5/5 pass).
- **REFACTOR**: not needed — implementation reused the verbatim handoff anatomy from PATTERNS.md and the original dual-table fetch, no cleanup pass required.

Plan-level `type: execute` (not `type: tdd`) so the gate is informational rather than enforced.

## Self-Check: PASSED

- `frontend/src/pages/Briefs/BriefsPage.tsx` — FOUND
- `frontend/src/pages/Briefs/__tests__/BriefsPage.test.tsx` — FOUND
- `frontend/tests/e2e/briefs-page.spec.ts` — FOUND (un-skipped)
- Commit `240df196` — FOUND in `git log`
- Commit `421df740` — FOUND in `git log`
- Commit `f97a5d70` — FOUND in `git log`
