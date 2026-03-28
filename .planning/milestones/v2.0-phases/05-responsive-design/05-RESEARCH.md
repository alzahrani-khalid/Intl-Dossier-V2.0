# Phase 5: Responsive Design - Research

**Researched:** 2026-03-25
**Domain:** Responsive web design, mobile-first CSS, adaptive layouts
**Confidence:** HIGH

## Summary

Phase 5 is a comprehensive responsive hardening pass across 135 route files. The codebase already has significant responsive infrastructure: a complete `NavigationShell` component (257 lines, 3-column responsive layout), a `useResponsive()` hook with breakpoint detection, `DataTable` with card-view toggle, `bottom-sheet.tsx` (Vaul-based), `mobile-action-bar.tsx`, and `touch-target.tsx`. The primary work is (1) wiring NavigationShell into the production layout replacing AppSidebar+Header, (2) extending card-view to AdvancedDataTable and SelectableDataTable, (3) adding responsive classes to all 135 route pages, and (4) making modals/forms mobile-friendly.

**Critical finding:** The `vaul` package is NOT installed despite being imported by `bottom-sheet.tsx` and `drawer.tsx`. It must be installed before bottom sheets can work. There are also two competing responsive hooks (`useIsMobile` in `useMobile.tsx` and `useResponsive` in `useResponsive.ts`) that should be consolidated.

**Primary recommendation:** Use existing infrastructure (NavigationShell, DataTable card-view, useResponsive, touch-target) as the foundation. Install vaul, wire NavigationShell into MainLayout, then systematically audit all routes in priority waves.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Adopt NavigationShell from `/modern-nav-demo` as production nav, wire into `_protected.tsx` -> `MainLayout`, replacing AppSidebar + Header
- **D-03:** All data tables collapse to card view on mobile (< 768px). Extend DataTable card-view pattern to AdvancedDataTable and SelectableDataTable
- **D-04:** Bulk action controls (SelectableDataTable) move to sticky bottom bar on mobile via mobile-action-bar.tsx
- **D-05:** Fix ALL pages -- comprehensive responsive pass across all ~100+ routes. No pages deferred
- **D-06:** Execution priority: (1) Dashboard+Kanban, (2) Dossier list+detail, (3) Forms, (4) Settings+profile, (5) Remaining
- **D-07:** Modals become bottom sheets (Vaul) on mobile, centered dialogs on desktop
- **D-08:** Long forms use single scrollable layout with sticky save button. No stepped wizards

### Claude's Discretion

- NavigationShell breakpoint values (currently: hamburger < 768px, icon rail 768-1024px, full sidebar > 1024px) -- adjust if needed
- Old AppSidebar + Header: remove entirely or keep as temporary fallback
- Whether to introduce useBreakpoint/useMediaQuery hook vs. Tailwind-only
- Specific card layout designs for each table variant on mobile

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                            | Research Support                                                                                                                                                                                |
| ------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RESP-01 | All pages tested and fixed across 5 breakpoints (320px, 640px, 768px, 1024px, 1280px+) | NavigationShell handles nav breakpoints; useResponsive hook provides JS breakpoint detection; Tailwind responsive prefixes (base/sm:/md:/lg:/xl:) for CSS; 135 route files identified for audit |
| RESP-02 | All interactive elements meet 44x44px minimum touch target size                        | touch-target.tsx utility exists; pattern: `min-h-11 min-w-11`; audit all buttons, links, form inputs, checkboxes                                                                                |
| RESP-03 | Data tables collapse to cards or horizontal scroll on mobile                           | DataTable already has card-view with `enableViewToggle`, `mobileCardColumns`, `cardTitleColumn`; must extend pattern to AdvancedDataTable and SelectableDataTable                               |
| RESP-04 | Navigation adapts for mobile/tablet with hamburger/drawer                              | NavigationShell (257 lines) fully implements this: hamburger < 768px, icon rail 768-1024px, full sidebar > 1024px; needs wiring into MainLayout replacing AppSidebar+SiteHeader                 |
| RESP-05 | Forms and modals fully usable on mobile                                                | bottom-sheet.tsx exists (needs vaul install); heroui-modal.tsx for desktop; forms need stacked layout + sticky save button                                                                      |

</phase_requirements>

