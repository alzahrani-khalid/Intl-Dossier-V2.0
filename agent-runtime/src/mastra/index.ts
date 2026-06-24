import { Mastra } from '@mastra/core/mastra'
import { registerApiRoute } from '@mastra/core/server'
import { stream } from 'hono/streaming'
import type { Context } from 'hono'
import { MastraAgent } from '@ag-ui/mastra'
import { EventEncoder } from '@ag-ui/encoder'
import type { RunAgentInput } from '@ag-ui/client'
import { MASTRA_RESOURCE_ID_KEY, RequestContext } from '@mastra/core/request-context'
import { copilotAgent, type CopilotRequestContext } from './agents/copilot.js'

// Bind port from env (4100 default — backend 4000, anythingllm 3001, langfuse 3000,
// phoenix 6006/4317). NEVER 5000 (macOS AirPlay). The AG-UI /chat SSE route + /health
// are served on this port by the bootstrap (src/index.ts) which mounts these apiRoutes.
const PORT = Number(process.env.PORT ?? 4100)

// The per-request DI bag values forwarded to the agent + tools. `authorization` and
// `language` ride the AG-UI request headers; the reserved resourceId is derived
// server-side from the verified JWT so thread ownership cannot be hijacked.
type RuntimeContextValues = CopilotRequestContext

/**
 * Decode the `sub` (user id) claim from a `Bearer <jwt>` header WITHOUT verifying the
 * signature. This is used only to key thread ownership (resourceId) — the actual
 * authorization is enforced by RLS in every tool via the anon-key + caller-JWT client
 * (createUserClient). Setting the reserved MASTRA_RESOURCE_ID_KEY here takes precedence
 * over any client-provided value, preventing a caller from reading another user's
 * threads (D-08). Returns '' when no usable sub is present.
 */
function deriveResourceId(authorization: string): string {
  if (!authorization) return ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  const parts = token.split('.')
  if (parts.length < 2) return ''
  try {
    const payloadSegment = parts[1] ?? ''
    const json = Buffer.from(payloadSegment, 'base64url').toString('utf8')
    const payload = JSON.parse(json) as { sub?: unknown }
    return typeof payload.sub === 'string' ? payload.sub : ''
  } catch {
    return ''
  }
}

/**
 * KEYSTONE delivery (#4465, AGENT-02). The caller JWT + language ride the AG-UI request
 * headers and are written onto a per-request RequestContext; tools read them via
 * `context.requestContext.get('authorization')` and build a caller-JWT Supabase client so
 * RLS enforces clearance. RequestContext, NOT runtimeContext (spike-PROVEN on the pinned
 * versions @mastra/core 1.43.0, @ag-ui/mastra 1.0.3). The reserved resourceId is derived
 * from the verified JWT, never trusted from the client (D-08 owner-only threads).
 */
function buildRequestContext(authorization: string, language: 'en' | 'ar'): RequestContext {
  const requestContext = new RequestContext<RuntimeContextValues>()
  requestContext.set('authorization', authorization)
  requestContext.set('language', language)
  const resourceId = deriveResourceId(authorization)
  if (resourceId) {
    ;(requestContext as unknown as RequestContext).set(MASTRA_RESOURCE_ID_KEY, resourceId)
  }
  // Returned as the default (untyped) RequestContext — the invariant generic would not
  // unify with `getLocalAgent`'s `requestContext: RequestContext` parameter otherwise.
  return requestContext as unknown as RequestContext
}

/**
 * The AG-UI `/chat` endpoint the conversational shell talks to (shell_decision =
 * assistant-ui, 72-01 SPIKE-FINDINGS). The frontend `@ag-ui/client` HttpAgent POSTs an
 * AG-UI `RunAgentInput` and consumes an SSE stream of AG-UI `BaseEvent`s — the RAW AG-UI
 * wire protocol, NOT CopilotKit's single-route protocol (registerCopilotKit serves the
 * latter, which rejects an AG-UI body with "Missing method field"). We bridge the local
 * Mastra agent to AG-UI via `MastraAgent.getLocalAgent` (forwarding the per-request
 * keystone RequestContext) and SSE-encode each emitted event with `@ag-ui/encoder`.
 */
function aguiChatRoute(): ReturnType<typeof registerApiRoute> {
  return registerApiRoute('/chat', {
    method: 'POST',
    handler: async (c) => {
      let input: RunAgentInput
      try {
        input = (await c.req.json()) as RunAgentInput
      } catch {
        return c.json({ error: 'invalid_request', message: 'Expected an AG-UI RunAgentInput body' }, 400)
      }

      const authorization = c.req.header('authorization') ?? ''
      const language = c.req.header('x-language') === 'ar' ? 'ar' : 'en'
      const resourceId = deriveResourceId(authorization)
      const requestContext = buildRequestContext(authorization, language)

      const agent = MastraAgent.getLocalAgent({
        mastra,
        agentId: 'copilot',
        resourceId: resourceId !== '' ? resourceId : 'copilot',
        requestContext,
      })

      const encoder = new EventEncoder({ accept: c.req.header('accept') })
      c.header('Content-Type', encoder.getContentType())
      c.header('Cache-Control', 'no-cache, no-transform')
      // Disable proxy buffering so SSE tokens reach the browser as they stream (nginx).
      c.header('X-Accel-Buffering', 'no')

      return stream(c as unknown as Context, async (s) => {
        await new Promise<void>((resolve) => {
          // Track the latest write so the stream is not closed before the final event
          // is flushed (the run emits hundreds of events for a thinking model).
          let pending: Promise<unknown> = Promise.resolve()
          const finish = (): void => {
            void pending.then(() => resolve()).catch(() => resolve())
          }
          const subscription = agent.run(input).subscribe({
            next: (event) => {
              pending = s.write(encoder.encodeSSE(event))
            },
            error: finish,
            complete: finish,
          })
          s.onAbort(() => {
            subscription.unsubscribe()
            resolve()
          })
        })
      })
    },
  })
}

/**
 * The Mastra config — holds the reads-only copilot agent and the served apiRoutes
 * (the AG-UI /chat SSE route + /health). `new Mastra(...)` only CONSTRUCTS this graph;
 * the bootstrap (src/index.ts) mounts `getServer().apiRoutes` on a Hono server and
 * listens on PORT. CORS origin is read from ALLOWED_ORIGINS (CSV) — NEVER '*'.
 */
export const mastra = new Mastra({
  agents: { copilot: copilotAgent },
  server: {
    port: PORT,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-language', 'accept'],
    },
    apiRoutes: [
      aguiChatRoute(),
      // Liveness probe for the container healthcheck (Dockerfile.prod :4100/health).
      registerApiRoute('/health', {
        method: 'GET',
        handler: (c) => c.json({ status: 'ok', service: 'agent-runtime' }),
      }),
    ],
  },
})
