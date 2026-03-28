# Technology Stack

**Project:** Intl-Dossier v3.0 Hub-and-Spoke Architecture
**Researched:** 2026-03-28
**Scope:** Stack ADDITIONS only -- existing stack validated and not re-researched

## TL;DR

One new dependency: `react-resizable-panels`. Everything else is already installed or built with Tailwind CSS grid + existing components. Do NOT add XState, react-grid-layout, or any new animation/tab/stepper libraries.

## New Dependency

### react-resizable-panels (RelationshipSidebar)

| Technology               | Version | Purpose                                                             | Why                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-resizable-panels` | ^4.7.6  | Resizable + collapsible RelationshipSidebar on dossier detail pages | Users need to resize sidebar width AND collapse it. `@radix-ui/react-collapsible` (already installed) only toggles open/closed -- no drag-to-resize. This library is the foundation for shadcn/ui's Resizable component, has built-in keyboard accessibility, supports min/max constraints, and auto-collapses when dragged below threshold. ~5KB gzipped. |

**Confidence:** HIGH -- verified via npm (v4.7.6 published 2026-03-27), active maintenance by bvaughn, used by shadcn/ui ecosystem.

## Existing Stack -- Already Sufficient

These are already installed and cover all v3.0 needs. No version bumps required.

### Quick Switcher (Cmd+K)

| Technology | Version | Purpose                                   | Status                                                                                                                                       |
| ---------- | ------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `cmdk`     | ^1.1.1  | Command palette for global quick switcher | INSTALLED. Wrapper exists at `components/ui/command.tsx`. Needs enhancement (search across dossiers, recent items, actions) but no new deps. |

### Workspace Tabs (Engagement/Forum Workspace)

| Technology             | Version | Purpose                                                         | Status                                                                                                                                                                                                                   |
| ---------------------- | ------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HeroUI v3 Tabs         | beta.8  | Compound component tabs (`Tabs.List`, `Tabs.Tab`, `Tabs.Panel`) | INSTALLED via `@heroui/react`. Wrapper at `components/ui/heroui-tabs.tsx`. Supports React Aria accessibility, SSR-safe selection indicator. Use for workspace tab bar (Overview, Context, Tasks, Calendar, Docs, Audit). |
| `@radix-ui/react-tabs` | ^1.1.13 | Fallback tab primitive                                          | INSTALLED. Available if HeroUI tabs have beta issues.                                                                                                                                                                    |

### Lifecycle Bar (6-Stage Progress)

| Technology                 | Version  | Purpose                       | Status                                                                                                                                              |
| -------------------------- | -------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@radix-ui/react-progress` | ^1.1.8   | Accessible progress primitive | INSTALLED. Use as base for LifecycleBar segments.                                                                                                   |
| `motion`                   | ^12.38.0 | Stage transition animations   | INSTALLED (99 files using it). Animate stage indicator movement, collapse/expand transitions, tab switches. No additional animation library needed. |

### Dashboard Layout (Operations Hub)

| Technology      | Version | Purpose                                     | Status                                                                                                                                                                   |
| --------------- | ------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tailwind CSS v4 | ^4.2.2  | Responsive grid layout for 3-zone dashboard | INSTALLED. Use `grid grid-cols-1 lg:grid-cols-12` with `col-span-*` for zone layout. No `react-grid-layout` needed -- dashboard zones are fixed, not user-rearrangeable. |
| `recharts`      | ^3.8.1  | Quick Stats charts, engagement stage counts | INSTALLED. Already used for dashboard charts.                                                                                                                            |

### Collapsible Sidebar Navigation

| Technology                    | Version | Purpose                                                         | Status                                                     |
| ----------------------------- | ------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| `@radix-ui/react-collapsible` | ^1.1.12 | Navigation sidebar group collapse (Operations, Dossiers, Admin) | INSTALLED. Wrapper at `components/ui/collapsible.tsx`.     |
| Existing sidebar components   | --      | `sidebar.tsx` + `sidebar-collapsible.tsx`                       | INSTALLED. Refactor for hub-based grouping, don't rebuild. |

### Lifecycle State Machine

| Technology | Version | Purpose                                         | Status                                                                                        |
| ---------- | ------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `zustand`  | ^5.0.12 | Client-side lifecycle stage state + transitions | INSTALLED. Use a typed store with explicit transition guards. See Architecture section below. |

### Drag-and-Drop (Stage Kanban)

