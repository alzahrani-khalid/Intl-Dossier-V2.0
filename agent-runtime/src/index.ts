/**
 * agent-runtime bootstrap (Plan 72-05, Task 2).
 *
 * Responsibilities:
 *  1. Initialize OpenTelemetry → the self-hosted Phoenix collector over OTLP gRPC
 *     (phoenix:4317), zero external egress (mirrors backend/src/ai/mastra-config.ts
 *     P68 REMED-05). Done FIRST so HTTP/agent spans are captured from boot.
 *  2. Instantiate + validate the Mastra config (the AG-UI /chat SSE route + the
 *     reads-only copilot agent + the JWT keystone setContext live in ./mastra/index).
 *  3. Expose a /health liveness endpoint on PORT (4100) for the container healthcheck.
 *
 * Serving model (spike-documented, RESEARCH Pattern 2): the AG-UI /chat SSE route is
 * served by the Mastra server runtime, which reads `server.port` from the same Mastra
 * config (`mastra dev` locally / `mastra start` in the 72-07 compose service) and also
 * serves the /health apiRoute registered there. This bootstrap owns OTel init + an
 * always-on /health responder so `node dist/index.js` is healthcheckable on its own
 * and the Mastra route graph is constructed (and its config errors surface) at boot.
 * The self-hosted runtime requires NO Copilot Cloud key (air-gap, GATE 3).
 */
import express from 'express'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const PORT = Number(process.env.PORT ?? 4100)

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

  // Construct + validate the Mastra config (agent graph, AG-UI route, keystone
  // setContext). Importing here surfaces any config error at boot.
  await import('./mastra/index.js')

  const app = express()
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'agent-runtime' })
  })

  app.listen(PORT, () => {
    console.warn(`agent-runtime bootstrap listening on :${PORT} (/health)`)
  })
}

bootstrap().catch((error) => {
  console.error('agent-runtime failed to start', error)
  process.exit(1)
})
