/**
 * THROWAWAY spike (Plan 72-01) — Mastra server with the registerCopilotKit AG-UI
 * bridge. This is the literal structure RESEARCH Pattern 2 (L302-348) prescribes
 * for production agent-runtime/src/mastra/index.ts.
 *
 * GATE 1 delivery path under test: setContext forwards the caller JWT from the
 * AG-UI request header into runtimeContext, and the keystone tool asserts it
 * arrived at execute(). If the bridge drops it (Mastra #4465), the documented
 * fallback is a Mastra server middleware that sets the same context BEFORE the
 * agent run — also wired below and toggled by SPIKE_USE_MIDDLEWARE=1 so we can
 * record WHICH path delivers a non-empty authorization.
 *
 * Air-gap (GATE 3): CORS origin from env (never '*'); the model client points only
 * at 127.0.0.1 Ollama; no Copilot Cloud key anywhere.
 */
import { Mastra } from '@mastra/core/mastra'
import { registerCopilotKit } from '@ag-ui/mastra'
import { copilotSpikeAgent } from './agent.js'

type CopilotRuntimeContext = {
  authorization: string
  language: 'en' | 'ar'
}

const PORT = Number(process.env.SPIKE_PORT ?? 4199)
const USE_MIDDLEWARE = process.env.SPIKE_USE_MIDDLEWARE === '1'
const ALLOWED_ORIGINS = (process.env.SPIKE_ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export const mastra = new Mastra({
  agents: { copilot: copilotSpikeAgent },
  server: {
    port: PORT,
    cors: {
      origin: ALLOWED_ORIGINS, // never '*' — carried edge-fn CORS lock
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-language', 'x-copilotkit-runtime-client-gql-version'],
    },
    // GATE 1 fallback path (the #4465 workaround): a server middleware that runs
    // before the agent and stuffs the header into runtimeContext directly.
    middleware: USE_MIDDLEWARE
      ? [
          {
            path: '/copilotkit/*',
            handler: async (c: any, next: any) => {
              const rc = c.get('requestContext') ?? c.get('runtimeContext')
              if (rc) {
                rc.set('authorization', c.req.header('authorization') ?? '')
                rc.set('language', c.req.header('x-language') ?? 'en')
              }
              await next()
            },
          },
        ]
      : [],
    apiRoutes: [
      registerCopilotKit<CopilotRuntimeContext>({
        path: '/copilotkit',
        resourceId: 'copilot',
        setContext: (c, requestContext) => {
          // KEYSTONE delivery — caller JWT rides the AG-UI request header here.
          // 2nd arg is `requestContext` (RequestContext) on @ag-ui/mastra 1.0.3.
          requestContext.set('authorization', c.req.header('authorization') ?? '')
          requestContext.set('language', (c.req.header('x-language') as 'en' | 'ar') ?? 'en')
        },
      }),
    ],
  },
  // MANDATORY or `mastra build` 500-errors (RESEARCH Pattern 2).
  bundler: { externals: ['@copilotkit/runtime'] },
})

if (process.env.SPIKE_BOOT === '1') {
  // Mastra's server is started by `mastra dev`/build in production; for the spike we
  // only need the registered routes reachable. This file is imported by drive-jwt.ts
  // which exercises the agent + tool path directly (the keystone is in the agent run,
  // not the HTTP layer). See drive-jwt.ts for the empirical GATE 1 proof.
  // eslint-disable-next-line no-console
  console.log(`[spike] Mastra configured on port ${PORT} (middleware=${USE_MIDDLEWARE}). CORS origins:`, ALLOWED_ORIGINS)
}
