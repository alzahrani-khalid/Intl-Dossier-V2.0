/**
 * TypeScript type definitions for Intake Entity Linking System
 * Feature: 024-intake-entity-linking
 */

// Valid entity types that can be linked to intake tickets
export type EntityType =
  | 'dossier'
  | 'position'
  | 'mou'
  | 'engagement'
  | 'assignment'
  | 'commitment'
  | 'intelligence_signal'
  | 'organization'
  | 'country'
  | 'forum'
  | 'working_group'
  | 'topic';

// Valid link types
export type LinkType =
  | 'primary'      // Only 1 per intake, only to anchor entities
  | 'related'      // Unlimited, any entity type
  | 'requested'    // Unlimited, only to position/mou/engagement
  | 'mentioned'    // Unlimited, any entity type
  | 'assigned_to'; // Only 1 per intake, only to assignment

// Link source
export type LinkSource =
  | 'human'  // Manual linking by user
  | 'ai'     // AI-suggested link
  | 'import'; // Imported from external system

// Entity link record from database
export interface EntityLink {
  id: string;
  intake_id: string;
  entity_type: EntityType;
  entity_id: string;
  link_type: LinkType;
  source: LinkSource;
  confidence: number | null;
  notes: string | null;
  link_order: number;
  suggested_by: string | null;
  linked_by: string;
  _version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Request to create a new link
export interface CreateLinkRequest {
  intake_id: string;
  entity_type: EntityType;
  entity_id: string;
  link_type: LinkType;
  source?: LinkSource;
  confidence?: number;
  notes?: string;
  link_order?: number;
  suggested_by?: string;
}

// Request to update an existing link
export interface UpdateLinkRequest {
  notes?: string;
  link_order?: number;
  _version: number; // For optimistic locking
}

// Request to create multiple links in batch
export interface BatchCreateLinksRequest {
  intake_id: string;
  links: Array<{
    entity_type: EntityType;
    entity_id: string;
    link_type: LinkType;
    source?: LinkSource;
    confidence?: number;
    notes?: string;
    link_order?: number;
  }>;
}

// Request to reorder links
export interface ReorderLinksRequest {
  intake_id: string;
  link_orders: Array<{
    link_id: string;
    link_order: number;
  }>;
}

// Audit log entry
export interface LinkAuditLog {
  id: string;
  link_id: string;
  intake_id: string;
  entity_type: string;
  entity_id: string;
  action: 'created' | 'deleted' | 'restored' | 'migrated' | 'updated';
  performed_by: string;
  details: Record<string, any> | null;
  timestamp: string;
}

// Response for entity search
export interface EntitySearchResult {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  description?: string;
  classification_level?: number;
  last_linked_at?: string;
  similarity_score?: number; // AI-based similarity (0-1)
  combined_score: number;    // Final ranking score (0-1)
}

// Link validation result
export interface LinkValidationResult {
  valid: boolean;
  errors: string[];
}

// Entity metadata for caching
export interface EntityMetadata {
  entity_type: EntityType;
  entity_id: string;
  name: string;
  description?: string;
  classification_level?: number;
  last_linked_at?: string;
  is_archived: boolean;
  organization_id: string;
}
