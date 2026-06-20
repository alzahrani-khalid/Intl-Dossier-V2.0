---
quick: 260616-l4e
title: Fix remaining Phase 70 UI-review findings (Digests & Alerts)
subsystem: frontend/intelligence
tags: [phase-70, digests, alerts, design-tokens, rtl, a11y, i18n]
requirements: [DIGEST-01, DIGEST-02, ALERT-01]
provides:
  - per-dossier Digests tab (D-12 entry-point contract)
  - intelligence hub .tab accent-underline tab strip
  - 720px HITL Generate-digest drawer with period picker
  - design-token typography/spacing/color compliance across P70 components
  - DigestReader unsubscribe link + bilingual dialog close + specific edit label
key-files:
  modified:
    - frontend/src/components/dossier/DossierTabNav.tsx
    - frontend/src/i18n/en/dossier-shell.json
    - frontend/src/i18n/ar/dossier-shell.json
    - frontend/src/pages/intelligence/IntelligencePage.tsx
    - frontend/src/components/intelligence/GenerateDigestButton.tsx
    - frontend/src/i18n/en/intelligence-digests.json
    - frontend/src/i18n/ar/intelligence-digests.json
    - frontend/src/components/intelligence/DigestsTab.tsx
    - frontend/src/components/intelligence/DigestSubscribeDrawer.tsx
    - frontend/src/components/intelligence/DigestCard.tsx
    - frontend/src/components/intelligence/DigestReader.tsx
    - frontend/src/components/intelligence/AlertsTab.tsx
    - frontend/src/components/intelligence/AlertRuleForm.tsx
    - frontend/src/components/intelligence/AlertRuleRow.tsx
    - frontend/src/i18n/en/intelligence-alerts.json
    - frontend/src/i18n/ar/intelligence-alerts.json
    - frontend/src/components/ui/dialog.tsx
metrics:
  tasks: 5
  files: 17
  commits: 5
  completed: 2026-06-16
---

# Quick 260616-l4e: Fix remaining Phase 70 UI-review findings Summary

Closed the remaining 8 open findings from `70-UI-REVIEW.md` for Phase 70 (Digests &
Alerts): per-dossier Digests tab entry point (D-12), hub tab-strip migration to the
design-system `.tab` accent-underline pattern, a full 720px end-edge HITL "Generate
digest" drawer rebuild with a Daily/Weekly/Monthly period picker, a design-token /
spacing / color compliance sweep across the 8 P70 components, and three smaller
spec/a11y gaps (DigestReader unsubscribe link, specific alert edit label, bilingual
dialog close). Typecheck stays at 0 errors and EN+AR keys exist for every new label.

## Tasks Completed

### Task 1 — Per-dossier Digests tab (closes D-12 blocker) — `c44ffc47`

- Added `{ key: 'digests', labelKey: 'tabs.digests', path: 'digests' }` to
  `BASE_DOSSIER_TABS` immediately after `signals`. The per-dossier `/digests` child
  routes already exist on all 8 types (7 dossier types + engagements, verified on
  disk), so they are now reachable from every dossier shell — satisfying the CONTEXT
  D-12 "entry point = from the dossier" contract.
- Added `tabs.digests` → "Digests" (EN) / "الملخصات" (AR) in `dossier-shell`.
- No hub dossier-picker added (hub `DigestsTab` stays read-only per D-12, by design).

### Task 2 — Hub tab strip → `.tab` accent-underline pattern — `1e347e63`

- Replaced the 4 filled `<Button variant={activeTab===...?'default':'outline'}>`
  toggles with stateful `<button role="tab">` elements inside a
  `<nav role="tablist" className="tabs mb-4">`, using the design-system `.tab` /
  `.tab.active` classes from `list-pages.css` (globally imported via `main.tsx`).
- Imported `cn` from `@/lib/utils`. Zero `variant={activeTab` toggles remain.
- The pre-P70 Reports-section dashboard cards/KPIs below were left untouched (explicit
  out-of-scope).

### Task 3 — HITL "Generate digest" 720px drawer rebuild — `5d825967`

