import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "method_not_allowed",
        message: "Only POST requests are allowed",
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
          error: "unauthorized",
          message: "Missing authorization header",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "unauthorized",
          message: "Invalid user session",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { assignment_id, text } = body;

    // Validate input
    if (!assignment_id || !text) {
      return new Response(
        JSON.stringify({
          error: "bad_request",
          message: "assignment_id and text are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({
          error: "bad_request",
          message: "Comment text must be 5000 characters or less",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check rate limit: 10 comments/minute per assignment
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentComments, error: countError } = await supabaseClient
      .from("assignment_comments")
      .select("id", { count: "exact", head: true })
      .eq("assignment_id", assignment_id)
      .eq("user_id", user.id)
      .gte("created_at", oneMinuteAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    } else if (recentComments && (recentComments as unknown as { count: number }).count >= 10) {
      return new Response(
        JSON.stringify({
          error: "rate_limit_exceeded",
          message: "Maximum 10 comments per minute per assignment",
          retry_after: 60,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    // Verify user has permission to comment (RLS will also check)
    const { data: assignment, error: assignmentError } = await supabaseClient
      .from("assignments")
      .select("id, assignee_id")
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: "You do not have permission to comment on this assignment",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = [...text.matchAll(mentionRegex)].map(m => m[1]);

    // Insert comment
    const { data: comment, error: insertError } = await supabaseClient
      .from("assignment_comments")
      .insert({
        assignment_id,
        user_id: user.id,
        text,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Comment insert error:", insertError);
      return new Response(
        JSON.stringify({
          error: "internal_error",
          message: "Failed to create comment",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process mentions - validate and create notifications
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const validMentions = [];
    for (const username of mentions) {
      // Find user by username
      const { data: users } = await adminClient.auth.admin.listUsers();
      const mentionedUser = users?.users.find(
        u => u.user_metadata?.username === username || u.email?.split("@")[0] === username
      );

      if (!mentionedUser) continue;

      // Check if mentioned user has view permission to assignment
      const { data: hasAccess } = await supabaseClient
        .from("assignments")
        .select("id")
        .eq("id", assignment_id)
        .or(`assignee_id.eq.${mentionedUser.id},id.in.(select assignment_id from assignment_observers where user_id=${mentionedUser.id})`)
        .single();

      if (hasAccess) {
        // Create mention record
        await supabaseClient.from("comment_mentions").insert({
          comment_id: comment.id,
          mentioned_user_id: mentionedUser.id,
          notified_at: new Date().toISOString(),
        });

        validMentions.push({
          id: mentionedUser.id,
          name: mentionedUser.user_metadata?.name || mentionedUser.email || "Unknown",
          username: mentionedUser.user_metadata?.username || mentionedUser.email?.split("@")[0] || "",
        });

        // Create notification (if notifications table exists)
        // await supabaseClient.from("notifications").insert({
        //   user_id: mentionedUser.id,
        //   type: "mention",
        //   title: "You were mentioned in a comment",
        //   message: `${user.user_metadata?.name || user.email} mentioned you in assignment ${assignment_id}`,
        //   link: `/assignments/${assignment_id}`,
        // });
      }
    }

    // Create timeline event
    await supabaseClient.from("assignment_events").insert({
      assignment_id,
      event_type: "commented",
      actor_user_id: user.id,
      event_data: {
        comment_id: comment.id,
        mentions: validMentions.map(m => m.username),
      },
    });

    // Return enriched comment
    return new Response(
      JSON.stringify({
        id: comment.id,
        text: comment.text,
        author: {
          id: user.id,
          name: user.user_metadata?.name || user.email || "Unknown",
          username: user.user_metadata?.username || user.email?.split("@")[0] || "",
        },
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        mentions: validMentions,
        reactions: [],
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
        correlation_id: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
