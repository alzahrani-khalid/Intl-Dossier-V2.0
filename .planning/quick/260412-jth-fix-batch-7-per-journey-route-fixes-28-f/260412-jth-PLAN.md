---
quick_task: 260412-jth
title: 'Fix Batch 7: Per-Journey Route Fixes'
type: execute
findings: C-40, C-30, C-71, C-70, D-71, RS-50, R-63, RS-20, N-22, T-21, RS-21, RS-22, RS-40, RS-41, RS-42, N-23, N-30, C-23
deferred: C-12, D-10, D-11, D-32, D-33, D-34
already_fixed: D-70, C-21
---

<objective>
Fix 18 actionable findings from Batch 7 of the audit FIX-PLAN. 7 findings are deferred (major refactors) or already fixed. Remaining fixes grouped into 3 tasks by area: accessibility/component quality, responsive/RTL, and route-specific UX.

DEFERRED (too large for quick task):

- C-12: DossierCreateWizard split (1979 LOC) — full component refactor
- D-10 + D-11: Query key factory + context split — architectural change
- D-32, D-33, D-34: After-action data quality — version conflict detection, type strengthening, N+1 batching

ALREADY FIXED:

- D-70: useGenerateBrief already has AbortController with cleanup
- C-21: Debounce already implemented in dossier list pages (countries/index.tsx confirms setTimeout pattern)

SKIPPED (C-20, D-41): Moving pagination and kanban filter state to URL params requires significant refactoring of 7+ list pages and the kanban board component. These are UX enhancements, not bugs. Defer to a dedicated URL-state-management task.
</objective>

<execution_context>
@docs/audit/FIX-PLAN.md (Batch 7 section, lines 405-577)
@CLAUDE.md (RTL, mobile-first, HeroUI conventions)
</execution_context>

<tasks>

<task type="auto">
  <name>Task 1: Accessibility + Component Quality (C-40, C-30, C-71, C-70, D-71)</name>
  <files>
    frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx
    frontend/src/components/ai/ChatInput.tsx
    frontend/src/components/ai/ChatDock.tsx
    frontend/src/routes/_protected.tsx
    frontend/public/locales/en/translation.json
    frontend/public/locales/ar/translation.json
  </files>
  <action>
