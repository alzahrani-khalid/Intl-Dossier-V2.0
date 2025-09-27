export type SourceType = 'rss' | 'api' | 'web' | 'email';
export type ScanFrequency = 'hourly' | 'daily' | 'weekly';
export type AuthType = 'none' | 'bearer' | 'api-key';

export interface ApiConfig {
  endpoint: string;
  headers: Record<string, string>;
  auth_type: AuthType;
  auth_token?: string;
}

export interface IntelligenceSource {
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  api_config?: ApiConfig;
  scanning_frequency: ScanFrequency;
  keywords: string[];
  categories: string[];
  reliability_score: number;
  last_scanned_at?: Date;
  next_scan_at: Date;
  active: boolean;
  error_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIntelligenceSourceDto {
  name: string;
  type: SourceType;
  url?: string;
  api_config?: ApiConfig;
  scanning_frequency: ScanFrequency;
  keywords: string[];
  categories: string[];
  reliability_score?: number;
}

export interface UpdateIntelligenceSourceDto {
  name?: string;
  url?: string;
  api_config?: ApiConfig;
  scanning_frequency?: ScanFrequency;
  keywords?: string[];
  categories?: string[];
  reliability_score?: number;
  active?: boolean;
}

export interface ScanResult {
  source_id: string;
  items_found: number;
  relevant_items: number;
  errors: string[];
  scan_duration_ms: number;
  timestamp: Date;
}

export class IntelligenceSourceModel {
  static tableName = 'intelligence_sources';

  static readonly SCAN_INTERVALS: Record<ScanFrequency, number> = {
    'hourly': 60 * 60 * 1000,
    'daily': 24 * 60 * 60 * 1000,
    'weekly': 7 * 24 * 60 * 60 * 1000
  };

  static readonly MAX_ERROR_COUNT = 5;
  static readonly MIN_RELIABILITY_SCORE = 0;
  static readonly MAX_RELIABILITY_SCORE = 100;

  static validate(source: Partial<IntelligenceSource>): boolean {
    if (!source.name || !source.type) {
      return false;
    }

    if (!['rss', 'api', 'web', 'email'].includes(source.type)) {
      return false;
    }

    if (source.type !== 'email' && !source.url) {
      return false;
    }

    if (source.type === 'api' && !source.api_config) {
      return false;
    }

    if (source.reliability_score !== undefined) {
      if (source.reliability_score < this.MIN_RELIABILITY_SCORE || 
          source.reliability_score > this.MAX_RELIABILITY_SCORE) {
        return false;
      }
    }

    return true;
  }

  static calculateNextScanTime(source: IntelligenceSource): Date {
    const interval = this.SCAN_INTERVALS[source.scanning_frequency];
    const lastScan = source.last_scanned_at || new Date();
    return new Date(lastScan.getTime() + interval);
  }

  static isDueForScan(source: IntelligenceSource): boolean {
    if (!source.active) {
      return false;
    }

    if (source.error_count >= this.MAX_ERROR_COUNT) {
      return false;
    }

    return new Date() >= new Date(source.next_scan_at);
  }

  static updateReliabilityScore(
    source: IntelligenceSource,
    successRate: number,
    relevanceRate: number
  ): number {
    // Weight success rate and relevance rate
    const newScore = (successRate * 0.3) + (relevanceRate * 0.7);
    
    // Apply smoothing with existing score
    const smoothedScore = (source.reliability_score * 0.7) + (newScore * 0.3);
    
    return Math.min(
      this.MAX_RELIABILITY_SCORE, 
      Math.max(this.MIN_RELIABILITY_SCORE, Math.round(smoothedScore))
    );
  }

  static incrementErrorCount(source: IntelligenceSource): void {
    source.error_count++;
    
    if (source.error_count >= this.MAX_ERROR_COUNT) {
      source.active = false;
    }
  }

  static resetErrorCount(source: IntelligenceSource): void {
    source.error_count = 0;
  }

  static matchesKeywords(text: string, keywords: string[]): boolean {
    const lowercaseText = text.toLowerCase();
    return keywords.some(keyword => 
      lowercaseText.includes(keyword.toLowerCase())
    );
  }

  static matchesCategories(categories: string[], sourceCategories: string[]): boolean {
    return categories.some(cat => 
      sourceCategories.includes(cat)
    );
  }

  static buildApiRequest(source: IntelligenceSource): RequestInit | null {
    if (source.type !== 'api' || !source.api_config) {
      return null;
    }

    const headers = { ...source.api_config.headers };

    if (source.api_config.auth_type === 'bearer' && source.api_config.auth_token) {
      headers['Authorization'] = `Bearer ${source.api_config.auth_token}`;
    } else if (source.api_config.auth_type === 'api-key' && source.api_config.auth_token) {
      headers['X-API-Key'] = source.api_config.auth_token;
    }

    return {
      method: 'GET',
      headers
    };
  }
}

export default IntelligenceSourceModel;