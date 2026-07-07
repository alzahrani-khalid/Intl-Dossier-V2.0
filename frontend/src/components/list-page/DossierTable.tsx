import type { CSSProperties, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DossierGlyph } from '@/components/signature-visuals'
import type { DossierGlyphProps } from '@/components/signature-visuals'
import { formatDayFirst } from '@/lib/format-date'
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

/** Optional (toggleable) columns. Glyph + name are always present. */
export type DossierTableColumn = 'engagements' | 'lastTouch' | 'sensitivity'

/** Fixed column order — the single source of truth for the grid template. */
const OPTIONAL_COLUMN_ORDER: readonly DossierTableColumn[] = [
  'engagements',
  'lastTouch',
  'sensitivity',
]

export type DossierTableProps = {
  rows: DossierTableRow[]
  onRowClick?: (row: DossierTableRow) => void
  isLoading?: boolean
  emptyState?: ReactNode
  /** Which optional columns to show. Absent = all visible (existing consumers unaffected). */
  visibleColumns?: ReadonlyArray<DossierTableColumn>
}

const fallbackSensitivityLabel = (level: number, isRTL: boolean): string => {
  const labels: Record<number, { en: string; ar: string }> = {
    1: { en: 'Public', ar: 'عام' },
    2: { en: 'Internal', ar: 'داخلي' },
    3: { en: 'Restricted', ar: 'مقيّد' },
    4: { en: 'Confidential', ar: 'سري' },
  }
  return labels[level]?.[isRTL ? 'ar' : 'en'] ?? (isRTL ? 'غير معروف' : 'Unknown')
}

/**
 * Compute the desktop grid template from the visible optional columns. glyph
 * (auto) + name (1fr) are always present; one `auto` track per visible optional
 * column, in OPTIONAL_COLUMN_ORDER. Applied via the `--dossier-cols` custom
 * property so the responsive `.dossier-row` rule keeps the mobile template.
 */
const gridTemplateFor = (visible: readonly DossierTableColumn[]): string =>
  ['auto', 'minmax(0, 1fr)', ...visible.map(() => 'auto')].join(' ')

const SkeletonRow = (): ReactNode => (
  <div
    aria-hidden="true"
    className="dossier-row animate-pulse"
    style={{ gridTemplateColumns: 'auto 1fr auto auto auto' }}
  >
    <div className="size-8 rounded-full bg-[var(--line-soft)]" />
    <div className="h-4 w-40 rounded bg-[var(--line-soft)]" />
    <div className="hidden h-4 w-16 rounded bg-[var(--line-soft)] md:block" />
    <div className="hidden h-4 w-20 rounded bg-[var(--line-soft)] md:block" />
    <div className="h-5 w-20 rounded-full bg-[var(--line-soft)]" />
  </div>
)

export function DossierTable({
  rows,
  onRowClick,
  isLoading = false,
  emptyState,
  visibleColumns,
}: DossierTableProps): ReactNode {
  const { t, i18n } = useTranslation('list-pages')
  const isRTL = i18n.language === 'ar'

  const visible = OPTIONAL_COLUMN_ORDER.filter(
    (c) => visibleColumns === undefined || visibleColumns.includes(c),
  )
  const showEngagements = visible.includes('engagements')
  const showLastTouch = visible.includes('lastTouch')
  const showSensitivity = visible.includes('sensitivity')
  // Custom property drives the desktop template; mobile uses the base .dossier-row rule.
  const gridStyle = { '--dossier-cols': gridTemplateFor(visible) } as CSSProperties

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
    <div className="card overflow-hidden p-0">
      {/* Desktop / tablet header (md+) */}
      <div className="dossier-row label hidden md:grid" style={gridStyle}>
        <span aria-hidden="true" />
        <span>{t('table.name', { defaultValue: isRTL ? 'الاسم' : 'Name' })}</span>
        {showEngagements ? (
          <span>
            {t('table.engagements', { defaultValue: isRTL ? 'المشاركات' : 'Engagements' })}
          </span>
        ) : null}
        {showLastTouch ? (
          <span>{t('table.lastTouch', { defaultValue: isRTL ? 'آخر تحديث' : 'Last touch' })}</span>
        ) : null}
        {showSensitivity ? (
          <span>
            {t('table.sensitivity', { defaultValue: isRTL ? 'الحساسية' : 'Sensitivity' })}
          </span>
        ) : null}
      </div>

      <ul
        role="list"
        aria-label={t('table.aria', { defaultValue: isRTL ? 'الدوسيهات' : 'Dossiers' })}
        className="dossier-row-list"
      >
        {rows.map((row) => {
          const displayName = isRTL ? row.name_ar : row.name_en
          const chipClass = sensitivityChipClass(row.sensitivity_level)
          const chipLabel = t(sensitivityLabelKey(row.sensitivity_level), {
            defaultValue: fallbackSensitivityLabel(row.sensitivity_level, isRTL),
          })

          return (
            <li key={row.id}>
              <button
                type="button"
                aria-label={displayName}
                onClick={onRowClick ? (): void => onRowClick(row) : undefined}
                style={gridStyle}
                className="dossier-row w-full min-w-0 text-start transition-colors hover:bg-[var(--line-soft)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
              >
                <DossierGlyph type={row.type} iso={row.iso} name={displayName} size={32} />
                <span className="font-medium truncate text-start min-w-0">{displayName}</span>
                {showEngagements ? (
                  <span className="hidden shrink-0 text-[13px] text-[var(--ink-mute)] md:inline">
                    {row.engagement_count}
                  </span>
                ) : null}
                {showLastTouch ? (
                  <span className="hidden shrink-0 text-[13px] text-[var(--ink-mute)] md:inline">
                    {formatDayFirst(row.last_touch ?? '', i18n.language)}
                  </span>
                ) : null}
                {showSensitivity ? (
                  <span className={`chip shrink-0 ${chipClass}`}>{chipLabel}</span>
                ) : null}
                <ChevronRight
                  data-testid="row-chevron"
                  className="icon-flip size-4 shrink-0 text-[var(--ink-faint)] md:hidden"
                  style={isRTL ? { transform: 'scaleX(-1)' } : undefined}
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
