export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aa_attachments: {
        Row: {
          after_action_id: string
          file_key: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          scan_status: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          after_action_id: string
          file_key: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          scan_status?: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          after_action_id?: string
          file_key?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          scan_status?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "aa_attachments_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      aa_commitments: {
        Row: {
          after_action_id: string
          ai_confidence: number | null
          completed_at: string | null
          created_at: string | null
          description: string
          dossier_id: string
          due_date: string
          id: string
          owner_contact_id: string | null
          owner_type: string
          owner_user_id: string | null
          priority: string
          status: string
          tracking_mode: string
          updated_at: string | null
        }
        Insert: {
          after_action_id: string
          ai_confidence?: number | null
          completed_at?: string | null
          created_at?: string | null
          description: string
          dossier_id: string
          due_date: string
          id?: string
          owner_contact_id?: string | null
          owner_type: string
          owner_user_id?: string | null
          priority?: string
          status?: string
          tracking_mode: string
          updated_at?: string | null
        }
        Update: {
          after_action_id?: string
          ai_confidence?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string
          dossier_id?: string
          due_date?: string
          id?: string
          owner_contact_id?: string | null
          owner_type?: string
          owner_user_id?: string | null
          priority?: string
          status?: string
          tracking_mode?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aa_commitments_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aa_commitments_owner_contact_id_fkey"
            columns: ["owner_contact_id"]
            isOneToOne: false
            referencedRelation: "external_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      aa_follow_up_actions: {
        Row: {
          after_action_id: string
          assigned_to: string | null
          completed: boolean
          created_at: string | null
          description: string
          id: string
          target_date: string | null
          updated_at: string | null
        }
        Insert: {
          after_action_id: string
          assigned_to?: string | null
          completed?: boolean
          created_at?: string | null
          description: string
          id?: string
          target_date?: string | null
          updated_at?: string | null
        }
        Update: {
          after_action_id?: string
          assigned_to?: string | null
          completed?: boolean
          created_at?: string | null
          description?: string
          id?: string
          target_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aa_follow_up_actions_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      aa_notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      aa_risks: {
        Row: {
          after_action_id: string
          ai_confidence: number | null
          created_at: string | null
          description: string
          id: string
          likelihood: string
          mitigation_strategy: string | null
          owner: string | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          after_action_id: string
          ai_confidence?: number | null
          created_at?: string | null
          description: string
          id?: string
          likelihood: string
          mitigation_strategy?: string | null
          owner?: string | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          after_action_id?: string
          ai_confidence?: number | null
          created_at?: string | null
          description?: string
          id?: string
          likelihood?: string
          mitigation_strategy?: string | null
          owner?: string | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aa_risks_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          agenda: Json | null
          costs: Json | null
          created_at: string
          created_by: string
          date: string
          deleted_at: string | null
          documents: string[] | null
          duration_hours: number | null
          evaluation: Json | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          location: Json | null
          outcomes: Json
          participants: Json | null
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
          version: number
        }
        Insert: {
          agenda?: Json | null
          costs?: Json | null
          created_at?: string
          created_by: string
          date: string
          deleted_at?: string | null
          documents?: string[] | null
          duration_hours?: number | null
          evaluation?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          location?: Json | null
          outcomes?: Json
          participants?: Json | null
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          agenda?: Json | null
          costs?: Json | null
          created_at?: string
          created_by?: string
          date?: string
          deleted_at?: string | null
          documents?: string[] | null
          duration_hours?: number | null
          evaluation?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          location?: Json | null
          outcomes?: Json
          participants?: Json | null
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      activity_participants: {
        Row: {
          activity_id: string
          contact_id: string | null
          created_at: string
          external_name: string | null
          external_organization: string | null
          id: string
          role: string
          tenant_id: string
        }
        Insert: {
          activity_id: string
          contact_id?: string | null
          created_at?: string
          external_name?: string | null
          external_organization?: string | null
          id?: string
          role: string
          tenant_id: string
        }
        Update: {
          activity_id?: string
          contact_id?: string | null
          created_at?: string
          external_name?: string | null
          external_organization?: string | null
          id?: string
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      after_action_records: {
        Row: {
          attendees: string[] | null
          created_at: string | null
          created_by: string
          dossier_id: string
          edit_approved_at: string | null
          edit_approved_by: string | null
          edit_rejection_reason: string | null
          edit_request_reason: string | null
          edit_requested_at: string | null
          edit_requested_by: string | null
          engagement_id: string
          id: string
          is_confidential: boolean
          notes: string | null
          publication_status: string
          published_at: string | null
          published_by: string | null
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string | null
          created_by: string
          dossier_id: string
          edit_approved_at?: string | null
          edit_approved_by?: string | null
          edit_rejection_reason?: string | null
          edit_request_reason?: string | null
          edit_requested_at?: string | null
          edit_requested_by?: string | null
          engagement_id: string
          id?: string
          is_confidential?: boolean
          notes?: string | null
          publication_status?: string
          published_at?: string | null
          published_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          attendees?: string[] | null
          created_at?: string | null
          created_by?: string
          dossier_id?: string
          edit_approved_at?: string | null
          edit_approved_by?: string | null
          edit_rejection_reason?: string | null
          edit_request_reason?: string | null
          edit_requested_at?: string | null
          edit_requested_by?: string | null
          engagement_id?: string
          id?: string
          is_confidential?: boolean
          notes?: string | null
          publication_status?: string
          published_at?: string | null
          published_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      after_action_versions: {
        Row: {
          after_action_id: string
          change_summary: string | null
          changed_at: string | null
          changed_by: string
          content: Json
          id: string
          version_number: number
        }
        Insert: {
          after_action_id: string
          change_summary?: string | null
          changed_at?: string | null
          changed_by: string
          content: Json
          id?: string
          version_number: number
        }
        Update: {
          after_action_id?: string
          change_summary?: string | null
          changed_at?: string | null
          changed_by?: string
          content?: Json
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "after_action_versions_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      aging_bucket_update_logs: {
        Row: {
          cache_keys_invalidated: number | null
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: number
          status: string | null
          total_assignments: number | null
          updated_count: number | null
        }
        Insert: {
          cache_keys_invalidated?: number | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: number
          status?: string | null
          total_assignments?: number | null
          updated_count?: number | null
        }
        Update: {
          cache_keys_invalidated?: number | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: number
          status?: string | null
          total_assignments?: number | null
          updated_count?: number | null
        }
        Relationships: []
      }
      ai_embeddings: {
        Row: {
          content_hash: string
          created_at: string
          embedding: string
          embedding_dim: number
          expires_at: string | null
          id: string
          model: string
          model_version: string
          owner_id: string
          owner_type: Database["public"]["Enums"]["embedding_owner_type"]
        }
        Insert: {
          content_hash: string
          created_at?: string
          embedding: string
          embedding_dim?: number
          expires_at?: string | null
          id?: string
          model: string
          model_version: string
          owner_id: string
          owner_type: Database["public"]["Enums"]["embedding_owner_type"]
        }
        Update: {
          content_hash?: string
          created_at?: string
          embedding?: string
          embedding_dim?: number
          expires_at?: string | null
          id?: string
          model?: string
          model_version?: string
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["embedding_owner_type"]
        }
        Relationships: []
      }
      ai_link_suggestions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          intake_id: string
          reasoning: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggested_entity_id: string
          suggested_entity_type: string
          suggested_link_type: string
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          intake_id: string
          reasoning: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_entity_id: string
          suggested_entity_type: string
          suggested_link_type: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          intake_id?: string
          reasoning?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggested_entity_id?: string
          suggested_entity_type?: string
          suggested_link_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_link_suggestions_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_link_suggestions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_metadata: {
        Row: {
          analysis_id: string
          confidence_score: number | null
          created_at: string
          created_by: string
          embedding_dim: number | null
          embedding_id: string | null
          embedding_model: string | null
          heuristics: Json | null
          id: string
          input_tokens: number | null
          latency_ms: number
          model_name: string
          model_version: string
          output_tokens: number | null
          prompt_hash: string | null
          prompt_template_id: string | null
          seed: number | null
          source_refs: string[] | null
          temperature: number | null
          top_p: number | null
        }
        Insert: {
          analysis_id: string
          confidence_score?: number | null
          created_at?: string
          created_by: string
          embedding_dim?: number | null
          embedding_id?: string | null
          embedding_model?: string | null
          heuristics?: Json | null
          id?: string
          input_tokens?: number | null
          latency_ms: number
          model_name: string
          model_version: string
          output_tokens?: number | null
          prompt_hash?: string | null
          prompt_template_id?: string | null
          seed?: number | null
          source_refs?: string[] | null
          temperature?: number | null
          top_p?: number | null
        }
        Update: {
          analysis_id?: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          embedding_dim?: number | null
          embedding_id?: string | null
          embedding_model?: string | null
          heuristics?: Json | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number
          model_name?: string
          model_version?: string
          output_tokens?: number | null
          prompt_hash?: string | null
          prompt_template_id?: string | null
          seed?: number | null
          source_refs?: string[] | null
          temperature?: number | null
          top_p?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_metadata_embedding_id_fkey"
            columns: ["embedding_id"]
            isOneToOne: false
            referencedRelation: "ai_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          action: string
          approver_id: string
          comments: string | null
          created_at: string
          delegated_from: string | null
          delegated_until: string | null
          id: string
          original_approver_id: string | null
          position_id: string
          reassigned_by: string | null
          reassignment_reason: string | null
          stage: number
          step_up_challenge_id: string | null
          step_up_verified: boolean
        }
        Insert: {
          action: string
          approver_id: string
          comments?: string | null
          created_at?: string
          delegated_from?: string | null
          delegated_until?: string | null
          id?: string
          original_approver_id?: string | null
          position_id: string
          reassigned_by?: string | null
          reassignment_reason?: string | null
          stage: number
          step_up_challenge_id?: string | null
          step_up_verified?: boolean
        }
        Update: {
          action?: string
          approver_id?: string
          comments?: string | null
          created_at?: string
          delegated_from?: string | null
          delegated_until?: string | null
          id?: string
          original_approver_id?: string | null
          position_id?: string
          reassigned_by?: string | null
          reassignment_reason?: string | null
          stage?: number
          step_up_challenge_id?: string | null
          step_up_verified?: boolean
        }
        Relationships: []
      }
      assignment_checklist_items: {
        Row: {
          assignment_id: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          sequence: number
          text: string
        }
        Insert: {
          assignment_id: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          sequence: number
          text: string
        }
        Update: {
          assignment_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          sequence?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_checklist_items_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_checklist_templates: {
        Row: {
          applicable_work_types: string[]
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          items_json: Json
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          applicable_work_types: string[]
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          items_json: Json
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          applicable_work_types?: string[]
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          items_json?: Json
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_comments: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_comments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_events: {
        Row: {
          actor_user_id: string
          assignment_id: string
          created_at: string
          event_data: Json
          event_type: Database["public"]["Enums"]["assignment_event_type"]
          id: string
        }
        Insert: {
          actor_user_id: string
          assignment_id: string
          created_at?: string
          event_data?: Json
          event_type: Database["public"]["Enums"]["assignment_event_type"]
          id?: string
        }
        Update: {
          actor_user_id?: string
          assignment_id?: string
          created_at?: string
          event_data?: Json
          event_type?: Database["public"]["Enums"]["assignment_event_type"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_events_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_observers: {
        Row: {
          added_at: string
          assignment_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          assignment_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          added_at?: string
          assignment_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_observers_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_queue: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_attempt_at: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          required_skills: string[]
          target_unit_id: string | null
          work_item_id: string
          work_item_type: Database["public"]["Enums"]["work_item_type"]
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          notes?: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          required_skills: string[]
          target_unit_id?: string | null
          work_item_id: string
          work_item_type: Database["public"]["Enums"]["work_item_type"]
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_attempt_at?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          required_skills?: string[]
          target_unit_id?: string | null
          work_item_id?: string
          work_item_type?: Database["public"]["Enums"]["work_item_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assignment_queue_target_unit_id_fkey"
            columns: ["target_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_rules: {
        Row: {
          capacity_check_enabled: boolean
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          priority_weight: number
          required_skills: string[]
          unit_id: string
          updated_at: string
        }
        Insert: {
          capacity_check_enabled?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          priority_weight?: number
          required_skills: string[]
          unit_id: string
          updated_at?: string
        }
        Update: {
          capacity_check_enabled?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          priority_weight?: number
          required_skills?: string[]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_rules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_stage_history: {
        Row: {
          assignment_id: string
          from_stage: Database["public"]["Enums"]["engagement_workflow_stage"]
          id: string
          stage_duration_seconds: number | null
          stage_sla_met: boolean | null
          to_stage: Database["public"]["Enums"]["engagement_workflow_stage"]
          transitioned_at: string
          transitioned_by: string
        }
        Insert: {
          assignment_id: string
          from_stage: Database["public"]["Enums"]["engagement_workflow_stage"]
          id?: string
          stage_duration_seconds?: number | null
          stage_sla_met?: boolean | null
          to_stage: Database["public"]["Enums"]["engagement_workflow_stage"]
          transitioned_at?: string
          transitioned_by: string
        }
        Update: {
          assignment_id?: string
          from_stage?: Database["public"]["Enums"]["engagement_workflow_stage"]
          id?: string
          stage_duration_seconds?: number | null
          stage_sla_met?: boolean | null
          to_stage?: Database["public"]["Enums"]["engagement_workflow_stage"]
          transitioned_at?: string
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_stage_history_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_stage_history_transitioned_by_fkey"
            columns: ["transitioned_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          _version: number
          assigned_at: string
          assigned_by: string | null
          assignee_id: string
          completed_at: string | null
          created_at: string
          current_stage_sla_deadline: string | null
          engagement_id: string | null
          escalated_at: string | null
          escalation_recipient_id: string | null
          id: string
          last_reminder_sent_at: string | null
          overall_sla_deadline: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          sla_deadline: string
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
          warning_sent_at: string | null
          work_item_id: string
          work_item_type: Database["public"]["Enums"]["work_item_type"]
          workflow_stage: Database["public"]["Enums"]["engagement_workflow_stage"]
        }
        Insert: {
          _version?: number
          assigned_at?: string
          assigned_by?: string | null
          assignee_id: string
          completed_at?: string | null
          created_at?: string
          current_stage_sla_deadline?: string | null
          engagement_id?: string | null
          escalated_at?: string | null
          escalation_recipient_id?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          overall_sla_deadline?: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          sla_deadline: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          warning_sent_at?: string | null
          work_item_id: string
          work_item_type: Database["public"]["Enums"]["work_item_type"]
          workflow_stage?: Database["public"]["Enums"]["engagement_workflow_stage"]
        }
        Update: {
          _version?: number
          assigned_at?: string
          assigned_by?: string | null
          assignee_id?: string
          completed_at?: string | null
          created_at?: string
          current_stage_sla_deadline?: string | null
          engagement_id?: string | null
          escalated_at?: string | null
          escalation_recipient_id?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          overall_sla_deadline?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          sla_deadline?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          warning_sent_at?: string | null
          work_item_id?: string
          work_item_type?: Database["public"]["Enums"]["work_item_type"]
          workflow_stage?: Database["public"]["Enums"]["engagement_workflow_stage"]
        }
        Relationships: []
      }
      attachments: {
        Row: {
          after_action_id: string
          embedding: string | null
          file_key: string
          file_name: string
          file_size: number
          id: string
          mime_type: string
          scan_status: Database["public"]["Enums"]["scan_status"]
          search_vector: unknown
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          after_action_id: string
          embedding?: string | null
          file_key: string
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          scan_status?: Database["public"]["Enums"]["scan_status"]
          search_vector?: unknown
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          after_action_id?: string
          embedding?: string | null
          file_key?: string
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          scan_status?: Database["public"]["Enums"]["scan_status"]
          search_vector?: unknown
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      attendees: {
        Row: {
          confirmed: boolean
          created_at: string
          entity_id: string
          event_id: string
          id: string
          role: Database["public"]["Enums"]["attendee_role"]
          type: Database["public"]["Enums"]["attendee_type"]
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          entity_id: string
          event_id: string
          id?: string
          role?: Database["public"]["Enums"]["attendee_role"]
          type: Database["public"]["Enums"]["attendee_type"]
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          entity_id?: string
          event_id?: string
          id?: string
          role?: Database["public"]["Enums"]["attendee_role"]
          type?: Database["public"]["Enums"]["attendee_type"]
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          additional_context: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          session_id: string | null
          tenant_id: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          additional_context?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          tenant_id: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          additional_context?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          tenant_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          correlation_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          mfa_method: string | null
          mfa_verified: boolean
          new_values: Json | null
          old_values: Json | null
          required_mfa: boolean
          session_id: string | null
          user_agent: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          action: string
          correlation_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          mfa_method?: string | null
          mfa_verified?: boolean
          new_values?: Json | null
          old_values?: Json | null
          required_mfa?: boolean
          session_id?: string | null
          user_agent?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          action?: string
          correlation_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          mfa_method?: string | null
          mfa_verified?: boolean
          new_values?: Json | null
          old_values?: Json | null
          required_mfa?: boolean
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      briefing_packs: {
        Row: {
          engagement_id: string
          expires_at: string | null
          file_size_bytes: number
          file_url: string
          generated_at: string
          generated_by: string
          id: string
          language: string
          metadata: Json | null
          position_ids: string[]
        }
        Insert: {
          engagement_id: string
          expires_at?: string | null
          file_size_bytes: number
          file_url: string
          generated_at?: string
          generated_by: string
          id?: string
          language: string
          metadata?: Json | null
          position_ids: string[]
        }
        Update: {
          engagement_id?: string
          expires_at?: string | null
          file_size_bytes?: number
          file_url?: string
          generated_at?: string
          generated_by?: string
          id?: string
          language?: string
          metadata?: Json | null
          position_ids?: string[]
        }
        Relationships: []
      }
      briefs: {
        Row: {
          attachments: Json | null
          audience: Json
          content: Json
          country_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          embedding: string | null
          generation: Json
          id: string
          intelligence_report_id: string | null
          is_deleted: boolean
          last_modified_by: string
          organization_id: string | null
          parameters: Json
          purpose: string
          search_vector: unknown
          status: Database["public"]["Enums"]["brief_status"]
          summary: string | null
          target_entity: Json
          tenant_id: string
          title: string | null
          type: string
          updated_at: string
          usage: Json | null
          version: number
        }
        Insert: {
          attachments?: Json | null
          audience?: Json
          content?: Json
          country_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          embedding?: string | null
          generation?: Json
          id?: string
          intelligence_report_id?: string | null
          is_deleted?: boolean
          last_modified_by: string
          organization_id?: string | null
          parameters?: Json
          purpose: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["brief_status"]
          summary?: string | null
          target_entity?: Json
          tenant_id: string
          title?: string | null
          type: string
          updated_at?: string
          usage?: Json | null
          version?: number
        }
        Update: {
          attachments?: Json | null
          audience?: Json
          content?: Json
          country_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          embedding?: string | null
          generation?: Json
          id?: string
          intelligence_report_id?: string | null
          is_deleted?: boolean
          last_modified_by?: string
          organization_id?: string | null
          parameters?: Json
          purpose?: string
          search_vector?: unknown
          status?: Database["public"]["Enums"]["brief_status"]
          summary?: string | null
          target_entity?: Json
          tenant_id?: string
          title?: string | null
          type?: string
          updated_at?: string
          usage?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_briefs_intelligence_report"
            columns: ["intelligence_report_id"]
            isOneToOne: false
            referencedRelation: "intelligence_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_entries: {
        Row: {
          all_day: boolean | null
          attendee_ids: string[] | null
          created_at: string | null
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          dossier_id: string | null
          duration_minutes: number | null
          entry_type: string
          event_date: string
          event_time: string | null
          id: string
          is_recurring: boolean | null
          is_virtual: boolean | null
          linked_item_id: string | null
          linked_item_type: string | null
          location: string | null
          meeting_link: string | null
          organizer_id: string | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          status: string | null
          title_ar: string | null
          title_en: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendee_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          dossier_id?: string | null
          duration_minutes?: number | null
          entry_type: string
          event_date: string
          event_time?: string | null
          id?: string
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          linked_item_id?: string | null
          linked_item_type?: string | null
          location?: string | null
          meeting_link?: string | null
          organizer_id?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          title_ar?: string | null
          title_en: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendee_ids?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          dossier_id?: string | null
          duration_minutes?: number | null
          entry_type?: string
          event_date?: string
          event_time?: string | null
          id?: string
          is_recurring?: boolean | null
          is_virtual?: boolean | null
          linked_item_id?: string | null
          linked_item_type?: string | null
          location?: string | null
          meeting_link?: string | null
          organizer_id?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          status?: string | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          dossier_id: string
          end_datetime: string
          event_type: string
          id: string
          is_virtual: boolean
          location_ar: string | null
          location_en: string | null
          room_ar: string | null
          room_en: string | null
          start_datetime: string
          status: string
          timezone: string
          title_ar: string | null
          title_en: string | null
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dossier_id: string
          end_datetime: string
          event_type: string
          id?: string
          is_virtual?: boolean
          location_ar?: string | null
          location_en?: string | null
          room_ar?: string | null
          room_en?: string | null
          start_datetime: string
          status?: string
          timezone?: string
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          dossier_id?: string
          end_datetime?: string
          event_type?: string
          id?: string
          is_virtual?: boolean
          location_ar?: string | null
          location_en?: string | null
          room_ar?: string | null
          room_en?: string | null
          start_datetime?: string
          status?: string
          timezone?: string
          title_ar?: string | null
          title_en?: string | null
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_snapshots: {
        Row: {
          active_assignments: number
          created_at: string
          id: string
          snapshot_date: string
          total_capacity: number
          total_staff: number
          unit_id: string
          utilization_pct: number
        }
        Insert: {
          active_assignments: number
          created_at?: string
          id?: string
          snapshot_date: string
          total_capacity: number
          total_staff: number
          unit_id: string
          utilization_pct: number
        }
        Update: {
          active_assignments?: number
          created_at?: string
          id?: string
          snapshot_date?: string
          total_capacity?: number
          total_staff?: number
          unit_id?: string
          utilization_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "capacity_snapshots_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      cd_contact_relationships: {
        Row: {
          created_at: string | null
          end_date: string | null
          from_contact_id: string
          id: string
          notes: string | null
          relationship_type: string
          start_date: string | null
          to_contact_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          from_contact_id: string
          id?: string
          notes?: string | null
          relationship_type: string
          start_date?: string | null
          to_contact_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          from_contact_id?: string
          id?: string
          notes?: string | null
          relationship_type?: string
          start_date?: string | null
          to_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cd_contact_relationships_from_contact_id_fkey"
            columns: ["from_contact_id"]
            isOneToOne: false
            referencedRelation: "cd_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cd_contact_relationships_to_contact_id_fkey"
            columns: ["to_contact_id"]
            isOneToOne: false
            referencedRelation: "cd_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cd_contacts: {
        Row: {
          created_at: string | null
          created_by: string
          duplicate_of: string | null
          email_addresses: string[] | null
          full_name: string
          id: string
          is_archived: boolean | null
          notes: string | null
          ocr_confidence: number | null
          organization_id: string | null
          phone_numbers: string[] | null
          position: string | null
          source_document_id: string | null
          source_type: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          duplicate_of?: string | null
          email_addresses?: string[] | null
          full_name: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          ocr_confidence?: number | null
          organization_id?: string | null
          phone_numbers?: string[] | null
          position?: string | null
          source_document_id?: string | null
          source_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          duplicate_of?: string | null
          email_addresses?: string[] | null
          full_name?: string
          id?: string
          is_archived?: boolean | null
          notes?: string | null
          ocr_confidence?: number | null
          organization_id?: string | null
          phone_numbers?: string[] | null
          position?: string | null
          source_document_id?: string | null
          source_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cd_contacts_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "cd_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cd_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "cd_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cd_contacts_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "cd_document_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cd_document_sources: {
        Row: {
          created_at: string | null
          extracted_contacts_count: number | null
          file_format: string
          file_name: string
          file_size_bytes: number
          file_type: string
          id: string
          ocr_language: string | null
          processing_error: string | null
          processing_status: string | null
          storage_path: string
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          extracted_contacts_count?: number | null
          file_format: string
          file_name: string
          file_size_bytes: number
          file_type: string
          id?: string
          ocr_language?: string | null
          processing_error?: string | null
          processing_status?: string | null
          storage_path: string
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          extracted_contacts_count?: number | null
          file_format?: string
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          ocr_language?: string | null
          processing_error?: string | null
          processing_status?: string | null
          storage_path?: string
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      cd_interaction_notes: {
        Row: {
          attachments: string[] | null
          attendees: string[] | null
          contact_id: string
          created_at: string | null
          created_by: string
          date: string
          details: string
          id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          attendees?: string[] | null
          contact_id: string
          created_at?: string | null
          created_by: string
          date: string
          details: string
          id?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          attendees?: string[] | null
          contact_id?: string
          created_at?: string | null
          created_by?: string
          date?: string
          details?: string
          id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cd_interaction_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cd_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      cd_organizations: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          primary_address: Json | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          primary_address?: Json | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          primary_address?: Json | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      cd_tags: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          mentioned_user_id: string
          notified_at: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          mentioned_user_id: string
          notified_at?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          mentioned_user_id?: string
          notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "assignment_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "assignment_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          deliverable_details: Json | null
          dependencies: string[] | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          priority: Database["public"]["Enums"]["priority_level"]
          responsible: Json
          source: Json
          status: Database["public"]["Enums"]["commitment_status"]
          tenant_id: string
          timeline: Json
          title: string
          tracking: Json | null
          type: Database["public"]["Enums"]["commitment_type"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deliverable_details?: Json | null
          dependencies?: string[] | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          priority?: Database["public"]["Enums"]["priority_level"]
          responsible?: Json
          source?: Json
          status?: Database["public"]["Enums"]["commitment_status"]
          tenant_id: string
          timeline?: Json
          title: string
          tracking?: Json | null
          type: Database["public"]["Enums"]["commitment_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deliverable_details?: Json | null
          dependencies?: string[] | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          responsible?: Json
          source?: Json
          status?: Database["public"]["Enums"]["commitment_status"]
          tenant_id?: string
          timeline?: Json
          title?: string
          tracking?: Json | null
          type?: Database["public"]["Enums"]["commitment_type"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      consistency_checks: {
        Row: {
          ai_service_available: boolean
          check_trigger: string
          checked_at: string
          checked_by: string | null
          conflicts: Json
          consistency_score: number | null
          id: string
          position_id: string
          suggested_resolutions: Json | null
        }
        Insert: {
          ai_service_available?: boolean
          check_trigger: string
          checked_at?: string
          checked_by?: string | null
          conflicts?: Json
          consistency_score?: number | null
          id?: string
          position_id: string
          suggested_resolutions?: Json | null
        }
        Update: {
          ai_service_available?: boolean
          check_trigger?: string
          checked_at?: string
          checked_by?: string | null
          conflicts?: Json
          consistency_score?: number | null
          id?: string
          position_id?: string
          suggested_resolutions?: Json | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contact_info: Json
          country_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          expertise_areas: string[] | null
          first_name: string
          id: string
          influence_score: number | null
          interaction_history: Json | null
          is_deleted: boolean
          languages: Json | null
          last_modified_by: string
          last_name: string
          name_ar: string | null
          organization_id: string | null
          position: Json
          preferences: Json | null
          salutation: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          contact_info?: Json
          country_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          expertise_areas?: string[] | null
          first_name: string
          id?: string
          influence_score?: number | null
          interaction_history?: Json | null
          is_deleted?: boolean
          languages?: Json | null
          last_modified_by: string
          last_name: string
          name_ar?: string | null
          organization_id?: string | null
          position?: Json
          preferences?: Json | null
          salutation?: string | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          contact_info?: Json
          country_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          expertise_areas?: string[] | null
          first_name?: string
          id?: string
          influence_score?: number | null
          interaction_history?: Json | null
          is_deleted?: boolean
          languages?: Json | null
          last_modified_by?: string
          last_name?: string
          name_ar?: string | null
          organization_id?: string | null
          position?: Json
          preferences?: Json | null
          salutation?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      countries: {
        Row: {
          area_sq_km: number | null
          capital_ar: string | null
          capital_en: string | null
          flag_url: string | null
          id: string
          iso_code_2: string
          iso_code_3: string
          population: number | null
          region: string | null
          subregion: string | null
        }
        Insert: {
          area_sq_km?: number | null
          capital_ar?: string | null
          capital_en?: string | null
          flag_url?: string | null
          id: string
          iso_code_2: string
          iso_code_3: string
          population?: number | null
          region?: string | null
          subregion?: string | null
        }
        Update: {
          area_sq_km?: number | null
          capital_ar?: string | null
          capital_en?: string | null
          flag_url?: string | null
          id?: string
          iso_code_2?: string
          iso_code_3?: string
          population?: number | null
          region?: string | null
          subregion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countries_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      country_organization_relations: {
        Row: {
          country_id: string
          created_at: string
          end_date: string | null
          notes: string | null
          organization_id: string
          relationship_type: string
          start_date: string | null
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          end_date?: string | null
          notes?: string | null
          organization_id: string
          relationship_type: string
          start_date?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          end_date?: string | null
          notes?: string | null
          organization_id?: string
          relationship_type?: string
          start_date?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_library_items: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          country_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          file_url: string
          id: string
          name: string
          organization_id: string | null
          tags: string[] | null
          tenant_id: string
          type: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          country_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_url: string
          id?: string
          name: string
          organization_id?: string | null
          tags?: string[] | null
          tenant_id: string
          type: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          country_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_url?: string
          id?: string
          name?: string
          organization_id?: string | null
          tags?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
    }
  }
}