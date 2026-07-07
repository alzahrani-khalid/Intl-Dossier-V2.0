# Phase 87: Linear Affordances - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 16 new/modified surfaces (grouped into 9 pattern assignments)
**Analogs found:** 13 / 16 (3 net-new capabilities have no in-repo analog — listed at the end)

All paths relative to `frontend/src/` unless noted. Every excerpt below was read directly from the file this session; line numbers are current as of commit `54d6ebe4`.

**Global constraint reminder (applies to every assignment):** Linear tokens only (`var(--*)` / mapped utilities — no raw hex, no `text-blue-500`), logical properties only (`ms-*`/`ps-*`/`text-start`), radii via `--radius-sm/--radius/--radius-lg`, row heights `var(--row-h)`, `.btn-primary`/`.btn-ghost` recipes, explicit return types, no semicolons, colon-form i18n keys.

## File Classification

| New/Modified File                                                                                                                                             | New? | Role         | Data Flow                         | Closest Analog                                                                        | Match Quality                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------ | --------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------- |
| `store/peekStore.ts`                                                                                                                                          | NEW  | store        | pub-sub (cross-tree client state) | `components/copilot/useCopilotDrawer.ts`                                              | exact                             |
| `components/list-controls/FilterPopover.tsx`                                                                                                                  | NEW  | component    | request-response (facet counts)   | `ui/popover.tsx` + `active-filters/useActiveFilters.ts` + `hooks/useWorkingGroups.ts` | composite (role+flow)             |
| `components/list-controls/DisplayPopover.tsx`                                                                                                                 | NEW  | component    | client state → URL                | `ui/popover.tsx` + `pages/WorkBoard/BoardToolbar.tsx`                                 | composite (role+flow)             |
| `components/list-controls/useListControls.ts`                                                                                                                 | NEW  | hook         | URL-as-state                      | `routes/_protected/dossiers/countries/index.tsx` + `hooks/useDossierDrawer.ts`        | exact (idiom)                     |
| `i18n/{en,ar}/list-controls.json` + registration                                                                                                              | NEW  | config       | —                                 | `i18n/index.ts` dossier-drawer registration                                           | exact                             |
| `hooks/useDossierDrawer.ts`                                                                                                                                   | MOD  | hook         | URL-as-state                      | itself (extend in place)                                                              | exact                             |
| `components/dossier/DossierDrawer/DrawerHead.tsx`                                                                                                             | MOD  | component    | request-response                  | itself + `BoardToolbar.tsx` (mono LTR)                                                | exact                             |
| 5 uniform list routes (countries/organizations/forums/topics/working_groups)                                                                                  | MOD  | route        | CRUD (server-paginated list)      | `routes/_protected/dossiers/countries/index.tsx`                                      | exact (countries IS the template) |
| `pages/engagements/EngagementsListPage.tsx`, `dossiers/persons/-PersonsListPage.tsx`, `dossiers/elected-officials/index.tsx`, `pages/WorkBoard/WorkBoard.tsx` | MOD  | route/page   | local state → URL normalization   | `routes/_protected/dossiers/countries/index.tsx`                                      | role-match (copy its URL idiom)   |
| `components/keyboard-shortcuts/CommandPalette.tsx`                                                                                                            | MOD  | component    | event-driven (command exec)       | itself (`createActions` :617-708) + `analyze-commands.ts`                             | exact                             |
| `components/keyboard-shortcuts/analyze-commands.ts`                                                                                                           | MOD  | utility      | transform                         | itself (pure-helper pattern)                                                          | exact                             |
| `components/empty-states/ListEmptyState.tsx` + `EmptyState.tsx`                                                                                               | MOD  | component    | request-response (settled render) | themselves + `ListPageShell` `emptyState` slot                                        | exact (wire + reskin)             |
| `components/active-filters/ActiveFiltersBar.tsx` (reskin) or slim Linear chip row                                                                             | MOD  | component    | client state                      | `useActiveFilters.ts` (keep) + Linear token contract                                  | role-match                        |
| `routes/_protected.tsx` (if new whitelist params needed)                                                                                                      | MOD  | route layout | URL validation                    | itself (:37-44)                                                                       | exact                             |
| Wave-0 tests (`store/__tests__/peekStore.test.ts`, `components/list-controls/__tests__/`, `CommandPalette.audit.test.tsx`)                                    | NEW  | test         | —                                 | existing 9-file `DossierDrawer` suite + `CommandPalette.analyze.test.tsx`             | role-match                        |

