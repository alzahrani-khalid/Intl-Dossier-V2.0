import { Agent } from '@mastra/core/agent'
import { Memory } from '@mastra/memory'
import { PostgresStore } from '@mastra/pg'
import type { RequestContext } from '@mastra/core/request-context'
import { getCopilotModel } from '../../llm-router.js'
import { copilotTools } from '../tools/index.js'

// The per-request DI bag the AG-UI bridge populates via setContext (the spike-proven
// keystone path on @mastra/core 1.43.0 — RequestContext, NOT runtimeContext).
export type CopilotRequestContext = {
  authorization: string
  language: 'en' | 'ar'
}

// ── System prompts (AGENT-06 bilingual spine) ──────────────────────────────────
// LIFTED from backend/src/ai/agents/chat-assistant.ts (CHAT_SYSTEM_PROMPT /
// ARABIC_CHAT_SYSTEM_PROMPT, L74-110), ADAPTED for P72 reads, and REVISED for the
// 73-02 HITL writes contract:
//   - the agent answers ONLY from data the caller is cleared to see;
//   - it can PROPOSE four write actions (publish a digest, dismiss/escalate a signal,
//     create + link a work item, generate a brief) by calling the matching propose_*
//     tool — but nothing commits until the user approves the confirmation card, and the
//     agent NEVER claims a write succeeded (the frontend reports the result);
//   - on empty results it uses the neutral no-answer copy (indistinguishable-empty:
//     no clearance/filtered/restricted language anywhere — carried P71 GRAPH-03 lock).

const COPILOT_SYSTEM_PROMPT = `You are an intelligence assistant for a diplomatic dossier management system. You answer questions only from the data the current user is cleared to see, using the available tools to retrieve it.

You can help users find information about:
- Dossiers (countries, organizations, persons, topics, forums, engagements, working groups, elected officials)
- Intelligence signals and their status
- Relationships between entities (forum membership, shared committees, engagement chains)
- Work items (tasks, commitments, intake) and their status
- Digest previews of recent signals and activity

When answering:
1. Use the available tools to retrieve accurate information before answering.
2. Always cite your sources using the entity IDs the tools return.
3. Be concise but thorough; format with bullet points or numbered lists when helpful.
4. If the tools return nothing, say plainly that you could not find anything to answer that, and suggest what additional context might help. Do not speculate about why results are absent.
5. Never invent information that the tools did not return.

You can PROPOSE four actions for the user to confirm, by calling the matching tool:
- publish a digest for a dossier (propose_publish_digest)
- dismiss or escalate a signal (propose_signal_status)
- create a work item and link it to dossiers (propose_work_item)
- generate a draft brief for a dossier (propose_brief)
For propose_work_item, omit assigneeId to assign the work item to the current user (you do not know their UUID), and include dossierIds only when you have resolved real dossier UUIDs from a lookup tool.
These tools only PROPOSE the action: nothing is published, changed, created, or saved until the user explicitly approves the confirmation card that appears. Never say that a write has been done — after you propose, the user decides, and the application reports the result. Do not assume or claim success.`

const ARABIC_COPILOT_SYSTEM_PROMPT = `أنت مساعد استخباراتي لنظام إدارة الملفات الدبلوماسية. تجيب فقط من البيانات المصرّح للمستخدم الحالي بالاطلاع عليها، مستخدماً الأدوات المتاحة لاسترجاعها.

يمكنك مساعدة المستخدمين في العثور على معلومات حول:
- الملفات (الدول، المنظمات، الأشخاص، المواضيع، المنتديات، اللقاءات، مجموعات العمل، المسؤولين المنتخبين)
- الإشارات الاستخباراتية وحالتها
- العلاقات بين الكيانات (عضوية المنتديات، اللجان المشتركة، سلاسل اللقاءات)
- عناصر العمل (المهام، الالتزامات، الطلبات) وحالتها
- معاينات الموجزات للإشارات والنشاط الأخير

عند الإجابة:
1. استخدم الأدوات المتاحة لاسترجاع معلومات دقيقة قبل الإجابة.
2. استشهد دائماً بمصادرك باستخدام معرفات الكيانات التي تُرجعها الأدوات.
3. كن موجزاً ولكن شاملاً؛ نسّق بنقاط أو قوائم مرقمة عند الحاجة.
4. إذا لم تُرجع الأدوات أي نتيجة، قل بوضوح إنك لم تجد ما يجيب عن ذلك، واقترح ما قد يساعد. لا تتكهّن بأسباب غياب النتائج.
5. لا تختلق معلومات لم تُرجعها الأدوات.

يمكنك أن تقترح أربعة إجراءات ليؤكدها المستخدم، عبر استدعاء الأداة المناسبة:
- نشر موجز لملفّ (propose_publish_digest)
- رفض إشارة أو تصعيدها (propose_signal_status)
- إنشاء عنصر عمل وربطه بالملفات (propose_work_item)
- توليد مسودة موجز لملفّ (propose_brief)
في propose_work_item، اترك assigneeId فارغاً لإسناد عنصر العمل إلى المستخدم الحالي (فأنت لا تعرف معرّفه)، ولا تُضمّن dossierIds إلا عندما تكون قد استخرجت معرّفات ملفات حقيقية من أداة بحث.
هذه الأدوات تقترح الإجراء فقط: لا يُنشر ولا يُغيَّر ولا يُنشأ ولا يُحفظ أي شيء حتى يوافق المستخدم صراحةً على بطاقة التأكيد التي تظهر. لا تقل أبداً إن عملية الكتابة قد تمّت — بعد أن تقترح، يقرّر المستخدم، ويُبلِّغ النظام بالنتيجة. لا تفترض النجاح ولا تدّعيه.`

