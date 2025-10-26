import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

interface GraphNode {
  id: string;
  type: string;
  name_en: string;
  name_ar: string;
  status: string;
  sensitivity_level: number;
  depth: number; // Distance from starting node
  path: string[]; // Array of node IDs from start to this node
}

interface GraphEdge {
  source_id: string;
  target_id: string;
  relationship_type: string;
  relationship_metadata?: Record<string, unknown>;
}

interface GraphTraversalOptions {
  max_depth?: number; // Maximum degrees of separation (default 5, max 10)
  relationship_types?: string[]; // Filter by specific relationship types
  direction?: 'outgoing' | 'incoming' | 'both'; // Traversal direction
  include_inactive?: boolean; // Include inactive dossiers (default false)
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    max_depth_reached: number;
    query_time_ms: number;
  };
}

/**
 * GraphService - Graph traversal and network analysis for dossier relationships
 *
 * This service provides graph query capabilities for exploring relationship networks:
 * - Multi-degree traversal (find all entities within N degrees of separation)
 * - Bidirectional queries (follow relationships in both directions)
 * - Cycle detection and path finding
 * - Network visualization data preparation
 * - Query complexity budget enforcement
 *
 * @example
 * // Find all entities within 2 degrees of Saudi Arabia
 * const graph = await graphService.traverseGraph('saudi-arabia-uuid', {
 *   max_depth: 2,
 *   direction: 'both'
 * });
 * // Returns: { nodes: [...], edges: [...], stats: {...} }
 *
 * @example
 * // Find indirect connections between two countries
 * const path = await graphService.findPath('saudi-arabia-uuid', 'china-uuid', 3);
 * // Returns: ['saudi-arabia-uuid', 'g20-uuid', 'china-uuid']
 */
