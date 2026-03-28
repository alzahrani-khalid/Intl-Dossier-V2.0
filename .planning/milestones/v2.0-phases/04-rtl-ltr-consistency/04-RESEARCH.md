# Phase 4: RTL/LTR Consistency - Research

**Researched:** 2026-03-25
**Domain:** RTL/LTR layout consistency, CSS logical properties, third-party library RTL support
**Confidence:** HIGH (codebase analysis) / MEDIUM (third-party RTL)

## Summary

Phase 4 requires consolidating RTL/LTR direction handling across the entire frontend codebase. The scope is significantly larger than initially estimated in CONTEXT.md: **469 files** contain per-component `dir={isRTL...}` attributes (787 occurrences), **545 files** declare `isRTL` variables, and **15 files** contain physical CSS properties (`ml-*`, `mr-*`, etc.). The existing infrastructure is solid -- `LanguageProvider` already provides `direction` via React context, and `RTLWrapper` sets `dir` on `document.documentElement`. The primary work is removing redundant per-component `dir` attributes and replacing scattered `isRTL` patterns with a centralized `useDirection()` hook.

Third-party RTL support is the riskiest area. React Flow (@xyflow/react) has known unresolved RTL bugs (edge/node position misalignment). Recharts has limited RTL support. DnD-kit has no documented RTL-specific API. TanStack Table works with CSS `direction` on ancestor elements. The recommended strategy is CSS isolation: wrap each library in a `dir="ltr"` container and mirror labels/text separately.

**Primary recommendation:** Enhance `LanguageProvider` with a `useDirection()` export, bulk-remove per-component `dir` attributes (469 files), replace physical CSS properties (15 files), and wrap third-party libraries in `dir="ltr"` containers with RTL-aware labels overlay.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Enhance existing `RTLWrapper` (at `frontend/src/components/rtl-wrapper/RTLWrapper.tsx`) to include a `DirectionContext` via `createContext<'rtl' | 'ltr'>('ltr')`
- **D-02:** Export a `useDirection()` hook that reads from `DirectionContext` -- replaces all scattered `isRTL = i18n.language === 'ar'` patterns (~10 components)
- **D-03:** RTLWrapper sets `dir` on `document.documentElement` and `document.body` via `useEffect` -- single source of truth
- **D-04:** Remove ALL per-component `dir={isRTL ? 'rtl' : 'ltr'}` attributes (13+ components including IntakeForm, PDFGeneratorButton, VersionComparison, bottom-sheet, slider, enhanced-progress)
- **D-05:** Use CSS `unicode-bidi: isolate` or `dir="auto"` on individual text spans for inherently LTR content (email addresses, phone numbers, URLs, code snippets) -- no wrapper component, no hook override
- **D-06:** Tailwind utility `[unicode-bidi:isolate]` for inline use; `dir="auto"` on `<span>` elements for mixed-direction text
- **D-07:** Replace all physical CSS properties with logical equivalents across 32 files. Mapping: `ml-*` -> `ms-*`, `mr-*` -> `me-*`, `pl-*` -> `ps-*`, `pr-*` -> `pe-*`, `text-left` -> `text-start`, `text-right` -> `text-end`, `left-*` -> `start-*`, `right-*` -> `end-*`, `rounded-l-*` -> `rounded-s-*`, `rounded-r-*` -> `rounded-e-*`
- **D-08:** Primary targets are `components/ui/` (16 files from shadcn/Aceternity imports) and `components/relationships/AdvancedGraphVisualization.tsx`
- **D-09:** React Flow, Recharts, DnD-kit, TanStack Table currently have zero RTL configuration -- each needs per-library investigation and wrapping
- **D-10:** Researcher should investigate RTL support status for each library and recommend wrapper/config approach
- **D-11:** All 4 combinations (light+LTR, light+RTL, dark+LTR, dark+RTL) must produce no visual bugs or layout shifts
- **D-12:** Validation approach left to planner's discretion (visual regression, manual checklist, or Playwright screenshots)

### Claude's Discretion

