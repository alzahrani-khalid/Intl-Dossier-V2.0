/**
 * Graph Export Edge Function
 * Feature: knowledge-graph-export
 *
 * Exports relationship graphs in standard formats:
 * - RDF (Turtle, N-Triples, RDF/XML) for semantic web integration
 * - GraphML for graph analysis tools like Gephi, Neo4j
 * - JSON-LD for linked data applications
 *
 * Supports full graph export, subgraph from starting node, and filtered exports.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { corsHeaders } from '../_shared/cors.ts';

// ============================================================================
// Types
// ============================================================================

type GraphExportFormat = 'rdf' | 'graphml' | 'json-ld';
type RDFSerializationFormat = 'turtle' | 'n-triples' | 'rdf-xml';
type GraphExportScope = 'full' | 'subgraph' | 'filtered';
type DossierType =
  | 'country'
  | 'organization'
  | 'forum'
  | 'person'
  | 'engagement'
  | 'working_group'
  | 'topic';
type RelationshipStatus = 'active' | 'historical' | 'terminated';

interface GraphExportRequest {
  format: GraphExportFormat;
  scope: GraphExportScope;
  startDossierId?: string;
  maxDepth?: number;
  relationshipTypes?: string[];
  dossierTypes?: DossierType[];
  relationshipStatus?: RelationshipStatus[];
  includeInactive?: boolean;
  rdfFormat?: RDFSerializationFormat;
  baseUri?: string;
  includeMetadata?: boolean;
  includeTemporalInfo?: boolean;
  language?: 'en' | 'ar' | 'both';
}

interface DossierNode {
  id: string;
  type: DossierType;
  name_en: string;
  name_ar: string;
  status: string;
  summary_en?: string;
  summary_ar?: string;
  tags?: string[];
  sensitivity_level?: string;
  created_at?: string;
  updated_at?: string;
}

interface RelationshipEdge {
  id: string;
  source_dossier_id: string;
  target_dossier_id: string;
  relationship_type: string;
  status: RelationshipStatus;
  notes_en?: string;
  notes_ar?: string;
  effective_from?: string;
  effective_to?: string;
  relationship_metadata?: Record<string, unknown>;
  created_at?: string;
}

// ============================================================================
// Constants
// ============================================================================

const RDF_NAMESPACES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  dc: 'http://purl.org/dc/elements/1.1/',
  dcterms: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  org: 'http://www.w3.org/ns/org#',
};

const CONTENT_TYPES: Record<string, string> = {
  turtle: 'text/turtle',
  'n-triples': 'application/n-triples',
  'rdf-xml': 'application/rdf+xml',
  graphml: 'application/graphml+xml',
  'json-ld': 'application/ld+json',
};

const FILE_EXTENSIONS: Record<string, string> = {
  turtle: 'ttl',
  'n-triples': 'nt',
  'rdf-xml': 'rdf',
  graphml: 'graphml',
  'json-ld': 'jsonld',
};

// ============================================================================
// RDF Serializers
// ============================================================================

function escapeRDFString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function generateTurtle(
  nodes: DossierNode[],
  edges: RelationshipEdge[],
  baseUri: string,
  includeMetadata: boolean,
  includeTemporalInfo: boolean,
  language: string
): string {
  const lines: string[] = [];

  // Prefixes
  lines.push(`@prefix rdf: <${RDF_NAMESPACES.rdf}> .`);
  lines.push(`@prefix rdfs: <${RDF_NAMESPACES.rdfs}> .`);
  lines.push(`@prefix owl: <${RDF_NAMESPACES.owl}> .`);
  lines.push(`@prefix xsd: <${RDF_NAMESPACES.xsd}> .`);
  lines.push(`@prefix dc: <${RDF_NAMESPACES.dc}> .`);
  lines.push(`@prefix dcterms: <${RDF_NAMESPACES.dcterms}> .`);
  lines.push(`@prefix foaf: <${RDF_NAMESPACES.foaf}> .`);
  lines.push(`@prefix org: <${RDF_NAMESPACES.org}> .`);
  lines.push(`@prefix intl: <${baseUri}> .`);
  lines.push(`@base <${baseUri}data/> .`);
  lines.push('');

  // Ontology header
  lines.push(`<${baseUri}ontology> a owl:Ontology ;`);
  lines.push(`    dc:title "Intl-Dossier Knowledge Graph"@en ;`);
  lines.push(`    dc:description "Knowledge graph of international relations and dossiers"@en ;`);
  lines.push(`    dcterms:created "${new Date().toISOString()}"^^xsd:dateTime .`);
  lines.push('');

  // Class definitions
  lines.push('# Class Definitions');
  lines.push('intl:Dossier a owl:Class ;');
  lines.push('    rdfs:label "Dossier"@en, "ملف"@ar .');
  lines.push('');

  const dossierTypeClasses = [
    'Country',
    'Organization',
    'Forum',
    'Person',
    'Engagement',
    'WorkingGroup',
    'Topic',
  ];
  dossierTypeClasses.forEach((cls) => {
    lines.push(`intl:${cls} a owl:Class ;`);
    lines.push(`    rdfs:subClassOf intl:Dossier ;`);
    lines.push(`    rdfs:label "${cls}"@en .`);
    lines.push('');
  });

  // Relationship class
  lines.push('intl:DossierRelationship a owl:Class ;');
  lines.push('    rdfs:label "Dossier Relationship"@en, "علاقة الملف"@ar .');
  lines.push('');

  // Object properties
  lines.push('# Object Properties');
  lines.push('intl:hasRelationship a owl:ObjectProperty ;');
  lines.push('    rdfs:domain intl:Dossier ;');
  lines.push('    rdfs:range intl:DossierRelationship ;');
  lines.push('    rdfs:label "has relationship"@en .');
  lines.push('');
  lines.push('intl:relatesTo a owl:ObjectProperty ;');
  lines.push('    rdfs:domain intl:DossierRelationship ;');
  lines.push('    rdfs:range intl:Dossier ;');
  lines.push('    rdfs:label "relates to"@en .');
  lines.push('');

  // Dossier instances
  lines.push('# Dossier Instances');
  nodes.forEach((node) => {
    const typeClass = toPascalCase(node.type);
    lines.push(`<dossier/${node.id}> a intl:${typeClass} ;`);

    // Labels
    if (language === 'en' || language === 'both') {
      lines.push(`    rdfs:label "${escapeRDFString(node.name_en)}"@en ;`);
    }
    if (language === 'ar' || language === 'both') {
      lines.push(`    rdfs:label "${escapeRDFString(node.name_ar)}"@ar ;`);
    }

    // Status
    lines.push(`    intl:status "${node.status}" ;`);

    // Metadata
    if (includeMetadata) {
      if (node.summary_en && (language === 'en' || language === 'both')) {
        lines.push(`    dc:description "${escapeRDFString(node.summary_en)}"@en ;`);
      }
      if (node.summary_ar && (language === 'ar' || language === 'both')) {
        lines.push(`    dc:description "${escapeRDFString(node.summary_ar)}"@ar ;`);
      }
      if (node.sensitivity_level) {
        lines.push(`    intl:sensitivityLevel "${node.sensitivity_level}" ;`);
      }
      if (node.tags && node.tags.length > 0) {
        node.tags.forEach((tag) => {
          lines.push(`    dc:subject "${escapeRDFString(tag)}" ;`);
        });
      }
    }

    // Temporal info
    if (includeTemporalInfo) {
      if (node.created_at) {
        lines.push(`    dcterms:created "${node.created_at}"^^xsd:dateTime ;`);
      }
      if (node.updated_at) {
        lines.push(`    dcterms:modified "${node.updated_at}"^^xsd:dateTime ;`);
      }
    }

    // Remove trailing semicolon and add period
    const lastIdx = lines.length - 1;
    lines[lastIdx] = lines[lastIdx].replace(/;$/, '.');
    lines.push('');
  });

  // Relationship instances
  lines.push('# Relationship Instances');
  edges.forEach((edge) => {
    lines.push(`<relationship/${edge.id}> a intl:DossierRelationship ;`);
    lines.push(`    intl:relationshipType "${edge.relationship_type}" ;`);
    lines.push(`    intl:fromDossier <dossier/${edge.source_dossier_id}> ;`);
    lines.push(`    intl:toDossier <dossier/${edge.target_dossier_id}> ;`);
    lines.push(`    intl:status "${edge.status}" ;`);

    // Notes
    if (edge.notes_en && (language === 'en' || language === 'both')) {
      lines.push(`    rdfs:comment "${escapeRDFString(edge.notes_en)}"@en ;`);
    }
    if (edge.notes_ar && (language === 'ar' || language === 'both')) {
      lines.push(`    rdfs:comment "${escapeRDFString(edge.notes_ar)}"@ar ;`);
    }

    // Temporal validity
    if (includeTemporalInfo) {
      if (edge.effective_from) {
        lines.push(`    dcterms:valid "${edge.effective_from.split('T')[0]}"^^xsd:date ;`);
      }
      if (edge.effective_to) {
        lines.push(`    intl:validUntil "${edge.effective_to.split('T')[0]}"^^xsd:date ;`);
      }
      if (edge.created_at) {
        lines.push(`    dcterms:created "${edge.created_at}"^^xsd:dateTime ;`);
      }
    }

    const lastIdx = lines.length - 1;
    lines[lastIdx] = lines[lastIdx].replace(/;$/, '.');
    lines.push('');
  });

  // Direct relationship predicates
  lines.push('# Direct Relationship Predicates');
  edges.forEach((edge) => {
    const predicate = toCamelCase(edge.relationship_type);
    lines.push(
      `<dossier/${edge.source_dossier_id}> intl:${predicate} <dossier/${edge.target_dossier_id}> .`
    );
  });

  return lines.join('\n');
}

function generateNTriples(
  nodes: DossierNode[],
  edges: RelationshipEdge[],
  baseUri: string,
  includeMetadata: boolean,
  includeTemporalInfo: boolean,
  language: string
): string {
  const triples: string[] = [];
  const dataBase = `${baseUri}data/`;

  // Helper to create triple
  const triple = (
    s: string,
    p: string,
    o: string,
    isLiteral = false,
    lang?: string,
    datatype?: string
  ) => {
    if (isLiteral) {
      if (lang) {
        triples.push(`<${s}> <${p}> "${escapeRDFString(o)}"@${lang} .`);
      } else if (datatype) {
        triples.push(`<${s}> <${p}> "${escapeRDFString(o)}"^^<${datatype}> .`);
      } else {
        triples.push(`<${s}> <${p}> "${escapeRDFString(o)}" .`);
      }
    } else {
      triples.push(`<${s}> <${p}> <${o}> .`);
    }
  };

  // Dossier nodes
  nodes.forEach((node) => {
    const nodeUri = `${dataBase}dossier/${node.id}`;
    const typeClass = toPascalCase(node.type);

    triple(nodeUri, RDF_NAMESPACES.rdf + 'type', `${baseUri}${typeClass}`);

    if (language === 'en' || language === 'both') {
      triple(nodeUri, RDF_NAMESPACES.rdfs + 'label', node.name_en, true, 'en');
    }
    if (language === 'ar' || language === 'both') {
      triple(nodeUri, RDF_NAMESPACES.rdfs + 'label', node.name_ar, true, 'ar');
    }

    triple(nodeUri, `${baseUri}status`, node.status, true);

    if (includeMetadata) {
      if (node.summary_en && (language === 'en' || language === 'both')) {
        triple(nodeUri, RDF_NAMESPACES.dc + 'description', node.summary_en, true, 'en');
      }
      if (node.summary_ar && (language === 'ar' || language === 'both')) {
        triple(nodeUri, RDF_NAMESPACES.dc + 'description', node.summary_ar, true, 'ar');
      }
    }

    if (includeTemporalInfo && node.created_at) {
      triple(
        nodeUri,
        RDF_NAMESPACES.dcterms + 'created',
        node.created_at,
        true,
        undefined,
        RDF_NAMESPACES.xsd + 'dateTime'
      );
    }
  });

  // Relationship edges
  edges.forEach((edge) => {
    const edgeUri = `${dataBase}relationship/${edge.id}`;
    const sourceUri = `${dataBase}dossier/${edge.source_dossier_id}`;
    const targetUri = `${dataBase}dossier/${edge.target_dossier_id}`;

    triple(edgeUri, RDF_NAMESPACES.rdf + 'type', `${baseUri}DossierRelationship`);
    triple(edgeUri, `${baseUri}fromDossier`, sourceUri);
    triple(edgeUri, `${baseUri}toDossier`, targetUri);
    triple(edgeUri, `${baseUri}relationshipType`, edge.relationship_type, true);
    triple(edgeUri, `${baseUri}status`, edge.status, true);

    // Direct predicate
    const predicate = toCamelCase(edge.relationship_type);
    triple(sourceUri, `${baseUri}${predicate}`, targetUri);
  });

  return triples.join('\n');
}

function generateRDFXML(
  nodes: DossierNode[],
  edges: RelationshipEdge[],
  baseUri: string,
  includeMetadata: boolean,
  includeTemporalInfo: boolean,
  language: string
): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<rdf:RDF');
  lines.push(`    xmlns:rdf="${RDF_NAMESPACES.rdf}"`);
  lines.push(`    xmlns:rdfs="${RDF_NAMESPACES.rdfs}"`);
  lines.push(`    xmlns:owl="${RDF_NAMESPACES.owl}"`);
  lines.push(`    xmlns:xsd="${RDF_NAMESPACES.xsd}"`);
  lines.push(`    xmlns:dc="${RDF_NAMESPACES.dc}"`);
  lines.push(`    xmlns:dcterms="${RDF_NAMESPACES.dcterms}"`);
  lines.push(`    xmlns:intl="${baseUri}"`);
  lines.push(`    xml:base="${baseUri}data/">`);
  lines.push('');

  // Dossier nodes
  nodes.forEach((node) => {
    const typeClass = toPascalCase(node.type);
    lines.push(`  <intl:${typeClass} rdf:about="dossier/${node.id}">`);

    if (language === 'en' || language === 'both') {
      lines.push(`    <rdfs:label xml:lang="en">${escapeXML(node.name_en)}</rdfs:label>`);
    }
    if (language === 'ar' || language === 'both') {
      lines.push(`    <rdfs:label xml:lang="ar">${escapeXML(node.name_ar)}</rdfs:label>`);
    }

    lines.push(`    <intl:status>${node.status}</intl:status>`);

    if (includeMetadata) {
      if (node.summary_en && (language === 'en' || language === 'both')) {
        lines.push(
          `    <dc:description xml:lang="en">${escapeXML(node.summary_en)}</dc:description>`
        );
      }
      if (node.summary_ar && (language === 'ar' || language === 'both')) {
        lines.push(
          `    <dc:description xml:lang="ar">${escapeXML(node.summary_ar)}</dc:description>`
        );
      }
    }

    if (includeTemporalInfo && node.created_at) {
      lines.push(
        `    <dcterms:created rdf:datatype="${RDF_NAMESPACES.xsd}dateTime">${node.created_at}</dcterms:created>`
      );
    }

    lines.push(`  </intl:${typeClass}>`);
    lines.push('');
  });

  // Relationship edges
  edges.forEach((edge) => {
    lines.push(`  <intl:DossierRelationship rdf:about="relationship/${edge.id}">`);
    lines.push(`    <intl:fromDossier rdf:resource="dossier/${edge.source_dossier_id}"/>`);
    lines.push(`    <intl:toDossier rdf:resource="dossier/${edge.target_dossier_id}"/>`);
    lines.push(`    <intl:relationshipType>${edge.relationship_type}</intl:relationshipType>`);
    lines.push(`    <intl:status>${edge.status}</intl:status>`);

    if (edge.notes_en && (language === 'en' || language === 'both')) {
      lines.push(`    <rdfs:comment xml:lang="en">${escapeXML(edge.notes_en)}</rdfs:comment>`);
    }
    if (edge.notes_ar && (language === 'ar' || language === 'both')) {
      lines.push(`    <rdfs:comment xml:lang="ar">${escapeXML(edge.notes_ar)}</rdfs:comment>`);
    }

    if (includeTemporalInfo) {
      if (edge.effective_from) {
        lines.push(
          `    <dcterms:valid rdf:datatype="${RDF_NAMESPACES.xsd}date">${edge.effective_from.split('T')[0]}</dcterms:valid>`
        );
      }
    }

    lines.push(`  </intl:DossierRelationship>`);
    lines.push('');
  });

  lines.push('</rdf:RDF>');

  return lines.join('\n');
}

// ============================================================================
// GraphML Generator
// ============================================================================

function generateGraphML(
  nodes: DossierNode[],
  edges: RelationshipEdge[],
  includeMetadata: boolean,
  includeTemporalInfo: boolean,
  language: string
): string {
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<graphml xmlns="http://graphml.graphdrawing.org/xmlns"');
  lines.push('    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
  lines.push('    xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns');
  lines.push('    http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">');
  lines.push('');

  // Key definitions
  lines.push('  <!-- Node attributes -->');
  lines.push('  <key id="d0" for="node" attr.name="type" attr.type="string"/>');
  lines.push('  <key id="d1" for="node" attr.name="name_en" attr.type="string"/>');
  lines.push('  <key id="d2" for="node" attr.name="name_ar" attr.type="string"/>');
  lines.push('  <key id="d3" for="node" attr.name="status" attr.type="string"/>');

  if (includeMetadata) {
    lines.push('  <key id="d4" for="node" attr.name="summary_en" attr.type="string"/>');
    lines.push('  <key id="d5" for="node" attr.name="summary_ar" attr.type="string"/>');
    lines.push('  <key id="d6" for="node" attr.name="sensitivity_level" attr.type="string"/>');
    lines.push('  <key id="d7" for="node" attr.name="tags" attr.type="string"/>');
  }

  if (includeTemporalInfo) {
    lines.push('  <key id="d8" for="node" attr.name="created_at" attr.type="string"/>');
    lines.push('  <key id="d9" for="node" attr.name="updated_at" attr.type="string"/>');
  }

  lines.push('');
  lines.push('  <!-- Edge attributes -->');
  lines.push('  <key id="e0" for="edge" attr.name="relationship_type" attr.type="string"/>');
  lines.push('  <key id="e1" for="edge" attr.name="status" attr.type="string"/>');

  if (language === 'en' || language === 'both') {
    lines.push('  <key id="e2" for="edge" attr.name="notes_en" attr.type="string"/>');
  }
  if (language === 'ar' || language === 'both') {
    lines.push('  <key id="e3" for="edge" attr.name="notes_ar" attr.type="string"/>');
  }

  if (includeTemporalInfo) {
    lines.push('  <key id="e4" for="edge" attr.name="effective_from" attr.type="string"/>');
    lines.push('  <key id="e5" for="edge" attr.name="effective_to" attr.type="string"/>');
    lines.push('  <key id="e6" for="edge" attr.name="created_at" attr.type="string"/>');
  }

  lines.push('');
  lines.push('  <graph id="G" edgedefault="directed">');
  lines.push('');

  // Nodes
  lines.push('    <!-- Dossier Nodes -->');
  nodes.forEach((node) => {
    lines.push(`    <node id="${node.id}">`);
    lines.push(`      <data key="d0">${escapeXML(node.type)}</data>`);

    if (language === 'en' || language === 'both') {
      lines.push(`      <data key="d1">${escapeXML(node.name_en)}</data>`);
    }
    if (language === 'ar' || language === 'both') {
      lines.push(`      <data key="d2">${escapeXML(node.name_ar)}</data>`);
    }

    lines.push(`      <data key="d3">${node.status}</data>`);

    if (includeMetadata) {
      if (node.summary_en && (language === 'en' || language === 'both')) {
        lines.push(`      <data key="d4">${escapeXML(node.summary_en)}</data>`);
      }
      if (node.summary_ar && (language === 'ar' || language === 'both')) {
        lines.push(`      <data key="d5">${escapeXML(node.summary_ar)}</data>`);
      }
      if (node.sensitivity_level) {
        lines.push(`      <data key="d6">${node.sensitivity_level}</data>`);
      }
      if (node.tags && node.tags.length > 0) {
        lines.push(`      <data key="d7">${escapeXML(node.tags.join(', '))}</data>`);
      }
    }

    if (includeTemporalInfo) {
      if (node.created_at) {
        lines.push(`      <data key="d8">${node.created_at}</data>`);
      }
      if (node.updated_at) {
        lines.push(`      <data key="d9">${node.updated_at}</data>`);
      }
    }

    lines.push('    </node>');
  });

  lines.push('');
  lines.push('    <!-- Relationship Edges -->');

  // Edges
  edges.forEach((edge) => {
    lines.push(
      `    <edge id="${edge.id}" source="${edge.source_dossier_id}" target="${edge.target_dossier_id}">`
    );
    lines.push(`      <data key="e0">${escapeXML(edge.relationship_type)}</data>`);
    lines.push(`      <data key="e1">${edge.status}</data>`);

    if (edge.notes_en && (language === 'en' || language === 'both')) {
      lines.push(`      <data key="e2">${escapeXML(edge.notes_en)}</data>`);
    }
    if (edge.notes_ar && (language === 'ar' || language === 'both')) {
      lines.push(`      <data key="e3">${escapeXML(edge.notes_ar)}</data>`);
    }

    if (includeTemporalInfo) {
      if (edge.effective_from) {
        lines.push(`      <data key="e4">${edge.effective_from.split('T')[0]}</data>`);
      }
      if (edge.effective_to) {
        lines.push(`      <data key="e5">${edge.effective_to.split('T')[0]}</data>`);
      }
      if (edge.created_at) {
        lines.push(`      <data key="e6">${edge.created_at}</data>`);
      }
    }

    lines.push('    </edge>');
  });

  lines.push('');
  lines.push('  </graph>');
  lines.push('</graphml>');

  return lines.join('\n');
}

// ============================================================================
// JSON-LD Generator
// ============================================================================

function generateJSONLD(
  nodes: DossierNode[],
  edges: RelationshipEdge[],
  baseUri: string,
  includeMetadata: boolean,
  includeTemporalInfo: boolean,
  language: string
): string {
  const context: Record<string, unknown> = {
    '@vocab': baseUri,
    '@base': `${baseUri}data/`,
    rdf: RDF_NAMESPACES.rdf,
    rdfs: RDF_NAMESPACES.rdfs,
    xsd: RDF_NAMESPACES.xsd,
    dc: RDF_NAMESPACES.dc,
    dcterms: RDF_NAMESPACES.dcterms,
    foaf: RDF_NAMESPACES.foaf,
    org: RDF_NAMESPACES.org,
    name_en: { '@id': 'rdfs:label', '@language': 'en' },
    name_ar: { '@id': 'rdfs:label', '@language': 'ar' },
    summary_en: { '@id': 'dc:description', '@language': 'en' },
    summary_ar: { '@id': 'dc:description', '@language': 'ar' },
    created_at: { '@id': 'dcterms:created', '@type': 'xsd:dateTime' },
    updated_at: { '@id': 'dcterms:modified', '@type': 'xsd:dateTime' },
    effective_from: { '@id': 'dcterms:valid', '@type': 'xsd:date' },
    effective_to: { '@type': 'xsd:date' },
    fromDossier: { '@type': '@id' },
    toDossier: { '@type': '@id' },
  };

  const graph: unknown[] = [];

  // Add dossier nodes
  nodes.forEach((node) => {
    const nodeObj: Record<string, unknown> = {
      '@id': `dossier/${node.id}`,
      '@type': toPascalCase(node.type),
      status: node.status,
    };

    if (language === 'en' || language === 'both') {
      nodeObj.name_en = node.name_en;
    }
    if (language === 'ar' || language === 'both') {
      nodeObj.name_ar = node.name_ar;
    }

    if (includeMetadata) {
      if (node.summary_en && (language === 'en' || language === 'both')) {
        nodeObj.summary_en = node.summary_en;
      }
      if (node.summary_ar && (language === 'ar' || language === 'both')) {
        nodeObj.summary_ar = node.summary_ar;
      }
      if (node.sensitivity_level) {
        nodeObj.sensitivityLevel = node.sensitivity_level;
      }
      if (node.tags && node.tags.length > 0) {
        nodeObj.tags = node.tags;
      }
    }

    if (includeTemporalInfo) {
      if (node.created_at) {
        nodeObj.created_at = node.created_at;
      }
      if (node.updated_at) {
        nodeObj.updated_at = node.updated_at;
      }
    }

    graph.push(nodeObj);
  });

  // Add relationship edges
  edges.forEach((edge) => {
    const edgeObj: Record<string, unknown> = {
      '@id': `relationship/${edge.id}`,
      '@type': 'DossierRelationship',
      relationshipType: edge.relationship_type,
      fromDossier: `dossier/${edge.source_dossier_id}`,
      toDossier: `dossier/${edge.target_dossier_id}`,
      status: edge.status,
    };

    if (edge.notes_en && (language === 'en' || language === 'both')) {
      edgeObj.notes_en = edge.notes_en;
    }
    if (edge.notes_ar && (language === 'ar' || language === 'both')) {
      edgeObj.notes_ar = edge.notes_ar;
    }

    if (includeTemporalInfo) {
      if (edge.effective_from) {
        edgeObj.effective_from = edge.effective_from.split('T')[0];
      }
      if (edge.effective_to) {
        edgeObj.effective_to = edge.effective_to.split('T')[0];
      }
      if (edge.created_at) {
        edgeObj.created_at = edge.created_at;
      }
    }

    graph.push(edgeObj);
  });

  const document = {
    '@context': context,
    '@graph': graph,
  };

  return JSON.stringify(document, null, 2);
}

// ============================================================================
// Helper Functions
// ============================================================================

function toPascalCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// Data Fetching
// ============================================================================

async function fetchGraphData(
  supabase: ReturnType<typeof createClient>,
  request: GraphExportRequest
): Promise<{ nodes: DossierNode[]; edges: RelationshipEdge[] }> {
  const startTime = Date.now();

  // Build dossier query
  let dossierQuery = supabase
    .from('dossiers')
    .select(
      'id, type, name_en, name_ar, status, summary_en, summary_ar, tags, sensitivity_level, created_at, updated_at'
    );

  // Apply dossier type filter
  if (request.dossierTypes && request.dossierTypes.length > 0) {
    dossierQuery = dossierQuery.in('type', request.dossierTypes);
  }

  // Build relationship query
  let relationshipQuery = supabase
    .from('dossier_relationships')
    .select(
      'id, source_dossier_id, target_dossier_id, relationship_type, status, notes_en, notes_ar, effective_from, effective_to, relationship_metadata, created_at'
    );

  // Apply relationship filters
  if (request.relationshipTypes && request.relationshipTypes.length > 0) {
    relationshipQuery = relationshipQuery.in('relationship_type', request.relationshipTypes);
  }

  if (!request.includeInactive) {
    relationshipQuery = relationshipQuery.eq('status', 'active');
  } else if (request.relationshipStatus && request.relationshipStatus.length > 0) {
    relationshipQuery = relationshipQuery.in('status', request.relationshipStatus);
  }

  // Handle subgraph scope
  if (request.scope === 'subgraph' && request.startDossierId) {
    // Use recursive traversal for subgraph
    const maxDepth = Math.min(request.maxDepth || 3, 6);
    const visitedIds = new Set<string>();
    const nodesToProcess = [request.startDossierId];
    let currentDepth = 0;

    while (nodesToProcess.length > 0 && currentDepth < maxDepth) {
      const currentBatch = [...nodesToProcess];
      nodesToProcess.length = 0;

      for (const id of currentBatch) {
        if (visitedIds.has(id)) continue;
        visitedIds.add(id);

        // Fetch relationships for this node
        const { data: rels } = await supabase
          .from('dossier_relationships')
          .select('source_dossier_id, target_dossier_id')
          .or(`source_dossier_id.eq.${id},target_dossier_id.eq.${id}`)
          .eq('status', request.includeInactive ? 'status' : 'active');

        if (rels) {
          for (const rel of rels) {
            if (!visitedIds.has(rel.source_dossier_id)) {
              nodesToProcess.push(rel.source_dossier_id);
            }
            if (!visitedIds.has(rel.target_dossier_id)) {
              nodesToProcess.push(rel.target_dossier_id);
            }
          }
        }
      }

      currentDepth++;
    }

    const dossierIds = Array.from(visitedIds);

    if (dossierIds.length > 0) {
      dossierQuery = dossierQuery.in('id', dossierIds);
      relationshipQuery = relationshipQuery
        .in('source_dossier_id', dossierIds)
        .in('target_dossier_id', dossierIds);
    }
  }

  // Execute queries
  const [dossierResult, relationshipResult] = await Promise.all([
    dossierQuery.limit(10000),
    relationshipQuery.limit(50000),
  ]);

  if (dossierResult.error) {
    throw new Error(`Failed to fetch dossiers: ${dossierResult.error.message}`);
  }

  if (relationshipResult.error) {
    throw new Error(`Failed to fetch relationships: ${relationshipResult.error.message}`);
  }

  const nodes = (dossierResult.data || []) as DossierNode[];
  const edges = (relationshipResult.data || []) as RelationshipEdge[];

  // For full export, filter edges to only include those between fetched nodes
  const nodeIds = new Set(nodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => nodeIds.has(e.source_dossier_id) && nodeIds.has(e.target_dossier_id)
  );

  console.log(
    `Fetched ${nodes.length} nodes and ${filteredEdges.length} edges in ${Date.now() - startTime}ms`
  );

  return { nodes, edges: filteredEdges };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message_en: 'Only POST method is allowed',
          message_ar: 'يسمح فقط بطريقة POST',
        },
      }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const startTime = Date.now();

    // Auth verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Missing authorization header',
            message_ar: 'رأس التفويض مفقود',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message_en: 'Invalid or expired token',
            message_ar: 'الرمز غير صالح أو منتهي الصلاحية',
          },
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const request: GraphExportRequest = await req.json();

    // Validate format
    if (!['rdf', 'graphml', 'json-ld'].includes(request.format)) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_FORMAT',
            message_en: `Invalid export format: ${request.format}. Supported formats: rdf, graphml, json-ld`,
            message_ar: `تنسيق التصدير غير صالح: ${request.format}. التنسيقات المدعومة: rdf, graphml, json-ld`,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply defaults
    const fullRequest: GraphExportRequest = {
      format: request.format,
      scope: request.scope || 'full',
      startDossierId: request.startDossierId,
      maxDepth: request.maxDepth || 3,
      relationshipTypes: request.relationshipTypes,
      dossierTypes: request.dossierTypes,
      relationshipStatus: request.relationshipStatus,
      includeInactive: request.includeInactive ?? false,
      rdfFormat: request.rdfFormat || 'turtle',
      baseUri: request.baseUri || 'https://intl-dossier.gov.sa/ontology/',
      includeMetadata: request.includeMetadata ?? true,
      includeTemporalInfo: request.includeTemporalInfo ?? true,
      language: request.language || 'both',
    };

    // Fetch graph data
    const { nodes, edges } = await fetchGraphData(supabaseClient, fullRequest);

    // Generate export content
    let content: string;
    let contentType: string;
    let fileExtension: string;

    switch (fullRequest.format) {
      case 'rdf': {
        const rdfFormat = fullRequest.rdfFormat || 'turtle';
        switch (rdfFormat) {
          case 'n-triples':
            content = generateNTriples(
              nodes,
              edges,
              fullRequest.baseUri!,
              fullRequest.includeMetadata!,
              fullRequest.includeTemporalInfo!,
              fullRequest.language!
            );
            break;
          case 'rdf-xml':
            content = generateRDFXML(
              nodes,
              edges,
              fullRequest.baseUri!,
              fullRequest.includeMetadata!,
              fullRequest.includeTemporalInfo!,
              fullRequest.language!
            );
            break;
          case 'turtle':
          default:
            content = generateTurtle(
              nodes,
              edges,
              fullRequest.baseUri!,
              fullRequest.includeMetadata!,
              fullRequest.includeTemporalInfo!,
              fullRequest.language!
            );
            break;
        }
        contentType = CONTENT_TYPES[rdfFormat];
        fileExtension = FILE_EXTENSIONS[rdfFormat];
        break;
      }

      case 'graphml':
        content = generateGraphML(
          nodes,
          edges,
          fullRequest.includeMetadata!,
          fullRequest.includeTemporalInfo!,
          fullRequest.language!
        );
        contentType = CONTENT_TYPES.graphml;
        fileExtension = FILE_EXTENSIONS.graphml;
        break;

      case 'json-ld':
        content = generateJSONLD(
          nodes,
          edges,
          fullRequest.baseUri!,
          fullRequest.includeMetadata!,
          fullRequest.includeTemporalInfo!,
          fullRequest.language!
        );
        contentType = CONTENT_TYPES['json-ld'];
        fileExtension = FILE_EXTENSIONS['json-ld'];
        break;

      default:
        throw new Error(`Unsupported format: ${fullRequest.format}`);
    }

    // Calculate statistics
    const dossierTypeBreakdown: Record<string, number> = {};
    nodes.forEach((node) => {
      dossierTypeBreakdown[node.type] = (dossierTypeBreakdown[node.type] || 0) + 1;
    });

    const relationshipTypeBreakdown: Record<string, number> = {};
    let activeCount = 0;
    let historicalCount = 0;
    edges.forEach((edge) => {
      relationshipTypeBreakdown[edge.relationship_type] =
        (relationshipTypeBreakdown[edge.relationship_type] || 0) + 1;
      if (edge.status === 'active') {
        activeCount++;
      } else {
        historicalCount++;
      }
    });

    const processingTimeMs = Date.now() - startTime;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `knowledge_graph_export_${timestamp}.${fileExtension}`;

    return new Response(
      JSON.stringify({
        success: true,
        content,
        fileName,
        contentType,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        exportedAt: new Date().toISOString(),
        format: fullRequest.format,
        scope: fullRequest.scope,
        stats: {
          dossierTypeBreakdown,
          relationshipTypeBreakdown,
          activeRelationships: activeCount,
          historicalRelationships: historicalCount,
          processingTimeMs,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Graph export error:', error);

    return new Response(
      JSON.stringify({
        error: {
          code: 'EXPORT_ERROR',
          message_en:
            error instanceof Error ? error.message : 'An error occurred during graph export',
          message_ar: 'حدث خطأ أثناء تصدير الرسم البياني',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
