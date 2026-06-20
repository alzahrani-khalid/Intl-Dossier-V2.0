---
phase: quick-260616-hv6
plan: 01
subsystem: intelligence-ui
tags: [rtl, tailwind-v4, dialog, drawer, tajawal, css, phase-70]
requires:
  - frontend/src/components/ui/dialog.tsx (shared base DialogContent — read-only, untouched)
  - frontend/src/styles/list-pages.css (.dir-* .btn-primary Latin font — read-only, untouched)
provides:
  - 'AlertRuleForm + DigestSubscribeDrawer pin to inline-end edge in RTL (translate cleared)'
  - 'RTL !important Tajawal override for .btn-* variants'
affects:
  - frontend/src/components/intelligence/AlertRuleForm.tsx
  - frontend/src/components/intelligence/DigestSubscribeDrawer.tsx
  - frontend/src/index.css
tech-stack:
  added: []
  patterns:
    - "Tailwind v4 `translate-*` compiles to standalone CSS `translate` property — `transform: 'none'` does NOT clear it; must set `translate: 'none'` explicitly"
    - 'Scoped `!important` to beat `.dir-*` (0,2,0) font-family specificity in RTL'
key-files:
  created: []
  modified:
    - frontend/src/components/intelligence/AlertRuleForm.tsx
    - frontend/src/components/intelligence/DigestSubscribeDrawer.tsx
    - frontend/src/index.css
decisions:
  - "Cleared centering via `translate: 'none'` inline (not by editing shared dialog.tsx) to preserve centering for all other dialogs"
  - "Used `'Tajawal'` literal consistent with the existing Tajawal override block; no new tokens, no list-pages.css change"
metrics:
  duration: '~5 min'
  completed: '2026-06-16'
  tasks_completed: 2
  files_modified: 3
---

# Phase quick-260616-hv6 Plan 01: Fix Phase 70 RTL Drawer Off-Screen + Arabic Button Font Summary

Two surgical RTL fixes for Phase 70 (Digests & Alerts): cleared the Tailwind v4 standalone `translate` property so both drawers pin to the inline-end edge instead of jamming off-screen top-left, and forced Tajawal on `.btn-*` CTA variants in RTL so Arabic glyphs render.

## What Was Done

### Task 1 — Clear Tailwind v4 `translate` on both Phase 70 drawers (Bug 1, QF-HV6-01)

- Added `translate: 'none',` immediately after the existing `transform: 'none',` in the `<DialogContent>` inline `style` object of both `AlertRuleForm.tsx` and `DigestSubscribeDrawer.tsx`.
- Root cause: the shared base `DialogContent` centers via Tailwind v4 `translate-x-[-50%] translate-y-[-50%]`, which compile to the standalone CSS `translate: -50% -50%` property. The drawers' existing `transform: 'none'` cannot clear `translate`, so the panel was shoved (-50%,-50%) of its own size into the top-left corner. Setting `translate: 'none'` neutralizes the centering so the `insetInlineEnd: 0` / full-height edge pinning takes effect.
- Commit: `ee410c4d`

### Task 2 — Force Tajawal on `.btn-*` variants in RTL (Bug 2, QF-HV6-02)

- Added a new rule inside the existing "Arabic typography override: Tajawal" block in `index.css`, immediately after the chip/label `!important` override and before the `.tb-locale-btn` rule:
  `html[dir='rtl'] .btn, .btn-primary, .btn-secondary, .btn-accent, .btn-danger, .btn-ghost { font-family: 'Tajawal', system-ui, sans-serif !important; }`
- Root cause: `.dir-bureau/.dir-situation .btn-primary { font-family: var(--font-body)/var(--font-mono) }` in `list-pages.css` (specificity 0,2,0) beat the universal `html[dir='rtl'] * { font-family:'Tajawal'... }` rule (0,1,1), so primary/accent/danger CTAs rendered in a Latin font (no Arabic glyphs). Outline/ghost buttons set no font-family, so they already inherited Tajawal correctly — which is why only "some" buttons were affected. The `!important` beats the `.dir-*` specificity; `list-pages.css` is left untouched (its Latin font is correct for LTR/English).
- Commit: `00533551`

## Files Modified

| File                                                             | Change                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `frontend/src/components/intelligence/AlertRuleForm.tsx`         | +1 line: `translate: 'none',` after `transform: 'none',`                                  |
| `frontend/src/components/intelligence/DigestSubscribeDrawer.tsx` | +1 line: `translate: 'none',` after `transform: 'none',`                                  |
| `frontend/src/index.css`                                         | +13 lines: RTL `!important` Tajawal rule for `.btn-*` variants (with explanatory comment) |

## Verification

- Gate 1: each drawer contains exactly 1 `translate: 'none'` — PASS
- Gate 2: `html[dir='rtl'] .btn-primary` appears exactly once outside comments in `index.css` — PASS
- Gate 3: combined diff (`ee410c4d^..00533551`) limited to exactly the three named files; `list-pages.css` and `dialog.tsx` NOT in diff — PASS
- Frontend typecheck (`pnpm exec tsc --noEmit`): exit 0 — PASS
- Pre-commit build hook passed for both commits — PASS

Browser/live RTL verification (drawers pin to inline-end edge; CTA buttons compute font-family Tajawal in Arabic) is handled by the orchestrator against the running Vite dev server (:5173 → staging).

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Commits

- `ee410c4d` — fix(quick-260616-hv6): clear Tailwind v4 translate on Phase 70 drawers (RTL off-screen)
- `00533551` — fix(quick-260616-hv6): force Tajawal on .btn-\* variants in RTL (Arabic glyphs)

## Self-Check: PASSED

- SUMMARY.md exists at expected path — FOUND
- Commit `ee410c4d` — FOUND
- Commit `00533551` — FOUND
- All three modified files present on disk — FOUND
