/**
 * Activity Page — Phase 42 Plan 08 reskin (PAGE-04).
 *
 * Renders the IntelDossier handoff `.act-list` 3-col grid timeline via
 * <ActivityList>. Preserves the All / Following tabs (D-13: real follow
 * feature). Strips:
 *   - Collapsible Statistics panel
 *   - Settings sheet trigger (preferences move to Settings → Notifications,
 *     out of scope for this plan)
 *   - Legacy enhanced-activity-feed body (replaced by ActivityList)
 *
 * Emits `data-loading` on the section root so the Phase 42 Playwright
 * helper (`gotoPhase42Page`) can wait deterministically.
 */

import { useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/signature-visuals'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { ActivityList } from '@/components/activity-feed/ActivityList'

type ActivityTab = 'all' | 'following'

export function ActivityPage(): ReactElement {
  const { t, i18n } = useTranslation('activity-feed')
  const isRTL = i18n.language === 'ar'
  const [tab, setTab] = useState<ActivityTab>('all')

  const feed = useActivityFeed({ followed_only: tab === 'following' })
  const { activities, isLoading, error } = feed

  return (
    <section
      role="region"
      aria-label="Activity"
      dir={isRTL ? 'rtl' : 'ltr'}
      data-loading={isLoading ? 'true' : 'false'}
      className="page flex min-w-0 flex-col gap-[var(--gap)]"
    >
      <PageHeader title={t('title')} />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ActivityTab)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="following">{t('tabs.following')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {error != null && (
        <div className="card" role="alert">
          <Icon name="alert" size={16} style={{ color: 'var(--danger)' }} aria-hidden />
          <span className="ms-2">{t('errorList')}</span>
        </div>
      )}

      {isLoading && (
        <div className="card" data-testid="activity-skeleton">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-[var(--row-h)] w-full animate-pulse rounded-[var(--radius-sm)] mb-2"
              style={{ background: 'var(--line-soft)' }}
            />
          ))}
        </div>
      )}

      {!isLoading && error == null && activities.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--ink-mute)' }}>
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {tab === 'all' ? t('empty.all') : t('empty.following')}
          </h2>
        </div>
      )}

      {!isLoading && error == null && activities.length > 0 && (
        <div className="card">
          <ActivityList activities={activities} />
        </div>
      )}
    </section>
  )
}
