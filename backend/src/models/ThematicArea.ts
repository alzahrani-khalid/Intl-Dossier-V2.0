/**
 * ThematicArea Model
 * Strategic domains and official positions
 */

import { UUID, StandardMetadata } from './types';

export interface ThematicResource {
  type: 'document' | 'expert' | 'best_practice' | 'tool' | 'dataset';
  id: UUID;
  title: string;
  description?: string;
  url?: string;
}

export interface ThematicArea {
  id: UUID;
  code: string; // e.g., 'SDG-1', 'DIGITAL-TRANS', 'GOV-4.0'
  name_en: string;
  name_ar: string;
  category: 'sdg' | 'methodology' | 'technology' | 'governance' | 'capacity';
  parent_area_id?: UUID; // Hierarchical structure
  description: {
    en: string;
    ar: string;
  };
  strategic_importance: 'critical' | 'high' | 'medium' | 'low';
  related_sdg_indicators?: string[];
  resources: ThematicResource[];
  experts: UUID[]; // Contact IDs
  best_practices?: Array<{
    title: string;
    description: string;
    source?: string;
    implementation_level?: 'fully' | 'partially' | 'planned';
  }>;
  related_entities: Array<{
    type: 'country' | 'organization';
    id: UUID;
    relationship: string;
  }>;
  positions?: UUID[]; // Position IDs
  metadata: StandardMetadata;
}

export interface ThematicAreaInput {
  code: string;
  name_en: string;
  name_ar: string;
  category: 'sdg' | 'methodology' | 'technology' | 'governance' | 'capacity';
  parent_area_id?: UUID;
  description: {
    en: string;
    ar: string;
  };
  strategic_importance?: 'critical' | 'high' | 'medium' | 'low';
  related_sdg_indicators?: string[];
  resources?: ThematicResource[];
  experts?: UUID[];
  best_practices?: Array<{
    title: string;
    description: string;
    source?: string;
    implementation_level?: 'fully' | 'partially' | 'planned';
  }>;
}

export interface ThematicAreaWithRelations extends ThematicArea {
  parent_area?: {
    id: UUID;
    code: string;
    name_en: string;
    name_ar: string;
  };
  child_areas?: Array<{
    id: UUID;
    code: string;
    name_en: string;
    name_ar: string;
  }>;
  expert_details?: Array<{
    id: UUID;
    name: string;
    organization: string;
    expertise_level: 'expert' | 'specialist' | 'contributor';
  }>;
  official_positions?: Array<{
    id: UUID;
    topic: string;
    status: string;
    version: number;
  }>;
}