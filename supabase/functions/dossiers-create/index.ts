import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface DossierCreateRequest {
  name_en: string;
  name_ar: string;
  type: "country" | "organization" | "forum" | "theme";
  sensitivity_level?: "low" | "medium" | "high";
  summary_en?: string;
  summary_ar?: string;
  tags?: string[];
  review_cadence?: string;
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

    // Parse and validate request body
    const body: DossierCreateRequest = await req.json();

    // Validation
    const validationErrors: string[] = [];

    if (!body.name_en || body.name_en.length > 200) {
      validationErrors.push("name_en is required and must be <= 200 characters");
    }
    if (!body.name_ar || body.name_ar.length > 200) {
      validationErrors.push("name_ar is required and must be <= 200 characters");
    }
    if (!["country", "organization", "forum", "theme"].includes(body.type)) {
      validationErrors.push("type must be one of: country, organization, forum, theme");
    }
    if (body.sensitivity_level && !["low", "medium", "high"].includes(body.sensitivity_level)) {
      validationErrors.push("sensitivity_level must be one of: low, medium, high");
    }
    if (body.tags && (body.tags.length > 20 || body.tags.some(tag => tag.length > 50))) {
      validationErrors.push("tags must have max 20 items, each <= 50 characters");
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message_en: "Validation failed",
            message_ar: "فشل التحقق من الصحة",
            details: validationErrors,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert dossier (RLS policy will check permissions)
    const { data: dossier, error: insertError } = await supabaseClient
      .from("dossiers")
      .insert({
        name_en: body.name_en,
        name_ar: body.name_ar,
        type: body.type,
        sensitivity_level: body.sensitivity_level || "low",
        summary_en: body.summary_en || null,
        summary_ar: body.summary_ar || null,
        tags: body.tags || [],
        review_cadence: body.review_cadence || null,
        status: "active",
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating dossier:", insertError);
      
      // Check if it's a permission error
      if (insertError.code === "42501") {
        return new Response(
          JSON.stringify({
            error: {
              code: "FORBIDDEN",
              message_en: "You do not have permission to create dossiers",
              message_ar: "ليس لديك إذن لإنشاء الملفات",
            },
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "INSERT_ERROR",
            message_en: "Failed to create dossier",
            message_ar: "فشل في إنشاء الملف",
            details: insertError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Auto-assign creator as owner
    const { error: ownerError } = await supabaseClient
      .from("dossier_owners")
      .insert({
        dossier_id: dossier.id,
        user_id: user.id,
        role_type: "owner",
      });

    if (ownerError) {
      console.warn("Failed to assign owner (non-critical):", ownerError);
      // Non-critical error - dossier was created successfully
    }

    return new Response(JSON.stringify(dossier), {
      status: 201,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        Location: `/dossiers/${dossier.id}`,
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