## Standard Stack

### Core (Already in Project)

| Library               | Version | Purpose                        | Why Standard                                                     |
| --------------------- | ------- | ------------------------------ | ---------------------------------------------------------------- |
| Tailwind CSS          | ^4.2.2  | Responsive utility classes     | Already in project, mobile-first breakpoints                     |
| @tanstack/react-table | ^8.21.3 | Data table with card-view      | Already powers DataTable, AdvancedDataTable, SelectableDataTable |
| HeroUI v3             | beta    | UI components (Modal, Tooltip) | Primary component library per CLAUDE.md                          |
| Lucide React          | latest  | Icons                          | Already used throughout                                          |

### Required Install

| Library | Version | Purpose                          | Why Needed                                                    |
| ------- | ------- | -------------------------------- | ------------------------------------------------------------- |
| vaul    | ^1.x    | Bottom sheet (drawer) primitives | Imported by bottom-sheet.tsx and drawer.tsx but NOT installed |

### Alternatives Considered

| Instead of         | Could Use           | Tradeoff                                                                   |
| ------------------ | ------------------- | -------------------------------------------------------------------------- |
| vaul               | react-modal-sheet   | vaul already coded into bottom-sheet.tsx, switching would require rewrite  |
| useResponsive (JS) | Tailwind-only (CSS) | JS hook needed for conditional rendering (card vs table), not just styling |

**Installation:**

```bash
cd frontend && pnpm add vaul
```

## Architecture Patterns

### Navigation Replacement Strategy

```
BEFORE:
_protected.tsx -> MainLayout -> AppSidebar + SiteHeader + content

AFTER:
_protected.tsx -> NavigationShell -> content (nav is built-in)
```

Key files to modify:

- `frontend/src/routes/_protected.tsx` -- swap MainLayout for NavigationShell
- `frontend/src/components/layout/MainLayout.tsx` -- either remove or keep as thin wrapper

### Responsive Hook Consolidation

Two competing hooks exist:

1. `useIsMobile()` in `useMobile.tsx` -- simple matchMedia, used by MainLayout + 3 other files
2. `useResponsive()` in `useResponsive.ts` -- full-featured (isMobile, isTablet, isDesktop, up/down/between), used by responsive components

**Recommendation:** Standardize on `useResponsive()`. It has richer API (breakpoint ranges, orientation, device type). Replace `useIsMobile()` calls with `useResponsive().isMobile`. The `useResponsive` hook reads CSS custom properties (`--breakpoint-*`) so breakpoints stay in sync with Tailwind.

### Breakpoint Mapping

| useResponsive alias | CSS var default | Tailwind prefix | NavigationShell behavior |
| ------------------- | --------------- | --------------- | ------------------------ |
| xs (mobile)         | 320px           | base            | Hamburger drawer         |
| sm (tablet)         | 768px           | md:             | Icon rail only           |
| md (desktop)        | 1024px          | lg:             | Full sidebar             |
| lg (wide)           | 1440px          | xl:             | Max content width        |

**Mismatch warning:** useResponsive uses `sm=768px` while Tailwind `sm:` is 640px. The hook's "sm" maps to Tailwind's "md:". This is intentional (device-oriented vs CSS-oriented) but developers must be aware. For CSS, use Tailwind prefixes. For JS conditional rendering, use useResponsive.

### Card View Extension Pattern

DataTable already implements card view. Pattern to replicate in AdvancedDataTable and SelectableDataTable:

```typescript
// Props to add:
interface ExtendedTableProps<TData, TValue> {
  enableViewToggle?: boolean // Show table/card toggle
  mobileCardColumns?: string[] // Column IDs to show in card
  cardTitleColumn?: string // Column ID for card title
  cardDescriptionColumn?: string // Column ID for card description
}

// Rendering logic:
const { isMobile } = useResponsive()
const [viewMode, setViewMode] = useState<'table' | 'card'>(isMobile ? 'card' : 'table')

// Auto-switch on resize
useEffect(() => {
  setViewMode(isMobile ? 'card' : 'table')
}, [isMobile])
```

### Modal/Bottom Sheet Adaptive Pattern

