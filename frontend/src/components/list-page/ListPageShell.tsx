import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface ListPageShellProps {
  title: string
  subtitle?: string
  toolbar?: ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: ReactNode
  children?: ReactNode
}

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

export function ListPageShell({
  title,
  subtitle,
  toolbar,
  isLoading = false,
  isEmpty = false,
  emptyState,
  children,
}: ListPageShellProps): ReactNode {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  // Plan 40-15 (G2 close): expose a labeled landmark. Parent <main> lives in
  // AppShell.tsx, so this shell wraps content in <section role="region"> with an
  // aria-label so axe `region` rule passes and screen readers announce the page.
  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      role="region"
      aria-label={title}
      data-loading={isLoading ? 'true' : 'false'}
      className="page list-page-shell flex min-w-0 flex-col gap-[var(--gap)]"
    >
      <header className="page-head">
        <div>
          <h1 className="page-title truncate text-start">{title}</h1>
          {subtitle !== undefined && subtitle !== '' ? (
            <p className="page-sub truncate text-start">{subtitle}</p>
          ) : null}
        </div>
      </header>

      {toolbar !== undefined ? (
        <div className="list-toolbar flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {toolbar}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-[var(--gap)] overflow-x-hidden">
        {isLoading ? <DefaultSkeleton /> : isEmpty ? (emptyState ?? null) : children}
      </div>
    </section>
  )
}
