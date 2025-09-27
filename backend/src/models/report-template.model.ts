export interface OrganizationBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  name_ar?: string;
  
  report_type: 'executive' | 'analytical' | 'compliance';
  
  include_metrics: boolean;
  include_trends: boolean;
  include_charts: boolean;
  include_audit_trail: boolean;
  
  supported_formats: ('pdf' | 'excel' | 'csv' | 'json')[];
  
  schedule_enabled: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly';
  schedule_time?: string;
  
  organization_branding: OrganizationBranding;
  
  template_content: string;
  template_content_ar?: string;
  
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ReportTemplateInput {
  name: string;
  name_ar?: string;
  report_type: 'executive' | 'analytical' | 'compliance';
  include_metrics?: boolean;
  include_trends?: boolean;
  include_charts?: boolean;
  include_audit_trail?: boolean;
  supported_formats: ('pdf' | 'excel' | 'csv' | 'json')[];
  schedule_enabled?: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly';
  schedule_time?: string;
  organization_branding?: OrganizationBranding;
  template_content: string;
  template_content_ar?: string;
}

export interface ScheduledReport {
  id: string;
  template_id: string;
  next_run: Date;
  last_run?: Date;
  email_recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  enabled: boolean;
}

export class ReportTemplateModel {
  static readonly VALID_FORMATS = ['pdf', 'excel', 'csv', 'json'] as const;
  static readonly VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
  static readonly VALID_REPORT_TYPES = ['executive', 'analytical', 'compliance'] as const;
  
  static validate(data: Partial<ReportTemplateInput>): string[] {
    const errors: string[] = [];
    
    if (!data.name) {
      errors.push('Template name is required');
    }
    
    if (!data.template_content) {
      errors.push('Template content is required');
    }
    
    if (!data.report_type || !this.VALID_REPORT_TYPES.includes(data.report_type)) {
      errors.push(`Report type must be one of: ${this.VALID_REPORT_TYPES.join(', ')}`);
    }
    
    if (!data.supported_formats || data.supported_formats.length === 0) {
      errors.push('At least one supported format is required');
    } else {
      const invalidFormats = data.supported_formats.filter(
        format => !this.VALID_FORMATS.includes(format)
      );
      if (invalidFormats.length > 0) {
        errors.push(`Invalid formats: ${invalidFormats.join(', ')}`);
      }
    }
    
    if (data.schedule_enabled && data.schedule_time) {
      if (!this.isValidCronExpression(data.schedule_time)) {
        errors.push('Schedule time must be a valid cron expression');
      }
    }
    
    if (data.schedule_frequency && !this.VALID_FREQUENCIES.includes(data.schedule_frequency)) {
      errors.push(`Schedule frequency must be one of: ${this.VALID_FREQUENCIES.join(', ')}`);
    }
    
    return errors;
  }
  
  static isValidCronExpression(expression: string): boolean {
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronRegex.test(expression);
  }
  
  static generateCronExpression(frequency: ReportTemplate['schedule_frequency'], time?: string): string {
    const [hour = '0', minute = '0'] = time?.split(':') || [];
    
    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * 1`; // Monday
      case 'monthly':
        return `${minute} ${hour} 1 * *`; // First day of month
      default:
        return '0 0 * * *'; // Default to daily at midnight
    }
  }
  
  static calculateNextRun(cronExpression: string, from: Date = new Date()): Date {
    // Simplified next run calculation for common patterns
    const parts = cronExpression.split(' ');
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts.map(p => 
      p === '*' ? null : parseInt(p, 10)
    );
    
    const next = new Date(from);
    
    if (minute !== null) next.setMinutes(minute);
    if (hour !== null) next.setHours(hour);
    
    // Daily
    if (dayOfMonth === null && dayOfWeek === null) {
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
    }
    // Weekly
    else if (dayOfWeek !== null) {
      const daysUntilNext = (dayOfWeek - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilNext);
    }
    // Monthly
    else if (dayOfMonth !== null) {
      next.setDate(dayOfMonth);
      if (next <= from) {
        next.setMonth(next.getMonth() + 1);
      }
    }
    
    return next;
  }
  
  static getDefaultInclusions(reportType: ReportTemplate['report_type']): {
    include_metrics: boolean;
    include_trends: boolean;
    include_charts: boolean;
    include_audit_trail: boolean;
  } {
    switch (reportType) {
      case 'executive':
        return {
          include_metrics: true,
          include_trends: true,
          include_charts: true,
          include_audit_trail: false
        };
      case 'analytical':
        return {
          include_metrics: true,
          include_trends: true,
          include_charts: true,
          include_audit_trail: false
        };
      case 'compliance':
        return {
          include_metrics: false,
          include_trends: false,
          include_charts: false,
          include_audit_trail: true
        };
    }
  }
  
  static validateTemplateContent(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for required template variables
    const requiredVars = ['{{title}}', '{{content}}', '{{date}}'];
    const missingVars = requiredVars.filter(v => !content.includes(v));
    
    if (missingVars.length > 0) {
      errors.push(`Missing required template variables: ${missingVars.join(', ')}`);
    }
    
    // Check for balanced brackets
    const openBrackets = (content.match(/{{/g) || []).length;
    const closeBrackets = (content.match(/}}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      errors.push('Unbalanced template brackets');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}