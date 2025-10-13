/**
 * Edge Function: assign-role
 * Feature: 019-user-management-access
 * Task: T029
 *
 * Assigns or changes a user's role with dual approval workflow for admin roles.
 * Non-admin role changes take effect immediately with session termination.
 *
 * Authorization: Admin role required
 * Rate Limit: 10 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/role-management.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface AssignRoleRequest {
  user_id: string;
  new_role: "admin" | "editor" | "viewer";
  reason?: string;
}

interface AssignRoleResponse {
  success: boolean;
  role_changed?: boolean;
  new_role?: string;
  sessions_terminated?: number;
  requires_approval?: boolean;
  approval_request_id?: string;
  pending_approvals?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
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
          error: "Missing authorization header",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user (requester)
    const {
      data: { user: requester },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !requester) {
      return new Response(
        JSON.stringify({
          error: "Invalid user session",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if requester has admin role
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from("auth.users")
      .select("role")
      .eq("id", requester.id)
      .single();

    if (requesterError || !requesterData || requesterData.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions (admin role required)",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body: AssignRoleRequest = await req.json();

    // Validate request
    if (!body.user_id) {
      return new Response(
        JSON.stringify({
          error: "user_id is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.new_role || !["admin", "editor", "viewer"].includes(body.new_role)) {
      return new Response(
        JSON.stringify({
          error: "new_role must be one of: admin, editor, viewer",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user exists and get current role
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from("auth.users")
      .select("id, email, role, full_name")
      .eq("id", body.user_id)
      .single();

    if (targetUserError || !targetUser) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          code: "USER_NOT_FOUND",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already has this role
    if (targetUser.role === body.new_role) {
      return new Response(
        JSON.stringify({
          error: "User already has this role",
          code: "SAME_ROLE",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prevent self-role modification
    if (requester.id === body.user_id) {
      return new Response(
        JSON.stringify({
          error: "Cannot change own role",
          code: "SELF_MODIFICATION",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Admin role assignment requires dual approval workflow
    if (body.new_role === "admin") {
      // Create pending approval record
      const { data: approvalRecord, error: approvalError } = await supabaseAdmin
        .from("pending_role_approvals")
        .insert({
          user_id: body.user_id,
          requested_role: body.new_role,
          current_role: targetUser.role,
          requester_id: requester.id,
          status: "pending",
          reason: body.reason || null,
        })
        .select("id")
        .single();

      if (approvalError || !approvalRecord) {
        console.error("Approval record creation error:", approvalError);
        return new Response(
          JSON.stringify({
            error: "Failed to create approval request",
            code: "APPROVAL_CREATION_FAILED",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Log to audit trail
      await supabaseAdmin.from("audit_logs").insert({
        user_id: requester.id,
        target_user_id: body.user_id,
        event_type: "role_change_requested",
        resource_type: "user",
        resource_id: body.user_id,
        action: "role_change_request",
        changes: {
          before: { role: targetUser.role },
          after: { role: body.new_role },
        },
        metadata: {
          approval_request_id: approvalRecord.id,
          requires_approval: true,
          reason: body.reason || null,
        },
        ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      // Create notification for all admins (except requester)
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from("auth.users")
        .select("id")
        .eq("role", "admin")
        .neq("id", requester.id);

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map((admin) => ({
          user_id: admin.id,
          type: "role_approval_needed",
          message: `Admin role requested for ${targetUser.full_name || targetUser.email}`,
          metadata: {
            approval_request_id: approvalRecord.id,
            target_user_id: body.user_id,
            target_user_email: targetUser.email,
            requested_role: body.new_role,
            requester_id: requester.id,
          },
          is_read: false,
        }));

        await supabaseAdmin.from("notifications").insert(notifications);
      }

      const response: AssignRoleResponse = {
        success: true,
        requires_approval: true,
        approval_request_id: approvalRecord.id,
        pending_approvals: 2,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Non-admin role changes: Apply immediately
    const { error: updateError } = await supabaseAdmin
      .from("auth.users")
      .update({ role: body.new_role })
      .eq("id", body.user_id);

    if (updateError) {
      console.error("Role update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update role",
          code: "ROLE_UPDATE_FAILED",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Terminate all active sessions for the user
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("user_sessions")
      .select("id")
      .eq("user_id", body.user_id)
      .eq("status", "active");

    let sessionsTerminated = 0;
    if (sessions && sessions.length > 0) {
      const { error: terminateError } = await supabaseAdmin
        .from("user_sessions")
        .update({ status: "terminated", terminated_at: new Date().toISOString() })
        .eq("user_id", body.user_id)
        .eq("status", "active");

      if (!terminateError) {
        sessionsTerminated = sessions.length;
      }
    }

    // Log to audit trail
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requester.id,
      target_user_id: body.user_id,
      event_type: "role_changed",
      resource_type: "user",
      resource_id: body.user_id,
      action: "role_change",
      changes: {
        before: { role: targetUser.role },
        after: { role: body.new_role },
      },
      metadata: {
        sessions_terminated: sessionsTerminated,
        reason: body.reason || null,
        immediate_change: true,
      },
      ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    // Create notification for the user
    await supabaseAdmin.from("notifications").insert({
      user_id: body.user_id,
      type: "role_changed",
      message: `Your role has been changed to ${body.new_role}`,
      metadata: {
        old_role: targetUser.role,
        new_role: body.new_role,
        changed_by: requester.id,
        sessions_terminated: sessionsTerminated,
      },
      is_read: false,
    });

    const response: AssignRoleResponse = {
      success: true,
      role_changed: true,
      new_role: body.new_role,
      sessions_terminated: sessionsTerminated,
    };

    return new Response(JSON.stringify(response), {
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
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
