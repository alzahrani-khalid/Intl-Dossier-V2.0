import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { DossierGlyph } from '@/components/signature-visuals'
import { useDossierStore, type DossierEntry } from '@/store/dossierStore'

const MAX_RECENT = 7

function resolveName(entry: DossierEntry, isArabic: boolean): string {
  if (isArabic && entry.name_ar !== undefined && entry.name_ar.trim().length > 0) {
    return entry.name_ar
  }
  return entry.name_en
}

function resolveRoute(entry: DossierEntry): string {
  if (entry.route !== undefined && entry.route.length > 0) {
    return entry.route
  }
  return `/dossiers/${entry.id}`
}

export function RecentDossiers(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const recentDossiers = useDossierStore((s) => s.recentDossiers)
  const isArabic = i18n.language === 'ar'
  const locale = isArabic ? ar : enUS

  if (recentDossiers.length === 0) {
    return (
      <section
        role="region"
        aria-labelledby="recent-heading"
        className="recent rounded-lg border border-line bg-surface-raised p-4"
      >
        <h3 id="recent-heading" className="text-sm font-medium text-ink mb-3 text-start">
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
      className="recent rounded-lg border border-line bg-surface-raised p-4"
    >
      <h3 id="recent-heading" className="text-sm font-medium text-ink mb-3 text-start">
        {t('recent.title')}
      </h3>
      <ul className="space-y-2">
        {recentDossiers.slice(0, MAX_RECENT).map((d): ReactElement => {
          const name = resolveName(d, isArabic)
          const route = resolveRoute(d)
          const viewedAt = d.viewedAt ?? Date.now()
          return (
            <li key={d.id}>
              <Link
                to={route as any}
                className="recent-row flex items-center gap-3 min-h-11 rounded-md hover:bg-surface/60 ps-2 pe-2"
              >
                <DossierGlyph type={d.type} name={name} size={20} />
                <span className="text-sm text-ink text-start truncate flex-1">{name}</span>
                <span className="text-xs text-ink-soft">
                  {formatDistanceToNow(viewedAt, { addSuffix: true, locale })}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
