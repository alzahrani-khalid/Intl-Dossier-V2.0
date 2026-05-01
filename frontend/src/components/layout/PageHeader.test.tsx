import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('exposes canonical handoff page-head, page-title, and page-sub hooks', () => {
    const { container } = render(<PageHeader title="Reports" subtitle="12 generated this week" />)

    expect(container.querySelector('.page-head')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Reports' }).className).toContain('page-title')
    expect(screen.getByText('12 generated this week').className).toContain('page-sub')
  })
})
