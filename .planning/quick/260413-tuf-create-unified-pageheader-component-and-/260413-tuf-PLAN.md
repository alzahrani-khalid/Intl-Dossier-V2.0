---
phase: quick
plan: 260413-tuf
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/layout/PageHeader.tsx
  - frontend/src/pages/activity/ActivityPage.tsx
  - frontend/src/pages/audit-logs/AuditLogsPage.tsx
  - frontend/src/pages/engagements/EngagementsListPage.tsx
  - frontend/src/pages/forums/ForumsPage.tsx
  - frontend/src/pages/my-work/MyWorkDashboard.tsx
  - frontend/src/pages/advanced-search/AdvancedSearchPage.tsx
  - frontend/src/pages/Briefs/BriefsPage.tsx
  - frontend/src/pages/IntakeQueue.tsx
  - frontend/src/pages/WaitingQueue.tsx
  - frontend/src/pages/MyTasks.tsx
  - frontend/src/pages/notifications/NotificationsPage.tsx
  - frontend/src/pages/users/UsersListPage.tsx
  - frontend/src/pages/analytics/AnalyticsDashboardPage.tsx
  - frontend/src/pages/help/HelpPage.tsx
  - frontend/src/pages/contacts/ContactsDirectory.tsx
  - frontend/src/pages/WorkingGroupsPage.tsx
  - frontend/src/pages/persons/PersonsListPage.tsx
  - frontend/src/pages/persons/PersonCreatePage.tsx
  - frontend/src/pages/export-import/ExportImportPage.tsx
  - frontend/src/pages/relationships/RelationshipGraphPage.tsx
  - frontend/src/pages/sla-monitoring/SLADashboardPage.tsx
  - frontend/src/pages/webhooks/WebhooksPage.tsx
  - frontend/src/pages/briefing-books/BriefingBooksPage.tsx
  - frontend/src/pages/delegations/DelegationManagementPage.tsx
  - frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx
  - frontend/src/pages/workflow-automation/WorkflowAutomationPage.tsx
  - frontend/src/routes/_protected/after-actions/index.tsx
  - frontend/src/routes/_protected/tags.tsx
  - frontend/src/routes/_protected/legislation.tsx
  - frontend/src/routes/_protected/approvals/index.tsx
  - frontend/src/routes/_protected/dossiers/engagements/index.tsx
autonomous: true
must_haves:
  truths:
    - 'Every list/index page uses the same PageHeader component with consistent sizing'
    - 'All h1 titles render at text-2xl sm:text-3xl font-bold'
    - 'Icons are mono text-muted-foreground, never colored badges'
    - 'Action buttons sit in a flex row to the end of the header on desktop, stack on mobile'
  artifacts:
    - path: 'frontend/src/components/layout/PageHeader.tsx'
      provides: 'Reusable PageHeader component'
      exports: ['PageHeader']
    - path: 'frontend/src/pages/activity/ActivityPage.tsx'
      provides: 'Activity page using PageHeader'
      contains: 'PageHeader'
  key_links:
    - from: 'frontend/src/pages/*/Page.tsx'
      to: 'frontend/src/components/layout/PageHeader.tsx'
      via: 'import { PageHeader }'
      pattern: 'import.*PageHeader.*from.*layout/PageHeader'
---

<objective>
Create a unified PageHeader component and roll it out across all list/index pages to eliminate header inconsistencies (icon styling, h1 sizing, subtitle treatment, action button placement, wrapper elements).

Purpose: Every page gets a consistent header — same sizing, same icon treatment, same action button placement — improving visual coherence across the app.
Output: One PageHeader component adopted by ~31 pages.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@frontend/src/components/layout/PageHeader.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create the PageHeader component</name>
  <files>frontend/src/components/layout/PageHeader.tsx</files>
  <action>
Create `frontend/src/components/layout/PageHeader.tsx` with the following implementation:

```tsx
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon != null && <span className="text-muted-foreground">{icon}</span>}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          {subtitle != null && (
            <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions != null && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </header>
  )
}
```

Key points:

- Use `cn` from existing `@/lib/utils` for class merging
- Use strict boolean checks (`!= null`) per project ESLint rule `strict-boolean-expressions`
- Explicit return type `React.JSX.Element` per project ESLint rule `explicit-function-return-type`
- RTL-safe: uses `gap` (bidirectional), no `ml-*`/`mr-*`/`pl-*`/`pr-*`
- No `border-b` — let page content handle its own separation
  </action>
  <verify>
  <automated>cd frontend && npx tsc --noEmit src/components/layout/PageHeader.tsx 2>&1 | head -20</automated>
  </verify>
  <done>PageHeader.tsx exists, exports PageHeader, passes TypeScript checks</done>
  </task>

