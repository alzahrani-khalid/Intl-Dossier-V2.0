import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { createUserClient, getAuthorization } from './_supabase.js'

export { createUserClient }

// Bundles the three direct dossier/work-item reads (mirrors chat-assistant.ts
// getDossier / listDossiers / queryWorkItems, repointed to aa_commitments). Each is
// a STUB (TODO: 72-06): a createUserClient(authorization).from(...).select(...) read
// returning indistinguishable-empty on error or above-clearance.

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

/** get_dossier — STUB (TODO: 72-06). Fetch one dossier the caller is cleared to see. */
export const getDossierTool = createTool({
  id: 'get_dossier',
  description: 'Get detailed information about a specific dossier the caller is cleared to see.',
  inputSchema: z.object({ dossierId: z.string().uuid() }),
  outputSchema: z.object({ dossier: z.unknown().nullable() }),
  execute: async (_input, context) => {
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { dossier: null }
    }
    // TODO: 72-06 — createUserClient(authorization).from('dossiers').select(...).single()
    return { dossier: null }
  },
})

/** list_dossiers — STUB (TODO: 72-06). List dossiers the caller is cleared to see. */
export const listDossiersTool = createTool({
  id: 'list_dossiers',
  description:
    'List dossiers the caller is cleared to see, optionally filtered by type (country, organization, topic, engagement, person, ...).',
  inputSchema: z.object({
    type: z.enum(DOSSIER_TYPES).optional(),
    limit: z.number().int().max(100).default(20),
  }),
  outputSchema: z.object({ dossiers: z.array(z.unknown()) }),
  execute: async (_input, context) => {
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { dossiers: [] }
    }
    // TODO: 72-06 — createUserClient(authorization).from('dossiers').select(...).eq('type', ...)
    return { dossiers: [] }
  },
})

/** query_work_items — STUB (TODO: 72-06). Query work items the caller is cleared to see. */
export const queryWorkItemsTool = createTool({
  id: 'query_work_items',
  description:
    'Query work items (tasks, commitments, intake) the caller is cleared to see, optionally filtered by status.',
  inputSchema: z.object({
    status: z.string().optional(),
    limit: z.number().int().max(100).default(20),
  }),
  outputSchema: z.object({ workItems: z.array(z.unknown()) }),
  execute: async (_input, context) => {
    const authorization = getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { workItems: [] }
    }
    // TODO: 72-06 — createUserClient(authorization).from('aa_commitments' | 'tasks' | ...).select(...)
    return { workItems: [] }
  },
})

export default getDossierTool
