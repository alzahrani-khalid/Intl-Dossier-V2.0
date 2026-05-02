# Phase 42: remaining-pages — Pattern Map

**Mapped:** 2026-05-02
**Files analyzed:** 28 (12 modify + 16 new)
**Analogs found:** 26 / 28 (2 with no analog use handoff source verbatim)

## File Classification

### Wave 0 — Infrastructure (new files)

| New File                                                                                                                                                                        | Role                                | Data Flow                          | Closest Analog                                                                                                                             | Match                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `frontend/src/components/signature-visuals/Icon.tsx`                                                                                                                            | component (icon primitive)          | render-only                        | `frontend/design-system/inteldossier_handoff_design/src/icons.jsx` (handoff verbatim source)                                               | exact (verbatim port) |
| `supabase/functions/after-actions-list-all/index.ts`                                                                                                                            | edge-function (Deno serve)          | request-response (RLS-gated read)  | `supabase/functions/after-actions-list/index.ts`                                                                                           | exact role+flow       |
| `frontend/src/hooks/useAfterActionsAll.ts` (or appended)                                                                                                                        | hook (TanStack Query)               | request-response                   | `frontend/src/hooks/useAfterAction.ts` (`useAfterActions` line 181)                                                                        | exact                 |
| `frontend/src/i18n/en/{briefs-page,after-actions-page,tasks-page}.json` + AR                                                                                                    | locale resource                     | static-import                      | existing per-feature namespaces (e.g. `frontend/src/i18n/en/activity-feed.json`) + registration block in `frontend/src/i18n/index.ts:4-80` | role-match            |
| `frontend/tests/e2e/support/phase-42-fixtures.ts`                                                                                                                               | test-fixture (auth + seed helpers)  | request-response (Playwright Page) | `frontend/tests/e2e/support/dossier-drawer-fixture.ts` + `frontend/tests/e2e/support/list-pages-auth.ts`                                   | exact                 |
| `frontend/tests/e2e/{briefs,after-actions,tasks,activity,settings}-page-visual.spec.ts` (5)                                                                                     | test (Playwright visual regression) | none                               | `frontend/tests/e2e/list-pages-visual.spec.ts` (Phase 40-10) and `dossier-drawer-visual.spec.ts` (Phase 41-07)                             | exact                 |
| `frontend/tests/e2e/{briefs,after-actions,tasks,activity,settings}-page.spec.ts` (5)                                                                                            | test (Playwright functional E2E)    | request-response                   | `frontend/tests/e2e/list-pages-touch-targets.spec.ts` chrome + golden-path patterns from drawer specs                                      | role-match            |
| `frontend/tests/e2e/page-42-axe.spec.ts`                                                                                                                                        | test (axe-core a11y gate)           | none                               | `frontend/tests/e2e/dossier-drawer-axe.spec.ts`                                                                                            | exact                 |
| `frontend/tests/e2e/touch-targets-42.spec.ts`                                                                                                                                   | test (≥44×44 boundingBox)           | none                               | `frontend/tests/e2e/list-pages-touch-targets.spec.ts`                                                                                      | exact                 |
| Vitest harnesses: `BriefsPage.test.tsx`, `AfterActionsTable.test.tsx`, `MyTasksPage.test.tsx`, `ActivityList.test.tsx`, `SettingsLayout.test.tsx`, `useAfterActionsAll.test.ts` | test (unit/component)               | render                             | `frontend/src/components/list-page/__tests__/ListPageShell.test.tsx`                                                                       | exact                 |

### Wave 1 — Page Reskins (modify existing files)

