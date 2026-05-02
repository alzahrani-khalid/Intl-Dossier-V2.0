/**
 * Phase 42 — Plan 08 — ActivityList vitest suite.
 *
 * Tests cover the 7 behaviours from 42-08-PLAN.md §Task 1 <behavior>:
 *   1. <ul.act-list> with one <li.act-row> per activity
 *   2. Row child order: .act-t (mono time) → <Icon/> → sentence span
 *   3. Icon mapping per action_type (6+ glyphs from Wave 0 IconName union)
 *   4. .act-where element renders inside the sentence (CSS class drives color)
 *   5. AR locale converts time digits via toArDigits
 *   6. R-05 conditional click: relative `/...` URLs are interactive; absent → not interactive
 *   7. R-05 open-redirect guard: external/protocol-relative/javascript:/empty URLs render NON-interactive
 *
 * The global tests/setup.ts mock for `react-i18next` stubs <Trans> as
 * `({ children }) => children` which would discard our `components` slots.
 * This file overrides that mock with a Trans implementation that renders
 * the configured slot components so `.act-where` is observable in the DOM.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ActivityItem } from '@/types/activity-feed.types'

// ---- mocks (must be declared BEFORE the SUT import; vi.mock is hoisted) ----

const navigateSpy = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: (): typeof navigateSpy => navigateSpy,
}))

// Override the global tests/setup.ts mock. We need <Trans> to actually render
// the `components` slots so `.act-where` is in the DOM.
vi.mock('react-i18next', () => ({
  useTranslation: (): {
    t: (key: string) => string
    i18n: { language: string }
  } => ({
    t: (key: string) => key,
    i18n: { language: i18nLanguage },
  }),
  Trans: ({
    components,
    values,
  }: {
    i18nKey?: string
    components?: Record<string, React.ReactElement>
    values?: Record<string, string>
  }): React.ReactElement => {
    // Minimal renderer: emit each slot component with its placeholder value.
    const entityNode = components?.entity
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ({ ...components.entity, props: { ...components.entity.props, children: values?.entity } })
      : null
    const whereNode = components?.where
      ? ({ ...components.where, props: { ...components.where.props, children: values?.where } })
      : null
    return (
      <>
        {entityNode}
        {' in '}
        {whereNode}
      </>
    )
  },
}))

// Mutable language for the i18n mock; flip per test.
let i18nLanguage = 'en'

// ---- import SUT after mocks ---------------------------------------------

import { ActivityList } from '../ActivityList'

// ---- fixtures ------------------------------------------------------------

function makeActivity(partial: Partial<ActivityItem> = {}): ActivityItem {
  return {
    id: partial.id ?? 'a1',
    action_type: partial.action_type ?? 'create',
    entity_type: partial.entity_type ?? 'task',
    entity_id: partial.entity_id ?? 'e1',
    entity_name_en: partial.entity_name_en ?? 'Brief 19',
    entity_name_ar: partial.entity_name_ar ?? 'إيجاز ١٩',
    actor_id: partial.actor_id ?? 'u1',
    actor_name: partial.actor_name ?? 'Mona',
    description_en: partial.description_en ?? '',
    description_ar: partial.description_ar ?? '',
    related_entity_type: partial.related_entity_type,
    related_entity_id: partial.related_entity_id,
    related_entity_name_en: partial.related_entity_name_en ?? 'France',
    related_entity_name_ar: partial.related_entity_name_ar ?? 'فرنسا',
    metadata: partial.metadata,
    is_public: partial.is_public ?? true,
    visibility_scope: partial.visibility_scope ?? 'all',
    // 5 minutes ago, relative to test runtime
    created_at: partial.created_at ?? new Date(Date.now() - 5 * 60_000).toISOString(),
  }
}

// ---- tests ---------------------------------------------------------------

beforeEach(() => {
  navigateSpy.mockReset()
  i18nLanguage = 'en'
})

describe('ActivityList', () => {
  it('Test 1 — renders <ul.act-list> with one <li.act-row> per activity', () => {
    const activities = [makeActivity({ id: 'a1' }), makeActivity({ id: 'a2' })]
    const { container } = render(<ActivityList activities={activities} />)
    expect(container.querySelector('ul.act-list')).not.toBeNull()
    expect(container.querySelectorAll('li.act-row')).toHaveLength(2)
  })

  it('Test 2 — row child order: .act-t → Icon → sentence span', () => {
    const activities = [makeActivity({ action_type: 'approval' })]
    const { container } = render(<ActivityList activities={activities} />)
    const row = container.querySelector('li.act-row')
    expect(row).not.toBeNull()
    const children = Array.from(row!.children)
    expect(children[0]).toHaveClass('act-t')
    expect(children[1]?.tagName.toLowerCase()).toBe('svg') // Icon renders <svg>
    expect(children[2]?.tagName.toLowerCase()).toBe('span') // sentence container
  })

  it('Test 3 — icon mapping per action_type (approval/rejection/comment/create/upload/share/update)', () => {
    const cases: Array<{ type: ActivityItem['action_type']; iconName: string }> = [
      { type: 'approval', iconName: 'check' },
      { type: 'rejection', iconName: 'alert' },
      { type: 'comment', iconName: 'chat' },
      { type: 'create', iconName: 'plus' },
      { type: 'upload', iconName: 'file' },
      { type: 'share', iconName: 'link' },
      { type: 'update', iconName: 'dot' },
      { type: 'view', iconName: 'dot' },
    ]
    for (const c of cases) {
      const { container, unmount } = render(
        <ActivityList activities={[makeActivity({ id: c.type, action_type: c.type })]} />,
      )
      const icon = container.querySelector(`[data-testid="icon-${c.iconName}"]`)
      expect(icon, `expected ${c.type} → ${c.iconName}`).not.toBeNull()
      unmount()
    }
  })

  it('Test 4 — .act-where renders in the sentence (color comes from index.css class)', () => {
    const activities = [makeActivity({ action_type: 'approval' })]
    const { container } = render(<ActivityList activities={activities} />)
    expect(container.querySelector('.act-where')).not.toBeNull()
  })

  it('Test 5 — AR locale converts time digits via toArDigits', () => {
    i18nLanguage = 'ar'
    // 5 minutes ago → "5m" in EN, "٥د" in AR (formatRelativeTime branches on locale)
    const activities = [
      makeActivity({ created_at: new Date(Date.now() - 5 * 60_000).toISOString() }),
    ]
    const { container } = render(<ActivityList activities={activities} />)
    const t = container.querySelector('.act-t')
    expect(t).not.toBeNull()
    // AR digits 0-9: ٠١٢٣٤٥٦٧٨٩ — assert the literal "5" was replaced with "٥".
    expect(t!.textContent ?? '').toMatch(/٥/)
    expect(t!.textContent ?? '').not.toMatch(/[0-9]/)
  })

  it('Test 6 — R-05 row click: relative path is interactive; absent metadata is not', async () => {
    const interactive = makeActivity({
      id: 'i1',
      metadata: { navigation_url: '/tasks/abc-123' },
    })
    const inactive = makeActivity({ id: 'i2', metadata: undefined })
    const { container } = render(<ActivityList activities={[interactive, inactive]} />)
    const rows = Array.from(container.querySelectorAll<HTMLLIElement>('li.act-row'))
    expect(rows).toHaveLength(2)

    // Interactive row
    expect(rows[0]).toHaveAttribute('role', 'button')
    expect(rows[0]).toHaveAttribute('tabindex', '0')
    expect(rows[0]?.style.cursor).toBe('pointer')

    // Non-interactive row
    expect(rows[1]).not.toHaveAttribute('role')
    expect(rows[1]).not.toHaveAttribute('tabindex')
    expect(rows[1]?.style.cursor).toBe('default')

    // Click the interactive row → navigate spy fires with the relative path
    rows[0]!.click()
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith({ to: '/tasks/abc-123' })

    // Click non-interactive row → no navigate
    navigateSpy.mockClear()
    rows[1]!.click()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  it('Test 7 — R-05 open-redirect guard rejects external/protocol-relative/javascript:/empty URLs', () => {
    const dangerous: Array<string> = [
      'https://evil.example',
      '//evil.example',
      'javascript:alert(1)',
      '',
    ]
    const activities = dangerous.map((url, i) =>
      makeActivity({ id: `bad-${i}`, metadata: { navigation_url: url } }),
    )
    const { container } = render(<ActivityList activities={activities} />)
    const rows = Array.from(container.querySelectorAll<HTMLLIElement>('li.act-row'))
    expect(rows).toHaveLength(dangerous.length)
    for (const row of rows) {
      expect(row).not.toHaveAttribute('role')
      expect(row).not.toHaveAttribute('tabindex')
      expect(row.style.cursor).toBe('default')
      // Click must not trigger navigation.
      row.click()
    }
    expect(navigateSpy).not.toHaveBeenCalled()
  })
})

// keep TS happy when this file is treated as a module under isolatedModules
export {}

// access screen to silence unused-import lint
void screen
