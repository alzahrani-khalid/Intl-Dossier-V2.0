import { type ReactElement } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDayFirst } from '@/lib/format-date'

import { useAuth } from '@/hooks/useAuth'

function greetingKey(now: Date): 'morning' | 'afternoon' | 'evening' {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  return 'evening'
}

function firstName(name: string | null | undefined, fallback: string): string {
  if (name == null || name.trim() === '') return fallback
  const parts = name.trim().split(/\s+/)
  return parts[0] ?? fallback
}

export function DashboardHero(): ReactElement {
  const { t } = useTranslation('dashboard-widgets')
  const { user } = useAuth()
  const now = new Date()

  // Dates display as `Tue 28 Apr` — day-first, abbreviated weekday + month, no
  // comma, Latin digits in both en and ar (D-82-01). Route through the single
  // canonical formatter so the hero matches list rows / digest timestamps; the
  // prior ad-hoc Intl.DateTimeFormat(toFormatLocale('en')) resolved to en-US and
  // rendered the month-first `Sat, Jul 4` shape this phase exists to eliminate.
  const dateLabel = formatDayFirst(now)

  const name = firstName(user?.name, t('hero.fallbackName'))
  const greeting = t(`hero.greeting.${greetingKey(now)}`, { name })

  return (
    <header className="page-head" aria-labelledby="dash-hero-greeting">
      <div>
        <h1 id="dash-hero-greeting" className="page-title">
          {greeting}
        </h1>
        <div className="page-sub">
          {dateLabel} · {t('hero.subtitle')}
        </div>
      </div>
      <div className="dash-hero-actions">
        <Link to="/intake" className="btn">
          <Plus size={14} aria-hidden="true" />
          <span>{t('hero.actions.newRequest')}</span>
        </Link>
        <Link to="/engagements" className="btn btn-primary">
          <Plus size={14} aria-hidden="true" />
          <span>{t('hero.actions.newEngagement')}</span>
        </Link>
      </div>
    </header>
  )
}