---

## Pattern Assignments

### 1. `store/peekStore.ts` (store, cross-tree pub-sub) — F23

**Analog:** `components/copilot/useCopilotDrawer.ts` (exact — a tiny Zustand store built for the identical problem: coordinating a `_protected`-mounted drawer with entry points elsewhere in the tree). Secondary: `store/uiStore.ts` for the `src/store/` file location + naming convention (`useXStore` in camelCase file).

**Whole-store pattern to copy** (`components/copilot/useCopilotDrawer.ts:15-36`):

```tsx
import { create } from 'zustand'
import type { DossierType } from '@/lib/dossier-type-guards'

export interface CopilotDossierContext {
  dossierId: string
  dossierType?: DossierType
}

interface CopilotDrawerState {
  open: boolean
  /** The dossier the drawer was opened on, if any (D-05 readable context). */
  context: CopilotDossierContext | null
  openCopilot: (context?: CopilotDossierContext | null) => void
  closeCopilot: () => void
}

export const useCopilotDrawer = create<CopilotDrawerState>((set) => ({
  open: false,
  context: null,
  openCopilot: (context = null): void => set({ open: true, context }),
  closeCopilot: (): void => set({ open: false }),
}))
```

Copy: the shape (interface + `create<State>()`), the explicit `: void` return types on actions, the doc-comment style explaining WHY the store exists (cross-tree coordination without prop-drilling). The peek store's state is the registry the research names: `{ orderedIds: string[], type, total, pageOffset, register(...), clear() }`.

Do NOT copy from `uiStore.ts`: its `persist` middleware (peek context is ephemeral — never persist) and its non-explicit action return types (older style; ESLint `explicit-function-return-type` is error-level).

**Placement note:** `useCopilotDrawer` lives next to its component; the research recommendation (and this map) puts the peek registry in `src/store/peekStore.ts` because it has MULTIPLE writer surfaces (9 list pages) and one reader (drawer) — the `src/store/` convention (`authStore`, `dossierStore`, `entityHistoryStore`, `pinnedEntitiesStore`, `uiStore`) fits multi-consumer stores.

---

### 2. `hooks/useDossierDrawer.ts` (hook, URL-as-state) — F23 MOD

**Analog:** itself — extend in place per the locked decision. The navigate-reducer idiom to replicate for the new `pageDossier`/`goToSibling` action (`hooks/useDossierDrawer.ts:37-59`):

```tsx
const openDossier = ({ id, type }: { id: string; type: DossierDrawerType }): void => {
  // TanStack Router's strict NavigateOptions typing rejects loosely-typed
  // `(prev: Record<string, unknown>)` reducers; the codebase precedent
  // (e.g. useContextAwareFAB) is to cast via `as unknown as Parameters<typeof navigate>[0]`.
  void navigate({
    search: (prev: Record<string, unknown>) => ({
      ...prev,
      dossier: id,
      dossierType: type,
    }),
    replace: false,
  } as unknown as Parameters<typeof navigate>[0])
}

const closeDossier = (): void => {
  void navigate({
    search: (prev: Record<string, unknown>) => {
      const { dossier: _d, dossierType: _t, ...rest } = prev
      return rest
    },
    replace: true,
  } as unknown as Parameters<typeof navigate>[0])
}
```

