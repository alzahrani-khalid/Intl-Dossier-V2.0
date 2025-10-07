import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";
import { generateBriefTemplate, prePopulateTemplate } from "../_shared/brief-template.ts";

interface GenerateBriefRequest {
  date_range_start?: string;
  date_range_end?: string;
  sections?: string[];
}

interface BriefContent {
  summary: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    // Parse request body
    const body: GenerateBriefRequest = await req.json().catch(() => ({}));

    // Fetch dossier data
    const { data: dossier, error: dossierError } = await supabaseClient
      .from("dossiers")
      .select("*")
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

    // Fetch timeline events in date range
    let timelineQuery = supabaseClient
      .from("dossier_timeline")
      .select("*")
      .eq("dossier_id", dossierId);

    if (body.date_range_start) {
      timelineQuery = timelineQuery.gte("event_date", body.date_range_start);
    }
    if (body.date_range_end) {
      timelineQuery = timelineQuery.lte("event_date", body.date_range_end);
    }

    const { data: timelineEvents, error: timelineError } = await timelineQuery
      .order("event_date", { ascending: false })
      .limit(50);

    if (timelineError) {
      console.error("Error fetching timeline:", timelineError);
    }

    const events = timelineEvents || [];

    // Try AI generation with 60s timeout
    const anythingLlmUrl = Deno.env.get("ANYTHINGLLM_URL");
    const anythingLlmKey = Deno.env.get("ANYTHINGLLM_API_KEY");

    if (anythingLlmUrl && anythingLlmKey) {
      try {
        // Prepare AI prompt
        const prompt = `Generate a bilingual executive brief for this diplomatic dossier.

Dossier: ${dossier.name_en} / ${dossier.name_ar}
Type: ${dossier.type}
Summary: ${dossier.summary_en || "N/A"}

Recent Events (${events.length}):
${events.slice(0, 10).map((e, i) => `${i + 1}. [${e.event_type}] ${e.event_title_en} (${e.event_date})`).join("\n")}

Sections to include: ${body.sections?.join(", ") || "all"}

Return JSON with this exact structure:
{
  "en": {
    "summary": "Executive summary in English...",
    "sections": [
      {"title": "Recent Activity", "content": "..."},
      {"title": "Open Commitments", "content": "..."},
      {"title": "Key Positions", "content": "..."},
      {"title": "Relationship Health", "content": "..."}
    ]
  },
  "ar": {
    "summary": "الملخص التنفيذي بالعربية...",
    "sections": [
      {"title": "النشاط الأخير", "content": "..."},
      {"title": "الالتزامات المفتوحة", "content": "..."},
      {"title": "المواقف الرئيسية", "content": "..."},
      {"title": "صحة العلاقة", "content": "..."}
    ]
  }
}`;

        // Call AI with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const aiResponse = await fetch(`${anythingLlmUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anythingLlmKey}`,
          },
          body: JSON.stringify({
            message: prompt,
            mode: "chat",
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!aiResponse.ok) {
          throw new Error(`AI service returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const briefData = JSON.parse(aiData.textResponse);

        // Insert brief into database
        const { data: brief, error: insertError } = await supabaseClient
          .from("briefs")
          .insert({
            dossier_id: dossierId,
            content_en: briefData.en,
            content_ar: briefData.ar,
            date_range_start: body.date_range_start || null,
            date_range_end: body.date_range_end || null,
            generated_by: "ai",
            generated_by_user_id: user.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting brief:", insertError);
          throw new Error("Failed to save brief");
        }

        return new Response(JSON.stringify(brief), {
          status: 201,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        });
      } catch (aiError) {
        console.warn("AI generation failed or timed out:", aiError);
        // Fall through to fallback template
      }
    }

    // Fallback: Return manual template
    const template = generateBriefTemplate();
    const prePopulated = prePopulateTemplate(
      {
        id: dossier.id,
        name_en: dossier.name_en,
        name_ar: dossier.name_ar,
        type: dossier.type,
        summary_en: dossier.summary_en,
        summary_ar: dossier.summary_ar,
        tags: dossier.tags || [],
      },
      events
    );

    return new Response(
      JSON.stringify({
        error: {
          code: "AI_UNAVAILABLE",
          message_en: "AI service is unavailable. Please use the manual template to create a brief.",
          message_ar: "خدمة الذكاء الاصطناعي غير متاحة. يرجى استخدام النموذج اليدوي لإنشاء موجز.",
        },
        fallback: {
          template,
          pre_populated_data: prePopulated,
        },
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
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
