import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'
import { isUuidShape } from './_uuid.js'

// Re-export the keystone helper; the body calls `supa.createUserClient(...)`.
export const createUserClient = supa.createUserClient

// The neutral empty digest shape — returned identically for no-content, above-clearance,
// missing JWT, or error. No clearance/filtered/restricted key. The P70 RPC returns a
// JSONB digest keyed { dossier_id, period, counts, signals, ... }; the empty mirror keeps
// the same outer shape with zeroed counts and no items.
const EMPTY_DIGEST = {
  digest: {
    counts: { signals: 0 },
    signals: [] as unknown[],
  } as Record<string, unknown>,
} as const

/**
 * generate_digest_preview (D-07, AGENT-02) — wraps the P70 `generate_digest` SECURITY
 * INVOKER RPC under the caller's JWT. READS-ONLY PREVIEW: this tool exposes ONLY the
 * preview path. It NEVER calls `publish_digest` — that is the P73 write and is out of
 * this reads-only roster by construction (least-privilege, D-07). The string
 * 'publish_digest' does not appear in this file's call surface.
 *
 * Live signature (staging, 2026-06-18, INVOKER):
 *   generate_digest(p_dossier_id uuid, p_period text) -> JSONB
 *
 * The digest is dossier-scoped, so `dossierId` is required. The RPC enforces clearance
 * inline (only signals/activity the caller is cleared to see compose the digest).
 *
 * Indistinguishable-empty: above-clearance and genuinely-empty digests return the same
 * `{ sections: [] }`.
 */
export const generateDigestTool = createTool({
  id: 'generate_digest_preview',
  description:
    'Preview the digest of signals and activity the caller is cleared to see for one dossier over a period (daily, weekly, or monthly). Read-only preview — it never publishes or sends anything.',
  inputSchema: z.object({
    dossierId: z
      .string()
      .describe('The dossier UUID to preview the digest for (a UUID from a lookup, never a name)'),
    period: z
      .enum(['daily', 'weekly', 'monthly'])
      .default('daily')
      .describe('The digest period window'),
  }),
  outputSchema: z.object({
    digest: z.record(z.string(), z.unknown()),
  }),
  execute: async (input, context) => {
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { digest: { ...EMPTY_DIGEST.digest } }
    }

    const args = input as { dossierId: string; period?: 'daily' | 'weekly' | 'monthly' }

    // Lenient UUID-shape gate: accept any UUID-shaped id (incl. non-RFC-4122 seed ids the model
    // takes from a lookup), but a name/placeholder yields the neutral empty digest before any
    // client/RPC — so the model passing a dossier name no longer hard-fails with "Invalid UUID".
    const dossierId = args.dossierId.trim()
    if (!isUuidShape(dossierId)) {
      return { digest: { ...EMPTY_DIGEST.digest } }
    }

    try {
      const sb = supa.createUserClient(authorization)
      // PREVIEW path only — generate_digest computes the would-be digest content under
      // the caller JWT. publish_digest (the write) is intentionally never invoked.
      const { data, error } = await sb.rpc('generate_digest', {
        p_dossier_id: dossierId,
        p_period: args.period ?? 'daily',
      })
      // The RPC returns a JSONB object; coerce anything non-object to the neutral empty
      // digest so the output stays well-shaped and indistinguishable.
      if (error || data == null || typeof data !== 'object' || Array.isArray(data)) {
        return { digest: { ...EMPTY_DIGEST.digest } }
      }
      // Pass the JSONB digest through verbatim (keys: dossier_id, period, counts,
      // signals, ...) — no clearance metadata is added or present.
      return { digest: data as Record<string, unknown> }
    } catch {
      return { digest: { ...EMPTY_DIGEST.digest } }
    }
  },
})

export default generateDigestTool
