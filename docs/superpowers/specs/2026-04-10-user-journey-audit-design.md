# User Journey Audit System — Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Scope:** Full-stack audit of all user journeys — theme, components, RTL, responsive, data flow, navigation

---

## 1. Goal

Systematically inspect every user journey in Intl-Dossier V2.0 end-to-end, catalog all errors (console, network, visual, UX), and fix them in dependency order so that fixes in shared infrastructure cascade correctly to all routes.

## 2. Approach

**Audit first, fix second.** Code analysis followed by targeted browser verification.

### 2.1 Audit Agent Team

Six specialized agents, each with a persistent checklist:

| Agent              | Domain               | Checks                                                                                                               |
| ------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Theme Auditor      | CSS/Styling          | Token consistency, dark/light mode, CSS variable usage, color contrast, oklch correctness, missing tokens            |
| Component Auditor  | UI Library           | HeroUI wrapper correctness, shadcn re-export consistency, prop API mismatches, missing variants, unused imports      |
| RTL/i18n Auditor   | Internationalization | Logical properties (ms/me not ml/mr), dir attributes, translation key coverage, font switching, writingDirection     |
| Responsive Auditor | Mobile/Layout        | Touch targets (44px min), breakpoint ordering (mobile-first), sidebar/bottombar behavior, overflow handling          |
| Data Flow Auditor  | API/State            | TanStack Query patterns, error handling, loading states, Supabase calls, missing error boundaries, floating promises |
| Navigation Auditor | Routes/UX            | Dead links, broken routes, breadcrumb accuracy, redirect correctness, guard behavior, 404 handling                   |

### 2.2 Eight Journeys (in order)

| #   | Journey                       | Relevant Agents                          |
| --- | ----------------------------- | ---------------------------------------- |
| 0   | Shared Infrastructure         | All 6                                    |
| 1   | Dossier Creation & Management | Theme, Component, RTL, Data Flow         |
| 2   | Dossier Browsing & Filtering  | Theme, Component, Responsive, Navigation |
| 3   | Engagement Lifecycle          | Data Flow, Component, RTL, Navigation    |
| 4   | My Work / Task Board          | Component, Data Flow, Responsive         |
| 5   | Login → Dashboard → Navigate  | Navigation, Theme, Responsive, Data Flow |
| 6   | Settings & Admin              | Data Flow, Component, RTL                |
| 7   | AI Chat & Briefings           | Component, Data Flow, Theme              |

### 2.3 Workflow Per Journey

1. Identify relevant agents (3-4 of 6 per journey)
2. Run agents in parallel via code analysis on journey-specific files
3. Merge findings into journey document
4. Browser verification targets critical/warning findings
5. Finalize journey document

### 2.4 Fix Execution Order

After all audits complete, fixes applied in dependency order:

```
1. Theme tokens & CSS variables        → affects all journeys
2. Shared UI components (ui/)          → affects 39+ routes
3. Layout shell (nav, sidebar, header) → affects all protected routes
4. i18n / RTL corrections              → affects 25+ routes
5. Per-journey route-specific fixes    → isolated impact
```

## 3. File Structure

```
docs/audit/
├── MASTER-AUDIT.md              ← Merged findings, prioritized fix plan
├── agents/
│   ├── theme-auditor.md
│   ├── component-auditor.md
│   ├── rtl-i18n-auditor.md
│   ├── responsive-auditor.md
│   ├── data-flow-auditor.md
│   └── navigation-auditor.md
├── journeys/
│   ├── 0-shared-infra.md
│   ├── 1-dossier-crud.md
│   ├── 2-dossier-browse.md
│   ├── 3-engagement-lifecycle.md
│   ├── 4-work-board.md
│   ├── 5-login-dashboard.md
│   ├── 6-settings-admin.md
│   └── 7-ai-chat.md
└── fix-log/
    └── FIX-LOG.md               ← What was fixed, when, verified?
```

## 4. Standardized Finding Format

```markdown
### [SEVERITY] Short description

- **File:** path/to/file.tsx:42
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** Description of what's wrong
- **Expected:** What it should be
- **Fix:** Suggested fix approach
- **Affects:** [list of journeys impacted]
```

Severity levels:

- **CRITICAL** — Blocks functionality, data loss risk, security issue
- **WARNING** — Visual bug, degraded UX, console error
- **INFO** — Code quality, minor inconsistency, improvement opportunity

## 5. Shared Infrastructure Map

These files are touched by multiple journeys. Changes here cascade widely:

### Theme (affects all)

- `frontend/src/index.css` — CSS variables, oklch tokens
- `frontend/src/styles/modern-nav-tokens.css` — Navigation tokens
- `frontend/tailwind.config.ts` — Tailwind theme extension

### Layout (affects all protected routes)

- `frontend/src/components/layout/MainLayout.tsx`
- `frontend/src/components/layout/AppSidebar.tsx`
- `frontend/src/components/layout/SiteHeader.tsx`
- `frontend/src/components/layout/MobileBottomTabBar.tsx`
- `frontend/src/components/layout/EntityBreadcrumbTrail.tsx`

### UI Components (affects 39+ routes)

- `frontend/src/components/ui/heroui-*.tsx` — HeroUI wrappers
- `frontend/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx` — Re-exports
- `frontend/src/components/ui/form.tsx` — Form system
- `frontend/src/components/ui/toast.tsx` — Notifications
- `frontend/src/components/ui/content-skeletons.tsx` — Loading states
- `frontend/src/components/ui/kanban.tsx` — Drag-drop board

### Auth & Providers (affects all protected routes)

- `frontend/src/store/authStore.ts`
- `frontend/src/contexts/auth.context.tsx`
- `frontend/src/routes/_protected.tsx`
- `frontend/src/contexts/ChatContext.tsx`
- `frontend/src/contexts/dossier-context.tsx`

### i18n (affects 25+ routes)

- `frontend/src/i18n/index.ts`
- `frontend/public/locales/{en,ar}/translation.json`

## 6. Browser Verification Plan

After code analysis, browser walkthroughs verify:

- **Visual:** Screenshots at each journey step (dark + light mode)
- **Console:** Capture errors/warnings during navigation
- **Network:** Failed API calls, slow responses, 4xx/5xx status
- **Interaction:** Form submissions, button clicks, drag-drop, modals

Dev servers:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## 7. Out of Scope

- Backend API logic (unless it causes frontend errors)
- Database schema changes
- Deployment/infrastructure
- New feature development
- Performance optimization (unless it causes visible UX issues)

## 8. Success Criteria

- All 8 journey documents complete with findings
- MASTER-AUDIT.md contains deduplicated, prioritized fix list
- All CRITICAL findings fixed and verified
- All WARNING findings fixed or documented as accepted
- FIX-LOG.md tracks every change with affected journeys
- Browser re-walk of Journey 0 + Journey 1 confirms fixes hold
