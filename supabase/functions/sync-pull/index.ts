/**
 * Sync Pull Edge Function
 *
 * Handles pull synchronization for the mobile app.
 * Returns changes since the last pull timestamp in WatermelonDB sync format.
 *
 * @module supabase/functions/sync-pull
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface SyncPullRequest {
  lastPulledAt: number | null;
  schemaVersion: number;
  migration?: {
    from: number;
    tables: string[];
    columns: { table: string; columns: string[] }[];
  };
}

interface SyncChange {
  id: string;
  [key: string]: any;
}

interface SyncChanges {
  created: SyncChange[];
  updated: SyncChange[];
  deleted: string[];
}

interface SyncPullResponse {
  changes: {
    dossiers: SyncChanges;
  };
  timestamp: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client for auth validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create authenticated client with user's token for RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Parse request body
    const body: SyncPullRequest = await req.json();
    const { lastPulledAt, schemaVersion } = body;

    console.log('Sync pull request:', {
      userId: user.id,
      lastPulledAt,
      schemaVersion,
    });

    // Convert lastPulledAt from milliseconds to ISO string
    const lastPulledAtIso = lastPulledAt ? new Date(lastPulledAt).toISOString() : null;

    // Fetch dossiers changes
    const dossierChanges = await fetchDossierChanges(supabase, lastPulledAtIso, user.id);

    // Current timestamp for sync
    const timestamp = Date.now();

    const response: SyncPullResponse = {
      changes: {
        dossiers: dossierChanges,
      },
      timestamp,
    };

    console.log('Sync pull response:', {
      userId: user.id,
      dossiersCreated: dossierChanges.created.length,
      dossiersUpdated: dossierChanges.updated.length,
      dossiersDeleted: dossierChanges.deleted.length,
      timestamp,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Sync pull error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fetch dossier changes since last pull
 */
async function fetchDossierChanges(
  supabase: any,
  lastPulledAt: string | null,
  userId: string
): Promise<SyncChanges> {
  const created: SyncChange[] = [];
  const updated: SyncChange[] = [];
  const deleted: string[] = [];

  try {
    // Build query for all dossiers (RLS will filter based on user permissions)
    let query = supabase
      .from('dossiers')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(500);

    // If we have a lastPulledAt, only get changes since then
    if (lastPulledAt) {
      query = query.gt('updated_at', lastPulledAt);
    }

    const { data: dossiers, error } = await query;

    if (error) {
      console.error('Error fetching dossiers:', error);
      throw error;
    }

    // Process dossiers
    for (const dossier of dossiers || []) {
      const syncRecord = transformDossierForSync(dossier);

      // Determine if created or updated
      if (lastPulledAt) {
        const createdAt = new Date(dossier.created_at).getTime();
        const lastPulled = new Date(lastPulledAt).getTime();

        if (createdAt > lastPulled) {
          created.push(syncRecord);
        } else {
          updated.push(syncRecord);
        }
      } else {
        // First sync - all are "created"
        created.push(syncRecord);
      }
    }

    // Fetch deleted/archived dossiers
    if (lastPulledAt) {
      const { data: archivedDossiers, error: archiveError } = await supabase
        .from('dossiers')
        .select('id')
        .eq('status', 'archived')
        .gt('updated_at', lastPulledAt);

      if (!archiveError && archivedDossiers) {
        for (const d of archivedDossiers) {
          deleted.push(d.id);
        }
      }

      // Also check for soft-deleted dossiers
      const { data: deletedDossiers, error: deleteError } = await supabase
        .from('dossiers')
        .select('id')
        .eq('status', 'deleted')
        .gt('updated_at', lastPulledAt);

      if (!deleteError && deletedDossiers) {
        for (const d of deletedDossiers) {
          if (!deleted.includes(d.id)) {
            deleted.push(d.id);
          }
        }
      }
    }

    return { created, updated, deleted };
  } catch (error) {
    console.error('Error in fetchDossierChanges:', error);
    throw error;
  }
}

/**
 * Transform a dossier record to sync format
 * Maps server column names to client model field names
 */
function transformDossierForSync(dossier: any): SyncChange {
  return {
    id: dossier.id,
    name_en: dossier.name_en,
    name_ar: dossier.name_ar,
    type: dossier.type,
    status: dossier.status,
    sensitivity_level: mapSensitivityLevel(dossier.sensitivity_level),
    summary_en: dossier.description_en || null,
    summary_ar: dossier.description_ar || null,
    tags: dossier.tags ? JSON.stringify(dossier.tags) : null,
    metadata: dossier.metadata ? JSON.stringify(dossier.metadata) : null,
    archived: dossier.status === 'archived',
    created_by_id: dossier.created_by || null,
    created_at: new Date(dossier.created_at).getTime(),
    updated_at: new Date(dossier.updated_at).getTime(),
    _sync_status: 'synced',
    _version: dossier.version || 1,
    _server_updated_at: new Date(dossier.updated_at).getTime(),
  };
}

/**
 * Map sensitivity level integer to string
 */
function mapSensitivityLevel(level: number): string {
  const mapping: Record<number, string> = {
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'high',
  };
  return mapping[level] || 'low';
}