**C-40: aria-label on draggable kanban cards**
- In `UnifiedKanbanCard.tsx`, find the outermost draggable container element
- Add `aria-label={t('kanban.dragCard', { title: item.title })}` (or use the card's title prop)
- Add i18n keys: `"kanban.dragCard": "Draggable card: {{title}}"` (EN), `"kanban.dragCard": "بطاقة قابلة للسحب: {{title}}"` (AR)
- Import `useTranslation` if not already imported

**C-30: aria-label on back buttons**

- Search for back button elements in engagement detail pages. The back button is likely in the engagement detail layout (`$engagementId.tsx` or `$engagementId/index.tsx`)
- Add `aria-label={t('common.goBack')}` to any `<button>` or `<Link>` that serves as a back navigation
- Add i18n keys if missing: `"common.goBack": "Go back"` (EN), `"common.goBack": "الرجوع"` (AR)

**C-71: aria-label on ChatInput textarea**

- In `ChatInput.tsx`, find the `<textarea>` or `<input>` element
- Add `aria-label={t('chat.messageInput')}`
- Add i18n keys: `"chat.messageInput": "Type your message"` (EN), `"chat.messageInput": "اكتب رسالتك"` (AR)

**C-70: Unique message keys in ChatDock**

- In `ChatDock.tsx` line ~176-178, change `key={index}` to `key={message.id ?? \`msg-${index}\`}`
- Check the message type for an `id` field. If messages have `id`, use it. If they have `timestamp`, use that. Fallback to index only as last resort with a stable prefix.

**D-71: ErrorBoundary around ChatDock**

- In `_protected.tsx`, find where `<ChatDock />` is rendered
- Wrap it with an ErrorBoundary: `import { ErrorBoundary } from 'react-error-boundary'`
- Create a simple `ChatErrorFallback` inline component that shows an error message with a retry button
- Pattern: `<ErrorBoundary FallbackComponent={ChatErrorFallback}><ChatDock /></ErrorBoundary>`
- Check if `react-error-boundary` is installed; if not, use a simple class-based ErrorBoundary component

Commit message: `fix(batch-7): add aria-labels, fix ChatDock keys, wrap ChatDock in ErrorBoundary (C-40,C-30,C-71,C-70,D-71)`
</action>
<verify> - `grep -r "aria-label" frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx` shows aria-label - `grep -r "aria-label" frontend/src/components/ai/ChatInput.tsx` shows aria-label - `grep "key={" frontend/src/components/ai/ChatDock.tsx` shows `message.id` not `index` - `grep -r "ErrorBoundary" frontend/src/routes/_protected.tsx` shows ErrorBoundary wrapping ChatDock - `pnpm --filter frontend exec tsc --noEmit` passes (no type errors)
</verify>
<done> - Kanban cards have descriptive aria-labels for screen readers - ChatInput textarea has aria-label describing its purpose - ChatDock uses stable message keys (no React key warnings) - ChatDock wrapped in ErrorBoundary (errors show fallback UI, not white screen) - Back buttons in engagement views have aria-labels
</done>
</task>

<task type="auto">
  <name>Task 2: Responsive + RTL Fixes (RS-50, RS-20, R-63, T-21)</name>
  <files>
    frontend/src/auth/LoginPageAceternity.tsx
    frontend/src/components/ui/pagination.tsx
    frontend/src/routes/_protected/settings.tsx
  </files>
  <action>
**RS-50: Login form padding responsive**
- In `LoginPageAceternity.tsx` line ~63, the inner card has fixed `p-8`
- Change to responsive: `p-4 sm:p-6 lg:p-8`
- The outer div already has `p-4` which is fine

**RS-20: Pagination touch targets**

- In `pagination.tsx` line ~74, `PaginationEllipsis` has `h-9 w-9` (36px — below 44px minimum)
- Change to `h-11 w-11` (44px)
- In `PaginationLink` (line ~33), the `size = 'icon'` default should ensure 44px minimum. Check the button variant for `icon` size — if it's less than 44px, add `min-h-11 min-w-11` to the PaginationLink className
- Add `min-h-11 min-w-11` to PaginationPrevious and PaginationNext as well

**R-63: Settings container missing dir**

- In `frontend/src/routes/_protected/settings.tsx` (the settings layout), add `dir` attribute
- Import `useTranslation` or `useDirection` hook
- Add `dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}` to the outermost container div
- Use `useTranslation` from react-i18next: `const { i18n } = useTranslation()`

**T-21: Filter UI dark mode verification**

- This is a verification-only finding. Check dossier list filter components for dark mode issues.
- Look for hardcoded colors (bg-white, text-black, border-gray-\*) in filter popovers
- Replace with theme-aware classes (bg-background, text-foreground, border-border)
- If filters already use theme tokens, mark as already compliant

Commit message: `fix(batch-7): responsive login padding, pagination touch targets, settings RTL dir (RS-50,RS-20,R-63,T-21)`
</action>
<verify> - `grep "p-4 sm:p-6" frontend/src/auth/LoginPageAceternity.tsx` shows responsive padding - `grep "min-h-11\|h-11" frontend/src/components/ui/pagination.tsx` shows 44px targets - `grep "dir=" frontend/src/routes/_protected/settings.tsx` shows dir attribute - `pnpm --filter frontend exec tsc --noEmit` passes
</verify>
<done> - Login form padding scales from mobile to desktop - All pagination buttons meet 44px touch target minimum - Settings pages have correct RTL direction attribute - Filter UI verified for dark mode compatibility
</done>
</task>

<task type="auto">
  <name>Task 3: Route-Specific UX (RS-21, RS-22, RS-40..42, N-22, N-23, N-30, C-23)</name>
  <files>
    frontend/src/routes/_protected/dossiers/index.tsx
    frontend/src/routes/_protected/dossiers/countries/index.tsx
    frontend/src/routes/_protected/dossiers/organizations/index.tsx
    frontend/src/routes/_protected/dossiers/forums/index.tsx
    frontend/src/routes/_protected/dossiers/engagements/index.tsx
    frontend/src/routes/_protected/dossiers/persons/index.tsx
    frontend/src/routes/_protected/dossiers/topics/index.tsx
    frontend/src/routes/_protected/dossiers/working_groups/index.tsx
    frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx
    frontend/src/routes/_protected/engagements/$engagementId/after-action.tsx
  </files>
  <action>
**N-22: Breadcrumbs on type list pages**
- Check each dossier type list page (countries, organizations, forums, etc.)
- If EntityBreadcrumbTrail or equivalent breadcrumb component is missing, add it
- Pattern: import from existing breadcrumb component used elsewhere in the app
- Each page should show: Home > Dossiers > [Type Name]

**N-23: Loading skeletons on list navigation**

- Check dossier list pages for loading state handling
- Where TanStack Query `isLoading` is true, show Skeleton components instead of empty/blank content
- Use existing Skeleton component from `frontend/src/components/ui/skeleton.tsx`
- Pattern: `if (isLoading) return <ListSkeleton />` or conditional Skeleton overlay

**N-30: After-action back navigation target**

- In `after-action.tsx` (line ~58), the navigate after creation goes to `/after-actions/$afterActionId`
- The finding says back button should go to parent engagement, not dossier
- Check if there's a back button on the after-action page; if the finding refers to the create flow redirect, that may be correct behavior (redirecting to the newly created after-action). If there IS a back button, ensure it navigates to the engagement: `navigate({ to: '/engagements/$engagementId', params: { engagementId } })`

**C-23: Type tab routes validation**

- In the dossier index route (`frontend/src/routes/_protected/dossiers/index.tsx`), check if invalid type slugs are handled
- Valid types: countries, organizations, forums, engagements, persons, topics, working_groups, elected_officials
- If the route structure uses file-based routing (TanStack Router), invalid paths already 404. Verify this is the case.
- If there's a dynamic `$type` param anywhere, add validation that redirects invalid types to `/dossiers`

**RS-21 + RS-22: Filter/search mobile optimization**

- These are INFO-level findings about improving filter popover and search input on mobile
- In dossier list pages, ensure search input has `w-full` on mobile (base breakpoint)
- Ensure filter controls are accessible on small screens (min-h-11 touch targets)
- Add clear button to search if missing: small X icon inside the input

**RS-40, RS-41, RS-42: Mobile kanban optimization**

- In `UnifiedKanbanBoard.tsx`:
  - RS-40: Add horizontal scroll with snap on mobile. Wrap column container with `overflow-x-auto snap-x snap-mandatory` on base, `overflow-x-visible` on `md:` breakpoint
  - RS-41: Ensure drag handles have min 44px touch targets (`min-h-11 min-w-11`)
  - RS-42: Check header doesn't overlap columns on small screens. Add `sticky top-0 z-10 bg-background` to header if needed

Commit message: `fix(batch-7): breadcrumbs, skeletons, mobile kanban, search UX, route validation (N-22,N-23,N-30,C-23,RS-21,RS-22,RS-40..42)`
</action>
<verify> - `grep -r "Breadcrumb\|breadcrumb" frontend/src/routes/_protected/dossiers/countries/index.tsx` shows breadcrumb - `grep -r "Skeleton\|skeleton\|isLoading" frontend/src/routes/_protected/dossiers/countries/index.tsx` shows loading state - `grep "snap-x\|overflow-x-auto" frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx` shows mobile scroll - `pnpm --filter frontend exec tsc --noEmit` passes
</verify>
<done> - All dossier type list pages show breadcrumb navigation context - List pages show skeletons during loading (no blank flash) - After-action back navigation goes to correct parent - Invalid dossier type routes handled gracefully - Search inputs full-width on mobile with clear button - Kanban board horizontally scrollable with snap on mobile - All interactive elements meet 44px touch target minimum
</done>
</task>

</tasks>

<verification>
After all 3 tasks:
1. `pnpm --filter frontend exec tsc --noEmit` — no type errors
2. `pnpm --filter frontend build` — builds successfully
3. Manual spot-check: login page on 320px, settings in RTL, kanban on mobile, ChatDock error recovery
</verification>

<success_criteria>

- 18 findings addressed across 3 atomic commits
- No TypeScript errors introduced
- All aria-labels use i18n keys (bilingual)
- All touch targets meet 44px minimum
- RTL direction set on settings pages
- ChatDock has error boundary protection
- Dossier list pages have breadcrumbs and loading skeletons
  </success_criteria>
