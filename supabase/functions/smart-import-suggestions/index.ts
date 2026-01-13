/**
 * Smart Import Suggestions Edge Function
 *
 * Provides smart import suggestions for empty sections by detecting
 * available data sources and offering preview/import capabilities.
 *
 * Endpoints:
 * - GET /suggestions - Get available data sources for a section
 * - POST /preview - Preview items from a data source
 * - POST /execute - Execute import of selected items
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface DataSourceInfo {
  id: string;
  type: string;
  itemCount: number;
}

interface ImportableItem {
  id: string;
  sourceId: string;
  sourceType: string;
  title: string;
  titleAr?: string;
  preview?: string;
  rawData: Record<string, unknown>;
  mappedData?: Record<string, unknown>;
  mappingConfidence?: number;
  timestamp?: string;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  displayName: string;
  isRequired: boolean;
  isAutoMapped: boolean;
  transform?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/smart-import-suggestions', '');

    // GET /suggestions - Get available data sources
    if (req.method === 'GET' && path === '/suggestions') {
      const section = url.searchParams.get('section');
      const entityId = url.searchParams.get('entityId');
      const entityType = url.searchParams.get('entityType');

      if (!section || !entityId || !entityType) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const dataSources = await getDataSourcesWithCounts(supabase, user.id, section, entityId);

      return new Response(JSON.stringify({ dataSources }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /preview - Preview items from a data source
    if (req.method === 'POST' && path === '/preview') {
      const body = await req.json();
      const { sourceId, sourceType, targetSection, entityId, entityType, limit = 50 } = body;

      if (!sourceId || !sourceType || !targetSection) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const preview = await generatePreview(
        supabase,
        user.id,
        sourceId,
        sourceType,
        targetSection,
        entityId,
        limit
      );

      return new Response(JSON.stringify(preview), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /execute - Execute import
    if (req.method === 'POST' && path === '/execute') {
      const body = await req.json();
      const {
        sourceId,
        sourceType,
        targetSection,
        entityId,
        entityType,
        itemIds,
        fieldMappings,
        skipErrors = true,
        updateExisting = false,
      } = body;

      if (!sourceId || !targetSection || !entityId || !itemIds || itemIds.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await executeImport(
        supabase,
        user.id,
        sourceId,
        sourceType,
        targetSection,
        entityId,
        entityType,
        itemIds,
        fieldMappings,
        skipErrors,
        updateExisting
      );

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Smart import error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Get data sources with item counts
 */
async function getDataSourcesWithCounts(
  supabase: any,
  userId: string,
  section: string,
  entityId: string
): Promise<DataSourceInfo[]> {
  const dataSources: DataSourceInfo[] = [];

  // Check calendar connections for events section
  if (section === 'events') {
    const { data: connections } = await supabase
      .from('external_calendar_connections')
      .select('id, provider')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (connections) {
      for (const conn of connections) {
        // Count events from external calendars
        const { count } = await supabase
          .from('external_calendar_events')
          .select('*', { count: 'exact', head: true })
          .eq('connection_id', conn.id);

        dataSources.push({
          id: `calendar-${conn.id}`,
          type: 'calendar',
          itemCount: count || 0,
        });
      }
    }
  }

  // Check existing documents for documents section
  if (section === 'documents') {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .neq('entity_id', entityId);

    dataSources.push({
      id: 'existing-documents',
      type: 'document',
      itemCount: count || 0,
    });
  }

  // Check related dossiers for relationships section
  if (section === 'relationships' || section === 'contacts' || section === 'briefs') {
    const { count } = await supabase
      .from('dossiers')
      .select('*', { count: 'exact', head: true })
      .neq('id', entityId);

    dataSources.push({
      id: 'related-dossiers',
      type: 'existing_dossier',
      itemCount: count || 0,
    });
  }

  // Check email contacts
  if (section === 'contacts') {
    // For email contacts, we'd check email threads for extracted contacts
    // This is a placeholder - actual implementation would scan email signatures
    dataSources.push({
      id: 'email-contacts',
      type: 'email_signature',
      itemCount: 0, // Would be populated from email analysis
    });
  }

  return dataSources;
}

