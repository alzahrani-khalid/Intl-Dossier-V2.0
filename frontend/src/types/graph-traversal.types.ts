/**
 * Graph Traversal Types
 * Feature: relationship-graph-traversal
 *
 * Types for recursive graph traversal functions including:
 * - Bidirectional N-degree traversal
 * - Shortest path finding
 * - All paths between entities
 * - Connected entities discovery
 * - Relationship chain pattern matching
 * - Common connections analysis
 * - Graph statistics
 */

import type { DossierRelationshipType, DossierType } from './relationship.types'

// ============================================
// Base Types
// ============================================

/**
 * Direction of relationship traversal
 */
export type RelationshipDirection = 'outgoing' | 'incoming'

/**
 * Basic dossier reference in graph operations
 */
export interface DossierReference {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
  status: string
}

/**
 * Node in the relationship graph
 */
export interface GraphNode extends DossierReference {
  /** Degrees of separation from starting node */
  degree: number
  /** Path of dossier IDs from start to this node */
  path: string[]
  /** Relationship types along the path */
  relationship_path?: string[]
  /** Direction of each relationship in the path */
  direction_path?: RelationshipDirection[]
  /** Connection count (for connected entities) */
  connection_count?: number
  /** Minimum distance from start (for connected entities) */
  min_distance?: number
}

/**
 * Edge in the relationship graph
 */
export interface GraphEdge {
  /** Source dossier ID */
  source_id: string
  /** Target dossier ID */
  target_id: string
  /** Type of relationship */
  relationship_type: DossierRelationshipType
  /** Direction of the relationship */
  direction?: RelationshipDirection
}

// ============================================
// Request Types
// ============================================

/**
 * Parameters for bidirectional graph traversal
 */
export interface TraverseBidirectionalParams {
  /** Starting dossier UUID */
  startDossierId: string
  /** Maximum degrees of separation (1-6, default 2) */
  maxDegrees?: number
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Include inactive/historical relationships */
  includeInactive?: boolean
  /** Filter by dossier types */
  dossierTypeFilter?: DossierType[]
}

/**
 * Parameters for shortest path finding
 */
export interface ShortestPathParams {
  /** Source dossier UUID */
  sourceId: string
  /** Target dossier UUID */
  targetId: string
  /** Maximum search depth (default 6) */
  maxDepth?: number
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Include inactive/historical relationships */
  includeInactive?: boolean
}

/**
 * Parameters for finding all paths
 */
export interface AllPathsParams {
  /** Source dossier UUID */
  sourceId: string
  /** Target dossier UUID */
  targetId: string
  /** Maximum search depth (default 4) */
  maxDepth?: number
  /** Maximum number of paths to return (default 10) */
  maxPaths?: number
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Include inactive/historical relationships */
  includeInactive?: boolean
}

/**
 * Parameters for finding connected entities
 */
export interface ConnectedEntitiesParams {
  /** Starting dossier UUID */
  startDossierId: string
  /** Maximum entities to return (default 100) */
  maxEntities?: number
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Include inactive/historical relationships */
  includeInactive?: boolean
  /** Filter by dossier types */
  dossierTypeFilter?: DossierType[]
}

/**
 * Parameters for relationship chain pattern matching
 */
export interface RelationshipChainParams {
  /** Starting dossier UUID */
  startDossierId: string
  /** Ordered array of relationship types to follow */
  relationshipChain: DossierRelationshipType[]
  /** Whether each relationship can be followed bidirectionally */
  bidirectionalChain?: boolean[]
}

/**
 * Parameters for finding common connections
 */
export interface CommonConnectionsParams {
  /** First dossier UUID */
  dossierAId: string
  /** Second dossier UUID */
  dossierBId: string
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Include inactive/historical relationships */
  includeInactive?: boolean
}

/**
 * Parameters for graph statistics
 */
export interface GraphStatisticsParams {
  /** Starting dossier UUID (null for entire graph) */
  startDossierId?: string | null
  /** Maximum degrees for subgraph (default 3) */
  maxDegrees?: number
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Include inactive/historical relationships */
  includeInactive?: boolean
}

// ============================================
// Response Types
// ============================================

/**
 * Query statistics common to all operations
 */
export interface QueryStats {
  /** Time taken to execute query in milliseconds */
  query_time_ms: number
  /** Performance warning if query exceeded target */
  performance_warning?: string | null
}

/**
 * Statistics for graph traversal operations
 */
export interface TraversalStats extends QueryStats {
  /** Number of nodes in result */
  node_count: number
  /** Number of edges in result */
  edge_count: number
  /** Maximum degree found in result */
  max_degree_found: number
}

/**
 * Response from bidirectional traversal
 */
export interface TraverseBidirectionalResponse {
  operation: 'traverse_bidirectional'
  start_dossier_id: string
  start_dossier: DossierReference
  max_degrees: number
  relationship_type_filter: DossierRelationshipType[] | 'all'
  dossier_type_filter: DossierType[] | 'all'
  include_inactive: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: TraversalStats
}

/**
 * Path result from shortest path or all paths
 */
export interface PathResult {
  /** Ordered array of dossier IDs in the path */
  path: string[]
  /** Relationship types between consecutive nodes */
  relationship_path: string[]
  /** Direction of each relationship */
  direction_path: RelationshipDirection[]
  /** Number of hops in the path */
  path_length: number
}

