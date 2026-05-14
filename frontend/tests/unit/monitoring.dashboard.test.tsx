import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders as render, screen } from '@tests/utils/render'
import MonitoringDashboard from '@/pages/monitoring/Dashboard'

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: any) => {
        if (String(url).includes('/monitoring/health')) {
          return new Response(
            JSON.stringify({
              status: 'healthy',
              services: {
                api: { status: 'healthy', latency_ms: 10, last_check: new Date().toISOString() },
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
        if (String(url).includes('/monitoring/alerts')) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response('{}', { status: 200 })
      }),
    )
  })

  it('renders headings', async () => {
    render(<MonitoringDashboard />)
    expect(
      await screen.findByRole('heading', { level: 1, name: /Monitoring Dashboard/i }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: /^Health$/i })).toBeInTheDocument()
  })
})