<task type="auto">
  <name>Task 2: Roll out PageHeader across all list/index pages</name>
  <files>
    frontend/src/pages/activity/ActivityPage.tsx
    frontend/src/pages/audit-logs/AuditLogsPage.tsx
    frontend/src/pages/engagements/EngagementsListPage.tsx
    frontend/src/pages/forums/ForumsPage.tsx
    frontend/src/pages/my-work/MyWorkDashboard.tsx
    frontend/src/pages/advanced-search/AdvancedSearchPage.tsx
    frontend/src/pages/Briefs/BriefsPage.tsx
    frontend/src/pages/IntakeQueue.tsx
    frontend/src/pages/WaitingQueue.tsx
    frontend/src/pages/MyTasks.tsx
    frontend/src/pages/notifications/NotificationsPage.tsx
    frontend/src/pages/users/UsersListPage.tsx
    frontend/src/pages/analytics/AnalyticsDashboardPage.tsx
    frontend/src/pages/help/HelpPage.tsx
    frontend/src/pages/contacts/ContactsDirectory.tsx
    frontend/src/pages/WorkingGroupsPage.tsx
    frontend/src/pages/persons/PersonsListPage.tsx
    frontend/src/pages/persons/PersonCreatePage.tsx
    frontend/src/pages/export-import/ExportImportPage.tsx
    frontend/src/pages/relationships/RelationshipGraphPage.tsx
    frontend/src/pages/sla-monitoring/SLADashboardPage.tsx
    frontend/src/pages/webhooks/WebhooksPage.tsx
    frontend/src/pages/briefing-books/BriefingBooksPage.tsx
    frontend/src/pages/delegations/DelegationManagementPage.tsx
    frontend/src/pages/custom-dashboard/CustomDashboardPage.tsx
    frontend/src/pages/workflow-automation/WorkflowAutomationPage.tsx
    frontend/src/routes/_protected/after-actions/index.tsx
    frontend/src/routes/_protected/tags.tsx
    frontend/src/routes/_protected/legislation.tsx
    frontend/src/routes/_protected/approvals/index.tsx
    frontend/src/routes/_protected/dossiers/engagements/index.tsx
  </files>
  <action>
For each page listed above, apply this transformation:

1. **Read the file** to understand its current header pattern (h1, subtitle, icon, action buttons)
2. **Add import**: `import { PageHeader } from '@/components/layout/PageHeader'`
3. **Replace** the existing header block (the div/header/Card containing the h1, subtitle, and any action buttons) with a single `<PageHeader>` call
4. **Preserve** existing functionality:
   - Keep the same icon (lucide-react) but remove any colored background wrappers (`bg-primary/10`, `bg-blue-500/10`, etc.) — icon passes directly as `icon={<IconName className="h-6 w-6" />}`
   - Keep the same i18n title key via `t('...')` as the `title` prop
   - Keep the same i18n subtitle key (whether it was `subtitle`, `description`, or `pageSubtitle`) as the `subtitle` prop
   - Move any action buttons (create, export, filter toggles) into the `actions` prop
5. **Remove** now-unused imports (old wrapper components, unused cn calls for the header area)
6. **Do NOT modify** anything below the header (content area, tables, lists, cards, etc.)

Pattern to follow for each page:

```tsx
// BEFORE (varies per page):
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-primary/10 rounded-lg">
      <SomeIcon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
    </div>
  </div>
  <Button onClick={handleCreate}>{t('create')}</Button>
</div>

// AFTER:
<PageHeader
  icon={<SomeIcon className="h-6 w-6" />}
  title={t('title')}
  subtitle={t('subtitle')}
  actions={<Button onClick={handleCreate}>{t('create')}</Button>}
/>
```

Important rules:

- If the page had NO icon, omit the `icon` prop entirely
- If the page had NO subtitle, omit the `subtitle` prop
- If the page had NO action buttons, omit the `actions` prop
- If multiple action buttons exist, wrap them in a fragment: `actions={<>{btn1}{btn2}</>}`
- For route files (under `routes/_protected/`), the same pattern applies — find the header JSX and replace it
- Check if the dossier engagements index route re-uses EngagementsListPage or has its own header — only replace if it has a standalone header

DO NOT touch:

- Detail pages (PersonDetailPage, EngagementDetailPage, etc.)
- OperationsHub / dashboard with ActionBar greeting
- Settings pages (SettingsLayout has its own header)
- Modal/dialog headers
  </action>
  <verify>
  <automated>cd frontend && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>All 31 pages import and use PageHeader. No TypeScript errors. Headers are visually consistent: same h1 size, mono icons, action buttons in flex row.</done>
  </task>

</tasks>

<threat_model>

## Trust Boundaries

No new trust boundaries — this is a pure UI refactor with no data flow changes.

## STRIDE Threat Register

| Threat ID  | Category      | Component        | Disposition | Mitigation Plan                                                                                                         |
| ---------- | ------------- | ---------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| T-quick-01 | T (Tampering) | PageHeader props | accept      | Props are passed from parent components that already sanitize i18n output; no user input flows directly into PageHeader |

</threat_model>

<verification>
- `cd frontend && npx tsc --noEmit` passes with zero errors
- Grep confirms consistent usage: `grep -r "PageHeader" frontend/src/pages/ frontend/src/routes/_protected/ --include="*.tsx" -l` returns all 31 files
- Grep confirms no leftover colored icon wrappers in headers: `grep -rn "bg-primary/10.*icon\|bg-blue-500/10" frontend/src/pages/ --include="*.tsx"` returns no results in header areas
</verification>

<success_criteria>

- PageHeader component exists at `frontend/src/components/layout/PageHeader.tsx`
- All 31 listed pages use `<PageHeader>` for their header
- No page has a standalone h1 outside of PageHeader (in the listed pages)
- TypeScript compiles without errors
- All existing action buttons, icons, titles, and subtitles are preserved (just wrapped in PageHeader)
  </success_criteria>

<output>
After completion, create `.planning/quick/260413-tuf-create-unified-pageheader-component-and-/260413-tuf-SUMMARY.md`
</output>
