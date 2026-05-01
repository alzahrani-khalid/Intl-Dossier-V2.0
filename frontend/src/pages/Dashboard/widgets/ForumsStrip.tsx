import { type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { useForums } from '@/hooks/useForums'
import type { Forum } from '@/types/forum.types'
import { WidgetSkeleton } from './WidgetSkeleton'

/**
 * Derive a monogram short-code from a forum name.
 *  "General Assembly"  → "GA"
 *  "United Nations"    → "UN"
 *  "G20"               → "G20" (single token, slice(0,3))
 *  "Group of Twenty"   → "GOT"
 */
function monogram(name: string): string {
  const tokens = name.split(/\s+/).filter((w) => w.length > 0)
  if (tokens.length === 0) return '?'
  if (tokens.length === 1) {
    return (tokens[0] ?? '').toUpperCase().slice(0, 3)
  }
  return tokens
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 3)
}

function resolveName(f: Forum, isArabic: boolean): string {
  if (isArabic && f.name_ar.trim().length > 0) return f.name_ar
  return f.name_en
}

export function ForumsStrip(): ReactElement {
  const { t, i18n } = useTranslation('dashboard-widgets')
  const isArabic = i18n.language === 'ar'
  const { data, isLoading, isError } = useForums({ limit: 4 })

  if (isLoading) {
    return <WidgetSkeleton rows={1} />
  }

  if (isError) {
    return (
      <section
        role="region"
        aria-labelledby="forums-heading"
        className="forums card"
      >
        <h3 id="forums-heading" className="card-title mb-3 text-start">
          {t('forums.title')}
        </h3>
        <p className="text-sm text-ink-soft text-start">{t('error.load_failed')}</p>
      </section>
    )
  }

  const forums = data?.data ?? []
  if (forums.length === 0) {
    return (
      <section
        role="region"
        aria-labelledby="forums-heading"
        className="forums card"
      >
        <h3 id="forums-heading" className="card-title mb-3 text-start">
          {t('forums.title')}
        </h3>
        <p className="text-sm text-ink-soft text-start">{t('forums.empty')}</p>
      </section>
    )
  }

  return (
    <section
      role="region"
      aria-labelledby="forums-heading"
      className="forums card"
    >
      <h3 id="forums-heading" className="card-title mb-3 text-start">
        {t('forums.title')}
      </h3>
      <ul className="forums-row flex flex-col sm:flex-row gap-2">
        {forums.map((f): ReactElement => {
          const name = resolveName(f, isArabic)
          const status = String(f.status)
          return (
            <li
              key={f.id}
              className="forum-card flex items-center gap-2 rounded-md border border-line bg-surface p-2 min-h-11 flex-1 min-w-0"
            >
              <LtrIsolate className="forum-monogram font-mono text-xs text-ink">
                {monogram(f.name_en)}
              </LtrIsolate>
              <span className="text-sm text-ink text-start truncate flex-1">{name}</span>
              <Badge>{t(`forums.status.${status}`, status)}</Badge>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
