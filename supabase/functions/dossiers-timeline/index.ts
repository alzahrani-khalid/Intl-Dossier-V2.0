import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

// Note: The dossier ID is now read from the query parameter ?id= instead of the URL path

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

    // Extract JWT token (remove "Bearer " prefix)
    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client for auth validation
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get current user by passing the JWT token directly
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message_en: `Invalid user session: ${userError?.message || 'No user found'}`,
            message_ar: "جلسة مستخدم غير صالحة",
            details: {
              error: userError?.message,
              status: userError?.status,
              has_user: !!user,
            },
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role for database operations
    // We use service role to bypass RLS since we've already validated the user above
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

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

    // Parse query parameters
    const eventTypes = url.searchParams.getAll("event_type");
    const params: TimelineQuery = {
      event_type: eventTypes.length > 0 ? eventTypes : undefined,
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

    // Query calendar entries only (engagements is an extension table, not a timeline source)
    const calendarResult = await supabaseClient
      .from("calendar_entries")
      .select("id, title_en, title_ar, description_en, description_ar, entry_type, event_date, location, status")
      .eq("dossier_id", dossierId);

    // Check for query errors
    if (calendarResult.error) {
      console.error("Error fetching timeline events:", calendarResult.error);
      return new Response(
        JSON.stringify({
          error: {
            code: "QUERY_ERROR",
            message_en: "Failed to fetch timeline events",
            message_ar: "فشل في جلب أحداث الجدول الزمني",
            details: calendarResult.error,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Transform all sources to unified timeline event format
    const allEvents = [
      // Calendar Entries
      ...(calendarResult.data || []).map((item: any) => ({
        event_type: item.entry_type || 'calendar',
        event_title_en: item.title_en,
        event_title_ar: item.title_ar,
        event_description_en: item.description_en,
        event_description_ar: item.description_ar,
        event_date: item.event_date,
        source_id: item.id,
        source_table: 'calendar_entries',
        metadata: {
          location: item.location,
          status: item.status,
        },
      })),
    ];

    // Sort by date descending
    allEvents.sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      return dateB - dateA;
    });

    // Apply filters
    let filteredEvents = allEvents;

    if (params.event_type && params.event_type.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        params.event_type!.includes(event.event_type)
      );
    }

    if (params.start_date) {
      filteredEvents = filteredEvents.filter(
        (event) => event.event_date >= params.start_date!
      );
    }

    if (params.end_date) {
      filteredEvents = filteredEvents.filter(
        (event) => event.event_date <= params.end_date!
      );
    }

    // Apply cursor-based pagination
    if (params.cursor) {
      try {
        // Decode cursor: base64 encoded "event_date|event_type|source_table|source_id"
        const decoded = atob(params.cursor);
        const [cursorDate, cursorType, cursorTable, cursorId] = decoded.split("|");

        // Find the index of the cursor in the sorted array
        const cursorIndex = filteredEvents.findIndex(
          (event) =>
            event.event_date === cursorDate &&
            event.event_type === cursorType &&
            event.source_table === cursorTable &&
            event.source_id === cursorId
        );

        // Get events after the cursor
        if (cursorIndex !== -1) {
          filteredEvents = filteredEvents.slice(cursorIndex + 1);
        }
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

    // Apply limit
    const paginatedEvents = filteredEvents.slice(0, params.limit);
    const transformedEvents = paginatedEvents;

    // Calculate next cursor
    let nextCursor: string | null = null;
    if (filteredEvents.length > params.limit) {
      // More events available beyond this page
      const lastEvent = paginatedEvents[paginatedEvents.length - 1];
      const cursorValue = `${lastEvent.event_date}|${lastEvent.event_type}|${lastEvent.source_table}|${lastEvent.source_id}`;
      nextCursor = btoa(cursorValue);
    }

    const response = {
      events: transformedEvents,
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
