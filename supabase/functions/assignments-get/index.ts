import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
    // Extract assignment ID from request body FIRST
    const requestBody = await req.json();
    const assignmentId = requestBody.id;

    if (!assignmentId) {
      return new Response(
        JSON.stringify({
          error: "bad_request",
          message: "Assignment ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Create Supabase client with service role to bypass RLS
    // We'll implement our own authorization logic
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error("Auth error:", userError);
      console.error("User:", user);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          details: userError?.message || "No user found"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authenticated user:", user.id, user.email);
    console.log("Requesting assignment:", assignmentId);

    // Fetch assignment with engagement context
    // Note: We're using service role, so RLS is bypassed. We implement auth checks manually below.
    // Updated to query 'tasks' table for unified tasks model (025-unified-tasks-model)
    const { data: assignment, error: assignmentError} = await supabaseClient
      .from("tasks")
      .select(`
        id,
        work_item_id,
        work_item_type,
        assignee_id,
        assigned_by,
        priority,
        status,
        sla_deadline,
        engagement_id,
        escalation_recipient_id,
        created_at,
        updated_at,
        completed_at,
        completed_by,
        required_skills,
        work_item_title,
        work_item_content_preview,
        engagement:engagements!left(
          id,
          title,
          engagement_type,
          engagement_date,
          location,
          description
        )
      `)
      .eq("id", assignmentId)
      .single();

    if (assignmentError) {
      console.error("Assignment query error:", assignmentError);
      console.error("Assignment error code:", assignmentError.code);
      console.error("Assignment error message:", assignmentError.message);
      console.error("Assignment data:", assignment);

      if (assignmentError.code === "PGRST116") {
        return new Response(
          JSON.stringify({
            error: "not_found",
            message: "Assignment not found",
            debug: { code: assignmentError.code, userId: user.id }
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // RLS deny returns empty result, treat as 403
      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: "You do not have permission to view this assignment",
          debug: {
            code: assignmentError.code,
            userId: user.id,
            assignmentId,
            errorMessage: assignmentError.message
          }
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully fetched assignment:", assignment?.id);

    // Manual authorization check (since we're using service role to bypass RLS)
    // User can view if they are:
    // 1. The assignee
    // 2. The assigning supervisor/admin (assigned_by)
    // 3. The current escalation recipient
    // 4. An observer
    // 5. A supervisor in the same unit
    // 6. An admin
    const isAssignee = assignment.assignee_id === user.id;
    const isAssignedBy = assignment.assigned_by === user.id;
    const isEscalationRecipient = assignment.escalation_recipient_id === user.id;

    let isObserver = false;
    let isSupervisorInSameUnit = false;
    let isAdmin = false;

    if (!isAssignee && !isAssignedBy && !isEscalationRecipient) {
      // Check if user is an observer
      const { data: observers } = await supabaseClient
        .from("assignment_observers")
        .select("user_id")
        .eq("assignment_id", assignmentId)
        .eq("user_id", user.id)
        .single();

      isObserver = !!observers;

      // Check if user is supervisor/admin in same unit
      const { data: userProfile } = await supabaseClient
        .from("staff_profiles")
        .select("role, unit_id")
        .eq("user_id", user.id)
        .single();

      const { data: assigneeProfile } = await supabaseClient
        .from("staff_profiles")
        .select("unit_id")
        .eq("user_id", assignment.assignee_id)
        .single();

      isSupervisorInSameUnit =
        !!userProfile?.role && ['supervisor', 'admin'].includes(userProfile.role) &&
        userProfile?.unit_id === assigneeProfile?.unit_id;

      isAdmin = userProfile?.role === 'admin';
    }

    if (
      !isAssignee &&
      !isAssignedBy &&
      !isEscalationRecipient &&
      !isObserver &&
      !isSupervisorInSameUnit &&
      !isAdmin
    ) {
      console.error("Authorization failed:", {
        userId: user.id,
        assigneeId: assignment.assignee_id,
        isAssignee,
        isAssignedBy,
        isEscalationRecipient,
        isObserver,
        isSupervisorInSameUnit,
        isAdmin
      });

      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: "You do not have permission to view this assignment",
          debug: {
            userId: user.id,
            assignmentId,
            reason: "Not in allowed viewer roles",
            flags: {
              isAssignee,
              isAssignedBy,
              isEscalationRecipient,
              isObserver,
              isSupervisorInSameUnit,
              isAdmin
            }
          }
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authorization passed for user:", user.id);

    // Fetch task data if work_item_type is 'task'
    let workItemTitle = "Untitled";
    let workItemPreview = "";
    let workItemLinkedEntities: any[] = [];

    if (assignment.work_item_type === 'task' && assignment.work_item_id) {
      const { data: task, error: taskError } = await supabaseClient
        .from("tasks")
        .select("id, title, description, source, status")
        .eq("id", assignment.work_item_id)
        .single();

      if (task && !taskError) {
        workItemTitle = task.title;
        workItemPreview = task.description || "";

        // Extract linked entity IDs from task source
        const linkedEntities: any[] = [];

        // Fetch linked dossiers
        if (task.source?.dossier_ids && Array.isArray(task.source.dossier_ids)) {
          const { data: dossiers } = await supabaseClient
            .from("dossiers")
            .select("id, name_en, name_ar, status")
            .in("id", task.source.dossier_ids);

          if (dossiers) {
            linkedEntities.push(...dossiers.map((d: any) => ({
              type: 'dossier',
              id: d.id,
              name_en: d.name_en,
              name_ar: d.name_ar,
              status: d.status,
            })));
          }
        }

        // Fetch linked positions
        if (task.source?.position_ids && Array.isArray(task.source.position_ids)) {
          const { data: positions } = await supabaseClient
            .from("positions")
            .select("id, title_en, title_ar, status")
            .in("id", task.source.position_ids);

          if (positions) {
            linkedEntities.push(...positions.map((p: any) => ({
              type: 'position',
              id: p.id,
              title_en: p.title_en,
              title_ar: p.title_ar,
              status: p.status,
            })));
          }
        }

        // Fetch linked tickets
        if (task.source?.ticket_ids && Array.isArray(task.source.ticket_ids)) {
          const { data: tickets } = await supabaseClient
            .from("intake_tickets")
            .select("id, title, title_ar, ticket_number, status")
            .in("id", task.source.ticket_ids);

          if (tickets) {
            linkedEntities.push(...tickets.map((t: any) => ({
              type: 'ticket',
              id: t.id,
              title_en: t.title,
              title_ar: t.title_ar,
              ticket_number: t.ticket_number,
              status: t.status,
            })));
          }
        }

        workItemLinkedEntities = linkedEntities;
      }
    } else {
      // Legacy fallback for non-task work items
      workItemTitle = assignment.work_item_title || "Untitled";
      workItemPreview = assignment.work_item_content_preview || "";
    }

    // Fetch comments with reactions and mentions
    const { data: comments, error: commentsError } = await supabaseClient
      .from("assignment_comments")
      .select(`
        id,
        text,
        created_at,
        updated_at,
        user_id,
        comment_reactions(emoji, user_id, created_at),
        comment_mentions(mentioned_user_id)
      `)
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    // Fetch checklist items
    const { data: checklistItems, error: checklistError } = await supabaseClient
      .from("assignment_checklist_items")
      .select("id, assignment_id, text, completed, completed_at, completed_by, sequence, created_at")
      .eq("assignment_id", assignmentId)
      .order("sequence", { ascending: true });

    // Fetch timeline events
    const { data: timelineEvents, error: timelineError } = await supabaseClient
      .from("assignment_events")
      .select("id, assignment_id, event_type, actor_user_id, event_data, created_at")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: false });

    // Fetch observers
    const { data: observers, error: observersError } = await supabaseClient
      .from("assignment_observers")
      .select("id, assignment_id, user_id, role, added_at, added_by")
      .eq("assignment_id", assignmentId);

    // Calculate checklist progress
    const { data: progressData } = await supabaseClient
      .rpc("get_assignment_progress", { p_assignment_id: assignmentId });

    const progressPercentage = progressData || 0;

    // Fetch user details for author, completed_by, etc.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: users } = await adminClient.auth.admin.listUsers();

    // Helper to get user details
    const getUserDetails = (userId: string) => {
      const userDetail = users?.users.find((u) => u.id === userId);
      return {
        id: userId,
        name: userDetail?.user_metadata?.name || userDetail?.email || "Unknown",
        username: userDetail?.user_metadata?.username || userDetail?.email?.split("@")[0] || "",
      };
    };

    // Enrich comments with user details and reaction summaries
    const enrichedComments = comments?.map((comment) => {
      const reactions = comment.comment_reactions || [];
      const reactionSummaries: Record<string, { count: number; users: string[]; user_reacted: boolean }> = {};

      reactions.forEach((reaction: { emoji: string; user_id: string }) => {
        if (!reactionSummaries[reaction.emoji]) {
          reactionSummaries[reaction.emoji] = {
            count: 0,
            users: [],
            user_reacted: false,
          };
        }
        reactionSummaries[reaction.emoji].count++;
        const reactionUser = getUserDetails(reaction.user_id);
        reactionSummaries[reaction.emoji].users.push(reactionUser.name);
        if (reaction.user_id === user.id) {
          reactionSummaries[reaction.emoji].user_reacted = true;
        }
      });

      return {
        id: comment.id,
        text: comment.text,
        author: getUserDetails(comment.user_id),
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        mentions: (comment.comment_mentions || []).map((m: { mentioned_user_id: string }) =>
          getUserDetails(m.mentioned_user_id)
        ),
        reactions: Object.entries(reactionSummaries).map(([emoji, summary]) => ({
          emoji,
          ...summary,
        })),
      };
    }) || [];

    // Enrich checklist items with user details
    const enrichedChecklistItems = checklistItems?.map((item) => ({
      id: item.id,
      text: item.text,
      completed: item.completed,
      completed_at: item.completed_at,
      completed_by: item.completed_by ? getUserDetails(item.completed_by) : null,
      sequence: item.sequence,
    })) || [];

    // Enrich timeline events with actor details
    const enrichedTimelineEvents = timelineEvents?.map((event) => ({
      id: event.id,
      event_type: event.event_type,
      actor: getUserDetails(event.actor_user_id),
      event_data: event.event_data,
      created_at: event.created_at,
      is_critical: ["escalated", "completed", "status_changed"].includes(event.event_type),
    })) || [];

    // Enrich observers with user details
    const enrichedObservers = observers?.map((observer) => ({
      user: getUserDetails(observer.user_id),
      role: observer.role,
      added_at: observer.added_at,
    })) || [];

    // Calculate SLA tracking
    const now = new Date();
    const deadline = new Date(assignment.sla_deadline);
    const assignedAt = new Date(assignment.created_at);
    const totalDuration = deadline.getTime() - assignedAt.getTime();
    const elapsed = now.getTime() - assignedAt.getTime();
    const remaining = deadline.getTime() - now.getTime();
    const percentageElapsed = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

    let healthStatus = "safe";
    if (percentageElapsed >= 100) {
      healthStatus = "breached";
    } else if (percentageElapsed >= 75) {
      healthStatus = "warning";
    }

    // Determine permissions
    const canEscalate = assignment.assignee_id === user.id && assignment.status !== "completed";
    const canComplete = (assignment.assignee_id === user.id || observers?.some(o => o.user_id === user.id)) &&
                       assignment.status !== "completed";

    // Fetch related assignments for engagement context
    let engagementAssignmentsData = { total: 0, completed: 0, progress: 0 };
    if (assignment.engagement_id) {
      const { data: relatedAssignments } = await supabaseClient
        .from("tasks")
        .select("id, status")
        .eq("engagement_id", assignment.engagement_id);

      if (relatedAssignments) {
        engagementAssignmentsData.total = relatedAssignments.length;
        engagementAssignmentsData.completed = relatedAssignments.filter(a => a.status === "completed").length;
        engagementAssignmentsData.progress = engagementAssignmentsData.total > 0
          ? Math.round((engagementAssignmentsData.completed / engagementAssignmentsData.total) * 100)
          : 0;
      }
    }

    // Build response matching frontend AssignmentDetailResponse interface
    const response = {
      assignment: {
        ...assignment,
        assignee_name: getUserDetails(assignment.assignee_id).name,
        assigned_by_name: getUserDetails(assignment.assigned_by).name,
        work_item_title: workItemTitle,
        work_item_preview: workItemPreview,
        work_item_linked_entities: workItemLinkedEntities,
        required_skills: assignment.required_skills || [],
        can_escalate: canEscalate,
        can_complete: canComplete,
      },
      engagement: assignment.engagement_id ? {
        id: assignment.engagement_id,
        title_en: assignment.engagement?.title || "",
        title_ar: assignment.engagement?.title || "",
        engagement_type: assignment.engagement?.engagement_type || "",
        start_date: assignment.engagement?.engagement_date || new Date().toISOString(),
        end_date: assignment.engagement?.engagement_date || new Date().toISOString(),
        progress_percentage: engagementAssignmentsData.progress,
        total_assignments: engagementAssignmentsData.total,
        completed_assignments: engagementAssignmentsData.completed,
      } : null,
      sla: {
        deadline: assignment.sla_deadline,
        time_remaining_seconds: Math.max(0, Math.floor(remaining / 1000)),
        percentage_elapsed: percentageElapsed,
        health_status: healthStatus,
      },
      comments: enrichedComments,
      checklist_items: enrichedChecklistItems,
      observers: enrichedObservers,
      timeline: enrichedTimelineEvents,
      checklist_progress: progressPercentage,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
