import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface DossierUpdateRequest {
  version: number;
  name_en?: string;
  name_ar?: string;
  status?: "active" | "inactive" | "archived";
  sensitivity_level?: "low" | "medium" | "high";
  summary_en?: string;
  summary_ar?: string;
  tags?: string[];
  review_cadence?: string;
  last_review_date?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "PUT") {
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
    const dossierId = pathParts[pathParts.length - 1];

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

    // Parse and validate request body
    const body: DossierUpdateRequest = await req.json();

    // Validation
    const validationErrors: string[] = [];

    if (typeof body.version !== "number") {
      validationErrors.push("version is required for optimistic locking");
    }
    if (body.name_en && body.name_en.length > 200) {
      validationErrors.push("name_en must be <= 200 characters");
    }
    if (body.name_ar && body.name_ar.length > 200) {
      validationErrors.push("name_ar must be <= 200 characters");
    }
    if (body.status && !["active", "inactive", "archived"].includes(body.status)) {
      validationErrors.push("status must be one of: active, inactive, archived");
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

    // Check current version first (optimistic lock check)
    const { data: currentDossier, error: fetchError } = await supabaseClient
      .from("dossiers")
      .select("version")
      .eq("id", dossierId)
      .single();

    if (fetchError || !currentDossier) {
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

    // Version mismatch = conflict
    if (currentDossier.version !== body.version) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VERSION_CONFLICT",
            message_en: "Dossier was modified by another user. Please refresh and try again.",
            message_ar: "تم تعديل الملف من قبل مستخدم آخر. يرجى التحديث والمحاولة مرة أخرى.",
            current_version: currentDossier.version,
          },
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (body.name_en !== undefined) updateData.name_en = body.name_en;
    if (body.name_ar !== undefined) updateData.name_ar = body.name_ar;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.sensitivity_level !== undefined) updateData.sensitivity_level = body.sensitivity_level;
    if (body.summary_en !== undefined) updateData.summary_en = body.summary_en;
    if (body.summary_ar !== undefined) updateData.summary_ar = body.summary_ar;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.review_cadence !== undefined) updateData.review_cadence = body.review_cadence;
    if (body.last_review_date !== undefined) updateData.last_review_date = body.last_review_date;

    // Update dossier (RLS + trigger auto-increments version)
    const { data: updatedDossier, error: updateError } = await supabaseClient
      .from("dossiers")
      .update(updateData)
      .eq("id", dossierId)
      .eq("version", body.version) // Double-check version in query
      .select()
      .single();

    if (updateError) {
      console.error("Error updating dossier:", updateError);

      // Check if it's a permission error
      if (updateError.code === "42501") {
        return new Response(
          JSON.stringify({
            error: {
              code: "FORBIDDEN",
              message_en: "You do not have permission to update this dossier",
              message_ar: "ليس لديك إذن لتحديث هذا الملف",
            },
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check for concurrent update (race condition)
      if (updateError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            error: {
              code: "VERSION_CONFLICT",
              message_en: "Dossier was modified during the update. Please refresh and try again.",
              message_ar: "تم تعديل الملف أثناء التحديث. يرجى التحديث والمحاولة مرة أخرى.",
            },
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: "UPDATE_ERROR",
            message_en: "Failed to update dossier",
            message_ar: "فشل في تحديث الملف",
            details: updateError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(updatedDossier), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
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
