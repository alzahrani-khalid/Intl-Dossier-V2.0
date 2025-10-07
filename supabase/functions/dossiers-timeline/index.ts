import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface TimelineQuery {
  event_type?: string[];
  start_date?: string;
  end_date?: string;
  cursor?: string;
  limit?: number;
}

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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message_en: "Invalid user session",
            message_ar: "جلسة مستخدم غير صالحة",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract dossier ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const dossierId = pathParts[pathParts.indexOf("dossiers") + 1];

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

    // Parse query parameters
    const params: TimelineQuery = {
      event_type: url.searchParams.get("event_type")?.split(",") || undefined,
      start_date: url.searchParams.get("start_date") || undefined,
      end_date: url.searchParams.get("end_date") || undefined,
      cursor: url.searchParams.get("cursor") || undefined,
      limit: Math.min(parseInt(url.searchParams.get("limit") || "50"), 100),
    };

    // Verify dossier exists and user has access (via RLS on dossiers table)
    const { data: dossier, error: dossierError } = await supabaseClient
      .from("dossiers")
      .select("id")
      .eq("id", dossierId)
      .single();

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message_en: "Dossier not found or access denied",
            message_ar: "الملف غير موجود أو الوصول مرفوض",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build timeline query
    let query = supabaseClient
      .from("dossier_timeline")
      .select("*")
      .eq("dossier_id", dossierId);

    // Apply filters
    if (params.event_type && params.event_type.length > 0) {
      query = query.in("event_type", params.event_type);
    }
    if (params.start_date) {
      query = query.gte("event_date", params.start_date);
    }
    if (params.end_date) {
      query = query.lte("event_date", params.end_date);
    }

    // Cursor-based pagination
    if (params.cursor) {
      try {
        // Decode cursor: base64 encoded "event_date|event_type|source_id"
        const decoded = atob(params.cursor);
        const [cursorDate, cursorType, cursorId] = decoded.split("|");
        
        // Apply cursor filter: get events after this cursor
        query = query.or(
          `and(event_date.lt.${cursorDate}),and(event_date.eq.${cursorDate},event_type.gt.${cursorType}),and(event_date.eq.${cursorDate},event_type.eq.${cursorType},source_id.gt.${cursorId})`
        );
      } catch {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_CURSOR",
              message_en: "Invalid pagination cursor",
              message_ar: "مؤشر صفحة غير صالح",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Order and limit (indexed for performance)
    query = query
      .order("event_date", { ascending: false })
      .order("event_type", { ascending: false })
      .order("source_id", { ascending: false })
      .limit(params.limit);

    // Execute query
    const { data: events, error: queryError } = await query;

    if (queryError) {
      console.error("Error fetching timeline:", queryError);
      return new Response(
        JSON.stringify({
          error: {
            code: "QUERY_ERROR",
            message_en: "Failed to fetch timeline events",
            message_ar: "فشل في جلب أحداث الجدول الزمني",
            details: queryError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate next cursor
    let nextCursor: string | null = null;
    if (events && events.length === params.limit) {
      const lastEvent = events[events.length - 1];
      const cursorValue = `${lastEvent.event_date}|${lastEvent.event_type}|${lastEvent.source_id}`;
      nextCursor = btoa(cursorValue);
    }

    const response = {
      data: events || [],
      pagination: {
        next_cursor: nextCursor,
        has_more: nextCursor !== null,
      },
    };

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
