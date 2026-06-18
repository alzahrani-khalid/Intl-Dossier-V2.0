// Tool registry barrel (Plan 72-05).
//
// This is the typed STUB roster — each tool is a correctly-typed Mastra tool whose
// body is a `// TODO: 72-06` placeholder returning indistinguishable-empty. The
// copilot agent imports `copilotTools` from here so it type-checks NOW; Plan 72-06
// replaces the stub bodies (and removes the __scaffold__ vitest exclusion) to turn
// the JWT-scoping + indistinguishable-empty assertions GREEN.
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
