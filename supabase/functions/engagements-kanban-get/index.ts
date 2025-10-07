import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Inline KanbanService for Deno Edge Function
type SortOption = 'created_at' | 'sla_deadline' | 'priority';

interface AssignmentCard {
  id: string;
  work_item_id: string;
  work_item_type: string;
  assignee: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  priority: 'high' | 'medium' | 'low';
  overall_sla_deadline: string | null;
  current_stage_sla_deadline: string | null;
  created_at: string;
}

interface KanbanBoardData {
  columns: {
    todo: AssignmentCard[];
    in_progress: AssignmentCard[];
    review: AssignmentCard[];
    done: AssignmentCard[];
    cancelled: AssignmentCard[];
  };
}

async function getEngagementKanbanBoard(
  supabase: any,
  engagementId: string,
  sort: SortOption = 'created_at'
): Promise<KanbanBoardData> {
  const getSortColumn = (s: SortOption): string => {
    const sortColumns: Record<SortOption, string> = {
      'created_at': 'created_at',
      'sla_deadline': 'overall_sla_deadline',
      'priority': 'priority'
    };
    return sortColumns[s];
  };

  const getSortAscending = (s: SortOption): boolean => {
    return s !== 'priority';
  };

  // Fetch all assignments for engagement
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      id,
      work_item_id,
      work_item_type,
      workflow_stage,
      priority,
      overall_sla_deadline,
      current_stage_sla_deadline,
      created_at,
      assignee_id
    `)
    .eq('engagement_id', engagementId)
    .order(getSortColumn(sort), { ascending: getSortAscending(sort) });

  if (error) throw error;

  // Group assignments by workflow_stage
  const columns: KanbanBoardData['columns'] = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    cancelled: []
  };

  assignments?.forEach((assignment: any) => {
    const card: AssignmentCard = {
      id: assignment.id,
      work_item_id: assignment.work_item_id,
      work_item_type: assignment.work_item_type,
      assignee: assignment.assignee_id ? {
        id: assignment.assignee_id,
        full_name: 'Staff Member', // Placeholder - would need to join with users table
        avatar_url: null
      } : null,
      priority: assignment.priority as 'high' | 'medium' | 'low',
      overall_sla_deadline: assignment.overall_sla_deadline,
      current_stage_sla_deadline: assignment.current_stage_sla_deadline,
      created_at: assignment.created_at
    };

    const stage = assignment.workflow_stage as keyof typeof columns;
    if (columns[stage]) {
      columns[stage].push(card);
    }
  });

  return { columns };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract engagement ID from query parameters
    const url = new URL(req.url);
    const engagementId = url.searchParams.get('engagement_id');

    if (!engagementId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Engagement ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract sort parameter
    const sortParam = url.searchParams.get('sort') || 'created_at';
    const validSorts = ['created_at', 'sla_deadline', 'priority'];
    const sort = validSorts.includes(sortParam) ? sortParam as SortOption : 'created_at';

    // Create Supabase client with user JWT
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user has access to engagement (RLS will enforce)
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ success: false, error: 'Engagement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Kanban board data
    const kanbanData = await getEngagementKanbanBoard(supabase, engagementId, sort);

    return new Response(JSON.stringify(kanbanData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in engagements-kanban-get:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
