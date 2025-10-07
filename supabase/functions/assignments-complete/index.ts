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
    const { assignment_id, completion_notes } = body;

    if (!assignment_id) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "assignment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current assignment
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from("assignments")
      .select("*")
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "Assignment not found or you do not have permission" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user can complete (assignee or observer)
    const { data: isObserver } = await supabaseClient
      .from("assignment_observers")
      .select("id")
      .eq("assignment_id", assignment_id)
      .eq("user_id", user.id)
      .single();

    const canComplete = assignment.assignee_id === user.id || isObserver;
    if (!canComplete) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "You do not have permission to complete this assignment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (assignment.status === "completed") {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Assignment is already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update assignment status
    const { data: updatedAssignment, error: updateError } = await supabaseClient
      .from("assignments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq("id", assignment_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      if (updateError.message?.includes("version")) {
        return new Response(
          JSON.stringify({ error: "conflict", message: "Assignment was modified by another user. Please refresh and try again." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "internal_error", message: "Failed to complete assignment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create completion event
    await supabaseClient.from("assignment_events").insert({
      assignment_id,
      event_type: "completed",
      actor_user_id: user.id,
      event_data: {
        completion_notes: completion_notes || null,
        completed_at: updatedAssignment.completed_at,
      },
    });

    return new Response(
      JSON.stringify({
        id: updatedAssignment.id,
        status: updatedAssignment.status,
        assignee_id: updatedAssignment.assignee_id,
        completed_at: updatedAssignment.completed_at,
        completed_by: user.id,
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
