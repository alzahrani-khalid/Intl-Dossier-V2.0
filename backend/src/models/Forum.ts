/**
 * Forum Model
 * International conferences and meetings
 */

import { UUID, StandardMetadata, Priority } from './types';

export interface ForumParticipant {
  entity_type: 'country' | 'organization';
  entity_id: UUID;
  participation_type: 'member' | 'observer' | 'chair' | 'co-chair' | 'secretariat';
  years_participated?: number[];
  attendance_rate?: number; // Percentage
}

export interface NextEvent {
  date: Date;
  location: string;
  host?: string;
  theme?: string;
  registration_deadline?: Date;
  preparation_status?: 'not_started' | 'planning' | 'preparing' | 'ready';
}

export interface ParticipationHistory {
  year: number;
  location: string;
  role: string;
  outcomes?: string[];
  documents?: UUID[];
  bilateral_meetings?: Array<{
    with: UUID;
    topics: string[];
    outcome: 'positive' | 'neutral' | 'negative';
  }>;
}

export interface Forum {
  id: UUID;
  name_en: string;
  name_ar: string;
  type: 'conference' | 'workshop' | 'summit' | 'committee_meeting' | 'bilateral' | 'working_group';
  frequency: 'annual' | 'biennial' | 'quarterly' | 'monthly' | 'one_time' | 'ad_hoc';
  organizing_body?: UUID; // Organization ID
  description?: {
    en: string;
    ar: string;
  };
  themes: string[];
  participants: ForumParticipant[];
  next_event?: NextEvent;
  participation_history: ParticipationHistory[];
  priority_level: Priority;
  objectives?: string[];
  expected_outcomes?: string[];
  preparation_requirements?: {
    position_papers: boolean;
    statistical_reports: boolean;
    presentations: boolean;
    bilateral_meetings: boolean;
  };
  strategic_importance?: string;
  tags?: string[];
  metadata: StandardMetadata;
}

export interface ForumInput {
  name_en: string;
  name_ar: string;
  type: 'conference' | 'workshop' | 'summit' | 'committee_meeting' | 'bilateral' | 'working_group';
  frequency: 'annual' | 'biennial' | 'quarterly' | 'monthly' | 'one_time' | 'ad_hoc';
  organizing_body?: UUID;
  description?: {
    en: string;
    ar: string;
  };
  themes?: string[];
  priority_level?: Priority;
  objectives?: string[];
  preparation_requirements?: {
    position_papers: boolean;
    statistical_reports: boolean;
    presentations: boolean;
    bilateral_meetings: boolean;
  };
  strategic_importance?: string;
  tags?: string[];
}

export interface ForumWithRelations extends Forum {
  organizing_body_details?: {
    id: UUID;
    name_en: string;
    name_ar: string;
    type: string;
  };
  participants_details?: Array<{
    entity_type: string;
    entity_id: UUID;
    name_en: string;
    name_ar: string;
    participation_type: string;
  }>;
  upcoming_briefs?: Array<{
    id: UUID;
    type: string;
    generation_status: string;
    language: string;
  }>;
  related_positions?: Array<{
    id: UUID;
    topic: string;
    stance: string;
    approved: boolean;
  }>;
  historical_outcomes?: Array<{
    year: number;
    key_decisions: string[];
    gastat_contributions: string[];
    follow_up_actions: string[];
  }>;
}