Peek paging = the `openDossier` reducer body with `replace: true` (UI-SPEC: "no history spam per step"). Keep `openDossier` itself at `replace: false` (history entry per open — existing deep-link semantics, covered by `hooks/__tests__/useDossierDrawer.test.tsx` which must stay green).

The reading side (`:31-35`): `useSearch({ strict: false })` cast to the param shape — reuse as-is.

---

### 3. `components/dossier/DossierDrawer/DrawerHead.tsx` (component) — F23 MOD

**Analog:** itself. The counter + chevron pair lands in the existing chip-row/close-button flex (`DrawerHead.tsx:86-105`).

**Icon-button pattern — the ONLY sanctioned one** (`DrawerHead.tsx:95-104`; Phase-79 lesson: HeroUI Button's filterDOMProps drops aria — never use it for icon buttons):

```tsx
<button
  type="button"
  className="btn-ghost"
  style={{ minBlockSize: 44, minInlineSize: 44 }}
  onClick={onClose}
  aria-label={t('cta.close')}
  data-testid="dossier-drawer-close"
>
  <X size={14} />
</button>
```

Copy for the chevron-up/chevron-down buttons: plain `<button type="button" className="btn-ghost">`, i18n `aria-label` (`dossier-drawer:peek.prev` / `peek.next`), `data-testid`, lucide icon at `size={14}`. Chevrons are vertical — no RTL flip needed. Disabled boundary: `disabled` + `aria-disabled` per UI-SPEC.

**Mono LTR-isolated counter** — analog `pages/WorkBoard/BoardToolbar.tsx:87-89`:

```tsx
<LtrIsolate>
  <span className="overdue-chip font-mono">{overdueLabel}</span>
</LtrIsolate>
```

BUT: `LtrIsolate` is a block-level div (research Pitfall 4) and would break the DrawerHead flex row. Inside the head row use the inline form instead (research Pattern 3, sanctioned by `frontend/DESIGN.md` §RTL cascade):

```tsx
<span dir="ltr" className="font-mono text-sm text-ink-mute">
  {t('dossier-drawer:peek.counter', { position, total })}
</span>
```

**i18n access pattern in this file** (`DrawerHead.tsx:52`): `const { t, i18n } = useTranslation('dossier-drawer')` — single-namespace form; new keys go in `i18n/{en,ar}/dossier-drawer.json` (already registered).

---

### 4. `components/list-controls/{FilterPopover,DisplayPopover}.tsx` (components) — F24 NEW

**Primitive analog:** `components/ui/popover.tsx` (Radix wrapper — the in-repo popover precedent; no HeroUI popover is used anywhere in `ui/`).

**Wrapper API** (`ui/popover.tsx:18-43`) — compose `Popover` + `PopoverTrigger` + `PopoverContent`; content default (`:34-38`):

```tsx
className={cn(
  'z-50 w-72 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-raised)] p-4 text-[var(--ink)] shadow-[var(--shadow)] outline-hidden',
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  className,
)}
```

**⚠ Divergence from the UI-SPEC (planner must handle):** the wrapper's defaults are `bg-[var(--surface-raised)]` + `shadow-[var(--shadow)]`, but the Phase-87 elevation contract mandates popovers on **`--surface-3` with NO shadow**. `className` is merged last via `cn()` (tailwind-merge), so pass overrides from the new components: `className="bg-surface-3 shadow-none"` (+ width/padding overrides as needed). Do not edit the shared wrapper — other consumers keep the raised default.

**Trigger buttons:** two `.btn-ghost` buttons in the toolbar (lucide `ListFilter` / `SlidersHorizontal`), labels `t('list-controls:filter.trigger')` / `display.trigger`. Icon-button/aria discipline per assignment 3.

**Filter-chip logic analog:** `components/active-filters/useActiveFilters.ts` — reuse the HOOK wholesale, it is UI-free. Key shapes (`useActiveFilters.ts:22-73`):

```tsx
export interface FilterFieldConfig {
  key: string
  labelKey?: string
  label?: string
  type: 'string' | 'array' | 'boolean' | 'date' | 'dateRange'
  category?: string
  valueTranslationPrefix?: string
  formatValue?: (value: unknown) => string
  variant?: FilterChipConfig['variant']
  icon?: React.ReactNode
  skip?: boolean
}

export interface UseActiveFiltersReturn {
  filterChips: FilterChipConfig[]
  activeFilterCount: number
  removeFilter: (key: string, arrayValue?: string) => void
  clearAllFilters: () => void
  hasActiveFilters: boolean
  collapsed: boolean
  toggleCollapsed: () => void
}
```

`removeFilter` (`:228-267`) already handles nested keys (`dateRange.from`), array-item removal, and simple deletion immutably; `clearAllFilters` (`:272-274`) resets to `defaultFilters`. `activeFilterCount` feeds the "Filter · N" trigger label directly.

**Chip RENDERING is not a copy target:** `ActiveFiltersBar.tsx` is framer-motion-animated and styled in pre-Linear tokens (`bg-secondary`, `rounded-xl`) — either reskin it (its only live consumer is the out-of-scope `/dossiers` hub, so low regression risk) or build a slim Linear-native chip row consuming `useActiveFilters` output: chips at `--radius-sm`, hover = background fade only, NO scale/lift animation (research Pitfall 8), `Clear all` reusing `active-filters:clearAll`.

**Live facet counts** — analog `hooks/useWorkingGroups.ts:84-97` (head-count with filters applied):

```tsx
let countQuery = supabase
  .from('dossiers')
  .select('*', { count: 'exact', head: true })
  .eq('type', 'working_group')
  .neq('status', 'archived')

if (status && status !== 'all') {
  countQuery = countQuery.eq('status', status)
}
if (search) {
  countQuery = countQuery.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`)
}

