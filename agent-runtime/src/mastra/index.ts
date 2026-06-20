import { Mastra } from '@mastra/core/mastra'
import { registerApiRoute } from '@mastra/core/server'
import { registerCopilotKit } from '@ag-ui/mastra/copilotkit'
import {
  MASTRA_RESOURCE_ID_KEY,
  type RequestContext,
} from '@mastra/core/request-context'
import { copilotAgent, type CopilotRequestContext } from './agents/copilot.js'

// Bind port from env (4100 default — backend 4000, anythingllm 3001, langfuse 3000,
// phoenix 6006/4317). NEVER 5000 (macOS AirPlay). The Mastra runtime serves the
// AG-UI /chat SSE route + /health on this port.
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
 * KEYSTONE delivery (#4465, AGENT-02). The caller JWT + language ride the AG-UI
 * request headers and are written onto the RequestContext here; tools read them via
 * `context.requestContext.get('authorization')`. This is the spike-PROVEN path on the
 * pinned versions (@mastra/core 1.43.0, @ag-ui/mastra 1.0.3) — RequestContext, NOT
 * runtimeContext. GATE 1 passed with NO server-middleware workaround needed.
 */
function setContext(
  c: { req: { header: (name: string) => string | undefined } },
  requestContext: RequestContext<RuntimeContextValues>,
): void {
  const authorization = c.req.header('authorization') ?? ''
  const language = (c.req.header('x-language') as 'en' | 'ar') ?? 'en'
  requestContext.set('authorization', authorization)
  requestContext.set('language', language === 'ar' ? 'ar' : 'en')

  // Owner-only persistent threads (D-08): the resourceId is derived from the verified
  // JWT, never trusted from the client. The reserved key wins over client values. It
  // lives outside the typed CopilotRequestContext value map (it is a Mastra-reserved
  // key), so set it on the untyped view.
  const resourceId = deriveResourceId(authorization)
  if (resourceId) {
    ;(requestContext as RequestContext).set(MASTRA_RESOURCE_ID_KEY, resourceId)
  }
}

/**
 * The Mastra server — terminates AG-UI over SSE on the bootstrap port (4100).
 *
 * - registerCopilotKit exposes the SSE /chat route the conversational shell talks to.
 *   shell_decision = assistant-ui (72-01 SPIKE-FINDINGS, user sign-off): the
 *   @assistant-ui/react-ag-ui client speaks this same AG-UI server contract, so the
 *   server side is identical to the CopilotKit path — only the frontend message /
 *   citation rendering layer (Plan 72-08) differs. The CopilotKit/AG-UI runtime +
 *   the requestContext JWT keystone STAY either way (D-09 preserved fallback).
 * - CORS origin is read from ALLOWED_ORIGINS (CSV) — NEVER '*' (carried edge-fn lock).
 * - bundler.externals MUST include '@copilotkit/runtime' or `mastra build` 500-errors.
 */
export const mastra = new Mastra({
  agents: { copilot: copilotAgent },
  server: {
    port: PORT,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [],
      allowMethods: ['*'],
      allowHeaders: ['content-type', 'authorization', 'x-copilotkit-runtime-client-gql-version'],
    },
    apiRoutes: [
      registerCopilotKit<RuntimeContextValues>({
        path: '/chat',
        resourceId: 'copilot',
        setContext,
      }),
      // Liveness probe for the container healthcheck (Dockerfile.prod :4100/health).
      registerApiRoute('/health', {
        method: 'GET',
        handler: (c) => c.json({ status: 'ok', service: 'agent-runtime' }),
      }),
    ],
  },
  bundler: { externals: ['@copilotkit/runtime'] },
})
