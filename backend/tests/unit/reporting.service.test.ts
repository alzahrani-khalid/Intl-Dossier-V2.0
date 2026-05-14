import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReportingService } from '../../src/services/reporting.service'
import type { ReportTemplate } from '../../src/models/report-template.model'

const mocks = vi.hoisted(() => {
  type Terminal = { data: any; error: any }

  const state = {
    createClient: vi.fn(),
    from: vi.fn(),
    listByTable: new Map<string, Terminal>(),
    singleTerminal: { data: null, error: null } as Terminal,
  }

  const makeChain = (table: string) => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      lte: vi.fn(() => chain),
      single: vi.fn(async () => state.singleTerminal),
      then: (onResolved: any, onRejected?: any) =>
        Promise.resolve(state.listByTable.get(table) ?? { data: [], error: null }).then(
          onResolved,
          onRejected,
        ),
      catch: (onRejected: any) =>
        Promise.resolve(state.listByTable.get(table) ?? { data: [], error: null }).catch(
          onRejected,
        ),
      finally: (onFinally: any) =>
        Promise.resolve(state.listByTable.get(table) ?? { data: [], error: null }).finally(
          onFinally,
        ),
    }
    return chain
  }

  state.from.mockImplementation((table: string) => makeChain(table))
  state.createClient.mockReturnValue({ from: state.from })

  return {
    ...state,
    setList: (table: string, terminal: Terminal) => {
      state.listByTable.set(table, terminal)
    },
    setSingleTerminal: (terminal: Terminal) => {
      state.singleTerminal = terminal
    },
    reset: () => {
      state.listByTable.clear()
      state.singleTerminal = { data: null, error: null }
      state.from.mockClear()
      state.createClient.mockClear()
      state.from.mockImplementation((table: string) => makeChain(table))
      state.createClient.mockReturnValue({ from: state.from })
    },
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.createClient,
}))

const template: ReportTemplate = {
  id: 'template-1',
  name: 'Executive report',
  report_type: 'executive',
  include_metrics: false,
  include_trends: false,
  include_charts: false,
  include_audit_trail: false,
  supported_formats: ['json', 'csv'],
  schedule_enabled: false,
  organization_branding: {},
  template_content: '{{title}}\n{{date}}\n{{content}}',
  created_by: 'user-1',
  created_at: new Date(),
  updated_at: new Date(),
}

describe('ReportingService', () => {
  let service: ReportingService

  beforeEach(async () => {
    mocks.reset()
    mocks.setList('report_templates', { data: [template], error: null })
    service = new ReportingService('http://supabase.test', 'service-key')
    await Promise.resolve()
  })

  it('creates valid report templates', async () => {
    mocks.setSingleTerminal({ data: template, error: null })

    const result = await service.createTemplate({
      name: template.name,
      report_type: 'executive',
      supported_formats: ['json'],
      template_content: template.template_content,
    })

    expect(result).toEqual(template)
    expect(mocks.from).toHaveBeenCalledWith('report_templates')
  })

  it('generates JSON reports from a loaded template', async () => {
    const reports = [
      {
        id: 'report-1',
        confidence_score: 80,
        review_status: 'approved',
        created_at: new Date().toISOString(),
        threat_indicators: [],
        geospatial_tags: [],
      },
    ]
    mocks.setList('intelligence_reports', { data: reports, error: null })

    const result = await service.generateReport({ template_id: template.id, format: 'json' })

    expect(result.content_type).toBe('application/json')
    expect(result.data).toMatchObject({ data: reports })
  })

  it('filters templates by report type', async () => {
    mocks.setList('report_templates', { data: [template], error: null })

    const result = await service.getTemplates('executive')

    expect(result).toEqual([template])
    expect(mocks.from).toHaveBeenCalledWith('report_templates')
  })
})
