import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

export type ReportType = 'country_overview' | 'organization_summary' | 'mou_status' | 
  'event_calendar' | 'intelligence_digest' | 'activity_report' | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ReportRequest {
  id?: string;
  type: ReportType;
  format: ReportFormat;
  parameters: Record<string, any>;
  userId: string;
  language: 'en' | 'ar' | 'both';
  scheduledAt?: string;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface ReportJob {
  id: string;
  request: ReportRequest;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  resultUrl?: string;
  retryCount: number;
  maxRetries: number;
}

export interface QueueStats {
  totalJobs: number;
  queuedJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
}

export class ReportGeneratorService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private queue: Map<string, ReportJob> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrent: number = 3;
  private processInterval: NodeJS.Timeout | null = null;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.startQueueProcessor();
  }

  async enqueueReport(request: ReportRequest): Promise<ReportJob> {
    const jobId = request.id || this.generateJobId();
    
    const job: ReportJob = {
      id: jobId,
      request: {
        ...request,
        id: jobId,
        priority: request.priority || 'normal'
      },
      status: 'queued',
      progress: 0,
      retryCount: 0,
      maxRetries: 3
    };

    // Store in queue
    this.queue.set(jobId, job);

    // Persist to database
    await this.persistJob(job);

    // Trigger immediate processing if capacity available
    this.processNextJob();

    return job;
  }

  async getJobStatus(jobId: string): Promise<ReportJob | null> {
    // Check in-memory queue first
    if (this.queue.has(jobId)) {
      return this.queue.get(jobId)!;
    }

    // Check database
    const { data, error } = await this.supabase
      .from('report_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.parseJobFromDb(data);
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId);
    
    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'cancelled') {
      return false;
    }

    job.status = 'cancelled';
    await this.updateJob(job);

    // Remove from processing if active
    this.processing.delete(jobId);
    
    return true;
  }

  async getQueueStats(): Promise<QueueStats> {
    const jobs = Array.from(this.queue.values());
    
    const stats: QueueStats = {
      totalJobs: jobs.length,
      queuedJobs: jobs.filter(j => j.status === 'queued').length,
      processingJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      avgProcessingTime: 0
    };

    // Calculate average processing time
    const completedJobs = jobs.filter(j => j.status === 'completed' && j.startedAt && j.completedAt);
    if (completedJobs.length > 0) {
      const totalTime = completedJobs.reduce((sum, job) => {
        const duration = new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime();
        return sum + duration;
      }, 0);
      stats.avgProcessingTime = totalTime / completedJobs.length;
    }

    return stats;
  }

  private startQueueProcessor(): void {
    if (this.processInterval) {
      return;
    }

    this.processInterval = setInterval(() => {
      this.processNextJob();
    }, 5000); // Check every 5 seconds
  }

  private async processNextJob(): Promise<void> {
    // Check if we have capacity
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    // Find next job to process
    const nextJob = this.getNextQueuedJob();
    if (!nextJob) {
      return;
    }

    // Mark as processing
    this.processing.add(nextJob.id);
    nextJob.status = 'processing';
    nextJob.startedAt = new Date().toISOString();
    await this.updateJob(nextJob);

    // Process the job
    try {
      await this.processJob(nextJob);
    } catch (error) {
      await this.handleJobError(nextJob, error);
    } finally {
      this.processing.delete(nextJob.id);
    }
  }

  private getNextQueuedJob(): ReportJob | null {
    const queuedJobs = Array.from(this.queue.values())
      .filter(j => j.status === 'queued')
      .sort((a, b) => {
        // Priority ordering
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.request.priority || 'normal'] - 
                           priorityOrder[b.request.priority || 'normal'];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by scheduled time
        if (a.request.scheduledAt && b.request.scheduledAt) {
          return new Date(a.request.scheduledAt).getTime() - 
                 new Date(b.request.scheduledAt).getTime();
        }
        
        return 0;
      });

    return queuedJobs[0] || null;
  }

  private async processJob(job: ReportJob): Promise<void> {
    try {
      // Update progress
      await this.updateJobProgress(job, 10, 'Initializing report generation');

      // Generate report based on type
      let result: any;
      
      switch (job.request.type) {
        case 'country_overview':
          result = await this.generateCountryOverview(job);
          break;
        case 'organization_summary':
          result = await this.generateOrganizationSummary(job);
          break;
        case 'mou_status':
          result = await this.generateMouStatus(job);
          break;
        case 'event_calendar':
          result = await this.generateEventCalendar(job);
          break;
        case 'intelligence_digest':
          result = await this.generateIntelligenceDigest(job);
          break;
        case 'activity_report':
          result = await this.generateActivityReport(job);
          break;
        case 'custom':
          result = await this.generateCustomReport(job);
          break;
        default:
          throw new Error(`Unknown report type: ${job.request.type}`);
      }

      await this.updateJobProgress(job, 70, 'Formatting report');

      // Format the report
      const formattedResult = await this.formatReport(result, job.request.format, job.request.language);

      await this.updateJobProgress(job, 90, 'Saving report');

      // Save the result
      const resultUrl = await this.saveReport(formattedResult, job);

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.progress = 100;
      job.resultUrl = resultUrl;
      await this.updateJob(job);

    } catch (error) {
      throw error;
    }
  }

  private async generateCountryOverview(job: ReportJob): Promise<any> {
    const { countryId, includeOrganizations, includeEvents, includeMous } = job.request.parameters;

    // Fetch country data
    const { data: country } = await this.supabase
      .from('countries')
      .select('*')
      .eq('id', countryId)
      .single();

    if (!country) {
      throw new Error('Country not found');
    }

    const report: any = {
      country,
      generatedAt: new Date().toISOString(),
      sections: []
    };

    // Include organizations if requested
    if (includeOrganizations) {
      await this.updateJobProgress(job, 30, 'Fetching organizations');
      
      const { data: organizations } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('country_id', countryId);

      report.sections.push({
        title: 'Organizations',
        data: organizations || [],
        summary: {
          total: organizations?.length || 0,
          byType: this.groupByType(organizations || [])
        }
      });
    }

    // Include events if requested
    if (includeEvents) {
      await this.updateJobProgress(job, 40, 'Fetching events');
      
      const { data: events } = await this.supabase
        .from('events')
        .select('*')
        .eq('country_id', countryId)
        .order('start_datetime', { ascending: false });

      report.sections.push({
        title: 'Events',
        data: events || [],
        summary: {
          total: events?.length || 0,
          upcoming: events?.filter(e => new Date(e.start_datetime) > new Date()).length || 0
        }
      });
    }

    // Include MoUs if requested
    if (includeMous) {
      await this.updateJobProgress(job, 50, 'Fetching MoUs');
      
      // Get organizations in this country
      const { data: orgIds } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('country_id', countryId);

      if (orgIds && orgIds.length > 0) {
        const ids = orgIds.map(o => o.id);
        const { data: mous } = await this.supabase
          .from('mous')
          .select('*')
          .or(`primary_party_id.in.(${ids.join(',')}),secondary_party_id.in.(${ids.join(',')})`);

        report.sections.push({
          title: 'MoUs',
          data: mous || [],
          summary: {
            total: mous?.length || 0,
            byStatus: this.groupByStatus(mous || [])
          }
        });
      }
    }

    return report;
  }

  private async generateOrganizationSummary(job: ReportJob): Promise<any> {
    const { organizationId, dateRange } = job.request.parameters;

    const { data: organization } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (!organization) {
      throw new Error('Organization not found');
    }

    const report: any = {
      organization,
      dateRange,
      metrics: {}
    };

    // Get MoUs
    const { data: mous } = await this.supabase
      .from('mous')
      .select('*')
      .or(`primary_party_id.eq.${organizationId},secondary_party_id.eq.${organizationId}`);

    report.metrics.totalMous = mous?.length || 0;
    report.metrics.activeMous = mous?.filter(m => m.workflow_state === 'active').length || 0;

    // Get events
    const { data: events } = await this.supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizationId);

    report.metrics.totalEvents = events?.length || 0;
    report.metrics.upcomingEvents = events?.filter(e => new Date(e.start_datetime) > new Date()).length || 0;

    return report;
  }

  private async generateMouStatus(job: ReportJob): Promise<any> {
    const { filters } = job.request.parameters;

    let query = this.supabase
      .from('mous')
      .select('*, primary_party:organizations!primary_party_id(*), secondary_party:organizations!secondary_party_id(*)');

    if (filters?.workflow_state) {
      query = query.in('workflow_state', filters.workflow_state);
    }

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    const { data: mous } = await query;

    return {
      title: 'MoU Status Report',
      generatedAt: new Date().toISOString(),
      filters,
      data: mous || [],
      summary: {
        total: mous?.length || 0,
        byState: this.groupByWorkflowState(mous || []),
        expiringSoon: mous?.filter(m => {
          if (!m.expiry_date) return false;
          const daysUntilExpiry = Math.floor(
            (new Date(m.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        }).length || 0
      }
    };
  }

  private async generateEventCalendar(job: ReportJob): Promise<any> {
    const { startDate, endDate, countryId, organizerId } = job.request.parameters;

    let query = this.supabase
      .from('events')
      .select('*')
      .gte('start_datetime', startDate)
      .lte('end_datetime', endDate)
      .order('start_datetime');

    if (countryId) {
      query = query.eq('country_id', countryId);
    }

    if (organizerId) {
      query = query.eq('organizer_id', organizerId);
    }

    const { data: events } = await query;

    // Group events by date
    const eventsByDate = new Map<string, any[]>();
    
    for (const event of events || []) {
      const dateKey = new Date(event.start_datetime).toISOString().split('T')[0];
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey)!.push(event);
    }

    return {
      title: 'Event Calendar',
      period: { start: startDate, end: endDate },
      totalEvents: events?.length || 0,
      calendar: Array.from(eventsByDate.entries()).map(([date, dayEvents]) => ({
        date,
        events: dayEvents
      }))
    };
  }

  private async generateIntelligenceDigest(job: ReportJob): Promise<any> {
    const { confidenceLevel, dateRange, topics } = job.request.parameters;

    let query = this.supabase
      .from('intelligence_reports')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (confidenceLevel) {
      query = query.in('confidence_level', confidenceLevel);
    }

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data: reports } = await query;

    // Filter by topics if provided
    let filteredReports = reports || [];
    if (topics && topics.length > 0) {
      filteredReports = filteredReports.filter(report => {
        const analysisTypes = report.analysis_type as string[] || [];
        return topics.some((topic: string) => analysisTypes.includes(topic));
      });
    }

    return {
      title: 'Intelligence Digest',
      period: dateRange,
      filters: { confidenceLevel, topics },
      reports: filteredReports,
      summary: {
        total: filteredReports.length,
        byConfidence: this.groupByConfidence(filteredReports),
        byType: this.groupByAnalysisType(filteredReports)
      }
    };
  }

  private async generateActivityReport(job: ReportJob): Promise<any> {
    const { userId, dateRange } = job.request.parameters;

    // Get user activity from audit log
    const { data: activities } = await this.supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', dateRange.start)
      .lte('timestamp', dateRange.end)
      .order('timestamp', { ascending: false });

    // Group activities by table
    const activitiesByTable = new Map<string, any[]>();
    for (const activity of activities || []) {
      if (!activitiesByTable.has(activity.table_name)) {
        activitiesByTable.set(activity.table_name, []);
      }
      activitiesByTable.get(activity.table_name)!.push(activity);
    }

    return {
      title: 'User Activity Report',
      userId,
      period: dateRange,
      totalActivities: activities?.length || 0,
      activitiesByEntity: Array.from(activitiesByTable.entries()).map(([table, acts]) => ({
        entity: table,
        count: acts.length,
        activities: acts
      }))
    };
  }

  private async generateCustomReport(job: ReportJob): Promise<any> {
    // Custom report logic based on parameters
    const { template, data } = job.request.parameters;

    return {
      title: 'Custom Report',
      template,
      data,
      generatedAt: new Date().toISOString()
    };
  }

  private async formatReport(data: any, format: ReportFormat, language: string): Promise<any> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
        
      case 'csv':
        return this.convertToCSV(data);
        
      case 'pdf':
        return await this.generatePDF(data, language);
        
      case 'excel':
        return await this.generateExcel(data);
        
      default:
        return data;
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion for tabular data
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return '';
    }

    const headers = Object.keys(data.data[0]);
    const rows = data.data.map((item: any) => 
      headers.map(h => JSON.stringify(item[h] || '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private async generatePDF(data: any, language: string): Promise<Buffer> {
    // In production, use a PDF library like puppeteer or pdfkit
    // For now, return a placeholder
    const content = JSON.stringify(data, null, 2);
    return Buffer.from(content);
  }

  private async generateExcel(data: any): Promise<Buffer> {
    // In production, use an Excel library like exceljs
    // For now, return a placeholder
    const content = JSON.stringify(data, null, 2);
    return Buffer.from(content);
  }

  private async saveReport(content: any, job: ReportJob): Promise<string> {
    const fileName = `report_${job.id}_${Date.now()}.${job.request.format}`;
    
    // In production, save to Supabase Storage
    // For now, return a mock URL
    const mockUrl = `https://storage.example.com/reports/${fileName}`;
    
    // Store reference in database
    await this.supabase
      .from('report_outputs')
      .insert({
        job_id: job.id,
        file_name: fileName,
        file_url: mockUrl,
        format: job.request.format,
        size_bytes: Buffer.byteLength(content),
        created_at: new Date().toISOString()
      });

    return mockUrl;
  }

  private async updateJobProgress(job: ReportJob, progress: number, message?: string): Promise<void> {
    job.progress = progress;
    if (message) {
      job.request.metadata = {
        ...job.request.metadata,
        progressMessage: message
      };
    }
    await this.updateJob(job);
  }

  private async handleJobError(job: ReportJob, error: any): Promise<void> {
    job.retryCount++;
    
    if (job.retryCount < job.maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, job.retryCount) * 1000;
      setTimeout(() => {
        job.status = 'queued';
        this.updateJob(job);
      }, delay);
    } else {
      // Mark as failed
      job.status = 'failed';
      job.error = error?.message || 'Unknown error';
      job.completedAt = new Date().toISOString();
      await this.updateJob(job);
    }
  }

  private async persistJob(job: ReportJob): Promise<void> {
    await this.supabase
      .from('report_jobs')
      .upsert({
        id: job.id,
        request: job.request as any,
        status: job.status,
        progress: job.progress,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        error: job.error,
        result_url: job.resultUrl,
        retry_count: job.retryCount,
        max_retries: job.maxRetries
      });
  }

  private async updateJob(job: ReportJob): Promise<void> {
    await this.persistJob(job);
  }

  private parseJobFromDb(data: any): ReportJob {
    return {
      id: data.id,
      request: data.request,
      status: data.status,
      progress: data.progress,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      error: data.error,
      resultUrl: data.result_url,
      retryCount: data.retry_count,
      maxRetries: data.max_retries
    };
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private groupByType(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByStatus(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByWorkflowState(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.workflow_state] = (acc[item.workflow_state] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByConfidence(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item.confidence_level] = (acc[item.confidence_level] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByAnalysisType(items: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    items.forEach(item => {
      const analysisTypes = item.analysis_type as string[] || [];
      analysisTypes.forEach(type => {
        types[type] = (types[type] || 0) + 1;
      });
    });
    return types;
  }

  // Cleanup method
  destroy(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }
}

// Export factory function
export function createReportGeneratorService(
  supabaseUrl: string,
  supabaseKey: string
): ReportGeneratorService {
  return new ReportGeneratorService(supabaseUrl, supabaseKey);
}
