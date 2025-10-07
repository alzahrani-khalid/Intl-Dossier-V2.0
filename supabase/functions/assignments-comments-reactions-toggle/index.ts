import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

const ALLOWED_EMOJIS = ['👍', '✅', '❓', '❤️', '🎯', '💡'];

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
    const { comment_id, emoji } = body;

    if (!comment_id || !emoji) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "comment_id and emoji are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return new Response(
        JSON.stringify({ error: "bad_request", message: "Invalid emoji. Allowed: " + ALLOWED_EMOJIS.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if reaction already exists
    const { data: existing, error: existingError } = await supabaseClient
      .from("comment_reactions")
      .select("id")
      .eq("comment_id", comment_id)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .single();

    let action = "added";
    if (existing) {
      // Remove reaction
      await supabaseClient
        .from("comment_reactions")
        .delete()
        .eq("id", existing.id);
      action = "removed";
    } else {
      // Add reaction
      await supabaseClient
        .from("comment_reactions")
        .insert({
          comment_id,
          user_id: user.id,
          emoji,
        });
    }

    // Get updated reaction counts
    const { data: reactions } = await supabaseClient
      .from("comment_reactions")
      .select("emoji, user_id")
      .eq("comment_id", comment_id)
      .eq("emoji", emoji);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: users } = await adminClient.auth.admin.listUsers();

    const reactionSummary = {
      emoji,
      count: reactions?.length || 0,
      users: reactions?.map(r => {
        const u = users?.users.find(u => u.id === r.user_id);
        return u?.user_metadata?.name || u?.email || "Unknown";
      }) || [],
      user_reacted: action === "added",
    };

    return new Response(
      JSON.stringify({ action, reaction: reactionSummary }),
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
