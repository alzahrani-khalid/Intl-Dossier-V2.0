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
      <div key={i} className="h-16 w-full animate-pulse rounded-md bg-muted" />
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

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={isLoading ? 'true' : 'false'}
      className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-start sm:text-3xl md:text-4xl">{title}</h1>
        {subtitle !== undefined && subtitle !== '' ? (
          <p className="text-sm text-muted-foreground text-start sm:text-base">{subtitle}</p>
        ) : null}
      </header>

      {toolbar !== undefined ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">{toolbar}</div>
      ) : null}

      <div className="flex flex-col gap-3">
        {isLoading ? <DefaultSkeleton /> : isEmpty ? (emptyState ?? null) : children}
      </div>
    </section>
  )
}
