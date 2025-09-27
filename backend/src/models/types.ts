/**
 * Shared types for the GASTAT International Dossier System
 * These types are used across all models for consistency
 */

export type UUID = string;

/**
 * Standard metadata fields for all entities
 * Provides audit trail and multi-tenant isolation
 */
export interface StandardMetadata {
  created_at: Date;
  updated_at: Date;
  created_by: UUID;
  last_modified_by: UUID;
  version: number;
  tenant_id: UUID;
  is_deleted: boolean;
  deleted_at?: Date;
}

/**
 * MoU Lifecycle State Machine
 */
export enum MoUState {
  DRAFT = 'draft',
  NEGOTIATION = 'negotiation',
  PENDING_APPROVAL = 'pending_approval',
  SIGNED = 'signed',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  TERMINATED = 'terminated'
}

/**
 * Task Status State Machine
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Commitment Status
 */
export type CommitmentStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

/**
 * Priority Levels
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type UrgentPriority = 'urgent' | 'high' | 'medium' | 'low';

/**
 * Document Classification Levels
 */
export type Classification = 'public' | 'internal' | 'confidential' | 'secret';

/**
 * Language Options
 */
export type Language = 'ar' | 'en' | 'bilingual';

/**
 * Relationship Health Status
 */
export type HealthStatus = 'healthy' | 'monitor' | 'at_risk' | 'critical';

/**
 * Entity Types for polymorphic relationships
 */
export type EntityType = 'country' | 'organization' | 'forum' | 'thematic_area' |
                        'mou' | 'contact' | 'document' | 'commitment' | 'brief' |
                        'position' | 'activity' | 'task' | 'relationship' |
                        'intelligence' | 'workspace';

/**
 * Health Score Weights for relationship calculation
 */
export interface HealthScoreWeights {
  engagement_frequency: 0.40;
  commitment_fulfillment: 0.35;
  response_time: 0.25;
}