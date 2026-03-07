/**
 * Zod Validation Schemas
 *
 * Type-safe validation schemas for external data coming from APIs,
 * user input, and other untrusted sources.
 */

import { z } from 'zod'

// ============================================================================
// Base JSON Schemas
// ============================================================================

/**
 * Schema for JSON-compatible primitive values
 */
export const JsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

/**
 * Schema for JSON-compatible values (recursive)
 */
export const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([JsonPrimitiveSchema, z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema)]),
)

/**
 * Schema for JSON objects
 */
export const JsonObjectSchema = z.record(z.string(), JsonValueSchema)

// ============================================================================
// API Error Response Schemas
// ============================================================================

/**
 * Schema for individual validation errors
 */
export const ValidationErrorSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
})

/**
 * Schema for API error details
 */
export const ApiErrorDetailsSchema = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
    field: z.string().optional(),
    errors: z.array(ValidationErrorSchema).optional(),
  })
  .passthrough()

/**
 * Schema for API error responses
 */
export const ApiErrorResponseSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  details: ApiErrorDetailsSchema.optional(),
  error: z.string().optional(),
})

// ============================================================================
// Dossier Schemas
// ============================================================================

/**
 * Schema for dossier types
 * Note: elected_official is now a person_subtype, not a separate dossier type
 */
export const DossierTypeSchema = z.enum([
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
])

/**
 * Schema for person subtypes
 */
export const PersonSubtypeSchema = z.enum(['standard', 'elected_official'])

/**
 * Schema for dossier status
 */
export const DossierStatusSchema = z.enum(['active', 'inactive', 'archived', 'deleted'])

/**
 * Schema for basic dossier reference
 */
export const DossierReferenceSchema = z.object({
  id: z.string().uuid(),
  type: DossierTypeSchema,
  name_en: z.string(),
  name_ar: z.string(),
  status: DossierStatusSchema.optional(),
})

// ============================================================================
// Task Schemas
// ============================================================================

/**
 * Schema for task priority
 */
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

/**
 * Schema for task workflow stage
 */
export const WorkflowStageSchema = z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled'])

/**
 * Schema for task status
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'review',
  'completed',
  'cancelled',
])

// ============================================================================
// Intake/Ticket Schemas
// ============================================================================

/**
 * Schema for request types
 */
export const RequestTypeSchema = z.enum(['engagement', 'position', 'mou_action', 'foresight'])

/**
 * Schema for ticket status
 */
export const TicketStatusSchema = z.enum([
  'draft',
  'submitted',
  'triaged',
  'assigned',
  'in_progress',
  'converted',
  'closed',
  'merged',
])

/**
 * Schema for sensitivity levels
 */
export const SensitivitySchema = z.enum(['public', 'internal', 'confidential', 'secret'])

/**
 * Schema for urgency levels
 */
export const UrgencySchema = z.enum(['low', 'medium', 'high', 'critical'])

/**
 * Schema for type-specific fields (dynamic fields)
 */
export const TypeSpecificFieldsSchema = z.record(z.string(), JsonValueSchema)

// ============================================================================
// Relationship Schemas
// ============================================================================

/**
 * Schema for relationship types
 */
export const RelationshipTypeSchema = z.enum([
  'member_of',
  'participates_in',
  'cooperates_with',
  'bilateral_relation',
  'partnership',
  'parent_of',
  'subsidiary_of',
  'related_to',
  'represents',
  'hosted_by',
  'sponsored_by',
  'involves',
  'discusses',
  'participant_in',
  'observer_of',
  'affiliate_of',
  'successor_of',
  'predecessor_of',
  // Legacy types
  'membership',
  'parent_child',
  'participation',
  'affiliation',
  'dependency',
  'collaboration',
])

/**
 * Schema for relationship status
 */
export const RelationshipStatusSchema = z.enum(['active', 'historical', 'terminated'])

// ============================================================================
// Calendar Event Schemas
// ============================================================================

/**
 * Schema for event types
 */
export const EventTypeSchema = z.enum(['session', 'meeting', 'deadline', 'ceremony'])

/**
 * Schema for event status
 */
export const EventStatusSchema = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
])

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely parse and validate API response data
 * Returns parsed data or throws validation error
 */
export function parseApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safely parse API response data with default on failure
 * Returns parsed data or default value
 */
