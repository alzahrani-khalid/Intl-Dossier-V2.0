/**
 * Zod Validation Schemas for Dynamic Country Intelligence API
 * Feature: 029-dynamic-country-intelligence
 *
 * Provides runtime type validation for all API requests and responses.
 * Schemas are shared between Edge Functions (backend) and TanStack Query hooks (frontend).
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ============================================================================
// Base Enums and Primitives
// ============================================================================

export const IntelligenceTypeEnum = z.enum([
  'economic',
  'political',
  'security',
  'bilateral',
  'general',
]);

export const EntityTypeEnum = z.enum([
  'country',
  'organization',
  'forum',
  'topic',
  'working_group',
]);

export const RefreshStatusEnum = z.enum([
  'fresh',
  'stale',
  'refreshing',
  'error',
  'expired',
]);

export const PriorityEnum = z.enum(['low', 'normal', 'high']);

export const LanguageEnum = z.enum(['en', 'ar']);

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * GET /intelligence-get query parameters
 */
export const GetIntelligenceQuerySchema = z.object({
  entity_id: z.string().uuid({
    message: 'entity_id must be a valid UUID',
  }),
  intelligence_type: IntelligenceTypeEnum.optional(),
  include_stale: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('true'),
  language: LanguageEnum.optional().default('en'),
});

export type GetIntelligenceQuery = z.infer<typeof GetIntelligenceQuerySchema>;

/**
 * POST /intelligence-refresh request body
 */
export const RefreshIntelligenceRequestSchema = z.object({
  entity_id: z.string().uuid({
    message: 'entity_id must be a valid UUID',
  }),
  intelligence_types: z.array(IntelligenceTypeEnum).optional(),
  force: z.boolean().optional().default(false),
  priority: PriorityEnum.optional().default('normal'),
});

export type RefreshIntelligenceRequest = z.infer<
  typeof RefreshIntelligenceRequestSchema
>;

/**
 * POST /intelligence-batch-update request body
 */
export const BatchUpdateRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  intelligence_types: z.array(IntelligenceTypeEnum).optional(),
  dry_run: z.boolean().optional().default(false),
});

export type BatchUpdateRequest = z.infer<typeof BatchUpdateRequestSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Data source metadata
 */
export const DataSourceMetadataSchema = z.object({
  source: z.string().min(1, 'Source identifier is required'),
  endpoint: z.string().optional(),
  retrieved_at: z.string().datetime(),
  confidence: z.number().int().min(0).max(100).optional(),
});

export type DataSourceMetadata = z.infer<typeof DataSourceMetadataSchema>;

/**
 * AnythingLLM response metadata
 */
export const AnythingLLMMetadataSchema = z.object({
  model: z.string().optional(),
  tokens_used: z.number().int().min(0).optional(),
  sources_cited: z.array(z.string()).optional(),
});

export type AnythingLLMMetadata = z.infer<typeof AnythingLLMMetadataSchema>;

/**
 * Intelligence Report (core data structure)
 */
export const IntelligenceReportSchema = z.object({
  id: z.string().uuid(),
  entity_id: z.string().uuid(),
  entity_type: EntityTypeEnum,
  intelligence_type: IntelligenceTypeEnum,
  title: z.string().min(1, 'Title is required'),
  title_ar: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  content_ar: z.string().optional(),
  confidence_score: z.number().int().min(0).max(100),
  refresh_status: RefreshStatusEnum,
  cache_expires_at: z.string().datetime(),
  cache_created_at: z.string().datetime(),
  last_refreshed_at: z.string().datetime(),
  is_expired: z.boolean(),
  time_until_expiry_hours: z.number().optional(),
  data_sources_metadata: z.array(DataSourceMetadataSchema),
  anythingllm_workspace_id: z.string().optional(),
  anythingllm_query: z.string().optional(),
  anythingllm_response_metadata: AnythingLLMMetadataSchema.optional(),
  version: z.number().int().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type IntelligenceReport = z.infer<typeof IntelligenceReportSchema>;

/**
 * GET /intelligence-get response
 */
export const GetIntelligenceResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(IntelligenceReportSchema),
  meta: z.object({
    total_count: z.number().int().min(0),
    fresh_count: z.number().int().min(0),
    stale_count: z.number().int().min(0),
  }),
});

