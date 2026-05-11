/**
 * RecentActivitySection — Wave 1 (Phase 41 plan 04) tests.
 *
 * Behavior asserted (per 41-04-PLAN.md Task 2):
 *   1. With 6 activities, renders only top 4 rows
 *   2. With 0 activities, renders t('empty.recent_activity')
 *   3. Each row uses class act-row inside parent class act-list
 *   4. Time cell uses formatRelativeTimeShort(a.timestamp, lang) wrapped in LtrIsolate
 *   5. Middle cell renders a dot icon
 *   6. Text cell renders a.actor.name + bilingual title (title_ar under AR if present, else title_en)
 *   7. When actor.name is empty/null, falls back to em-dash '—'
 *   8. Section heading renders t('section.recent_activity')
 *
 * Field-name correctness (41-RESEARCH §2 Pitfall 3):
 *   - recent_activities (NOT activities)
 *   - actor.name (NOT actor_name)
 *   - timestamp (NOT created_at)
 *   - title_en/title_ar (NOT action_label)
 */
import { render, screen, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

const i18nState: { language: string } = { language: 'en' }

vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (key: string) => string
    i18n: { language: string }
  } => ({
    t: (key: string): string => key,
    i18n: { language: i18nState.language },
  }),
}))

import { RecentActivitySection } from '../RecentActivitySection'
import type { DossierOverviewResponse } from '@/types/dossier-overview.types'
import type { UnifiedActivity } from '@/types/unified-dossier-activity.types'

function buildActivity(overrides: Partial<UnifiedActivity>): UnifiedActivity {
  return {
    id: 'act-default',
    activity_type: 'task',
    action: 'created',
    title_en: 'Default activity',
    title_ar: '',
    description_en: null,
    description_ar: null,
    timestamp: '2026-05-02T09:42:00Z',
    actor: { id: 'u-1', name: 'Lina Ahmed', email: 'lina@example.com', avatar_url: null },
    source_id: 'src-1',
    source_table: 'tasks',
    inheritance_source: 'direct',
    metadata: {},
    priority: 'medium',
    status: 'open',
    ...overrides,
  } as UnifiedActivity
}

function buildOverview(activities: UnifiedActivity[]): DossierOverviewResponse {
  return {
    calendar_events: { upcoming: [], past: [], today: [], total_count: 0 },
    activity_timeline: {
      recent_activities: activities,
      has_more: false,
      next_cursor: null,
      total_count: activities.length,
    },
  } as unknown as DossierOverviewResponse
}

afterEach(() => {
  i18nState.language = 'en'
  cleanup()
})

describe('RecentActivitySection', () => {
  it('with 6 activities, renders only top 4 rows', () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      buildActivity({
        id: `act-${i}`,
        title_en: `Activity ${i}`,
      }),
    )
    render(<RecentActivitySection overview={buildOverview(activities)} />)
    const rows = screen.getAllByTestId('dossier-drawer-activity-row')
    expect(rows).toHaveLength(4)
    expect(screen.getByText('Activity 0')).toBeTruthy()
    expect(screen.getByText('Activity 3')).toBeTruthy()
    expect(screen.queryByText('Activity 4')).toBeNull()
  })

  it('with 0 activities, renders empty.recent_activity', () => {
    render(<RecentActivitySection overview={buildOverview([])} />)
    expect(screen.getByText('empty.recent_activity')).toBeTruthy()
    expect(screen.queryByTestId('dossier-drawer-activity-list')).toBeNull()
  })

  it('uses act-row class inside act-list parent', () => {
    const activities = [buildActivity({ id: 'act-1', title_en: 'Single' })]
    const { container } = render(<RecentActivitySection overview={buildOverview(activities)} />)
    const list = container.querySelector('.act-list')
    expect(list).not.toBeNull()
    expect(list?.querySelector('.act-row')).not.toBeNull()
  })

  it('renders time HH:mm via formatRelativeTimeShort for same-day activities', () => {
    // Build a same-calendar-day timestamp to force HH:mm format
    const now = new Date()
    const sameDay = new Date(now)
    sameDay.setHours(9, 42, 0, 0)
    const activity = buildActivity({
      id: 'act-time',
      title_en: 'Time test',
      timestamp: sameDay.toISOString(),
    })
    render(<RecentActivitySection overview={buildOverview([activity])} />)
    expect(screen.getByText('09:42')).toBeTruthy()
  })

  it('renders bilingual title — title_ar under AR when present, else title_en', () => {
    i18nState.language = 'ar'
    const activity = buildActivity({
      id: 'act-bi',
      title_en: 'Created task alpha',
      title_ar: 'تم إنشاء المهمة ألفا',
    })
    render(<RecentActivitySection overview={buildOverview([activity])} />)
    expect(screen.getByText('تم إنشاء المهمة ألفا')).toBeTruthy()
    expect(screen.queryByText('Created task alpha')).toBeNull()
  })

  it('renders title_en under AR when title_ar is empty/falsy', () => {
    i18nState.language = 'ar'
    const activity = buildActivity({
      id: 'act-fallback',
      title_en: 'Fallback title',
      title_ar: '',
    })
    render(<RecentActivitySection overview={buildOverview([activity])} />)
    expect(screen.getByText('Fallback title')).toBeTruthy()
  })

  it('renders actor.name (NOT actor_name) in the row', () => {
    const activity = buildActivity({
      id: 'act-actor',
      actor: { id: 'u-9', name: 'Khalid Al-Zahrani', email: 'k@x.com', avatar_url: null },
      title_en: 'Did the thing',
    })
    render(<RecentActivitySection overview={buildOverview([activity])} />)
    expect(screen.getByText('Khalid Al-Zahrani')).toBeTruthy()
  })

  it('falls back to em-dash when actor.name is empty', () => {
    const activity = buildActivity({
      id: 'act-noname',
      actor: { id: 'u-9', name: '', email: 'x@y.com', avatar_url: null },
      title_en: 'Anonymous deed',
    })
    render(<RecentActivitySection overview={buildOverview([activity])} />)
    const row = screen.getByTestId('dossier-drawer-activity-row')
    expect(within(row).getByText('—')).toBeTruthy()
  })

  it('falls back to em-dash when actor.name is null', () => {
    const activity = buildActivity({
      id: 'act-nullname',
      actor: { id: 'u-9', name: null as unknown as string, email: 'x@y.com', avatar_url: null },
      title_en: 'Null actor deed',
    })
    render(<RecentActivitySection overview={buildOverview([activity])} />)
    const row = screen.getByTestId('dossier-drawer-activity-row')
    expect(within(row).getByText('—')).toBeTruthy()
  })

  it('section heading renders t(section.recent_activity)', () => {
    render(<RecentActivitySection overview={buildOverview([])} />)
    expect(screen.getByText('section.recent_activity')).toBeTruthy()
  })
})
