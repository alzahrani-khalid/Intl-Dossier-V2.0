import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({
        error: {
          code: "METHOD_NOT_ALLOWED",
          message_en: "Method not allowed",
          message_ar: "الطريقة غير مسموح بها",
        },
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message_en: "Missing authorization header",
            message_ar: "رأس التفويض مفقود",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user context
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user using the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message_en: "Invalid user session",
            message_ar: "جلسة مستخدم غير صالحة",
            debug: userError?.message,
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract dossier ID from query parameter
    const url = new URL(req.url);
    const dossierId = url.searchParams.get("id");

    if (!dossierId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "MISSING_ID",
            message_en: "Dossier ID is required",
            message_ar: "معرف الملف مطلوب",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse include parameters
    const includeParams = url.searchParams.get("include")?.split(",") || [];
    const includeStats = includeParams.includes("stats");
    const includeOwners = includeParams.includes("owners");
    const includeContacts = includeParams.includes("contacts");
    const includeRecentBriefs = includeParams.includes("recent_briefs");

    // Fetch dossier (RLS automatically applies)
    const { data: dossier, error: dossierError } = await supabaseClient
      .from("dossiers")
      .select("*")
      .eq("id", dossierId)
      .single();

    if (dossierError) {
      if (dossierError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            error: {
              code: "NOT_FOUND",
              message_en: "Dossier not found",
              message_ar: "الملف غير موجود",
            },
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "QUERY_ERROR",
            message_en: "Failed to fetch dossier",
            message_ar: "فشل في جلب الملف",
            details: dossierError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response: Record<string, unknown> = { ...dossier };

    // Include stats if requested
    if (includeStats) {
      // Query timeline to calculate stats
      const { data: timelineData, error: timelineError } = await supabaseClient
        .from("dossier_timeline")
        .select("event_type")
        .eq("dossier_id", dossierId);

      if (!timelineError && timelineData) {
        const stats = {
          total_engagements: timelineData.filter(e => e.event_type === "engagement").length,
          total_positions: timelineData.filter(e => e.event_type === "position").length,
          total_mous: timelineData.filter(e => e.event_type === "mou").length,
          total_commitments: timelineData.filter(e => e.event_type === "commitment").length,
          total_documents: timelineData.filter(e => e.event_type === "document").length,
          total_intelligence: timelineData.filter(e => e.event_type === "intelligence").length,
          recent_activity_count: timelineData.filter(e => {
            const date = new Date(e.event_date || "");
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            return date >= ninetyDaysAgo;
          }).length,
          relationship_health_score: null, // TODO: Implement health score algorithm
        };
        response.stats = stats;
      }
    }

    // Include owners if requested
    if (includeOwners) {
      const { data: owners, error: ownersError } = await supabaseClient
        .from("dossier_owners")
        .select(`
          user_id,
          assigned_at,
          role_type
        `)
        .eq("dossier_id", dossierId);

      if (!ownersError && owners) {
        // Create admin client for user lookup
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch user details for each owner
        const { data: users } = await adminClient.auth.admin.listUsers();

        const enrichedOwners = owners.map(owner => {
          const userDetail = users?.users.find(u => u.id === owner.user_id);
          return {
            user_id: owner.user_id,
            user_name: userDetail?.email || "Unknown",
            assigned_at: owner.assigned_at,
            role_type: owner.role_type,
          };
        });

        response.owners = enrichedOwners;
      }
    }

    // Include contacts if requested
    if (includeContacts) {
      const { data: contacts, error: contactsError } = await supabaseClient
        .from("key_contacts")
        .select("*")
        .eq("dossier_id", dossierId)
        .order("last_interaction_date", { ascending: false, nullsFirst: false });

      if (!contactsError && contacts) {
        response.contacts = contacts;
      }
    }

    // Include recent briefs if requested
    if (includeRecentBriefs) {
      const { data: briefs, error: briefsError } = await supabaseClient
        .from("briefs")
        .select("id, generated_at, generated_by, content_en, content_ar")
        .eq("dossier_id", dossierId)
        .order("generated_at", { ascending: false })
        .limit(5);

      if (!briefsError && briefs) {
        // Return summary only (first 200 chars)
        const briefSummaries = briefs.map(brief => ({
          id: brief.id,
          generated_at: brief.generated_at,
          generated_by: brief.generated_by,
          summary_en: brief.content_en?.summary?.substring(0, 200) || "",
          summary_ar: brief.content_ar?.summary?.substring(0, 200) || "",
        }));
        response.recent_briefs = briefSummaries;
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30, s-maxage=60",
      },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message_en: "An unexpected error occurred",
          message_ar: "حدث خطأ غير متوقع",
          correlation_id: crypto.randomUUID(),
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
