import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import { aiConfig, AIProvider, getPrivateProvider } from './config.js'

// LIFTED from backend/src/ai/llm-router.ts (Plan 72-05, D-01 — lift, do not rewrite).
//
// What is preserved VERBATIM: the Arabic-content detection (ARABIC_PATTERN,
// detectArabicContent, isArabicDominant), the request-hash helper, and the
// provider/model selection logic by data classification + Arabic dominance.
//
// What is EXCISED (keystone, D-10 / RESEARCH Anti-Patterns): the backend router's
// service-role machinery — getOrgPolicy / checkSpendCap / startRun / completeRun all
// call `supabaseAdmin` (service-role) which BYPASSES RLS. The agent-runtime is an
// air-gapped, reads-only, RLS-enforcing surface: NO service-role key ever enters it.
// Run-tracking / spend-cap / org-policy stay in the backend. The copilot's model
// binding is the on-prem OpenAI-compatible endpoint (vLLM/Ollama) — see getCopilotModel.

const ARABIC_PATTERN = /[؀-ۿݐ-ݿ]/g

export function detectArabicContent(text: string): number {
  if (!text || text.length === 0) return 0
  const arabicChars = (text.match(ARABIC_PATTERN) || []).length
  return arabicChars / text.length
}

export function isArabicDominant(text: string, threshold = aiConfig.routing.arabicThreshold): boolean {
  return detectArabicContent(text) >= threshold
}

/**
 * Select the provider + model for a copilot turn. Mirrors the backend router's
 * classification logic (secret/confidential force the private provider) but without
 * the org-policy RPC (which needed service-role). Defaults to the on-prem private
 * provider configured in config.ts (vllm/gemma-4-12b → ollama in dev).
 */
export function selectCopilotProvider(
  dataClassification: DataClassification = 'internal',
): { provider: AIProvider; model: string; endpoint?: string } {
  if (dataClassification === 'secret' || dataClassification === 'confidential') {
    const privateProvider = getPrivateProvider()
    if (!privateProvider) {
      throw new Error(`${dataClassification} data requires a private LLM but none is configured`)
    }
    return {
      provider: privateProvider.provider,
      model: privateProvider.defaultModel,
      endpoint: privateProvider.baseUrl,
    }
  }

  const defaultProvider = aiConfig.routing.defaultProvider
  const providerConfig = aiConfig.providers[defaultProvider]
  return {
    provider: defaultProvider,
    model: providerConfig.defaultModel,
    endpoint: providerConfig.baseUrl,
  }
}

export type DataClassification = 'public' | 'internal' | 'confidential' | 'secret'

let cachedProvider: OpenAIProvider | null = null
let cachedBaseUrl: string | null = null

/**
 * The model seam the copilot agent binds to. The on-prem endpoint (vLLM in prod /
 * Ollama in dev) is OpenAI-compatible, so the AI-SDK OpenAI provider is pointed at
 * its baseUrl. Air-gap: no cloud key — a placeholder apiKey satisfies the SDK while
 * the local server ignores it. Model-native tool-calling is enabled by the agent's
 * tool roster (no heuristic decideToolUsage).
 */
export function getCopilotModel(): LanguageModel {
  const { model, endpoint } = selectCopilotProvider('internal')
  const baseURL = endpoint ? `${endpoint.replace(/\/$/, '')}/v1` : 'http://localhost:8000/v1'

  if (!cachedProvider || cachedBaseUrl !== baseURL) {
    cachedProvider = createOpenAI({
      baseURL,
      // On-prem server ignores the key; required non-empty by the SDK. NOT a cloud key.
      apiKey: process.env.VLLM_API_KEY || process.env.OPENAI_API_KEY || 'on-prem-no-key',
    })
    cachedBaseUrl = baseURL
  }

  return cachedProvider(model)
}
