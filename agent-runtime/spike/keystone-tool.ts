/**
 * THROWAWAY spike (Plan 72-01) — the JWT keystone gate (GATE 1, Mastra #4465).
 *
 * The single most important question the whole phase hinges on: does the caller
 * JWT, set in registerCopilotKit's setContext, actually reach tool.execute()'s
 * runtimeContext? If the AG-UI bridge drops it, every read tool falls back to
 * anon/no-auth and RLS denies everything (looks like a broken copilot) — or worse,
 * a dev "fixes" it with service-role and bypasses clearance entirely.
 *
 * This stub mirrors the production read_signals shape (RESEARCH Pattern 3) but does
 * NOT hit Supabase — it ASSERTS the header arrived. A non-empty authorization in
 * runtimeContext == GATE 1 PASS. An empty one == the #4465 failure mode.
 *
 * Production (Wave 5, 72-06) will build createUserClient(auth) from this same
 * runtimeContext.get('authorization') and call sb.rpc('read_signals', ...).
 */
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

/** Cross-run observation sink so the drive script can read what the tool saw. */
export interface KeystoneObservation {
  observed: boolean
  authorizationPresent: boolean
  authorizationPrefix: string
  languageObserved: string
  note: string
}

export const keystoneObservations: KeystoneObservation[] = []

export const readSignalsStub = createTool({
  id: 'read_signals',
  description:
    'Read intelligence signals the caller is cleared to see. Use this when the user asks about signals, alerts, or recent intelligence on a dossier.',
  inputSchema: z.object({
    dossierId: z.string().uuid().optional().describe('Optional dossier UUID to scope signals to'),
    status: z.string().optional().describe('Optional status filter'),
    limit: z.number().int().max(100).default(50).describe('Max signals to return'),
  }),
  outputSchema: z.object({
    signals: z.array(z.record(z.string(), z.unknown())),
    _gate1: z.object({
      authorizationPresent: z.boolean(),
      note: z.string(),
    }),
  }),
  execute: async (_input, context) => {
    // KEYSTONE ASSERTION — the caller JWT MUST be here before any RPC would run.
    // SPIKE FINDING (pinned @mastra/core 1.43.0 + @ag-ui/mastra 1.0.3): the DI bag
    // delivered to a tool's execute() is `context.requestContext` (a RequestContext),
    // NOT `runtimeContext`. Mastra renamed RuntimeContext → RequestContext; the older
    // `runtimeContext` name in the research/Mastra docs is pre-1.43. setContext's 2nd
    // arg is correspondingly `requestContext`. This is the literal GATE 1 delivery path.
    const rc = context?.requestContext
    const auth = (rc?.get('authorization') as string | undefined) ?? ''
    const language = (rc?.get('language') as string | undefined) ?? ''
    const authorizationPresent = auth.trim().length > 0

    const observation: KeystoneObservation = {
      observed: true,
      authorizationPresent,
      // Record ONLY a short prefix — never log a full token.
      authorizationPrefix: authorizationPresent ? auth.slice(0, 12) + '…' : '(empty)',
      languageObserved: language,
      note: authorizationPresent
        ? 'GATE 1 PASS — caller JWT reached tool.execute() via runtimeContext'
        : 'GATE 1 FAIL — runtimeContext.get("authorization") was EMPTY (the #4465 failure mode)',
    }
    keystoneObservations.push(observation)

    // In production this is where createUserClient(auth) + sb.rpc('read_signals') runs.
    // Indistinguishable-empty: no clearance/filtered/restricted token anywhere in the payload.
    return {
      signals: authorizationPresent
        ? [{ id: 'spike-signal-1', title: 'Spike signal (stub — no DB hit)' }]
        : [],
      _gate1: {
        authorizationPresent,
        note: observation.note,
      },
    }
  },
})