export class GraphService {
  private supabase: SupabaseClient<Database>;
  private readonly MAX_DEPTH = 10;
  private readonly DEFAULT_DEPTH = 5;
  private readonly COMPLEXITY_BUDGET = 10000; // Max nodes to process

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Traverse relationship graph using database recursive CTE (RECOMMENDED)
   * Uses PostgreSQL recursive function for optimal performance
   * @param startDossierId - Starting dossier UUID
   * @param maxDegrees - Maximum degrees of separation (default 2)
   * @param relationshipTypeFilter - Optional filter by relationship type
   * @returns Graph traversal results from database
   * @throws Error if RPC call fails
   */
  async traverseGraphRPC(
    startDossierId: string,
    maxDegrees: number = 2,
    relationshipTypeFilter?: string
  ) {
    const startTime = Date.now();

    // Validate max_degrees
    if (maxDegrees > this.MAX_DEPTH) {
      throw new Error(`maxDegrees cannot exceed ${this.MAX_DEPTH}`);
    }

    // Call database function
    const { data, error } = await this.supabase.rpc('traverse_relationship_graph', {
      start_dossier_id: startDossierId,
      max_degrees: maxDegrees,
      relationship_type_filter: relationshipTypeFilter || null,
    });

    if (error) {
      throw new Error(`Graph traversal failed: ${error.message}`);
    }

    const queryTime = Date.now() - startTime;

    // Transform database results to GraphData format
    const nodesMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // Process results
    (data || []).forEach((row: any) => {
      // Add node
      if (!nodesMap.has(row.dossier_id)) {
        nodesMap.set(row.dossier_id, {
          id: row.dossier_id,
          type: row.dossier_type,
          name_en: row.name_en,
          name_ar: row.name_ar,
          status: row.status,
          sensitivity_level: 1, // Will be filtered by RLS
          depth: row.degree,
          path: row.path,
        });
      }

      // Build edges from path
      if (row.path && row.path.length > 1 && row.relationship_path) {
        for (let i = 0; i < row.path.length - 1; i++) {
          const sourceId = row.path[i];
          const targetId = row.path[i + 1];
          const relationshipType = row.relationship_path[i];

          // Check if edge already exists
          const edgeExists = edges.some(
            (e) =>
              e.source_id === sourceId &&
              e.target_id === targetId &&
              e.relationship_type === relationshipType
          );

          if (!edgeExists) {
            edges.push({
              source_id: sourceId,
              target_id: targetId,
              relationship_type: relationshipType,
            });
          }
        }
      }
    });

    const nodes = Array.from(nodesMap.values());
    const maxDepthReached = nodes.length > 0 ? Math.max(...nodes.map((n) => n.depth)) : 0;

    return {
      nodes,
      edges,
      stats: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        max_depth_reached: maxDepthReached,
        query_time_ms: queryTime,
      },
    };
  }

  /**
   * Get bidirectional relationships using database function
   * @param dossierId - UUID of the dossier
   * @param relationshipTypeFilter - Optional filter by relationship type
   * @param includeInactive - Include inactive relationships (default false)
   * @returns Array of bidirectional relationships
   */
  async getBidirectionalRelationshipsRPC(
    dossierId: string,
    relationshipTypeFilter?: string,
    includeInactive: boolean = false
  ) {
    const { data, error } = await this.supabase.rpc('get_bidirectional_relationships', {
      dossier_id_param: dossierId,
      relationship_type_filter: relationshipTypeFilter || null,
      include_inactive: includeInactive,
    });

    if (error) {
      throw new Error(`Failed to get bidirectional relationships: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find shortest path between two dossiers using database function
   * @param sourceId - Source dossier UUID
   * @param targetId - Target dossier UUID
   * @param maxDepth - Maximum path length (default 5)
   * @returns Path data or null if no path found
   */
  async findPathRPC(
    sourceId: string,
    targetId: string,
    maxDepth: number = 5
  ) {
    const { data, error } = await this.supabase.rpc('get_relationship_path', {
      source_dossier_id: sourceId,
      target_dossier_id: targetId,
      max_depth: maxDepth,
    });

    if (error) {
      throw new Error(`Failed to find path: ${error.message}`);
    }

    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Traverse relationship graph from a starting dossier (LEGACY - Application-level BFS)
   * Uses breadth-first search (BFS) to explore N degrees of separation
   * Note: Use traverseGraphRPC() for better performance with database recursive CTEs
   * @param startDossierId - Starting dossier UUID
   * @param options - Traversal options (depth, filters, direction)
   * @returns Graph data with nodes and edges
   * @throws Error if max_depth exceeds limit or complexity budget exceeded
   * @deprecated Use traverseGraphRPC() instead for better performance
   */
  async traverseGraph(
    startDossierId: string,
    options: GraphTraversalOptions = {}
  ): Promise<GraphData> {
    const startTime = Date.now();

    const {
      max_depth = this.DEFAULT_DEPTH,
      relationship_types,
      direction = 'both',
      include_inactive = false,
    } = options;

    // Validate max_depth
    if (max_depth > this.MAX_DEPTH) {
      throw new Error(`max_depth cannot exceed ${this.MAX_DEPTH}`);
    }

    // Initialize collections
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];
    const visited: Set<string> = new Set();
    const queue: Array<{ id: string; depth: number; path: string[] }> = [];

    // Get starting node
    const startNode = await this.getDossierNode(startDossierId);
    if (!startNode) {
      throw new Error(`Starting dossier not found: ${startDossierId}`);
    }

    // Add start node
    nodes.set(startDossierId, { ...startNode, depth: 0, path: [startDossierId] });
    visited.add(startDossierId);
    queue.push({ id: startDossierId, depth: 0, path: [startDossierId] });

    let processedNodes = 0;

    // BFS traversal
    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check complexity budget
      if (processedNodes >= this.COMPLEXITY_BUDGET) {
        console.warn(`Complexity budget exceeded at depth ${current.depth}`);
        break;
      }

      // Stop if max depth reached
      if (current.depth >= max_depth) {
        continue;
      }

      processedNodes++;

      // Get related nodes
      const related = await this.getAdjacentNodes(
        current.id,
        direction,
        relationship_types,
        include_inactive
      );

      for (const rel of related) {
        const targetId = rel.target_id;

        // Add edge
        edges.push({
          source_id: rel.source_id,
          target_id: rel.target_id,
          relationship_type: rel.relationship_type,
          relationship_metadata: rel.relationship_metadata,
        });

        // Skip if already visited
        if (visited.has(targetId)) {
          continue;
        }

        // Get node data
        const nodeData = await this.getDossierNode(targetId);
        if (!nodeData) continue;

        // Add node
        const newPath = [...current.path, targetId];
        nodes.set(targetId, {
          ...nodeData,
          depth: current.depth + 1,
          path: newPath,
        });

        visited.add(targetId);
        queue.push({
          id: targetId,
          depth: current.depth + 1,
          path: newPath,
        });
      }
    }

    const queryTime = Date.now() - startTime;

    // Calculate stats
    const depths = Array.from(nodes.values()).map((n) => n.depth);
    const maxDepthReached = depths.length > 0 ? Math.max(...depths) : 0;

    return {
      nodes: Array.from(nodes.values()),
      edges,
      stats: {
        total_nodes: nodes.size,
        total_edges: edges.length,
        max_depth_reached: maxDepthReached,
        query_time_ms: queryTime,
      },
    };
  }

  /**
   * Find shortest path between two dossiers
   * Uses BFS to find shortest connection path
   * @param startId - Starting dossier UUID
   * @param targetId - Target dossier UUID
   * @param maxDepth - Maximum path length to search (default 5)
   * @returns Array of dossier IDs representing path, or null if no path found
   */
  async findPath(
    startId: string,
    targetId: string,
    maxDepth: number = 5
  ): Promise<string[] | null> {
    if (startId === targetId) {
      return [startId];
    }

    const visited: Set<string> = new Set();
    const queue: Array<{ id: string; path: string[]; depth: number }> = [];

    visited.add(startId);
    queue.push({ id: startId, path: [startId], depth: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.depth >= maxDepth) {
        continue;
      }

      // Get adjacent nodes
      const adjacent = await this.getAdjacentNodes(current.id, 'both');

      for (const rel of adjacent) {
        const nextId = rel.target_id;

        // Found target!
        if (nextId === targetId) {
          return [...current.path, nextId];
        }

        // Continue search
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({
            id: nextId,
            path: [...current.path, nextId],
            depth: current.depth + 1,
          });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Get adjacent nodes (direct neighbors) for a dossier
   * @param dossierId - UUID of the dossier
   * @param direction - Traversal direction (outgoing, incoming, both)
   * @param relationshipTypes - Optional filter by relationship types
   * @param includeInactive - Include inactive dossiers (default false)
   * @returns Array of adjacent relationships
   */
  private async getAdjacentNodes(
    dossierId: string,
    direction: 'outgoing' | 'incoming' | 'both' = 'both',
    relationshipTypes?: string[],
    includeInactive: boolean = false
  ) {
    let query = this.supabase
      .from('dossier_relationships')
      .select('source_dossier_id, target_dossier_id, relationship_type, relationship_metadata, status');

    // Direction filtering
    if (direction === 'outgoing') {
      query = query.eq('source_dossier_id', dossierId);
    } else if (direction === 'incoming') {
      query = query.eq('target_dossier_id', dossierId);
    } else {
      // Both directions
      query = query.or(`source_dossier_id.eq.${dossierId},target_dossier_id.eq.${dossierId}`);
    }

    // Relationship type filtering
    if (relationshipTypes && relationshipTypes.length > 0) {
      query = query.in('relationship_type', relationshipTypes);
    }

    // Status filtering
    query = query.eq('status', 'active');

    const { data, error } = await query;

    if (error) throw error;

    // Normalize results: always return source_id, target_id
    return (data || []).map((rel) => {
      // If incoming relationship, swap source/target
      if (rel.target_dossier_id === dossierId) {
        return {
          source_id: rel.target_dossier_id,
          target_id: rel.source_dossier_id,
          relationship_type: rel.relationship_type,
          relationship_metadata: rel.relationship_metadata as Record<string, unknown> | undefined,
        };
      }

      return {
        source_id: rel.source_dossier_id,
        target_id: rel.target_dossier_id,
        relationship_type: rel.relationship_type,
        relationship_metadata: rel.relationship_metadata as Record<string, unknown> | undefined,
      };
    });
  }

  /**
   * Get dossier node data for graph
   * @param dossierId - UUID of the dossier
   * @returns Node data or null if not found
   */
  private async getDossierNode(dossierId: string): Promise<Omit<GraphNode, 'depth' | 'path'> | null> {
    const { data, error } = await this.supabase
      .from('dossiers')
      .select('id, type, name_en, name_ar, status, sensitivity_level')
      .eq('id', dossierId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      type: data.type,
      name_en: data.name_en,
      name_ar: data.name_ar,
      status: data.status,
      sensitivity_level: data.sensitivity_level,
    };
  }

  /**
   * Get network statistics for a dossier
   * @param dossierId - UUID of the dossier
   * @param maxDepth - Maximum depth to analyze (default 2)
   * @returns Network statistics
   */
  async getNetworkStats(dossierId: string, maxDepth: number = 2) {
    const graph = await this.traverseGraph(dossierId, { max_depth: maxDepth });

    // Calculate degree centrality (number of direct connections)
    const startNode = graph.nodes.find((n) => n.id === dossierId);
    const directConnections = graph.nodes.filter((n) => n.depth === 1).length;

    // Calculate relationship type distribution
    const relationshipTypeCounts: Record<string, number> = {};
    graph.edges.forEach((edge) => {
      relationshipTypeCounts[edge.relationship_type] =
        (relationshipTypeCounts[edge.relationship_type] || 0) + 1;
    });

    // Calculate node type distribution
    const nodeTypeCounts: Record<string, number> = {};
    graph.nodes.forEach((node) => {
      nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
    });

    return {
      degree_centrality: directConnections,
      total_network_size: graph.nodes.length - 1, // Exclude start node
      total_connections: graph.edges.length,
      relationship_types: relationshipTypeCounts,
      node_types: nodeTypeCounts,
      max_depth_explored: graph.stats.max_depth_reached,
    };
  }

  /**
   * Detect cycles in the graph (circular relationships)
   * @param startDossierId - Starting dossier UUID
   * @returns Array of cycles found (each cycle is an array of dossier IDs)
   */
  async detectCycles(startDossierId: string): Promise<string[][]> {
    const cycles: string[][] = [];
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();

    const dfs = async (currentId: string, path: string[]): Promise<void> => {
      visited.add(currentId);
      recursionStack.add(currentId);
      path.push(currentId);

      const adjacent = await this.getAdjacentNodes(currentId, 'outgoing');

      for (const rel of adjacent) {
        const nextId = rel.target_id;

        if (!visited.has(nextId)) {
          await dfs(nextId, [...path]);
        } else if (recursionStack.has(nextId)) {
          // Cycle detected!
          const cycleStart = path.indexOf(nextId);
          const cycle = path.slice(cycleStart);
          cycles.push([...cycle, nextId]);
        }
      }

      recursionStack.delete(currentId);
    };

    await dfs(startDossierId, []);

    return cycles;
  }

  /**
   * Get common connections between two dossiers
   * Finds dossiers that are connected to both input dossiers
   * @param dossier1Id - First dossier UUID
   * @param dossier2Id - Second dossier UUID
   * @returns Array of common connection dossiers
   */
  async getCommonConnections(dossier1Id: string, dossier2Id: string) {
    // Get neighbors of both dossiers
    const [neighbors1, neighbors2] = await Promise.all([
      this.getAdjacentNodes(dossier1Id, 'both'),
      this.getAdjacentNodes(dossier2Id, 'both'),
    ]);

    const set1 = new Set(neighbors1.map((n) => n.target_id));
    const set2 = new Set(neighbors2.map((n) => n.target_id));

    // Find intersection
    const common: string[] = [];
    set1.forEach((id) => {
      if (set2.has(id)) {
        common.push(id);
      }
    });

    // Get full node data for common connections
    const commonNodes = await Promise.all(
      common.map((id) => this.getDossierNode(id))
    );

    return commonNodes.filter((n): n is NonNullable<typeof n> => n !== null);
  }

  /**
   * Validate query complexity before execution
   * Estimates query cost based on depth and relationship count
   * @param startDossierId - Starting dossier UUID
   * @param maxDepth - Maximum depth to traverse
   * @returns Estimated complexity score and whether it's within budget
   */
  async validateComplexity(
    startDossierId: string,
    maxDepth: number
  ): Promise<{ estimated_nodes: number; within_budget: boolean }> {
    // Sample relationship count at start node
    const sample = await this.getAdjacentNodes(startDossierId, 'both');
    const avgDegree = sample.length;

    // Estimate: nodes = avgDegree^depth (exponential growth)
    const estimatedNodes = Math.pow(avgDegree, maxDepth);

    return {
      estimated_nodes: estimatedNodes,
      within_budget: estimatedNodes <= this.COMPLEXITY_BUDGET,
    };
  }
}

export default GraphService;
