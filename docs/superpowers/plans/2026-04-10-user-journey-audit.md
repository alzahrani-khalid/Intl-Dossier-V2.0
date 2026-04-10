# User Journey Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically audit all 8 user journeys for errors (console, network, visual, UX, theme, RTL) and produce a prioritized fix list.

**Architecture:** 6 specialized audit agents run against shared infrastructure first, then per-journey. Code analysis phase produces findings docs, browser verification confirms visual/runtime issues. All findings merge into MASTER-AUDIT.md for dependency-ordered fixing.

**Tech Stack:** Code analysis (grep/read), browser automation (Chrome MCP), structured markdown output

---

## File Map

All output goes to `docs/audit/`:

| File                                 | Purpose                    | Created By     |
| ------------------------------------ | -------------------------- | -------------- |
| `agents/theme-auditor.md`            | Agent checklist definition | Already exists |
| `agents/component-auditor.md`        | Agent checklist definition | Already exists |
| `agents/rtl-i18n-auditor.md`         | Agent checklist definition | Already exists |
| `agents/responsive-auditor.md`       | Agent checklist definition | Already exists |
| `agents/data-flow-auditor.md`        | Agent checklist definition | Already exists |
| `agents/navigation-auditor.md`       | Agent checklist definition | Already exists |
| `journeys/0-shared-infra.md`         | Journey 0 findings         | Task 1         |
| `journeys/1-dossier-crud.md`         | Journey 1 findings         | Task 3         |
| `journeys/2-dossier-browse.md`       | Journey 2 findings         | Task 4         |
| `journeys/3-engagement-lifecycle.md` | Journey 3 findings         | Task 5         |
| `journeys/4-work-board.md`           | Journey 4 findings         | Task 6         |
| `journeys/5-login-dashboard.md`      | Journey 5 findings         | Task 7         |
| `journeys/6-settings-admin.md`       | Journey 6 findings         | Task 8         |
| `journeys/7-ai-chat.md`              | Journey 7 findings         | Task 9         |
| `MASTER-AUDIT.md`                    | Consolidated + prioritized | Task 10        |

## Key Files Under Audit

These are the primary source files each agent examines. Agents read their checklist from `docs/audit/agents/<name>.md` and scan these files:

**Theme Auditor targets:**

- `frontend/src/index.css`
- `frontend/src/styles/modern-nav-tokens.css`
- `frontend/tailwind.config.ts`
- `frontend/src/components/theme-provider/theme-provider.tsx`
- `frontend/src/components/ui/theme-toggle.tsx`

**Component Auditor targets:**

