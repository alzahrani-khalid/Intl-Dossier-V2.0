/**
 * After-Action Structured Documentation - Type Definitions
 * Feature: 022-after-action-structured
 *
 * TypeScript interfaces and Zod validation schemas for after-action records
 * and related entities. Shared between client and server for type safety.
 */

import { z } from 'zod'

/**
 * Enums matching database ENUM types
 */
export enum ConfidentialityLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  SECRET = 'secret',
}

export enum AfterActionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  EDIT_PENDING = 'edit_pending',
}

export enum OwnerType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum CommitmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CommitmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum TrackingType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskLikelihood {
  RARE = 'rare',
  UNLIKELY = 'unlikely',
  POSSIBLE = 'possible',
  LIKELY = 'likely',
  CERTAIN = 'certain',
}

/**
 * Attendance record for meetings
 */
export interface AttendanceRecord {
  name: string
  role: string
  organization: string
}

/**
 * Decision entity
 */
export interface Decision {
  id?: string
  after_action_id?: string
  description: string
  rationale?: string
  decision_maker: string
  decided_at: Date | string
  supporting_context?: string
  ai_extracted: boolean
  confidence_score?: number
  created_at?: Date | string
}

/**
 * Commitment entity
 */
export interface Commitment {
  id?: string
  after_action_id?: string
  dossier_id?: string
  description: string
  owner_type: OwnerType
  owner_internal_id?: string
  owner_external_id?: string
  due_date: Date | string
  priority: CommitmentPriority
  status: CommitmentStatus
  tracking_type: TrackingType
  completion_notes?: string
  completed_at?: Date | string
  ai_extracted: boolean
  confidence_score?: number
  created_at?: Date | string
  updated_at?: Date | string
}

/**
 * Risk entity
 */
export interface Risk {
  id?: string
  after_action_id?: string
  description: string
  severity: RiskSeverity
  likelihood: RiskLikelihood
  mitigation_strategy?: string
  owner_id?: string
  ai_extracted: boolean
  confidence_score?: number
  created_at?: Date | string
}

/**
 * Follow-up action entity
 */
export interface FollowUpAction {
  id?: string
  after_action_id?: string
  description: string
  owner_id?: string
  due_date?: Date | string
  ai_extracted: boolean
  confidence_score?: number
  created_at?: Date | string
}

/**
 * Attachment entity
 */
export interface Attachment {
  id?: string
  after_action_id?: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  storage_url?: string
  scan_status: 'pending' | 'clean' | 'infected' | 'failed'
  scan_result?: string
  uploaded_by?: string
  uploaded_at?: Date | string
}

/**
 * Version snapshot entity
 */
export interface VersionSnapshot {
  id?: string
  after_action_id: string
  version_number: number
  snapshot_data: Record<string, unknown>
  change_diff?: Record<string, unknown>
  version_reason?: string
  created_by?: string
  created_at?: Date | string
  approved_by?: string
  approved_at?: Date | string
}

/**
 * After-action record entity (main)
 */
export interface AfterActionRecord {
  id?: string
  engagement_id: string
  dossier_id: string
  title: string
  description?: string
  confidentiality_level: ConfidentialityLevel
  status: AfterActionStatus
  attendance_list: AttendanceRecord[]
  created_by?: string
  created_at?: Date | string
  updated_by?: string
  updated_at?: Date | string
  published_by?: string
  published_at?: Date | string
  edit_requested_by?: string
  edit_requested_at?: Date | string
  edit_request_reason?: string
  edit_approved_by?: string
  edit_approved_at?: Date | string
  edit_rejection_reason?: string
  _version: number

  // Nested entities (for full record retrieval)
  decisions?: Decision[]
  commitments?: Commitment[]
  risks?: Risk[]
  follow_up_actions?: FollowUpAction[]
  attachments?: Attachment[]
}

/**
 * External contact entity
 */
export interface ExternalContact {
  id?: string
  email: string
  name: string
  organization?: string
  email_enabled: boolean
  contact_notes?: string
  created_by?: string
  created_at?: Date | string
  updated_at?: Date | string
}

/**
 * Zod Validation Schemas
 */

// Attendance record schema
export const attendanceRecordSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  role: z
    .string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be at most 100 characters'),
  organization: z
    .string()
    .min(2, 'Organization must be at least 2 characters')
    .max(200, 'Organization must be at most 200 characters'),
})

// Decision schema
export const decisionSchema = z.object({
  description: z
    .string()
    .min(10, 'Decision description must be at least 10 characters')
    .max(2000, 'Decision description must be at most 2000 characters'),
  rationale: z.string().max(2000, 'Rationale must be at most 2000 characters').optional(),
  decision_maker: z
    .string()
    .min(2, 'Decision maker name must be at least 2 characters')
    .max(100, 'Decision maker name must be at most 100 characters'),
  decided_at: z.coerce.date().max(new Date(), 'Decision date cannot be in the future'),
  supporting_context: z
    .string()
    .max(2000, 'Supporting context must be at most 2000 characters')
    .optional(),
  ai_extracted: z.boolean().default(false),
  confidence_score: z.number().min(0).max(1).optional(),
})