/**
 * Response from shortest path finding
 */
export interface ShortestPathResponse {
  operation: 'shortest_path'
  source_id: string
  target_id: string
  max_depth: number
  /** Whether a path was found */
  found: boolean
  /** Path if found, null otherwise */
  path: string[] | null
  relationship_path: string[] | null
  direction_path: RelationshipDirection[] | null
  path_length: number | null
  /** Dossier details for nodes in path */
  path_dossiers: DossierReference[]
  stats: QueryStats
}

/**
 * Response from all paths finding
 */
export interface AllPathsResponse {
  operation: 'all_paths'
  source_id: string
  target_id: string
  max_depth: number
  max_paths: number
  paths: PathResult[]
  path_count: number
  stats: QueryStats
}

/**
 * Entity with connection information
 */
export interface ConnectedEntity extends DossierReference {
  /** Minimum distance from starting dossier */
  min_distance: number
  /** Number of connections */
  connection_count: number
}

/**
 * Response from connected entities discovery
 */
export interface ConnectedEntitiesResponse {
  operation: 'connected_entities'
  start_dossier_id: string
  max_entities: number
  entities: ConnectedEntity[]
  entity_count: number
  stats: QueryStats
}

/**
 * Entity in a relationship chain
 */
export interface ChainEntity {
  /** Position in the chain (0 = start) */
  chain_position: number
  dossier_id: string
  dossier_type: DossierType
  name_en: string
  name_ar: string
  status: string
  /** Relationship type to next entity (null for last) */
  relationship_type: DossierRelationshipType | null
  /** Direction of relationship */
  direction: RelationshipDirection | 'start'
  /** Full path of dossier IDs */
  full_path: string[]
}

/**
 * Complete chain result
 */
export interface ChainResult {
  /** Full path of dossier IDs */
  path: string[]
  /** Entities in the chain with details */
  entities: ChainEntity[]
}

/**
 * Response from relationship chain pattern matching
 */
export interface RelationshipChainResponse {
  operation: 'relationship_chain'
  start_dossier_id: string
  relationship_chain: DossierRelationshipType[]
  bidirectional_chain: boolean[] | null
  chains: ChainResult[]
  chain_count: number
  stats: QueryStats
}

/**
 * Common connection between two entities
 */
export interface CommonConnection extends DossierReference {
  /** Relationship type to first dossier */
  relationship_to_a: DossierRelationshipType
  /** Direction to first dossier */
  direction_to_a: RelationshipDirection
  /** Relationship type to second dossier */
  relationship_to_b: DossierRelationshipType
  /** Direction to second dossier */
  direction_to_b: RelationshipDirection
}

/**
 * Response from common connections finding
 */
export interface CommonConnectionsResponse {
  operation: 'common_connections'
  dossier_a_id: string
  dossier_b_id: string
  common_connections: CommonConnection[]
  connection_count: number
  stats: QueryStats
}

/**
 * Graph statistics
 */
export interface GraphStatistics {
  /** Total number of nodes */
  total_nodes: number
  /** Total number of edges */
  total_edges: number
  /** Graph density (0-1) */
  graph_density: number
  /** Average node degree */
  avg_degree: number
  /** Maximum node degree */
  max_degree: number
  /** Number of isolated nodes (no connections) */
  isolated_nodes: number
  /** Distribution of dossier types */
  dossier_type_distribution: Record<DossierType, number>
}

/**
 * Response from graph statistics
 */
export interface GraphStatisticsResponse {
  operation: 'statistics'
  start_dossier_id: string | null
  max_degrees: number
  statistics: GraphStatistics | null
  stats: QueryStats
}

// ============================================
// Union Types
// ============================================

/**
 * All possible graph traversal operations
 */
export type GraphOperation =
  | 'traverse_bidirectional'
  | 'shortest_path'
  | 'all_paths'
  | 'connected_entities'
  | 'relationship_chain'
  | 'common_connections'
  | 'statistics'

/**
 * Union of all graph traversal responses
 */
export type GraphTraversalResponse =
  | TraverseBidirectionalResponse
  | ShortestPathResponse
  | AllPathsResponse
  | ConnectedEntitiesResponse
  | RelationshipChainResponse
  | CommonConnectionsResponse
  | GraphStatisticsResponse

// ============================================
// Error Types
// ============================================

/**
 * Error from graph traversal API
 */
export class GraphTraversalError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public operation?: GraphOperation,
  ) {
    super(message)
    this.name = 'GraphTraversalError'
  }
}

// ============================================
// Helper Types
// ============================================

/**
 * Options for visualization rendering
 */
export interface GraphVisualizationOptions {
  /** Layout algorithm */
  layout: 'force' | 'circular' | 'hierarchical' | 'radial'
  /** Whether to show edge labels */
  showEdgeLabels: boolean
  /** Node size factor */
  nodeSizeFactor: number
  /** Edge width factor */
  edgeWidthFactor: number
  /** Whether to highlight shortest path */
  highlightPath: boolean
  /** Path to highlight (dossier IDs) */
  highlightedPath?: string[]
}

/**
 * Type for graph operation state in UI
 */
export interface GraphOperationState {
  /** Currently selected operation */
  operation: GraphOperation
  /** Whether operation is loading */
  isLoading: boolean
  /** Error if operation failed */
  error: GraphTraversalError | null
  /** Last result */
  result: GraphTraversalResponse | null
}
