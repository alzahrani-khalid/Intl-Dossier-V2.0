// Tool registry barrel (Plan 72-05 scaffold; Plan 72-06 read bodies; Plan 73-02 writes).
//
// The roster is NO LONGER reads-only: it is seven reads-only tools (D-07) PLUS four
// PROPOSE-only write-tools (73-02, GENUI-02/03). Each tool is a narrow Zod-typed Mastra
// tool that builds a per-request Supabase client from the caller JWT
// (context.requestContext — the spike-proven keystone) and returns indistinguishable-empty
// on denial/empty. NO tool ever uses the service-role key.
//
// The four propose_* write-tools COMMIT NOTHING server-side: they validate + echo the
// structured args (and, for propose_brief, draft bilingual content from cleared data) for
// a HITL confirmation card; the frontend approve-handler commits under the caller JWT
// (D-03). None of them calls publish_digest, the persist RPC, tasks-create, or any insert.
//
// Reads roster (D-07): hybrid_rag_search, read_signals, query_graph,
//   generate_digest (preview), get_dossier, list_dossiers, query_work_items.
// Propose-only writes (73-02): propose_publish_digest, propose_signal_status,
//   propose_work_item, propose_brief.

import { hybridRagSearchTool } from './hybrid-rag-search.js'
import { readSignalsTool } from './read-signals.js'
import { queryGraphTool } from './query-graph.js'
import { generateDigestTool } from './generate-digest.js'
import { getDossierTool, listDossiersTool, queryWorkItemsTool } from './dossier-lookups.js'
import { proposePublishDigestTool } from './propose-publish-digest.js'
import { proposeSignalStatusTool } from './propose-signal-status.js'
import { proposeWorkItemTool } from './propose-work-item.js'
import { proposeBriefTool } from './propose-brief.js'

export {
  hybridRagSearchTool,
  readSignalsTool,
  queryGraphTool,
  generateDigestTool,
  getDossierTool,
  listDossiersTool,
  queryWorkItemsTool,
  proposePublishDigestTool,
  proposeSignalStatusTool,
  proposeWorkItemTool,
  proposeBriefTool,
}

/**
 * The keyed tool roster the copilot agent binds (model-native tool-calling). Keys are
 * the tool ids the model sees: seven reads + four propose-only writes (11 total). The
 * propose_* tools commit nothing — the frontend commits on approval (D-03).
 */
export const copilotTools = {
  hybrid_rag_search: hybridRagSearchTool,
  read_signals: readSignalsTool,
  query_graph: queryGraphTool,
  generate_digest_preview: generateDigestTool,
  get_dossier: getDossierTool,
  list_dossiers: listDossiersTool,
  query_work_items: queryWorkItemsTool,
  propose_publish_digest: proposePublishDigestTool,
  propose_signal_status: proposeSignalStatusTool,
  propose_work_item: proposeWorkItemTool,
  propose_brief: proposeBriefTool,
}