- `frontend/src/components/ui/heroui-*.tsx` (8 wrapper files)
- `frontend/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `skeleton.tsx` (re-exports)
- `frontend/src/components/ui/form.tsx`, `form-wizard.tsx`
- `frontend/src/components/ui/kanban.tsx`, `context-aware-fab.tsx`, `content-skeletons.tsx`

**RTL/i18n Auditor targets:**

- `frontend/src/i18n/index.ts`
- `frontend/public/locales/en/translation.json`
- `frontend/public/locales/ar/translation.json`
- All `.tsx` files in current journey scope (grep for `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`)

**Responsive Auditor targets:**

- `frontend/src/components/layout/MainLayout.tsx`
- `frontend/src/components/layout/MobileBottomTabBar.tsx`
- `frontend/src/components/layout/AppSidebar.tsx`
- `frontend/src/hooks/useResponsive*`
- All `.tsx` files in current journey scope (check breakpoint ordering, touch targets)

**Data Flow Auditor targets:**

- `frontend/src/domains/*/` (all domain modules)
- `frontend/src/store/*.ts`
- `frontend/src/contexts/*.tsx`
- `frontend/src/lib/supabase.ts`
- Route files with `useQuery`, `useMutation`, `loader`, `beforeLoad`

**Navigation Auditor targets:**

- `frontend/src/routes/` (all route files)
- `frontend/src/components/layout/AppSidebar.tsx` (sidebar links)
- `frontend/src/components/layout/MobileBottomTabBar.tsx` (mobile links)
- `frontend/src/components/layout/EntityBreadcrumbTrail.tsx`
- `frontend/src/lib/dossier-routes.ts`

---

## Task 1: Journey 0 — Shared Infrastructure Code Audit

**Files:**

- Create: `docs/audit/journeys/0-shared-infra.md`

All 6 agents run in parallel against the shared infrastructure files.

- [ ] **Step 1: Dispatch Theme Auditor agent**

Prompt the agent with:

```
You are the Theme Auditor. Read your checklist from docs/audit/agents/theme-auditor.md.

Audit these files against every item in your checklist:
- frontend/src/index.css (CSS custom properties — read ALL of it)
- frontend/src/styles/modern-nav-tokens.css
- frontend/tailwind.config.ts
- frontend/src/components/theme-provider/theme-provider.tsx
- frontend/src/components/theme-selector/theme-selector.tsx
- frontend/src/components/ui/theme-toggle.tsx

For each checklist item, report PASS or a finding using this format:
### [SEVERITY] Short description
- **File:** path:line
- **Agent:** theme-auditor
- **Journey:** 0-shared-infra
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [all journeys]

Also grep across frontend/src/components/ for:
- Hardcoded hex colors (#fff, #000, #[0-9a-f]{3,6})
- Hardcoded rgb/rgba values
- Any color that should use a CSS variable instead

Report ALL findings, not just the first few. Be thorough.
```

- [ ] **Step 2: Dispatch Component Auditor agent (parallel with Step 1)**

Prompt the agent with:

```
You are the Component Auditor. Read your checklist from docs/audit/agents/component-auditor.md.

Audit the shared UI component library:
1. Read every heroui-*.tsx file in frontend/src/components/ui/
2. Read the corresponding re-export files (button.tsx, card.tsx, badge.tsx, skeleton.tsx)
3. Read form.tsx, form-wizard.tsx, content-skeletons.tsx
4. Check frontend/components.json for configuration

For each checklist item, report PASS or a finding using this format:
### [SEVERITY] Short description
- **File:** path:line
- **Agent:** component-auditor
- **Journey:** 0-shared-infra
- **Issue:** What's wrong
- **Expected:** What it should be
- **Fix:** How to fix
- **Affects:** [journeys that use this component]

Check specifically:
- Do heroui wrappers render plain HTML (div/span/button) or HeroUI primitives?
- Does each re-export actually match the wrapper's exported API?
- Are there type mismatches between wrapper and re-export?
- Do all components use cn() for className merging?

Report ALL findings.
```

- [ ] **Step 3: Dispatch RTL/i18n Auditor agent (parallel with Steps 1-2)**

Prompt the agent with:

```
You are the RTL/i18n Auditor. Read your checklist from docs/audit/agents/rtl-i18n-auditor.md.

Audit shared infrastructure for RTL/i18n compliance:

1. Read frontend/src/i18n/index.ts — check config correctness
2. Grep ALL .tsx files in frontend/src/components/ for physical CSS properties:
   - Pattern: className="[^"]*\b(ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|rounded-l-|rounded-r-|border-l-|border-r-)[^"]*"
   - Each match is a finding (should use logical properties)
3. Read frontend/public/locales/en/translation.json and frontend/public/locales/ar/translation.json
   - Compare top-level keys — find any keys in EN missing from AR or vice versa
4. Grep for hardcoded font-family values (not using CSS variables)
5. Check layout components for dir attribute usage

For each violation, report using the standard format with agent: rtl-i18n-auditor, journey: 0-shared-infra.
Report ALL findings — this is critical for an Arabic-first app.
```

- [ ] **Step 4: Dispatch Responsive Auditor agent (parallel with Steps 1-3)**

Prompt the agent with:

```
You are the Responsive Auditor. Read your checklist from docs/audit/agents/responsive-auditor.md.

Audit shared layout components for mobile-first compliance:

1. Read these layout files fully:
   - frontend/src/components/layout/MainLayout.tsx
   - frontend/src/components/layout/AppSidebar.tsx
   - frontend/src/components/layout/SiteHeader.tsx
   - frontend/src/components/layout/MobileBottomTabBar.tsx
   - frontend/src/components/layout/EntityBreadcrumbTrail.tsx

2. For each file, check:
   - Are base styles mobile-first? (no desktop-first patterns like lg:block without mobile base)
   - Touch targets >= 44x44px on all interactive elements?
   - Breakpoint order correct? (base → sm: → md: → lg:)

3. Read frontend/src/components/ui/context-aware-fab.tsx — does FAB overlap with MobileBottomTabBar?

4. Grep frontend/src/components/ for potential overflow issues:
   - Fixed widths without max-width
   - Absolute positioning without responsive guards

Report using standard format with agent: responsive-auditor, journey: 0-shared-infra.
```

- [ ] **Step 5: Dispatch Data Flow Auditor agent (parallel with Steps 1-4)**

Prompt the agent with:

```
You are the Data Flow Auditor. Read your checklist from docs/audit/agents/data-flow-auditor.md.

Audit shared data infrastructure:

1. Read frontend/src/store/authStore.ts — check for server state in Zustand (should be in TanStack Query)
2. Read frontend/src/contexts/auth.context.tsx — check error handling, token refresh
3. Read frontend/src/contexts/ChatContext.tsx — check subscription cleanup
4. Read frontend/src/contexts/dossier-context.tsx — check data flow patterns
5. Read frontend/src/routes/_protected.tsx — check auth guard, error handling, loading state
6. Read frontend/src/lib/supabase.ts — check client configuration
7. List all files in frontend/src/domains/ and read index files to understand domain module structure

For each file, check against your checklist items for:
- Error handling completeness
- Loading state coverage
- Floating promises
- Missing cache invalidation patterns
- Auth token handling

Report using standard format with agent: data-flow-auditor, journey: 0-shared-infra.
```

- [ ] **Step 6: Dispatch Navigation Auditor agent (parallel with Steps 1-5)**

Prompt the agent with:

```
You are the Navigation Auditor. Read your checklist from docs/audit/agents/navigation-auditor.md.

Audit shared navigation infrastructure:

1. Read frontend/src/components/layout/AppSidebar.tsx — extract all navigation links, verify each points to a valid route file
2. Read frontend/src/components/layout/MobileBottomTabBar.tsx — extract all tab links, verify each is valid
3. Read frontend/src/components/layout/EntityBreadcrumbTrail.tsx — check breadcrumb generation logic
4. Read frontend/src/lib/dossier-routes.ts — verify getDossierRouteSegment() covers all 8 dossier types
5. Read frontend/src/routes/__root.tsx — check root layout, 404 handling
6. Read frontend/src/routes/_protected.tsx — check redirect behavior for unauthenticated users
7. List all route files in frontend/src/routes/_protected/ — check for orphaned or duplicate routes

Report using standard format with agent: navigation-auditor, journey: 0-shared-infra.
Flag any sidebar link that doesn't match a route file as CRITICAL.
```

- [ ] **Step 7: Merge all 6 agent outputs into journey document**

Create `docs/audit/journeys/0-shared-infra.md` with this structure:

```markdown
# Journey 0 — Shared Infrastructure Audit

**Date:** 2026-04-10
**Status:** Code audit complete, browser verification pending
**Agents:** All 6

## Summary

- Critical: {count}
- Warning: {count}
- Info: {count}

## Findings by Agent

### Theme Auditor

{paste findings}

### Component Auditor

{paste findings}

### RTL/i18n Auditor

{paste findings}

### Responsive Auditor

{paste findings}

### Data Flow Auditor

{paste findings}

### Navigation Auditor

{paste findings}
```

- [ ] **Step 8: Commit journey 0 findings**

```bash
git add docs/audit/journeys/0-shared-infra.md
git commit -m "audit(0): shared infrastructure code audit — 6 agents

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Journey 0 — Browser Verification

**Files:**

- Modify: `docs/audit/journeys/0-shared-infra.md` (add browser findings)

Browser verification of critical/warning findings from Task 1.

- [ ] **Step 1: Start dev servers**

Verify both servers are running:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

If not running, start them:

```bash
cd frontend && pnpm dev &
cd backend && pnpm dev &
```

- [ ] **Step 2: Browser — check theme in light mode**

Using Chrome MCP:

1. Navigate to `http://localhost:5173`
2. Take screenshot of login page (light mode)
3. Login with test credentials
4. Take screenshot of dashboard/main page (light mode)
5. Capture console errors/warnings
6. Check: Are colors consistent? Any invisible text? Broken borders?

- [ ] **Step 3: Browser — check theme in dark mode**

1. Toggle to dark mode via theme toggle
2. Take screenshot of same pages
3. Capture console errors
4. Check: Do all elements have dark mode styling? Any flash of white? Contrast issues?

- [ ] **Step 4: Browser — check RTL layout**

1. Switch language to Arabic
2. Take screenshot of dashboard in Arabic
3. Check: Does layout flip? Are fonts correct (Readex Pro)? Any misaligned elements?
4. Check: Does sidebar flow correctly in RTL?

- [ ] **Step 5: Browser — check mobile viewport**

1. Resize browser to 375px width (iPhone SE)
2. Take screenshot
3. Check: Does sidebar collapse? Does bottom tab bar appear? Any horizontal overflow?
4. Check: Are touch targets large enough?

- [ ] **Step 6: Add browser findings to journey document**

Append a `## Browser Verification` section to `docs/audit/journeys/0-shared-infra.md` with:

- Screenshots referenced
- Console errors captured
- Any new findings not caught by code analysis

- [ ] **Step 7: Commit updated journey 0**

```bash
git add docs/audit/journeys/0-shared-infra.md
git commit -m "audit(0): browser verification complete

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Journey 1 — Dossier Creation & Management

**Files:**

- Create: `docs/audit/journeys/1-dossier-crud.md`

**Relevant agents:** Theme, Component, RTL, Data Flow

**Journey scope — files to audit:**

- `frontend/src/routes/_protected/dossiers/` (all route files)
- `frontend/src/routes/_protected/dossiers/create.tsx` (creation flow)
- `frontend/src/domains/dossiers/` (hooks, repositories, types)
- `frontend/src/components/Dossier/` (dossier-specific components)
- `frontend/src/components/ui/form-wizard.tsx` (if used in creation)
- Any form components used in dossier creation

**Journey steps to trace:**

1. Navigate to dossier list page
2. Click "Create" (FAB or button)
3. Select dossier type
4. Fill in form fields
5. Submit form
6. View created dossier
7. Edit dossier
8. Navigate back to list

- [ ] **Step 1: Dispatch Theme Auditor for dossier routes**

```
You are the Theme Auditor. Read your checklist from docs/audit/agents/theme-auditor.md.

Audit dossier-specific components for theme compliance:
1. Read all files in frontend/src/routes/_protected/dossiers/
2. Read all files in frontend/src/components/Dossier/
3. Check for hardcoded colors, missing theme tokens, dark mode issues

Focus on:
- Form field styling (inputs, selects, textareas)
- Card/container backgrounds
- Button variants used in dossier CRUD
- Status badges and type indicators

Report using standard format with journey: 1-dossier-crud.
Only report NEW findings not already covered in journey 0.
```

- [ ] **Step 2: Dispatch Component Auditor for dossier components (parallel)**

```
You are the Component Auditor. Read your checklist from docs/audit/agents/component-auditor.md.

Audit dossier-specific components:
1. Read all files in frontend/src/components/Dossier/ — list each component and its props
2. Read frontend/src/routes/_protected/dossiers/create.tsx — trace the creation flow
3. Check which UI components are imported and whether they're used correctly
4. Verify DossierTypeSelector, UniversalDossierCard, DossierContextBadge work correctly

Focus on:
- Are form components properly wired (FormField → FormControl → Input)?
- Do cards render all required fields?
- Are there prop type mismatches?
- Missing key props on lists?

Report using standard format with journey: 1-dossier-crud.
```

- [ ] **Step 3: Dispatch RTL/i18n Auditor for dossier routes (parallel)**

```
You are the RTL/i18n Auditor. Read your checklist from docs/audit/agents/rtl-i18n-auditor.md.

Audit dossier pages for RTL compliance:
1. Grep all files in frontend/src/routes/_protected/dossiers/ and frontend/src/components/Dossier/ for physical properties (ml-, mr-, pl-, pr-, text-left, text-right, left-, right-)
2. Check for hardcoded English strings (should use t() function)
3. Verify form labels, placeholders, and validation messages are translated
4. Check icon directions in dossier components

Report using standard format with journey: 1-dossier-crud.
```

- [ ] **Step 4: Dispatch Data Flow Auditor for dossier data (parallel)**

```
You are the Data Flow Auditor. Read your checklist from docs/audit/agents/data-flow-auditor.md.

Audit the dossier data flow end-to-end:
1. Read frontend/src/domains/dossiers/ — all files (hooks, repositories, types, services)
2. Read frontend/src/routes/_protected/dossiers/create.tsx — trace form submission
3. Read relevant dossier route files that show/edit dossiers

Check specifically:
- Does create mutation invalidate the dossier list query?
- Is there proper loading state during creation?
- Does error handling show translated error messages?
- Are there floating promises in submit handlers?
- Does the form disable the submit button during mutation?
- What happens on network failure during creation?
- Is there validation before the API call?

Report using standard format with journey: 1-dossier-crud.
```

- [ ] **Step 5: Merge findings into journey document**

Create `docs/audit/journeys/1-dossier-crud.md` with same structure as journey 0 but only the 4 relevant agents.

- [ ] **Step 6: Browser verification — dossier creation flow**

Using Chrome MCP:

1. Navigate to dossier list
2. Screenshot the list page (light + dark mode)
3. Click create, screenshot the form
4. Fill in fields, check form validation visually
5. Submit, verify redirect to new dossier view
6. Screenshot the dossier detail page
7. Switch to Arabic, repeat screenshots
8. Capture all console errors throughout

- [ ] **Step 7: Add browser findings and commit**

```bash
git add docs/audit/journeys/1-dossier-crud.md
git commit -m "audit(1): dossier creation & management — code + browser

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Journey 2 — Dossier Browsing & Filtering

**Files:**

- Create: `docs/audit/journeys/2-dossier-browse.md`

**Relevant agents:** Theme, Component, Responsive, Navigation

**Journey scope — files to audit:**

- `frontend/src/routes/_protected/dossiers/index.tsx` (list page)
- `frontend/src/routes/_protected/dossiers/countries/`, `organizations/`, `forums/`, `persons/`, `elected-officials/`, `topics/`, `working-groups/`
- Search/filter components used in dossier listing
- Pagination components

**Journey steps to trace:**

1. Navigate to dossier list
2. Browse different dossier type tabs
3. Use search/filter
4. Paginate through results
5. Click a dossier to view details
6. Use breadcrumbs to navigate back
7. Test on mobile viewport

- [ ] **Step 1: Dispatch Theme + Component + Responsive + Navigation agents in parallel**

Each agent scans the dossier browsing files listed above, using their respective checklists. Navigation auditor focuses on: link correctness between list → detail → back, breadcrumb accuracy for each dossier type, tab navigation between dossier categories.

- [ ] **Step 2: Merge findings into journey document**

- [ ] **Step 3: Browser verification — browsing flow (desktop + mobile + RTL)**

- [ ] **Step 4: Commit journey 2**

```bash
git add docs/audit/journeys/2-dossier-browse.md
git commit -m "audit(2): dossier browsing & filtering

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Journey 3 — Engagement Lifecycle

**Files:**

- Create: `docs/audit/journeys/3-engagement-lifecycle.md`

**Relevant agents:** Data Flow, Component, RTL, Navigation

**Journey scope — files to audit:**

- `frontend/src/routes/_protected/engagements/` (all route files)
- `frontend/src/routes/_protected/after-actions/` (after-action records)
- `frontend/src/domains/engagements/`, `frontend/src/domains/after-actions/`
- Calendar integration components
- Engagement-specific components

**Journey steps to trace:**

1. Create an engagement (from dossier context)
2. View engagement details (participants, documents, timeline)
3. Complete the engagement
4. Generate after-action record
5. View after-action with commitments
6. Navigate between engagement ↔ after-action ↔ dossier

- [ ] **Step 1: Dispatch 4 agents in parallel (Data Flow, Component, RTL, Navigation)**

Data Flow auditor focuses on: engagement creation mutation, after-action generation flow, commitment tracking queries, calendar data sync. Navigation auditor focuses on: engagement → after-action linking, breadcrumb accuracy through the lifecycle, redirect after creation/completion.

- [ ] **Step 2: Merge findings**
- [ ] **Step 3: Browser verification — engagement lifecycle**
- [ ] **Step 4: Commit journey 3**

```bash
git add docs/audit/journeys/3-engagement-lifecycle.md
git commit -m "audit(3): engagement lifecycle

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Journey 4 — My Work / Task Board

**Files:**

- Create: `docs/audit/journeys/4-work-board.md`

**Relevant agents:** Component, Data Flow, Responsive

**Journey scope — files to audit:**

- `frontend/src/routes/_protected/my-work/`
- `frontend/src/routes/_protected/tasks/`
- `frontend/src/components/ui/kanban.tsx`
- `frontend/src/domains/tasks/`, `frontend/src/domains/work-items/`
- Drag-and-drop integration (@dnd-kit)

**Journey steps to trace:**

1. Navigate to My Work dashboard
2. View Kanban board with columns (todo, in_progress, review, done)
3. Drag a card between columns
4. Click a work item to view details
5. Create a new task
6. Filter/sort the board
7. Test on mobile (drag-drop fallback?)

- [ ] **Step 1: Dispatch 3 agents in parallel (Component, Data Flow, Responsive)**

Component auditor focuses on: kanban.tsx correctness (30KB+ file — check for complexity issues), drag-drop handler wiring, card rendering. Responsive auditor focuses on: kanban on mobile (does it scroll horizontally? are columns stacked?), touch-friendly drag-drop.

- [ ] **Step 2: Merge findings**
- [ ] **Step 3: Browser verification — kanban interaction**
- [ ] **Step 4: Commit journey 4**

```bash
git add docs/audit/journeys/4-work-board.md
git commit -m "audit(4): my work / task board

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Journey 5 — Login → Dashboard → Navigate

**Files:**

- Create: `docs/audit/journeys/5-login-dashboard.md`

**Relevant agents:** Navigation, Theme, Responsive, Data Flow

**Journey scope — files to audit:**

- `frontend/src/routes/login.tsx` (or equivalent auth route)
- `frontend/src/routes/_protected/index.tsx` (dashboard)
- `frontend/src/store/authStore.ts`
- `frontend/src/contexts/auth.context.tsx`
- All navigation components (sidebar, header, mobile nav)

**Journey steps to trace:**

1. Load app while logged out → should redirect to login
2. Login with credentials
3. Land on dashboard
4. Navigate via sidebar to different sections
5. Use mobile bottom tab bar
6. Logout
7. Try accessing protected route while logged out

- [ ] **Step 1: Dispatch 4 agents in parallel**

Navigation auditor focuses on: login redirect flow, post-login destination, sidebar link verification, deep link access. Data Flow auditor focuses on: auth token handling, session persistence, dashboard initial data load.

- [ ] **Step 2: Merge findings**
- [ ] **Step 3: Browser verification — full auth + navigation flow**
- [ ] **Step 4: Commit journey 5**

```bash
git add docs/audit/journeys/5-login-dashboard.md
git commit -m "audit(5): login, dashboard, navigation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Journey 6 — Settings & Admin

**Files:**

- Create: `docs/audit/journeys/6-settings-admin.md`

**Relevant agents:** Data Flow, Component, RTL

**Journey scope — files to audit:**

- `frontend/src/routes/_protected/settings/`
- `frontend/src/routes/_protected/admin/`
- Settings form components
- Admin panel components (AI settings, permissions, data retention)

**Journey steps to trace:**

1. Navigate to Settings
2. Change settings (calendar, notifications, language)
3. Navigate to Admin panel
4. View AI usage settings
5. Check field permissions
6. All in Arabic mode too

- [ ] **Step 1: Dispatch 3 agents in parallel (Data Flow, Component, RTL)**

Data Flow auditor focuses on: settings save mutation, admin API calls, error handling for permission-denied scenarios. RTL auditor focuses on: settings form labels and inputs in Arabic, admin table layouts in RTL.

- [ ] **Step 2: Merge findings**
- [ ] **Step 3: Browser verification — settings + admin**
- [ ] **Step 4: Commit journey 6**

```bash
git add docs/audit/journeys/6-settings-admin.md
git commit -m "audit(6): settings & admin

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Journey 7 — AI Chat & Briefings

**Files:**

- Create: `docs/audit/journeys/7-ai-chat.md`

**Relevant agents:** Component, Data Flow, Theme

**Journey scope — files to audit:**

- `frontend/src/contexts/ChatContext.tsx`
- ChatDock component (find via grep for ChatDock)
- AI briefing components
- `frontend/src/utils/ai-errors.ts`
- Any AnythingLLM integration files

**Journey steps to trace:**

1. Open ChatDock from any page
2. Send a message
3. Receive AI response (streaming?)
4. Check error handling when AI is unavailable
5. Generate a briefing for a dossier
6. View briefing output

- [ ] **Step 1: Dispatch 3 agents in parallel (Component, Data Flow, Theme)**

Data Flow auditor focuses on: chat message send/receive flow, streaming response handling, error states when AnythingLLM is down, briefing generation API call. Theme auditor focuses on: ChatDock theming in dark/light mode, message bubble styling.

- [ ] **Step 2: Merge findings**
- [ ] **Step 3: Browser verification — chat + briefing flow**
- [ ] **Step 4: Commit journey 7**

```bash
git add docs/audit/journeys/7-ai-chat.md
git commit -m "audit(7): AI chat & briefings

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Consolidate Master Audit

**Files:**

- Modify: `docs/audit/MASTER-AUDIT.md`

- [ ] **Step 1: Read all 8 journey documents**

Read every file in `docs/audit/journeys/` and collect all findings.

- [ ] **Step 2: Deduplicate findings**

Same issue found in multiple journeys → merge into one finding with `Affects: [journey-0, journey-1, journey-3]`.

- [ ] **Step 3: Categorize by fix layer**

Group all findings into these categories (the fix execution order):

1. **Theme tokens & CSS variables** (theme-auditor findings)
2. **Shared UI components** (component-auditor findings in ui/ files)
3. **Layout shell** (responsive-auditor + navigation-auditor findings in layout/ files)
4. **i18n / RTL corrections** (rtl-i18n-auditor findings)
5. **Per-journey route fixes** (findings specific to one route)

- [ ] **Step 4: Prioritize within each category**

Within each category, order by:

1. CRITICAL first
2. WARNING second
3. INFO last
4. Within same severity: more journeys affected → higher priority

- [ ] **Step 5: Write the consolidated MASTER-AUDIT.md**

Update with:

- Journey progress table (all marked complete)
- Findings summary counts
- Consolidated findings organized by fix layer → severity → impact
- Each finding with a unique ID (e.g., T-01 for theme, C-01 for component, R-01 for RTL, etc.)

- [ ] **Step 6: Commit master audit**

```bash
git add docs/audit/MASTER-AUDIT.md
git commit -m "audit: consolidate master audit — all 8 journeys complete

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Fix Execution Plan

**Files:**

- Create: `docs/audit/FIX-PLAN.md`

After the master audit is consolidated, create a concrete fix plan.

- [ ] **Step 1: Read MASTER-AUDIT.md**

- [ ] **Step 2: Create fix plan with batched changes**

For each fix layer, create a batch:

```markdown
# Fix Plan

## Batch 1: Theme Tokens & CSS Variables

Estimated files: {count}
Findings: T-01, T-02, ...

### Fix T-01: {description}

- File: {path}
- Change: {specific change}
- Verify: {how to verify}

## Batch 2: Shared UI Components

...

## Batch 3: Layout Shell

...

## Batch 4: i18n / RTL

...

## Batch 5: Per-Journey Route Fixes

...
```

- [ ] **Step 3: Commit fix plan**

```bash
git add docs/audit/FIX-PLAN.md
git commit -m "audit: create dependency-ordered fix plan

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Execution Notes

- **Tasks 1-9** each dispatch 3-6 agents in parallel — use the Agent tool with `run_in_background: false` for the parallel dispatches within each task
- **Task 2** (and browser steps in Tasks 3-9) require dev servers running and Chrome MCP available
- **Task 10** is a synthesis task — no agents, just merging and organizing
- **Task 11** produces the actionable fix plan that drives the actual code changes
- Each task commits its output so progress is never lost
- If an agent's findings are empty (all PASS), note that in the journey doc — it's still a valid result