| Technology          | Version | Purpose                       | Status                                                               |
| ------------------- | ------- | ----------------------------- | -------------------------------------------------------------------- |
| `@dnd-kit/core`     | ^6.3.1  | Kanban board drag-and-drop    | INSTALLED. Already used. Extend for lifecycle-stage-grouped columns. |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable items within columns | INSTALLED.                                                           |

### Other Existing (No Changes)

| Technology                | Version        | Purpose                                              |
| ------------------------- | -------------- | ---------------------------------------------------- |
| `@xyflow/react`           | ^12.10.2       | Network graph in RelationshipSidebar expandable view |
| `react-day-picker`        | ^9.14.0        | Calendar in workspace Calendar tab                   |
| `react-hook-form` + `zod` | ^7.72 / ^4.3.6 | Engagement create/edit forms                         |
| `@tanstack/react-query`   | ^5.95.0        | Server state for all data fetching                   |
| `@tanstack/react-router`  | ^1.168.7       | Nested routes for workspace tabs                     |
| `@tanstack/react-table`   | ^8.21.3        | List views for dossier lists                         |
| `sonner`                  | ^2.0.7         | Toast notifications for stage transitions            |
| `date-fns`                | ^4.1.0         | Date formatting for timeline, calendar               |

## Alternatives Considered -- And Why NOT

| Category        | Rejected                             | Why Not                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State Machine   | XState v5 (~15KB)                    | Lifecycle has 6 linear stages with simple forward/backward. Zustand typed reducer is sufficient. XState adds complexity and bundle size for a problem that doesn't need statecharts. Revisit only if lifecycle rules become deeply conditional with parallel states. |
| Dashboard Grid  | `react-grid-layout` (~25KB)          | Operations Hub has 3 fixed zones, not user-rearrangeable widgets. Tailwind grid handles this natively. Adding drag-to-rearrange dashboard widgets is out of scope.                                                                                                   |
| Animation       | Any new library                      | `motion` v12.38 already installed across 99 files. Covers all needs: layout animations for LifecycleBar, `AnimatePresence` for tab transitions, `m.div` for sidebar collapse.                                                                                        |
| Stepper         | `@mantine/core` Stepper, MUI Stepper | LifecycleBar is a custom horizontal stage indicator, not a form wizard. Build with `@radix-ui/react-progress` segments + motion for the indicator. Avoids importing a full component library for one component.                                                      |
| Tabs            | Any new tab library                  | HeroUI v3 Tabs (compound components, React Aria) + Radix Tabs already cover this. Two implementations available for flexibility.                                                                                                                                     |
| Resizable       | CSS-only resize                      | `resize: horizontal` CSS doesn't support collapse behavior, min/max constraints, keyboard accessibility, or programmatic control. `react-resizable-panels` is the standard.                                                                                          |
| Command Palette | `kbar`, `react-cmdk`                 | `cmdk` by pacocoursey is already installed, actively maintained (v1.1.1), unstyled (works with Tailwind), and has a wrapper component. No reason to switch.                                                                                                          |

## Architecture Decisions for New Components

### LifecycleBar -- Custom Component

```
Build with:
- Semantic HTML: <ol role="tablist"> with <li role="tab"> per stage
- @radix-ui/react-progress for accessible progress semantics
- motion for animated stage indicator (layoutId for smooth transitions)
- Tailwind for styling (flex, gap, colors per state)
- Zustand store for current stage + transition logic
```

**Why custom:** No existing library matches the exact UX -- clickable completed stages showing summaries, current stage showing pending items, non-rigid forward/backward navigation. Building from accessible primitives (Radix + ARIA roles) gives full control.

### RelationshipSidebar -- react-resizable-panels

```
Build with:
- react-resizable-panels: PanelGroup + Panel + PanelResizeHandle
- Main content in left Panel (flex: 1)
- RelationshipSidebar in right Panel (defaultSize: 25, collapsedSize: 0, collapsible: true)
- @radix-ui/react-collapsible for tier group accordion within sidebar
- motion for expand/collapse animation
```

**Why react-resizable-panels:** The sidebar needs three behaviors simultaneously: (1) user-resizable width, (2) collapsible to zero, (3) min/max constraints. Only this library provides all three with accessibility.

### WorkspaceShell -- TanStack Router Nested Routes

```
Build with:
- TanStack Router: /dossiers/engagements/:id as parent layout route
- Child routes: /tasks, /calendar, /docs, /audit render in Outlet
- HeroUI v3 Tabs for the tab bar (synced to route via useNavigate/useMatch)
- URL-driven tab state (no client state needed -- Router IS the state)
```

**Why Router-driven:** Tabs are routes. Deep-linking to `/engagements/123/tasks` must work. TanStack Router's nested layout routes are designed for exactly this pattern. Tab state lives in the URL, not Zustand.

