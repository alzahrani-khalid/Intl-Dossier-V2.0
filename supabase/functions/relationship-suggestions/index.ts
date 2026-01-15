/**
 * Supabase Edge Function: Relationship Suggestions
 * Feature: ai-relationship-suggestions
 *
 * Generates AI-powered relationship suggestions for persons based on:
 * - Co-attendance at events
 * - Shared organizations
 * - Organizational hierarchy
 * - Shared affiliations
 *
 * Endpoints:
 * GET /relationship-suggestions?person_id=<uuid>&limit=<n>
 * POST /relationship-suggestions/bulk-create - Create multiple relationships
 * POST /relationship-suggestions/reject - Reject a suggestion
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Types
interface RelationshipSuggestion {
  suggested_person_id: string;
  suggested_person_name_en: string;
  suggested_person_name_ar: string;
  suggested_person_photo_url: string | null;
  suggested_person_title_en: string | null;
  suggestion_type: string;
  confidence_score: number;
  suggested_relationship_type: string;
  context_notes_en: string;
  context_notes_ar: string;
  evidence: Record<string, unknown>;
}

interface BulkCreateRequest {
  person_id: string;
  relationships: Array<{
    to_person_id: string;
    relationship_type: string;
    strength?: number;
    notes?: string;
  }>;
}

interface RejectSuggestionRequest {
  person_id: string;
  suggested_person_id: string;
  suggestion_type: string;
}

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Authorization header required',
          message_ar: 'مطلوب رأس التفويض',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'unauthorized',
          message: 'Invalid or expired token',
          message_ar: 'رمز غير صالح أو منتهي الصلاحية',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route handling
    if (req.method === 'GET') {
      // GET /relationship-suggestions?person_id=<uuid>
      return await handleGetSuggestions(supabase, url, user.id);
    } else if (req.method === 'POST') {
      const body = await req.json();

      if (pathParts.includes('bulk-create')) {
        // POST /relationship-suggestions/bulk-create
        return await handleBulkCreate(supabase, body as BulkCreateRequest, user.id);
      } else if (pathParts.includes('reject')) {
        // POST /relationship-suggestions/reject
        return await handleRejectSuggestion(supabase, body as RejectSuggestionRequest, user.id);
      } else {
        return new Response(
          JSON.stringify({
            error: 'not_found',
            message: 'Endpoint not found',
            message_ar: 'نقطة النهاية غير موجودة',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: 'Method not allowed',
        message_ar: 'الطريقة غير مسموح بها',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Relationship suggestions error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_server_error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        message_ar: 'حدث خطأ غير متوقع',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Handle GET suggestions request
 */
