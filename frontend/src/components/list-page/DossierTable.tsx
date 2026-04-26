import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DossierGlyph } from '@/components/signature-visuals'
import type { DossierGlyphProps } from '@/components/signature-visuals'
import { sensitivityChipClass, sensitivityLabelKey } from './sensitivity'

export type DossierTableRow = {
  id: string
  type: DossierGlyphProps['type']
  iso?: string
  name_en: string
  name_ar: string
  engagement_count: number
  last_touch?: string | null
  sensitivity_level: number
}

export type DossierTableProps = {
  rows: DossierTableRow[]
  onRowClick?: (row: DossierTableRow) => void
  isLoading?: boolean
  emptyState?: ReactNode
}

const formatLastTouch = (iso: string | null | undefined, locale: string): string => {
  if (iso == null || iso === '') return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const SkeletonRow = (): ReactNode => (
  <div
    aria-hidden="true"
    className="grid items-center gap-3 px-4 py-3 border-b border-border animate-pulse"
    style={{ gridTemplateColumns: 'auto 1fr auto auto auto' }}
  >
    <div className="size-8 rounded-full bg-muted" />
    <div className="h-4 w-40 rounded bg-muted" />
    <div className="h-4 w-16 rounded bg-muted hidden md:block" />
    <div className="h-4 w-20 rounded bg-muted hidden md:block" />
    <div className="h-5 w-20 rounded-full bg-muted" />
  </div>
)

export function DossierTable({
  rows,
  onRowClick,
  isLoading = false,
  emptyState,
}: DossierTableProps): ReactNode {
  const { t, i18n } = useTranslation(['list-pages', 'countries'])
  const isRTL = i18n.language === 'ar'

  if (isLoading) {
    return (
      <div
        data-testid="dossier-table-skeleton"
        role="status"
        aria-label={t('loading', { ns: 'list-pages' })}
      >
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <>
        {emptyState ?? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            {t('empty', { ns: 'list-pages' })}
          </div>
        )}
      </>
    )
  }

  return (
    <div
      role="table"
      aria-label={t('countries.table.aria', { defaultValue: 'Dossiers', ns: 'countries' })}
    >
      {/* Desktop / tablet header (md+) */}
      <div
        role="row"
        className="hidden md:grid items-center gap-3 px-4 py-2 text-xs font-medium uppercase text-muted-foreground border-b border-border"
        style={{ gridTemplateColumns: 'auto 1fr auto auto auto' }}
      >
        <span aria-hidden="true" />
        <span role="columnheader">
          {t('countries.table.name', { defaultValue: 'Name', ns: 'countries' })}
        </span>
        <span role="columnheader">
          {t('countries.table.engagements', { defaultValue: 'Engagements', ns: 'countries' })}
        </span>
        <span role="columnheader">
          {t('countries.table.lastTouch', { defaultValue: 'Last touch', ns: 'countries' })}
        </span>
        <span role="columnheader">
          {t('countries.table.sensitivity', { defaultValue: 'Sensitivity', ns: 'countries' })}
        </span>
      </div>

      {rows.map((row) => {
        const displayName = isRTL ? row.name_ar : row.name_en
        const chipClass = sensitivityChipClass(row.sensitivity_level)
        const chipLabel = t(sensitivityLabelKey(row.sensitivity_level), {
          ns: 'countries',
          defaultValue: '',
        })

        return (
          <button
            key={row.id}
            type="button"
            role="row"
            onClick={onRowClick ? (): void => onRowClick(row) : undefined}
            className="w-full text-start min-h-11 grid items-center gap-3 px-4 py-3 border-b border-border transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[auto_1fr_auto_auto_auto] grid-cols-[auto_1fr_auto]"
          >
            <DossierGlyph type={row.type} iso={row.iso} name={displayName} size={32} />
            <span className="font-medium truncate text-start">{displayName}</span>
            <span className="hidden md:inline text-sm text-muted-foreground">
              {row.engagement_count}
            </span>
            <span className="hidden md:inline text-sm text-muted-foreground">
              {formatLastTouch(row.last_touch, i18n.language)}
            </span>
            <span className={`chip ${chipClass}`}>{chipLabel}</span>
            <ChevronRight
              data-testid="row-chevron"
              className="size-4 text-muted-foreground md:hidden"
              style={isRTL ? { transform: 'scaleX(-1)' } : undefined}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
