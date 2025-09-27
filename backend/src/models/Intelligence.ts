/**
 * Intelligence Model
 * Strategic insights, trends, and opportunities
 */

import { UUID, StandardMetadata, Priority } from './types';

export interface IntelligenceSource {
  type: 'internal' | 'external' | 'ai_generated' | 'manual';
  source_id?: UUID;
  name: string;
  url?: string;
  credibility_score?: number; // 0-100
  date_collected?: Date;
}

export interface IntelligenceRelevance {
  entities: Array<{
    type: 'country' | 'organization' | 'thematic_area' | 'forum';
    id?: UUID;
    name: string;
    relevance_score: number; // 0-100
  }>;
  keywords: string[];
  topics: string[];
  sdg_goals?: number[];
}

export interface IntelligenceActionItem {
  action: string;
  priority: Priority;
  assigned_to?: UUID;
  deadline?: Date;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface Intelligence {
  id: UUID;
  type: 'trend' | 'opportunity' | 'risk' | 'best_practice' | 'news' | 'benchmark' | 'update';
  category: 'statistical_method' | 'technology' | 'partnership' | 'regulation' |
            'event' | 'governance' | 'capacity_building' | 'other';
  title: string;
  summary: string;
  details?: string;
  source: IntelligenceSource;
  relevance: IntelligenceRelevance;
  relevance_score: number; // Overall 0-100
  recommendations?: string[];
  action_required: boolean;
  action_items?: IntelligenceActionItem[];
  impact_assessment?: {
    level: 'high' | 'medium' | 'low';
    areas: string[];
    timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  };
  processed: boolean;
  processed_by?: UUID;
  processed_at?: Date;
  expires_at?: Date;
  tags?: string[];
  metadata: StandardMetadata;
}

export interface IntelligenceInput {
  type: 'trend' | 'opportunity' | 'risk' | 'best_practice' | 'news' | 'benchmark' | 'update';
  category: 'statistical_method' | 'technology' | 'partnership' | 'regulation' |
            'event' | 'governance' | 'capacity_building' | 'other';
  title: string;
  summary: string;
  details?: string;
  source: IntelligenceSource;
  relevance?: IntelligenceRelevance;
  recommendations?: string[];
  action_required?: boolean;
  impact_assessment?: {
    level: 'high' | 'medium' | 'low';
    areas: string[];
    timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  };
  expires_at?: Date;
  tags?: string[];
}

export interface IntelligenceWithRelations extends Intelligence {
  source_details?: {
    id: UUID;
    name: string;
    type: string;
    reliability_score: number;
  };
  related_entities?: Array<{
    type: string;
    id: UUID;
    name_en: string;
    name_ar?: string;
  }>;
  derived_tasks?: Array<{
    id: UUID;
    title: string;
    status: string;
    assigned_to: string;
  }>;
  similar_intelligence?: Array<{
    id: UUID;
    title: string;
    type: string;
    relevance_score: number;
  }>;
}