import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { DossierGlyph } from '@/components/signature-visuals'
import { useDossierStore, type DossierEntry } from '@/store/dossierStore'
import { useDossierDrawer } from '@/hooks/useDossierDrawer'

const MAX_RECENT = 7

function resolveName(entry: DossierEntry, isArabic: boolean): string {
  if (isArabic && entry.name_ar !== undefined && entry.name_ar.trim().length > 0) {
    return entry.name_ar
  }
  return entry.name_en
}

export function RecentDossiers(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const recentDossiers = useDossierStore((s) => s.recentDossiers)
  const { openDossier } = useDossierDrawer()
  const isArabic = i18n.language === 'ar'
  const locale = isArabic ? ar : enUS

  if (recentDossiers.length === 0) {
    return (
      <section
        role="region"
        aria-labelledby="recent-heading"
        className="recent card"
      >
        <h3 id="recent-heading" className="card-title mb-3 text-start">
          {t('recent.title')}
        </h3>
        <p className="text-sm text-ink-soft text-start">{t('recent.empty')}</p>
      </section>
    )
  }

  return (
    <section
      role="region"
      aria-labelledby="recent-heading"
      className="recent card"
    >
      <h3 id="recent-heading" className="card-title mb-3 text-start">
        {t('recent.title')}
      </h3>
      <ul className="space-y-2">
        {recentDossiers.slice(0, MAX_RECENT).map((d): ReactElement => {
          const name = resolveName(d, isArabic)
          const viewedAt = d.viewedAt ?? Date.now()
          return (
            <li key={d.id}>
              <button
                type="button"
                className="recent-row flex items-center gap-3 min-h-11 rounded-md hover:bg-surface/60 ps-2 pe-2 w-full text-start"
                style={{ minBlockSize: 44 }}
                onClick={(): void => openDossier({ id: d.id, type: d.type })}
                aria-label={name}
                data-testid="recent-dossier-trigger"
              >
                <DossierGlyph type={d.type} name={name} size={20} />
                <span className="text-sm text-ink text-start truncate flex-1">{name}</span>
                <span className="text-xs text-ink-soft">
                  {formatDistanceToNow(viewedAt, { addSuffix: true, locale })}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
