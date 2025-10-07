// Auto-generated types for Supabase database
// Feature: 014-full-assignment-detail
// Generated: 2025-10-03

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type EngagementWorkflowStage = 'todo' | 'in_progress' | 'review' | 'done'
export type AssignmentEventType =
  | 'created'
  | 'status_changed'
  | 'escalated'
  | 'completed'
  | 'commented'
  | 'checklist_updated'
  | 'observer_added'
  | 'reassigned'
  | 'workflow_stage_changed'

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string
          work_item_type: string
          work_item_id: string
          assignee_id: string
          assigned_by: string | null
          assigned_at: string
          status: string
          priority: string
          engagement_id: string | null
          workflow_stage: EngagementWorkflowStage
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          work_item_type: string
          work_item_id: string
          assignee_id: string
          assigned_by?: string | null
          assigned_at?: string
          status?: string
          priority?: string
          engagement_id?: string | null
          workflow_stage?: EngagementWorkflowStage
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          work_item_type?: string
          work_item_id?: string
          assignee_id?: string
          assigned_by?: string | null
          assigned_at?: string
          status?: string
          priority?: string
          engagement_id?: string | null
          workflow_stage?: EngagementWorkflowStage
          created_at?: string
          updated_at?: string
        }
      }
      assignment_comments: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
      comment_reactions: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      comment_mentions: {
        Row: {
          id: string
          comment_id: string
          mentioned_user_id: string
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          mentioned_user_id: string
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          mentioned_user_id?: string
          notified_at?: string | null
          created_at?: string
        }
      }
      assignment_checklist_items: {
        Row: {
          id: string
          assignment_id: string
          text: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          sequence: number
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          text: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          sequence: number
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          text?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          sequence?: number
          created_at?: string
        }
      }
      assignment_checklist_templates: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          description_en: string | null
          description_ar: string | null
          applicable_work_types: string[]
          items_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_en: string
          name_ar: string
          description_en?: string | null
          description_ar?: string | null
          applicable_work_types: string[]
          items_json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_en?: string
          name_ar?: string
          description_en?: string | null
          description_ar?: string | null
          applicable_work_types?: string[]
          items_json?: Json
          created_at?: string
          updated_at?: string
        }
      }
      assignment_observers: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          role: 'supervisor' | 'other'
          added_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          user_id: string
          role: 'supervisor' | 'other'
          added_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          role?: 'supervisor' | 'other'
          added_at?: string
        }
      }
      assignment_events: {
        Row: {
          id: string
          assignment_id: string
          event_type: AssignmentEventType
          actor_user_id: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          event_type: AssignmentEventType
          actor_user_id: string
          event_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          event_type?: AssignmentEventType
          actor_user_id?: string
          event_data?: Json
          created_at?: string
        }
      }
      engagements: {
        Row: {
          id: string
          title_en: string
          title_ar: string
          engagement_type: string
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_en: string
          title_ar: string
          engagement_type: string
          start_date: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_en?: string
          title_ar?: string
          engagement_type?: string
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dossiers: {
        Row: {
          id: string
          title_en: string
          title_ar: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_en: string
          title_ar: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_en?: string
          title_ar?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_assignment_progress: {
        Args: { p_assignment_id: string }
        Returns: number
      }
      get_engagement_progress: {
        Args: { p_engagement_id: string }
        Returns: {
          total_assignments: number
          completed_assignments: number
          in_progress_assignments: number
          todo_assignments: number
          progress_percentage: number
          kanban_stats: Json
        }[]
      }
      get_comment_reactions: {
        Args: { p_comment_id: string }
        Returns: {
          emoji: string
          count: number
          users: string[]
        }[]
      }
      user_can_view_assignment: {
        Args: { user_id: string; assignment_id: string }
        Returns: boolean
      }
    }
    Enums: {
      engagement_workflow_stage: EngagementWorkflowStage
      assignment_event_type: AssignmentEventType
    }
  }
}