- Exact file organization for `useDirection()` hook (can live in RTLWrapper file or separate hooks file)
- Strategy for each third-party library's RTL adaptation (wrap, config, or CSS override)
- Order of migration (UI components first vs. page components first)
- Testing/validation methodology for theme x direction combos
- Whether to add an ESLint rule to prevent future physical property usage

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                            | Research Support                                                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RTL-01 | Single DirectionProvider at document root replaces all per-component `dir={isRTL}` scattered across codebase                           | LanguageProvider already exists with `direction` in context. Enhance with `useDirection()` export. Remove 787 `dir=` occurrences across 469 files.                               |
| RTL-02 | Zero physical CSS properties remain -- all `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right` replaced with logical equivalents | 15 files contain physical properties (14 in `components/ui/`, 1 in `index.css`). Tailwind v4 natively supports all logical properties. `rtl.css` can be removed after migration. |
| RTL-03 | Theme switching (dark/light/system + AR/EN language) works without visual bugs or layout shifts                                        | 4 combos to validate. Playwright screenshot comparison recommended.                                                                                                              |
| RTL-04 | Third-party components (React Flow, Recharts, DnD-kit, TanStack Table) render correctly in RTL mode                                    | Each library needs `dir="ltr"` isolation wrapper. Details in Architecture Patterns section.                                                                                      |
| RTL-05 | Reusable RTL-aware component patterns extracted (no duplicate RTL logic across components)                                             | `useDirection()` hook replaces 545 files of scattered `isRTL` logic. `LtrIsolate` wrapper for third-party libs.                                                                  |

</phase_requirements>

## Revised Scope Assessment

**CRITICAL: CONTEXT.md underestimates scope.** The discuss phase identified "13+ components" with local `dir` attributes and "~10 components" with `isRTL` detection. Actual codebase scan reveals:

| Category                               | CONTEXT.md Estimate | Actual Count                    |
| -------------------------------------- | ------------------- | ------------------------------- |
| Files with `dir={isRTL...}` attributes | 13+ components      | **469 files** (787 occurrences) |
| Files with `isRTL` declarations        | ~10 components      | **545 files**                   |
| Files with physical CSS properties     | 32 files            | **15 files** (14 TSX + 1 CSS)   |

The physical CSS property count is actually smaller than estimated (15 vs 32), but the `dir` attribute and `isRTL` pattern counts are 30-50x larger. The planner must account for this massive bulk operation scope.

## Standard Stack

### Core (already installed)

| Library       | Version   | Purpose                | Why Standard                                                            |
| ------------- | --------- | ---------------------- | ----------------------------------------------------------------------- |
| Tailwind CSS  | v4.2.1+   | Logical CSS properties | Native `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end` support |
| i18next       | v25.8.14+ | Language detection     | Already provides language state                                         |
| react-i18next | v16.5.6+  | React integration      | `useTranslation` hook                                                   |

### Supporting (to add)

| Library                    | Version | Purpose                     | When to Use                                   |
| -------------------------- | ------- | --------------------------- | --------------------------------------------- |
| eslint-plugin-rtl-friendly | 0.5.1   | Prevent future physical CSS | ESLint rule to auto-fix `ml-*` -> `ms-*` etc. |

### Alternatives Considered

| Instead of                 | Could Use          | Tradeoff                                                     |
| -------------------------- | ------------------ | ------------------------------------------------------------ |
| eslint-plugin-rtl-friendly | Custom ESLint rule | Plugin already has auto-fix; custom rule is unnecessary work |
| Manual `dir` removal       | codemod script     | 469 files warrants automated codemod, not manual editing     |

**Installation:**

```bash
pnpm add -D eslint-plugin-rtl-friendly
```

## Architecture Patterns

### Recommended: Direction Provider Architecture

The existing `LanguageProvider` already has `direction` in its context value. Rather than creating a separate `DirectionContext` (as D-01 suggests), the simpler approach that aligns with D-02 is:

**Option A (Recommended): Export `useDirection()` from existing LanguageProvider**

```typescript
// frontend/src/hooks/useDirection.ts
import { useLanguage } from '@/components/language-provider/language-provider'

export function useDirection(): { direction: 'ltr' | 'rtl'; isRTL: boolean } {
  const { direction } = useLanguage()
  return { direction, isRTL: direction === 'rtl' }
}
```

This is simpler because `LanguageProvider` already stores `direction` in state and sets `document.documentElement.dir`. No new context needed.

**Option B: Add DirectionContext to RTLWrapper (per D-01)**
Only needed if components exist outside `LanguageProvider` tree. Current app wraps everything in `LanguageProvider`, so this is redundant.