```typescript
import { useResponsive } from '@/hooks/useResponsive'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Modal } from '@/components/ui/heroui-modal'

function AdaptiveDialog({ children, open, onClose }) {
  const { isMobile } = useResponsive()

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onClose} snapPreset="medium">
        <BottomSheet.Content>{children}</BottomSheet.Content>
      </BottomSheet>
    )
  }

  return (
    <Modal open={open} onOpenChange={onClose}>
      {children}
    </Modal>
  )
}
```

### Anti-Patterns to Avoid

- **Desktop-first CSS:** Never write `lg:hidden` then `block`. Always start with mobile (`hidden lg:block`)
- **Physical CSS properties:** ESLint enforces logical properties. No `ml-*`, `mr-*`, `pl-*`, `pr-*`
- **Duplicate RTL detection:** Use `useDirection()` hook, never `i18n.dir() === 'rtl'` or `i18n.language === 'ar'`
- **Mixing responsive hooks:** Use `useResponsive()` everywhere, deprecate `useIsMobile()`
- **Fixed heights on mobile:** Content must flow naturally; avoid `h-screen` on scrollable content

## Don't Hand-Roll

| Problem              | Don't Build                            | Use Instead                        | Why                                               |
| -------------------- | -------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| Bottom sheets        | Custom draggable drawer                | vaul via bottom-sheet.tsx          | Gesture handling, snap points, keyboard avoidance |
| Touch targets        | Manual padding/sizing per element      | touch-target.tsx wrapper           | Consistent 44x44px enforcement                    |
| Responsive detection | window.matchMedia per component        | useResponsive() hook               | Centralized, SSR-safe, RAF-debounced              |
| Card-view toggle     | Custom table/card switcher             | DataTable enableViewToggle pattern | Already implemented, tested                       |
| Sticky bottom bar    | position: fixed with manual safe areas | mobile-action-bar.tsx              | iOS safe area, backdrop blur, thumb zone          |
| Nav drawer           | Custom sidebar + overlay               | NavigationShell                    | 257 lines of tested responsive nav                |

**Key insight:** This phase is 90% wiring existing components and adding Tailwind responsive classes. Very little new component code is needed.

## Common Pitfalls

### Pitfall 1: Breakpoint Mismatch Between JS and CSS

**What goes wrong:** useResponsive says "mobile" but Tailwind `sm:` styles are already active
**Why it happens:** useResponsive `sm` = 768px, Tailwind `sm:` = 640px
**How to avoid:** For conditional rendering (show/hide components), use useResponsive. For styling, use Tailwind prefixes. Never mix: don't check `isMobile` then apply `sm:` styles
**Warning signs:** Elements flash between states on resize near 640-768px range

### Pitfall 2: Missing vaul Package

**What goes wrong:** bottom-sheet.tsx imports vaul but it's not installed -- runtime crash
**Why it happens:** Component was scaffolded but dependency never added to package.json
**How to avoid:** Install vaul FIRST in Wave 0: `pnpm add vaul`
**Warning signs:** "Cannot find module 'vaul'" errors

### Pitfall 3: NavigationShell Breakpoints Not Matching Content

**What goes wrong:** Nav switches to icon rail at 768px but page content still assumes full sidebar width
**Why it happens:** Content area width depends on nav state; if not coordinated, content overflows or has dead space
**How to avoid:** NavigationShell manages content area width via its children prop. Content inside should use `w-full` and responsive padding, not fixed widths
**Warning signs:** Content clipping at exactly 768px or 1024px

### Pitfall 4: Forgetting Landscape Mobile

**What goes wrong:** Pages tested in portrait but landscape mobile (568x320) breaks layouts
**Why it happens:** Landscape mobile has desktop-like width but tiny height
**How to avoid:** Test at 568x320 (iPhone SE landscape). Ensure no `min-h-screen` assumptions break
**Warning signs:** Fixed-height elements overflow viewport

### Pitfall 5: Two Responsive Hooks in Conflict

**What goes wrong:** Component uses `useIsMobile()` (breakpoint 768px) while sibling uses `useResponsive().isMobile` (also 768px but different implementation)
**Why it happens:** Two hooks exist: useMobile.tsx and useResponsive.ts
**How to avoid:** Consolidate to useResponsive() early. Replace all useIsMobile() calls
**Warning signs:** Components disagree about current breakpoint

