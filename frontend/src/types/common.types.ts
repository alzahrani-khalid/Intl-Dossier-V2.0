/**
 * Common Type Definitions
 *
 * Type-safe alternatives to 'any' types for the codebase.
 * These types provide better type safety while maintaining flexibility
 * for dynamic data structures.
 */

/**
 * JSON-compatible value types
 * Use instead of `any` for values that must be JSON-serializable
 */
export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonPrimitive | JsonArray | JsonObject

/**
 * API Error Details
 * Use instead of `any` for error details in API error classes
 */
export interface ApiErrorDetails {
  code?: string
  message?: string
  field?: string
  errors?: Array<{
    field?: string
    message: string
    code?: string
  }>
  [key: string]: JsonValue | undefined
}

/**
 * Dynamic form fields / type-specific fields
 * Use instead of `Record<string, any>` for form fields that vary by type
 */
export type DynamicFields = Record<string, JsonValue>

/**
 * Metadata object type
 * Use instead of `Record<string, any>` for metadata fields
 */
export type Metadata = Record<string, JsonValue>

/**
 * Audit log changes
 * Use instead of `Record<string, any>` for tracking field changes
 */
export interface AuditChange {
  field: string
  old_value: JsonValue
  new_value: JsonValue
}
export type AuditChanges = Record<string, { old: JsonValue; new: JsonValue }>

/**
 * Generic callback payload for realtime subscriptions
 * Use instead of `any` in callback signatures
 */
export interface RealtimePayload<T = JsonObject> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T | null
  errors: string[] | null
}

/**
 * Presence data for collaborative features
 * Use instead of `any` for presence tracking
 */
export interface PresenceData {
  user_id: string
  online_at?: string
  [key: string]: JsonValue | undefined
}

/**
 * Report parameters
 * Use instead of `Record<string, any>` for report configuration
 */
export type ReportParameters = Record<string, JsonValue>

/**
 * Navigation state
 * Use instead of `Record<string, any>` for URL query parameters
 */
export type NavigationState = Record<
  string,
  string | string[] | number | boolean | null | undefined
>

/**
 * Generic filter state
 * Use for typed filter objects
 */
export type FilterState<T extends string = string> = Record<T, JsonValue>

/**
 * Database row with dynamic fields
 * Use for rows that may have additional unknown columns
 */
export type DatabaseRow<T extends object = object> = T & Record<string, JsonValue>

/**
 * Type guard to check if a value is a JsonObject
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Type guard to check if a value is a JsonArray
 */
export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value)
}

/**
 * Type guard to check if a value is a JsonPrimitive
 */
export function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

/**
 * Type guard to check if a value is a valid JsonValue
 */
export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonPrimitive(value) || isJsonArray(value) || isJsonObject(value)
}

/**
 * Safe type assertion for unknown data
 * Returns the value as JsonValue if valid, undefined otherwise
 */
export function toJsonValue(value: unknown): JsonValue | undefined {
  if (isJsonValue(value)) {
    return value
  }
  return undefined
}

/**
 * Conflict field comparison
 * Use instead of `{ field: string; local: any; server: any }`
 */
export interface ConflictField {
  field: string
  local: JsonValue
  server: JsonValue
}

/**
 * Type-specific field schemas
 * Map of request type to its allowed field names and types
 */
export interface EngagementSpecificFields {
  partnerName?: string
  collaborationType?: 'technical' | 'data_sharing' | 'capacity_building' | 'other'
  expectedDuration?: string
}

export interface PositionSpecificFields {
  positionTitle?: string
  department?: string
  requiredSkills?: string
}

export interface MouActionSpecificFields {
  mouReference?: string
  actionType?: 'review' | 'amendment' | 'renewal' | 'termination'
  deadline?: string
}

export interface ForesightSpecificFields {
  topic?: string
  timeHorizon?: 'short' | 'medium' | 'long'
  stakeholders?: string
}

export type TypeSpecificFieldsMap = {
  engagement: EngagementSpecificFields
  position: PositionSpecificFields
  mou_action: MouActionSpecificFields
  foresight: ForesightSpecificFields
}
