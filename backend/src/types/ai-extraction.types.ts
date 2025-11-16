/**
 * AI Extraction - Type Definitions
 * Feature: 022-after-action-structured (User Story 2)
 *
 * TypeScript interfaces for AI-powered data extraction from meeting minutes.
 * Supports sync (<5s) and async (>5s) extraction workflows.
 */

import { z } from 'zod';
import {
  Decision,
  Commitment,
  Risk,
  FollowUpAction,
  OwnerType,
  CommitmentPriority,
  CommitmentStatus,
  TrackingType,
  RiskSeverity,
  RiskLikelihood,
} from './after-action.types';

/**
 * AI extraction job status
 */
export enum ExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Confidence score thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
} as const;

/**
 * Extraction request (sync or async)
 */
export interface ExtractionRequest {
  document_file: File | Blob;
  document_name: string;
  document_size: number;
  dossier_id?: string;
  engagement_id?: string;
  language?: 'en' | 'ar' | 'auto';
}

/**
 * Extracted entities with confidence scores
 */
export interface ExtractedDecision extends Omit<Decision, 'id' | 'after_action_id' | 'created_at'> {
  ai_extracted: true;
  confidence_score: number;
}

export interface ExtractedCommitment extends Omit<Commitment, 'id' | 'after_action_id' | 'dossier_id' | 'created_at' | 'updated_at'> {
  ai_extracted: true;
  confidence_score: number;
  suggested_owner_name?: string; // AI-suggested owner based on historical patterns
  suggested_owner_confidence?: number;
}

export interface ExtractedRisk extends Omit<Risk, 'id' | 'after_action_id' | 'created_at'> {
  ai_extracted: true;
  confidence_score: number;
}

export interface ExtractedFollowUpAction extends Omit<FollowUpAction, 'id' | 'after_action_id' | 'created_at'> {
  ai_extracted: true;
  confidence_score: number;
}

/**
 * Extraction response (sync)
 */
export interface ExtractionResponse {
  decisions: ExtractedDecision[];
  commitments: ExtractedCommitment[];
  risks: ExtractedRisk[];
  follow_up_actions: ExtractedFollowUpAction[];
  extraction_metadata: {
    processing_time_ms: number;
    document_pages?: number;
    language_detected?: string;
    total_entities_extracted: number;
    low_confidence_count: number; // Items below MEDIUM threshold (0.7)
    model_version?: string;
    extracted_at: string;
  };
}

/**
 * Async extraction job metadata
 */
export interface ExtractionJob {
  job_id: string;
  status: ExtractionStatus;
  document_name: string;
  document_size: number;
  dossier_id?: string;
  engagement_id?: string;
  estimated_completion_seconds?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  result?: ExtractionResponse;
}

/**
 * Async extraction job creation response
 */
export interface ExtractionJobCreated {
  job_id: string;
  status: ExtractionStatus;
  estimated_completion_seconds: number;
  polling_url: string;
}

/**
 * Historical pattern analysis for commitment owner suggestions
 */
export interface OwnerSuggestion {
  user_id: string;
  user_name: string;
  confidence: number;
  based_on_patterns: {
    similar_commitments_count: number;
    completion_rate: number;
    avg_days_to_complete: number;
  };
}

/**
 * AI extraction error types
 */
export enum ExtractionErrorCode {
  DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  DOCUMENT_CORRUPTED = 'DOCUMENT_CORRUPTED',
  EXTRACTION_TIMEOUT = 'EXTRACTION_TIMEOUT',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  INSUFFICIENT_CONTENT = 'INSUFFICIENT_CONTENT',
  LANGUAGE_NOT_SUPPORTED = 'LANGUAGE_NOT_SUPPORTED',
}

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Zod Validation Schemas for AI Extraction
 */

// Extraction request schema (sync)
export const extractionRequestSyncSchema = z.object({
  document_name: z.string().min(1).max(255),
  document_size: z.number().int().positive().max(500 * 1024, 'Document must be less than 500KB for sync extraction'),
  dossier_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  language: z.enum(['en', 'ar', 'auto']).default('auto'),
});

