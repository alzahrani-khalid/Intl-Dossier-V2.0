# 87-09 Summary — Kanban URL state, Filter/Display popovers, commitment peek

## Delivered

- **URL state**: `kanban.tsx` validates `group`, `search`, `source`, `priority`, `sort`, `dir`; WorkBoard reads via `Route.useSearch` with `replace: true` navigators (no local mode/search state).
- **Toolbar**: BoardToolbar pill row replaced by Filter (source + priority, client-side facet counts) and Display (group-by status only + sort); FilterChipsRow with showing N of M.
- **Commitment peek**: Commitment cards register visible commitment ids in peekStore and open `?commitment=` drawer; CommitmentDrawer renders counter + chevrons via `usePeekPaging` (replace:true paging). Task/intake navigation unchanged.
- **Empty states**: All-empty board → `ListEmptyState` work_item + create palette CTA; filtered-empty → no matching rows + clear filters; per-column Pattern B unchanged.

## Spec narrowing (documented)

Peek applies to **commitment cards only** — no task/intake drawer infra exists (87-09 plan Open Q2). This improves the prior `/commitments` list navigate on commitment click.

## Deviations

- `frontend/src/i18n/en/commitment-drawer.json`, `ar/commitment-drawer.json`, `index.ts` — peek i18n namespace registration
- Test updates under `frontend/src/pages/WorkBoard/__tests__/`

## Verification

- `pnpm --dir frontend exec vitest run src/pages/WorkBoard src/components/commitments` — pass
- `pnpm --dir frontend exec tsc --noEmit` — pass
- `pnpm --dir frontend lint --max-warnings 0` — pass
