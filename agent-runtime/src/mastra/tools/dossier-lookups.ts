import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import * as supa from './_supabase.js'
import { isUuidShape } from './_uuid.js'

// Re-export the keystone helper; every body calls `supa.createUserClient(...)` so the
// tests' `vi.mock('./_supabase.js')` intercepts the client build.
export const createUserClient = supa.createUserClient

// The 8 dossier types (CLAUDE.md Dossier-Centric Patterns).
const DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
] as const

/**
 * Resolve a get_dossier identifier to a dossier UUID. A well-formed UUID is returned as-is;
 * otherwise the value is treated as a name/title and matched (case-insensitive, partial) on
 * name_en/name_ar — best single active match. Returns null when nothing matches (the caller
 * then surfaces the neutral `{ dossier: null }`). The term is sanitized for the PostgREST
 * or-filter — its delimiters `,()*` are stripped — before interpolation, so a stray name
 * character cannot break the filter or inject extra conditions.
 */
async function resolveDossierIdentifier(
  sb: ReturnType<typeof supa.createUserClient>,
  raw: string,
): Promise<string | null> {
  const term = raw.trim()
  if (isUuidShape(term)) {
    return term
  }
  const safe = term.replace(/[,()*]/g, ' ').trim()
  if (!safe) {
    return null
  }
  const { data, error } = await sb
    .from('dossiers')
    .select('id')
    .eq('is_active', true)
    .or(`name_en.ilike.*${safe}*,name_ar.ilike.*${safe}*`)
    .limit(1)
  if (error || !data || data.length === 0) {
    return null
  }
  return (data[0] as { id?: string }).id ?? null
}

/**
 * get_dossier (D-07, AGENT-02) — one dossier the caller is cleared to see. Mirrors
 * chat-assistant.ts getDossier (L245-275) verbatim, but builds the client from the
 * RequestContext JWT instead of an authHeader arg. Indistinguishable-empty: any
 * error / above-clearance / missing-JWT returns `{ dossier: null }`.
 */
export const getDossierTool = createTool({
  id: 'get_dossier',
  description: 'Get detailed information about a specific dossier the caller is cleared to see.',
  inputSchema: z.object({
    dossierId: z
      .string()
      .describe('The dossier UUID, or its name/title (resolved to the best matching dossier)'),
  }),
  outputSchema: z.object({
    dossier: z.record(z.string(), z.unknown()).nullable(),
  }),
  execute: async (input, context) => {
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { dossier: null }
    }
    const args = input as { dossierId: string }
    try {
      const sb = supa.createUserClient(authorization)
      // Accept a name OR a UUID — resolve a non-UUID to an id before the by-id query so the
      // model passing a dossier name (live evidence) no longer hard-fails.
      const resolvedId = await resolveDossierIdentifier(sb, args.dossierId)
      if (!resolvedId) {
        return { dossier: null }
      }
      const { data, error } = await sb
        .from('dossiers')
        .select(
          `
          id, name_en, name_ar, type,
          description_en, description_ar,
          status, sensitivity_level, tags, metadata,
          created_at, updated_at
        `,
        )
        .eq('id', resolvedId)
        .eq('is_active', true)
        .single()
      if (error || !data) {
        return { dossier: null }
      }
      return { dossier: data as Record<string, unknown> }
    } catch {
      return { dossier: null }
    }
  },
})

/**
 * list_dossiers (D-07, AGENT-02/03) — dossiers the caller is cleared to see, optionally
 * by type. Mirrors chat-assistant.ts listDossiers (L352-384). Indistinguishable-empty:
 * any error / reduced-by-clearance returns `{ dossiers: [] }` (AGENT-03 — a
 * lower-clearance caller simply sees fewer rows, with no signal that more exist).
 */
export const listDossiersTool = createTool({
  id: 'list_dossiers',
  description:
    'List the dossiers the caller is cleared to see. Returns all of them in one call by default; pass the optional type filter only to narrow to a single dossier type.',
  inputSchema: z.object({
    // Loose string (NOT z.enum) so the model's natural "list everything" call — type:"all" — does
    // not fail validation and loop with no answer; execute() applies the filter only for a real type.
    type: z
      .string()
      .optional()
      .describe(
        'Optional dossier-type filter — one of: country, organization, forum, engagement, topic, working_group, person, elected_official. OMIT this field to list every dossier type; do not pass "all".',
      ),
    limit: z.number().int().min(1).max(100).default(20).describe('Max dossiers to return'),
  }),
  outputSchema: z.object({
    dossiers: z.array(z.record(z.string(), z.unknown())),
  }),
  execute: async (input, context) => {
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { dossiers: [] }
    }
    const args = input as { type?: string; limit?: number }
    try {
      const sb = supa.createUserClient(authorization)
      let query = sb
        .from('dossiers')
        .select('id, name_en, name_ar, type, status, description_en, description_ar')
        .eq('is_active', true)
        .order('name_en', { ascending: true })
        .limit(args.limit ?? 20)
      // Tolerate out-of-enum / natural-language type values (e.g. the model passing "all" or
      // "everything"): apply the filter ONLY for a real dossier type — anything else means all types.
      if (args.type && (DOSSIER_TYPES as readonly string[]).includes(args.type)) {
        query = query.eq('type', args.type)
      }
      const { data, error } = await query
      if (error) {
        return { dossiers: [] }
      }
      return { dossiers: (data as Array<Record<string, unknown>>) ?? [] }
    } catch {
      return { dossiers: [] }
    }
  },
})

