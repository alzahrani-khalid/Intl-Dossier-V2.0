import type { ReactNode } from 'react'

/**
 * Phase 40 — list-page skeletons (4 variants).
 *
 * Each variant matches its primitive's content layout so the skeleton-to-content
 * swap doesn't reflow the page. All skeletons use `animate-pulse` and the
 * `bg-muted` token; reduced-motion users get the static muted blocks because
 * Tailwind's `animate-pulse` itself respects `prefers-reduced-motion`.
 */

const Row = (): ReactNode => (
  <div
    aria-hidden="true"
    className="grid items-center gap-3 px-4 py-3 border-b border-border"
    style={{ gridTemplateColumns: 'auto 1fr auto auto' }}
  >
    <div className="size-8 rounded-full bg-muted" />
    <div className="h-4 w-40 rounded bg-muted" />
    <div className="h-3 w-16 rounded bg-muted hidden md:block" />
    <div className="h-5 w-20 rounded-full bg-muted" />
  </div>
)

export function GenericListSkeleton({ rows = 5 }: { rows?: number }): ReactNode {
  return (
    <div
      data-testid="generic-list-skeleton"
      role="status"
      aria-label="Loading"
      className="animate-pulse"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  )
}

export function DossierTableSkeleton({ rows = 5 }: { rows?: number }): ReactNode {
  return (
    <div
      data-testid="dossier-table-bundle-skeleton"
      role="status"
      aria-label="Loading"
      className="animate-pulse"
    >
      <div
        aria-hidden="true"
        className="hidden md:grid items-center gap-3 px-4 py-2 border-b border-border"
        style={{ gridTemplateColumns: 'auto 1fr auto auto auto' }}
      >
        <div className="size-4" />
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  )
}

export function PersonsGridSkeleton({ cards = 6 }: { cards?: number }): ReactNode {
  return (
    <div
      data-testid="persons-grid-bundle-skeleton"
      role="status"
      aria-label="Loading"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center gap-3 p-4 rounded-[var(--radius)] border border-border bg-card"
        >
          <div className="size-11 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EngagementsListSkeleton({
  groups = 2,
  rowsPerGroup = 3,
}: {
  groups?: number
  rowsPerGroup?: number
}): ReactNode {
  return (
    <div
      data-testid="engagements-list-bundle-skeleton"
      role="status"
      aria-label="Loading"
      className="animate-pulse"
    >
      {Array.from({ length: groups }).map((_, gi) => (
        <section key={gi}>
          <div className="px-4 py-2 bg-muted/30">
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          {Array.from({ length: rowsPerGroup }).map((_, ri) => (
            <div key={ri} aria-hidden="true" className="px-4 py-3 border-b border-border">
              <div className="h-4 w-2/3 rounded bg-muted mb-2" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