// Commitment schema
export const commitmentSchema = z
  .object({
    description: z
      .string()
      .min(10, 'Commitment description must be at least 10 characters')
      .max(2000, 'Commitment description must be at most 2000 characters'),
    owner_type: z.nativeEnum(OwnerType),
    owner_internal_id: z.string().uuid().optional(),
    owner_external_id: z.string().uuid().optional(),
    due_date: z.coerce.date().min(new Date(), 'Due date must be in the future'),
    priority: z.nativeEnum(CommitmentPriority).default(CommitmentPriority.MEDIUM),
    status: z.nativeEnum(CommitmentStatus).default(CommitmentStatus.PENDING),
    tracking_type: z.nativeEnum(TrackingType),
    completion_notes: z
      .string()
      .max(2000, 'Completion notes must be at most 2000 characters')
      .optional(),
    completed_at: z.coerce.date().optional(),
    ai_extracted: z.boolean().default(false),
    confidence_score: z.number().min(0).max(1).optional(),
  })
  .refine(
    (data) => {
      if (data.owner_type === OwnerType.INTERNAL) {
        return data.owner_internal_id && !data.owner_external_id
      } else {
        return data.owner_external_id && !data.owner_internal_id
      }
    },
    {
      message:
        'Exactly one of owner_internal_id or owner_external_id must be provided based on owner_type',
      path: ['owner_type'],
    },
  )
  .refine(
    (data) => {
      if (data.owner_type === OwnerType.EXTERNAL) {
        return data.tracking_type === TrackingType.MANUAL
      }
      return true
    },
    {
      message: 'External commitments must use manual tracking',
      path: ['tracking_type'],
    },
  )

// Risk schema
export const riskSchema = z.object({
  description: z
    .string()
    .min(10, 'Risk description must be at least 10 characters')
    .max(2000, 'Risk description must be at most 2000 characters'),
  severity: z.nativeEnum(RiskSeverity),
  likelihood: z.nativeEnum(RiskLikelihood),
  mitigation_strategy: z
    .string()
    .max(2000, 'Mitigation strategy must be at most 2000 characters')
    .optional(),
  owner_id: z.string().uuid().optional(),
  ai_extracted: z.boolean().default(false),
  confidence_score: z.number().min(0).max(1).optional(),
})

// Follow-up action schema
export const followUpActionSchema = z.object({
  description: z
    .string()
    .min(10, 'Follow-up action description must be at least 10 characters')
    .max(2000, 'Follow-up action description must be at most 2000 characters'),
  owner_id: z.string().uuid().optional(),
  due_date: z.coerce.date().optional(),
  ai_extracted: z.boolean().default(false),
  confidence_score: z.number().min(0).max(1).optional(),
})

// After-action record creation schema
export const afterActionCreateSchema = z.object({
  engagement_id: z.string().uuid('Invalid engagement ID'),
  dossier_id: z.string().uuid('Invalid dossier ID'),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  confidentiality_level: z.nativeEnum(ConfidentialityLevel).default(ConfidentialityLevel.INTERNAL),
  attendance_list: z.array(attendanceRecordSchema).default([]),
  decisions: z.array(decisionSchema).default([]),
  commitments: z.array(commitmentSchema).default([]),
  risks: z.array(riskSchema).default([]),
  follow_up_actions: z.array(followUpActionSchema).default([]),
})

// After-action record update schema (draft only)
export const afterActionUpdateSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  confidentiality_level: z.nativeEnum(ConfidentialityLevel).optional(),
  attendance_list: z.array(attendanceRecordSchema).optional(),
  decisions: z.array(decisionSchema).optional(),
  commitments: z.array(commitmentSchema).optional(),
  risks: z.array(riskSchema).optional(),
  follow_up_actions: z.array(followUpActionSchema).optional(),
  _version: z.number().int().positive('Version must be a positive integer'),
})

// External contact schema
export const externalContactSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  organization: z.string().max(200, 'Organization must be at most 200 characters').optional(),
  email_enabled: z.boolean().default(true),
  contact_notes: z.string().max(2000, 'Contact notes must be at most 2000 characters').optional(),
})

// Edit request schema
export const editRequestSchema = z.object({
  reason: z
    .string()
    .min(10, 'Edit reason must be at least 10 characters')
    .max(1000, 'Edit reason must be at most 1000 characters'),
})

// Edit approval schema
export const editApprovalSchema = z.object({
  approved: z.boolean(),
  feedback: z.string().max(1000, 'Feedback must be at most 1000 characters').optional(),
})

// Export types inferred from schemas
export type AfterActionCreateInput = z.infer<typeof afterActionCreateSchema>
export type AfterActionUpdateInput = z.infer<typeof afterActionUpdateSchema>
export type ExternalContactInput = z.infer<typeof externalContactSchema>
export type EditRequestInput = z.infer<typeof editRequestSchema>
export type EditApprovalInput = z.infer<typeof editApprovalSchema>
