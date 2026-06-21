/**
 * Shared on-prem vLLM chat-completions helper for Supabase Edge Functions.
 *
 * Phase 74 (EVAL-04, D3): country-intelligence generation is re-homed off
 * AnythingLLM onto the same on-prem OpenAI-compatible endpoint the copilot binds
 * to (vLLM in prod / Ollama in dev). Zero-egress invariant: this helper ONLY ever
 * reaches `VLLM_BASE_URL` (an on-prem host, e.g. `http://vllm:8000`) — never a
 * cloud LLM and never AnythingLLM.
 *
 * Mirrors `agent-runtime/src/llm-router.ts#getCopilotModel()` (env binding) and
 * `agent-runtime/src/mastra/tools/propose-brief.ts` (JSON-mode chat-completions
 * call), implemented as a raw Deno `fetch` because the `openai` npm client is not
 * available inside edge functions.
 */

interface GenerateStructuredJsonArgs {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  timeoutMs?: number
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
}

const DEFAULT_TEMPERATURE = 0.2
const DEFAULT_TIMEOUT_MS = 60000
const DEFAULT_MODEL = 'gemma-4-12b'
const DEFAULT_API_KEY = 'on-prem-no-key'

/**
 * Generate a structured JSON object from the on-prem vLLM model.
 *
 * Reads `VLLM_BASE_URL` (required — throws if unset), `VLLM_MODEL`
 * (default `gemma-4-12b`), and `VLLM_API_KEY` (default `on-prem-no-key`, a
 * placeholder the on-prem server ignores — NOT a cloud key). POSTs to
 * `${VLLM_BASE_URL}/v1/chat/completions` with `response_format: json_object`,
 * parses `choices[0].message.content` as JSON, and returns the parsed object.
 *
 * Throws (so the caller can release its refresh lock and surface an error) on a
 * missing endpoint, a non-ok response, an empty completion, or a parse failure.
 */
export async function generateStructuredJson(args: GenerateStructuredJsonArgs): Promise<unknown> {
  const { systemPrompt, userPrompt } = args
  const temperature = args.temperature ?? DEFAULT_TEMPERATURE
  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const baseUrl = Deno.env.get('VLLM_BASE_URL')
  if (!baseUrl) {
    throw new Error('VLLM_BASE_URL is not configured; on-prem generation endpoint is required')
  }
  const model = Deno.env.get('VLLM_MODEL') || DEFAULT_MODEL
  const apiKey = Deno.env.get('VLLM_API_KEY') || DEFAULT_API_KEY

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`On-prem model error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as ChatCompletionResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('On-prem model returned an empty completion')
  }

  try {
    return JSON.parse(content)
  } catch (_error) {
    throw new Error('On-prem model returned malformed JSON')
  }
}

interface GenerateTextArgs {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  timeoutMs?: number
}

/**
 * Generate a plain-text (prose) completion from the on-prem vLLM model.
 *
 * Same endpoint and env binding as `generateStructuredJson`
 * (`${VLLM_BASE_URL}/v1/chat/completions`, `VLLM_MODEL`, `VLLM_API_KEY`) but
 * WITHOUT `response_format` — it returns `choices[0].message.content` as a
 * trimmed string. Used for free-text surfaces (translation, writing assistant)
 * where the caller wants prose rather than a JSON object.
 *
 * Throws on a missing endpoint, a non-ok response, or an empty completion so the
 * caller can fall back to its non-AnythingLLM degradation path.
 */
export async function generateText(args: GenerateTextArgs): Promise<string> {
  const { systemPrompt, userPrompt } = args
  const temperature = args.temperature ?? DEFAULT_TEMPERATURE
  const timeoutMs = args.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const baseUrl = Deno.env.get('VLLM_BASE_URL')
  if (!baseUrl) {
    throw new Error('VLLM_BASE_URL is not configured; on-prem generation endpoint is required')
  }
  const model = Deno.env.get('VLLM_MODEL') || DEFAULT_MODEL
  const apiKey = Deno.env.get('VLLM_API_KEY') || DEFAULT_API_KEY

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`On-prem model error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as ChatCompletionResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('On-prem model returned an empty completion')
  }

  return content.trim()
}
