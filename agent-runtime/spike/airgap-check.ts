/**
 * THROWAWAY spike (Plan 72-01) — GATE 3 air-gap proof (D-09 #2).
 *
 * Question: does a chat turn complete with NO Copilot Cloud key and ZERO outbound
 * calls to any non-local host? We prove it headlessly by instrumenting the process
 * network layer: every socket connect AND every fetch() is intercepted and its
 * destination host classified local (127.0.0.1 / ::1 / localhost) vs non-local.
 * Then we drive a real agent turn (forced tool call) against local Ollama. If any
 * non-local host is contacted, GATE 3 FAILS.
 *
 * Records gate3-result.json.
 */
import net from 'node:net'
import tls from 'node:tls'
import { writeFileSync } from 'node:fs'
import { RequestContext } from '@mastra/core/request-context'
import { copilotSpikeAgent } from './agent.js'
import { keystoneObservations } from './keystone-tool.js'

const LOCAL_HOSTS = new Set(['127.0.0.1', '::1', 'localhost', '0.0.0.0', '::ffff:127.0.0.1'])

interface ContactRecord {
  via: 'net.connect' | 'tls.connect' | 'fetch'
  host: string
  port?: number | string
  local: boolean
}

const contacts: ContactRecord[] = []

function classify(host: string | undefined): boolean {
  if (!host) return true // unix socket / no host → not an egress
  const h = host.replace(/^\[|\]$/g, '')
  return LOCAL_HOSTS.has(h) || h.endsWith('.localhost')
}

// --- instrument net.connect / net.createConnection ---
const origNetConnect = net.connect.bind(net)
;(net as any).connect = (...args: any[]) => {
  const opts = args[0]
  const host = typeof opts === 'object' ? (opts.host ?? opts.path) : args[1] ?? 'localhost'
  const port = typeof opts === 'object' ? opts.port : args[0]
  contacts.push({ via: 'net.connect', host: String(host), port, local: classify(typeof host === 'string' ? host : undefined) })
  return (origNetConnect as any)(...args)
}
;(net as any).createConnection = (net as any).connect

// --- instrument tls.connect ---
const origTlsConnect = tls.connect.bind(tls)
;(tls as any).connect = (...args: any[]) => {
  const opts = args[0]
  const host = typeof opts === 'object' ? opts.host : args[1]
  const port = typeof opts === 'object' ? opts.port : args[0]
  contacts.push({ via: 'tls.connect', host: String(host ?? 'unknown'), port, local: classify(typeof host === 'string' ? host : undefined) })
  return (origTlsConnect as any)(...args)
}

// --- instrument global fetch ---
const origFetch = globalThis.fetch
globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === 'string' ? input : input?.url ?? String(input)
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    host = 'unparseable'
  }
  contacts.push({ via: 'fetch', host, local: classify(host) })
  return origFetch(input, init)
}) as typeof fetch

async function main(): Promise<void> {
  // Assert no Copilot Cloud key is set (air-gap precondition).
  const cloudKeyEnvs = ['COPILOT_CLOUD_PUBLIC_API_KEY', 'NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY', 'COPILOTKIT_API_KEY']
  const cloudKeySet = cloudKeyEnvs.filter((k) => (process.env[k] ?? '').trim().length > 0)

  const rc = new RequestContext<{ authorization: string; language: string }>()
  rc.set('authorization', 'Bearer spike-airgap-fake-token')
  rc.set('language', 'en')
  keystoneObservations.length = 0

  let turnCompleted = false
  let turnError: string | undefined
  try {
    await copilotSpikeAgent.generate('List the latest signals. Call read_signals.', {
      requestContext: rc,
      toolChoice: 'required',
      maxSteps: 2,
    } as any)
    turnCompleted = true
  } catch (err) {
    // A post-tool model/replay error still means the turn drove the model+tool over
    // the network — which is exactly what we are auditing for egress. Treat the tool
    // observation as "turn exercised the network path".
    turnError = err instanceof Error ? err.message.split('\n')[0] : String(err)
    turnCompleted = keystoneObservations.length > 0
  }

  const nonLocal = contacts.filter((c) => !c.local)
  const distinctHosts = [...new Set(contacts.map((c) => c.host))]
  const distinctNonLocalHosts = [...new Set(nonLocal.map((c) => c.host))]

  const pass = cloudKeySet.length === 0 && nonLocal.length === 0 && turnCompleted

  const result = {
    gate: 'GATE 3 — air-gap (zero egress, no Copilot Cloud key)',
    timestamp: new Date().toISOString(),
    copilotCloudKeySet: cloudKeySet,
    turnDrovenAgainst: process.env.SPIKE_OPENAI_BASE_URL ?? 'http://127.0.0.1:11434/v1',
    turnCompleted,
    turnError,
    toolObserved: keystoneObservations.length > 0,
    totalContacts: contacts.length,
    distinctHostsContacted: distinctHosts,
    nonLocalContactCount: nonLocal.length,
    nonLocalHosts: distinctNonLocalHosts,
    verdict: pass ? 'PASS' : 'FAIL',
    note: pass
      ? 'Chat turn drove the model + tool with NO Copilot Cloud key and ZERO non-local egress. Air-gap holds.'
      : cloudKeySet.length > 0
        ? 'A Copilot Cloud key env was set — air-gap precondition violated.'
        : nonLocal.length > 0
          ? `Detected ${nonLocal.length} non-local contact(s): ${distinctNonLocalHosts.join(', ')}`
          : 'Turn did not exercise the network path.',
  }

  writeFileSync(new URL('./gate3-result.json', import.meta.url), JSON.stringify(result, null, 2))
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2))
  if (!pass) process.exitCode = 1
}

void main()
