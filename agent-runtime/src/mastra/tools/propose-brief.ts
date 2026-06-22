import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import OpenAI from 'openai'
import * as supa from './_supabase.js'
import { getCopilotModel } from '../../llm-router.js'

// Re-export the keystone helper so a `vi.spyOn(supaModule, 'createUserClient')` in the
// tests intercepts the client build (this tool DOES read the dossier under the caller
// JWT — never service-role).
export const createUserClient = supa.createUserClient

/**
 * The bilingual brief draft envelope — the SINGLE `content` jsonb the reconciled persist
 * RPC stores (73-01/73-03). There are NO separate per-language columns on the live
 * `briefs` table; both languages live under one `content` object. 73-03 forwards this
 * verbatim as the RPC's content argument.
 */
type BriefSection = { title: string; content: string }
type BriefLang = { summary: string; sections: BriefSection[] }
type BriefContent = { en: BriefLang; ar: BriefLang }

const NEUTRAL = { proposed: false } as const

/**
 * Ask the on-prem OpenAI-compatible model (vLLM/Ollama via getCopilotModel — the legacy
 * workspace-chat generation path P74 retires is NOT used here) to draft the bilingual
 * brief and parse it into the `{ summary, sections }` shape for EN + AR. Kept minimal:
 * P73 only needs a structurally-valid `content` envelope the persist RPC will accept;
 * the generation-substrate hardening is P74 (D-02, deferred). Any model/parse failure
 * throws so the caller returns indistinguishable-empty.
 */
async function draftBilingualBrief(dossier: Record<string, unknown>): Promise<BriefContent> {
  const { url, apiKey, id } = getCopilotModel()
  // The model config id is `openai-compatible/<servedModelName>`; the OpenAI client only
  // needs the served-model-name after the slash.
  const model = id.includes('/') ? id.slice(id.indexOf('/') + 1) : id
  const client = new OpenAI({ baseURL: url, apiKey })

  const nameEn = typeof dossier.name_en === 'string' ? dossier.name_en : ''
  const nameAr = typeof dossier.name_ar === 'string' ? dossier.name_ar : ''
  const descEn = typeof dossier.description_en === 'string' ? dossier.description_en : ''
  const descAr = typeof dossier.description_ar === 'string' ? dossier.description_ar : ''
  const dtype = typeof dossier.type === 'string' ? dossier.type : 'dossier'

  // Bilingual draft prompt. The model must return ONLY JSON matching BriefContent so the
  // result drops straight into the persist RPC's content argument.
  const prompt = [
    `Draft a concise diplomatic brief for the following ${dtype} dossier, in BOTH English and Arabic.`,
    `English name: ${nameEn}`,
    `Arabic name: ${nameAr}`,
    descEn ? `English description: ${descEn}` : '',
    descAr ? `Arabic description: ${descAr}` : '',
    '',
    'Return ONLY a JSON object with this exact shape (no markdown, no commentary):',
    '{"en":{"summary":"...","sections":[{"title":"...","content":"..."}]},',
    ' "ar":{"summary":"...","sections":[{"title":"...","content":"..."}]}}',
    'Each language must have a one-paragraph summary and at least one section.',
  ]
    .filter(Boolean)
    .join('\n')

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a diplomatic brief drafter. You draft only from the data provided and you respond with a single JSON object and nothing else.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices?.[0]?.message?.content ?? ''
  const parsed = JSON.parse(raw) as unknown
  const content = parsed as BriefContent
  // Minimal structural validation: both languages present with a summary + sections array.
  if (
    !content?.en ||
    !content?.ar ||
    typeof content.en.summary !== 'string' ||
    typeof content.ar.summary !== 'string' ||
    !Array.isArray(content.en.sections) ||
    !Array.isArray(content.ar.sections)
  ) {
    throw new Error('model returned a malformed brief envelope')
  }
  return content
}

/**
 * propose_brief (GENUI-02/03, D-01/D-02/D-03) — PROPOSE-ONLY write-tool, the only NOVEL
 * one in the roster. The agent calls this when the user asks to GENERATE/draft a brief
 * for a dossier.
 *
 * Behavior:
 * - reads the dossier under the CALLER JWT (RLS gates the source content — D-02's
 *   on-prem generation only ever sees data the caller is cleared to read), then drafts
 *   the bilingual `content` envelope with the on-prem model (getCopilotModel — the
 *   legacy workspace-chat path P74 retires is NOT used, and no new dependency beyond the
 *   already-pinned `openai` client);
 * - returns `{ proposed: true, action: 'brief', args: { dossierId, content: { en, ar } } }`
 *   where the single `content` object IS the persist RPC's content jsonb (NOT separate
 *   contentEn/contentAr);
 * - NEVER persists: no persist RPC call, no DB write — 73-03 persists on approval.
 *
 * Indistinguishable-empty (T-73-02-03): a missing JWT, an unreadable/above-clearance
 * dossier, or any generation/parse error ALL return the same neutral `{ proposed: false }`
 * — no clearance/filtered/restricted token, no service-role fallback.
 */
export const proposeBriefTool = createTool({
  id: 'propose_brief',
  description:
    'Propose a generated bilingual (English + Arabic) brief draft for a dossier, for the user to confirm. Use this when the user asks to generate, draft, or write a brief for a dossier. This only proposes the draft — nothing is saved until the user approves the confirmation card.',
  inputSchema: z.object({
    dossierId: z.string().uuid().describe('The dossier UUID to draft a brief for'),
  }),
  outputSchema: z.object({
    proposed: z.boolean(),
    action: z.string().optional(),
    args: z
      .object({
        dossierId: z.string(),
        content: z.object({
          en: z.record(z.string(), z.unknown()),
          ar: z.record(z.string(), z.unknown()),
        }),
      })
      .optional(),
  }),
  execute: async (input, context) => {
    // KEYSTONE (#4465 gate): build the read client from the caller JWT, NEVER service-role.
    const authorization = supa.getAuthorization(context?.requestContext ?? { get: () => undefined })
    if (!authorization) {
      return { ...NEUTRAL }
    }

    const args = input as { dossierId: string }

    try {
      // Read the dossier the brief summarizes under the caller JWT (RLS-gated). Mirrors
      // getDossierTool's read so above-clearance dossiers simply return no row.
      const sb = supa.createUserClient(authorization)
      const { data, error } = await sb
        .from('dossiers')
        .select(
          `
          id, name_en, name_ar, type,
          description_en, description_ar,
          status, sensitivity_level, tags, metadata,
          created_at, updated_at
        `,
        )
        .eq('id', args.dossierId)
        .eq('is_active', true)
        .single()
      if (error || !data) {
        // Indistinguishable-empty: above-clearance / not-found / read error look identical.
        return { ...NEUTRAL }
      }

      // On-prem bilingual draft from the cleared dossier data only (no external workspace
      // generation service).
      const content = await draftBilingualBrief(data as Record<string, unknown>)

      return {
        proposed: true,
        action: 'brief',
        args: {
          dossierId: args.dossierId,
          content,
        },
      }
    } catch {
      // Any read or generation failure → indistinguishable-empty (no persist, no leak).
      return { ...NEUTRAL }
    }
  },
})

export default proposeBriefTool
