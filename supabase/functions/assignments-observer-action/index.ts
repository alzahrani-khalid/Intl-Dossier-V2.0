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
    const { assignment_id, action, reassign_to_user_id } = body;

    if (!assignment_id || !action) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "assignment_id and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["accept", "reassign", "continue_observing"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Invalid action. Must be: accept, reassign, or continue_observing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reassign" && !reassign_to_user_id) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "reassign_to_user_id is required for reassign action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is an observer
    const { data: observer, error: observerError } = await supabaseClient
      .from("assignment_observers")
      .select("*")
      .eq("assignment_id", assignment_id)
      .eq("user_id", user.id)
      .single();

    if (observerError || !observer) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "You are not an observer of this assignment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current assignment
    const { data: assignment } = await supabaseClient
      .from("assignments")
      .select("*")
      .eq("id", assignment_id)
      .single();

    let updatedAssignment;

    if (action === "accept") {
      // Reassign to observer (self)
      const { data, error: updateError } = await supabaseClient
        .from("assignments")
        .update({ assignee_id: user.id })
        .eq("id", assignment_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Failed to accept assignment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      updatedAssignment = data;

      // Remove from observers
      await supabaseClient
        .from("assignment_observers")
        .delete()
        .eq("id", observer.id);

      // Create event
      await supabaseClient.from("assignment_events").insert({
        assignment_id,
        event_type: "reassigned",
        actor_user_id: user.id,
        event_data: {
          old_assignee_id: assignment.assignee_id,
          new_assignee_id: user.id,
          reason: "Observer accepted assignment",
        },
      });

    } else if (action === "reassign") {
      // Reassign to specified user
      const { data, error: updateError } = await supabaseClient
        .from("assignments")
        .update({ assignee_id: reassign_to_user_id })
        .eq("id", assignment_id)
        .select()
        .single();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "internal_error", message: "Failed to reassign assignment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      updatedAssignment = data;

      // Create event
      await supabaseClient.from("assignment_events").insert({
        assignment_id,
        event_type: "reassigned",
        actor_user_id: user.id,
        event_data: {
          old_assignee_id: assignment.assignee_id,
          new_assignee_id: reassign_to_user_id,
          reason: "Observer reassigned to another user",
        },
      });

    } else {
      // continue_observing - no changes needed
      updatedAssignment = assignment;
    }

    return new Response(
      JSON.stringify({
        id: updatedAssignment.id,
        status: updatedAssignment.status,
        assignee_id: updatedAssignment.assignee_id,
        updated_at: updatedAssignment.updated_at,
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
