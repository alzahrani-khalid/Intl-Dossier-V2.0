// Phase 40 list-page barrel — finalised in 40-02a-γ.
// Re-exports all primitives, types, skeletons, and the sensitivity helper.

export { ListPageShell } from './ListPageShell'
export type { ListPageShellProps } from './ListPageShell'

export { GenericListPage } from './GenericListPage'
export type { GenericListPageProps, GenericListPageItem } from './GenericListPage'

export { DossierTable } from './DossierTable'
export type { DossierTableProps, DossierTableRow } from './DossierTable'

export { PersonsGrid } from './PersonsGrid'
export type { PersonsGridProps, PersonCard } from './PersonsGrid'

export { EngagementsList } from './EngagementsList'
export type {
  EngagementsListProps,
  EngagementRow,
  EngagementFilter,
} from './EngagementsList'

export { FilterPill } from './FilterPill'
export type { FilterPillProps } from './FilterPill'

export { ToolbarSearch } from './ToolbarSearch'
export type { ToolbarSearchProps } from './ToolbarSearch'

export {
  GenericListSkeleton,
  DossierTableSkeleton,
  PersonsGridSkeleton,
  EngagementsListSkeleton,
} from './ListPageShell.skeleton'

export {
  SENSITIVITY_CHIP,
  sensitivityChipClass,
  sensitivityLabelKey,
} from './sensitivity'
export type { SensitivityLevel } from './sensitivity'
