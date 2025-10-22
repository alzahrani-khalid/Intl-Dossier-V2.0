import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { isValidUUID, sanitizeText } from "../_shared/security.ts";

/**
 * Edge Function: intake-links-update
 * PUT /intake-links-update?intake_id={intake_id}&link_id={link_id}
 *
 * Updates an existing entity link (notes, link_type, etc.).
 *
 * Features:
 * - Validates intake and link ownership
 * - Supports optimistic locking via _version
 * - Creates audit log entry
 * - Prevents duplicate primary links
 */

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "PUT") {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed",
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
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authorization header",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const intakeId = url.searchParams.get('intake_id');
    const linkId = url.searchParams.get('link_id');

    if (!intakeId || !isValidUUID(intakeId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_INTAKE_ID",
            message: "Invalid intake ID in query parameter",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!linkId || !isValidUUID(linkId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_LINK_ID",
            message: "Invalid link ID in query parameter",
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await req.json();

    // Create user client for auth.getUser()
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Create service role client for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid user session",
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("user_id, clearance_level, organization_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the existing link
    const { data: existingLink, error: linkError } = await supabaseClient
      .from("intake_entity_links")
      .select("*")
      .eq("id", linkId)
      .eq("intake_id", intakeId)
      .single();

    if (linkError || !existingLink) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "LINK_NOT_FOUND",
            message: "Entity link not found",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get intake ticket to verify access
    const { data: intakeTicket, error: intakeError } = await supabaseClient
      .from("intake_tickets")
      .select("id, assigned_to, created_by")
      .eq("id", intakeId)
      .single();

    if (intakeError || !intakeTicket) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTAKE_NOT_FOUND",
            message: "Intake ticket not found",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this intake
    if (intakeTicket.assigned_to !== user.id && intakeTicket.created_by !== user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "NO_INTAKE_ACCESS",
            message: "You do not have access to this intake ticket",
          },
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optimistic locking check
    if (body._version !== undefined && body._version !== existingLink._version) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "OPTIMISTIC_LOCK_FAILURE",
            message: "The link has been modified by another user. Please refresh and try again.",
          },
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If updating link_type to 'primary', check for existing primary
    if (body.link_type === 'primary') {
      const { data: existingPrimary } = await supabaseClient
        .from("intake_entity_links")
        .select("id")
        .eq("intake_id", intakeId)
        .eq("link_type", "primary")
        .is("deleted_at", null)
        .neq("id", linkId) // Exclude current link
        .single();

      if (existingPrimary) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "DUPLICATE_PRIMARY",
              message: "An intake can only have one primary link. Please demote the existing primary link first.",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      _version: existingLink._version + 1,
    };

    // Add fields that are allowed to be updated
    if (body.link_type !== undefined) {
      updateData.link_type = body.link_type;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes ? sanitizeText(body.notes, 1000) : null;
    }
    if (body.link_order !== undefined) {
      updateData.link_order = body.link_order;
    }

    // Update the link
    const { data: updatedLink, error: updateError } = await supabaseClient
      .from("intake_entity_links")
      .update(updateData)
      .eq("id", linkId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating link:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UPDATE_ERROR",
            message: "Failed to update link",
            details: updateError,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create audit log entry
    const auditLogData = {
      link_id: linkId,
      action: "update",
      changed_fields: Object.keys(updateData).filter(k => k !== 'updated_at' && k !== '_version'),
      old_values: {
        link_type: existingLink.link_type,
        notes: existingLink.notes,
        link_order: existingLink.link_order,
      },
      new_values: {
        link_type: updatedLink.link_type,
        notes: updatedLink.notes,
        link_order: updatedLink.link_order,
      },
      performed_by: user.id,
    };

    await supabaseClient
      .from("link_audit_logs")
      .insert(auditLogData);

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedLink,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
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