| Modified File                                                             | Role                                | Data Flow                                   | Closest Analog (already-reskinned)                                                                                                                                                                                                                                                                                                 | Match                                   |
| ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `frontend/src/pages/Briefs/BriefsPage.tsx` (591 LOC → ~250)               | page (card grid + dialogs)          | request-response                            | `frontend/src/pages/engagements/EngagementsListPage.tsx` (Phase 40 LIST-04) for ListPageShell+useQuery wiring; handoff `pages.jsx#L295-329` for visual anatomy                                                                                                                                                                     | role-match (visual is verbatim handoff) |
| `frontend/src/routes/_protected/after-actions/index.tsx`                  | route + page (table)                | request-response                            | `frontend/src/components/list-page/ListPageShell.tsx` for `<header className="page-head">` + skeleton + empty-state pattern; handoff `pages.jsx#L331-365` for `.tbl` anatomy                                                                                                                                                       | role-match                              |
| `frontend/src/pages/MyTasks.tsx` (329 LOC → ~180)                         | page (tabs + list + done-toggle)    | request-response (with optimistic mutation) | Existing tabs wiring at `frontend/src/pages/MyTasks.tsx:28` (`Tabs/TabsList/TabsTrigger`); handoff `pages.jsx#L367-396` for `.tasks-list` anatomy                                                                                                                                                                                  | role-match                              |
| `frontend/src/pages/activity/ActivityPage.tsx` (137 LOC → ~140)           | page (tabs + list)                  | request-response (infinite query)           | `EngagementsListPage.tsx` for tabs+filter pattern; handoff `pages.jsx#L398-421` for `.act-list` anatomy                                                                                                                                                                                                                            | role-match                              |
| `frontend/src/pages/settings/SettingsPage.tsx` (342 LOC → ~280)           | page (two-col layout)               | request-response                            | Existing `SettingsLayout.tsx` chrome; handoff `pages.jsx#L423-465` + `app.css#L73-100` for new `.settings-nav` chrome                                                                                                                                                                                                              | role-match                              |
| `frontend/src/components/settings/SettingsLayout.tsx`                     | layout component (CSS Grid 240+1fr) | composition                                 | `frontend/src/components/list-page/ListPageShell.tsx` (CSS-grid + `<section role="region">` + `data-loading` ready marker)                                                                                                                                                                                                         | role-match                              |
| `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx` | form section (extend)               | request-response                            | `frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx` (`SettingsSectionCard` + `useFormReturn` + `Switch/RadioGroup`)                                                                                                                                                                                       | exact                                   |
| `frontend/src/components/settings/sections/SecuritySettingsSection.tsx`   | form section (rename label only)    | none                                        | `AccessibilitySettingsSection.tsx`                                                                                                                                                                                                                                                                                                 | exact                                   |
| `frontend/src/design-system/DesignProvider.tsx`                           | provider (context + localStorage)   | event-driven                                | self — extend the existing `LS_DENSITY = 'id.density'` flow at line 36 with one-time `spacious → dense` migration shim                                                                                                                                                                                                             | self-extend                             |
| `frontend/src/components/signature-visuals/index.ts`                      | barrel export                       | none                                        | self — append `Icon` next to existing `DossierGlyph` block                                                                                                                                                                                                                                                                         | self-extend                             |
| `frontend/src/index.css`                                                  | stylesheet (handoff CSS port)       | none                                        | existing port comment at line 11 (Phase 40 ported `.btn / .chip / .tbl / .week-list / .forum-row / .icon-flip / .pill / .page*`); append `.tasks-list / .task-row / .act-list / .act-row / .settings-nav / .card-head / .card-sub` from `frontend/design-system/inteldossier_handoff_design/src/app.css#L73-100, 341-350, 444-450` | verbatim copy                           |
| `frontend/src/i18n/index.ts`                                              | i18n registry                       | static-import                               | self — append imports + `resources` registration at lines 4-80 pattern                                                                                                                                                                                                                                                             | self-extend                             |
| `.size-limit.json`                                                        | config (bundle gate)                | none                                        | self — raise `Total JS` budget if needed (current ≤ 815 KB)                                                                                                                                                                                                                                                                        | self-extend                             |

---

## Pattern Assignments

### `supabase/functions/after-actions-list-all/index.ts` (edge-function, request-response)

**Analog:** `supabase/functions/after-actions-list/index.ts` (113 LOC — full file)

