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
    const { item_id, completed } = body;

    if (!item_id || completed === undefined) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "item_id and completed are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch current item
    const { data: item, error: itemError } = await supabaseClient
      .from("assignment_checklist_items")
      .select("*, assignment_id")
      .eq("id", item_id)
      .single();

    if (itemError || !item) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Invalid item ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update item
    const updateData = {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? user.id : null,
    };

    const { data: updatedItem, error: updateError } = await supabaseClient
      .from("assignment_checklist_items")
      .update(updateData)
      .eq("id", item_id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "forbidden", message: "You do not have permission to update this checklist" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate progress
    const { data: progressData } = await supabaseClient
      .rpc("get_assignment_progress", { p_assignment_id: item.assignment_id });

    // Create timeline event
    await supabaseClient.from("assignment_events").insert({
      assignment_id: item.assignment_id,
      event_type: "checklist_updated",
      actor_user_id: user.id,
      event_data: {
        action: completed ? "item_completed" : "item_uncompleted",
        item_id,
        progress_percentage: progressData || 0,
      },
    });

    // Get user details for completed_by
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: users } = await adminClient.auth.admin.listUsers();
    const completedByUser = updatedItem.completed_by ? users?.users.find(u => u.id === updatedItem.completed_by) : null;

    return new Response(
      JSON.stringify({
        id: updatedItem.id,
        text: updatedItem.text,
        completed: updatedItem.completed,
        completed_at: updatedItem.completed_at,
        completed_by: completedByUser ? {
          id: completedByUser.id,
          name: completedByUser.user_metadata?.name || completedByUser.email || "Unknown",
        } : null,
        sequence: updatedItem.sequence,
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
