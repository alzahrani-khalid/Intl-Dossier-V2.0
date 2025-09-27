/**
 * Contact Model
 * Manages individuals in organizations with influence scoring
 */

import { UUID, StandardMetadata, Language } from './types';

export interface Position {
  title: string;
  department: string;
  level: 'executive' | 'senior' | 'middle' | 'junior';
  since: Date;
  is_primary: boolean;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  mobile?: string;
  whatsapp?: string;
  linkedin?: string;
  assistant_email?: string;
  preferred_channel: 'email' | 'phone' | 'whatsapp' | 'in-person';
}

export interface LanguageCapability {
  language: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'basic';
}

export interface InteractionEntry {
  date: Date;
  type: 'meeting' | 'call' | 'email' | 'event' | 'message';
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  outcome?: string;
  follow_up_required?: boolean;
  logged_by: UUID;
}

export interface CommunicationPreferences {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  calls: boolean;
  language: Language;
  timezone?: string;
  best_time?: string;
}

export interface Contact {
  id: UUID;
  salutation?: string;
  first_name: string;
  last_name: string;
  name_ar?: string;
  organization_id?: UUID;
  country_id?: UUID;
  position: Position;
  expertise_areas: string[];
  languages: LanguageCapability[];
  contact_info: ContactInfo;
  interaction_history: InteractionEntry[];
  influence_score: number; // 0-100
  influence_factors?: {
    position_weight: number;
    interaction_frequency: number;
    decision_authority: number;
  };
  preferences: CommunicationPreferences;
  notes?: string;
  active: boolean;
  metadata: StandardMetadata;
}

export interface ContactInput {
  salutation?: string;
  first_name: string;
  last_name: string;
  name_ar?: string;
  organization_id?: UUID;
  country_id?: UUID;
  position: Position;
  expertise_areas?: string[];
  languages?: LanguageCapability[];
  contact_info: ContactInfo;
  preferences?: CommunicationPreferences;
  notes?: string;
  active?: boolean;
}

export interface ContactWithRelations extends Contact {
  organization?: {
    id: UUID;
    name_en: string;
    name_ar: string;
    type: string;
  };
  country?: {
    id: UUID;
    code: string;
    name_en: string;
    name_ar: string;
  };
  recent_activities?: Array<{
    id: UUID;
    type: string;
    title: string;
    date: Date;
  }>;
  signature_participations?: Array<{
    request_id: UUID;
    mou_id: UUID;
    status: string;
    signed_at?: Date;
  }>;
}