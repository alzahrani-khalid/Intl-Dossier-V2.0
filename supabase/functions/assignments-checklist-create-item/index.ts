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
    const { assignment_id, text } = body;

    if (!assignment_id || !text) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "assignment_id and text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > 500) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Text must be 500 characters or less" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify permission (RLS will also check)
    const { data: assignment } = await supabaseClient
      .from("assignments")
      .select("id")
      .eq("id", assignment_id)
      .single();

    if (!assignment) {
      return new Response(
        JSON.stringify({ error: "forbidden", message: "You do not have permission to modify this checklist" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max sequence number
    const { data: maxSeq } = await supabaseClient
      .from("assignment_checklist_items")
      .select("sequence")
      .eq("assignment_id", assignment_id)
      .order("sequence", { ascending: false })
      .limit(1)
      .single();

    const sequence = (maxSeq?.sequence || 0) + 1;

    // Insert item
    const { data: item, error: insertError } = await supabaseClient
      .from("assignment_checklist_items")
      .insert({
        assignment_id,
        text,
        sequence,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "internal_error", message: "Failed to create checklist item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create timeline event
    await supabaseClient.from("assignment_events").insert({
      assignment_id,
      event_type: "checklist_updated",
      actor_user_id: user.id,
      event_data: { action: "item_added", item_id: item.id },
    });

    return new Response(
      JSON.stringify({
        id: item.id,
        text: item.text,
        completed: item.completed,
        completed_at: item.completed_at,
        completed_by: item.completed_by,
        sequence: item.sequence,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