**Recommendation:** Option A. The `useDirection()` hook is a thin wrapper over existing infrastructure. D-01's `DirectionContext` adds unnecessary complexity when `LanguageProvider` already provides the value.

### Pattern 1: Bulk `dir` Attribute Removal

**What:** Remove 787 `dir={isRTL ? 'rtl' : 'ltr'}` occurrences from 469 files
**Strategy:** Automated codemod via AST transform or regex replacement

```bash
# Step 1: Remove dir={isRTL ? 'rtl' : 'ltr'} pattern
# Step 2: Remove dir={direction} pattern (except RTLWrapper root)
# Step 3: Remove unused isRTL declarations where dir was the only consumer
```

**Exceptions to preserve:**

- `RTLWrapper.tsx` line 21: Root-level `dir={direction}` (this IS the single provider)
- `PositionEditor.tsx`: Uses `dir="ltr"` and `dir="rtl"` for content preview (intentional LTR isolation)
- Any `dir="auto"` for mixed-direction text (D-05/D-06)

### Pattern 2: LTR Isolation for Third-Party Libraries

**What:** Wrap third-party visualization libraries in `dir="ltr"` container
**When to use:** React Flow, Recharts, DnD-kit, TanStack Table

```tsx
// frontend/src/components/ui/ltr-isolate.tsx
interface LtrIsolateProps {
  children: React.ReactNode
  className?: string
}

export function LtrIsolate({ children, className }: LtrIsolateProps): React.ReactElement {
  return (
    <div dir="ltr" className={className}>
      {children}
    </div>
  )
}
```

### Pattern 3: Physical CSS Property Replacement

**Mapping (Tailwind v4 native):**
| Physical | Logical |
|----------|---------|
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `rounded-l-*` | `rounded-s-*` |
| `rounded-r-*` | `rounded-e-*` |

### Pattern 4: LTR Content in RTL Context

**What:** Email addresses, phone numbers, URLs, code snippets need LTR rendering
**Strategy:** `dir="auto"` on spans or `[unicode-bidi:isolate]` Tailwind utility

```tsx
// For inherently LTR content within RTL context
<span dir="auto">user@example.com</span>
<span className="[unicode-bidi:isolate]">+966 50 123 4567</span>
```

### Anti-Patterns to Avoid

- **Adding new `dir={isRTL ? 'rtl' : 'ltr'}` to components:** Direction is set once at document root. Never add per-component `dir` attributes.
- **Using `isRTL` for layout decisions:** Use CSS logical properties instead. `isRTL` should only be needed for icon flipping (`rotate-180`) and third-party library config.
- **Wrapping ALL content in `<LtrIsolate>`:** Only use for third-party libraries that break in RTL. Native HTML respects `dir` from ancestors.

## Don't Hand-Roll

| Problem                   | Don't Build                 | Use Instead                            | Why                                                                   |
| ------------------------- | --------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Physical CSS detection    | Custom grep scripts         | `eslint-plugin-rtl-friendly`           | Has auto-fix, integrates with ESLint pipeline, catches at commit time |
| Bulk `dir` removal        | Manual file-by-file editing | AST codemod (jscodeshift or regex)     | 469 files is not feasible manually                                    |
| RTL text direction        | Custom direction context    | Existing `LanguageProvider.direction`  | Already implemented, already sets `document.documentElement.dir`      |
| Custom logical properties | `rtl.css` manual utilities  | Tailwind v4 native `ms-*`, `me-*` etc. | Tailwind v4 has all logical properties built-in                       |

