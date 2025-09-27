import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ExportDialog from '@/components/export/ExportDialog'

describe('ExportDialog', () => {
  beforeEach(() => {
    let createdId = 'exp_1'
    vi.stubGlobal('fetch', vi.fn(async (url: any, init?: any) => {
      const u = String(url)
      if (u.endsWith('/export') && init?.method === 'POST') {
        return new Response(JSON.stringify({ id: createdId, status: 'pending' }), { status: 202, headers: { 'Content-Type': 'application/json' } })
      }
      if (u.endsWith(`/export/${createdId}`)) {
        return new Response(JSON.stringify({ id: createdId, status: 'completed', progress: 100, download_url: `/export/${createdId}/download` }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response('{}', { status: 200 })
    }))
  })

  it('starts export and shows status', async () => {
    render(<ExportDialog />)
    const btn = await screen.findByRole('button', { name: /Start Export/i })
    fireEvent.click(btn)
    expect(await screen.findByText(/Status:/i)).toBeInTheDocument()
  })
})

