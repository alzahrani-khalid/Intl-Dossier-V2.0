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
  z.union([JsonPrimitiveSchema, z.array(JsonValueSchema), z.record(JsonValueSchema)]),
)

/**
 * Schema for JSON objects
 */
export const JsonObjectSchema = z.record(JsonValueSchema)

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
 */
export const DossierTypeSchema = z.enum([
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
])

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
export const TypeSpecificFieldsSchema = z.record(JsonValueSchema)

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
// Type Exports
// ============================================================================

export type JsonPrimitive = z.infer<typeof JsonPrimitiveSchema>
export type JsonValue = z.infer<typeof JsonValueSchema>
export type JsonObject = z.infer<typeof JsonObjectSchema>
export type ApiErrorDetails = z.infer<typeof ApiErrorDetailsSchema>
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
export type DossierType = z.infer<typeof DossierTypeSchema>
export type DossierStatus = z.infer<typeof DossierStatusSchema>
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
