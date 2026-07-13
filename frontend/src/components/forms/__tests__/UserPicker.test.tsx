import type { ReactElement } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { eqMock, fromMock, limitMock, orMock, orderMock, selectMock } = vi.hoisted(() => ({
  eqMock: vi.fn(),
  fromMock: vi.fn(),
  limitMock: vi.fn(),
  orMock: vi.fn(),
  orderMock: vi.fn(),
  selectMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: fromMock },
}))

interface SearchableSelectMockProps {
  onSearchChange?: (query: string) => void
}

vi.mock('../SearchableSelect', async () => {
  const { createElement } = await import('react')
  return {
    SearchableSelect: ({ onSearchChange }: SearchableSelectMockProps): ReactElement =>
      createElement(
        'button',
        { type: 'button', onClick: () => onSearchChange?.('a,b(c).d') },
        'search',
      ),
  }
})

import { UserPicker } from '../UserPicker'

describe('UserPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    limitMock.mockResolvedValue({ data: [], error: null })
    orderMock.mockReturnValue({ limit: limitMock })
    orMock.mockReturnValue({ order: orderMock })
    eqMock.mockReturnValue({ or: orMock, order: orderMock })
    selectMock.mockReturnValue({ eq: eqMock })
    fromMock.mockReturnValue({ select: selectMock })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('quotes reserved search characters without changing the two-condition filter shape', async () => {
    render(<UserPicker />)

    fireEvent.click(screen.getByRole('button', { name: 'search' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(orMock).toHaveBeenCalledWith('full_name.ilike."%a,b(c).d%",email.ilike."%a,b(c).d%"')
  })
})
