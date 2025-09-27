import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReportService } from '../../../backend/src/services/ReportService'
import { supabaseAdmin } from '../../../backend/src/config/supabase'

// Mock supabase
vi.mock('../../../backend/src/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(),
            })),
          })),
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
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('ReportService', () => {
  let reportService: ReportService

  beforeEach(() => {
    reportService = new ReportService()
    vi.clearAllMocks()
  })

  describe('getAllReports', () => {
    it('should return all reports with pagination', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Test Report',
          title_ar: 'تقرير تجريبي',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          title_en: 'Another Report',
          title_ar: 'تقرير آخر',
          type: 'analytical',
          status: 'draft',
          created_by: 'user-2',
          organization_id: 'org-2',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockReports,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getAllReports({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockReports)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('reports')
    })

    it('should filter reports by type', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Statistical Report',
          title_ar: 'تقرير إحصائي',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockReports,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getAllReports({
        page: 1,
        limit: 10,
        type: 'statistical'
      })

      expect(result.data).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'statistical')
    })

    it('should filter reports by status', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Published Report',
          title_ar: 'تقرير منشور',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockReports,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getAllReports({
        page: 1,
        limit: 10,
        status: 'published'
      })

      expect(result.data).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
    })

    it('should filter reports by organization', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Organization Report',
          title_ar: 'تقرير المنظمة',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockReports,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getAllReports({
        page: 1,
        limit: 10,
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })

    it('should filter reports by date range', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Report in Range',
          title_ar: 'تقرير في النطاق',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockReports,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getAllReports({
        page: 1,
        limit: 10,
        created_from: '2025-01-01T00:00:00Z',
        created_to: '2025-01-31T23:59:59Z'
      })

      expect(result.data).toEqual(mockReports)
    })
  })

  describe('getReportById', () => {
    it('should return report by ID', async () => {
      const mockReport = {
        id: '1',
        title_en: 'Test Report',
        title_ar: 'تقرير تجريبي',
        type: 'statistical',
        status: 'published',
        created_by: 'user-1',
        organization_id: 'org-1',
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

      const result = await reportService.getReportById('1')

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

      await expect(reportService.getReportById('999')).rejects.toThrow('Report not found')
    })
  })

  describe('createReport', () => {
    it('should create new report', async () => {
      const newReport = {
        title_en: 'New Report',
        title_ar: 'تقرير جديد',
        type: 'statistical',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      const mockCreatedReport = {
        id: '3',
        ...newReport,
        status: 'draft',
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

      const result = await reportService.createReport(newReport)

      expect(result).toEqual(mockCreatedReport)
      expect(mockQuery.insert).toHaveBeenCalledWith(newReport)
    })

    it('should validate required fields', async () => {
      const invalidReport = {
        title_en: 'New Report',
        // Missing required fields
      }

      await expect(reportService.createReport(invalidReport as any)).rejects.toThrow()
    })

    it('should validate report type', async () => {
      const invalidReport = {
        title_en: 'New Report',
        title_ar: 'تقرير جديد',
        type: 'invalid-type',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      await expect(reportService.createReport(invalidReport)).rejects.toThrow()
    })
  })

  describe('updateReport', () => {
    it('should update existing report', async () => {
      const updates = {
        title_en: 'Updated Report Title',
        title_ar: 'عنوان التقرير المحدث',
        description_en: 'Updated description'
      }

      const mockUpdatedReport = {
        id: '1',
        title_en: 'Updated Report Title',
        title_ar: 'عنوان التقرير المحدث',
        description_en: 'Updated description',
        type: 'statistical',
        status: 'published',
        created_by: 'user-1',
        organization_id: 'org-1',
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

      const result = await reportService.updateReport('1', updates)

      expect(result).toEqual(mockUpdatedReport)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when report not found for update', async () => {
      const updates = { title_en: 'Updated Title' }

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

      await expect(reportService.updateReport('999', updates)).rejects.toThrow('Report not found')
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

      await reportService.deleteReport('1')

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

      await expect(reportService.deleteReport('999')).rejects.toThrow('Report not found')
    })
  })

  describe('publishReport', () => {
    it('should publish report', async () => {
      const mockPublishedReport = {
        id: '1',
        title_en: 'Test Report',
        title_ar: 'تقرير تجريبي',
        type: 'statistical',
        status: 'published',
        created_by: 'user-1',
        organization_id: 'org-1',
        published_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPublishedReport,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.publishReport('1')

      expect(result).toEqual(mockPublishedReport)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when report not found for publishing', async () => {
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

      await expect(reportService.publishReport('999')).rejects.toThrow('Report not found')
    })
  })

  describe('unpublishReport', () => {
    it('should unpublish report', async () => {
      const mockUnpublishedReport = {
        id: '1',
        title_en: 'Test Report',
        title_ar: 'تقرير تجريبي',
        type: 'statistical',
        status: 'draft',
        created_by: 'user-1',
        organization_id: 'org-1',
        published_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUnpublishedReport,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.unpublishReport('1')

      expect(result).toEqual(mockUnpublishedReport)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when report not found for unpublishing', async () => {
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

      await expect(reportService.unpublishReport('999')).rejects.toThrow('Report not found')
    })
  })

  describe('getReportsByType', () => {
    it('should return reports by type', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Statistical Report',
          title_ar: 'تقرير إحصائي',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockReports,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getReportsByType('statistical')

      expect(result).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'statistical')
    })
  })

  describe('getReportsByOrganization', () => {
    it('should return reports by organization', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Organization Report',
          title_ar: 'تقرير المنظمة',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockReports,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getReportsByOrganization('org-1')

      expect(result).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    })
  })

  describe('getPublishedReports', () => {
    it('should return published reports', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Published Report',
          title_ar: 'تقرير منشور',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          published_at: '2025-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockReports,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.getPublishedReports()

      expect(result).toEqual(mockReports)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
    })
  })

  describe('searchReports', () => {
    it('should search reports by multiple criteria', async () => {
      const mockReports = [
        {
          id: '1',
          title_en: 'Test Report',
          title_ar: 'تقرير تجريبي',
          type: 'statistical',
          status: 'published',
          created_by: 'user-1',
          organization_id: 'org-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockReports,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.searchReports({
        query: 'Test',
        type: 'statistical',
        organization_id: 'org-1'
      })

      expect(result.data).toEqual(mockReports)
    })

    it('should handle empty search results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await reportService.searchReports({
        query: 'NonExistentReport'
      })

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('validateReportData', () => {
    it('should validate report data structure', () => {
      const validReport = {
        title_en: 'Test Report',
        title_ar: 'تقرير تجريبي',
        type: 'statistical',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      expect(() => reportService.validateReportData(validReport)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidReport = {
        title_en: 'Test Report',
        // Missing required fields
      }

      expect(() => reportService.validateReportData(invalidReport as any)).toThrow()
    })

    it('should throw error for invalid report type', () => {
      const invalidReport = {
        title_en: 'Test Report',
        title_ar: 'تقرير تجريبي',
        type: 'invalid-type',
        created_by: 'user-1',
        organization_id: 'org-1'
      }

      expect(() => reportService.validateReportData(invalidReport)).toThrow()
    })
  })
})