- Rebuilt `GenerateDigestButton` from an inline 520px card into a 720px end-edge
  drawer on the corrected `DialogContent` pattern with BOTH `transform: 'none'` AND
  `translate: 'none'` (the off-screen bug guard fixed in 260616-hv6) plus
  `width: 'min(100vw, 720px)'`, `height: '100dvh'`, inset-inline/block 0, and
  `boxShadow: var(--shadow-lg)`.
- Props unchanged (`dossierId`, `period`); `period` is now the picker's INITIAL value.
  Local `pickedPeriod` state drives a Daily/Weekly/Monthly `role="radiogroup"`.
- `generate_digest` (preview) and `publish_digest` (publish) now pass
  `p_period: pickedPeriod`. Preserved `countPreviewItems`, the 3-cell
  `--t-kpi-value` rollup grid, the `preview.banner` warning, both `role="alert"`
  error banners, `useQueryClient` + `digestKeys.all` invalidation, and
  `renderSummaryText` / `p_clearance_level_at_generation`.
- Token typography only (`--t-body` / `--t-meta`), `pt-1`/`pb-1` padding.
- Added `picker.step1` / `picker.generatePreview` keys in EN + AR.

### Task 4 — Design-token / spacing / color sweep (7 components) — `c44884e8`

- Across `DigestsTab`, `DigestSubscribeDrawer`, `AlertRuleForm`, `AlertsTab`,
  `DigestReader`, `AlertRuleRow`, `DigestCard`: `text-sm` →
  `[font-size:var(--t-body)]`, `text-xs` → `[font-size:var(--t-meta)]` (font-size
  classes only; `font-mono`/`text-ink`/`text-danger` etc. untouched).
- `pt-0.5`/`pb-0.5` → `pt-1`/`pb-1` (min 4px badge padding).
- `DigestReader` severity badge `text-warning` → `text-[var(--warn)]`.
- `DigestCard` `SEVERITY_CLASSES` normalized to consistent wrapped-var form for all
  four severities: urgent/high → `text-[var(--danger)]`, medium → `text-[var(--warn)]`,
  low → `text-[var(--ok)]`.

### Task 5 — Unsubscribe link + edit label + bilingual dialog close — `2fac4343`

- `DigestReader`: imported `useUnsubscribeFromDigest`, added an end-aligned
  (`ms-auto`) ghost-link `Button` in the footer wired to
  `unsubscribe.mutate({ dossierId: digest.dossier_id })`.
- `intelligence-alerts` `action.save`: "Save" → "Save changes" / "حفظ التغييرات"
  (`AlertRuleForm` already renders `t('action.save')` in edit mode — no component change).
- `dialog.tsx`: added `useTranslation('common')` inside the `DialogContent` forwardRef
  body; the close button now has a bilingual `aria-label` and sr-only text via
  `t('common.close', { defaultValue: 'Close' })`. Positioning/centering classes and
  all other behavior left untouched, so the 100+ other dialog consumers are unaffected.

## Deviations from Plan

None functional. One stylistic note: in `dialog.tsx` I briefly extracted the close
label to a `closeLabel` const, then inlined the `t('common.close', ...)` calls in both
the `aria-label` and the sr-only span to match the plan's literal verify string and
intent. End state is exactly as specified.

The Prettier/lint PostToolUse hook reflowed long JSX attribute lines in
`GenerateDigestButton.tsx`; content is unchanged.

## Verification

- `pnpm exec tsc --noEmit -p tsconfig.json`: **0 errors** (full repo — confirms no
  regression across the 100+ dialog consumers and the 3 GenerateDigestButton call sites).
- i18n parity gate: all 6 touched JSON files parse; `tabs.digests`, `picker.*` (EN+AR)
  present; `action.save` = "Save changes" / "حفظ التغييرات". **PASS**
- Design-rule grep gate over all 8 P70 components: no `text-sm`/`text-xs`/`pt-0.5`/
  `pb-0.5`/`text-warning`, no raw hex, no Tailwind color literals. **PASS**
- Per-task automated `<verify>` checks: all PASS.

Browser re-verification (1024px / 1400px + RTL on :5173) is the orchestrator's job.

## Known Stubs

None.

## Self-Check: PASSED

- All 5 listed key files exist on disk.
- All 5 task commits (`c44ffc47`, `1e347e63`, `5d825967`, `c44884e8`, `2fac4343`)
  exist in git history.
