/**
 * Dossier Model
 * Composite entity that aggregates information about countries/organizations
 */

import { UUID, StandardMetadata, Classification } from './types';

export interface DossierHistory {
  date: Date;
  event: string;
  significance: string;
  impact?: 'high' | 'medium' | 'low';
  documents?: UUID[];
}

export interface DossierSections {
  overview: string;
  history: DossierHistory[];
  current_status: string;
  strategic_importance?: string;
  cooperation_framework?: string;
  key_achievements?: string[];
  challenges?: string[];
  opportunities?: string[];
  contacts: UUID[];      // Contact IDs
  documents: UUID[];     // Document IDs
  activities: UUID[];    // Activity IDs
  commitments: UUID[];   // Commitment IDs
  insights?: string;     // AI-generated insights
}

export interface DossierStatistics {
  total_interactions: number;
  last_interaction: Date;
  documents_count: number;
  active_commitments: number;
  completed_commitments: number;
  active_mous: number;
  relationship_health_score?: number;
  engagement_frequency?: number; // Per month
}

export interface Dossier {
  id: UUID;
  type: 'country' | 'organization' | 'forum' | 'thematic';
  entity_id: UUID; // Reference to Country/Organization/Forum/ThematicArea
  title: string;
  executive_summary: string;
  status: 'active' | 'archived' | 'draft' | 'under_review';
  classification: Classification;
  tags: string[];
  sections: DossierSections;
  statistics: DossierStatistics;
  owner_id: UUID; // Primary responsible user
  contributors: UUID[]; // User IDs with edit access
  viewers?: UUID[]; // User IDs with view access
  last_reviewed?: Date;
  review_schedule?: 'monthly' | 'quarterly' | 'yearly';
  next_review_date?: Date;
  metadata: StandardMetadata;
}

export interface DossierInput {
  type: 'country' | 'organization' | 'forum' | 'thematic';
  entity_id: UUID;
  title: string;
  executive_summary?: string;
  status?: 'active' | 'archived' | 'draft' | 'under_review';
  classification?: Classification;
  tags?: string[];
  sections?: Partial<DossierSections>;
  owner_id: UUID;
  contributors?: UUID[];
  review_schedule?: 'monthly' | 'quarterly' | 'yearly';
}

export interface DossierWithRelations extends Dossier {
  entity_details?: {
    id: UUID;
    name_en: string;
    name_ar: string;
    type: string;
    additional_info?: any;
  };
  owner_details?: {
    id: UUID;
    name: string;
    email: string;
    department: string;
  };
  recent_activities?: Array<{
    id: UUID;
    type: string;
    title: string;
    date: Date;
    outcome?: string;
  }>;
  active_commitments_details?: Array<{
    id: UUID;
    title: string;
    due_date: Date;
    status: string;
    progress: number;
  }>;
  key_contacts?: Array<{
    id: UUID;
    name: string;
    position: string;
    organization: string;
    influence_score: number;
  }>;
  recent_intelligence?: Array<{
    id: UUID;
    type: string;
    title: string;
    relevance_score: number;
    action_required: boolean;
  }>;
}

/**
 * Generate executive summary from dossier data
 */
export function generateExecutiveSummary(dossier: Partial<Dossier>): string {
  const parts: string[] = [];

  if (dossier.sections?.overview) {
    parts.push(dossier.sections.overview.substring(0, 200));
  }

  if (dossier.statistics) {
    parts.push(`Total interactions: ${dossier.statistics.total_interactions}`);
    parts.push(`Active commitments: ${dossier.statistics.active_commitments}`);
  }

  if (dossier.sections?.strategic_importance) {
    parts.push(dossier.sections.strategic_importance.substring(0, 150));
  }

  return parts.join('. ');
}