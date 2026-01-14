/**
 * External Adapters Index
 *
 * Anti-Corruption Layer (ACL) adapters that translate between
 * external systems and internal domain models.
 *
 * These adapters protect the domain from external API changes
 * and make external services easily replaceable.
 *
 * @module adapters/external
 */

// Email adapters
export {
  NodemailerEmailAdapter,
  createNodemailerEmailAdapter,
  type NodemailerAdapterConfig,
} from './email/nodemailer.email.adapter'

// Digital signature adapters
export {
  DocuSignSignatureAdapter,
  createDocuSignSignatureAdapter,
  type DocuSignAdapterConfig,
} from './signature/docusign.signature.adapter'

// Calendar adapters
export {
  SupabaseCalendarAdapter,
  createSupabaseCalendarAdapter,
  type SupabaseCalendarAdapterConfig,
} from './calendar/supabase.calendar.adapter'

// AI adapters
export {
  AnythingLLMAIAdapter,
  createAnythingLLMAIAdapter,
  type AnythingLLMAdapterConfig,
  AI_SERVICE_TOKEN,
} from './ai/anythingllm.ai.adapter'
