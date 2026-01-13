/**
 * Graph Export Types
 * Feature: knowledge-graph-export
 *
 * TypeScript interfaces for exporting relationship graphs in standard formats:
 * - RDF (Resource Description Framework) for semantic web integration
 * - GraphML for graph analysis tools like Gephi
 * - JSON-LD (Linked Data) for linked data applications
 */

import type { DossierRelationshipType, DossierType, RelationshipStatus } from './relationship.types'

// ============================================================================
// Export Format Types
// ============================================================================

/**
 * Supported graph export formats
 */
export type GraphExportFormat = 'rdf' | 'graphml' | 'json-ld'

/**
 * RDF serialization formats
 */
export type RDFSerializationFormat = 'turtle' | 'n-triples' | 'rdf-xml'

/**
 * Export scope options
 */
export type GraphExportScope = 'full' | 'subgraph' | 'filtered'

// ============================================================================
// Export Request Types
// ============================================================================

/**
 * Request parameters for graph export
 */
export interface GraphExportRequest {
  /** Export format */
  format: GraphExportFormat
  /** Export scope */
  scope: GraphExportScope
  /** Starting dossier ID for subgraph export */
  startDossierId?: string
  /** Maximum depth for subgraph traversal (1-6, default 3) */
  maxDepth?: number
  /** Filter by relationship types */
  relationshipTypes?: DossierRelationshipType[]
  /** Filter by dossier types */
  dossierTypes?: DossierType[]
  /** Filter by relationship status */
  relationshipStatus?: RelationshipStatus[]
  /** Include inactive relationships */
  includeInactive?: boolean
  /** RDF serialization format (only for RDF export) */
  rdfFormat?: RDFSerializationFormat
  /** Base URI for RDF/JSON-LD exports */
  baseUri?: string
  /** Include dossier metadata */
  includeMetadata?: boolean
  /** Include temporal validity information */
  includeTemporalInfo?: boolean
  /** Language preference for labels */
  language?: 'en' | 'ar' | 'both'
}

/**
 * Default values for export request
 */
export const DEFAULT_GRAPH_EXPORT_REQUEST: Partial<GraphExportRequest> = {
  scope: 'full',
  maxDepth: 3,
  includeInactive: false,
  rdfFormat: 'turtle',
  baseUri: 'https://intl-dossier.gov.sa/ontology/',
  includeMetadata: true,
  includeTemporalInfo: true,
  language: 'both',
}

// ============================================================================
// Export Response Types
// ============================================================================

/**
 * Export response with file content
 */
export interface GraphExportResponse {
  /** Whether export succeeded */
  success: boolean
  /** Generated file content */
  content?: string
  /** File name */
  fileName?: string
  /** Content type (MIME) */
  contentType?: string
  /** Number of nodes exported */
  nodeCount: number
  /** Number of edges exported */
  edgeCount: number
  /** Export timestamp */
  exportedAt: string
  /** Format used */
  format: GraphExportFormat
  /** Scope used */
  scope: GraphExportScope
  /** Statistics about the export */
  stats?: GraphExportStats
  /** Error if failed */
  error?: {
    code: string
    message_en: string
    message_ar: string
  }
}

/**
 * Statistics about the exported graph
 */
export interface GraphExportStats {
  /** Breakdown by dossier type */
  dossierTypeBreakdown: Record<DossierType, number>
  /** Breakdown by relationship type */
  relationshipTypeBreakdown: Record<string, number>
  /** Number of active relationships */
  activeRelationships: number
  /** Number of historical relationships */
  historicalRelationships: number
  /** Export processing time in ms */
  processingTimeMs: number
}

// ============================================================================
// Graph Data Structures for Export
// ============================================================================

/**
 * Dossier node for export
 */
export interface ExportDossierNode {
  id: string
  type: DossierType
  name_en: string
  name_ar: string
  status: 'active' | 'inactive' | 'archived'
  summary_en?: string
  summary_ar?: string
  tags?: string[]
  sensitivity_level?: 'low' | 'medium' | 'high'
  created_at?: string
  updated_at?: string
}

/**
 * Relationship edge for export
 */
export interface ExportRelationshipEdge {
  id: string
  source_id: string
  target_id: string
  relationship_type: DossierRelationshipType
  status: RelationshipStatus
  notes_en?: string
  notes_ar?: string
  effective_from?: string
  effective_to?: string
  metadata?: Record<string, unknown>
  created_at?: string
}

/**
 * Complete graph data for export
 */
export interface ExportGraphData {
  nodes: ExportDossierNode[]
  edges: ExportRelationshipEdge[]
  metadata: {
    exportedAt: string
    exportedBy?: string
    baseUri: string
    version: string
  }
}

// ============================================================================
// RDF-Specific Types
// ============================================================================

/**
 * RDF triple for serialization
 */
export interface RDFTriple {
  subject: string
  predicate: string
  object: string
  objectType: 'uri' | 'literal' | 'blank'
  datatype?: string
  language?: string
}

/**
 * RDF namespace prefixes
 */
export interface RDFNamespaces {
  rdf: string
  rdfs: string
  owl: string
  xsd: string
  dc: string
  dcterms: string
  foaf: string
  org: string
  intl: string
}

/**
 * Default RDF namespaces
 */
export const DEFAULT_RDF_NAMESPACES: RDFNamespaces = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  dc: 'http://purl.org/dc/elements/1.1/',
  dcterms: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  org: 'http://www.w3.org/ns/org#',
  intl: 'https://intl-dossier.gov.sa/ontology/',
}

// ============================================================================
// GraphML-Specific Types
// ============================================================================

/**
 * GraphML key definition
 */
