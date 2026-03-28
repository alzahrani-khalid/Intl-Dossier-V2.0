# Phase 5: Responsive Design - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Make every page fully usable on mobile (320px+), tablet (768px+), and desktop (1024px+) with proper touch targets, adaptive layouts, and mobile-friendly interaction patterns. This is a comprehensive responsive audit and fix pass across all ~100+ route files — not a partial fix.

Requirements covered: RESP-01, RESP-02, RESP-03, RESP-04, RESP-05

</domain>

<decisions>
## Implementation Decisions

### Navigation Strategy

- **D-01:** Adopt the existing `NavigationShell` component (currently at demo route `/modern-nav-demo`) as the production navigation. Wire it into `_protected.tsx` → `MainLayout`, replacing the legacy `AppSidebar` + `Header` combination.
- **D-02:** NavigationShell breakpoint behavior and old nav cleanup are **Claude's Discretion** — adjust breakpoints if content density requires it, and decide whether to remove old nav immediately or keep as temporary fallback based on risk assessment.

### Mobile Table Behavior

- **D-03:** All data tables collapse to **card view on mobile** (< 768px). Extend the existing `DataTable` card-view pattern to `AdvancedDataTable` and `SelectableDataTable` variants.
- **D-04:** Bulk action controls (SelectableDataTable) move to a **sticky bottom bar** on mobile, using the existing `mobile-action-bar.tsx` component (thumb-zone accessible).

### Page Priority & Scope

- **D-05:** **Fix ALL pages** — comprehensive responsive pass across all ~100+ routes. No pages deferred.
- **D-06:** Execution priority order (plan waves):
  1. Dashboard + Kanban board (highest traffic, most complex)
  2. Dossier list + detail pages (core workflow)
  3. Forms (create/edit dossiers, work items)
  4. Settings + user profile
  5. All remaining pages (secondary routes, admin, etc.)

### Modal/Form Mobile Pattern

- **D-07:** Modals become **bottom sheets** (Vaul) on mobile, stay centered dialogs on desktop. Use the existing `bottom-sheet.tsx` with drag-to-dismiss and snap points.
- **D-08:** Long forms use **single scrollable layout** with all fields stacked vertically and a sticky save button at the bottom. No stepped wizards or accordions.

### Claude's Discretion

- NavigationShell breakpoint values (currently: hamburger < 768px, icon rail 768-1024px, full sidebar > 1024px) — adjust if content density requires it
- Old AppSidebar + Header: remove entirely or keep as temporary fallback — decide based on risk
- Whether to introduce a `useBreakpoint` or `useMediaQuery` hook vs. relying solely on Tailwind responsive classes
- Specific card layout designs for each table variant on mobile

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Navigation

- `frontend/src/components/modern-nav/NavigationShell/NavigationShell.tsx` — The 3-column responsive nav to adopt as production nav
- `frontend/src/components/layout/AppSidebar.tsx` — Legacy sidebar being replaced
- `frontend/src/components/layout/Header.tsx` — Legacy header being replaced
- `frontend/src/routes/_protected.tsx` — Protected route layout wrapper where nav is wired

### Responsive Components (Existing)

- `frontend/src/components/responsive/responsive-card.tsx` — Existing responsive card pattern
- `frontend/src/components/responsive/responsive-nav.tsx` — Responsive nav with useResponsive() hook
- `frontend/src/components/responsive/responsive-table.tsx` — Responsive table pattern

### Mobile UI Primitives (Existing)

- `frontend/src/components/ui/bottom-sheet.tsx` — Vaul-based bottom sheet (modals on mobile)
- `frontend/src/components/ui/mobile-action-bar.tsx` — Sticky bottom action bar (bulk actions)
- `frontend/src/components/ui/touch-target.tsx` — Touch target utility
- `frontend/src/components/ui/thumb-zone-safe-area.tsx` — Thumb zone wrapper
- `frontend/src/components/ui/context-aware-fab.tsx` — Floating action button
- `frontend/src/components/ui/floating-action-button.tsx` — FAB component

### Tables

- `frontend/src/components/table/DataTable.tsx` — Main data table with card-view toggle (reference pattern)
- `frontend/src/components/table/AdvancedDataTable.tsx` — Advanced table needing card-view
- `frontend/src/components/bulk-actions/SelectableDataTable.tsx` — Bulk action table needing mobile bar

### Modal/Form

- `frontend/src/components/ui/heroui-modal.tsx` — HeroUI modal wrapper (desktop pattern)
- `frontend/src/components/ui/heroui-forms.tsx` — HeroUI form wrappers

### RTL Infrastructure (From Phase 4)

- `frontend/src/hooks/useDirection.ts` — Direction hook (MUST use, not re-derive)
- `frontend/src/components/rtl-wrapper/RTLWrapper.tsx` — Single dir source at document root

### Codebase Analysis

- `.planning/codebase/STRUCTURE.md` — Component organization reference
- `.planning/codebase/CONCERNS.md` — Known issues including responsive gaps

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **NavigationShell**: Complete 3-column responsive nav at demo route — needs wiring, not building
- **DataTable card-view**: `enableViewToggle`, `mobileCardColumns`, `cardTitleColumn` props — pattern to replicate
- **mobile-action-bar.tsx**: Sticky bottom bar with iOS safe area padding, auto variant — ready for bulk actions
- **bottom-sheet.tsx**: Vaul-based with snap points (small/medium/large/full), keyboard avoidance, RTL — ready for mobile modals
- **touch-target.tsx**: Utility for 44x44px touch targets — use across all interactive elements
- **thumb-zone-safe-area.tsx**: Wrapper for bottom-of-screen content accessibility
- **useDirection()**: RTL-aware hook — use in all new responsive components
- **useResponsive()**: Referenced in responsive-nav.tsx (isMobile, isTablet, viewport) — potential global adoption

### Established Patterns

- **Breakpoint usage heavily skewed**: sm: (4,329), md: (270), lg: (513), xl: (20), 2xl: (9) — xl/2xl nearly unused, wide-screen layouts are a gap
- **Logical properties enforced**: ESLint blocks physical CSS (`ml-*`, `mr-*`, etc.) — all responsive CSS must use `ms-*`, `me-*`, etc.
- **No per-component dir=**: RTLWrapper handles direction at document root
- **HeroUI v3 wrappers**: Plain HTML elements in `components/ui/` with cva variants — responsive additions should follow this pattern

### Integration Points

- **\_protected.tsx**: Where NavigationShell replaces AppSidebar/Header
- **MainLayout**: Wrapper component that orchestrates sidebar + content
- **components/ui/\*.tsx**: Where responsive utility components live
- **hooks/**: Where useBreakpoint or useMediaQuery would go (camelCase naming)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User chose recommended options for all areas (bottom sheets, card views, sticky bottom bars, scrollable forms).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 05-responsive-design_
_Context gathered: 2026-03-25_
