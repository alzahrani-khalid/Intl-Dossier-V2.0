// Tool registry barrel (Plan 72-05 scaffold; Plan 72-06 bodies).
//
// The reads-only tool roster (D-07). Each tool is a narrow Zod-typed Mastra tool that
// builds a per-request Supabase client from the caller JWT (context.requestContext —
// the spike-proven keystone), calls a SECURITY INVOKER RPC or a JWT-scoped table read,
// and returns indistinguishable-empty on denial/empty. NO tool ever uses the
// service-role key; none calls publish_digest. The copilot agent imports `copilotTools`
// from here.
//
// Roster (D-07, reads-only): hybrid_rag_search, read_signals, query_graph,
// generate_digest (preview), get_dossier, list_dossiers, query_work_items.

import { hybridRagSearchTool } from './hybrid-rag-search.js'
import { readSignalsTool } from './read-signals.js'
import { queryGraphTool } from './query-graph.js'
import { generateDigestTool } from './generate-digest.js'
import { getDossierTool, listDossiersTool, queryWorkItemsTool } from './dossier-lookups.js'

export {
  hybridRagSearchTool,
  readSignalsTool,
  queryGraphTool,
  generateDigestTool,
  getDossierTool,
  listDossiersTool,
  queryWorkItemsTool,
}

/**
 * The keyed tool roster the copilot agent binds (model-native tool-calling). Keys
 * are the tool ids the model sees. 72-06 keeps these keys stable.
 */
export const copilotTools = {
  hybrid_rag_search: hybridRagSearchTool,
  read_signals: readSignalsTool,
  query_graph: queryGraphTool,
  generate_digest_preview: generateDigestTool,
  get_dossier: getDossierTool,
  list_dossiers: listDossiersTool,
  query_work_items: queryWorkItemsTool,
}
