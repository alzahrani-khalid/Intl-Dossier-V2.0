/**
 * Activity Model
 * Events, meetings, and interactions tracking
 */

import { UUID, StandardMetadata } from './types';

export interface Location {
  type: 'physical' | 'virtual' | 'hybrid';
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  virtual_link?: string;
  timezone?: string;
}

export interface Participant {
  contact_id?: UUID;
  external_name?: string;
  external_organization?: string;
  role: 'organizer' | 'speaker' | 'participant' | 'observer' | 'facilitator';
  attended: boolean;
  contribution?: string;
}

export interface AgendaItem {
  order: number;
  topic: string;
  presenter?: UUID;
  duration_minutes?: number;
  type: 'presentation' | 'discussion' | 'decision' | 'information';
  outcome?: string;
}

export interface ActivityOutcomes {
  summary: string;
  decisions?: string[];
  action_items?: UUID[]; // Task IDs
  follow_ups?: string[];
  next_steps?: string[];
  issues_raised?: string[];
}

export interface ActivityCost {
  amount: number;
  currency: string;
  category: 'travel' | 'accommodation' | 'venue' | 'catering' | 'other';
  description?: string;
  approved_by?: UUID;
}

export interface ActivityEvaluation {
  objectives_met: number; // Percentage
  participant_satisfaction?: number; // 1-5 scale
  relationships_strengthened?: UUID[];
  follow_up_opportunities?: string[];
  lessons_learned?: string[];
  roi_assessment?: string;
}

export interface Activity {
  id: UUID;
  type: 'meeting' | 'mission' | 'conference' | 'workshop' | 'phone_call' | 'email_exchange' | 'event';
  title: string;
  date: Date;
  duration_hours?: number;
  location?: Location;
  participants: Participant[];
  agenda?: AgendaItem[];
  outcomes: ActivityOutcomes;
  documents?: UUID[];
  costs?: ActivityCost[];
  evaluation?: ActivityEvaluation;
  tags?: string[];
  metadata: StandardMetadata;
}

export interface ActivityInput {
  type: 'meeting' | 'mission' | 'conference' | 'workshop' | 'phone_call' | 'email_exchange' | 'event';
  title: string;
  date: Date;
  duration_hours?: number;
  location?: Location;
  participants?: Participant[];
  agenda?: AgendaItem[];
  outcomes?: Partial<ActivityOutcomes>;
  documents?: UUID[];
  costs?: ActivityCost[];
  tags?: string[];
}

export interface ActivityWithRelations extends Activity {
  participants_details?: Array<{
    contact_id?: UUID;
    name: string;
    organization: string;
    position?: string;
    role: string;
  }>;
  related_tasks?: Array<{
    id: UUID;
    title: string;
    status: string;
    assigned_to: string;
  }>;
  related_mous?: Array<{
    id: UUID;
    reference_number: string;
    title_en: string;
  }>;
  documents_details?: Array<{
    id: UUID;
    title: string;
    type: string;
  }>;
}