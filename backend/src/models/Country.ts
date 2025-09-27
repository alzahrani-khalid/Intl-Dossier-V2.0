/**
 * Country Model
 * Represents a nation-state with its statistical system and bilateral relationships
 */

import { UUID, StandardMetadata } from './types';

export interface StatisticalSystem {
  type: 'centralized' | 'decentralized' | 'hybrid';
  nso_name: string;
  website: string;
  established_year: number;
}

export interface Country {
  id: UUID;
  code: string;                    // ISO 3166-1 alpha-2
  code3: string;                   // ISO 3166-1 alpha-3
  name_en: string;
  name_ar: string;
  region: string;                  // Geographic region
  statistical_system: StatisticalSystem;
  cooperation_areas: string[];
  expertise_domains: string[];
  relationship_status: 'active' | 'developing' | 'dormant';
  metadata: StandardMetadata;
}

/**
 * Country creation/update input (without generated fields)
 */
export interface CountryInput {
  code: string;
  code3: string;
  name_en: string;
  name_ar: string;
  region: string;
  statistical_system: StatisticalSystem;
  cooperation_areas?: string[];
  expertise_domains?: string[];
  relationship_status?: 'active' | 'developing' | 'dormant';
}

/**
 * Country with relationships (for queries with joins)
 */
export interface CountryWithRelations extends Country {
  organizations?: Array<{
    id: UUID;
    name_en: string;
    name_ar: string;
    relationship_type: string;
  }>;
  mous?: Array<{
    id: UUID;
    title_en: string;
    lifecycle_state: string;
  }>;
  contacts?: Array<{
    id: UUID;
    first_name: string;
    last_name: string;
    position_title: string;
  }>;
}

/**
 * Country Class with business logic methods
 */
export class Country {
  public id: UUID;
  public code: string;
  public code3: string;
  public name_en: string;
  public name_ar: string;
  public region: string;
  public statistical_system: StatisticalSystem;
  public cooperation_areas: string[];
  public expertise_domains: string[];
  public relationship_status: 'active' | 'developing' | 'dormant';
  public metadata: StandardMetadata;

  constructor(data: Partial<Country>) {
    this.id = data.id || '';
    this.code = data.code || '';
    this.code3 = data.code3 || '';
    this.name_en = data.name_en || '';
    this.name_ar = data.name_ar || '';
    this.region = data.region || '';
    this.statistical_system = data.statistical_system || {
      type: 'centralized',
      nso_name: '',
      website: '',
      established_year: new Date().getFullYear()
    };
    this.cooperation_areas = data.cooperation_areas || [];
    this.expertise_domains = data.expertise_domains || [];
    this.relationship_status = data.relationship_status || 'developing';
    this.metadata = data.metadata || {
      created_at: new Date(),
      updated_at: new Date(),
      created_by: '',
      last_modified_by: '',
      version: 1,
      tenant_id: '',
      is_deleted: false
    };
  }

  /**
   * Calculate relationship health score based on engagement metrics
   */
  calculateRelationshipHealthScore(metrics: {
    engagementFrequency: number;
    commitmentFulfillment: number;
    responseTime: number;
  }): number {
    const weights = {
      engagement: 0.4,
      fulfillment: 0.35,
      response: 0.25
    };

    return Math.round(
      metrics.engagementFrequency * weights.engagement +
      metrics.commitmentFulfillment * weights.fulfillment +
      (100 - metrics.responseTime) * weights.response
    );
  }

  /**
   * Check if country needs attention based on various factors
   */
  needsAttention(daysSinceLastInteraction: number, activeMous: number): boolean {
    if (daysSinceLastInteraction > 90) return true;
    if (activeMous > 0 && daysSinceLastInteraction > 30) return true;
    if (this.relationship_status === 'active' && daysSinceLastInteraction > 60) return true;
    return false;
  }

  /**
   * Get engagement level category
   */
  getEngagementLevel(interactionCount: number): 'high' | 'medium' | 'low' {
    if (interactionCount >= 10) return 'high';
    if (interactionCount >= 5) return 'medium';
    return 'low';
  }

  /**
   * Get engagement metrics for the country
   */
  getEngagementMetrics(): {
    activeMoUs: number;
    upcomingEvents: number;
    recentInteractions: number;
    tradeVolume: number;
  } {
    // This would typically fetch from database in a real implementation
    // For now, return default values for testing
    return {
      activeMoUs: 0,
      upcomingEvents: 0,
      recentInteractions: 0,
      tradeVolume: 0
    };
  }

  /**
   * Validate country data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.code || this.code.length !== 2) {
      errors.push('Country code must be exactly 2 characters (ISO 3166-1 alpha-2)');
    }

    if (!this.name_en) {
      errors.push('English name is required');
    }

    if (!this.name_ar) {
      errors.push('Arabic name is required');
    }

    if (!this.region) {
      errors.push('Region is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}