const { count } = await countQuery
```

Wrap in `useQuery({ ..., enabled: popoverOpen, staleTime: 30_000 })` — the `enabled`-gating precedent is `DossierDrawer.tsx:38-40`. Counts run through the anon Supabase client so RLS applies (security note: never a service-role count endpoint). Option rows at `var(--row-h)`, count inline-end in `text-ink-faint`, Latin digits.

**DisplayPopover grouping/sorting analog:** `pages/WorkBoard/BoardToolbar.tsx:58-85` — the `aria-pressed` toggle-pill group it REPLACES on kanban:

```tsx
<button
  type="button"
  className="filter-pill"
  aria-pressed={mode === 'status'}
  onClick={handleByStatusClick}
>
  {t('filters.byStatus')}
</button>
```

Copy the `aria-pressed` toggle semantics and controlled `onModeChange` prop shape into the Display popover's Group-by radio rows. Do NOT copy the `aria-disabled` "Coming soon" stub pills (`:67-84`) — rendering dead options in the new popover recreates the F25 problem (research Pitfall 6); expose only working group-by values.

---

### 5. `components/list-controls/useListControls.ts` + the 5 uniform list routes (URL-as-state) — F24 MOD

**Analog:** `routes/_protected/dossiers/countries/index.tsx` — the Phase-40 template all 5 uniform surfaces copy-paste; it is BOTH the analog for the new hook and the file to modify first (the other 4 mirror it).

**`validateSearch` whitelist pattern** (`countries/index.tsx:15-27`) — extend this interface with the planner-chosen filter/display params:

```tsx
interface DossierListSearch {
  page: number
  search?: string
}

