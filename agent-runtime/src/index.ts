/**
 * agent-runtime bootstrap (Plan 72-05; serving wired in quick task 260624-d09).
 *
 * Responsibilities:
 *  1. Initialize OpenTelemetry → the self-hosted Phoenix collector over OTLP gRPC
 *     (phoenix:4317), zero external egress (mirrors backend/src/ai/mastra-config.ts
 *     P68 REMED-05). Done FIRST so HTTP/agent spans are captured from boot.
 *  2. Construct the Mastra config (the AG-UI /chat SSE route + the reads-only copilot
 *     agent + the JWT keystone setContext live in ./mastra/index) AND serve its
 *     registered apiRoutes (/chat + /health) on PORT (4100).
 *
 * Serving model: `new Mastra({ server: { apiRoutes } })` only CONSTRUCTS the route graph
 * — it does NOT start an HTTP server, and the @mastra/hono server adapter (the package
 * that owns the internal `createHonoServer`) is not installed in this image. So we mount
 * `mastra.getServer().apiRoutes` — the SAME /chat (registerCopilotKit) + /health routes
 * `createHonoServer` would mount — onto a Hono app, forward the caller-JWT keystone via
 * the route's registered setContext, apply the ALLOWED_ORIGINS CORS, and serve it with
 * @hono/node-server. The self-hosted runtime requires NO Copilot Cloud key (air-gap,
 * GATE 3); CopilotKit's anonymous telemetry is disabled below to keep egress at zero.
 */
import { serve } from '@hono/node-server'
import { Hono, type Handler, type MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

// Air-gap (zero-egress): CopilotKit's runtime emits anonymous telemetry by default. Opt
// out BEFORE ./mastra/index (which builds the CopilotKit runtime) is imported below.
process.env.COPILOTKIT_TELEMETRY_DISABLED ??= 'true'

const PORT = Number(process.env.PORT ?? 4100)

// Hono env: route handlers read the Mastra instance from `c.get('mastra')`.
type AppEnv = { Variables: { mastra: unknown } }

// The subset of a Mastra apiRoute we consume. Mastra's own route types are internal; we
// read only path/method/handler/middleware to mount each route onto our Hono app.
interface MastraApiRoute {
  path: string
  method?: string
  handler?: Handler<AppEnv>
  createHandler?: (mastra: unknown) => Handler<AppEnv>
  middleware?: MiddlewareHandler<AppEnv>[]
}

function initTelemetry(): void {
  // Export traces to the self-hosted Phoenix collector over OTLP gRPC — zero external
  // egress. Guarded so a missing/unreachable collector never blocks startup.
  try {
    const traceExporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://phoenix:4317',
    })
    const sdk = new NodeSDK({
      serviceName: 'intl-dossier-agent-runtime',
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    })
    sdk.start()
    console.warn('OTel telemetry initialized -> Phoenix (OTLP gRPC)')
  } catch (error) {
    console.warn('OTel telemetry init failed; continuing without tracing', error)
  }
}

async function bootstrap(): Promise<void> {
  initTelemetry()

  // Construct + validate the Mastra config (agent graph, AG-UI /chat route, /health
  // apiRoute, keystone setContext, CORS). Importing here surfaces any config error at boot.
  const { mastra } = await import('./mastra/index.js')

  // Read the registered server config (port/cors/apiRoutes). Typed loosely on purpose —
  // Mastra's server-config types are internal; we depend only on this shape.
  const server = (await mastra.getServer()) as {
    cors?: { origin?: string | string[]; allowHeaders?: string[] }
    apiRoutes?: unknown[]
  }

  const app = new Hono<AppEnv>()

  // CORS from the Mastra server config (ALLOWED_ORIGINS — NEVER '*'; carried edge-fn lock).
  const corsOrigin = server.cors?.origin
  if (corsOrigin != null) {
    app.use(
      '*',
      cors({
        origin: corsOrigin,
        allowHeaders: server.cors?.allowHeaders ?? ['content-type', 'authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      }),
    )
  }

  // Mastra route handlers read the instance from context (`c.get('mastra')`).
  app.use('*', async (c, next) => {
    c.set('mastra', mastra)
    await next()
  })

  // Mount every registered apiRoute (/chat via registerCopilotKit + /health).
  const apiRoutes = (server.apiRoutes ?? []) as unknown as MastraApiRoute[]
  for (const route of apiRoutes) {
    const handler = route.handler ?? route.createHandler?.(mastra)
    if (handler == null) continue
    for (const mw of route.middleware ?? []) {
      app.use(route.path, mw)
    }
    const method = (route.method ?? 'ALL').toUpperCase()
    if (method === 'ALL') {
      app.all(route.path, handler)
    } else {
      app.on(method, route.path, handler)
    }
  }

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.warn(`agent-runtime serving Mastra routes (/chat + /health) on :${PORT}`)
  })
}

bootstrap().catch((error) => {
  console.error('agent-runtime failed to start', error)
  process.exit(1)
})