async function handleGetSuggestions(
  supabase: ReturnType<typeof createClient>,
  url: URL,
  userId: string
): Promise<Response> {
  const personId = url.searchParams.get('person_id');
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)), 20);
  const includeRejected = url.searchParams.get('include_rejected') === 'true';

  if (!personId) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: 'person_id is required',
        message_ar: 'معرف الشخص مطلوب',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // First check if person has any existing relationships
  const { data: relationshipCount } = await supabase.rpc('get_person_relationship_count', {
    p_person_id: personId,
  });

  // Generate suggestions using the RPC function
  const { data: suggestions, error: suggestionsError } = await supabase.rpc(
    'generate_all_relationship_suggestions',
    { p_person_id: personId }
  );

  if (suggestionsError) {
    console.error('Error generating suggestions:', suggestionsError);
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: suggestionsError.message,
        message_ar: 'خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Get previously rejected suggestions if not including them
  let rejectedPersonIds: string[] = [];
  if (!includeRejected) {
    const { data: rejectedSuggestions } = await supabase
      .from('person_relationship_suggestions')
      .select('suggested_person_id')
      .eq('person_id', personId)
      .eq('status', 'rejected');

    if (rejectedSuggestions) {
      rejectedPersonIds = rejectedSuggestions.map((s) => s.suggested_person_id);
    }
  }

  // Filter out rejected suggestions and apply limit
  const filteredSuggestions = (suggestions as RelationshipSuggestion[])
    .filter((s) => !rejectedPersonIds.includes(s.suggested_person_id))
    .slice(0, limit);

  // Group suggestions by type for better UX
  const groupedByType = filteredSuggestions.reduce(
    (acc, suggestion) => {
      const type = suggestion.suggestion_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(suggestion);
      return acc;
    },
    {} as Record<string, RelationshipSuggestion[]>
  );

  // Calculate suggestion summary
  const summary = {
    total_suggestions: filteredSuggestions.length,
    existing_relationship_count: relationshipCount || 0,
    has_no_relationships: (relationshipCount || 0) === 0,
    suggestion_types: Object.keys(groupedByType).map((type) => ({
      type,
      count: groupedByType[type].length,
      avg_confidence:
        groupedByType[type].reduce((sum, s) => sum + s.confidence_score, 0) /
        groupedByType[type].length,
    })),
    high_confidence_count: filteredSuggestions.filter((s) => s.confidence_score >= 0.8).length,
  };

  return new Response(
    JSON.stringify({
      suggestions: filteredSuggestions,
      grouped_by_type: groupedByType,
      summary,
      metadata: {
        person_id: personId,
        generated_at: new Date().toISOString(),
        limit,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle bulk create relationships request
 */
async function handleBulkCreate(
  supabase: ReturnType<typeof createClient>,
  body: BulkCreateRequest,
  userId: string
): Promise<Response> {
  const { person_id, relationships } = body;

  if (!person_id || !relationships || !Array.isArray(relationships) || relationships.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: 'person_id and relationships array are required',
        message_ar: 'معرف الشخص ومصفوفة العلاقات مطلوبة',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate relationship count
  if (relationships.length > 20) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: 'Maximum 20 relationships can be created at once',
        message_ar: 'يمكن إنشاء 20 علاقة كحد أقصى في المرة الواحدة',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Use the bulk create RPC function
  const { data: results, error: createError } = await supabase.rpc('create_bulk_relationships', {
    p_from_person_id: person_id,
    p_relationships: relationships,
    p_user_id: userId,
  });

  if (createError) {
    console.error('Error creating bulk relationships:', createError);
    return new Response(
      JSON.stringify({
        error: 'database_error',
        message: createError.message,
        message_ar: 'خطأ في قاعدة البيانات',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Calculate success/failure counts
  const successCount = results?.filter((r: { success: boolean }) => r.success).length || 0;
  const failureCount = (results?.length || 0) - successCount;

  return new Response(
    JSON.stringify({
      success: true,
      results,
      summary: {
        total_requested: relationships.length,
        created_count: successCount,
        failed_count: failureCount,
      },
      message:
        failureCount === 0
          ? `Successfully created ${successCount} relationships`
          : `Created ${successCount} relationships, ${failureCount} failed`,
      message_ar:
        failureCount === 0
          ? `تم إنشاء ${successCount} علاقات بنجاح`
          : `تم إنشاء ${successCount} علاقات، فشلت ${failureCount}`,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Handle reject suggestion request
 */
async function handleRejectSuggestion(
  supabase: ReturnType<typeof createClient>,
  body: RejectSuggestionRequest,
  userId: string
): Promise<Response> {
  const { person_id, suggested_person_id, suggestion_type } = body;

  if (!person_id || !suggested_person_id || !suggestion_type) {
    return new Response(
      JSON.stringify({
        error: 'bad_request',
        message: 'person_id, suggested_person_id, and suggestion_type are required',
        message_ar: 'معرف الشخص ومعرف الشخص المقترح ونوع الاقتراح مطلوبة',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // First check if suggestion exists, if not create it as rejected
  const { data: existingSuggestion } = await supabase
    .from('person_relationship_suggestions')
    .select('id')
    .eq('person_id', person_id)
    .eq('suggested_person_id', suggested_person_id)
    .eq('suggestion_type', suggestion_type)
    .single();

  if (existingSuggestion) {
    // Update existing suggestion
    const { error: updateError } = await supabase
      .from('person_relationship_suggestions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq('id', existingSuggestion.id);

    if (updateError) {
      console.error('Error rejecting suggestion:', updateError);
      return new Response(
        JSON.stringify({
          error: 'database_error',
          message: updateError.message,
          message_ar: 'خطأ في قاعدة البيانات',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } else {
    // Create a rejected suggestion record to prevent future suggestions
    const { error: insertError } = await supabase.from('person_relationship_suggestions').insert({
      person_id,
      suggested_person_id,
      suggestion_type,
      confidence_score: 0,
      suggested_relationship_type: 'knows',
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    });

    if (insertError) {
      console.error('Error creating rejected suggestion:', insertError);
      return new Response(
        JSON.stringify({
          error: 'database_error',
          message: insertError.message,
          message_ar: 'خطأ في قاعدة البيانات',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Suggestion rejected successfully',
      message_ar: 'تم رفض الاقتراح بنجاح',
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