/**
 * query_work_items (D-07, AGENT-02) — work items (commitments) the caller is cleared to
 * see. Mirrors chat-assistant.ts queryCommitments (L277-317), which reads the canonical
 * `aa_commitments` (legacy `commitments` is empty — P68 D-10 / MEMORY). Optional status
 * filter. Indistinguishable-empty: any error returns `{ workItems: [] }`.
 */
export const queryWorkItemsTool = createTool({
  id: 'query_work_items',
  description:
    'Query work items (commitments) the caller is cleared to see, optionally filtered by status and/or by dossier (pass dossierId to return only the work items linked to that dossier).',
  inputSchema: z.object({
    status: z
      .string()
      .optional()
      .describe(
        'Optional status filter. Stored values include: pending, in_progress, review, overdue, ' +
          'completed, cancelled. Pass "open" or "active" for all items not in a terminal ' +
          '(completed/cancelled) state. Omit to return everything.',
      ),
    dossierId: z
      .string()
      .optional()
      .describe(
        'Optional dossier UUID — return ONLY work items linked to that dossier (via the ' +
          'work_item_dossiers junction). Resolve the UUID first with get_dossier or list_dossiers. ' +
          'Use this for questions like "work items linked to / for <dossier>".',
      ),
    limit: z.number().int().min(1).max(100).default(20).describe('Max work items to return'),
  }),
  outputSchema: z.object({
    workItems: z.array(z.record(z.string(), z.unknown())),
  }),
  execute: async (input, context) => {
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { workItems: [] }
    }
    const args = input as { status?: string; limit?: number; dossierId?: string }
    try {
      const sb = supa.createUserClient(authorization)
      // Optional dossier scoping: aa_commitments has NO FK to dossiers, so resolve the linked
      // work-item ids from the work_item_dossiers junction first and filter with .in() (PostgREST
      // cannot embed without the FK — MEMORY). No links → genuinely nothing is linked to this
      // dossier; return empty rather than the unfiltered global list (which over-claims the linkage).
      let linkedIds: string[] | null = null
      if (args.dossierId && isUuidShape(args.dossierId.trim())) {
        const { data: links, error: linkErr } = await sb
          .from('work_item_dossiers')
          .select('work_item_id')
          .eq('dossier_id', args.dossierId.trim())
        if (linkErr) {
          return { workItems: [] }
        }
        linkedIds = (links ?? [])
          .map((l) => (l as { work_item_id?: unknown }).work_item_id)
          .filter((v): v is string => typeof v === 'string')
        if (linkedIds.length === 0) {
          return { workItems: [] }
        }
      }
      // P68 D-10: read the canonical aa_commitments (legacy `commitments` is empty).
      // Columns per chat-assistant.ts L290-296 — aa_commitments has no `type` column.
      let query = sb
        .from('aa_commitments')
        .select(
          `
          id, title, title_ar, status, priority,
          due_date, owner_user_id, is_deleted,
          created_at, updated_at
        `,
        )
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(args.limit ?? 20)
      if (linkedIds) {
        query = query.in('id', linkedIds)
      }
      if (args.status) {
        // "open"/"active" are natural-language asks (the system prompt literally says
        // "open commitments"), NOT stored status values — exact-matching them returns
        // nothing. Map the vague synonyms to "anything not in a terminal state"; a real
        // stored status still exact-matches. This keeps answers grounded regardless of how
        // the model phrases the filter (it previously masked this by over-reasoning the arg
        // to null; with thinking suppressed it passes "open" verbatim).
        const s = args.status.trim().toLowerCase()
        const ACTIVE_SYNONYMS = ['open', 'active', 'outstanding', 'ongoing']
        const TERMINAL = ['completed', 'cancelled', 'canceled', 'closed', 'done']
        if (ACTIVE_SYNONYMS.includes(s)) {
          query = query.not('status', 'in', `(${TERMINAL.join(',')})`)
        } else {
          query = query.eq('status', s)
        }
      }
      const { data, error } = await query
      if (error) {
        return { workItems: [] }
      }
      return { workItems: (data as Array<Record<string, unknown>>) ?? [] }
    } catch {
      return { workItems: [] }
    }
  },
})

export default getDossierTool
