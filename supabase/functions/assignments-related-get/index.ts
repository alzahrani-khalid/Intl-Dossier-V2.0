import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed", message: "Only GET requests are allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Invalid user session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract assignment ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const assignmentId = pathParts[pathParts.length - 1];

    if (!assignmentId || assignmentId === "assignments-related") {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Assignment ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current assignment
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from("assignments")
      .select("id, engagement_id, work_item_id, work_item_type")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      if (assignmentError?.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "not_found", message: "Assignment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "forbidden", message: "You do not have permission to view this assignment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let contextType = "standalone";
    let contextId = null;
    let contextTitle = null;
    let relatedAssignments = [];
    let progress = null;

    if (assignment.engagement_id) {
      // Engagement context
      contextType = "engagement";
      contextId = assignment.engagement_id;

      // Fetch engagement details
      const { data: engagement } = await supabaseClient
        .from("engagements")
        .select("title_en, title_ar")
        .eq("id", assignment.engagement_id)
        .single();

      contextTitle = engagement?.title_en || "Unnamed Engagement";

      // Fetch sibling assignments
      const { data: siblings } = await supabaseClient
        .from("assignments")
        .select("*")
        .eq("engagement_id", assignment.engagement_id)
        .neq("id", assignmentId);

      relatedAssignments = siblings || [];

      // Calculate progress
      const { data: progressData } = await supabaseClient
        .rpc("get_engagement_progress", { p_engagement_id: assignment.engagement_id });

      progress = progressData?.[0] || null;

    } else if (assignment.work_item_type === "dossier") {
      // Dossier context
      contextType = "dossier";
      contextId = assignment.work_item_id;

      // Fetch dossier details
      const { data: dossier } = await supabaseClient
        .from("dossiers")
        .select("title_en")
        .eq("id", assignment.work_item_id)
        .single();

      contextTitle = dossier?.title_en || "Unnamed Dossier";

      // Fetch related dossier assignments
      const { data: siblings } = await supabaseClient
        .from("assignments")
        .select("*")
        .eq("work_item_id", assignment.work_item_id)
        .eq("work_item_type", "dossier")
        .neq("id", assignmentId);

      relatedAssignments = siblings || [];
    }

    // Fetch user details for assignees
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: users } = await adminClient.auth.admin.listUsers();

    // Enrich related assignments
    const enrichedRelated = relatedAssignments.map(a => {
      const assignee = users?.users.find(u => u.id === a.assignee_id);
      const now = new Date();
      const deadline = new Date(a.sla_deadline);
      const slaRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));

      return {
        id: a.id,
        title: a.work_item_title || "Untitled",
        assignee: assignee?.user_metadata?.name || assignee?.email || null,
        assignee_id: a.assignee_id,
        status: a.status,
        workflow_stage: a.workflow_stage,
        completed_at: a.completed_at,
        priority: a.priority,
        sla_remaining_seconds: slaRemaining,
      };
    });

    return new Response(
      JSON.stringify({
        context_type: contextType,
        context_id: contextId,
        context_title: contextTitle,
        progress: progress ? {
          total: progress.total_assignments,
          completed: progress.completed_assignments,
          in_progress: progress.in_progress_assignments,
          todo: progress.todo_assignments,
          percentage: progress.progress_percentage,
        } : null,
        related_assignments: enrichedRelated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