export const Route = createFileRoute('/_protected/dossiers/countries/')({
  component: CountriesListRoute,
  validateSearch: (search: Record<string, unknown>): DossierListSearch => ({
    page: Math.max(1, Number(search.page) || 1),
    search:
      typeof search.search === 'string' && search.search.length > 0 ? search.search : undefined,
  }),
})
```

**URL-write pattern** (`countries/index.tsx:33-45`) — every filter/display change follows this (reset `page: 1` on filter change, `replace: true`):

```tsx
const onSearchChange = useCallback(
  (next: string): void => {
    void navigate({
      search: (prev: DossierListSearch) => ({
        ...prev,
        search: next.length > 0 ? next : undefined,
        page: 1,
      }),
      replace: true,
    })
  },
  [navigate],
)
```

Note: with `Route.useNavigate()` the reducer is typed per-route — no cast needed (contrast with the `strict:false` cast in assignment 2; use whichever matches the call site).

**Row-click rewiring (F23)** — the current handler to REPLACE (`countries/index.tsx:47-55`):

```tsx
const onRowClick = useCallback(
  (row: DossierTableRow): void => {
    void navigate({
      to: '/dossiers/countries/$dossierId',
      params: { dossierId: row.id },
    })
  },
  [navigate],
)
```

becomes: peek-registry `register({ ids, type, total, pageOffset })` + `openDossier({ id: row.id, type: 'country' })` (research Pattern 1). Full detail stays reachable via the drawer's existing `cta.open_full_dossier`.

**Toolbar slot where the triggers land** (`components/list-page/ListPageShell.tsx:57-61`):

```tsx
{
  toolbar !== undefined ? (
    <div className="list-toolbar flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {toolbar}
    </div>
  ) : null
}
```

`toolbar` is a plain `ReactNode` prop — pass `<ToolbarSearch/>` + `<FilterPopover/>` + `<DisplayPopover/>` as a fragment from each route; no shell change needed.

**Sort exposure (Display popover):** the hook seam is one `.order()` call per hook — `hooks/useCountries.ts:72`:

```tsx
query = query.order('updated_at', { ascending: false }).range(offset, offset + limit - 1)
```

Thread `orderBy`/`ascending` from the URL params into this line per hook (mechanical). Also copy the `useCountries` safety idioms when touching hooks: `SEARCH_MAX_LEN` slice (`:45,55-56`) and the `.or(ilike)` builder (`:64-66`) — never string-concatenate SQL.

**The 4 bespoke surfaces** (persons, engagements, elected-officials, kanban) copy the SAME countries pattern to lift their local `useState` into URL params first (persons even has a dead `validateSearch` shell already at `routes/_protected/dossiers/persons/index.tsx:11`). Elected-officials additionally migrates onto `ListPageShell` (or gets a parallel toolbar row — planner call); its analog for shell adoption is any of the 5 uniform routes.

**If new layout-level params are needed** — whitelist idiom at `routes/_protected.tsx:37-44` (typed guard + explicit undefined fallback):

```tsx
export const Route = createFileRoute('/_protected')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { dossier?: string; dossierType?: ValidDossierType } => ({
    dossier:
      typeof search.dossier === 'string' && search.dossier.length > 0 ? search.dossier : undefined,
    dossierType: isValidDrawerDossierType(search.dossierType) ? search.dossierType : undefined,
  }),
