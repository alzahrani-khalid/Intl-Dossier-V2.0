import { createClient } from '@supabase/supabase-js';
import { ReportTemplate, ReportTemplateInput, ReportTemplateModel, ScheduledReport } from '../models/report-template.model';
import { IntelligenceReport } from '../models/intelligence-report.model';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { parse } from 'json2csv';

interface ReportGenerationOptions {
  template_id: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  language?: 'en' | 'ar';
  filters?: {
    date_range?: { from: Date; to: Date };
    entities?: string[];
    status?: string[];
    priority?: string[];
  };
}

interface GeneratedReport {
  data: Buffer | string | object;
  filename: string;
  content_type: string;
}

export class ReportingService {
  private supabase: any;
  private templates: Map<string, ReportTemplate> = new Map();
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.loadTemplates();
  }
  
  private async loadTemplates(): Promise<void> {
    const { data, error } = await this.supabase
      .from('report_templates')
      .select('*');
    
    if (error) {
      console.error('Failed to load report templates:', error);
      return;
    }
    
    data.forEach((template: ReportTemplate) => {
      this.templates.set(template.id, template);
    });
  }
  
  async createTemplate(input: ReportTemplateInput): Promise<ReportTemplate> {
    const validationErrors = ReportTemplateModel.validate(input);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    const contentValidation = ReportTemplateModel.validateTemplateContent(input.template_content);
    if (!contentValidation.valid) {
      throw new Error(`Template content invalid: ${contentValidation.errors.join(', ')}`);
    }
    
    const defaults = ReportTemplateModel.getDefaultInclusions(input.report_type);
    
    const { data, error } = await this.supabase
      .from('report_templates')
      .insert({
        ...input,
        ...defaults,
        ...input,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
    
    await this.loadTemplates();
    return data;
  }
  
  async generateReport(options: ReportGenerationOptions): Promise<GeneratedReport> {
    const template = this.templates.get(options.template_id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    if (!template.supported_formats.includes(options.format)) {
      throw new Error(`Format ${options.format} not supported by this template`);
    }
    
    const data = await this.fetchReportData(options.filters);
    const content = await this.renderTemplate(template, data, options.language);
    
    switch (options.format) {
      case 'pdf':
        return this.generatePDF(content, template, data);
      case 'excel':
        return this.generateExcel(content, template, data);
      case 'csv':
        return this.generateCSV(data);
      case 'json':
        return this.generateJSON(content, data);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }
  
  private async fetchReportData(filters?: ReportGenerationOptions['filters']): Promise<any[]> {
    let query = this.supabase
      .from('intelligence_reports')
      .select('*');
    
    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.from)
        .lte('created_at', filters.date_range.to);
    }
    
    if (filters?.status?.length) {
      query = query.in('review_status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch report data: ${error.message}`);
    }
    
    return data;
  }
  
  private async renderTemplate(
    template: ReportTemplate,
    data: any[],
    language: string = 'en'
  ): Promise<string> {
    const templateContent = language === 'ar' && template.template_content_ar
      ? template.template_content_ar
      : template.template_content;
    
    const context = {
      title: language === 'ar' && template.name_ar ? template.name_ar : template.name,
      date: new Date().toISOString(),
      content: this.formatReportContent(template, data),
      metrics: template.include_metrics ? this.calculateMetrics(data) : null,
      trends: template.include_trends ? this.analyzeTrends(data) : null,
      audit_trail: template.include_audit_trail ? this.getAuditTrail(data) : null
    };
    
    let rendered = templateContent;
    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    });
    
    return rendered;
  }
  
  private formatReportContent(template: ReportTemplate, data: any[]): string {
    if (template.report_type === 'executive') {
      return this.formatExecutiveSummary(data);
    } else if (template.report_type === 'analytical') {
      return this.formatAnalyticalReport(data);
    } else if (template.report_type === 'compliance') {
      return this.formatComplianceReport(data);
    }
    return JSON.stringify(data);
  }
  
  private formatExecutiveSummary(data: any[]): string {
    const summary = {
      total_reports: data.length,
      critical_threats: data.filter(r => r.threat_indicators?.some((t: any) => t.severity === 'critical')).length,
      high_confidence: data.filter(r => r.confidence_score >= 80).length,
      regions_covered: new Set(data.flatMap(r => r.geospatial_tags?.map((g: any) => g.location_type) || [])).size
    };
    
    return `
      Total Reports: ${summary.total_reports}
      Critical Threats: ${summary.critical_threats}
      High Confidence Reports: ${summary.high_confidence}
      Regions Covered: ${summary.regions_covered}
    `;
  }
  
  private formatAnalyticalReport(data: any[]): string {
    const analysis = {
      average_confidence: data.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / data.length,
      threat_distribution: this.getThreatDistribution(data),
      temporal_patterns: this.getTemporalPatterns(data)
    };
    
    return JSON.stringify(analysis, null, 2);
  }
  
  private formatComplianceReport(data: any[]): string {
    return data.map(r => ({
      id: r.id,
      created_at: r.created_at,
      analyst_id: r.analyst_id,
      review_status: r.review_status,
      data_sources: r.data_sources
    })).map(r => JSON.stringify(r)).join('\n');
  }
  
  private calculateMetrics(data: any[]): any {
    return {
      count: data.length,
      avg_confidence: data.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / data.length,
      status_breakdown: data.reduce((acc, r) => {
        acc[r.review_status] = (acc[r.review_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
  
  private analyzeTrends(data: any[]): any {
    const grouped = data.reduce((acc, r) => {
      const month = new Date(r.created_at).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { monthly_distribution: grouped };
  }
  
  private getAuditTrail(data: any[]): string[] {
    return data.map(r => 
      `[${r.created_at}] Report ${r.id} created by ${r.analyst_id}, status: ${r.review_status}`
    );
  }
  
  private getThreatDistribution(data: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    data.forEach(r => {
      r.threat_indicators?.forEach((t: any) => {
        distribution[t.severity] = (distribution[t.severity] || 0) + 1;
      });
    });
    return distribution;
  }
  
  private getTemporalPatterns(data: any[]): any {
    const patterns = {
      by_month: {} as Record<string, number>,
      by_day_of_week: {} as Record<number, number>
    };
    
    data.forEach(r => {
      const date = new Date(r.created_at);
      const month = date.toISOString().slice(0, 7);
      const dayOfWeek = date.getDay();
      
      patterns.by_month[month] = (patterns.by_month[month] || 0) + 1;
      patterns.by_day_of_week[dayOfWeek] = (patterns.by_day_of_week[dayOfWeek] || 0) + 1;
    });
    
    return patterns;
  }
  
  private async generatePDF(
    content: string,
    template: ReportTemplate,
    data: any[]
  ): Promise<GeneratedReport> {
    const doc = new (PDFDocument as any)();
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    if (template.organization_branding?.logo_url) {
      doc.fontSize(20).text(template.name, { align: 'center' });
    }
    
    doc.fontSize(12).text(content);
    
    if (template.include_charts) {
      // Add charts placeholder
      doc.addPage().fontSize(14).text('Charts Section', { align: 'center' });
    }
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve({
          data: Buffer.concat(chunks),
          filename: `report_${Date.now()}.pdf`,
          content_type: 'application/pdf'
        });
      });
    });
  }
  
  private async generateExcel(
    content: string,
    template: ReportTemplate,
    data: any[]
  ): Promise<GeneratedReport> {
    const workbook = new (ExcelJS as any).Workbook();
    const sheet = workbook.addWorksheet('Report');
    
    sheet.addRow(['Report', template.name]);
    sheet.addRow(['Generated', new Date().toISOString()]);
    sheet.addRow([]);
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      sheet.addRow(headers);
      
      data.forEach(row => {
        sheet.addRow(headers.map(h => row[h]));
      });
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      data: buffer,
      filename: `report_${Date.now()}.xlsx`,
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }
  
  private generateCSV(data: any[]): GeneratedReport {
    if (data.length === 0) {
      return {
        data: '',
        filename: `report_${Date.now()}.csv`,
        content_type: 'text/csv'
      };
    }
    
    const csv = parse(data);
    
    return {
      data: csv,
      filename: `report_${Date.now()}.csv`,
      content_type: 'text/csv'
    };
  }
  
  private generateJSON(content: string, data: any[]): GeneratedReport {
    return {
      data: {
        metadata: { generated_at: new Date(), content },
        data
      },
      filename: `report_${Date.now()}.json`,
      content_type: 'application/json'
    };
  }
  
  async scheduleReport(
    templateId: string,
    frequency: ReportTemplate['schedule_frequency'],
    format: GeneratedReport['content_type'],
    emailRecipients: string[]
  ): Promise<ScheduledReport> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const cronExpression = ReportTemplateModel.generateCronExpression(frequency);
    const nextRun = ReportTemplateModel.calculateNextRun(cronExpression);
    
    const { data, error } = await this.supabase
      .from('scheduled_reports')
      .insert({
        template_id: templateId,
        next_run: nextRun,
        email_recipients: emailRecipients,
        format,
        enabled: true
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to schedule report: ${error.message}`);
    }
    
    return data;
  }
  
  async getTemplates(reportType?: ReportTemplate['report_type']): Promise<ReportTemplate[]> {
    let query = this.supabase
      .from('report_templates')
      .select('*');
    
    if (reportType) {
      query = query.eq('report_type', reportType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`);
    }
    
    return data;
  }
}