### Operations Hub Dashboard -- Tailwind Grid

```
Build with:
- Tailwind CSS grid: grid grid-cols-1 lg:grid-cols-12
- Zone 1 (Action Bar): col-span-full
- Zone 2 (Left Column): col-span-full lg:col-span-7
- Zone 3 (Right Column): col-span-full lg:col-span-5
- recharts for Quick Stats visualizations
- TanStack Query for data fetching with role-based query keys
```

**Why pure Tailwind:** Fixed layout, responsive breakpoints, zero JS overhead. The dashboard doesn't need drag-to-rearrange.

### Quick Switcher (Cmd+K) -- Enhanced cmdk

```
Build with:
- cmdk (already installed): Command.Dialog + Command.Input + Command.List
- TanStack Query: search across dossiers, engagements, work items
- Keyboard shortcuts: Cmd+K to open, recent items, type-ahead
- motion for dialog entrance animation
```

**Why enhance, not replace:** The `command.tsx` wrapper already exists. Add search integration and action commands (New Engagement, New Request, Navigate to...).

## Installation

```bash
# Single new dependency
pnpm add react-resizable-panels

# That's it. Everything else is already installed.
```

## Bundle Impact Assessment

| Package                      | Gzipped Size | Justification                                         |
| ---------------------------- | ------------ | ----------------------------------------------------- |
| `react-resizable-panels`     | ~5KB         | Only new addition. Well within 200KB budget headroom. |
| XState (rejected)            | ~15KB        | Saved by using Zustand instead.                       |
| react-grid-layout (rejected) | ~25KB        | Saved by using Tailwind grid.                         |

**Current bundle budget:** 200KB (enforced by size-limit). Adding ~5KB for react-resizable-panels is safe.

## Integration Points

### With Existing Patterns

| Pattern           | Integration                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Domain repository | New `elected-officials` domain follows same pattern as 13 existing domains                                                      |
| HeroUI re-export  | `react-resizable-panels` gets a `resizable.tsx` wrapper in `components/ui/` following shadcn re-export pattern                  |
| RTL support       | `react-resizable-panels` supports `dir="rtl"` on PanelGroup -- sidebar appears on LEFT in RTL (correct for Arabic reading flow) |
| Mobile-first      | Sidebar collapses to sheet/drawer on mobile (use existing `sheet.tsx` / `vaul` drawer)                                          |
| Code splitting    | Workspace routes use `React.lazy()` -- each tab is a lazy-loaded route                                                          |

### RTL Considerations for New Components

| Component           | RTL Behavior                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| LifecycleBar        | Stages flow RIGHT-to-LEFT (first stage on right). Use `flex-row` -- `forceRTL` handles flip automatically via Tailwind logical properties. |
| RelationshipSidebar | Appears on LEFT side in RTL (logical "end" position). `react-resizable-panels` respects `dir="rtl"`.                                       |
| WorkspaceShell tabs | HeroUI Tabs already RTL-aware via React Aria. Tab order flows RTL automatically.                                                           |
| Quick Switcher      | `cmdk` renders as dialog -- RTL handled by `dir` attribute on container.                                                                   |
| Dashboard zones     | Tailwind grid + logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`). Left column maps to "start" column in RTL.                            |

## Sources

- [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels) -- v4.7.6, published 2026-03-27 (HIGH confidence)
- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels) -- collapsible example (HIGH confidence)
- [cmdk npm](https://www.npmjs.com/package/cmdk) -- v1.1.1 by pacocoursey (HIGH confidence)
- [cmdk GitHub](https://github.com/pacocoursey/cmdk) -- React 19 compatible (HIGH confidence)
- [HeroUI v3 Tabs migration](https://v3.heroui.com/docs/react/migration/tabs) -- compound component pattern (MEDIUM confidence, beta)
- [HeroUI v3 beta.8 release](https://heroui.com/docs/react/releases/v3-0-0-beta-8) -- latest as of 2026-03 (MEDIUM confidence, beta)
- [shadcn/ui Resizable](https://ui.shadcn.com/docs/components/radix/resizable) -- built on react-resizable-panels (HIGH confidence)
- [Zustand GitHub](https://github.com/pmndrs/zustand) -- v5, middleware patterns (HIGH confidence)
- [State Management in React 2026](https://www.pkgpulse.com/blog/state-of-react-state-management-2026) -- Zustand vs XState analysis (MEDIUM confidence)
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns) -- responsive dashboard layout (HIGH confidence)