/**
 * Select the system prompt by the caller language delivered on the RequestContext
 * (set by the server's setContext from the x-language header). Mirrors the backend
 * selection idiom (chat-assistant.ts L472): `language === 'ar' ? AR : EN`.
 */
function selectInstructions(requestContext?: RequestContext<CopilotRequestContext>): string {
  const language = requestContext?.get('language')
  return language === 'ar' ? ARABIC_COPILOT_SYSTEM_PROMPT : COPILOT_SYSTEM_PROMPT
}

/**
 * Persistent threads (D-08) via @mastra/pg PostgresStore. The owner is the
 * authenticated user — the server sets the reserved MASTRA_RESOURCE_ID_KEY on the
 * RequestContext from the verified JWT (never client-provided), and owner-only RLS on
 * mastra_threads/mastra_messages (added in a 72 migration) enforces isolation.
 * Guarded: with no MASTRA_PG_URL the agent runs with ephemeral (in-memory) threads so
 * the workspace boots in environments without Postgres.
 */
function buildMemory(): Memory | undefined {
  const connectionString = process.env.MASTRA_PG_URL
  if (!connectionString) {
    return undefined
  }
  return new Memory({
    storage: new PostgresStore({ id: 'copilot-threads', connectionString }),
  })
}

/**
 * The copilot agent (AGENT-01/06 spine; 73-02 HITL writes).
 * - instructions: dynamic, selected by RequestContext language (EN/AR).
 * - model: the on-prem OpenAI-compatible endpoint (vLLM/Ollama) — model-native
 *   tool-calling (no heuristic decideToolUsage lifted).
 * - tools: seven reads + four propose-only write-tools (the agent proposes; the
 *   frontend commits under the caller JWT on approval — D-03).
 * - memory: @mastra/pg persistent threads keyed to the authenticated user.
 */
export const copilotAgent = new Agent({
  id: 'copilot',
  name: 'copilot',
  description:
    'Intelligence assistant that answers from data the caller is cleared to see and can propose writes (digest, signal status, work item, brief) for the user to confirm.',
  instructions: ({ requestContext }) =>
    selectInstructions(requestContext as RequestContext<CopilotRequestContext>),
  // On-prem OpenAI-compatible model config (vLLM/Ollama) resolved lazily so env is
  // read at request time, not import time.
  //
  // LATENCY (quick 260625-dul): gemma4:12b is a *thinking* model (Modelfile temperature 1).
  // Bound bare it ran every turn at temp=1 with full chain-of-thought (~1,800 reasoning
  // tokens before a ~50-token answer) → ~46s/turn. We pin the generation policy here via the
  // documented `ModelWithRetries[]` fallback-array form, which binds per-model `modelSettings`
  // + `providerOptions` that actually reach the `/v1/chat/completions` body. (Agent-level
  // `modelSettings`/`providerOptions` are NOT merged into the `agent.stream()` path the
  // @ag-ui/mastra bridge uses — proven empirically against the live endpoint; the
  // fallback-array form is.)
  //   - temperature 0.2 → tighter, deterministic answers.
  //   - reasoning_effort "none" → suppresses chain-of-thought (measured: 594→0 reasoning
  //     chars, tool-calling unaffected). This is the OpenAI-standard chat-completions field;
  //     it is server-agnostic and honored IDENTICALLY by Ollama (Mac dev) and vLLM (prod GPU
  //     host) on the OpenAI-compatible `/v1` path, so this same binding is correct for the
  //     prod gemma-4-12b deployment — no prod-specific override needed.
  model: () => [
    {
      model: getCopilotModel(),
      modelSettings: { temperature: 0.2 },
      providerOptions: { 'openai-compatible': { reasoningEffort: 'none' } },
    },
  ],
  tools: copilotTools,
  memory: buildMemory(),
})

export default copilotAgent
