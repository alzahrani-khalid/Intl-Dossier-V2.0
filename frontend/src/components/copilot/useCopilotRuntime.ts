/**
 * useCopilotRuntime — the AG-UI transport for the reads-only copilot drawer.
 *
 * shell_decision = assistant-ui (72-01 SPIKE-FINDINGS, user sign-off). The
 * `@assistant-ui/react-ag-ui` `useAgUiRuntime` adapter speaks the SAME AG-UI server
 * contract that agent-runtime's `registerCopilotKit({ path: '/chat' })` exposes
 * (agent-runtime/src/mastra/index.ts) — so the browser talks to the on-prem runtime
 * through the nginx `/api/copilot/` SSE proxy (authored in 72-02), which strips the
 * prefix so `runtimeUrl` `/api/copilot/chat` reaches `agent-runtime:4100/chat`.
 *
 * The caller JWT (Authorization: Bearer) + the UI language (x-language) ride the
 * AG-UI request headers; the runtime writes them onto the per-request RequestContext
 * and every tool builds a caller-JWT Supabase client so RLS enforces clearance
 * (the AGENT-02 keystone). NO service-role, NO Copilot Cloud key — fully air-gapped.
 *
 * A `fetch` override on the HttpAgent reads the LIVE session token at request time
 * (Supabase rotates access tokens), so a long-lived drawer never sends a stale token.
 */
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HttpAgent } from '@ag-ui/client'
import { useAgUiRuntime } from '@assistant-ui/react-ag-ui'
import type { AssistantRuntime } from '@assistant-ui/react'
import { supabase } from '@/store/authStore'

/** The nginx-proxied SSE endpoint → agent-runtime:4100 /chat (72-02 contract). */
const COPILOT_RUNTIME_URL = '/api/copilot/chat'

interface UseCopilotRuntimeResult {
  runtime: AssistantRuntime
}

/**
 * Build the assistant-ui runtime bound to the on-prem AG-UI /chat route under the
 * caller JWT + UI language. `language` is the resolved i18n language ('ar' | 'en').
 */
export function useCopilotRuntime(): UseCopilotRuntimeResult {
  const { i18n } = useTranslation()
  const language = i18n.language === 'ar' ? 'ar' : 'en'

  // Live language ref — the fetch override reads the CURRENT language at request time
  // (without rebuilding the agent, which would drop the in-flight thread).
  const languageRef = useRef(language)
  languageRef.current = language

  // One HttpAgent per mount. The per-request `fetch` override injects the live
  // Authorization + x-language headers so token rotation and language switches are
  // always reflected without rebuilding the agent.
  const agent = useMemo(() => {
    return new HttpAgent({
      url: COPILOT_RUNTIME_URL,
      // Seed header; the per-request fetch override re-sets it with the live language.
      headers: { 'x-language': languageRef.current },
      fetch: async (url: string, requestInit: RequestInit): Promise<Response> => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token
        const headers = new Headers(requestInit.headers)
        if (accessToken != null && accessToken.length > 0) {
          headers.set('authorization', `Bearer ${accessToken}`)
        }
        // Read the language at request time so an in-flight language switch applies.
        headers.set('x-language', languageRef.current)
        return fetch(url, { ...requestInit, headers })
      },
    })
    // The agent is intentionally stable across language changes — the live language is
    // resolved inside the fetch override via languageRef. Rebuilding it would drop the
    // in-flight thread.
  }, [])

  const runtime = useAgUiRuntime({ agent })

  return { runtime }
}
