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
    const { assignment_id, template_id } = body;

    if (!assignment_id || !template_id) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "assignment_id and template_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify permission
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

    // Fetch template
    const { data: template, error: templateError } = await supabaseClient
      .from("assignment_checklist_templates")
      .select("id, name_en, name_ar, items_json, created_at")
      .eq("id", template_id)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Invalid template ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current max sequence
    const { data: maxSeq } = await supabaseClient
      .from("assignment_checklist_items")
      .select("sequence")
      .eq("assignment_id", assignment_id)
      .order("sequence", { ascending: false })
      .limit(1)
      .single();

    let sequence = (maxSeq?.sequence || 0) + 1;

    // Parse template items
    const templateItems = template.items_json as Array<{
      text_en: string;
      text_ar: string;
      sequence: number;
    }>;

    // Determine user's locale (simplified - use English by default)
    const locale = req.headers.get("Accept-Language")?.includes("ar") ? "ar" : "en";

    // Insert items
    const itemsToInsert = templateItems.map(item => ({
      assignment_id,
      text: locale === "ar" ? item.text_ar : item.text_en,
      sequence: sequence++,
    }));

    const { data: insertedItems, error: insertError } = await supabaseClient
      .from("assignment_checklist_items")
      .insert(itemsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "internal_error", message: "Failed to import checklist template" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create timeline event
    await supabaseClient.from("assignment_events").insert({
      assignment_id,
      event_type: "checklist_updated",
      actor_user_id: user.id,
      event_data: {
        action: "template_imported",
        template_id,
        template_name: locale === "ar" ? template.name_ar : template.name_en,
        items_count: insertedItems.length,
      },
    });

    return new Response(
      JSON.stringify({
        items_created: insertedItems.length,
        items: insertedItems.map(item => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
          sequence: item.sequence,
        })),
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
