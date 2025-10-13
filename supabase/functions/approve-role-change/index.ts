/**
 * Edge Function: approve-role-change
 * Feature: 019-user-management-access
 * Task: T030
 *
 * Processes dual approval workflow for admin role assignments.
 * Second approval automatically applies the role change.
 *
 * Authorization: Admin role required (cannot approve own request)
 * Rate Limit: 10 requests/min per IP
 *
 * @see specs/019-user-management-access/contracts/role-management.yaml
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

interface ApproveRoleRequest {
  approval_request_id: string;
  approved: boolean;
  rejection_reason?: string;
}

interface ApproveRoleResponse {
  success: boolean;
  status: "first_approved" | "approved" | "rejected";
  remaining_approvals?: number;
  role_applied?: boolean;
  user_id?: string;
  new_role?: string;
  rejection_reason?: string;
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

    // Get current user (approver)
    const {
      data: { user: approver },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !approver) {
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

    // Check if approver has admin role
    const { data: approverData, error: approverError } = await supabaseAdmin
      .from("auth.users")
      .select("role, email")
      .eq("id", approver.id)
      .single();

    if (approverError || !approverData || approverData.role !== "admin") {
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
    const body: ApproveRoleRequest = await req.json();

    // Validate request
    if (!body.approval_request_id) {
      return new Response(
        JSON.stringify({
          error: "approval_request_id is required",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof body.approved !== "boolean") {
      return new Response(
        JSON.stringify({
          error: "approved must be a boolean",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.approved && !body.rejection_reason) {
      return new Response(
        JSON.stringify({
          error: "rejection_reason is required when approved=false",
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get approval request
    const { data: approvalRequest, error: requestError } = await supabaseAdmin
      .from("pending_role_approvals")
      .select("*")
      .eq("id", body.approval_request_id)
      .single();

    if (requestError || !approvalRequest) {
      return new Response(
        JSON.stringify({
          error: "Approval request not found",
          code: "REQUEST_NOT_FOUND",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cannot approve own request
    if (approvalRequest.requester_id === approver.id) {
      return new Response(
        JSON.stringify({
          error: "Cannot approve own role change request",
          code: "SELF_APPROVAL",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already approved/rejected
    if (approvalRequest.status === "approved" || approvalRequest.status === "rejected") {
      return new Response(
        JSON.stringify({
          error: `Request already ${approvalRequest.status}`,
          code: "REQUEST_CLOSED",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if this admin already approved
    if (approvalRequest.first_approver_id === approver.id) {
      return new Response(
        JSON.stringify({
          error: "Already approved by this administrator",
          code: "ALREADY_APPROVED",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle rejection
    if (!body.approved) {
      const { error: updateError } = await supabaseAdmin
        .from("pending_role_approvals")
        .update({
          status: "rejected",
          rejection_reason: body.rejection_reason,
          rejected_by: approver.id,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", body.approval_request_id);

      if (updateError) {
        console.error("Rejection update error:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to reject approval request",
            code: "REJECTION_FAILED",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Log to audit trail
      await supabaseAdmin.from("audit_logs").insert({
        user_id: approver.id,
        target_user_id: approvalRequest.user_id,
        event_type: "role_change_rejected",
        resource_type: "user",
        resource_id: approvalRequest.user_id,
        action: "role_change_rejection",
        changes: {
          before: { role: approvalRequest.current_role },
          after: { role: approvalRequest.requested_role },
        },
        metadata: {
          approval_request_id: body.approval_request_id,
          rejection_reason: body.rejection_reason,
          requester_id: approvalRequest.requester_id,
        },
        ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      // Notify requester and target user
      await supabaseAdmin.from("notifications").insert([
        {
          user_id: approvalRequest.requester_id,
          type: "role_approval_rejected",
          message: `Admin role request for user was rejected`,
          metadata: {
            approval_request_id: body.approval_request_id,
            target_user_id: approvalRequest.user_id,
            rejection_reason: body.rejection_reason,
            rejected_by: approver.id,
          },
          is_read: false,
        },
        {
          user_id: approvalRequest.user_id,
          type: "role_approval_rejected",
          message: `Your admin role request was rejected`,
          metadata: {
            approval_request_id: body.approval_request_id,
            rejection_reason: body.rejection_reason,
            rejected_by: approver.id,
          },
          is_read: false,
        },
      ]);

      const response: ApproveRoleResponse = {
        success: true,
        status: "rejected",
        rejection_reason: body.rejection_reason,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Handle approval
    if (approvalRequest.status === "pending") {
      // First approval
      const { error: updateError } = await supabaseAdmin
        .from("pending_role_approvals")
        .update({
          status: "first_approved",
          first_approver_id: approver.id,
          first_approved_at: new Date().toISOString(),
        })
        .eq("id", body.approval_request_id);

      if (updateError) {
        console.error("First approval update error:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to record first approval",
            code: "APPROVAL_FAILED",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Log to audit trail
      await supabaseAdmin.from("audit_logs").insert({
        user_id: approver.id,
        target_user_id: approvalRequest.user_id,
        event_type: "role_change_first_approved",
        resource_type: "user",
        resource_id: approvalRequest.user_id,
        action: "role_change_first_approval",
        changes: {
          before: { role: approvalRequest.current_role },
          after: { role: approvalRequest.requested_role },
        },
        metadata: {
          approval_request_id: body.approval_request_id,
          requester_id: approvalRequest.requester_id,
        },
        ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      const response: ApproveRoleResponse = {
        success: true,
        status: "first_approved",
        remaining_approvals: 1,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Second approval - apply role change
    if (approvalRequest.status === "first_approved") {
      // Ensure different approvers
      if (approvalRequest.first_approver_id === approver.id) {
        return new Response(
          JSON.stringify({
            error: "Both approvals must be from different administrators",
            code: "DUPLICATE_APPROVER",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Apply role change
      const { error: roleUpdateError } = await supabaseAdmin
        .from("auth.users")
        .update({ role: approvalRequest.requested_role })
        .eq("id", approvalRequest.user_id);

      if (roleUpdateError) {
        console.error("Role update error:", roleUpdateError);
        return new Response(
          JSON.stringify({
            error: "Failed to apply role change",
            code: "ROLE_UPDATE_FAILED",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update approval status
      const { error: updateError } = await supabaseAdmin
        .from("pending_role_approvals")
        .update({
          status: "approved",
          second_approver_id: approver.id,
          second_approved_at: new Date().toISOString(),
        })
        .eq("id", body.approval_request_id);

      if (updateError) {
        console.error("Second approval update error:", updateError);
      }

      // Terminate all active sessions for the user
      const { data: sessions } = await supabaseAdmin
        .from("user_sessions")
        .select("id")
        .eq("user_id", approvalRequest.user_id)
        .eq("status", "active");

      let sessionsTerminated = 0;
      if (sessions && sessions.length > 0) {
        const { error: terminateError } = await supabaseAdmin
          .from("user_sessions")
          .update({ status: "terminated", terminated_at: new Date().toISOString() })
          .eq("user_id", approvalRequest.user_id)
          .eq("status", "active");

        if (!terminateError) {
          sessionsTerminated = sessions.length;
        }
      }

      // Log to audit trail
      await supabaseAdmin.from("audit_logs").insert({
        user_id: approver.id,
        target_user_id: approvalRequest.user_id,
        event_type: "role_changed",
        resource_type: "user",
        resource_id: approvalRequest.user_id,
        action: "role_change",
        changes: {
          before: { role: approvalRequest.current_role },
          after: { role: approvalRequest.requested_role },
        },
        metadata: {
          approval_request_id: body.approval_request_id,
          first_approver_id: approvalRequest.first_approver_id,
          second_approver_id: approver.id,
          sessions_terminated: sessionsTerminated,
          dual_approved: true,
        },
        ip_address: req.headers.get("x-forwarded-for") || "0.0.0.0",
        user_agent: req.headers.get("user-agent") || "unknown",
      });

      // Notify requester, target user, and first approver
      await supabaseAdmin.from("notifications").insert([
        {
          user_id: approvalRequest.requester_id,
          type: "role_approved",
          message: `Admin role request approved and applied`,
          metadata: {
            approval_request_id: body.approval_request_id,
            target_user_id: approvalRequest.user_id,
            new_role: approvalRequest.requested_role,
          },
          is_read: false,
        },
        {
          user_id: approvalRequest.user_id,
          type: "role_changed",
          message: `Your role has been changed to ${approvalRequest.requested_role}`,
          metadata: {
            old_role: approvalRequest.current_role,
            new_role: approvalRequest.requested_role,
            sessions_terminated: sessionsTerminated,
          },
          is_read: false,
        },
        {
          user_id: approvalRequest.first_approver_id,
          type: "role_approved",
          message: `Role change approved by second administrator`,
          metadata: {
            approval_request_id: body.approval_request_id,
            target_user_id: approvalRequest.user_id,
            new_role: approvalRequest.requested_role,
          },
          is_read: false,
        },
      ]);

      const response: ApproveRoleResponse = {
        success: true,
        status: "approved",
        role_applied: true,
        user_id: approvalRequest.user_id,
        new_role: approvalRequest.requested_role,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Should not reach here
    return new Response(
      JSON.stringify({
        error: "Invalid approval request state",
        code: "INVALID_STATE",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