**Imports + serve scaffold** (lines 1-16):

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
```

**Method guard + query-param parsing** (lines 18-50):

```ts
if (req.method !== 'GET') {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
const url = new URL(req.url)
// (DROP the dossierId path-segment extraction at lines 26-34)
const status = url.searchParams.get('status') ?? 'published' // R-04: default published
const limit = parseInt(url.searchParams.get('limit') || '20')
const offset = parseInt(url.searchParams.get('offset') || '0')

if (status && !['draft', 'published', 'edit_requested', 'edit_approved'].includes(status)) {
  return new Response(
    JSON.stringify({
      error: 'validation_error',
      message:
        'Invalid status filter. Must be one of: draft, published, edit_requested, edit_approved',
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}
if (limit < 1 || limit > 100) {
  return new Response(
    JSON.stringify({ error: 'validation_error', message: 'Limit must be between 1 and 100' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
}
```

**Core query pattern** (lines 64-83 — REPLACE the per-dossier `.eq('dossier_id', dossierId)` with engagement+dossier joins per RESEARCH Blocker 2 + R-04):

```ts
// REPLACES the analog's per-dossier select; adds engagement + dossier joins
let query = supabaseClient
  .from('after_action_records')
  .select(
    `
    *,
    engagement:engagements!inner (id, title_en, title_ar, engagement_date),
    dossier:dossiers!inner (id, name_en, name_ar),
    decisions (id),
    commitments:aa_commitments (id),
    risks:aa_risks (id),
    follow_up_actions:aa_follow_up_actions (id)
  `,
    { count: 'exact' },
  )
  .eq('publication_status', status) // RLS gates by dossier_acl automatically

query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

const { data, error, count } = await query
```

**Error handling + response** (lines 85-112 — verbatim):

```ts
if (error) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
return new Response(
  JSON.stringify({ data: data || [], total: count || 0, limit, offset }),
  { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
});
```

---

### `frontend/src/hooks/useAfterActionsAll.ts` (hook, request-response)

**Analog:** `frontend/src/hooks/useAfterAction.ts` lines 181-203 (`useAfterActions` per-dossier)

**Imports pattern** (lines 1-2):

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
```

**Core hook pattern** (lines 181-203 — copy with `dossierId` removed; cache key `['after-actions', 'all', options]` per CONTEXT `<specifics>`):

```ts
function useAfterActions(
  dossierId: string | undefined,
  options?: {
    status?: 'draft' | 'published' | 'edit_requested'
    limit?: number
    offset?: number
  },
) {
  return useQuery({
    queryKey: ['after-actions', dossierId, options],
    queryFn: async () => {
      if (!dossierId) throw new Error('Dossier ID is required')
      const { data, error } = await supabase.functions.invoke('after-actions-list', {
        body: { dossier_id: dossierId, ...options },
      })
      if (error) throw error
      return data as { data: AfterActionRecord[]; total: number }
    },
    enabled: !!dossierId,
  })
}
```

**Variant for new hook:** drop `dossierId` arg + `enabled` guard; bump invoke target to `'after-actions-list-all'`; widen the `data` type to include `engagement` + `dossier` joins (extend `AfterActionRecord` interface at line 94-121).

---

### `frontend/src/components/signature-visuals/Icon.tsx` (component, render-only)

**Analog:** `frontend/design-system/inteldossier_handoff_design/src/icons.jsx` (verbatim source — full inline SVG set)

**Common SVG props pattern** (line 5):

```jsx
const common = {
  width: size,
  height: size,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style,
  className: `icon icon-${name}`,
}
```

**Switch-on-name body** (lines 6-44 — port the subset needed by Phase 42; per R-01 minimum 14 glyphs):

```jsx
switch (name) {
  case 'check':
    return (
      <svg {...common}>
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <path d="M6.5 10l2.5 2.5L14 7.5" />
      </svg>
    )
  case 'plus':
    return (
      <svg {...common}>
        <path d="M10 4v12M4 10h12" />
      </svg>
    )
  case 'chevron-right':
    return (
      <svg {...common}>
        <path d="M8 5l5 5-5 5" />
      </svg>
    )
  case 'chat':
    return (
      <svg {...common}>
        <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      </svg>
    )
  case 'file':
    return (
      <svg {...common}>
        <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M12 3v4h4" />
      </svg>
    )
  case 'link':
    return (
      <svg {...common}>
        <path d="M9 11a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1" />
        <path d="M11 9a3 3 0 0 0-4 0l-2 2a3 3 0 0 0 4 4l1-1" />
      </svg>
    )
  case 'alert':
    return (
      <svg {...common}>
        <path d="M10 3l8 14H2L10 3Z" />
        <path d="M10 8v4M10 14.5v.5" />
      </svg>
    )
  case 'dot':
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="3" fill="currentColor" />
      </svg>
    )
  case 'cog':
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="2.5" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4" />
      </svg>
    )
  case 'bell':
    return (
      <svg {...common}>
        <path d="M5 13V9a5 5 0 0 1 10 0v4l1 2H4l1-2Z" />
        <path d="M8 16a2 2 0 0 0 4 0" />
      </svg>
    )
  case 'shield':
    return (
      <svg {...common}>
        <path d="M10 3l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V5l6-2Z" />
      </svg>
    )
  case 'lock':
    return (
      <svg {...common}>
        <rect x="4" y="9" width="12" height="8" rx="1.5" />
        <path d="M7 9V6a3 3 0 0 1 6 0v3" />
      </svg>
    )
  case 'people':
    return (
      <svg {...common}>
        <circle cx="7" cy="8" r="2.5" />
        <circle cx="14" cy="8" r="2" />
        <path d="M2.5 16c.5-2.5 2.3-4 4.5-4s4 1.5 4.5 4" />
        <path d="M12 14.5c.4-1.5 1.6-2.5 3-2.5s2.3 1 2.5 2" />
      </svg>
    )
  case 'sparkle':
    return (
      <svg {...common}>
        <path d="M10 3l1.5 4.5L16 9l-4.5 1.5L10 15l-1.5-4.5L4 9l4.5-1.5L10 3Z..." />
      </svg>
    )
  default:
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="7" />
      </svg>
    )
}
```

**Project shape adaptation:** export as TypeScript: `export function Icon({ name, size = 18, style }: { name: IconName; size?: number; style?: React.CSSProperties }): React.JSX.Element`. Strip the global `Object.assign(window, { Icon })` from the source — it is for the handoff prototype only.

**Barrel export** (append to `frontend/src/components/signature-visuals/index.ts` line ~37 after `DossierGlyph` block):

```ts
export { Icon } from './Icon'
export type { IconProps, IconName } from './Icon'
```

---

### `frontend/src/pages/Briefs/BriefsPage.tsx` (page, request-response — REWRITE BODY)

**Visual analog (verbatim):** `frontend/design-system/inteldossier_handoff_design/src/pages.jsx#L295-329` for the card-grid anatomy.

**Wiring analog:** `frontend/src/pages/engagements/EngagementsListPage.tsx` (90 LOC head — TanStack Query + memoized rows + `ListPageShell`-style scaffold).

**Imports pattern (current line 1-31)** — keep `BriefGenerationPanel`, `BriefViewer`, `useToast`, `useDirection`; **drop** `Plus, FileText, Calendar, Eye, Download, Sparkles` from `lucide-react` (replace with `<Icon name="plus" />` per R-01); **drop** `DataTable`, `Card/CardContent/CardHeader/CardTitle`, `Input`, `Select*`, `Dialog*` (replaced by HeroUI Modal + handoff `.card` class).

**Card-grid pattern** (handoff verbatim — port to project types):

```tsx
<ul
  className="briefs-grid"
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 'var(--gap)',
    listStyle: 'none',
    padding: 0,
    margin: 0,
  }}
>
  {briefs.map((b) => (
    <li
      key={b.id}
      className="card"
      style={{ cursor: 'pointer' }}
      onClick={() => {
        setSelected(b)
        setBriefViewerOpen(true)
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('chip', chipClassFor(b))}>
          {t(`briefs-page.status.${statusFor(b)}`)}
        </span>
        <span
          className="text-[var(--ink-faint)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
          dir="ltr"
        >
          {toArDigits(`${pageCount(b)} pp`, locale)}
        </span>
      </div>
      <h3
        className="text-start"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          marginBottom: 10,
        }}
      >
        {locale === 'ar' ? b.title_ar || b.title_en : b.title_en || b.title_ar}
      </h3>
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}
      >
        <span>{b.author?.full_name ?? '—'}</span>
        <span style={{ fontFamily: 'var(--font-mono)' }} dir="ltr">
          {formatDayFirst(b.published_date ?? b.created_at)}
        </span>
      </div>
    </li>
  ))}
</ul>
```

**Status chip mapping** (per RESEARCH §"Briefs schema lookup" — lossless):

```ts
function chipClassFor(b: Brief): string {
  if (b.is_published === true) return 'chip-ok' // ready
  return '' // base .chip = "draft"
  // awaiting/review never render — source fields don't exist (D-06 lossless)
}
```

**Page count fallback** (per RESEARCH §"Page-count rendering"):

```ts
function pageCount(b: Brief): string {
  if (!b.full_content_en) return '—'
  return String(Math.max(1, Math.ceil(b.full_content_en.length / 2200)))
}
```

**Dual-table fetch preserved** (current lines 114-190 — DO NOT change; per RESEARCH Pitfall 5).

**Modal trigger pattern** (D-05):

```tsx
;<PageHeader
  title={t('briefs-page.title')}
  actions={
    <button className="btn btn-primary" onClick={() => setShowGenerateDialog(true)}>
      <Icon name="plus" size={14} /> {t('briefs-page.cta.newBrief')}
    </button>
  }
/>
{
  /* HeroUI Modal wraps existing BriefGenerationPanel + BriefViewer (preserve their props verbatim) */
}
```

---

### `frontend/src/routes/_protected/after-actions/index.tsx` (route+page, request-response — REWRITE)

**Visual analog (verbatim):** `frontend/design-system/inteldossier_handoff_design/src/pages.jsx#L331-365` for `.tbl` 6-column anatomy.

**Wiring analog:** `frontend/src/components/list-page/ListPageShell.tsx` (full 68 LOC) for skeleton + empty state + `data-loading` ready marker (Plan 40-13).

**Skeleton pattern from analog** (lines 14-23 — copy shape; replace with row-shape skeleton at `--row-h`):

```tsx
const DefaultSkeleton = (): ReactNode => (
  <div className="flex flex-col gap-3" data-testid="list-page-skeleton">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="h-[var(--row-h)] w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--line-soft)]"
      />
    ))}
  </div>
)
```

**Page wrapper with ready marker** (analog lines 40-67):

```tsx
<section
  dir={isRTL ? 'rtl' : 'ltr'}
  role="region"
  aria-label={title}
  data-loading={isLoading ? 'true' : 'false'}
  className="page list-page-shell flex min-w-0 flex-col gap-[var(--gap)]"
>
  <header className="page-head">
    <div>
      <h1 className="page-title truncate text-start">{t('after-actions-page.title')}</h1>
    </div>
  </header>
  <div className="card">
    <table className="tbl">
      <thead>
        <tr>
          <th className="text-start">{t('after-actions-page.columns.engagement')}</th>
          <th className="text-start">{t('after-actions-page.columns.date')}</th>
          <th className="text-start">{t('after-actions-page.columns.dossier')}</th>
          <th className="text-end">{t('after-actions-page.columns.decisions')}</th>
          <th className="text-end">{t('after-actions-page.columns.commitments')}</th>
          <th aria-label="" />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            tabIndex={0}
            onClick={() => navigate({ to: `/after-actions/${r.id}` })}
            onKeyDown={(e) => e.key === 'Enter' && navigate({ to: `/after-actions/${r.id}` })}
          >
            <td style={{ fontWeight: 500 }}>
              {locale === 'ar' ? r.engagement?.title_ar : r.engagement?.title_en}
            </td>
            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-mute)' }} dir="ltr">
              {formatDayFirst(r.engagement?.engagement_date)}
            </td>
            <td>
              <span
                className="chip"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}
              >
                {locale === 'ar' ? r.dossier?.name_ar : r.dossier?.name_en}
              </span>
            </td>
            <td className="text-end" style={{ fontFamily: 'var(--font-mono)' }}>
              {toArDigits(r.decisions?.length ?? 0, locale)}
            </td>
            <td className="text-end" style={{ fontFamily: 'var(--font-mono)' }}>
              {toArDigits(r.commitments?.length ?? 0, locale)}
            </td>
            <td>
              <Icon name="chevron-right" size={16} className="icon-flip" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>
```

---

### `frontend/src/pages/MyTasks.tsx` (page, request-response + optimistic mutation — REWRITE BODY)

**Visual analog (verbatim):** `pages.jsx#L367-396` (`.tasks-list / .task-row / .task-box` anatomy).

**Wiring analog:** self — keep current imports for `useMyTasks`, `useContributedTasks`, `useUpdateTask`, `useWorkCreation`, `Tabs/TabsList/TabsTrigger`. Strip `Filter`, `AlertCircle`, `CheckCircle2`, `UserCheck`, `Users` lucide imports + the `<Card><CardHeader>` summary stat blocks + the FAB invocation.

**Tabs pattern** (analog `MyTasks.tsx` line 28 — preserved):

```tsx
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
// later:
;<Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
  <TabsList>
    <TabsTrigger value="assigned">{t('tasks-page.tabs.assigned')}</TabsTrigger>
    <TabsTrigger value="contributed">{t('tasks-page.tabs.contributed')}</TabsTrigger>
  </TabsList>
</Tabs>
```

**Row-anatomy pattern** (handoff verbatim from RESEARCH §Pattern 1, lines 340-385):

```tsx
<ul className="tasks-list">
  {tasks.map((task) => (
    <li
      key={task.id}
      className={cn('task-row', task.status === 'completed' && 'opacity-45 line-through')}
    >
      <button
        role="checkbox"
        aria-checked={task.status === 'completed'}
        className={cn('task-box', task.status === 'completed' && 'done')}
        style={{ minWidth: 44, minHeight: 44, padding: 15 }}
        onClick={(e) => {
          e.stopPropagation()
          toggleDone(task)
        }}
      >
        {task.status === 'completed' && (
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        )}
      </button>
      <DossierGlyph type={dossier.type} iso={dossier.iso} name={dossier.name_en} size={18} />
      <div className="task-title">
        <div>{task.title}</div>
        <small
          style={{ color: 'var(--ink-mute)' }}
        >{`${dossier.name} · ${task.work_item_type}`}</small>
      </div>
      <PriorityChip priority={task.priority} />
      <span
        className={cn(
          'task-due',
          isToday(task.deadline) && 'today',
          task.priority === 'high' && 'high',
        )}
      >
        {formatDueDate(task.deadline, locale)}
      </span>
    </li>
  ))}
</ul>
```

**Priority chip mapping** (RESEARCH Pitfall 3):

```tsx
function PriorityChip({ priority }: { priority: string }) {
  const cls =
    priority === 'urgent' || priority === 'high' || priority === 'critical'
      ? 'chip chip-danger'
      : priority === 'medium' || priority === 'normal'
        ? 'chip chip-warn'
        : 'chip' // low / unknown
  return <span className={cls}>{t(`tasks-page.priority.${priority}`)}</span>
}
```

---

### `frontend/src/pages/activity/ActivityPage.tsx` (page, request-response infinite — REWRITE BODY)

**Visual analog (verbatim):** `pages.jsx#L398-421` + `app.css#L444-450` for `.act-list` 3-col grid.

**Wiring analog:** `useActivityFeed` hook at `frontend/src/hooks/useActivityFeed.ts:72`; tabs pattern from `MyTasks.tsx:28` (same `Tabs/TabsList/TabsTrigger`).

**Sentence-composition pattern** (RESEARCH §Pattern 2, lines 396-419):

```tsx
<ul className="act-list">
  {activities.map((a) => (
    <li key={a.id} className="act-row">
      <span className="act-t">{toArDigits(formatRelativeTime(a.created_at, locale), locale)}</span>
      <Icon name={iconForAction(a.action_type)} size={16} />
      <span>
        <span className="act-who">{a.actor_name}</span>{' '}
        <span className="act-what">
          <Trans
            i18nKey={`activity-feed.events.${a.action_type}`}
            values={{
              entity: locale === 'ar' ? a.entity_name_ar : a.entity_name_en,
              where: locale === 'ar' ? a.related_entity_name_ar : a.related_entity_name_en,
            }}
            components={{
              entity: <strong style={{ color: 'var(--ink)', fontWeight: 500 }} />,
              where: <span className="act-where" />,
            }}
          />
        </span>
      </span>
    </li>
  ))}
</ul>
```

**Field-name correction (RESEARCH Pitfall 2):** use `action_type` (NOT `event_type` from CONTEXT D-14 — that name is wrong).

**Icon map** (RESEARCH §Activity event_type, 15 → 6+default):

```ts
function iconForAction(t: ActivityActionType): IconName {
  switch (t) {
    case 'approval':
      return 'check'
    case 'rejection':
      return 'alert'
    case 'comment':
    case 'mention':
      return 'chat'
    case 'create':
      return 'plus'
    case 'delete':
      return 'alert'
    case 'upload':
    case 'download':
      return 'file'
    case 'share':
      return 'link'
    default:
      return 'dot'
  }
}
```

---

### `frontend/src/pages/settings/SettingsPage.tsx` + `SettingsLayout.tsx` (page+layout — REWRITE CHROME)

**Visual analog (verbatim):** `pages.jsx#L423-465` + `app.css#L73-100` for `.settings-nav` chrome with `.active::before` accent bar.

**Wiring analog:** existing `SettingsLayout.tsx` lines 1-80 (current chrome) + `ListPageShell.tsx` for the `data-loading="false"` ready-marker pattern.

**Two-column grid pattern** (handoff verbatim — REPLACE current `<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">` block):

```tsx
;<div
  className="page"
  data-loading={isLoading ? 'true' : 'false'}
  style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--gap)' }}
>
  <nav className="card settings-nav-card">
    {SECTIONS.map((s) => (
      <button
        key={s.id}
        className={cn('settings-nav', activeSection === s.id && 'active')}
        onClick={() => setActive(s.id)}
        style={{ minHeight: 44 }}
      >
        <Icon name={s.icon} size={16} />
        <span className="text-start">{t(`settings.nav.${s.labelKey}`)}</span>
      </button>
    ))}
  </nav>
  <div className="card">
    <div className="card-head">
      <div className="card-title">{t(`settings.${activeSection}.title`)}</div>
      <div className="card-sub">{t(`settings.${activeSection}.subtitle`)}</div>
    </div>
    {children} {/* react-hook-form section preserved verbatim per D-10 */}
  </div>
</div>

{
  /* Mobile (≤768px) — pill row per D-12 */
}
;<style>{`
  @media (max-width: 768px) {
    .page { grid-template-columns: 1fr !important; }
    .settings-nav-card { display: flex; overflow-x: auto; gap: 8px; }
    .settings-nav { white-space: nowrap; }
    .settings-nav.active::before { display: none; }
    .settings-nav.active { border-block-end: 2px solid var(--accent-ink); }
  }
`}</style>
```

**SECTIONS list per R-02 (9 items, NOT 7):** `profile / general / appearance / notifications / access-and-security / accessibility / data-privacy / email-digest / integrations` — preserve all 9 currently shipped at `SettingsNavigation.tsx:34-44`. Rename `security → access-and-security` label only (D-09).

---

### `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx` (form section — EXTEND)

**Analog:** `frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx` (lines 1-120 — full structure)

**Imports pattern** (lines 1-8):

```ts
import { useTranslation } from 'react-i18next'
import { Accessibility, ... } from 'lucide-react'  // → use <Icon/> instead
import { UseFormReturn } from 'react-hook-form'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SettingsSectionCard, SettingsItem, SettingsGroup } from '../SettingsSectionCard'
```

**Form-control pattern** (lines 33-67 — replicate per design hook):

```tsx
<SettingsSectionCard title={t('appearance.title')} description={t('appearance.description')}>
  <div className="space-y-8">
    <SettingsGroup title={t('appearance.direction')}>
      <SettingsItem label={t('appearance.directionBureau')}>
        <RadioGroup value={direction} onValueChange={(v) => setDirection(v as Direction)}>
          {/* bureau / chancery / situation / ministerial */}
        </RadioGroup>
      </SettingsItem>
    </SettingsGroup>
    <SettingsGroup title={t('appearance.density')}>
      {/* radio: comfortable / compact / dense — R-03 rename */}
    </SettingsGroup>
    {/* hue picker (0-360°), mode (light/dark) */}
  </div>
</SettingsSectionCard>
```

**Hook integration** (D-11 — share with TweaksDrawer):

```ts
import { useDesignDirection } from '@/design-system/hooks/useDesignDirection'
import { useDensity } from '@/design-system/hooks/useDensity'
import { useHue } from '@/design-system/hooks/useHue'
import { useMode } from '@/design-system/hooks/useMode'
const { direction, setDirection } = useDesignDirection()
const { density, setDensity } = useDensity()
// no save button — instant + persistent via id.dir/id.density/id.hue/id.theme keys (Phase 33/34 contract)
```

---

### `frontend/src/design-system/DesignProvider.tsx` (provider — EXTEND with migration shim)

**Self-extend (R-03):** add a one-time `spacious → dense` migration in the lazy initializer next to existing `safeGetItem(LS_DENSITY)` (line ~36 + initializer block).

**Existing pattern** (lines 33-71):

```ts
const LS_DENSITY = 'id.density'
const isDensity = (value: unknown): value is Density =>
  value === 'comfortable' || value === 'compact' || value === 'dense'
const safeGetItem = (key: string): string | null => {
  /* ... */
}
const safeSetItem = (key: string, value: string): void => {
  /* ... */
}
```

**Migration shim to add** (one-time on first read):

```ts
function readDensityWithMigration(): Density | null {
  const raw = safeGetItem(LS_DENSITY)
  if (raw === 'spacious') {
    safeSetItem(LS_DENSITY, 'dense')
    return 'dense'
  }
  return isDensity(raw) ? raw : null
}
```

---

## Shared Patterns

### Pattern A — handoff verbatim port

**Source:** `frontend/design-system/inteldossier_handoff_design/src/{pages.jsx, app.css, icons.jsx}`
**Apply to:** every Wave 1 page + Icon.tsx + index.css CSS port

Rule: 1:1 preservation of markup, classnames, dimensions, timings — no improvisation. CONTEXT `<canonical_refs>` provides line ranges. Phase 35/37/38/39/40/41 precedent.

### Pattern B — `data-loading="false"` ready marker

**Source:** `frontend/src/components/list-page/ListPageShell.tsx` lines 40-67 (Phase 40 plan 40-13)
**Apply to:** all 5 page rewrites + SettingsLayout

```tsx
<section data-loading={isLoading ? 'true' : 'false'} ...>
```

Wave 2 visual specs (`list-pages-visual.spec.ts:75-83`) wait on `[data-loading="false"]` selector — every page must emit this for determinism.

### Pattern C — bilingual digit rendering

**Source:** `frontend/src/lib/i18n/toArDigits.ts` (Phase 39/40/41 precedent)
**Apply to:** all numeric content (page counts, decisions/commitments counts, dates' day numbers, days-overdue, activity timestamps)

```tsx
{
  toArDigits(`${pageCount(b)} pp`, locale)
}
{
  toArDigits(r.decisions?.length ?? 0, locale)
}
```

### Pattern D — logical properties only (RTL)

**Source:** CLAUDE.md mandate; existing `frontend/src/index.css` selectors already use `inset-inline-start`, `border-block-end`, `text-start`, `ms-*/me-*/ps-*/pe-*`
**Apply to:** every Wave 1 reskin + new CSS port

Forbidden: `left/right/ml-*/mr-*/pl-*/pr-*/text-left/text-right/textAlign:"right"`. Use `text-start`, `ms-*`, `inset-inline-start`. Chevron flips via `.icon-flip` (handoff CSS already ported).

### Pattern E — visual-determinism stack for E2E specs

**Source:** `frontend/tests/e2e/list-pages-visual.spec.ts` lines 25-83 (Phase 40-17 G7)
**Apply to:** all 5 `*-visual.spec.ts` files

```ts
const FROZEN_TIME = new Date('2026-04-26T12:00:00Z')
const SUPPRESS_TRANSITIONS_CSS = `*, *::before, *::after { transition: none !important; animation: none !important; ... }`

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FROZEN_TIME })
  await page.addInitScript((css) => {
    /* inject style tag */
  }, SUPPRESS_TRANSITIONS_CSS)
  await loginForListPages(page)
})

async function gotoAndReady(page, url) {
  await page.goto(url)
  await page.waitForSelector('[data-loading="false"]', { timeout: 15_000 })
  await page.waitForFunction(() => document.fonts.ready)
  await page.clock.runFor(100)
}

await expect(page).toHaveScreenshot(`${name}-${locale}.png`, {
  maxDiffPixelRatio: 0.02,
  fullPage: true,
})
```

### Pattern F — axe-core scoped to phase surface

**Source:** `frontend/tests/e2e/dossier-drawer-axe.spec.ts` lines 32-41 (Phase 41-07)
**Apply to:** `page-42-axe.spec.ts` (5 pages × LTR + AR = 10 cases)

```ts
const results = await new AxeBuilder({ page })
  .include('.page') // scope to the phase-42 page surface
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze()
const seriousOrCritical = results.violations.filter(
  (v) => v.impact === 'serious' || v.impact === 'critical',
)
expect(seriousOrCritical).toEqual([])
```

### Pattern G — touch-target boundingBox check

**Source:** `frontend/tests/e2e/list-pages-touch-targets.spec.ts` lines 30-50 (Phase 40 D-18)
**Apply to:** `touch-targets-42.spec.ts`

```ts
for (const [route, selector] of PAGES_AND_SELECTORS) {
  test(`${route} interactive elements ≥ 44×44`, async ({ page }) => {
    await page.goto(route)
    await page.waitForSelector('[data-loading="false"]', { timeout: 10_000 })
    const handles = await page.locator(selector).all()
    for (const h of handles.slice(0, 5)) {
      const box = await h.boundingBox()
      if (box) expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
}
```

### Pattern H — login helper for E2E

**Source:** `frontend/tests/e2e/support/list-pages-auth.ts` lines 18-50
**Apply to:** every Phase 42 spec file via `import { loginForListPages } from './support/list-pages-auth'`

The `phase-42-fixtures.ts` file should mirror `dossier-drawer-fixture.ts` shape: small canonical seeded record IDs + a single `gotoPhase42Page(page, route)` helper that wraps login + ready-marker wait.

### Pattern I — Vitest unit test scaffold with i18n mock

**Source:** `frontend/src/components/list-page/__tests__/ListPageShell.test.tsx` lines 1-50
**Apply to:** all 6 vitest harnesses (`BriefsPage.test.tsx`, etc.)

```ts
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (k: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue) return String(opts.defaultValue)
      return k
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))
```

### Pattern J — i18n namespace registration

**Source:** `frontend/src/i18n/index.ts` lines 4-80 (static-import block)
**Apply to:** new `briefs-page`, `after-actions-page`, `tasks-page` namespaces; extension to `activity-feed`, `settings`

```ts
import enBriefsPage from './en/briefs-page.json'
import arBriefsPage from './ar/briefs-page.json'
// ...later in resources block:
en: { ..., 'briefs-page': enBriefsPage, ... }
ar: { ..., 'briefs-page': arBriefsPage, ... }
```

**Canonical source is `frontend/src/i18n/{en,ar}/`** (per RESEARCH Pitfall 9). DO NOT add to `frontend/public/locales/` — it is unwired legacy.

### Pattern K — design-system hook integration

**Source:** `frontend/src/design-system/hooks/useDensity.ts` (full 25-LOC file)
**Apply to:** AppearanceSettingsSection.tsx + (preserved) TweaksDrawer state sharing

```ts
export function useDensity(): UseDensityResult {
  const ctx = useContext(DesignContext)
  if (!ctx) throw new Error('useDensity must be used within a <DesignProvider>')
  return { density: ctx.density, setDensity: ctx.setDensity }
}
```

Same shape for `useDesignDirection / useHue / useMode`. AppearanceSettingsSection imports all four; same hooks consumed by TweaksDrawer = no state divergence (D-11).

---

## No Analog Found

| File                                                 | Role       | Data Flow   | Reason / Mitigation                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/components/signature-visuals/Icon.tsx` | component  | render-only | No existing in-repo Icon component with stroked-glyph SVG set. **Mitigation:** verbatim port the relevant `case` arms from `frontend/design-system/inteldossier_handoff_design/src/icons.jsx` (which is project source-of-truth — counts as exact-match for verbatim-port purposes). Per R-01. |
| `frontend/src/index.css` (handoff CSS append)        | stylesheet | none        | No existing `.tasks-list / .task-row / .act-list / .act-row / .settings-nav` selectors in repo. **Mitigation:** verbatim copy from `frontend/design-system/inteldossier_handoff_design/src/app.css#L73-100, 341-350, 444-450` per RESEARCH Pitfall 6.                                          |

Both files have a clear handoff source-of-truth — there is no pattern uncertainty, only a copy operation.

---

## Metadata

**Analog search scope:**

- `supabase/functions/` (Edge Functions)
- `frontend/src/hooks/` (TanStack hooks)
- `frontend/src/components/{list-page,settings,signature-visuals,layout,ui}/`
- `frontend/src/pages/` (existing reskins from Phase 40/41)
- `frontend/src/design-system/` (Phase 33 + hooks)
- `frontend/src/i18n/` (registration pattern)
- `frontend/tests/e2e/` (visual + axe + touch-targets specs)
- `frontend/design-system/inteldossier_handoff_design/src/` (handoff source)

**Files scanned:** 28 analog candidates read in full or read-with-offset

**Pattern extraction date:** 2026-05-02

**Key takeaway for planner:** Phase 42 is overwhelmingly a **verbatim port + reskin** phase. Every new file has either an exact role+data-flow analog already in the repo (Edge Function, TanStack hook, Vitest harness, Playwright visual/axe/touch spec, settings section) OR an explicit handoff source-of-truth (Icon glyphs, CSS classes). The only genuinely-new logic is (a) the engagement+dossier JOIN in `after-actions-list-all`, (b) the 6-key icon map for activity `action_type`, (c) the `spacious → dense` migration shim. Everything else is "copy this analog, swap the data binding."

---

## PATTERN MAPPING COMPLETE