export type GetIntelligenceResponse = z.infer<
  typeof GetIntelligenceResponseSchema
>;

/**
 * POST /intelligence-refresh response
 */
export const RefreshIntelligenceResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    refresh_id: z.string().uuid(),
    status: z.enum(['initiated', 'in_progress', 'completed', 'failed']),
    entity_id: z.string().uuid(),
    intelligence_types: z.array(IntelligenceTypeEnum),
    triggered_by: z.string().uuid(),
    triggered_at: z.string().datetime(),
    estimated_completion: z.string().datetime().optional(),
  }),
  message_en: z.string(),
  message_ar: z.string(),
});

export type RefreshIntelligenceResponse = z.infer<
  typeof RefreshIntelligenceResponseSchema
>;

/**
 * POST /intelligence-batch-update response
 */
export const BatchUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    batch_id: z.string().uuid(),
    processed_count: z.number().int().min(0),
    success_count: z.number().int().min(0),
    failure_count: z.number().int().min(0),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime(),
    duration_ms: z.number().int().min(0),
    failures: z
      .array(
        z.object({
          entity_id: z.string().uuid(),
          intelligence_type: IntelligenceTypeEnum,
          error_code: z.string(),
          error_message: z.string(),
        })
      )
      .optional(),
  }),
  message_en: z.string(),
  message_ar: z.string(),
});

export type BatchUpdateResponse = z.infer<typeof BatchUpdateResponseSchema>;

// ============================================================================
// Error Schemas
// ============================================================================

/**
 * Standard error response
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message_en: z.string(),
    message_ar: z.string(),
    details: z.record(z.unknown()).optional(),
    correlation_id: z.string().uuid().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Refresh conflict error (409)
 */
export const RefreshConflictErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.literal('REFRESH_IN_PROGRESS'),
    message_en: z.string(),
    message_ar: z.string(),
    in_progress_since: z.string().datetime().optional(),
  }),
});

export type RefreshConflictError = z.infer<typeof RefreshConflictErrorSchema>;

/**
 * Service unavailable error (503)
 */
export const ServiceUnavailableErrorSchema = ErrorResponseSchema.extend({
  error: z.object({
    code: z.literal('SERVICE_UNAVAILABLE'),
    message_en: z.string(),
    message_ar: z.string(),
    retry_after: z.number().int().min(0).optional(),
  }),
});

export type ServiceUnavailableError = z.infer<
  typeof ServiceUnavailableErrorSchema
>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates and parses query parameters from URL
 */
export function parseQueryParams<T extends z.ZodSchema>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.parse(params);
}

/**
 * Validates and parses JSON request body
 */
export async function parseRequestBody<T extends z.ZodSchema>(
  schema: T,
  request: Request
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message_en: string,
  message_ar: string,
  details?: Record<string, unknown>,
  status: number = 400
): Response {
  const errorBody: ErrorResponse = {
    success: false,
    error: {
      code,
      message_en,
      message_ar,
      details,
      correlation_id: crypto.randomUUID(),
    },
  };

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Validates intelligence type array
 */
export function validateIntelligenceTypes(
  types?: string[]
): z.infer<typeof IntelligenceTypeEnum>[] {
  if (!types || types.length === 0) {
    return ['economic', 'political', 'security', 'bilateral'];
  }

  return types.map((type) => IntelligenceTypeEnum.parse(type));
}

/**
 * Calculates time until expiry in hours
 */
export function calculateTimeUntilExpiry(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Determines if cache is expired
 */
export function isCacheExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// ============================================================================
// Type Exports for Frontend
// ============================================================================

export type IntelligenceType = z.infer<typeof IntelligenceTypeEnum>;
export type EntityType = z.infer<typeof EntityTypeEnum>;
export type RefreshStatus = z.infer<typeof RefreshStatusEnum>;
export type Priority = z.infer<typeof PriorityEnum>;
export type Language = z.infer<typeof LanguageEnum>;
