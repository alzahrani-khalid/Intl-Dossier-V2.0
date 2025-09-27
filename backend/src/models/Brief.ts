/**
 * Brief Model
 * AI-generated briefing documents for various purposes
 */

import { UUID, StandardMetadata, Language } from './types';

export interface BriefContext {
  meeting_date?: Date;
  participants?: UUID[];
  agenda_items?: string[];
  previous_meeting_id?: UUID;
  target_audience?: string;
}

export interface BriefContent {
  executive_summary: string;
  key_points: string[];
  talking_points: string[];
  background: string;
  recommendations: string[];
  risks: string[];
  opportunities?: string[];
  action_items?: string[];
}

export interface BriefPersonalization {
  target_role: string;
  detail_level: 'executive' | 'detailed' | 'technical';
  focus_areas: string[];
  language_preference: Language;
}

export interface GenerationMetrics {
  method: 'ai' | 'template' | 'manual' | 'hybrid';
  generation_time_ms: number;
  confidence_score?: number;
  model_used?: string;
  fallback_used?: boolean;
}

export interface Brief {
  id: UUID;
  type: 'meeting' | 'event' | 'executive' | 'policy' | 'country' | 'organization';
  target_entity: {
    type: 'country' | 'organization' | 'forum' | 'mou';
    id: UUID;
  };
  purpose: string;
  context: BriefContext;
  content: BriefContent;
  personalization: BriefPersonalization;
  generation: GenerationMetrics;
  language: Language;
  approved: boolean;
  approved_by?: UUID;
  approved_at?: Date;
  expires_at?: Date;
  usage_count: number;
  last_accessed?: Date;
  metadata: StandardMetadata;
}

export interface BriefInput {
  type: 'meeting' | 'event' | 'executive' | 'policy' | 'country' | 'organization';
  target_entity: {
    type: 'country' | 'organization' | 'forum' | 'mou';
    id: UUID;
  };
  purpose: string;
  context?: BriefContext;
  personalization: BriefPersonalization;
  language?: Language;
  expires_at?: Date;
}

export interface BriefWithRelations extends Brief {
  target_entity_details?: {
    name_en: string;
    name_ar: string;
    type: string;
  };
  participants_details?: Array<{
    id: UUID;
    name: string;
    position: string;
    organization: string;
  }>;
  related_documents?: Array<{
    id: UUID;
    title: string;
    type: string;
  }>;
}