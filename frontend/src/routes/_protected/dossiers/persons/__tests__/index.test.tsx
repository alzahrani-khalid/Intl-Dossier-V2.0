/**
 * Phase 40 LIST-02 — Persons list page render assertions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const map: Record<string, string> = {
        'persons:title': 'Persons',
        'persons:subtitle': 'VIPs and key contacts',
        'persons:empty.title': 'No persons yet',
        'persons:empty.description': 'VIP profiles will appear here.',
        'list-pages:search.placeholder': 'Search…',
        'persons:chip.vip': 'VIP',
        title: 'Persons',
        subtitle: 'VIPs and key contacts',
      }
      return map[key] ?? opts?.defaultValue ?? key
    },
    i18n: { language: 'en' },
  }),
}))

const mockUsePersons = vi.fn()
vi.mock('@/hooks/usePersons', () => ({
  usePersons: (...args: unknown[]) => mockUsePersons(...args),
}))

vi.mock('@/hooks/useDirection', () => ({
  useDirection: () => ({ isRTL: false, dir: 'ltr' }),
}))

vi.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: <T,>(v: T): T => v,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: unknown) => config,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}))

import PersonsListPage from '../index'

describe('PersonsListPage (Phase 40 LIST-02)', () => {
  beforeEach(() => {
    cleanup()
    mockUsePersons.mockReset()
  })

  it('renders title and 2 cards with VIP chip on importance_level >= 4', () => {
    mockUsePersons.mockReturnValue({
      data: {
        data: [
          {
            id: 'p1',
            name_en: 'Dr. Khalid',
            name_ar: 'د. خالد',
            title_en: 'Chief Diplomat',
            organization_name: 'GASTAT',
            importance_level: 5,
          },
          {
            id: 'p2',
            name_en: 'Sara',
            name_ar: 'سارة',
            title_en: 'Analyst',
            organization_name: 'MOFA',
            importance_level: 2,
          },
        ],
        pagination: { total: 2, limit: 20, offset: 0, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage />)

    expect(screen.getByText('Persons')).toBeTruthy()
    expect(screen.getByText('Dr. Khalid')).toBeTruthy()
    expect(screen.getByText('Sara')).toBeTruthy()
    expect(screen.getByText(/Chief Diplomat/)).toBeTruthy()
    expect(screen.getByText(/Analyst/)).toBeTruthy()

    const vipChips = screen.queryAllByTestId('vip-chip')
    expect(vipChips.length).toBe(1)
    expect(vipChips[0]?.textContent).toContain('VIP')
  })

  it('renders 44px circular avatars (size-11 rounded-full)', () => {
    mockUsePersons.mockReturnValue({
      data: {
        data: [
          {
            id: 'p1',
            name_en: 'Dr. Khalid',
            name_ar: 'د. خالد',
            title_en: 'Chief',
            organization_name: 'GASTAT',
            importance_level: 5,
          },
        ],
        pagination: { total: 1, limit: 20, offset: 0, has_more: false },
      },
      isLoading: false,
      isError: false,
    })

    const { container } = render(<PersonsListPage />)
    const avatar = container.querySelector('.size-11.rounded-full')
    expect(avatar).toBeTruthy()
  })

  it('renders empty state when no persons', () => {
    mockUsePersons.mockReturnValue({
      data: { data: [], pagination: { total: 0, limit: 20, offset: 0, has_more: false } },
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage />)
    expect(screen.getByText('No persons yet')).toBeTruthy()
  })

  it('handles array-shape data (defensive)', () => {
    mockUsePersons.mockReturnValue({
      data: [
        {
          id: 'pX',
          name_en: 'Solo',
          name_ar: 'سولو',
          title_en: 'Lead',
          organization_name: 'ACME',
          importance_level: 3,
        },
      ],
      isLoading: false,
      isError: false,
    })

    render(<PersonsListPage />)
    expect(screen.getByText('Solo')).toBeTruthy()
    expect(screen.queryAllByTestId('vip-chip').length).toBe(0)
  })
})