// Extraction request schema (async)
export const extractionRequestAsyncSchema = z.object({
  document_name: z.string().min(1).max(255),
  document_size: z.number().int().positive().max(100 * 1024 * 1024, 'Document must be less than 100MB'),
  dossier_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  language: z.enum(['en', 'ar', 'auto']).default('auto'),
});

// Extracted decision schema (defined directly since decisionSchema uses .refine())
export const extractedDecisionSchema = z.object({
  description: z.string().min(10).max(2000),
  rationale: z.string().max(2000).optional(),
  decision_maker: z.string().min(2).max(200),
  decided_at: z.coerce.date(),
  supporting_context: z.string().max(2000).optional(),
  ai_extracted: z.literal(true),
  confidence_score: z.number().min(0).max(1),
});

// Extracted commitment schema (defined directly since commitmentSchema uses .refine())
export const extractedCommitmentSchema = z.object({
  description: z.string().min(10).max(2000),
  owner_type: z.nativeEnum(OwnerType),
  owner_internal_id: z.string().uuid().optional(),
  owner_external_id: z.string().uuid().optional(),
  due_date: z.coerce.date(),
  priority: z.nativeEnum(CommitmentPriority).default(CommitmentPriority.MEDIUM),
  status: z.nativeEnum(CommitmentStatus).default(CommitmentStatus.PENDING),
  tracking_type: z.nativeEnum(TrackingType),
  completion_notes: z.string().max(2000).optional(),
  completed_at: z.coerce.date().optional(),
  ai_extracted: z.literal(true),
  confidence_score: z.number().min(0).max(1),
  suggested_owner_name: z.string().optional(),
  suggested_owner_confidence: z.number().min(0).max(1).optional(),
});

// Extracted risk schema (defined directly since riskSchema uses .refine())
export const extractedRiskSchema = z.object({
  description: z.string().min(10).max(2000),
  severity: z.nativeEnum(RiskSeverity),
  likelihood: z.nativeEnum(RiskLikelihood),
  mitigation_strategy: z.string().max(2000).optional(),
  owner_id: z.string().uuid().optional(),
  ai_extracted: z.literal(true),
  confidence_score: z.number().min(0).max(1),
});

// Extracted follow-up action schema (defined directly since followUpActionSchema uses .refine())
export const extractedFollowUpActionSchema = z.object({
  description: z.string().min(10).max(2000),
  owner_id: z.string().uuid().optional(),
  due_date: z.coerce.date().optional(),
  ai_extracted: z.literal(true),
  confidence_score: z.number().min(0).max(1),
});

// Extraction response schema
export const extractionResponseSchema = z.object({
  decisions: z.array(extractedDecisionSchema),
  commitments: z.array(extractedCommitmentSchema),
  risks: z.array(extractedRiskSchema),
  follow_up_actions: z.array(extractedFollowUpActionSchema),
  extraction_metadata: z.object({
    processing_time_ms: z.number().int().positive(),
    document_pages: z.number().int().positive().optional(),
    language_detected: z.string().optional(),
    total_entities_extracted: z.number().int().nonnegative(),
    low_confidence_count: z.number().int().nonnegative(),
    model_version: z.string().optional(),
    extracted_at: z.string().datetime(),
  }),
});

// Export types inferred from schemas
export type ExtractionRequestSyncInput = z.infer<typeof extractionRequestSyncSchema>;
export type ExtractionRequestAsyncInput = z.infer<typeof extractionRequestAsyncSchema>;
export type ExtractionResponseOutput = z.infer<typeof extractionResponseSchema>;

/**
 * Helper functions
 */

/**
 * Categorize confidence score
 */
export function categorizeConfidence(score: number): 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Filter entities by confidence threshold
 */
export function filterByConfidence<T extends { confidence_score: number }>(
  entities: T[],
  minConfidence: number = CONFIDENCE_THRESHOLDS.MEDIUM
): T[] {
  return entities.filter((entity) => entity.confidence_score >= minConfidence);
}

/**
 * Count low confidence items in extraction response
 */
export function countLowConfidenceItems(response: ExtractionResponse): number {
  const allEntities = [
    ...response.decisions,
    ...response.commitments,
    ...response.risks,
    ...response.follow_up_actions,
  ];
  return allEntities.filter((entity) => entity.confidence_score < CONFIDENCE_THRESHOLDS.MEDIUM).length;
}