### Pitfall 6: Sticky Elements Stacking on Mobile

**What goes wrong:** Sticky header + sticky bottom bar + sticky save button all competing for viewport space
**Why it happens:** Multiple sticky elements reduce scrollable content area
**How to avoid:** Max 2 sticky elements on mobile: nav header + one bottom element (action bar OR save button, not both)
**Warning signs:** Less than 50% of viewport available for scrollable content

## Code Examples

### Responsive Page Template

```tsx
// Source: Project patterns from DataTable, NavigationShell, CLAUDE.md
import { useDirection } from '@/hooks/useDirection'
import { useResponsive } from '@/hooks/useResponsive'
import { useTranslation } from 'react-i18next'

export function ResponsivePage(): JSX.Element {
  const { t } = useTranslation()
  const { isRTL } = useDirection()
  const { isMobile, isTablet } = useResponsive()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header -- responsive title sizing */}
      <h1 className="text-2xl lg:text-3xl font-semibold text-start mb-4 lg:mb-6">
        {t('page.title')}
      </h1>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cards with touch-friendly sizing */}
        <div className="p-4 sm:p-6 min-h-11">{/* Content */}</div>
      </div>
    </div>
  )
}
```

### Table with Auto Card-View

```tsx
// Source: DataTable.tsx existing pattern
<DataTable
  columns={columns}
  data={data}
  enableViewToggle={true}
  mobileCardColumns={['name', 'status', 'priority']}
  cardTitleColumn="name"
  cardDescriptionColumn="status"
/>
```

### Adaptive Modal/Bottom Sheet

```tsx
// Source: bottom-sheet.tsx + heroui-modal.tsx patterns
const { isMobile } = useResponsive()

// Wrap existing modal usage
{
  isMobile ? (
    <BottomSheet open={open} onOpenChange={setOpen} snapPreset="medium">
      <BottomSheet.Handle />
      <BottomSheet.Content>
        <FormContent />
        <ThumbZoneSafeArea>
          <Button className="w-full min-h-11">{t('save')}</Button>
        </ThumbZoneSafeArea>
      </BottomSheet.Content>
    </BottomSheet>
  ) : (
    <HeroUIModal open={open} onOpenChange={setOpen}>
      <FormContent />
    </HeroUIModal>
  )
}
```

## State of the Art

| Old Approach               | Current Approach           | When Changed | Impact                                           |
| -------------------------- | -------------------------- | ------------ | ------------------------------------------------ |
| AppSidebar + SiteHeader    | NavigationShell (3-column) | Phase 5      | Single component handles all nav breakpoints     |
| useIsMobile()              | useResponsive()            | Phase 5      | Richer API, single source of truth               |
| Desktop-first tables       | Card-view on mobile        | Phase 5      | DataTable pattern extended to all table variants |
| Centered modals everywhere | Bottom sheets on mobile    | Phase 5      | Better mobile UX with gestures                   |

## Open Questions

1. **Should old AppSidebar be removed immediately or kept as fallback?**
   - What we know: NavigationShell is complete and tested at demo route
   - What's unclear: Whether any edge cases (e.g., ChatDock positioning, OnboardingTourTrigger) depend on AppSidebar structure
   - Recommendation: Remove immediately but in a dedicated task. The ChatDock and OnboardingTourTrigger in \_protected.tsx need verification they work with NavigationShell's DOM structure

2. **useResponsive breakpoints vs Tailwind breakpoints**
   - What we know: useResponsive uses 320/768/1024/1440; Tailwind uses 640/768/1024/1280
   - What's unclear: Whether to align them or keep them separate
   - Recommendation: Keep separate. CSS breakpoints (Tailwind) handle styling; JS breakpoints (useResponsive) handle conditional rendering. The 640px gap only matters for content that needs both JS logic and CSS -- rare

## Environment Availability

| Dependency            | Required By            | Available     | Version  | Fallback                      |
| --------------------- | ---------------------- | ------------- | -------- | ----------------------------- |
| vaul                  | Bottom sheets (D-07)   | NOT INSTALLED | --       | Must install: `pnpm add vaul` |
| Tailwind CSS v4       | All responsive styling | Available     | ^4.2.2   | --                            |
| @tanstack/react-table | Card-view tables       | Available     | ^8.21.3  | --                            |
| Node.js               | Build/dev              | Available     | 20.19.0+ | --                            |
| pnpm                  | Package management     | Available     | 10.29.1+ | --                            |

