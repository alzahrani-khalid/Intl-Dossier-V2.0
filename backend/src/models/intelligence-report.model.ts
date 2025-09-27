export interface ThreatIndicator {
  indicator_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  description_ar?: string;
  confidence: number;
  source_reference?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  location_name: string;
  location_name_ar?: string;
  location_type: 'city' | 'region' | 'country' | 'coordinate';
  radius_km?: number;
}

export interface IntelligenceReport {
  id: string;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  
  confidence_score: number;
  data_sources: string[];
  analysis_timestamp: Date;
  analyst_id: string;
  review_status: 'draft' | 'pending' | 'approved' | 'archived';
  
  threat_indicators: ThreatIndicator[];
  geospatial_tags: GeoLocation[];
  
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
  embedding_error?: string;
  
  created_at: Date;
  archived_at?: Date;
  retention_until: Date;
  
  vector_embedding_id?: string;
  organization_id: string;
  dossier_id?: string;
}

export interface IntelligenceReportInput {
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  confidence_score?: number;
  data_sources: string[];
  threat_indicators?: ThreatIndicator[];
  geospatial_tags?: GeoLocation[];
  organization_id: string;
  dossier_id?: string;
}

export class IntelligenceReportModel {
  static validate(data: Partial<IntelligenceReportInput>): string[] {
    const errors: string[] = [];
    
    if (!data.title && !data.title_ar) {
      errors.push('Title required in at least one language');
    }
    
    if (!data.content && !data.content_ar) {
      errors.push('Content required in at least one language');
    }
    
    if (data.confidence_score !== undefined && 
        (data.confidence_score < 0 || data.confidence_score > 100)) {
      errors.push('Confidence score must be between 0 and 100');
    }
    
    if (!data.data_sources || data.data_sources.length === 0) {
      errors.push('At least one data source required');
    }
    
    if (data.threat_indicators) {
      data.threat_indicators.forEach((indicator, index) => {
        if (indicator.confidence < 0 || indicator.confidence > 100) {
          errors.push(`Threat indicator ${index} confidence must be between 0 and 100`);
        }
      });
    }
    
    return errors;
  }
  
  static createRetentionDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 7);
    return date;
  }
  
  static isArchivable(report: IntelligenceReport): boolean {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return report.created_at < ninetyDaysAgo && !report.archived_at;
  }
  
  static getStateTransitions(currentState: IntelligenceReport['review_status']): IntelligenceReport['review_status'][] {
    const transitions: Record<IntelligenceReport['review_status'], IntelligenceReport['review_status'][]> = {
      'draft': ['pending', 'archived'],
      'pending': ['approved', 'draft', 'archived'],
      'approved': ['archived'],
      'archived': []
    };
    return transitions[currentState];
  }
}