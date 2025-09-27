/**
 * Position Model
 * Official positions and policy statements
 */

import { UUID, StandardMetadata } from './types';

export interface PositionStance {
  statement_en: string;
  statement_ar: string;
  strength: 'strong_support' | 'support' | 'neutral' | 'oppose' | 'strong_oppose';
  conditions?: string[];
  exceptions?: string[];
}

export interface PositionAlignment {
  national_strategy: number; // Alignment percentage
  sdg_goals?: number[];
  vision_2030?: boolean;
  international_standards?: string[];
}

export interface PositionApproval {
  status: 'draft' | 'review' | 'approved' | 'superseded';
  approval_chain: Array<{
    user_id: UUID;
    role: string;
    department: string;
    approved: boolean;
    approved_at?: Date;
    comments?: string;
  }>;
  effective_date: Date;
  expiry_date?: Date;
}

export interface PositionVersion {
  version_number: number;
  previous_version_id?: UUID;
  changes_summary: string;
  changed_by: UUID;
  changed_at: Date;
  reason: string;
}

export interface Position {
  id: UUID;
  topic: string;
  category: string;
  thematic_area_id?: UUID;
  stance: PositionStance;
  rationale: string;
  alignment: PositionAlignment;
  approval: PositionApproval;
  version: PositionVersion;
  related_positions?: UUID[];
  supporting_documents?: UUID[];
  usage_guidelines?: string;
  usage_count: number;
  last_used?: Date;
  consistency_check?: {
    last_checked: Date;
    consistency_score: number;
    conflicts?: Array<{
      position_id: UUID;
      conflict_type: 'contradiction' | 'ambiguity' | 'outdated';
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  metadata: StandardMetadata;
}

export interface PositionInput {
  topic: string;
  category: string;
  thematic_area_id?: UUID;
  stance: PositionStance;
  rationale: string;
  alignment?: PositionAlignment;
  related_positions?: UUID[];
  supporting_documents?: UUID[];
  usage_guidelines?: string;
}

export interface PositionWithRelations extends Position {
  thematic_area?: {
    id: UUID;
    code: string;
    name_en: string;
    name_ar: string;
  };
  related_positions_details?: Array<{
    id: UUID;
    topic: string;
    stance_strength: string;
    version: number;
  }>;
  conflicting_positions?: Array<{
    id: UUID;
    topic: string;
    conflict_type: string;
    severity: string;
    resolution_status?: string;
  }>;
  usage_history?: Array<{
    date: Date;
    context: string;
    used_by: UUID;
    forum?: string;
  }>;
}