**Missing dependencies with no fallback:**

- vaul -- MUST be installed before bottom sheets work (blocks D-07/RESP-05)

**Missing dependencies with fallback:**

- None

## Validation Architecture

### Test Framework

| Property           | Value                                                         |
| ------------------ | ------------------------------------------------------------- |
| Framework          | Vitest 4.0.18+ (unit) + Playwright 1.55.1+ (E2E)              |
| Config file        | `frontend/vitest.config.ts` + `frontend/playwright.config.ts` |
| Quick run command  | `cd frontend && pnpm vitest run --reporter=verbose`           |
| Full suite command | `cd frontend && pnpm test`                                    |

### Phase Requirements -> Test Map

| Req ID  | Behavior                         | Test Type  | Automated Command                            | File Exists? |
| ------- | -------------------------------- | ---------- | -------------------------------------------- | ------------ |
| RESP-01 | Pages render at 5 breakpoints    | E2E        | `pnpm playwright test responsive.spec.ts`    | No -- Wave 0 |
| RESP-02 | Touch targets >= 44x44px         | E2E        | `pnpm playwright test touch-targets.spec.ts` | No -- Wave 0 |
| RESP-03 | Tables collapse to cards < 768px | unit       | `pnpm vitest run DataTable.test.tsx`         | No -- Wave 0 |
| RESP-04 | Nav adapts mobile/tablet/desktop | unit + E2E | `pnpm vitest run NavigationShell.test.tsx`   | No -- Wave 0 |
| RESP-05 | Forms/modals usable on mobile    | E2E        | `pnpm playwright test forms-mobile.spec.ts`  | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `cd frontend && pnpm vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/tests/responsive.spec.ts` -- Playwright viewport tests for key pages at 320/640/768/1024/1280px
- [ ] `frontend/tests/touch-targets.spec.ts` -- Axe-based touch target size audit
- [ ] `frontend/src/components/__tests__/NavigationShell.test.tsx` -- Unit test for nav breakpoint switching
- [ ] `frontend/src/components/__tests__/DataTable-cardview.test.tsx` -- Unit test for card-view toggle
- [ ] Install vaul: `cd frontend && pnpm add vaul`

## Project Constraints (from CLAUDE.md)

- **Mobile-first mandatory:** Start with base styles (320px+), scale up with sm:/md:/lg:/xl:
- **RTL logical properties only:** ms-_, me-_, ps-_, pe-_, text-start, text-end (ESLint enforced)
- **Touch targets:** Minimum 44x44px (`min-h-11 min-w-11`), 8px gap between targets
- **useDirection():** Must use this hook for RTL detection, never derive from i18n
- **HeroUI v3 primary:** Use HeroUI components first (Modal, Tooltip), fallback to Aceternity/Kibo/shadcn
- **No physical CSS:** No ml-_, mr-_, pl-_, pr-_, text-left, text-right, left-_, right-_
- **Explicit return types:** Required on all functions
- **No any:** Error-level ESLint rule
- **Semicolons off, single quotes, trailing commas all**

## Sources

### Primary (HIGH confidence)

- Project codebase direct inspection: NavigationShell.tsx (257 lines), useResponsive.ts, useMobile.tsx, DataTable.tsx, bottom-sheet.tsx, \_protected.tsx, MainLayout.tsx
- CONTEXT.md decisions D-01 through D-08
- UI-SPEC.md breakpoint contract, touch target contract, interaction patterns
- CLAUDE.md responsive design rules, RTL enforcement rules

### Secondary (MEDIUM confidence)

- kibo-ui-mobile-first skill SKILL.md -- confirms useResponsive pattern and touch-target requirements
- Package.json inspection -- confirmed vaul is NOT installed

### Tertiary (LOW confidence)

- None -- all findings verified from codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries verified in package.json and node_modules
- Architecture: HIGH -- all referenced components exist and were inspected
- Pitfalls: HIGH -- identified from actual code inconsistencies (vaul missing, dual hooks)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable infrastructure, no fast-moving dependencies)
