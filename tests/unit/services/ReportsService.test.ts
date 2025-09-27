import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReportsService } from '../../../backend/src/services/ReportsService'
import { supabaseAdmin } from '../../../backend/src/config/supabase'

// Mock supabase
vi.mock('../../../backend/src/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockReturnValue({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('ReportsService', () => {
  let reportsService: ReportsService

  beforeEach(() => {
    reportsService = new ReportsService()
    vi.clearAllMocks()
  })

  describe('getAllReports', () => {
    it('should return all reports with pagination', async () => {
      const mockReports = [
        {
          id: '1',
          title: 'Annual Report 2024',
          description: 'Comprehensive annual report',
          report_type: 'annual',
          status: 'published',
          author_id: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockReports,
              error: null,
              count: 1
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportsService.getAllReports({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockReports)
      expect(result.pagination.total).toBe(1)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('reports')
    })
  })

  describe('getReportById', () => {
    it('should return report by ID', async () => {
      const mockReport = {
        id: '1',
        title: 'Annual Report 2024',
        description: 'Comprehensive annual report',
        report_type: 'annual',
        status: 'published',
        author_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReport,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportsService.getReportById('1')

      expect(result).toEqual(mockReport)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when report not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Report not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(reportsService.getReportById('999')).rejects.toThrow('Report not found')
    })
  })

  describe('createReport', () => {
    it('should create new report', async () => {
      const newReport = {
        title: 'New Report',
        description: 'A new report',
        report_type: 'annual',
        status: 'draft',
        author_id: 'user-1'
      }

      const mockCreatedReport = {
        id: '3',
        ...newReport,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedReport,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportsService.createReport(newReport)

      expect(result).toEqual(mockCreatedReport)
      expect(mockQuery.insert).toHaveBeenCalledWith(newReport)
    })

    it('should validate required fields', async () => {
      const invalidReport = {
        title: 'New Report',
        // Missing required fields
      }

      await expect(reportsService.createReport(invalidReport as any)).rejects.toThrow()
    })
  })

  describe('updateReport', () => {
    it('should update existing report', async () => {
      const updates = {
        title: 'Updated Report',
        status: 'published'
      }

      const mockUpdatedReport = {
        id: '1',
        title: 'Updated Report',
        description: 'Comprehensive annual report',
        report_type: 'annual',
        status: 'published',
        author_id: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedReport,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportsService.updateReport('1', updates)

      expect(result).toEqual(mockUpdatedReport)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when report not found for update', async () => {
      const updates = { title: 'Updated Report' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Report not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(reportsService.updateReport('999', updates)).rejects.toThrow('Report not found')
    })
  })

  describe('deleteReport', () => {
    it('should delete report', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1' },
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await reportsService.deleteReport('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when report not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Report not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(reportsService.deleteReport('999')).rejects.toThrow('Report not found')
    })
  })

  describe('validateReportData', () => {
    it('should validate report data structure', () => {
      const validReport = {
        title: 'New Report',
        description: 'A new report',
        report_type: 'annual',
        status: 'draft',
        author_id: 'user-1'
      }

      expect(() => reportsService.validateReportData(validReport)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidReport = {
        title: 'New Report',
        // Missing required fields
      }

      expect(() => reportsService.validateReportData(invalidReport as any)).toThrow()
    })
  })
})