```

Reserved parent params `dossier`/`dossierType` (and `commitment`) must not be reused as filter param names.

---

### 6. `components/keyboard-shortcuts/CommandPalette.tsx` + `analyze-commands.ts` — F25 MOD

**Analog:** the palette's own `createActions` block — new commands (Create MoU, Create user, Toggle theme, Switch language, Create elected official) clone this entry shape (`CommandPalette.tsx:617-641`):

```tsx
const createActions = useMemo(
  () => [
    {
      id: 'create-task',
      label: t('createActions.newTask', 'Create New Task'),
      icon: CheckSquare,
      action: () => navigateTo('/tasks?action=create'),
      shortcut: formatShortcut('n', isMac ? ['meta'] : ['ctrl']),
      category: 'create',
    },
    ...
    {
      id: 'create-dossier',
      label: t('createActions.newDossier', 'Create New Dossier'),
      icon: FolderPlus,
      action: () => navigateTo('/dossiers/create'),
      shortcut: formatShortcut('d', isMac ? ['meta', 'shift'] : ['ctrl', 'shift']),
      category: 'create',
    },
```

Entry contract: `{ id, label: t(key, fallback), icon: LucideIcon, action: () => navigateTo(path) | storeCall(), shortcut?: formatShortcut(...), category }`. `navigateTo` (`:605-614`) navigates then `closeCommandPalette()` — non-navigation commands (Toggle theme via `useMode().setMode`, Switch language via `switchLanguage` from `i18n/index.ts:586-588`) must call `closeCommandPalette()` themselves in `action`.

**Audit targets with exact lines (from research, verified shape here):** the 4 half-dead `?action=create` targets (`:623,631,647,654`), dead `cmd-export-dossiers` (`:846-851`), broken `cmd-view-network` (`:762-774`), wrong-target `nav-analytics` (`:748-754` — must be `/analytics`, matching `useKeyboardShortcuts.ts:361-369`), advertised-but-unbound `shortcut:` glyphs on `:624,632,640` (either register the bindings or drop the `shortcut` field), 8 dead suggested-action ids (routeContexts `:217-299` vs resolver `:894-931`).

**Pure-helper pattern for anything table-driven/testable:** `analyze-commands.ts` — i18n-free command derivation with canonical labels, unit-testable without mounting the 1620-line palette (`analyze-commands.ts:103-115`):

```tsx
export function getAnalyzeCommandActions(pathname: string): AnalyzeCommandAction[] {
  const dossierId = extractDossierIdFromPathname(pathname)
  if (dossierId == null) {
    return []
  }

  return ANALYZE_TEMPLATES.map((template) => ({
    id: `cmd-analyze-${template.idSuffix}`,
    label: `Analyze: ${template.labelSuffix}`,
    queryType: template.queryType,
    deepLink: buildAnalyzeDeepLink(dossierId, template.queryType),
  }))
}
```

The `CommandPalette.audit.test.tsx` regression lock (Wave 0) should mirror `CommandPalette.analyze.test.tsx`'s table-driven approach against helpers like this. Do not fight cmdk's hardcoded listbox id (research Pitfall 3 — pre-authorized by UI-SPEC).

**Sentence-case pass:** `en/keyboard-shortcuts.json` + `ar/` — labels above show the Title Case debt ("Create New Task" → "Create task"). Fallback strings in the `t(key, fallback)` calls must be updated in the SAME pass or the old Title Case leaks when a key is missing.

---

### 7. `components/empty-states/{EmptyState,ListEmptyState}.tsx` — F26 MOD (wire + reskin)

**Analog:** themselves — the structure is right, the skin and consumers are wrong. `ListEmptyState` has ZERO consumers today; F26 = wire it into all 9 surfaces + reskin + copy matrix.

**Structural skeleton to keep** (`EmptyState.tsx:116-137` — icon wash + title + body already match the UI-SPEC Pattern A anatomy):

```tsx
<div className={cn('flex flex-col items-center justify-center text-center', sizes.container, className)}>
  <div className={cn('flex items-center justify-center rounded-full bg-muted', sizes.iconWrapper)}>
    <Icon className={cn('text-muted-foreground', sizes.icon)} />
  </div>
  <h3 className={cn('text-foreground', sizes.title)}>{title}</h3>
  <p className={cn('text-muted-foreground max-w-md', sizes.description)}>{description}</p>
```

**Token reskin required (spec elevation contract):** `bg-muted` → `bg-surface-raised` (icon wash), `text-muted-foreground` → `text-ink-mute` (body) / `text-ink-faint` (icon), `text-foreground` → `text-ink`. The `Button` from `ui/button` used for actions (`:154-165`) must render the `.btn-primary` recipe for the ONE accent CTA and `.btn-ghost` for "Clear filters" — per the spec, when the user cannot create, render NO CTA (never a disabled accent button).

**Entity-config extension point** (`ListEmptyState.tsx:21-34` + `:71-88`) — the union and map gaining `topic`, `working_group`, `elected_official`:

```tsx
export type EntityType =
  | 'document' | 'dossier' | 'engagement' | 'commitment' | 'organization'
  | 'country' | 'forum' | 'event' | 'task' | 'person' | 'position' | 'mou'
  | 'generic'   // ← add 'topic' | 'working_group' | 'elected_official'

const entityConfig: Record<EntityType, { icon: LucideIcon; translationKey: string; suggestionContext: SuggestionContext }> = {
  country: { icon: Globe, translationKey: 'country', suggestionContext: 'dossier' },
  ...
}
```

New entries follow the same triple; `empty-states.json` `list.<entity>.*` keys mirror the union (copy matrix in UI-SPEC §F26 replaces the Title-Case/"we" debt wholesale on core-set keys).

**Wiring point per uniform surface** — replace the bare `empty-hint` block (`countries/index.tsx:117-132`) inside `ListPageShell`'s `emptyState` prop:

```tsx
emptyState={
  <div className="empty-hint">
    <p>{t('countries:empty.title', { defaultValue: ... })}</p>
    <p className="sub">{t('countries:empty.description', { defaultValue: ... })}</p>
  </div>
}
```

→ `emptyState={<ListEmptyState entityType="country" onCreate={canCreate ? goToCreate : undefined} ... />}` (plus the filtered-empty branch keyed off F24 state). Loading discipline is already structural — `ListPageShell.tsx:64` renders `emptyState` only when `!isLoading && isEmpty`:

```tsx
{
  isLoading ? <DefaultSkeleton /> : isEmpty ? (emptyState ?? null) : children
}
```

Verify the same gate manually on elected-officials (`ElectedOfficialListTable.tsx:162-167`) and kanban (`BoardColumn.tsx:175-177`), which bypass the shell. Preserve `data-testid="working-groups-empty"` (route test dependency, research Pitfall 7).

---

### 8. `i18n/{en,ar}/list-controls.json` + registration — NEW

**Analog:** the `dossier-drawer` namespace — the exact three-line registration pattern in `i18n/index.ts` (`:194-195`, `:364`, `:498`):

```tsx
import enDossierDrawer from './en/dossier-drawer.json'    // :194
import arDossierDrawer from './ar/dossier-drawer.json'    // :195
...
    'dossier-drawer': enDossierDrawer,                     // :364 (resources.en)
...
    'dossier-drawer': arDossierDrawer,                     // :498 (resources.ar)
```

New namespace `list-controls` needs all three in the SAME commit as the JSON files (unregistered → silent EN fallback in BOTH languages; `pnpm --dir frontend lint` runs `check-i18n-namespaces.mjs` and catches drift). Address keys with the colon form: `t('list-controls:filter.trigger')`.

`switchLanguage` seam for the F25 command (`i18n/index.ts:586-588`):

```tsx
export const switchLanguage = async (lang: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lang)
}
```

---

### 9. Sheet shell (F23 peek surface) — reference only, no modification expected

`ui/sheet.tsx:43-44` proves `side="right"` is already logical — **never `isRTL`-flip the `side` prop** (PR #95 lesson, locked in UI-SPEC):

```tsx
right:
  'inset-y-0 end-0 h-full w-3/4 border-s border-[var(--line)] ltr:data-[state=closed]:slide-out-to-right ltr:data-[state=open]:slide-in-from-right rtl:data-[state=closed]:slide-out-to-left rtl:data-[state=open]:slide-in-from-left sm:max-w-sm',
```

and the `size: { wide: 'sm:max-w-[min(720px,92vw)]' }` variant (`:51-54`) already delivers the spec's `min(720px, 92vw)` width. The drawer mount + skeleton/error/close infra is untouched (`routes/_protected.tsx:82-87`, `DossierDrawer.tsx:92-121`).

---

## Shared Patterns

### URL search-param write (all F23/F24 state changes)

**Source:** `hooks/useDossierDrawer.ts:41-48` (strict:false + cast) and `countries/index.tsx:35-44` (per-route typed, no cast)
**Apply to:** peek paging, every filter/display change, clear-all. `replace: true` for in-place state (paging, filter tweaks, search); `replace: false` only for the initial drawer open. Reset `page: 1` whenever a filter changes.

### Icon-button with aria (all new icon-only buttons)

**Source:** `DrawerHead.tsx:95-104` (excerpt in assignment 3)
**Apply to:** peek chevrons, chip remove (×), popover close affordances. Plain `<button type="button" className="btn-ghost">` + i18n `aria-label` + `data-testid`. HeroUI Button is BANNED for these (filterDOMProps drops aria).

### Enabled-gated secondary queries

**Source:** `DossierDrawer.tsx:38-40` (`enabled: Boolean(dossierId)`), also visible in `DrawerHead.tsx:53-59`
**Apply to:** facet head-counts (`enabled: popoverOpen`), neighbor-page prefetch. Always pair with explicit `staleTime`.

### Mono + `dir="ltr"` isolation

**Source:** `BoardToolbar.tsx:87-89` (block `LtrIsolate`) / inline `dir="ltr"` span (research Pattern 3)
**Apply to:** peek counter `3 / 15`, ⌘K key glyphs, any `T-3`/`T+2`. Inline span inside flex rows; `LtrIsolate` only for standalone chips. Latin digits both locales.

### i18n namespace + colon-form addressing

**Source:** `i18n/index.ts:194-195,364,498` (assignment 8)
**Apply to:** every plan touching strings. Colon form (`ns:key.path`); dot form leaks raw keys.

### Supabase list-query safety

**Source:** `useCountries.ts:45,55-66` (`SEARCH_MAX_LEN` slice + `.or(ilike)` builder) and `useWorkingGroups.ts:84-97` (head-count)
**Apply to:** all facet counts and any hook gaining filter/sort params. Never string-concatenate SQL; counts via the anon client so RLS applies.

### House style (visible in every excerpt above)

No semicolons, single quotes, explicit return types (`: void`, `: ReactElement`), `useCallback`/`useMemo` with exhaustive deps, doc-comment headers naming the phase/decision that introduced the file.

---

## No Analog Found

Files/capabilities with no close match — planner should use RESEARCH.md recommendations instead:

| Capability                                                                      | Role              | Data Flow          | Reason / fallback                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display-popover "Display properties" (column/property visibility toggles)       | component + state | client state → URL | NO column-visibility infra exists anywhere. `DossierTable` renders a fixed 5-column grid (`DossierTable.tsx:41`); `GenericListPage` rows are primary/secondary/status only. Follow research Open Q3: column toggles on DossierTable surfaces; secondary-line/status toggles (or omit section) on GenericListPage surfaces |
| Peek cross-page neighbor fetch (`queryClient.fetchQuery` + splice at page edge) | hook logic        | request-response   | No in-repo precedent for sibling-page prefetch/splice. Research Open Q1 recommendation: cross-page fetch with prefetch-at-edge; page-bounded chevrons as the fallback if plan-checker flags complexity                                                                                                                    |
| Filtered-empty vs no-data branching                                             | component logic   | client state       | NO surface distinguishes them today (all show one copy). Net-new branch keyed off F24 `hasActiveFilters`; ghost "Clear filters" wired to `clearAllFilters`                                                                                                                                                                |

## Metadata

**Analog search scope:** `frontend/src/{store,hooks,components/{ui,copilot,dossier/DossierDrawer,active-filters,empty-states,keyboard-shortcuts,list-page},pages/WorkBoard,routes/_protected,i18n}` — guided by the 87-RESEARCH.md seam inventory (all named analogs verified by direct read; sheet-side, popover-surface, and i18n-registration claims re-verified against source)
**Files read this session:** 17 (13 full, 4 targeted-range)
**Pattern extraction date:** 2026-07-07
**Notable correction over research:** `ui/popover.tsx` PopoverContent defaults to `--surface-raised` + `--shadow`, NOT `--surface-3`/no-shadow — F24 components must override via `className` (assignment 4)
