/**
 * ListEmptyState — F26 Pattern A + filtered-empty branch + CTA gating (Plan 87-04)
 *
 * Locks the AFF-04 component contract so Wave-2 wiring plans (87-06..87-09) can
 * pass props and get spec-conformant behaviour:
 *   - all 9 core-surface entities render Pattern A (icon wash + heading + body + CTA)
 *   - onCreate present  → exactly one `.btn-primary` CTA labelled `list.<entity>.cta`
 *   - onCreate absent   → NO CTA at all (never a disabled accent button)
 *   - filtered=true      → `list.filtered.*` copy + ghost `Clear filters`, never the create CTA
 *
 * Notes:
 * - The project test setup does NOT register `@testing-library/jest-dom`; assertions
 *   use plain DOM queries (`querySelector`, `textContent`) with `.toBe()` / `.toBeNull()`,
 *   matching TourableEmptyState.test.tsx.
 * - `t` echoes the key back verbatim so we assert on `list.<entity>.*` keys directly.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
  Trans: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' as const, locale: 'en' }),
}))

// Isolate ListEmptyState from its optional side-panels (only rendered behind flags).
vi.mock('../ContextualSuggestions', () => ({ ContextualSuggestions: () => null }))
vi.mock('../CollaborativeEmptyState', () => ({ CollaborativeEmptyState: () => null }))

import { ListEmptyState } from '../ListEmptyState'

describe('ListEmptyState — F26 contract', () => {
  it.each(['topic', 'working_group', 'elected_official', 'work_item'] as const)(
    'renders %s heading + body from the copy matrix keys',
    (entity) => {
      const { container } = render(<ListEmptyState entityType={entity} />)
      expect(container.textContent).toContain(`list.${entity}.title`)
      expect(container.textContent).toContain(`list.${entity}.description`)
    },
  )

  it('renders exactly one .btn-primary CTA labelled list.<entity>.cta when onCreate is provided', () => {
    const onCreate = vi.fn()
    const { container } = render(<ListEmptyState entityType="topic" onCreate={onCreate} />)
    const primaries = container.querySelectorAll('.btn-primary')
    expect(primaries.length).toBe(1)
    expect(primaries[0]?.textContent).toContain('list.topic.cta')
    fireEvent.click(primaries[0] as Element)
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('renders NO CTA (no accent, no disabled button) when onCreate is absent', () => {
    const { container } = render(<ListEmptyState entityType="topic" />)
    expect(container.querySelectorAll('.btn-primary').length).toBe(0)
    expect(container.querySelector('button[disabled]')).toBeNull()
  })

  it('filtered=true shows the filtered copy + ghost clear button, never the create CTA', () => {
    const onClearFilters = vi.fn()
    const onCreate = vi.fn()
    const { container } = render(
      <ListEmptyState
        entityType="country"
        filtered
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />,
    )
    expect(container.textContent).toContain('list.filtered.title')
    expect(container.querySelectorAll('.btn-primary').length).toBe(0)
    const ghost = container.querySelector('.btn-ghost')
    expect(ghost).not.toBeNull()
    expect(ghost?.textContent).toContain('list.filtered.clear')
    fireEvent.click(ghost as Element)
    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })

  it('renders the icon inside a rounded-full wash on bg-surface-raised', () => {
    const { container } = render(<ListEmptyState entityType="country" />)
    const wash = container.querySelector('.bg-surface-raised')
    expect(wash).not.toBeNull()
    expect(wash?.className).toContain('rounded-full')
  })

  it('keeps rendering an existing entity (country) without crashing', () => {
    const { container } = render(<ListEmptyState entityType="country" />)
    expect(container.textContent).toContain('list.country.title')
  })
})
