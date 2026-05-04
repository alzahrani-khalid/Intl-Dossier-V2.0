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

const fallbackSensitivityLabel = (level: number, isRTL: boolean): string => {
  const labels: Record<number, { en: string; ar: string }> = {
    1: { en: 'Public', ar: 'عام' },
    2: { en: 'Internal', ar: 'داخلي' },
    3: { en: 'Restricted', ar: 'مقيّد' },
    4: { en: 'Confidential', ar: 'سري' },
  }
  return labels[level]?.[isRTL ? 'ar' : 'en'] ?? (isRTL ? 'غير معروف' : 'Unknown')
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
}: DossierTableProps): ReactNode {
  const { t, i18n } = useTranslation('list-pages')
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
      role="list"
      aria-label={t('table.aria', { defaultValue: isRTL ? 'الدوسيهات' : 'Dossiers' })}
      className="card overflow-hidden p-0"
    >
      {/* Desktop / tablet header (md+) */}
      <div
        className="dossier-row label hidden md:grid"
        style={{ gridTemplateColumns: 'auto 1fr auto auto auto' }}
      >
        <span aria-hidden="true" />
        <span>{t('table.name', { defaultValue: isRTL ? 'الاسم' : 'Name' })}</span>
        <span>{t('table.engagements', { defaultValue: isRTL ? 'المشاركات' : 'Engagements' })}</span>
        <span>{t('table.lastTouch', { defaultValue: isRTL ? 'آخر تحديث' : 'Last touch' })}</span>
        <span>{t('table.sensitivity', { defaultValue: isRTL ? 'الحساسية' : 'Sensitivity' })}</span>
      </div>

      {rows.map((row) => {
        const displayName = isRTL ? row.name_ar : row.name_en
        const chipClass = sensitivityChipClass(row.sensitivity_level)
        const chipLabel = t(sensitivityLabelKey(row.sensitivity_level), {
          defaultValue: fallbackSensitivityLabel(row.sensitivity_level, isRTL),
        })

        return (
          <button
            key={row.id}
            type="button"
            role="listitem"
            onClick={onRowClick ? (): void => onRowClick(row) : undefined}
            className="dossier-row w-full min-w-0 grid-cols-[auto_1fr_auto] text-start transition-colors hover:bg-[var(--line-soft)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] md:grid-cols-[auto_1fr_auto_auto_auto]"
          >
            <DossierGlyph type={row.type} iso={row.iso} name={displayName} size={32} />
            <span className="font-medium truncate text-start min-w-0">{displayName}</span>
            <span className="hidden shrink-0 text-[13px] text-[var(--ink-mute)] md:inline">
              {row.engagement_count}
            </span>
            <span className="hidden shrink-0 text-[13px] text-[var(--ink-mute)] md:inline">
              {formatLastTouch(row.last_touch, i18n.language)}
            </span>
            <span className={`chip shrink-0 ${chipClass}`}>{chipLabel}</span>
            <ChevronRight
              data-testid="row-chevron"
              className="icon-flip size-4 shrink-0 text-[var(--ink-faint)] md:hidden"
              style={isRTL ? { transform: 'scaleX(-1)' } : undefined}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}
