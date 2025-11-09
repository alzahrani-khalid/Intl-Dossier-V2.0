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
            referencedRelation: "intelligence_cache_status"
            referencedColumns: ["id"]
          },
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
          deleted_by: string | null
          description: string | null
          file_hash: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          name: string
          organization_id: string | null
          tags: Json | null
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"]
          country_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_hash: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          name: string
          organization_id?: string | null
          tags?: Json | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          country_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_hash?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string | null
          tags?: Json | null
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_library_items_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_library_items_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          after_action_id: string
          created_at: string | null
          decision_date: string
          decision_maker: string
          description: string
          id: string
          rationale: string | null
          updated_at: string | null
        }
        Insert: {
          after_action_id: string
          created_at?: string | null
          decision_date: string
          decision_maker: string
          description: string
          id?: string
          rationale?: string | null
          updated_at?: string | null
        }
        Update: {
          after_action_id?: string
          created_at?: string | null
          decision_date?: string
          decision_maker?: string
          description?: string
          id?: string
          rationale?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          content_chunk: string
          created_at: string | null
          embedding: string
          id: string
          metadata: Json | null
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
          updated_at: string | null
        }
        Insert: {
          chunk_index?: number
          content_chunk: string
          created_at?: string | null
          embedding: string
          id?: string
          metadata?: Json | null
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
          updated_at?: string | null
        }
        Update: {
          chunk_index?: number
          content_chunk?: string
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      document_relations: {
        Row: {
          created_at: string
          document_id: string
          entity_id: string
          entity_type: string
          relationship: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          entity_id: string
          entity_type: string
          relationship: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          entity_id?: string
          entity_type?: string
          relationship?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_control: Json
          classification: Database["public"]["Enums"]["classification_level"]
          created_at: string
          created_by: string
          deleted_at: string | null
          file_info: Json
          id: string
          is_deleted: boolean
          language: Database["public"]["Enums"]["document_language"]
          last_modified_by: string
          related_entities: Json | null
          retention: Json | null
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          version: Json
          version_number: number
        }
        Insert: {
          access_control?: Json
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by: string
          deleted_at?: string | null
          file_info?: Json
          id?: string
          is_deleted?: boolean
          language?: Database["public"]["Enums"]["document_language"]
          last_modified_by: string
          related_entities?: Json | null
          retention?: Json | null
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          version?: Json
          version_number?: number
        }
        Update: {
          access_control?: Json
          classification?: Database["public"]["Enums"]["classification_level"]
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          file_info?: Json
          id?: string
          is_deleted?: boolean
          language?: Database["public"]["Enums"]["document_language"]
          last_modified_by?: string
          related_entities?: Json | null
          retention?: Json | null
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          version?: Json
          version_number?: number
        }
        Relationships: []
      }
      dossier_interactions: {
        Row: {
          attachments: Json | null
          attendee_dossier_ids: string[] | null
          created_at: string
          created_by: string | null
          details: string | null
          dossier_id: string
          id: string
          interaction_date: string
          interaction_type: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          attendee_dossier_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          dossier_id: string
          id?: string
          interaction_date: string
          interaction_type: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          attendee_dossier_ids?: string[] | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          dossier_id?: string
          id?: string
          interaction_date?: string
          interaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_interactions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_owners: {
        Row: {
          assigned_at: string
          dossier_id: string
          role_type: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          dossier_id: string
          role_type?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          dossier_id?: string
          role_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dossier_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          notes_ar: string | null
          notes_en: string | null
          relationship_metadata: Json | null
          relationship_type: string
          source_dossier_id: string
          status: string
          target_dossier_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          relationship_metadata?: Json | null
          relationship_type: string
          source_dossier_id: string
          status?: string
          target_dossier_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          notes_ar?: string | null
          notes_en?: string | null
          relationship_metadata?: Json | null
          relationship_type?: string
          source_dossier_id?: string
          status?: string
          target_dossier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_relationships_source_dossier_id_fkey"
            columns: ["source_dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_relationships_target_dossier_id_fkey"
            columns: ["target_dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_tags: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          dossier_id: string
          id: string
          tag_name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          dossier_id: string
          id?: string
          tag_name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          dossier_id?: string
          id?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_tags_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name_ar: string
          name_en: string
          search_vector: unknown
          sensitivity_level: number
          status: string
          tags: string[] | null
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name_ar: string
          name_en: string
          search_vector?: unknown
          sensitivity_level?: number
          status?: string
          tags?: string[] | null
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          search_vector?: unknown
          sensitivity_level?: number
          status?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      duplicate_candidates: {
        Row: {
          content_similarity: number | null
          decision_reason: string | null
          detected_at: string
          detected_by: string
          id: string
          metadata_similarity: number | null
          overall_score: number
          resolved_at: string | null
          resolved_by: string | null
          source_ticket_id: string
          status: Database["public"]["Enums"]["duplicate_status"]
          target_ticket_id: string
          title_similarity: number | null
        }
        Insert: {
          content_similarity?: number | null
          decision_reason?: string | null
          detected_at?: string
          detected_by: string
          id?: string
          metadata_similarity?: number | null
          overall_score: number
          resolved_at?: string | null
          resolved_by?: string | null
          source_ticket_id: string
          status?: Database["public"]["Enums"]["duplicate_status"]
          target_ticket_id: string
          title_similarity?: number | null
        }
        Update: {
          content_similarity?: number | null
          decision_reason?: string | null
          detected_at?: string
          detected_by?: string
          id?: string
          metadata_similarity?: number | null
          overall_score?: number
          resolved_at?: string | null
          resolved_by?: string | null
          source_ticket_id?: string
          status?: Database["public"]["Enums"]["duplicate_status"]
          target_ticket_id?: string
          title_similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidates_source_ticket_id_fkey"
            columns: ["source_ticket_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_candidates_target_ticket_id_fkey"
            columns: ["target_ticket_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_update_queue: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          priority: number | null
          processed_at: string | null
          retry_count: number | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          retry_count?: number | null
        }
        Relationships: []
      }
      engagement_positions: {
        Row: {
          attached_at: string
          attached_by: string
          attachment_reason: string | null
          created_at: string
          display_order: number | null
          engagement_id: string
          id: string
          position_id: string
          relevance_score: number | null
          updated_at: string
        }
        Insert: {
          attached_at?: string
          attached_by: string
          attachment_reason?: string | null
          created_at?: string
          display_order?: number | null
          engagement_id: string
          id?: string
          position_id: string
          relevance_score?: number | null
          updated_at?: string
        }
        Update: {
          attached_at?: string
          attached_by?: string
          attachment_reason?: string | null
          created_at?: string
          display_order?: number | null
          engagement_id?: string
          id?: string
          position_id?: string
          relevance_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      engagements: {
        Row: {
          engagement_category: string
          engagement_type: string
          id: string
          location_ar: string | null
          location_en: string | null
        }
        Insert: {
          engagement_category: string
          engagement_type: string
          id: string
          location_ar?: string | null
          location_en?: string | null
        }
        Update: {
          engagement_category?: string
          engagement_type?: string
          id?: string
          location_ar?: string | null
          location_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagements_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_embeddings: {
        Row: {
          embedding: string | null
          entity_id: string
          entity_type: string
          metadata: Json
          model_version: string
          text_hash: string
          updated_at: string
        }
        Insert: {
          embedding?: string | null
          entity_id: string
          entity_type: string
          metadata: Json
          model_version?: string
          text_hash: string
          updated_at?: string
        }
        Update: {
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          metadata?: Json
          model_version?: string
          text_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      escalation_events: {
        Row: {
          acknowledged_at: string | null
          assignment_id: string
          created_at: string
          escalated_at: string
          escalated_from_id: string
          escalated_to_id: string
          id: string
          notes: string | null
          reason: Database["public"]["Enums"]["escalation_reason"]
          resolved_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          assignment_id: string
          created_at?: string
          escalated_at?: string
          escalated_from_id: string
          escalated_to_id: string
          id?: string
          notes?: string | null
          reason: Database["public"]["Enums"]["escalation_reason"]
          resolved_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          assignment_id?: string
          created_at?: string
          escalated_at?: string
          escalated_from_id?: string
          escalated_to_id?: string
          id?: string
          notes?: string | null
          reason?: Database["public"]["Enums"]["escalation_reason"]
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_events_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_records: {
        Row: {
          acknowledged_at: string | null
          assignment_id: string
          created_at: string | null
          escalated_at: string
          escalated_by: string
          escalated_to: string
          escalation_reason: string | null
          id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          acknowledged_at?: string | null
          assignment_id: string
          created_at?: string | null
          escalated_at?: string
          escalated_by: string
          escalated_to: string
          escalation_reason?: string | null
          id?: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          acknowledged_at?: string | null
          assignment_id?: string
          created_at?: string | null
          escalated_at?: string
          escalated_by?: string
          escalated_to?: string
          escalation_reason?: string | null
          id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_records_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          added_by: string | null
          confirmed: boolean
          created_at: string
          entity_id: string
          event_id: string
          id: string
          role: string
          type: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          confirmed?: boolean
          created_at?: string
          entity_id: string
          event_id: string
          id?: string
          role?: string
          type: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          confirmed?: boolean
          created_at?: string
          entity_id?: string
          event_id?: string
          id?: string
          role?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          attendance_status: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
          participant_id: string
          participant_type: string
          role: string
        }
        Insert: {
          attendance_status?: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          participant_id: string
          participant_type: string
          role: string
        }
        Update: {
          attendance_status?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          participant_id?: string
          participant_type?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendees: string[] | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          documents: string[] | null
          end_time: string
          id: string
          is_recurring: boolean | null
          location: string
          recurrence_pattern: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          virtual_link: string | null
          visibility: Database["public"]["Enums"]["visibility_level"]
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          documents?: string[] | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          location: string
          recurrence_pattern?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          documents?: string[] | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          location?: string
          recurrence_pattern?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      external_contacts: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          notification_preference: string
          organization: string | null
          search_vector: unknown
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          notification_preference?: string
          organization?: string | null
          search_vector?: unknown
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          notification_preference?: string
          organization?: string | null
          search_vector?: unknown
          updated_at?: string | null
        }
        Relationships: []
      }
      follow_up_actions: {
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
            foreignKeyName: "follow_up_actions_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_reminders: {
        Row: {
          assignment_id: string
          created_at: string | null
          delivery_status: string
          error_message: string | null
          id: string
          notification_type: string
          recipient_id: string
          sent_at: string
          sent_by: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          delivery_status?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_id: string
          sent_at?: string
          sent_by: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          delivery_status?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_id?: string
          sent_at?: string
          sent_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_reminders_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_participants: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          forum_id: string
          participation_type: string
          tenant_id: string
          years_participated: number[] | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          forum_id: string
          participation_type: string
          tenant_id: string
          years_participated?: number[] | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          forum_id?: string
          participation_type?: string
          tenant_id?: string
          years_participated?: number[] | null
        }
        Relationships: []
      }
      forums: {
        Row: {
          agenda_url: string | null
          currency: string | null
          id: string
          keynote_speakers: Json | null
          live_stream_url: string | null
          number_of_sessions: number | null
          registration_fee: number | null
          sponsors: Json | null
        }
        Insert: {
          agenda_url?: string | null
          currency?: string | null
          id: string
          keynote_speakers?: Json | null
          live_stream_url?: string | null
          number_of_sessions?: number | null
          registration_fee?: number | null
          sponsors?: Json | null
        }
        Update: {
          agenda_url?: string | null
          currency?: string | null
          id?: string
          keynote_speakers?: Json | null
          live_stream_url?: string | null
          number_of_sessions?: number | null
          registration_fee?: number | null
          sponsors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "forums_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_attachments: {
        Row: {
          deleted_at: string | null
          file_name: string
          file_size: number
          id: string
          mime_type: string
          scan_result: Json | null
          scan_status: Database["public"]["Enums"]["scan_status"]
          storage_path: string
          ticket_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          deleted_at?: string | null
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          scan_result?: Json | null
          scan_status?: Database["public"]["Enums"]["scan_status"]
          storage_path: string
          ticket_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          deleted_at?: string | null
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          scan_result?: Json | null
          scan_status?: Database["public"]["Enums"]["scan_status"]
          storage_path?: string
          ticket_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_embeddings: {
        Row: {
          embedding: string | null
          intake_id: string
          model_version: string
          text_hash: string
          updated_at: string
        }
        Insert: {
          embedding?: string | null
          intake_id: string
          model_version?: string
          text_hash: string
          updated_at?: string
        }
        Update: {
          embedding?: string | null
          intake_id?: string
          model_version?: string
          text_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_embeddings_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: true
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_entity_links: {
        Row: {
          _version: number
          confidence: number | null
          created_at: string
          deleted_at: string | null
          entity_id: string
          entity_type: string
          id: string
          intake_id: string
          link_order: number
          link_type: string
          linked_by: string
          notes: string | null
          source: string
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          _version?: number
          confidence?: number | null
          created_at?: string
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          intake_id: string
          link_order?: number
          link_type: string
          linked_by: string
          notes?: string | null
          source?: string
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          _version?: number
          confidence?: number | null
          created_at?: string
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          intake_id?: string
          link_order?: number
          link_type?: string
          linked_by?: string
          notes?: string | null
          source?: string
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_entity_links_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_entity_links_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "intake_entity_links_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      intake_tickets: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          assigned_unit: string | null
          client_metadata: Json | null
          closed_at: string | null
          converted_to_id: string | null
          converted_to_type: Database["public"]["Enums"]["request_type"] | null
          created_at: string
          created_by: string
          description: string
          description_ar: string
          dossier_id: string | null
          id: string
          parent_ticket_id: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          request_type: Database["public"]["Enums"]["request_type"]
          resolution: string | null
          resolution_ar: string | null
          resolved_at: string | null
          sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          source: Database["public"]["Enums"]["ticket_source"]
          status: Database["public"]["Enums"]["ticket_status"]
          submitted_at: string | null
          ticket_number: string
          title: string
          title_ar: string
          triaged_at: string | null
          type_specific_fields: Json | null
          updated_at: string
          updated_by: string
          urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          assigned_unit?: string | null
          client_metadata?: Json | null
          closed_at?: string | null
          converted_to_id?: string | null
          converted_to_type?: Database["public"]["Enums"]["request_type"] | null
          created_at?: string
          created_by: string
          description: string
          description_ar: string
          dossier_id?: string | null
          id?: string
          parent_ticket_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          request_type: Database["public"]["Enums"]["request_type"]
          resolution?: string | null
          resolution_ar?: string | null
          resolved_at?: string | null
          sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          source?: Database["public"]["Enums"]["ticket_source"]
          status?: Database["public"]["Enums"]["ticket_status"]
          submitted_at?: string | null
          ticket_number: string
          title: string
          title_ar: string
          triaged_at?: string | null
          type_specific_fields?: Json | null
          updated_at?: string
          updated_by: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          assigned_unit?: string | null
          client_metadata?: Json | null
          closed_at?: string | null
          converted_to_id?: string | null
          converted_to_type?: Database["public"]["Enums"]["request_type"] | null
          created_at?: string
          created_by?: string
          description?: string
          description_ar?: string
          dossier_id?: string | null
          id?: string
          parent_ticket_id?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          request_type?: Database["public"]["Enums"]["request_type"]
          resolution?: string | null
          resolution_ar?: string | null
          resolved_at?: string | null
          sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          source?: Database["public"]["Enums"]["ticket_source"]
          status?: Database["public"]["Enums"]["ticket_status"]
          submitted_at?: string | null
          ticket_number?: string
          title?: string
          title_ar?: string
          triaged_at?: string | null
          type_specific_fields?: Json | null
          updated_at?: string
          updated_by?: string
          urgency?: Database["public"]["Enums"]["urgency_level"]
        }
        Relationships: [
          {
            foreignKeyName: "intake_tickets_parent_ticket_id_fkey"
            columns: ["parent_ticket_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence: {
        Row: {
          action_required: boolean | null
          action_taken: Json | null
          category: Database["public"]["Enums"]["intelligence_category"]
          created_at: string
          created_by: string
          deleted_at: string | null
          details: string | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          recommendations: string[] | null
          relevance: Json | null
          source: Json
          summary: string
          tags: string[] | null
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["intelligence_type"]
          updated_at: string
          version: number
        }
        Insert: {
          action_required?: boolean | null
          action_taken?: Json | null
          category: Database["public"]["Enums"]["intelligence_category"]
          created_at?: string
          created_by: string
          deleted_at?: string | null
          details?: string | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          recommendations?: string[] | null
          relevance?: Json | null
          source?: Json
          summary: string
          tags?: string[] | null
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["intelligence_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          action_required?: boolean | null
          action_taken?: Json | null
          category?: Database["public"]["Enums"]["intelligence_category"]
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          details?: string | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          recommendations?: string[] | null
          relevance?: Json | null
          source?: Json
          summary?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["intelligence_type"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      intelligence_items: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          entities: Json | null
          id: string
          metadata: Json | null
          priority: string | null
          processed_at: string | null
          published_at: string | null
          relevance_score: number | null
          search_vector: unknown
          source_id: string
          summary: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          entities?: Json | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          processed_at?: string | null
          published_at?: string | null
          relevance_score?: number | null
          search_vector?: unknown
          source_id: string
          summary?: string | null
          title: string
          type: string
          url?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          entities?: Json | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          processed_at?: string | null
          published_at?: string | null
          relevance_score?: number | null
          search_vector?: unknown
          source_id?: string
          summary?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_refresh_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          items_failed: number | null
          items_processed: number | null
          job_name: string
          started_at: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          job_name: string
          started_at?: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_failed?: number | null
          items_processed?: number | null
          job_name?: string
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      intelligence_report_sources: {
        Row: {
          created_at: string | null
          data_library_item_id: string | null
          id: string
          intelligence_report_id: string | null
          relevance_score: number | null
        }
        Insert: {
          created_at?: string | null
          data_library_item_id?: string | null
          id?: string
          intelligence_report_id?: string | null
          relevance_score?: number | null
        }
        Update: {
          created_at?: string | null
          data_library_item_id?: string | null
          id?: string
          intelligence_report_id?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_report_sources_data_library_item_id_fkey"
            columns: ["data_library_item_id"]
            isOneToOne: false
            referencedRelation: "data_library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_report_sources_intelligence_report_id_fkey"
            columns: ["intelligence_report_id"]
            isOneToOne: false
            referencedRelation: "intelligence_cache_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_report_sources_intelligence_report_id_fkey"
            columns: ["intelligence_report_id"]
            isOneToOne: false
            referencedRelation: "intelligence_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_reports: {
        Row: {
          analysis_type: Database["public"]["Enums"]["analysis_type"] | null
          anythingllm_query: string | null
          anythingllm_response_metadata: Json | null
          anythingllm_workspace_id: string | null
          cache_created_at: string | null
          cache_expires_at: string | null
          classification: Database["public"]["Enums"]["classification_level"]
          confidence_level:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          confidence_score: number | null
          content: string
          content_ar: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          data_sources: Json
          data_sources_metadata: Json | null
          deleted_at: string | null
          deleted_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          intelligence_type: string
          last_refreshed_at: string | null
          metrics: Json | null
          organization_id: string | null
          parent_version_id: string | null
          refresh_duration_ms: number | null
          refresh_error_message: string | null
          refresh_status: string
          refresh_trigger_type: string | null
          refresh_triggered_by: string | null
          status: Database["public"]["Enums"]["intelligence_status"]
          title: string
          title_ar: string | null
          updated_at: string | null
          vector_embedding: string | null
          version: number
          version_notes: string | null
        }
        Insert: {
          analysis_type?: Database["public"]["Enums"]["analysis_type"] | null
          anythingllm_query?: string | null
          anythingllm_response_metadata?: Json | null
          anythingllm_workspace_id?: string | null
          cache_created_at?: string | null
          cache_expires_at?: string | null
          classification?: Database["public"]["Enums"]["classification_level"]
          confidence_level?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          confidence_score?: number | null
          content: string
          content_ar?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json
          data_sources_metadata?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          intelligence_type?: string
          last_refreshed_at?: string | null
          metrics?: Json | null
          organization_id?: string | null
          parent_version_id?: string | null
          refresh_duration_ms?: number | null
          refresh_error_message?: string | null
          refresh_status?: string
          refresh_trigger_type?: string | null
          refresh_triggered_by?: string | null
          status?: Database["public"]["Enums"]["intelligence_status"]
          title: string
          title_ar?: string | null
          updated_at?: string | null
          vector_embedding?: string | null
          version?: number
          version_notes?: string | null
        }
        Update: {
          analysis_type?: Database["public"]["Enums"]["analysis_type"] | null
          anythingllm_query?: string | null
          anythingllm_response_metadata?: Json | null
          anythingllm_workspace_id?: string | null
          cache_created_at?: string | null
          cache_expires_at?: string | null
          classification?: Database["public"]["Enums"]["classification_level"]
          confidence_level?:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          confidence_score?: number | null
          content?: string
          content_ar?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json
          data_sources_metadata?: Json | null
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          intelligence_type?: string
          last_refreshed_at?: string | null
          metrics?: Json | null
          organization_id?: string | null
          parent_version_id?: string | null
          refresh_duration_ms?: number | null
          refresh_error_message?: string | null
          refresh_status?: string
          refresh_trigger_type?: string | null
          refresh_triggered_by?: string | null
          status?: Database["public"]["Enums"]["intelligence_status"]
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          vector_embedding?: string | null
          version?: number
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_reports_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_reports_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "intelligence_cache_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_reports_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "intelligence_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_reports_refresh_triggered_by_fkey"
            columns: ["refresh_triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_signals: {
        Row: {
          confidence_level: string
          content_ar: string | null
          content_en: string
          dossier_id: string
          id: string
          impact_assessment: string | null
          logged_at: string | null
          logged_by: string
          search_vector: unknown
          signal_type: string
          source: string
          source_reliability: number | null
          source_url: string | null
          tags: string[] | null
          title_ar: string | null
          title_en: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          confidence_level?: string
          content_ar?: string | null
          content_en: string
          dossier_id: string
          id?: string
          impact_assessment?: string | null
          logged_at?: string | null
          logged_by: string
          search_vector?: unknown
          signal_type: string
          source: string
          source_reliability?: number | null
          source_url?: string | null
          tags?: string[] | null
          title_ar?: string | null
          title_en: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          confidence_level?: string
          content_ar?: string | null
          content_en?: string
          dossier_id?: string
          id?: string
          impact_assessment?: string | null
          logged_at?: string | null
          logged_by?: string
          search_vector?: unknown
          signal_type?: string
          source?: string
          source_reliability?: number | null
          source_url?: string | null
          tags?: string[] | null
          title_ar?: string | null
          title_en?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      intelligence_sources: {
        Row: {
          active: boolean | null
          api_config: Json | null
          categories: string[] | null
          created_at: string | null
          created_by: string
          error_count: number | null
          id: string
          keywords: string[] | null
          last_error_at: string | null
          last_error_message: string | null
          last_scanned_at: string | null
          name: string
          next_scan_at: string
          reliability_score: number | null
          scanning_frequency: string
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          active?: boolean | null
          api_config?: Json | null
          categories?: string[] | null
          created_at?: string | null
          created_by: string
          error_count?: number | null
          id?: string
          keywords?: string[] | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_scanned_at?: string | null
          name: string
          next_scan_at: string
          reliability_score?: number | null
          scanning_frequency: string
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          active?: boolean | null
          api_config?: Json | null
          categories?: string[] | null
          created_at?: string | null
          created_by?: string
          error_count?: number | null
          id?: string
          keywords?: string[] | null
          last_error_at?: string | null
          last_error_message?: string | null
          last_scanned_at?: string | null
          name?: string
          next_scan_at?: string
          reliability_score?: number | null
          scanning_frequency?: string
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      key_contacts: {
        Row: {
          created_at: string
          dossier_id: string
          email: string | null
          id: string
          last_interaction_date: string | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          email?: string | null
          id?: string
          last_interaction_date?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          email?: string | null
          id?: string
          last_interaction_date?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      link_audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          intake_id: string
          link_id: string
          performed_by: string
          timestamp: string
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          intake_id: string
          link_id: string
          performed_by: string
          timestamp?: string
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          intake_id?: string
          link_id?: string
          performed_by?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mou_parties: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          mou_id: string
          role: string
          signatory_name: string | null
          signatory_position: string | null
          signed_date: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          mou_id: string
          role: string
          signatory_name?: string | null
          signatory_position?: string | null
          signed_date?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          mou_id?: string
          role?: string
          signatory_name?: string | null
          signatory_position?: string | null
          signed_date?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mou_parties_mou_id_fkey"
            columns: ["mou_id"]
            isOneToOne: false
            referencedRelation: "mous"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mou_parties_mou_id_fkey"
            columns: ["mou_id"]
            isOneToOne: false
            referencedRelation: "mous_frontend"
            referencedColumns: ["id"]
          },
        ]
      }
      mous: {
        Row: {
          alert_config: Json | null
          country_id: string | null
          created_at: string
          created_by: string
          dates: Json
          deleted_at: string | null
          deliverables: Json | null
          description: string | null
          document_path: string | null
          documents: string[] | null
          effective_date: string | null
          expiry_date: string | null
          file_size: number | null
          financial: Json | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          lifecycle_state: Database["public"]["Enums"]["mou_state"]
          mime_type: string | null
          mou_category: Database["public"]["Enums"]["mou_category"]
          organization_id: string | null
          parties: Json | null
          performance_metrics: Json | null
          reference_number: string
          signatory_1_dossier_id: string | null
          signatory_2_dossier_id: string | null
          tenant_id: string
          title: string
          title_ar: string
          type: Database["public"]["Enums"]["mou_type"]
          updated_at: string
          version: number
        }
        Insert: {
          alert_config?: Json | null
          country_id?: string | null
          created_at?: string
          created_by: string
          dates?: Json
          deleted_at?: string | null
          deliverables?: Json | null
          description?: string | null
          document_path?: string | null
          documents?: string[] | null
          effective_date?: string | null
          expiry_date?: string | null
          file_size?: number | null
          financial?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          lifecycle_state?: Database["public"]["Enums"]["mou_state"]
          mime_type?: string | null
          mou_category: Database["public"]["Enums"]["mou_category"]
          organization_id?: string | null
          parties?: Json | null
          performance_metrics?: Json | null
          reference_number: string
          signatory_1_dossier_id?: string | null
          signatory_2_dossier_id?: string | null
          tenant_id: string
          title: string
          title_ar: string
          type: Database["public"]["Enums"]["mou_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          alert_config?: Json | null
          country_id?: string | null
          created_at?: string
          created_by?: string
          dates?: Json
          deleted_at?: string | null
          deliverables?: Json | null
          description?: string | null
          document_path?: string | null
          documents?: string[] | null
          effective_date?: string | null
          expiry_date?: string | null
          file_size?: number | null
          financial?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          lifecycle_state?: Database["public"]["Enums"]["mou_state"]
          mime_type?: string | null
          mou_category?: Database["public"]["Enums"]["mou_category"]
          organization_id?: string | null
          parties?: Json | null
          performance_metrics?: Json | null
          reference_number?: string
          signatory_1_dossier_id?: string | null
          signatory_2_dossier_id?: string | null
          tenant_id?: string
          title?: string
          title_ar?: string
          type?: Database["public"]["Enums"]["mou_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "mous_signatory_1_dossier_id_fkey"
            columns: ["signatory_1_dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_signatory_2_dossier_id_fkey"
            columns: ["signatory_2_dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      operation_progress: {
        Row: {
          completed_at: string | null
          error_message: string | null
          failed_items: number
          id: string
          operation_type: string
          processed_items: number
          started_at: string
          status: string
          successful_items: number
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          failed_items?: number
          id?: string
          operation_type: string
          processed_items?: number
          started_at?: string
          status?: string
          successful_items?: number
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          failed_items?: number
          id?: string
          operation_type?: string
          processed_items?: number
          started_at?: string
          status?: string
          successful_items?: number
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          organization_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizational_hierarchy: {
        Row: {
          created_at: string | null
          department: string | null
          escalation_level: number
          id: string
          reports_to_user_id: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          escalation_level?: number
          id?: string
          reports_to_user_id?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          escalation_level?: number
          id?: string
          reports_to_user_id?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizational_units: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          parent_unit_id: string | null
          unit_wip_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          parent_unit_id?: string | null
          unit_wip_limit: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          parent_unit_id?: string | null
          unit_wip_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_units_parent_unit_id_fkey"
            columns: ["parent_unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_ar: string | null
          address_en: string | null
          email: string | null
          established_date: string | null
          headquarters_country_id: string | null
          id: string
          logo_url: string | null
          org_code: string | null
          org_type: string
          parent_org_id: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          email?: string | null
          established_date?: string | null
          headquarters_country_id?: string | null
          id: string
          logo_url?: string | null
          org_code?: string | null
          org_type: string
          parent_org_id?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          email?: string | null
          established_date?: string | null
          headquarters_country_id?: string | null
          id?: string
          logo_url?: string | null
          org_code?: string | null
          org_type?: string
          parent_org_id?: string | null
          phone?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_headquarters_country_id_fkey"
            columns: ["headquarters_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_delegations: {
        Row: {
          created_at: string | null
          grantee_id: string
          grantor_id: string
          id: string
          permissions: string[]
          reason: string
          resource_id: string | null
          resource_type: string
          revoked: boolean | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          grantee_id: string
          grantor_id: string
          id?: string
          permissions: string[]
          reason: string
          resource_id?: string | null
          resource_type: string
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string | null
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string | null
          grantee_id?: string
          grantor_id?: string
          id?: string
          permissions?: string[]
          reason?: string
          resource_id?: string | null
          resource_type?: string
          revoked?: boolean | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      persons: {
        Row: {
          biography_ar: string | null
          biography_en: string | null
          email: string | null
          id: string
          nationality_country_id: string | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          title_ar: string | null
          title_en: string | null
        }
        Insert: {
          biography_ar?: string | null
          biography_en?: string | null
          email?: string | null
          id: string
          nationality_country_id?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          title_ar?: string | null
          title_en?: string | null
        }
        Update: {
          biography_ar?: string | null
          biography_en?: string | null
          email?: string | null
          id?: string
          nationality_country_id?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          title_ar?: string | null
          title_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persons_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_nationality_country_id_fkey"
            columns: ["nationality_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      position_audience_groups: {
        Row: {
          audience_group_id: string
          granted_at: string
          granted_by: string
          position_id: string
        }
        Insert: {
          audience_group_id: string
          granted_at?: string
          granted_by: string
          position_id: string
        }
        Update: {
          audience_group_id?: string
          granted_at?: string
          granted_by?: string
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_audience_groups_audience_group_id_fkey"
            columns: ["audience_group_id"]
            isOneToOne: false
            referencedRelation: "audience_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      position_conflicts: {
        Row: {
          conflict_type: string
          consistency_id: string
          description: string
          detected_at: string | null
          id: string
          position1_id: string
          position2_id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suggested_resolution: string | null
        }
        Insert: {
          conflict_type: string
          consistency_id: string
          description: string
          detected_at?: string | null
          id?: string
          position1_id: string
          position2_id: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          suggested_resolution?: string | null
        }
        Update: {
          conflict_type?: string
          consistency_id?: string
          description?: string
          detected_at?: string | null
          id?: string
          position1_id?: string
          position2_id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_resolution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_conflicts_consistency_id_fkey"
            columns: ["consistency_id"]
            isOneToOne: false
            referencedRelation: "position_consistency"
            referencedColumns: ["id"]
          },
        ]
      }
      position_consistency: {
        Row: {
          calculated_at: string | null
          consistency_score: number
          created_at: string | null
          id: string
          positions_analyzed: string[]
          reconciled_by: string | null
          reconciliation_notes: string | null
          reconciliation_status: string | null
          thematic_area_id: string
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string | null
          consistency_score: number
          created_at?: string | null
          id?: string
          positions_analyzed: string[]
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string | null
          thematic_area_id: string
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string | null
          consistency_score?: number
          created_at?: string | null
          id?: string
          positions_analyzed?: string[]
          reconciled_by?: string | null
          reconciliation_notes?: string | null
          reconciliation_status?: string | null
          thematic_area_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_consistency_thematic_area_id_fkey"
            columns: ["thematic_area_id"]
            isOneToOne: false
            referencedRelation: "thematic_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      position_dossier_links: {
        Row: {
          created_at: string
          created_by: string | null
          dossier_id: string
          id: string
          link_type: string
          notes: string | null
          position_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dossier_id: string
          id?: string
          link_type: string
          notes?: string | null
          position_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dossier_id?: string
          id?: string
          link_type?: string
          notes?: string | null
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_dossier_links_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_dossier_links_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      position_embeddings: {
        Row: {
          content_ar_embedding: string | null
          content_en_embedding: string | null
          id: string
          position_id: string
          updated_at: string
        }
        Insert: {
          content_ar_embedding?: string | null
          content_en_embedding?: string | null
          id?: string
          position_id: string
          updated_at?: string
        }
        Update: {
          content_ar_embedding?: string | null
          content_en_embedding?: string | null
          id?: string
          position_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      position_suggestions: {
        Row: {
          actioned_at: string | null
          created_at: string
          engagement_id: string
          id: string
          position_id: string
          relevance_score: number
          suggestion_reasoning: Json | null
          user_action: string | null
        }
        Insert: {
          actioned_at?: string | null
          created_at?: string
          engagement_id: string
          id?: string
          position_id: string
          relevance_score: number
          suggestion_reasoning?: Json | null
          user_action?: string | null
        }
        Update: {
          actioned_at?: string | null
          created_at?: string
          engagement_id?: string
          id?: string
          position_id?: string
          relevance_score?: number
          suggestion_reasoning?: Json | null
          user_action?: string | null
        }
        Relationships: []
      }
      position_types: {
        Row: {
          approval_stages: number
          created_at: string
          default_chain_config: Json
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          approval_stages: number
          created_at?: string
          default_chain_config?: Json
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          approval_stages?: number
          created_at?: string
          default_chain_config?: Json
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      position_usage_analytics: {
        Row: {
          attachment_count: number
          briefing_pack_count: number
          id: string
          last_attached_at: string | null
          last_viewed_at: string | null
          position_id: string
          trend_data: Json | null
          updated_at: string
          view_count: number
        }
        Insert: {
          attachment_count?: number
          briefing_pack_count?: number
          id?: string
          last_attached_at?: string | null
          last_viewed_at?: string | null
          position_id: string
          trend_data?: Json | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          attachment_count?: number
          briefing_pack_count?: number
          id?: string
          last_attached_at?: string | null
          last_viewed_at?: string | null
          position_id?: string
          trend_data?: Json | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      position_versions: {
        Row: {
          author_id: string
          content_ar: string | null
          content_en: string | null
          created_at: string
          full_snapshot: Json
          id: string
          position_id: string
          rationale_ar: string | null
          rationale_en: string | null
          retention_until: string
          superseded: boolean
          version_number: number
        }
        Insert: {
          author_id: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot: Json
          id?: string
          position_id: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until: string
          superseded?: boolean
          version_number: number
        }
        Update: {
          author_id?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot?: Json
          id?: string
          position_id?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until?: string
          superseded?: boolean
          version_number?: number
        }
        Relationships: []
      }
      position_versions_2025: {
        Row: {
          author_id: string
          content_ar: string | null
          content_en: string | null
          created_at: string
          full_snapshot: Json
          id: string
          position_id: string
          rationale_ar: string | null
          rationale_en: string | null
          retention_until: string
          superseded: boolean
          version_number: number
        }
        Insert: {
          author_id: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot: Json
          id?: string
          position_id: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until: string
          superseded?: boolean
          version_number: number
        }
        Update: {
          author_id?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot?: Json
          id?: string
          position_id?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until?: string
          superseded?: boolean
          version_number?: number
        }
        Relationships: []
      }
      position_versions_2026: {
        Row: {
          author_id: string
          content_ar: string | null
          content_en: string | null
          created_at: string
          full_snapshot: Json
          id: string
          position_id: string
          rationale_ar: string | null
          rationale_en: string | null
          retention_until: string
          superseded: boolean
          version_number: number
        }
        Insert: {
          author_id: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot: Json
          id?: string
          position_id: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until: string
          superseded?: boolean
          version_number: number
        }
        Update: {
          author_id?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot?: Json
          id?: string
          position_id?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until?: string
          superseded?: boolean
          version_number?: number
        }
        Relationships: []
      }
      position_versions_2027: {
        Row: {
          author_id: string
          content_ar: string | null
          content_en: string | null
          created_at: string
          full_snapshot: Json
          id: string
          position_id: string
          rationale_ar: string | null
          rationale_en: string | null
          retention_until: string
          superseded: boolean
          version_number: number
        }
        Insert: {
          author_id: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot: Json
          id?: string
          position_id: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until: string
          superseded?: boolean
          version_number: number
        }
        Update: {
          author_id?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot?: Json
          id?: string
          position_id?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until?: string
          superseded?: boolean
          version_number?: number
        }
        Relationships: []
      }
      position_versions_2028: {
        Row: {
          author_id: string
          content_ar: string | null
          content_en: string | null
          created_at: string
          full_snapshot: Json
          id: string
          position_id: string
          rationale_ar: string | null
          rationale_en: string | null
          retention_until: string
          superseded: boolean
          version_number: number
        }
        Insert: {
          author_id: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot: Json
          id?: string
          position_id: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until: string
          superseded?: boolean
          version_number: number
        }
        Update: {
          author_id?: string
          content_ar?: string | null
          content_en?: string | null
          created_at?: string
          full_snapshot?: Json
          id?: string
          position_id?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          retention_until?: string
          superseded?: boolean
          version_number?: number
        }
        Relationships: []
      }
      positions: {
        Row: {
          alignment_notes_ar: string | null
          alignment_notes_en: string | null
          approval_chain_config: Json
          author_id: string
          consistency_score: number | null
          content_ar: string | null
          content_en: string | null
          corrected_at: string | null
          corrected_by: string | null
          corrected_version_id: string | null
          correction_reason: string | null
          created_at: string
          current_stage: number
          emergency_correction: boolean | null
          id: string
          position_type_id: string
          rationale_ar: string | null
          rationale_en: string | null
          status: string
          thematic_category: string | null
          title_ar: string
          title_en: string
          updated_at: string
          version: number
        }
        Insert: {
          alignment_notes_ar?: string | null
          alignment_notes_en?: string | null
          approval_chain_config?: Json
          author_id: string
          consistency_score?: number | null
          content_ar?: string | null
          content_en?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          corrected_version_id?: string | null
          correction_reason?: string | null
          created_at?: string
          current_stage?: number
          emergency_correction?: boolean | null
          id?: string
          position_type_id: string
          rationale_ar?: string | null
          rationale_en?: string | null
          status?: string
          thematic_category?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
          version?: number
        }
        Update: {
          alignment_notes_ar?: string | null
          alignment_notes_en?: string | null
          approval_chain_config?: Json
          author_id?: string
          consistency_score?: number | null
          content_ar?: string | null
          content_en?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          corrected_version_id?: string | null
          correction_reason?: string | null
          created_at?: string
          current_stage?: number
          emergency_correction?: boolean | null
          id?: string
          position_type_id?: string
          rationale_ar?: string | null
          rationale_en?: string | null
          status?: string
          thematic_category?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_position_type_id_fkey"
            columns: ["position_type_id"]
            isOneToOne: false
            referencedRelation: "position_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clearance_level: number
          created_at: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clearance_level?: number
          created_at?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clearance_level?: number
          created_at?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      query_embeddings: {
        Row: {
          created_at: string | null
          execution_time_ms: number | null
          id: string
          query_embedding: string
          query_text: string
          query_type: string | null
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          query_embedding: string
          query_text: string
          query_type?: string | null
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          query_embedding?: string
          query_text?: string
          query_type?: string | null
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "query_embeddings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          expires_at: string
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string
          expires_at: string
          key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          created_at?: string
          expires_at?: string
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          engagement_history: Json | null
          focal_points: Json | null
          health_metrics: Json | null
          health_status: Database["public"]["Enums"]["health_status"] | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          notes: string | null
          parties: Json
          status: string
          strategic_importance:
            | Database["public"]["Enums"]["priority_level"]
            | null
          tenant_id: string
          type: Database["public"]["Enums"]["relationship_type"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          engagement_history?: Json | null
          focal_points?: Json | null
          health_metrics?: Json | null
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          notes?: string | null
          parties?: Json
          status?: string
          strategic_importance?:
            | Database["public"]["Enums"]["priority_level"]
            | null
          tenant_id: string
          type: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          engagement_history?: Json | null
          focal_points?: Json | null
          health_metrics?: Json | null
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          notes?: string | null
          parties?: Json
          status?: string
          strategic_importance?:
            | Database["public"]["Enums"]["priority_level"]
            | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      risks: {
        Row: {
          after_action_id: string
          ai_confidence: number | null
          created_at: string | null
          description: string
          id: string
          likelihood: Database["public"]["Enums"]["likelihood"]
          mitigation_strategy: string | null
          owner: string | null
          severity: Database["public"]["Enums"]["severity"]
          updated_at: string | null
        }
        Insert: {
          after_action_id: string
          ai_confidence?: number | null
          created_at?: string | null
          description: string
          id?: string
          likelihood: Database["public"]["Enums"]["likelihood"]
          mitigation_strategy?: string | null
          owner?: string | null
          severity: Database["public"]["Enums"]["severity"]
          updated_at?: string | null
        }
        Update: {
          after_action_id?: string
          ai_confidence?: number | null
          created_at?: string | null
          description?: string
          id?: string
          likelihood?: Database["public"]["Enums"]["likelihood"]
          mitigation_strategy?: string | null
          owner?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      search_click_aggregates: {
        Row: {
          co_occurrence_count: number | null
          followed_by_query_normalized: string
          id: string
          last_updated: string | null
          query_text_normalized: string
        }
        Insert: {
          co_occurrence_count?: number | null
          followed_by_query_normalized: string
          id?: string
          last_updated?: string | null
          query_text_normalized: string
        }
        Update: {
          co_occurrence_count?: number | null
          followed_by_query_normalized?: string
          id?: string
          last_updated?: string | null
          query_text_normalized?: string
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          clicked_rank: number | null
          clicked_result_id: string | null
          clicked_result_type: string | null
          created_at: string | null
          filters: Json | null
          id: string
          language_detected: string | null
          query_text: string
          query_text_normalized: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          clicked_rank?: number | null
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          language_detected?: string | null
          query_text: string
          query_text_normalized: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          clicked_rank?: number | null
          clicked_result_id?: string | null
          clicked_result_type?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          language_detected?: string | null
          query_text?: string
          query_text_normalized?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      signature_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string
          document_id: string
          envelope_id: string | null
          expires_at: string
          id: string
          mou_id: string
          provider: string
          status: string
          updated_at: string | null
          workflow: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          document_id: string
          envelope_id?: string | null
          expires_at: string
          id?: string
          mou_id: string
          provider: string
          status: string
          updated_at?: string | null
          workflow?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          document_id?: string
          envelope_id?: string | null
          expires_at?: string
          id?: string
          mou_id?: string
          provider?: string
          status?: string
          updated_at?: string | null
          workflow?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_mou_id_fkey"
            columns: ["mou_id"]
            isOneToOne: false
            referencedRelation: "mous"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_requests_mou_id_fkey"
            columns: ["mou_id"]
            isOneToOne: false
            referencedRelation: "mous_frontend"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_signatories: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          order_index: number
          request_id: string
          signature_data: string | null
          signed_at: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          order_index: number
          request_id: string
          signature_data?: string | null
          signed_at?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          order_index?: number
          request_id?: string
          signature_data?: string | null
          signed_at?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_signatories_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_signatories_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "signature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name_ar: string
          name_en: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
        }
        Relationships: []
      }
      sla_configs: {
        Row: {
          created_at: string
          deadline_hours: number
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          warning_threshold_pct: number
          work_item_type: Database["public"]["Enums"]["work_item_type"]
        }
        Insert: {
          created_at?: string
          deadline_hours: number
          id?: string
          priority: Database["public"]["Enums"]["priority_level"]
          warning_threshold_pct?: number
          work_item_type: Database["public"]["Enums"]["work_item_type"]
        }
        Update: {
          created_at?: string
          deadline_hours?: number
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          warning_threshold_pct?: number
          work_item_type?: Database["public"]["Enums"]["work_item_type"]
        }
        Relationships: []
      }
      sla_events: {
        Row: {
          created_by: string
          elapsed_minutes: number
          event_timestamp: string
          event_type: Database["public"]["Enums"]["sla_event_type"]
          id: string
          is_breached: boolean
          policy_id: string
          reason: string | null
          remaining_minutes: number
          ticket_id: string
        }
        Insert: {
          created_by: string
          elapsed_minutes?: number
          event_timestamp?: string
          event_type: Database["public"]["Enums"]["sla_event_type"]
          id?: string
          is_breached?: boolean
          policy_id: string
          reason?: string | null
          remaining_minutes: number
          ticket_id: string
        }
        Update: {
          created_by?: string
          elapsed_minutes?: number
          event_timestamp?: string
          event_type?: Database["public"]["Enums"]["sla_event_type"]
          id?: string
          is_breached?: boolean
          policy_id?: string
          reason?: string | null
          remaining_minutes?: number
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "sla_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          acknowledgment_target: number
          business_hours_only: boolean
          created_at: string
          id: string
          is_active: boolean
          priority: Database["public"]["Enums"]["priority_level"] | null
          request_type: Database["public"]["Enums"]["request_type"] | null
          resolution_target: number
          sensitivity: Database["public"]["Enums"]["sensitivity_level"] | null
          timezone: string
          updated_at: string
          urgency: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          acknowledgment_target: number
          business_hours_only?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: Database["public"]["Enums"]["priority_level"] | null
          request_type?: Database["public"]["Enums"]["request_type"] | null
          resolution_target: number
          sensitivity?: Database["public"]["Enums"]["sensitivity_level"] | null
          timezone?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          acknowledgment_target?: number
          business_hours_only?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: Database["public"]["Enums"]["priority_level"] | null
          request_type?: Database["public"]["Enums"]["request_type"] | null
          resolution_target?: number
          sensitivity?: Database["public"]["Enums"]["sensitivity_level"] | null
          timezone?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          availability_source: string
          availability_status: Database["public"]["Enums"]["availability_status"]
          created_at: string
          current_assignment_count: number
          escalation_chain_id: string | null
          hr_employee_id: string | null
          id: string
          individual_wip_limit: number
          notification_preferences: Json | null
          role: string
          skills: string[]
          unavailable_reason: string | null
          unavailable_until: string | null
          unit_id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          availability_source?: string
          availability_status?: Database["public"]["Enums"]["availability_status"]
          created_at?: string
          current_assignment_count?: number
          escalation_chain_id?: string | null
          hr_employee_id?: string | null
          id?: string
          individual_wip_limit: number
          notification_preferences?: Json | null
          role?: string
          skills?: string[]
          unavailable_reason?: string | null
          unavailable_until?: string | null
          unit_id: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          availability_source?: string
          availability_status?: Database["public"]["Enums"]["availability_status"]
          created_at?: string
          current_assignment_count?: number
          escalation_chain_id?: string | null
          hr_employee_id?: string | null
          id?: string
          individual_wip_limit?: number
          notification_preferences?: Json | null
          role?: string
          skills?: string[]
          unavailable_reason?: string | null
          unavailable_until?: string | null
          unit_id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_escalation_chain_id_fkey"
            columns: ["escalation_chain_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profiles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "organizational_units"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_at: string
          role: string
          task_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          role: string
          task_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          role?: string
          task_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_contributors: {
        Row: {
          added_at: string
          id: string
          notes: string | null
          removed_at: string | null
          role: string
          task_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          notes?: string | null
          removed_at?: string | null
          role: string
          task_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          notes?: string | null
          removed_at?: string | null
          role?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_contributors_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string
          assignment: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          dependencies: Json | null
          description: string | null
          engagement_id: string | null
          escalation: Json | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          priority: Database["public"]["Enums"]["urgent_priority"]
          progress: Json | null
          sla_deadline: string | null
          source: Json
          status: Database["public"]["Enums"]["task_status"]
          tenant_id: string
          timeline: Json
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          updated_by: string | null
          version: number
          work_item_id: string | null
          work_item_type: string | null
          workflow_stage: string
        }
        Insert: {
          assignee_id: string
          assignment?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          dependencies?: Json | null
          description?: string | null
          engagement_id?: string | null
          escalation?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          priority?: Database["public"]["Enums"]["urgent_priority"]
          progress?: Json | null
          sla_deadline?: string | null
          source?: Json
          status?: Database["public"]["Enums"]["task_status"]
          tenant_id: string
          timeline?: Json
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          work_item_id?: string | null
          work_item_type?: string | null
          workflow_stage: string
        }
        Update: {
          assignee_id?: string
          assignment?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          dependencies?: Json | null
          description?: string | null
          engagement_id?: string | null
          escalation?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          priority?: Database["public"]["Enums"]["urgent_priority"]
          progress?: Json | null
          sla_deadline?: string | null
          source?: Json
          status?: Database["public"]["Enums"]["task_status"]
          tenant_id?: string
          timeline?: Json
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          updated_by?: string | null
          version?: number
          work_item_id?: string | null
          work_item_type?: string | null
          workflow_stage?: string
        }
        Relationships: []
      }
      thematic_area_experts: {
        Row: {
          contact_id: string
          created_at: string
          expertise_level: string | null
          tenant_id: string
          thematic_area_id: string
          years_experience: number | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          expertise_level?: string | null
          tenant_id: string
          thematic_area_id: string
          years_experience?: number | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          expertise_level?: string | null
          tenant_id?: string
          thematic_area_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "thematic_area_experts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thematic_area_experts_thematic_area_id_fkey"
            columns: ["thematic_area_id"]
            isOneToOne: false
            referencedRelation: "thematic_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      thematic_areas: {
        Row: {
          best_practices: Json | null
          category: Database["public"]["Enums"]["thematic_category"]
          code: string
          created_at: string
          created_by: string
          deleted_at: string | null
          description: Json
          experts: string[] | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          name_ar: string
          name_en: string
          parent_area_id: string | null
          related_sdg_indicators: string[] | null
          resources: Json | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          best_practices?: Json | null
          category: Database["public"]["Enums"]["thematic_category"]
          code: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: Json
          experts?: string[] | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          name_ar: string
          name_en: string
          parent_area_id?: string | null
          related_sdg_indicators?: string[] | null
          resources?: Json | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          best_practices?: Json | null
          category?: Database["public"]["Enums"]["thematic_category"]
          code?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: Json
          experts?: string[] | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          name_ar?: string
          name_en?: string
          parent_area_id?: string | null
          related_sdg_indicators?: string[] | null
          resources?: Json | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "thematic_areas_parent_area_id_fkey"
            columns: ["parent_area_id"]
            isOneToOne: false
            referencedRelation: "thematic_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: string
          parent_theme_id: string | null
          theme_category: string
        }
        Insert: {
          id: string
          parent_theme_id?: string | null
          theme_category: string
        }
        Update: {
          id?: string
          parent_theme_id?: string | null
          theme_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_parent_topic_id_fkey"
            columns: ["parent_theme_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_decisions: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          confidence_score: number | null
          created_at: string
          created_by: string
          decision_type: Database["public"]["Enums"]["decision_type"]
          final_assignee: string | null
          final_sensitivity:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          final_type: Database["public"]["Enums"]["request_type"] | null
          final_unit: string | null
          final_urgency: Database["public"]["Enums"]["urgency_level"] | null
          id: string
          model_name: string | null
          model_version: string | null
          override_reason: string | null
          override_reason_ar: string | null
          suggested_assignee: string | null
          suggested_sensitivity:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          suggested_type: Database["public"]["Enums"]["request_type"] | null
          suggested_unit: string | null
          suggested_urgency: Database["public"]["Enums"]["urgency_level"] | null
          ticket_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by: string
          decision_type: Database["public"]["Enums"]["decision_type"]
          final_assignee?: string | null
          final_sensitivity?:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          final_type?: Database["public"]["Enums"]["request_type"] | null
          final_unit?: string | null
          final_urgency?: Database["public"]["Enums"]["urgency_level"] | null
          id?: string
          model_name?: string | null
          model_version?: string | null
          override_reason?: string | null
          override_reason_ar?: string | null
          suggested_assignee?: string | null
          suggested_sensitivity?:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          suggested_type?: Database["public"]["Enums"]["request_type"] | null
          suggested_unit?: string | null
          suggested_urgency?:
            | Database["public"]["Enums"]["urgency_level"]
            | null
          ticket_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string
          decision_type?: Database["public"]["Enums"]["decision_type"]
          final_assignee?: string | null
          final_sensitivity?:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          final_type?: Database["public"]["Enums"]["request_type"] | null
          final_unit?: string | null
          final_urgency?: Database["public"]["Enums"]["urgency_level"] | null
          id?: string
          model_name?: string | null
          model_version?: string | null
          override_reason?: string | null
          override_reason_ar?: string | null
          suggested_assignee?: string | null
          suggested_sensitivity?:
            | Database["public"]["Enums"]["sensitivity_level"]
            | null
          suggested_type?: Database["public"]["Enums"]["request_type"] | null
          suggested_unit?: string | null
          suggested_urgency?:
            | Database["public"]["Enums"]["urgency_level"]
            | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triage_decisions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "intake_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audience_memberships: {
        Row: {
          added_at: string
          audience_group_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          audience_group_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          audience_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_audience_memberships_audience_group_id_fkey"
            columns: ["audience_group_id"]
            isOneToOne: false
            referencedRelation: "audience_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          commitment_assigned_email: boolean | null
          commitment_assigned_in_app: boolean | null
          commitment_due_soon_email: boolean | null
          commitment_due_soon_in_app: boolean | null
          language_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          commitment_assigned_email?: boolean | null
          commitment_assigned_in_app?: boolean | null
          commitment_due_soon_email?: boolean | null
          commitment_due_soon_in_app?: boolean | null
          language_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          commitment_assigned_email?: boolean | null
          commitment_assigned_in_app?: boolean | null
          commitment_due_soon_email?: boolean | null
          commitment_due_soon_in_app?: boolean | null
          language_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          color_mode: string
          created_at: string | null
          id: string
          language: string
          theme: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color_mode: string
          created_at?: string | null
          id?: string
          language: string
          theme: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color_mode?: string
          created_at?: string | null
          id?: string
          language?: string
          theme?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          deleted_by: string | null
          department: string | null
          email: string
          first_name: string | null
          full_name: string
          id: string
          is_active: boolean | null
          language_preference: string | null
          last_login: string | null
          last_login_at: string | null
          last_name: string | null
          login_count: number | null
          metadata: Json | null
          mfa_backup_codes: string[] | null
          mfa_enabled: boolean | null
          mfa_secret: string | null
          name_ar: string | null
          name_en: string | null
          password_changed_at: string | null
          password_hash: string | null
          phone: string | null
          role: string
          search_vector: unknown
          timezone: string | null
          updated_at: string
          updated_by: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_by?: string | null
          department?: string | null
          email: string
          first_name?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_login?: string | null
          last_login_at?: string | null
          last_name?: string | null
          login_count?: number | null
          metadata?: Json | null
          mfa_backup_codes?: string[] | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          name_ar?: string | null
          name_en?: string | null
          password_changed_at?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: string
          search_vector?: unknown
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_by?: string | null
          department?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_login?: string | null
          last_login_at?: string | null
          last_name?: string | null
          login_count?: number | null
          metadata?: Json | null
          mfa_backup_codes?: string[] | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          name_ar?: string | null
          name_en?: string | null
          password_changed_at?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: string
          search_vector?: unknown
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_search_config: {
        Row: {
          config_name: string
          created_at: string
          embedding_dim: number
          embedding_model: string
          id: string
          is_active: boolean
          max_results: number
          similarity_metric: string
          similarity_threshold: number
          updated_at: string
          use_reranking: boolean
        }
        Insert: {
          config_name: string
          created_at?: string
          embedding_dim: number
          embedding_model: string
          id?: string
          is_active?: boolean
          max_results?: number
          similarity_metric: string
          similarity_threshold: number
          updated_at?: string
          use_reranking?: boolean
        }
        Update: {
          config_name?: string
          created_at?: string
          embedding_dim?: number
          embedding_model?: string
          id?: string
          is_active?: boolean
          max_results?: number
          similarity_metric?: string
          similarity_threshold?: number
          updated_at?: string
          use_reranking?: boolean
        }
        Relationships: []
      }
      vector_search_stats: {
        Row: {
          avg_similarity_score: number | null
          config_id: string | null
          created_at: string
          execution_time_ms: number
          id: string
          max_similarity_score: number | null
          min_similarity_score: number | null
          query_vector_id: string | null
          results_count: number
          search_id: string
          search_type: string
        }
        Insert: {
          avg_similarity_score?: number | null
          config_id?: string | null
          created_at?: string
          execution_time_ms: number
          id?: string
          max_similarity_score?: number | null
          min_similarity_score?: number | null
          query_vector_id?: string | null
          results_count: number
          search_id: string
          search_type: string
        }
        Update: {
          avg_similarity_score?: number | null
          config_id?: string | null
          created_at?: string
          execution_time_ms?: number
          id?: string
          max_similarity_score?: number | null
          min_similarity_score?: number | null
          query_vector_id?: string | null
          results_count?: number
          search_id?: string
          search_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_search_stats_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "vector_search_config"
            referencedColumns: ["id"]
          },
        ]
      }
      version_snapshots: {
        Row: {
          after_action_id: string
          approved_at: string | null
          approved_by: string | null
          change_diff: Json | null
          created_at: string
          created_by: string | null
          id: string
          snapshot_data: Json
          version_number: number
          version_reason: string | null
        }
        Insert: {
          after_action_id: string
          approved_at?: string | null
          approved_by?: string | null
          change_diff?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot_data: Json
          version_number: number
          version_reason?: string | null
        }
        Update: {
          after_action_id?: string
          approved_at?: string | null
          approved_by?: string | null
          change_diff?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          snapshot_data?: Json
          version_number?: number
          version_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "version_snapshots_after_action_id_fkey"
            columns: ["after_action_id"]
            isOneToOne: false
            referencedRelation: "after_action_records"
            referencedColumns: ["id"]
          },
        ]
      }
      working_groups: {
        Row: {
          disbandment_date: string | null
          established_date: string | null
          id: string
          lead_org_id: string | null
          mandate_ar: string | null
          mandate_en: string | null
          wg_status: string
        }
        Insert: {
          disbandment_date?: string | null
          established_date?: string | null
          id: string
          lead_org_id?: string | null
          mandate_ar?: string | null
          mandate_en?: string | null
          wg_status?: string
        }
        Update: {
          disbandment_date?: string | null
          established_date?: string | null
          id?: string
          lead_org_id?: string | null
          mandate_ar?: string | null
          mandate_en?: string | null
          wg_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_groups_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_groups_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          active: boolean | null
          joined_at: string
          role: string
          tenant_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          active?: boolean | null
          joined_at?: string
          role: string
          tenant_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          active?: boolean | null
          joined_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          activity_stream: Json | null
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          members: Json | null
          name: string
          owner_department: string
          purpose: string
          related_entities: Json | null
          resources: Json | null
          settings: Json | null
          status: string
          tenant_id: string
          type: Database["public"]["Enums"]["workspace_type"]
          updated_at: string
          version: number
        }
        Insert: {
          activity_stream?: Json | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          members?: Json | null
          name: string
          owner_department: string
          purpose: string
          related_entities?: Json | null
          resources?: Json | null
          settings?: Json | null
          status?: string
          tenant_id: string
          type: Database["public"]["Enums"]["workspace_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          activity_stream?: Json | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          members?: Json | null
          name?: string
          owner_department?: string
          purpose?: string
          related_entities?: Json | null
          resources?: Json | null
          settings?: Json | null
          status?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["workspace_type"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      aa_commitment_summary_by_dossier: {
        Row: {
          completed: number | null
          critical: number | null
          dossier_id: string | null
          in_progress: number | null
          overdue: number | null
          pending: number | null
          total_commitments: number | null
        }
        Relationships: []
      }
      audit_logs_active: {
        Row: {
          action: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          intake_id: string | null
          link_id: string | null
          performed_by: string | null
          timestamp: string | null
        }
        Insert: {
          action?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          intake_id?: string | null
          link_id?: string | null
          performed_by?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          intake_id?: string | null
          link_id?: string | null
          performed_by?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      intelligence_cache_status: {
        Row: {
          cache_expires_at: string | null
          confidence_level:
            | Database["public"]["Enums"]["confidence_level"]
            | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          hours_since_refresh: number | null
          hours_until_expiry: number | null
          id: string | null
          intelligence_type: string | null
          is_expired: boolean | null
          last_refreshed_at: string | null
          refresh_duration_ms: number | null
          refresh_status: string | null
          refresh_trigger_type: string | null
          refresh_triggered_by: string | null
          triggered_by_email: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_reports_refresh_triggered_by_fkey"
            columns: ["refresh_triggered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      link_audit_logs_archival_eligible: {
        Row: {
          action: string | null
          age: unknown
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          intake_id: string | null
          link_id: string | null
          performed_by: string | null
          timestamp: string | null
        }
        Insert: {
          action?: string | null
          age?: never
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          intake_id?: string | null
          link_id?: string | null
          performed_by?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string | null
          age?: never
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          intake_id?: string | null
          link_id?: string | null
          performed_by?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mous_frontend: {
        Row: {
          created_at: string | null
          description: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string | null
          primary_party: Json | null
          reference_number: string | null
          secondary_party: Json | null
          signing_date: string | null
          title_ar: string | null
          title_en: string | null
          workflow_state: string | null
        }
        Insert: {
          created_at?: string | null
          description?: never
          effective_date?: string | null
          expiry_date?: string | null
          id?: string | null
          primary_party?: never
          reference_number?: string | null
          secondary_party?: never
          signing_date?: never
          title_ar?: string | null
          title_en?: string | null
          workflow_state?: never
        }
        Update: {
          created_at?: string | null
          description?: never
          effective_date?: string | null
          expiry_date?: string | null
          id?: string | null
          primary_party?: never
          reference_number?: string | null
          secondary_party?: never
          signing_date?: never
          title_ar?: string | null
          title_en?: string | null
          workflow_state?: never
        }
        Relationships: []
      }
    }
    Functions: {
      accept_triage_decision: {
        Args: { p_decision_id: string; p_user_id: string }
        Returns: undefined
      }
      algorithm_sign: {
        Args: { algorithm: string; secret: string; signables: string }
        Returns: string
      }
      archive_dossier: { Args: { dossier_id: string }; Returns: undefined }
      bytea_to_text: { Args: { data: string }; Returns: string }
      calculate_consistency_score: {
        Args: { p_thematic_area_id: string }
        Returns: number
      }
      calculate_metadata_similarity: {
        Args: { ticket1_id: string; ticket2_id: string }
        Returns: number
      }
      calculate_next_scan_time: { Args: { frequency: string }; Returns: string }
      calculate_priority: {
        Args: {
          p_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          p_urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Returns: Database["public"]["Enums"]["priority_level"]
      }
      calculate_text_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      can_edit_dossier: { Args: { dossier_id: string }; Returns: boolean }
      check_clearance_level: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id: string }
        Returns: boolean
      }
      check_dossier_is_active: {
        Args: { dossier_uuid: string }
        Returns: boolean
      }
      check_event_conflicts: {
        Args: {
          p_end_time: string
          p_exclude_event_id?: string
          p_start_time: string
        }
        Returns: {
          conflicting_end_time: string
          conflicting_event_id: string
          conflicting_event_title: string
          conflicting_start_time: string
        }[]
      }
      check_sla_breaches: {
        Args: never
        Returns: {
          breach_count: number
          ticket_count: number
        }[]
      }
      check_user_is_contributor: {
        Args: { task_uuid: string; user_uuid: string }
        Returns: boolean
      }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      convert_ticket_to_artifact: {
        Args: {
          p_additional_data?: Json
          p_correlation_id?: string
          p_mfa_verified?: boolean
          p_target_type: string
          p_ticket_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      cosine_similarity: { Args: { v1: string; v2: string }; Returns: number }
      create_document_version: {
        Args: {
          p_description_ar: string
          p_description_en: string
          p_file_url: string
          p_parent_id: string
          p_title_ar: string
          p_title_en: string
          p_version_number: string
        }
        Returns: string
      }
      detect_position_conflicts: {
        Args: { p_consistency_id: string; p_thematic_area_id: string }
        Returns: undefined
      }
      euclidean_distance: { Args: { v1: string; v2: string }; Returns: number }
      find_matching_sla_policy: {
        Args: {
          p_priority: Database["public"]["Enums"]["priority_level"]
          p_request_type: Database["public"]["Enums"]["request_type"]
          p_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          p_urgency: Database["public"]["Enums"]["urgency_level"]
        }
        Returns: string
      }
      find_related_intelligence: {
        Args: { limit_count?: number; report_id: string }
        Returns: {
          classification: Database["public"]["Enums"]["classification_level"]
          confidence_level: Database["public"]["Enums"]["confidence_level"]
          related_report_id: string
          related_report_title: string
          similarity_score: number
        }[]
      }
      generate_content_hash: { Args: { p_content: string }; Returns: string }
      generate_embedding: {
        Args: { input_text: string; model_name?: string }
        Returns: string
      }
      generate_storage_path: {
        Args: { p_file_name: string; p_ticket_id: string }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_assignment_progress: {
        Args: { p_assignment_id: string }
        Returns: number
      }
      get_bidirectional_relationships: {
        Args: {
          dossier_id_param: string
          include_inactive?: boolean
          relationship_type_filter?: string
        }
        Returns: {
          direction: string
          effective_from: string
          effective_to: string
          notes_ar: string
          notes_en: string
          related_dossier_id: string
          related_dossier_type: string
          related_name_ar: string
          related_name_en: string
          relationship_id: string
          relationship_type: string
          status: string
        }[]
      }
      get_comment_reactions: {
        Args: { p_comment_id: string }
        Returns: {
          count: number
          emoji: string
          users: string[]
        }[]
      }
      get_dossier_tags: {
        Args: { p_dossier_id: string }
        Returns: {
          color: string
          count: number
          tag_name: string
        }[]
      }
      get_dossier_timeline: {
        Args: { p_dossier_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          attendee_count: number
          created_at: string
          details: string
          id: string
          interaction_date: string
          interaction_type: string
        }[]
      }
      get_engagement_progress: {
        Args: { p_engagement_id: string }
        Returns: {
          completed_assignments: number
          in_progress_assignments: number
          kanban_stats: Json
          progress_percentage: number
          todo_assignments: number
          total_assignments: number
        }[]
      }
      get_escalation_path: {
        Args: { p_user_id: string }
        Returns: {
          department: string
          email: string
          full_name: string
          level: number
          position_title: string
          reports_to_id: string
          user_id: string
        }[]
      }
      get_intelligence_ttl_hours: {
        Args: { intel_type: string }
        Returns: number
      }
      get_latest_intelligence: {
        Args: {
          p_entity_id: string
          p_include_stale?: boolean
          p_intelligence_type?: string
        }
        Returns: {
          cache_expires_at: string
          confidence_score: number
          content: string
          id: string
          intelligence_type: string
          is_expired: boolean
          last_refreshed_at: string
          refresh_status: string
          title: string
        }[]
      }
      get_merge_history: {
        Args: { p_ticket_id: string }
        Returns: {
          merge_type: string
          merged_at: string
          merged_by: string
          ticket_id: string
          ticket_number: string
          title: string
        }[]
      }
      get_relationship_path: {
        Args: {
          max_depth?: number
          source_dossier_id: string
          target_dossier_id: string
        }
        Returns: {
          path: string[]
          path_length: number
          relationship_path: string[]
        }[]
      }
      get_sla_breached_tickets: {
        Args: never
        Returns: {
          breach_time: string
          minutes_overdue: number
          priority: string
          sla_type: string
          status: string
          ticket_id: string
          ticket_number: string
          title: string
        }[]
      }
      get_system_user_id: { Args: never; Returns: string }
      get_user_clearance_level: { Args: { user_id: string }; Returns: number }
      get_user_max_sensitivity: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["sensitivity_level"]
      }
      get_user_role: { Args: never; Returns: string }
      get_user_unit: { Args: never; Returns: string }
      get_user_units: { Args: { p_user_id: string }; Returns: string[] }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      inner_product_similarity: {
        Args: { v1: string; v2: string }
        Returns: number
      }
      invoke_update_aging_buckets: { Args: never; Returns: undefined }
      is_admin:
        | { Args: { p_user_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_admin_or_manager: { Args: { user_id: string }; Returns: boolean }
      is_assigned_to_dossier: {
        Args: { dossier_uuid: string }
        Returns: boolean
      }
      is_auditor: { Args: { p_user_id: string }; Returns: boolean }
      is_intelligence_cache_expired: {
        Args: { report_id: string }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      is_supervisor: { Args: { p_user_id: string }; Returns: boolean }
      lock_intelligence_for_refresh: {
        Args: {
          p_entity_id: string
          p_intelligence_type: string
          p_trigger_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_correlation_id?: string
          p_entity_id: string
          p_entity_type: string
          p_ip_address?: unknown
          p_mfa_method?: string
          p_mfa_verified?: boolean
          p_new_values?: Json
          p_old_values?: Json
          p_required_mfa?: boolean
          p_session_id?: string
          p_user_agent?: string
          p_user_id: string
          p_user_role: string
        }
        Returns: string
      }
      log_document_access: {
        Args: { p_action: string; p_document_id: string }
        Returns: undefined
      }
      log_intelligence_refresh_job: {
        Args: {
          p_error_message?: string
          p_items_failed?: number
          p_items_processed?: number
          p_job_name: string
          p_status: string
        }
        Returns: string
      }
      manual_update_aging_buckets: {
        Args: never
        Returns: {
          message: string
          total_assignments: number
        }[]
      }
      mark_expired_intelligence_stale: { Args: never; Returns: number }
      match_positions: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          position_id: string
          position_title: string
          position_type: string
          relevance_score: number
        }[]
      }
      merge_duplicate_tickets: {
        Args: {
          p_duplicate_ticket_id: string
          p_primary_ticket_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: undefined
      }
      merge_tickets: {
        Args: {
          p_correlation_id?: string
          p_merge_reason?: string
          p_primary_ticket_id: string
          p_ticket_ids_to_merge: string[]
          p_user_id?: string
        }
        Returns: Json
      }
      normalize_vector: { Args: { v: string }; Returns: string }
      process_stale_queue_items: { Args: never; Returns: undefined }
      refresh_aa_commitment_summary: { Args: never; Returns: undefined }
      refresh_organization_summary: { Args: never; Returns: undefined }
      restore_dossier: { Args: { dossier_id: string }; Returns: undefined }
      rollback_ticket_conversion: {
        Args: {
          p_correlation_id?: string
          p_ticket_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      search_duplicate_tickets: {
        Args: {
          p_embedding: string
          p_exclude_ticket_id: string
          p_include_resolved?: boolean
          p_limit?: number
          p_threshold?: number
        }
        Returns: {
          metadata_similarity: number
          similarity_score: number
          ticket_id: string
          ticket_number: string
          title: string
          title_similarity: number
        }[]
      }
      search_entities_fulltext: {
        Args: {
          p_entity_type: string
          p_language?: string
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          entity_id: string
          entity_snippet_ar: string
          entity_snippet_en: string
          entity_title_ar: string
          entity_title_en: string
          entity_type: string
          rank_score: number
          updated_at: string
        }[]
      }
      search_entities_semantic: {
        Args: {
          p_entity_type: string
          p_limit?: number
          p_query_embedding: string
          p_similarity_threshold?: number
        }
        Returns: {
          entity_id: string
          entity_title: string
          entity_type: string
          similarity_score: number
          updated_at: string
        }[]
      }
      search_persons: {
        Args: { p_limit?: number; p_offset?: number; p_search_term: string }
        Returns: {
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name_ar: string
          name_en: string
          search_vector: unknown
          sensitivity_level: number
          status: string
          tags: string[] | null
          type: string
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "dossiers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_similar_documents: {
        Args: {
          filter_id?: string
          filter_type?: Database["public"]["Enums"]["entity_type"]
          limit_count?: number
          query_embedding: string
          threshold?: number
        }
        Returns: {
          content_chunk: string
          document_id: string
          metadata: Json
          similarity_score: number
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
        }[]
      }
      search_tickets_by_keywords: {
        Args: {
          p_exclude_ticket_id: string
          p_keywords: string
          p_limit?: number
        }
        Returns: {
          ticket_id: string
          ticket_number: string
          title: string
        }[]
      }
      search_tickets_by_trigram: {
        Args: {
          p_description: string
          p_exclude_ticket_id: string
          p_limit?: number
          p_threshold?: number
          p_title: string
        }
        Returns: {
          content_similarity: number
          metadata_similarity: number
          similarity_score: number
          ticket_id: string
          ticket_number: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sign: {
        Args: { algorithm?: string; payload: Json; secret: string }
        Returns: string
      }
      sla_check_and_escalate: { Args: never; Returns: undefined }
      start_sla_tracking: { Args: { p_ticket_id: string }; Returns: string }
      store_ticket_embedding: {
        Args: {
          p_embedding: string
          p_model?: string
          p_model_version?: string
          p_ticket_id: string
        }
        Returns: string
      }
      sync_existing_auth_users: { Args: never; Returns: undefined }
      system_operation: { Args: { p_operation: string }; Returns: boolean }
      text_to_bytea: { Args: { data: string }; Returns: string }
      traverse_relationship_graph: {
        Args: {
          max_degrees?: number
          relationship_type_filter?: string
          start_dossier_id: string
        }
        Returns: {
          degree: number
          dossier_id: string
          dossier_type: string
          name_ar: string
          name_en: string
          path: string[]
          relationship_path: string[]
          status: string
        }[]
      }
      trigger_intelligence_batch_refresh: { Args: never; Returns: undefined }
      try_cast_double: { Args: { inp: string }; Returns: number }
      update_overdue_aa_commitments: { Args: never; Returns: undefined }
      update_overdue_commitments: { Args: never; Returns: undefined }
      update_relationship_health: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      update_table_statistics: { Args: never; Returns: undefined }
      url_decode: { Args: { data: string }; Returns: string }
      url_encode: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      user_can_view_assignment: {
        Args: { assignment_id: string; user_id: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      verify: {
        Args: { algorithm?: string; secret: string; token: string }
        Returns: {
          header: Json
          payload: Json
          valid: boolean
        }[]
      }
    }
    Enums: {
      aa_commitment_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "overdue"
      aa_owner_type: "internal" | "external"
      aa_priority: "low" | "medium" | "high" | "critical"
      aa_tracking_mode: "automatic" | "manual"
      access_level: "public" | "internal" | "confidential" | "secret"
      activity_type:
        | "meeting"
        | "mission"
        | "conference"
        | "workshop"
        | "phone_call"
        | "email_exchange"
      analysis_type: "trend" | "pattern" | "prediction" | "assessment"
      assignment_event_type:
        | "created"
        | "status_changed"
        | "escalated"
        | "completed"
        | "commented"
        | "checklist_updated"
        | "observer_added"
        | "reassigned"
        | "workflow_stage_changed"
      assignment_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      attendee_role: "host" | "participant" | "observer" | "speaker"
      attendee_type: "country" | "organization" | "contact"
      availability_status: "available" | "on_leave" | "unavailable"
      brief_status: "draft" | "review" | "approved" | "published"
      classification_level: "public" | "internal" | "confidential" | "secret"
      commitment_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "cancelled"
      commitment_type:
        | "deliverable"
        | "payment"
        | "report"
        | "participation"
        | "data_submission"
      communication_channel: "email" | "phone" | "whatsapp"
      confidence_level: "low" | "medium" | "high" | "critical"
      contact_level:
        | "minister"
        | "director"
        | "head"
        | "manager"
        | "specialist"
        | "other"
      contact_type:
        | "primary"
        | "secondary"
        | "technical"
        | "administrative"
        | "executive"
      country_status: "active" | "inactive" | "suspended"
      decision_type: "ai_suggestion" | "manual_override" | "auto_assignment"
      deliverable_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "delayed"
        | "at_risk"
      document_classification: "public" | "internal" | "confidential" | "secret"
      document_language: "ar" | "en" | "bilingual"
      document_type:
        | "agreement"
        | "report"
        | "presentation"
        | "correspondence"
        | "position_paper"
        | "minutes"
        | "brief"
        | "other"
      duplicate_status:
        | "pending"
        | "confirmed_duplicate"
        | "not_duplicate"
        | "merged"
      embedding_owner_type: "ticket" | "artifact"
      engagement_workflow_stage:
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "cancelled"
      entity_type:
        | "country"
        | "organization"
        | "mou"
        | "event"
        | "forum"
        | "brief"
        | "intelligence_report"
        | "data_library_item"
      escalation_reason: "sla_breach" | "manual" | "capacity_exhaustion"
      event_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      event_type:
        | "meeting"
        | "conference"
        | "workshop"
        | "ceremony"
        | "visit"
        | "other"
      forum_frequency:
        | "annual"
        | "biennial"
        | "quarterly"
        | "one_time"
        | "ad_hoc"
      forum_type:
        | "conference"
        | "workshop"
        | "summit"
        | "committee_meeting"
        | "bilateral"
      health_status: "healthy" | "monitor" | "at_risk" | "critical"
      intelligence_category:
        | "statistical_method"
        | "technology"
        | "partnership"
        | "regulation"
        | "event"
        | "other"
      intelligence_status: "draft" | "review" | "approved" | "published"
      intelligence_type:
        | "trend"
        | "opportunity"
        | "risk"
        | "best_practice"
        | "news"
      language_preference: "en" | "ar"
      language_proficiency: "native" | "fluent" | "professional" | "basic"
      likelihood: "unlikely" | "possible" | "likely" | "certain"
      location_type: "in_person" | "virtual" | "hybrid"
      membership_status: "member" | "observer" | "partner" | "none"
      mou_category:
        | "data_exchange"
        | "capacity_building"
        | "strategic"
        | "technical"
      mou_state:
        | "draft"
        | "negotiation"
        | "pending_approval"
        | "signed"
        | "active"
        | "suspended"
        | "expired"
        | "terminated"
      mou_status:
        | "draft"
        | "negotiation"
        | "signed"
        | "active"
        | "expired"
        | "terminated"
      mou_type: "bilateral" | "multilateral" | "framework" | "technical"
      notification_type:
        | "commitment_assigned"
        | "commitment_due_soon"
        | "after_action_published"
        | "edit_approved"
        | "edit_rejected"
      organization_status: "active" | "inactive" | "suspended"
      organization_type:
        | "government"
        | "international"
        | "ngo"
        | "private"
        | "academic"
        | "research"
      participation_level: "active" | "occasional" | "observer"
      priority_level:
        | "critical"
        | "urgent"
        | "high"
        | "normal"
        | "medium"
        | "low"
      relationship_health: "excellent" | "good" | "fair" | "poor" | "critical"
      relationship_status: "active" | "developing" | "dormant"
      relationship_type:
        | "bilateral"
        | "multilateral"
        | "membership"
        | "partnership"
      reporting_frequency: "annual" | "quarterly" | "monthly" | "ad_hoc"
      request_type: "engagement" | "position" | "mou_action" | "foresight"
      retention_category:
        | "permanent"
        | "long_term"
        | "medium_term"
        | "temporary"
      scan_status: "pending" | "clean" | "infected" | "error"
      sensitivity_level: "public" | "internal" | "confidential" | "secret"
      severity: "low" | "medium" | "high" | "critical"
      sla_event_type:
        | "started"
        | "paused"
        | "resumed"
        | "met"
        | "breached"
        | "cancelled"
      statistical_system_type: "centralized" | "decentralized" | "hybrid"
      task_priority: "urgent" | "high" | "medium" | "low"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      task_type:
        | "action_item"
        | "follow_up"
        | "preparation"
        | "analysis"
        | "other"
      thematic_category:
        | "sdg"
        | "methodology"
        | "technology"
        | "governance"
        | "capacity"
      ticket_source: "web" | "api" | "email" | "import"
      ticket_status:
        | "draft"
        | "submitted"
        | "triaged"
        | "assigned"
        | "in_progress"
        | "converted"
        | "closed"
        | "merged"
      urgency_level: "low" | "medium" | "high" | "critical"
      urgent_priority: "urgent" | "high" | "medium" | "low"
      user_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "analyst"
        | "viewer"
        | "security_admin"
        | "editor"
        | "user"
        | "moderator"
      visibility_level: "public" | "internal" | "restricted"
      work_item_type: "dossier" | "ticket" | "position" | "task"
      workspace_type: "project" | "committee" | "initiative" | "temporary"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aa_commitment_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "overdue",
      ],
      aa_owner_type: ["internal", "external"],
      aa_priority: ["low", "medium", "high", "critical"],
      aa_tracking_mode: ["automatic", "manual"],
      access_level: ["public", "internal", "confidential", "secret"],
      activity_type: [
        "meeting",
        "mission",
        "conference",
        "workshop",
        "phone_call",
        "email_exchange",
      ],
      analysis_type: ["trend", "pattern", "prediction", "assessment"],
      assignment_event_type: [
        "created",
        "status_changed",
        "escalated",
        "completed",
        "commented",
        "checklist_updated",
        "observer_added",
        "reassigned",
        "workflow_stage_changed",
      ],
      assignment_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      attendee_role: ["host", "participant", "observer", "speaker"],
      attendee_type: ["country", "organization", "contact"],
      availability_status: ["available", "on_leave", "unavailable"],
      brief_status: ["draft", "review", "approved", "published"],
      classification_level: ["public", "internal", "confidential", "secret"],
      commitment_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "cancelled",
      ],
      commitment_type: [
        "deliverable",
        "payment",
        "report",
        "participation",
        "data_submission",
      ],
      communication_channel: ["email", "phone", "whatsapp"],
      confidence_level: ["low", "medium", "high", "critical"],
      contact_level: [
        "minister",
        "director",
        "head",
        "manager",
        "specialist",
        "other",
      ],
      contact_type: [
        "primary",
        "secondary",
        "technical",
        "administrative",
        "executive",
      ],
      country_status: ["active", "inactive", "suspended"],
      decision_type: ["ai_suggestion", "manual_override", "auto_assignment"],
      deliverable_status: [
        "not_started",
        "in_progress",
        "completed",
        "delayed",
        "at_risk",
      ],
      document_classification: ["public", "internal", "confidential", "secret"],
      document_language: ["ar", "en", "bilingual"],
      document_type: [
        "agreement",
        "report",
        "presentation",
        "correspondence",
        "position_paper",
        "minutes",
        "brief",
        "other",
      ],
      duplicate_status: [
        "pending",
        "confirmed_duplicate",
        "not_duplicate",
        "merged",
      ],
      embedding_owner_type: ["ticket", "artifact"],
      engagement_workflow_stage: [
        "todo",
        "in_progress",
        "review",
        "done",
        "cancelled",
      ],
      entity_type: [
        "country",
        "organization",
        "mou",
        "event",
        "forum",
        "brief",
        "intelligence_report",
        "data_library_item",
      ],
      escalation_reason: ["sla_breach", "manual", "capacity_exhaustion"],
      event_status: ["scheduled", "in_progress", "completed", "cancelled"],
      event_type: [
        "meeting",
        "conference",
        "workshop",
        "ceremony",
        "visit",
        "other",
      ],
      forum_frequency: [
        "annual",
        "biennial",
        "quarterly",
        "one_time",
        "ad_hoc",
      ],
      forum_type: [
        "conference",
        "workshop",
        "summit",
        "committee_meeting",
        "bilateral",
      ],
      health_status: ["healthy", "monitor", "at_risk", "critical"],
      intelligence_category: [
        "statistical_method",
        "technology",
        "partnership",
        "regulation",
        "event",
        "other",
      ],
      intelligence_status: ["draft", "review", "approved", "published"],
      intelligence_type: [
        "trend",
        "opportunity",
        "risk",
        "best_practice",
        "news",
      ],
      language_preference: ["en", "ar"],
      language_proficiency: ["native", "fluent", "professional", "basic"],
      likelihood: ["unlikely", "possible", "likely", "certain"],
      location_type: ["in_person", "virtual", "hybrid"],
      membership_status: ["member", "observer", "partner", "none"],
      mou_category: [
        "data_exchange",
        "capacity_building",
        "strategic",
        "technical",
      ],
      mou_state: [
        "draft",
        "negotiation",
        "pending_approval",
        "signed",
        "active",
        "suspended",
        "expired",
        "terminated",
      ],
      mou_status: [
        "draft",
        "negotiation",
        "signed",
        "active",
        "expired",
        "terminated",
      ],
      mou_type: ["bilateral", "multilateral", "framework", "technical"],
      notification_type: [
        "commitment_assigned",
        "commitment_due_soon",
        "after_action_published",
        "edit_approved",
        "edit_rejected",
      ],
      organization_status: ["active", "inactive", "suspended"],
      organization_type: [
        "government",
        "international",
        "ngo",
        "private",
        "academic",
        "research",
      ],
      participation_level: ["active", "occasional", "observer"],
      priority_level: ["critical", "urgent", "high", "normal", "medium", "low"],
      relationship_health: ["excellent", "good", "fair", "poor", "critical"],
      relationship_status: ["active", "developing", "dormant"],
      relationship_type: [
        "bilateral",
        "multilateral",
        "membership",
        "partnership",
      ],
      reporting_frequency: ["annual", "quarterly", "monthly", "ad_hoc"],
      request_type: ["engagement", "position", "mou_action", "foresight"],
      retention_category: [
        "permanent",
        "long_term",
        "medium_term",
        "temporary",
      ],
      scan_status: ["pending", "clean", "infected", "error"],
      sensitivity_level: ["public", "internal", "confidential", "secret"],
      severity: ["low", "medium", "high", "critical"],
      sla_event_type: [
        "started",
        "paused",
        "resumed",
        "met",
        "breached",
        "cancelled",
      ],
      statistical_system_type: ["centralized", "decentralized", "hybrid"],
      task_priority: ["urgent", "high", "medium", "low"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      task_type: [
        "action_item",
        "follow_up",
        "preparation",
        "analysis",
        "other",
      ],
      thematic_category: [
        "sdg",
        "methodology",
        "technology",
        "governance",
        "capacity",
      ],
      ticket_source: ["web", "api", "email", "import"],
      ticket_status: [
        "draft",
        "submitted",
        "triaged",
        "assigned",
        "in_progress",
        "converted",
        "closed",
        "merged",
      ],
      urgency_level: ["low", "medium", "high", "critical"],
      urgent_priority: ["urgent", "high", "medium", "low"],
      user_role: [
        "super_admin",
        "admin",
        "manager",
        "analyst",
        "viewer",
        "security_admin",
        "editor",
        "user",
        "moderator",
      ],
      visibility_level: ["public", "internal", "restricted"],
      work_item_type: ["dossier", "ticket", "position", "task"],
      workspace_type: ["project", "committee", "initiative", "temporary"],
    },
  },
} as const
