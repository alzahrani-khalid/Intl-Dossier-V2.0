import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportingService } from '../../src/services/reporting.service';
import { supabase } from '../../src/config/supabase';
import * as fs from 'fs/promises';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

vi.mock('../../src/config/supabase');
vi.mock('fs/promises');
vi.mock('exceljs');
vi.mock('pdfkit');

describe('ReportingService', () => {
  let reportingService: ReportingService;

  beforeEach(() => {
    reportingService = new ReportingService();
    vi.clearAllMocks();
  });

  describe('generateReport', () => {
    const mockData = {
      title: 'Test Report',
      data: [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        author: 'System'
      }
    };

    it('should generate PDF report', async () => {
      const mockPdfDoc = {
        pipe: vi.fn(),
        fontSize: vi.fn().mockReturnThis(),
        text: vi.fn().mockReturnThis(),
        moveDown: vi.fn().mockReturnThis(),
        end: vi.fn()
      };

      vi.mocked(PDFDocument).mockImplementation(() => mockPdfDoc as any);
      
      const mockWriteStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') callback();
        })
      };
      
      vi.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream as any);

      const result = await reportingService.generateReport(mockData, 'pdf');

      expect(result.format).toBe('pdf');
      expect(result.path).toContain('.pdf');
      expect(mockPdfDoc.text).toHaveBeenCalledWith('Test Report');
    });

    it('should generate Excel report', async () => {
      const mockWorkbook = {
        addWorksheet: vi.fn().mockReturnValue({
          columns: [],
          addRow: vi.fn(),
          getRow: vi.fn().mockReturnValue({ font: {} })
        }),
        xlsx: {
          writeFile: vi.fn().mockResolvedValue(undefined)
        }
      };

      vi.mocked(ExcelJS.Workbook).mockImplementation(() => mockWorkbook as any);

      const result = await reportingService.generateReport(mockData, 'excel');

      expect(result.format).toBe('excel');
      expect(result.path).toContain('.xlsx');
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Report');
    });

    it('should generate JSON report', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await reportingService.generateReport(mockData, 'json');

      expect(result.format).toBe('json');
      expect(result.path).toContain('.json');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockData, null, 2)
      );
    });

    it('should generate CSV report', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await reportingService.generateReport(mockData, 'csv');

      expect(result.format).toBe('csv');
      expect(result.path).toContain('.csv');
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('scheduleReport', () => {
    it('should schedule a report generation', async () => {
      const schedule = {
        templateId: 'template123',
        cron: '0 9 * * 1', // Every Monday at 9 AM
        recipients: ['user@example.com'],
        format: 'pdf' as const
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: { id: 'schedule123', ...schedule },
            error: null
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await reportingService.scheduleReport(schedule);

      expect(result.id).toBe('schedule123');
      expect(mockFrom).toHaveBeenCalledWith('report_schedules');
    });

    it('should handle scheduling errors', async () => {
      const schedule = {
        templateId: 'template123',
        cron: 'invalid',
        recipients: [],
        format: 'pdf' as const
      };

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Invalid cron expression' }
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(reportingService.scheduleReport(schedule)).rejects.toThrow();
    });
  });

  describe('getTemplates', () => {
    it('should retrieve all report templates', async () => {
      const mockTemplates = [
        { id: '1', name: 'Monthly Report', type: 'summary' },
        { id: '2', name: 'Analytics Report', type: 'detailed' }
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTemplates,
            error: null
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await reportingService.getTemplates();

      expect(result).toEqual(mockTemplates);
      expect(mockFrom).toHaveBeenCalledWith('report_templates');
    });

    it('should filter templates by type', async () => {
      const mockTemplates = [
        { id: '1', name: 'Monthly Report', type: 'summary' }
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTemplates,
              error: null
            })
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await reportingService.getTemplates({ type: 'summary' });

      expect(result).toEqual(mockTemplates);
    });
  });

  describe('executeTemplate', () => {
    it('should execute report template with parameters', async () => {
      const templateId = 'template123';
      const parameters = { startDate: '2024-01-01', endDate: '2024-12-31' };

      const mockTemplate = {
        id: templateId,
        name: 'Annual Report',
        query: 'SELECT * FROM data WHERE date BETWEEN $1 AND $2',
        format: 'pdf'
      };

      const mockData = [
        { id: 1, value: 100 },
        { id: 2, value: 200 }
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockTemplate,
              error: null
            })
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: mockData,
        error: null
      } as any);

      const result = await reportingService.executeTemplate(templateId, parameters);

      expect(result.template).toEqual(mockTemplate);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('exportReport', () => {
    it('should export report in multiple formats', async () => {
      const reportId = 'report123';
      const formats = ['pdf', 'excel', 'json'] as const;

      const mockReport = {
        id: reportId,
        title: 'Test Report',
        data: { items: [] }
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReport,
              error: null
            })
          })
        })
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const results = await reportingService.exportReport(reportId, formats);

      expect(results).toHaveLength(3);
      expect(results.map(r => r.format)).toEqual(formats);
    });
  });

  describe('generateComparison', () => {
    it('should generate comparison report between periods', async () => {
      const period1 = { start: '2024-01-01', end: '2024-06-30' };
      const period2 = { start: '2024-07-01', end: '2024-12-31' };

      const mockData1 = [{ metric: 'sales', value: 1000 }];
      const mockData2 = [{ metric: 'sales', value: 1500 }];

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ data: mockData1, error: null } as any)
        .mockResolvedValueOnce({ data: mockData2, error: null } as any);

      const result = await reportingService.generateComparison(period1, period2);

      expect(result.period1Data).toEqual(mockData1);
      expect(result.period2Data).toEqual(mockData2);
      expect(result.comparison).toBeDefined();
    });
  });
});