/**
 * Generate preview for a data source
 */
async function generatePreview(
  supabase: any,
  userId: string,
  sourceId: string,
  sourceType: string,
  targetSection: string,
  entityId: string,
  limit: number
): Promise<{
  items: ImportableItem[];
  fieldMappings: FieldMapping[];
  totalCount: number;
  hasMore: boolean;
  generatedAt: string;
  warnings?: string[];
}> {
  let items: ImportableItem[] = [];
  let fieldMappings: FieldMapping[] = [];
  let totalCount = 0;
  const warnings: string[] = [];

  // Handle existing documents source
  if (sourceType === 'document' && sourceId === 'existing-documents') {
    const { data: documents, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .neq('entity_id', entityId)
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    items = (documents || []).map((doc: any) => ({
      id: doc.id,
      sourceId,
      sourceType,
      title: doc.file_name,
      preview: `${formatFileSize(doc.size_bytes)} - ${doc.mime_type}`,
      rawData: doc,
      mappedData: {
        file_name: doc.file_name,
        file_path: doc.file_path,
        mime_type: doc.mime_type,
        size_bytes: doc.size_bytes,
      },
      mappingConfidence: 1.0,
      timestamp: doc.uploaded_at,
    }));

    fieldMappings = [
      {
        sourceField: 'file_name',
        targetField: 'file_name',
        displayName: 'File Name',
        isRequired: true,
        isAutoMapped: true,
      },
      {
        sourceField: 'file_path',
        targetField: 'file_path',
        displayName: 'File Path',
        isRequired: true,
        isAutoMapped: true,
      },
      {
        sourceField: 'mime_type',
        targetField: 'mime_type',
        displayName: 'MIME Type',
        isRequired: true,
        isAutoMapped: true,
      },
      {
        sourceField: 'size_bytes',
        targetField: 'size_bytes',
        displayName: 'File Size',
        isRequired: false,
        isAutoMapped: true,
      },
    ];

    totalCount = count || 0;
  }

  // Handle related dossiers source
  if (sourceType === 'existing_dossier' && sourceId === 'related-dossiers') {
    const { data: dossiers, count } = await supabase
      .from('dossiers')
      .select('id, name, name_ar, dossier_type, created_at', { count: 'exact' })
      .neq('id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    items = (dossiers || []).map((dossier: any) => ({
      id: dossier.id,
      sourceId,
      sourceType,
      title: dossier.name,
      titleAr: dossier.name_ar,
      preview: dossier.dossier_type,
      rawData: dossier,
      mappedData: {
        target_dossier_id: dossier.id,
        relationship_type: 'related_to',
      },
      mappingConfidence: 0.8,
      timestamp: dossier.created_at,
    }));

    fieldMappings = [
      {
        sourceField: 'id',
        targetField: 'target_dossier_id',
        displayName: 'Related Dossier',
        isRequired: true,
        isAutoMapped: true,
      },
      {
        sourceField: 'relationship_type',
        targetField: 'relationship_type',
        displayName: 'Relationship Type',
        isRequired: true,
        isAutoMapped: true,
      },
      {
        sourceField: 'description',
        targetField: 'description',
        displayName: 'Description',
        isRequired: false,
        isAutoMapped: false,
      },
    ];

    totalCount = count || 0;
  }

  // Handle calendar events source
  if (sourceType === 'calendar') {
    const connectionId = sourceId.replace('calendar-', '');
    const { data: events, count } = await supabase
      .from('external_calendar_events')
      .select('*', { count: 'exact' })
      .eq('connection_id', connectionId)
      .order('start_time', { ascending: true })
      .limit(limit);

    items = (events || []).map((event: any) => ({
      id: event.id,
      sourceId,
      sourceType,
      title: event.summary || event.title,
      preview: event.location || formatDateRange(event.start_time, event.end_time),
      rawData: event,
      mappedData: {
        title: event.summary || event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        description: event.description,
        location: event.location,
      },
      mappingConfidence: 0.95,
      timestamp: event.start_time,
    }));

    fieldMappings = [
      {
        sourceField: 'summary',
        targetField: 'title',
        displayName: 'Event Title',
        isRequired: true,
        isAutoMapped: true,
      },
      {
        sourceField: 'start_time',
        targetField: 'start_time',
        displayName: 'Start Time',
        isRequired: true,
        isAutoMapped: true,
        transform: 'parse_date',
      },
      {
        sourceField: 'end_time',
        targetField: 'end_time',
        displayName: 'End Time',
        isRequired: true,
        isAutoMapped: true,
        transform: 'parse_date',
      },
      {
        sourceField: 'description',
        targetField: 'description',
        displayName: 'Description',
        isRequired: false,
        isAutoMapped: true,
      },
      {
        sourceField: 'location',
        targetField: 'location',
        displayName: 'Location',
        isRequired: false,
        isAutoMapped: true,
      },
    ];

    totalCount = count || 0;
  }

  return {
    items,
    fieldMappings,
    totalCount,
    hasMore: items.length >= limit,
    generatedAt: new Date().toISOString(),
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Execute import of selected items
 */
async function executeImport(
  supabase: any,
  userId: string,
  sourceId: string,
  sourceType: string,
  targetSection: string,
  entityId: string,
  entityType: string,
  itemIds: string[],
  fieldMappings: FieldMapping[],
  skipErrors: boolean,
  updateExisting: boolean
): Promise<{
  success: boolean;
  results: Array<{
    itemId: string;
    success: boolean;
    recordId?: string;
    action?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  completedAt: string;
  error?: string;
}> {
  const results: Array<{
    itemId: string;
    success: boolean;
    recordId?: string;
    action?: string;
    error?: string;
  }> = [];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Get the items to import
  const preview = await generatePreview(
    supabase,
    userId,
    sourceId,
    sourceType,
    targetSection,
    entityId,
    1000 // Get all items
  );

  const itemsToImport = preview.items.filter((item) => itemIds.includes(item.id));

  for (const item of itemsToImport) {
    try {
      // Apply field mappings to get final data
      const importData: Record<string, unknown> = {};
      for (const mapping of fieldMappings) {
        const value = item.rawData[mapping.sourceField] || item.mappedData?.[mapping.targetField];
        if (value !== undefined) {
          importData[mapping.targetField] = applyTransform(value, mapping.transform);
        }
      }

      // Add entity reference
      importData.entity_id = entityId;
      importData.entity_type = entityType;
      importData.created_by = userId;

      // Determine target table based on section
      let table = '';
      switch (targetSection) {
        case 'documents':
          table = 'documents';
          break;
        case 'events':
          table = 'calendar_entries';
          break;
        case 'relationships':
          table = 'dossier_relationships';
          // For relationships, set source_dossier_id
          importData.source_dossier_id = entityId;
          break;
        case 'contacts':
          // Contacts are stored as person dossiers + relationships
          table = 'dossier_relationships';
          importData.source_dossier_id = entityId;
          importData.relationship_type = 'has_contact';
          break;
        default:
          throw new Error(`Unknown target section: ${targetSection}`);
      }

      // Insert the record
      const { data, error } = await supabase.from(table).insert(importData).select('id').single();

      if (error) {
        if (skipErrors) {
          failed++;
          results.push({
            itemId: item.id,
            success: false,
            error: error.message,
          });
          continue;
        }
        throw error;
      }

      created++;
      results.push({
        itemId: item.id,
        success: true,
        recordId: data.id,
        action: 'created',
      });
    } catch (error) {
      failed++;
      results.push({
        itemId: item.id,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    success: failed === 0 || (skipErrors && created > 0),
    results,
    summary: {
      total: itemsToImport.length,
      created,
      updated,
      skipped,
      failed,
    },
    completedAt: new Date().toISOString(),
  };
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}

function applyTransform(value: unknown, transform?: string): unknown {
  if (!transform || transform === 'none' || value === undefined || value === null) {
    return value;
  }

  switch (transform) {
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'parse_date':
      return typeof value === 'string' ? new Date(value).toISOString() : value;
    case 'extract_email':
      if (typeof value === 'string') {
        const match = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return match ? match[0] : value;
      }
      return value;
    default:
      return value;
  }
}
