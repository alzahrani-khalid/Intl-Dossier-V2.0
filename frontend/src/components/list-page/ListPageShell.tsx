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
      <div key={i} className="h-16 w-full animate-pulse rounded-[var(--radius-sm)] bg-muted" />
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
      className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 min-w-0"
    >
      <header className="flex flex-col gap-1 min-w-0">
        <h1 className="text-2xl font-semibold text-start sm:text-3xl md:text-4xl truncate">
          {title}
        </h1>
        {subtitle !== undefined && subtitle !== '' ? (
          <p className="text-sm text-muted-foreground text-start sm:text-base truncate">
            {subtitle}
          </p>
        ) : null}
      </header>

      {toolbar !== undefined ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
          {toolbar}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 min-w-0 overflow-x-hidden">
        {isLoading ? <DefaultSkeleton /> : isEmpty ? (emptyState ?? null) : children}
      </div>
    </section>
  )
}
