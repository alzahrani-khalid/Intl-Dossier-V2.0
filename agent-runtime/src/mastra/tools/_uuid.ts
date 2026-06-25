/**
 * Shared lenient UUID-shape check for the copilot tool roster.
 *
 * Real dossier / signal / entity ids in this system include non-RFC-4122 staging SEED ids
 * (e.g. b0000001-0000-0000-0000-000000000003 — its version and variant nibbles are 0) that
 * Zod's strict `.uuid()` REJECTS. The model legitimately takes these ids from lookup tools
 * (get_dossier, list_dossiers, hybrid_rag_search, read_signals), so a strict `.uuid()` arg
 * hard-fails ("Invalid UUID") on a correct id and breaks the flow.
 *
 * This shape check accepts ANY UUID-shaped hex (so the seed ids pass) while STILL rejecting
 * names, placeholders, and garbage — only the RFC-4122 version/variant strictness is dropped,
 * never the "must look like a UUID" guarantee. That keeps the T-73-02-02 narrow-Zod threat
 * control intact: a non-UUID-shaped value never reaches the DB as an id (the caller returns the
 * neutral empty / no-proposal shape instead).
 *
 * @module mastra/tools/_uuid
 */

/** RFC-4122-shaped (8-4-4-4-12 hex) without the version/variant nibble constraints. */
export const uuidShape = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True when `value` (trimmed) is UUID-shaped. Trim-tolerant so callers can pass raw args. */
export function isUuidShape(value: string): boolean {
  return uuidShape.test(value.trim())
}