export function safeParseApiResponse<T>(schema: z.ZodSchema<T>, data: unknown, defaultValue: T): T {
  const result = schema.safeParse(data)
  return result.success ? result.data : defaultValue
}

/**
 * Validate that data matches expected shape
 * Returns true if valid, false otherwise
 */
export function isValidData<T>(schema: z.ZodSchema<T>, data: unknown): data is T {
  return schema.safeParse(data).success
}

/**
 * Create a validated error details object from unknown response
 */
export function parseErrorDetails(
  data: unknown,
): z.infer<typeof ApiErrorDetailsSchema> | undefined {
  const result = ApiErrorDetailsSchema.safeParse(data)
  return result.success ? result.data : undefined
}

// ============================================================================
// Supabase Response Validation
// ============================================================================

/**
 * Schema for a single dossier from API
 */
export const DossierSchema = z.object({
  id: z.string().uuid(),
  type: DossierTypeSchema,
  name_en: z.string(),
  name_ar: z.string(),
  status: DossierStatusSchema,
  description_en: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  sensitivity_level: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  metadata: JsonObjectSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for task from API
 */
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  title_en: z.string().optional(),
  title_ar: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  description_en: z.string().nullable().optional(),
  description_ar: z.string().nullable().optional(),
  status: TaskStatusSchema,
  priority: PrioritySchema.nullable().optional(),
  deadline: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Schema for commitment from API
 */
export const CommitmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  title_en: z.string().optional(),
  title_ar: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: TaskStatusSchema,
  priority: PrioritySchema.nullable().optional(),
  deadline: z.string().nullable().optional(),
  responsible_user_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Validate Supabase response data with Zod schema
 * Logs validation errors in development and returns data or null
 */
export function validateSupabaseResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T | null {
  const result = schema.safeParse(data)

  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(
        `[Validation] ${context || 'Response'} validation failed:`,
        result.error.format(),
      )
    }
    return null
  }

  return result.data
}

/**
 * Validate array of Supabase response items
 * Returns only valid items, logs invalid ones in development
 */
export function validateSupabaseArray<T>(
  schema: z.ZodSchema<T>,
  data: unknown[],
  context?: string,
): T[] {
  return data
    .map((item, index) => {
      const result = schema.safeParse(item)
      if (!result.success) {
        if (import.meta.env.DEV) {
          console.warn(
            `[Validation] ${context || 'Array'} item ${index} validation failed:`,
            result.error.format(),
          )
        }
        return null
      }
      return result.data
    })
    .filter((item): item is T => item !== null)
}

/**
 * Strict validation that throws on failure
 * Use for critical data that must be valid
 */
export function validateStrictSupabaseResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errorMessage = `${context || 'Response'} validation failed: ${result.error.message}`
    console.error('[Validation Error]', errorMessage, result.error.format())
    throw new Error(errorMessage)
  }

  return result.data
}

// ============================================================================
// Type Exports
// ============================================================================

export type JsonPrimitive = z.infer<typeof JsonPrimitiveSchema>
export type JsonValue = z.infer<typeof JsonValueSchema>
export type JsonObject = z.infer<typeof JsonObjectSchema>
export type ApiErrorDetails = z.infer<typeof ApiErrorDetailsSchema>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type DossierType = z.infer<typeof DossierTypeSchema>
export type DossierStatus = z.infer<typeof DossierStatusSchema>
export type PersonSubtype = z.infer<typeof PersonSubtypeSchema>
export type Priority = z.infer<typeof PrioritySchema>
export type WorkflowStage = z.infer<typeof WorkflowStageSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type RequestType = z.infer<typeof RequestTypeSchema>
export type TicketStatus = z.infer<typeof TicketStatusSchema>
export type Sensitivity = z.infer<typeof SensitivitySchema>
export type Urgency = z.infer<typeof UrgencySchema>
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>
export type RelationshipStatus = z.infer<typeof RelationshipStatusSchema>
export type EventType = z.infer<typeof EventTypeSchema>
export type EventStatus = z.infer<typeof EventStatusSchema>
export type Dossier = z.infer<typeof DossierSchema>
export type Task = z.infer<typeof TaskSchema>
export type Commitment = z.infer<typeof CommitmentSchema>