export interface GraphMLKey {
  id: string
  for: 'node' | 'edge' | 'graph'
  attrName: string
  attrType: 'string' | 'int' | 'double' | 'boolean' | 'float' | 'long'
  defaultValue?: string
}

/**
 * Default GraphML keys for nodes and edges
 */
export const DEFAULT_GRAPHML_KEYS: GraphMLKey[] = [
  // Node keys
  { id: 'd0', for: 'node', attrName: 'type', attrType: 'string' },
  { id: 'd1', for: 'node', attrName: 'name_en', attrType: 'string' },
  { id: 'd2', for: 'node', attrName: 'name_ar', attrType: 'string' },
  { id: 'd3', for: 'node', attrName: 'status', attrType: 'string' },
  { id: 'd4', for: 'node', attrName: 'summary_en', attrType: 'string' },
  { id: 'd5', for: 'node', attrName: 'summary_ar', attrType: 'string' },
  { id: 'd6', for: 'node', attrName: 'sensitivity_level', attrType: 'string' },
  { id: 'd7', for: 'node', attrName: 'tags', attrType: 'string' },
  // Edge keys
  { id: 'd8', for: 'edge', attrName: 'relationship_type', attrType: 'string' },
  { id: 'd9', for: 'edge', attrName: 'status', attrType: 'string' },
  { id: 'd10', for: 'edge', attrName: 'effective_from', attrType: 'string' },
  { id: 'd11', for: 'edge', attrName: 'effective_to', attrType: 'string' },
  { id: 'd12', for: 'edge', attrName: 'notes_en', attrType: 'string' },
  { id: 'd13', for: 'edge', attrName: 'notes_ar', attrType: 'string' },
]

// ============================================================================
// JSON-LD-Specific Types
// ============================================================================

/**
 * JSON-LD context definition
 */
export interface JSONLDContext {
  '@vocab'?: string
  '@base'?: string
  [key: string]: string | Record<string, string> | undefined
}

/**
 * JSON-LD document structure
 */
export interface JSONLDDocument {
  '@context': JSONLDContext
  '@graph': JSONLDNode[]
}

/**
 * JSON-LD node
 */
export interface JSONLDNode {
  '@id': string
  '@type': string | string[]
  [key: string]: unknown
}

/**
 * Default JSON-LD context
 */
export const DEFAULT_JSONLD_CONTEXT: JSONLDContext = {
  '@vocab': 'https://intl-dossier.gov.sa/ontology/',
  '@base': 'https://intl-dossier.gov.sa/data/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  dc: 'http://purl.org/dc/elements/1.1/',
  dcterms: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  org: 'http://www.w3.org/ns/org#',
  name_en: { '@id': 'rdfs:label', '@language': 'en' },
  name_ar: { '@id': 'rdfs:label', '@language': 'ar' },
  summary_en: { '@id': 'dc:description', '@language': 'en' },
  summary_ar: { '@id': 'dc:description', '@language': 'ar' },
  created_at: { '@id': 'dcterms:created', '@type': 'xsd:dateTime' },
  updated_at: { '@id': 'dcterms:modified', '@type': 'xsd:dateTime' },
  effective_from: { '@id': 'dcterms:valid', '@type': 'xsd:date' },
  effective_to: { '@id': 'dcterms:valid', '@type': 'xsd:date' },
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Progress state for graph export
 */
export interface GraphExportProgress {
  /** Current stage */
  stage: 'fetching' | 'processing' | 'generating' | 'complete' | 'error'
  /** Progress percentage (0-100) */
  progress: number
  /** Current node/edge count being processed */
  currentCount?: number
  /** Total count */
  totalCount?: number
  /** Status message in English */
  message_en?: string
  /** Status message in Arabic */
  message_ar?: string
}

/**
 * Options for useGraphExport hook
 */
export interface UseGraphExportOptions {
  /** Callback on export success */
  onSuccess?: (response: GraphExportResponse) => void
  /** Callback on export error */
  onError?: (error: Error) => void
  /** Callback on progress update */
  onProgress?: (progress: GraphExportProgress) => void
}

/**
 * Return type for useGraphExport hook
 */
export interface UseGraphExportReturn {
  /** Export graph function */
  exportGraph: (request: GraphExportRequest) => Promise<GraphExportResponse>
  /** Current progress */
  progress: GraphExportProgress | null
  /** Whether export is in progress */
  isExporting: boolean
  /** Last error */
  error: Error | null
  /** Reset state */
  reset: () => void
}

// ============================================================================
// Content Type Mappings
// ============================================================================

/**
 * MIME types for export formats
 */
export const GRAPH_EXPORT_CONTENT_TYPES: Record<GraphExportFormat, string> = {
  rdf: 'text/turtle',
  graphml: 'application/graphml+xml',
  'json-ld': 'application/ld+json',
}

/**
 * MIME types for RDF serialization formats
 */
export const RDF_SERIALIZATION_CONTENT_TYPES: Record<RDFSerializationFormat, string> = {
  turtle: 'text/turtle',
  'n-triples': 'application/n-triples',
  'rdf-xml': 'application/rdf+xml',
}

/**
 * File extensions for export formats
 */
export const GRAPH_EXPORT_EXTENSIONS: Record<GraphExportFormat, string> = {
  rdf: 'ttl',
  graphml: 'graphml',
  'json-ld': 'jsonld',
}

/**
 * File extensions for RDF serialization formats
 */
export const RDF_SERIALIZATION_EXTENSIONS: Record<RDFSerializationFormat, string> = {
  turtle: 'ttl',
  'n-triples': 'nt',
  'rdf-xml': 'rdf',
}