**Key insight:** The `rtl.css` file (63 lines of manual logical property utilities) can be REMOVED after this phase. Tailwind v4 provides all of these natively (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`).

## Third-Party Library RTL Analysis

### React Flow (@xyflow/react) - 11 files

**RTL Support Status:** BROKEN. Known issues:

- [Issue #3116](https://github.com/xyflow/xyflow/issues/3116): Wrong edge positions when `dir="rtl"`
- [Issue #4093](https://github.com/xyflow/xyflow/issues/4093): Node positions misaligned in RTL mode

**Recommended Strategy:** `dir="ltr"` isolation wrapper. Graph visualization is inherently spatial, not directional. Force LTR on the graph container. RTL-ize only labels and tooltips.

```tsx
<LtrIsolate className="h-[500px] w-full">
  <ReactFlow nodes={nodes} edges={edges}>
    {/* Node labels can use dir="auto" for Arabic text */}
  </ReactFlow>
</LtrIsolate>
```

**Confidence:** HIGH -- this is the standard workaround documented in GitHub issues.

### Recharts - 10 files

**RTL Support Status:** LIMITED. Known issues:

- [Issue #263](https://github.com/recharts/recharts/issues/263): `direction: rtl` causes rendering problems
- [Issue #682](https://github.com/recharts/recharts/issues/682): Stacked bar chart RTL issues
- Y-axis labels and tooltips misposition in RTL

**Recommended Strategy:** `dir="ltr"` isolation wrapper. Charts are mathematical/spatial. Mirror axis labels via `reversed` prop on XAxis. Apply `dir="auto"` to custom tooltip content.

```tsx
<LtrIsolate>
  <ResponsiveContainer>
    <BarChart data={data}>
      <XAxis reversed={isRTL} />
      <Tooltip content={<CustomTooltip />} />
    </BarChart>
  </ResponsiveContainer>
</LtrIsolate>
```

**Confidence:** MEDIUM -- XAxis `reversed` prop is documented, but tooltip positioning may need testing.

### DnD-kit (@dnd-kit/core) - 10 files

**RTL Support Status:** NOT DOCUMENTED. No RTL-specific API or configuration found.

**Recommended Strategy:** DnD-kit uses coordinates for drag tracking. In RTL mode, the browser already flips the layout. The `horizontalListSortingStrategy` should work because it uses DOM coordinates. Test with Kanban boards in RTL mode. If drag coordinates are inverted, apply a custom modifier.

```tsx
// If needed: custom modifier to invert horizontal axis
const rtlModifier: Modifier = ({ transform }) => ({
  ...transform,
  x: isRTL ? -transform.x : transform.x,
})
```

**Confidence:** LOW -- no documentation confirms RTL behavior. Must test empirically.

### TanStack Table (@tanstack/react-table) - 5 files

**RTL Support Status:** WORKS via CSS. TanStack Table is headless -- it renders no DOM. The `dir` attribute on ancestor elements controls text/layout direction.

**Recommended Strategy:** No wrapper needed. The document-level `dir="rtl"` handles table layout. Ensure table headers use `text-start` not `text-left`.

**Confidence:** HIGH -- headless library, direction handled by CSS.

## Common Pitfalls

### Pitfall 1: Codemod Breaks Intentional `dir` Attributes

**What goes wrong:** Automated removal of `dir=` attributes removes intentional LTR isolation (e.g., code editors, position previews)
**Why it happens:** Blanket regex/codemod doesn't distinguish intentional from redundant
**How to avoid:** Whitelist files with intentional `dir="ltr"` or `dir="rtl"` before running codemod. Current known exceptions: `PositionEditor.tsx` (content preview)
**Warning signs:** Code blocks, email fields, or phone number inputs rendering in wrong direction after migration

### Pitfall 2: `rtl.css` Removal Breaks Missing Tailwind Classes

**What goes wrong:** Removing `rtl.css` utility classes breaks components that rely on them instead of Tailwind v4 built-ins
**Why it happens:** Some components may use the custom `.ms-4` from rtl.css rather than Tailwind's native `ms-4`
**How to avoid:** Search for direct `rtl.css` imports. Verify Tailwind v4 generates the same class names. Remove `rtl.css` import only after confirming no breakage.
**Warning signs:** Spacing or alignment changes after removing the file

### Pitfall 3: Recharts XAxis `reversed` Causes Data Mismatch

**What goes wrong:** Reversing XAxis makes the visual order RTL, but tooltips still show data in original order
**Why it happens:** Recharts tooltip index doesn't account for `reversed`
**How to avoid:** Test tooltip data matches visual position. May need custom tooltip that reverses data index.
**Warning signs:** Hovering over a bar shows wrong data in tooltip

### Pitfall 4: DnD-kit Drag Coordinates Inverted

**What goes wrong:** Dragging left in RTL mode moves the item right, or drop positions are mirrored
**Why it happens:** Browser flips layout but dnd-kit may use absolute coordinates
**How to avoid:** Test Kanban board drag-and-drop in RTL mode early. Apply RTL modifier if needed.
**Warning signs:** Items snap to wrong positions during drag, or drag ghost appears on opposite side

### Pitfall 5: Icon Flipping Lost After `isRTL` Removal

**What goes wrong:** Removing `isRTL` variable also removes icon rotation logic (`className={isRTL ? 'rotate-180' : ''}`)
**Why it happens:** Codemod removes the variable but dependent code still needs `isRTL` for icon flipping
**How to avoid:** The `useDirection()` hook must still expose `isRTL` boolean for icon rotation. Only `dir=` attributes are removed, not all `isRTL` usage.
**Warning signs:** Directional icons (arrows, chevrons) pointing wrong way after migration

### Pitfall 6: Massive File Count Causes Merge Conflicts

**What goes wrong:** Touching 469+ files in one PR creates merge conflict risk with parallel work
**Why it happens:** Other PRs may modify the same files
**How to avoid:** Execute this phase when no parallel frontend work is active. Split into multiple PRs if needed (ui/ components first, then pages, then routes).
**Warning signs:** Git conflicts on every merge attempt

## Code Examples

### useDirection Hook

```typescript
// frontend/src/hooks/useDirection.ts
import { useLanguage } from '@/components/language-provider/language-provider'

export function useDirection(): { direction: 'ltr' | 'rtl'; isRTL: boolean } {
  const { direction } = useLanguage()
  return { direction, isRTL: direction === 'rtl' }
}
```

### LtrIsolate Wrapper

```tsx
// frontend/src/components/ui/ltr-isolate.tsx
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LtrIsolateProps {
  children: ReactNode
  className?: string
}

export function LtrIsolate({ children, className }: LtrIsolateProps): ReactElement {
  return (
    <div dir="ltr" className={cn(className)}>
      {children}
    </div>
  )
}
```

### ESLint Plugin Configuration

```javascript
// In ESLint flat config
import rtlFriendly from 'eslint-plugin-rtl-friendly'

export default [
  {
    plugins: { 'rtl-friendly': rtlFriendly },
    rules: {
      'rtl-friendly/no-physical-properties': 'error',
    },
  },
]
```

## State of the Art

| Old Approach             | Current Approach                      | When Changed                        | Impact                                            |
| ------------------------ | ------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Per-component `dir=`     | Document-level `dir` on `<html>`      | CSS Logical Properties spec (2022+) | Single source of truth, no per-component overhead |
| `ml-*`, `mr-*`           | `ms-*`, `me-*`                        | Tailwind CSS v3.3+ (2023)           | Automatic RTL/LTR flipping                        |
| Manual RTL CSS file      | Tailwind v4 native logical properties | Tailwind v4 (2024)                  | `rtl.css` file becomes redundant                  |
| `text-left`/`text-right` | `text-start`/`text-end`               | CSS Logical Properties (2022+)      | Respects document direction                       |

**Deprecated/outdated:**

- `frontend/src/styles/rtl.css`: All 63 lines of custom utility classes are redundant with Tailwind v4. Can be removed after verifying no direct imports.

## Open Questions

1. **`eslint-plugin-rtl-friendly` + Tailwind v4 + ESLint 9 flat config compatibility**
   - What we know: Plugin version 0.5.1 exists, supports Tailwind class detection
   - What's unclear: Whether it works with ESLint 9 flat config and Tailwind v4 class format
   - Recommendation: Test installation in dev before committing to ESLint integration. If incompatible, a custom regex-based ESLint rule is a fallback.

2. **DnD-kit RTL behavior**
   - What we know: No RTL documentation exists. Uses DOM coordinates.
   - What's unclear: Whether horizontal sorting strategies work correctly in RTL
   - Recommendation: Must test empirically with Kanban board in RTL mode before implementing wrapper.

3. **Codemod strategy for 469 files**
   - What we know: Pattern is consistent (`dir={isRTL ? 'rtl' : 'ltr'}`)
   - What's unclear: Whether jscodeshift or regex is more reliable for JSX attribute removal
   - Recommendation: Use regex with manual review on a few files first. Pattern is simple enough for regex.

## Environment Availability

| Dependency                 | Required By        | Available  | Version | Fallback           |
| -------------------------- | ------------------ | ---------- | ------- | ------------------ |
| eslint-plugin-rtl-friendly | ESLint enforcement | To install | 0.5.1   | Custom ESLint rule |
| Tailwind CSS v4            | Logical properties | Installed  | 4.2.1+  | --                 |
| Playwright                 | Visual regression  | Installed  | 1.55.1+ | --                 |
| Vitest                     | Unit tests         | Installed  | 4.0.18+ | --                 |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** eslint-plugin-rtl-friendly (custom rule if incompatible)

## Validation Architecture

### Test Framework

| Property           | Value                                                         |
| ------------------ | ------------------------------------------------------------- |
| Framework          | Vitest 4.0.18+ / Playwright 1.55.1+                           |
| Config file        | `frontend/vitest.config.ts` / `frontend/playwright.config.ts` |
| Quick run command  | `pnpm --filter frontend test -- --run`                        |
| Full suite command | `pnpm test`                                                   |

### Phase Requirements -> Test Map

| Req ID | Behavior                                         | Test Type      | Automated Command                                                | File Exists? |
| ------ | ------------------------------------------------ | -------------- | ---------------------------------------------------------------- | ------------ |
| RTL-01 | Single DirectionProvider, no per-component `dir` | grep/lint      | `rg 'dir=\{isRTL' frontend/src/ \| wc -l` (expect 0)             | Wave 0       |
| RTL-02 | Zero physical CSS properties                     | lint           | `eslint --rule 'rtl-friendly/no-physical-properties: error'`     | Wave 0       |
| RTL-03 | Theme x direction no visual bugs                 | e2e/screenshot | Playwright screenshot comparison across 4 combos                 | Wave 0       |
| RTL-04 | Third-party libs correct in RTL                  | e2e/visual     | Playwright tests for graph, chart, kanban, table pages           | Wave 0       |
| RTL-05 | Reusable RTL patterns extracted                  | grep/lint      | `rg 'i18n\.language.*===.*ar' frontend/src/ \| wc -l` (expect 0) | Wave 0       |

### Sampling Rate

- **Per task commit:** `rg` count checks for physical properties and `dir=` attributes
- **Per wave merge:** `pnpm --filter frontend test -- --run`
- **Phase gate:** Full suite green + zero `rg` violations before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/rtl/direction-provider.test.tsx` -- covers RTL-01 (useDirection hook)
- [ ] `tests/rtl/physical-css-audit.test.ts` -- covers RTL-02 (grep-based test)
- [ ] `tests/e2e/rtl-theme-matrix.spec.ts` -- covers RTL-03 (4 combo screenshots)
- [ ] `tests/e2e/rtl-third-party.spec.ts` -- covers RTL-04 (graph, chart, kanban pages)
- [ ] ESLint config update for `rtl-friendly` plugin -- covers RTL-02/RTL-05 enforcement

## Sources

### Primary (HIGH confidence)

- Codebase analysis via `rg` (ripgrep) -- file counts, pattern occurrences
- `frontend/src/components/language-provider/language-provider.tsx` -- existing direction infrastructure
- `frontend/src/components/rtl-wrapper/RTLWrapper.tsx` -- existing RTL wrapper
- `frontend/src/styles/rtl.css` -- existing custom utilities
- `frontend/src/hooks/useLanguage.ts` -- existing hook re-export

### Secondary (MEDIUM confidence)

- [xyflow/xyflow Issue #3116](https://github.com/xyflow/xyflow/issues/3116) -- React Flow RTL edge position bug
- [xyflow/xyflow Issue #4093](https://github.com/xyflow/xyflow/issues/4093) -- React Flow RTL node position bug
- [recharts Issue #263](https://github.com/recharts/recharts/issues/263) -- Recharts RTL rendering issues
- [recharts Issue #682](https://github.com/recharts/recharts/issues/682) -- Recharts stacked bar RTL
- [eslint-plugin-rtl-friendly npm](https://www.npmjs.com/package/eslint-plugin-rtl-friendly) -- v0.5.1
- [dnd-kit docs](https://docs.dndkit.com/) -- modifiers, sorting strategies

### Tertiary (LOW confidence)

- DnD-kit RTL behavior -- no documentation found, needs empirical testing

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already installed, versions verified
- Architecture: HIGH -- existing LanguageProvider infrastructure well-understood
- Physical CSS migration: HIGH -- only 15 files, clear mapping
- `dir` attribute removal: HIGH for pattern, MEDIUM for scale (469 files needs codemod)
- Third-party RTL: MEDIUM (React Flow, Recharts) / LOW (DnD-kit)
- Pitfalls: HIGH -- based on documented library issues

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable domain, unlikely to change)
