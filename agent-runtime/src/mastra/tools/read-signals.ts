import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'
import { isUuidShape } from './_uuid.js'

// Re-export the keystone helper for callers that import it from this tool module.
// The execute body below calls `supa.createUserClient(...)` (a live module-namespace
// read) so a `vi.spyOn(supaModule, 'createUserClient')` in the tests intercepts it.
export const createUserClient = supa.createUserClient

/**
 * read_signals (D-07, AGENT-02) — wraps the P69 `read_signals` SECURITY INVOKER RPC
 * under the caller's JWT. The RPC enforces clearance inline (sensitivity_level <=
 * profiles.clearance_level via the caller identity), so this tool adds NO clearance
 * logic of its own — RLS/inline-clearance is the floor.
 *
 * Live signature (staging zkrcjzdemdmwhearhfgg, 2026-06-18, INVOKER):
 *   read_signals(p_dossier_id uuid, p_status text, p_since timestamptz, p_limit int) -> TABLE
 *
 * Indistinguishable-empty: on no-data, above-clearance, missing JWT, or RPC error the
 * tool returns the SAME `{ signals: [] }` — no clearance/filtered/restricted field
 * anywhere (the returned rows carry `sensitivity_level`, which is the clearance scale
 * VALUE, not a redaction-label substring).
 */
export const readSignalsTool = createTool({
  id: 'read_signals',
  description:
    'Read intelligence signals the caller is cleared to see, optionally scoped to a dossier, status, or time window. Use this when the user asks about signals, alerts, or recent intelligence.',
  inputSchema: z.object({
    dossierId: z
      .string()
      .optional()
      .describe('Optional dossier UUID to scope signals to (a UUID from a lookup; a non-UUID is ignored)'),
    status: z
      .string()
      .optional()
      .describe('Optional status filter (e.g. new, acknowledged, dismissed, escalated)'),
    since: z
      .string()
      .optional()
      .describe('Optional ISO-8601 timestamp; only signals at or after this time'),
    limit: z.number().int().min(1).max(100).default(50).describe('Max signals to return'),
  }),
  outputSchema: z.object({
    signals: z.array(z.record(z.string(), z.unknown())),
  }),
  execute: async (input, context) => {
    // KEYSTONE (#4465 gate): build the client from the caller JWT on the RequestContext,
    // NEVER service-role. An empty header means the AG-UI bridge dropped the JWT — surface
    // indistinguishable-empty rather than falling back to an unscoped client.
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { signals: [] }
    }

    const args = input as {
      dossierId?: string
      status?: string
      since?: string
      limit?: number
    }

    // Optional dossier filter: only scope by it when it is UUID-shaped (incl. non-RFC-4122 seed
    // ids). A non-UUID value (e.g. a name) is IGNORED — the read degrades to unscoped rather than
    // hard-failing on "Invalid UUID"; the RPC's inline clearance still gates every returned row.
    const dossierId =
      typeof args.dossierId === 'string' && isUuidShape(args.dossierId) ? args.dossierId.trim() : null

    try {
      const sb = supa.createUserClient(authorization)
      const { data, error } = await sb.rpc('read_signals', {
        p_dossier_id: dossierId,
        p_status: args.status ?? null,
        p_since: args.since ?? null,
        p_limit: args.limit ?? 50,
      })
      if (error) {
        // Indistinguishable-empty: a clearance denial and a genuine error look identical.
        return { signals: [] }
      }
      return { signals: (data as Array<Record<string, unknown>>) ?? [] }
    } catch {
      return { signals: [] }
    }
  },
})

export default readSignalsTool
