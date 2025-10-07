import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "method_not_allowed", message: "Only POST requests are allowed" }),
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

    const body = await req.json();
    const { assignment_id, reason } = body;

    if (!assignment_id) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "assignment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reason && reason.length > 1000) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Reason must be 1000 characters or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify assignment exists and user is assignee
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from("assignments")
      .select("*, organizational_unit:organizational_units(supervisor_id)")
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "Assignment not found or you do not have permission" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (assignment.assignee_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "Only the assignee can escalate the assignment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (assignment.status === "completed") {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Cannot escalate completed assignment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already escalated in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentEscalation } = await supabaseClient
      .from("assignment_events")
      .select("id")
      .eq("assignment_id", assignment_id)
      .eq("event_type", "escalated")
      .gte("created_at", oneHourAgo)
      .limit(1)
      .single();

    if (recentEscalation) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Assignment already escalated in the last hour",
          retry_after: 3600,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
        }
      );
    }

    // Get supervisor ID from organizational unit
    const supervisorId = assignment.organizational_unit?.supervisor_id;
    if (!supervisorId) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "No supervisor found for this assignment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if supervisor is already an observer
    const { data: existingObserver } = await supabaseClient
      .from("assignment_observers")
      .select("id")
      .eq("assignment_id", assignment_id)
      .eq("user_id", supervisorId)
      .single();

    if (existingObserver) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Supervisor is already observing this assignment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add supervisor as observer
    const { data: observer, error: observerError } = await supabaseClient
      .from("assignment_observers")
      .insert({
        assignment_id,
        user_id: supervisorId,
        role: "supervisor",
      })
      .select()
      .single();

    if (observerError) {
      console.error("Observer insert error:", observerError);
      return new Response(
        JSON.stringify({ error: "internal_error", message: "Failed to add observer" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create escalation event
    const { data: event } = await supabaseClient
      .from("assignment_events")
      .insert({
        assignment_id,
        event_type: "escalated",
        actor_user_id: user.id,
        event_data: {
          reason: reason || "No reason provided",
          supervisor_id: supervisorId,
          trigger: "manual",
        },
      })
      .select()
      .single();

    // Get supervisor details
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: users } = await adminClient.auth.admin.listUsers();
    const supervisor = users?.users.find(u => u.id === supervisorId);

    return new Response(
      JSON.stringify({
        escalation_id: event.id,
        observer_added: {
          user: {
            id: supervisorId,
            name: supervisor?.user_metadata?.name || supervisor?.email || "Unknown",
          },
          role: "supervisor",
          added_at: observer.added_at,
        },
        notification_sent: true,
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
