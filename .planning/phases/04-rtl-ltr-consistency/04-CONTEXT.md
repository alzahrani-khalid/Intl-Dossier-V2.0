# Phase 4: RTL/LTR Consistency - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Arabic and English users experience correct, glitch-free layouts in all theme and direction combinations. Single DirectionProvider at document root controls `dir` — no per-component `dir` attributes. Zero physical CSS properties anywhere. Dark/light + AR/EN switching produces no visual bugs or layout shifts. React Flow, Recharts, DnD-kit, TanStack Table render correctly in RTL. Reusable RTL-aware patterns extracted — no duplicate direction logic.

</domain>

<decisions>
## Implementation Decisions

### DirectionProvider architecture

- **D-01:** Enhance existing `RTLWrapper` (at `frontend/src/components/rtl-wrapper/RTLWrapper.tsx`) to include a `DirectionContext` via `createContext<'rtl' | 'ltr'>('ltr')`
- **D-02:** Export a `useDirection()` hook that reads from `DirectionContext` — replaces all scattered `isRTL = i18n.language === 'ar'` patterns (~10 components)
- **D-03:** RTLWrapper sets `dir` on `document.documentElement` and `document.body` via `useEffect` — single source of truth
- **D-04:** Remove ALL per-component `dir={isRTL ? 'rtl' : 'ltr'}` attributes (13+ components including IntakeForm, PDFGeneratorButton, VersionComparison, bottom-sheet, slider, enhanced-progress)

### LTR content in RTL context

- **D-05:** Use CSS `unicode-bidi: isolate` or `dir="auto"` on individual text spans for inherently LTR content (email addresses, phone numbers, URLs, code snippets) — no wrapper component, no hook override
- **D-06:** Tailwind utility `[unicode-bidi:isolate]` for inline use; `dir="auto"` on `<span>` elements for mixed-direction text

### Physical CSS migration

- **D-07:** Replace all physical CSS properties with logical equivalents across 32 files. Mapping: `ml-*` → `ms-*`, `mr-*` → `me-*`, `pl-*` → `ps-*`, `pr-*` → `pe-*`, `text-left` → `text-start`, `text-right` → `text-end`, `left-*` → `start-*`, `right-*` → `end-*`, `rounded-l-*` → `rounded-s-*`, `rounded-r-*` → `rounded-e-*`
- **D-08:** Primary targets are `components/ui/` (16 files from shadcn/Aceternity imports) and `components/relationships/AdvancedGraphVisualization.tsx`

### Third-party library RTL handling

- **D-09:** React Flow, Recharts, DnD-kit, TanStack Table currently have zero RTL configuration — each needs per-library investigation and wrapping
- **D-10:** Researcher should investigate RTL support status for each library and recommend wrapper/config approach

### Theme × direction validation

- **D-11:** All 4 combinations (light+LTR, light+RTL, dark+LTR, dark+RTL) must produce no visual bugs or layout shifts
- **D-12:** Validation approach left to planner's discretion (visual regression, manual checklist, or Playwright screenshots)

### Claude's Discretion

- Exact file organization for `useDirection()` hook (can live in RTLWrapper file or separate hooks file)
- Strategy for each third-party library's RTL adaptation (wrap, config, or CSS override)
- Order of migration (UI components first vs. page components first)
- Testing/validation methodology for theme × direction combos
- Whether to add an ESLint rule to prevent future physical property usage

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Follow the RTL rules already established in CLAUDE.md (5 Immutable RTL Rules for React Native, Web/Tailwind RTL Requirements).

</specifics>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### RTL rules and conventions

- `CLAUDE.md` §"Arabic RTL Support Guidelines" — RTL-safe Tailwind classes, RTL component template, mandatory checklist
- `CLAUDE.md` §"Mobile-First & Responsive Design" — Breakpoint system, touch targets, spacing requirements
- `CLAUDE.md` §"Web/Tailwind RTL Requirements" — Logical property mapping table, `dir` attribute pattern

### Existing RTL infrastructure

- `frontend/src/components/rtl-wrapper/RTLWrapper.tsx` — Current RTL direction setter (enhance, don't replace)
- `frontend/src/styles/rtl.css` — Existing RTL stylesheet (may be empty/minimal)

### Codebase analysis

- `.planning/codebase/CONVENTIONS.md` — Project coding conventions and patterns
- `.planning/codebase/CONCERNS.md` — Known technical concerns

### Prior phase decisions

- `.planning/phases/01-dead-code-toolchain/01-CONTEXT.md` — HeroUI v3 drop-in pattern, shadcn re-exports in `components/ui/`
- `.planning/phases/03-security-hardening/03-CONTEXT.md` — Security patterns (no RTL-specific decisions)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `RTLWrapper` component: Already sets `dir` on `<html>/<body>` — enhance with context, don't rewrite
- `useLanguage()` hook: Provides `direction` value — `useDirection()` can delegate to this or read from context
- `useTranslation()` from i18next: Already used in ~10 components for `i18n.language === 'ar'` — replacement targets

### Established Patterns

- HeroUI v3 re-export pattern: `components/ui/*.tsx` re-export from `heroui-*.tsx` — physical properties in these files are from shadcn/Aceternity source, not custom code
- `buttonVariants` via cva: Variant system already in place — no RTL impact expected
- Tailwind v4 with `@tailwindcss/vite`: Logical properties fully supported

### Integration Points

- **32 files with physical CSS**: Mostly in `components/ui/` (16 files) + scattered page components
- **13+ components with local `dir`**: IntakeForm (6 instances), VersionComparison (2), enhanced-progress (2), bottom-sheet (4), slider (1), PDFGeneratorButton
- **~10 components with `isRTL` detection**: Replace with `useDirection()` hook
- **Third-party libraries**: React Flow (10 files), Recharts (10 files), DnD-kit (usage found), TanStack Table (5 files) — all need RTL audit

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 04-rtl-ltr-consistency_
_Context gathered: 2026-03-25_
