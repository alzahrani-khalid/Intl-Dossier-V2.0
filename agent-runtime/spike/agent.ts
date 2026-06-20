/**
 * THROWAWAY spike (Plan 72-01) — the reads-only copilot agent (one tool).
 *
 * Model client points at LOCAL Ollama over the OpenAI-compatible /v1 (identical API
 * to vLLM per D-02). baseURL comes from env so the same code runs against vLLM in
 * prod. No API key to any cloud — air-gap by construction (GATE 3).
 */
import { createOpenAI } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { readSignalsStub } from './keystone-tool.js'

const OLLAMA_BASE_URL = process.env.SPIKE_OPENAI_BASE_URL ?? 'http://127.0.0.1:11434/v1'
// Tool-capable local model. qwen3:30b / gpt-oss:20b / llama3.2 all do tool-calling;
// avoid the vision-only qwen3-vl. Override via SPIKE_MODEL.
const MODEL = process.env.SPIKE_MODEL ?? 'qwen3:30b'

// The OpenAI-compatible provider; Ollama ignores the apiKey but the SDK wants one.
const local = createOpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: process.env.SPIKE_OPENAI_API_KEY ?? 'ollama-no-key',
})

const SYSTEM_PROMPT_EN = `You are a reads-only assistant for a diplomatic dossier system.
When the user asks about signals, alerts, or recent intelligence, you MUST call the read_signals tool.
Answer only from tool results. Be concise.`

const SYSTEM_PROMPT_AR = `أنت مساعد للقراءة فقط لنظام إدارة الملفات الدبلوماسية.
عندما يسأل المستخدم عن الإشارات أو التنبيهات أو الاستخبارات الحديثة، يجب عليك استدعاء أداة read_signals.
أجب فقط من نتائج الأدوات. كن موجزاً.`

export const copilotSpikeAgent = new Agent({
  name: 'copilot',
  instructions: ({ runtimeContext }) => {
    const lang = (runtimeContext?.get('language') as string | undefined) ?? 'en'
    return lang === 'ar' ? SYSTEM_PROMPT_AR : SYSTEM_PROMPT_EN
  },
  model: local(MODEL),
  tools: { read_signals: readSignalsStub },
})

export const spikeModelInfo = { OLLAMA_BASE_URL, MODEL }
