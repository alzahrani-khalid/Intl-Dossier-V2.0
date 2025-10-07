/**
 * Kanban Service - Fetches assignments grouped by workflow stage
 * Feature: 016-implement-kanban
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export type SortOption = 'created_at' | 'sla_deadline' | 'priority';

export interface AssignmentCard {
  id: string;
  title: string;
  assignee: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  priority: 'high' | 'medium' | 'low';
  overall_sla_deadline: string | null;
  current_stage_sla_deadline: string | null;
  created_at: string;
}

export interface KanbanBoardData {
  columns: {
    todo: AssignmentCard[];
    in_progress: AssignmentCard[];
    review: AssignmentCard[];
    done: AssignmentCard[];
    cancelled: AssignmentCard[];
  };
}

export class KanbanService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getEngagementKanbanBoard(
    engagementId: string,
    sort: SortOption = 'created_at'
  ): Promise<KanbanBoardData> {
    // Fetch all assignments for engagement with assignee details
    const { data: assignments, error } = await this.supabase
      .from('assignments')
      .select(`
        id,
        title,
        workflow_stage,
        priority,
        overall_sla_deadline,
        current_stage_sla_deadline,
        created_at,
        assignee:staff_profiles!assignee_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('engagement_id', engagementId)
      .order(this.getSortColumn(sort), { ascending: this.getSortAscending(sort) });

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
        title: assignment.title,
        assignee: assignment.assignee ? {
          id: assignment.assignee.id,
          name: assignment.assignee.full_name,
          avatar_url: assignment.assignee.avatar_url
        } : null,
        priority: assignment.priority as 'high' | 'medium' | 'low',
        overall_sla_deadline: assignment.overall_sla_deadline,
        current_stage_sla_deadline: assignment.current_stage_sla_deadline,
        created_at: assignment.created_at
      };

      const stage = assignment.workflow_stage as keyof typeof columns;
      if (stage in columns) {
        columns[stage].push(card);
      }
    });

    return { columns };
  }

  private getSortColumn(sort: SortOption): string {
    const sortColumns: Record<SortOption, string> = {
      'created_at': 'created_at',
      'sla_deadline': 'overall_sla_deadline',
      'priority': 'priority'
    };
    return sortColumns[sort];
  }

  private getSortAscending(sort: SortOption): boolean {
    // created_at and sla_deadline: ASC (oldest/most urgent first)
    // priority: DESC (high → medium → low)
    return sort !== 'priority';
  }
}
