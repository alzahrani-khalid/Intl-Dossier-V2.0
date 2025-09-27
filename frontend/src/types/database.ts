export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      audit_log: {
        Row: {
          action: string
          additional_context: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      briefs: {
        Row: {
          audience: Json
          content: Json
          created_at: string
          created_by: string
          deleted_at: string | null
          generation: Json
          id: string
          is_deleted: boolean
          last_modified_by: string
          parameters: Json
          purpose: string
          target_entity: Json
          tenant_id: string
          type: string
          updated_at: string
          usage: Json | null
          version: number
        }
        Insert: {
          audience?: Json
          content?: Json
          created_at?: string
          created_by: string
          deleted_at?: string | null
          generation?: Json
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          parameters?: Json
          purpose: string
          target_entity?: Json
          tenant_id: string
          type: string
          updated_at?: string
          usage?: Json | null
          version?: number
        }
        Update: {
          audience?: Json
          content?: Json
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          generation?: Json
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          parameters?: Json
          purpose?: string
          target_entity?: Json
          tenant_id?: string
          type?: string
          updated_at?: string
          usage?: Json | null
          version?: number
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          code3: string
          cooperation_areas: string[] | null
          created_at: string
          created_by: string
          deleted_at: string | null
          expertise_domains: string[] | null
          flag_url: string | null
          id: string
          is_arab_league: boolean | null
          is_deleted: boolean
          is_gcc: boolean | null
          is_islamic_org: boolean | null
          last_modified_by: string
          name_ar: string
          name_en: string
          region: string
          relationship_status: Database["public"]["Enums"]["relationship_status"] | null
          statistical_system: Json
          strategic_importance: number | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          code: string
          code3: string
          cooperation_areas?: string[] | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          expertise_domains?: string[] | null
          flag_url?: string | null
          id?: string
          is_arab_league?: boolean | null
          is_deleted?: boolean
          is_gcc?: boolean | null
          is_islamic_org?: boolean | null
          last_modified_by: string
          name_ar: string
          name_en: string
          region: string
          relationship_status?: Database["public"]["Enums"]["relationship_status"] | null
          statistical_system?: Json
          strategic_importance?: number | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          code?: string
          code3?: string
          cooperation_areas?: string[] | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          expertise_domains?: string[] | null
          flag_url?: string | null
          id?: string
          is_arab_league?: boolean | null
          is_deleted?: boolean
          is_gcc?: boolean | null
          is_islamic_org?: boolean | null
          last_modified_by?: string
          name_ar?: string
          name_en?: string
          region?: string
          relationship_status?: Database["public"]["Enums"]["relationship_status"] | null
          statistical_system?: Json
          strategic_importance?: number | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
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
      events: {
        Row: {
          attendees: string[] | null
          created_at: string
          description: string | null
          documents: string[] | null
          end_date: string
          id: string
          location: string
          start_date: string
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
          description?: string | null
          documents?: string[] | null
          end_date: string
          id?: string
          location: string
          start_date: string
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
          description?: string | null
          documents?: string[] | null
          end_date?: string
          id?: string
          location?: string
          start_date?: string
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Relationships: []
      }
      forums: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          frequency: Database["public"]["Enums"]["forum_frequency"]
          id: string
          is_deleted: boolean
          last_modified_by: string
          name_ar: string
          name_en: string
          next_event: Json | null
          organizing_body: string | null
          participation_history: Json | null
          priority_level: Database["public"]["Enums"]["priority_level"] | null
          tenant_id: string
          themes: string[] | null
          type: Database["public"]["Enums"]["forum_type"]
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          frequency: Database["public"]["Enums"]["forum_frequency"]
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          name_ar: string
          name_en: string
          next_event?: Json | null
          organizing_body?: string | null
          participation_history?: Json | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          tenant_id: string
          themes?: string[] | null
          type: Database["public"]["Enums"]["forum_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          frequency?: Database["public"]["Enums"]["forum_frequency"]
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          name_ar?: string
          name_en?: string
          next_event?: Json | null
          organizing_body?: string | null
          participation_history?: Json | null
          priority_level?: Database["public"]["Enums"]["priority_level"] | null
          tenant_id?: string
          themes?: string[] | null
          type?: Database["public"]["Enums"]["forum_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "forums_organizing_body_fkey"
            columns: ["organizing_body"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
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
      mous: {
        Row: {
          alert_config: Json | null
          created_at: string
          created_by: string
          dates: Json
          deleted_at: string | null
          deliverables: Json | null
          documents: string[] | null
          financial: Json | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          lifecycle_state: Database["public"]["Enums"]["mou_state"]
          mou_category: Database["public"]["Enums"]["mou_category"]
          parties: Json | null
          performance_metrics: Json | null
          reference_number: string
          tenant_id: string
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["mou_type"]
          updated_at: string
          version: number
        }
        Insert: {
          alert_config?: Json | null
          created_at?: string
          created_by: string
          dates?: Json
          deleted_at?: string | null
          deliverables?: Json | null
          documents?: string[] | null
          financial?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          lifecycle_state?: Database["public"]["Enums"]["mou_state"]
          mou_category: Database["public"]["Enums"]["mou_category"]
          parties?: Json | null
          performance_metrics?: Json | null
          reference_number: string
          tenant_id: string
          title_ar: string
          title_en: string
          type: Database["public"]["Enums"]["mou_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          alert_config?: Json | null
          created_at?: string
          created_by?: string
          dates?: Json
          deleted_at?: string | null
          deliverables?: Json | null
          documents?: string[] | null
          financial?: Json | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          lifecycle_state?: Database["public"]["Enums"]["mou_state"]
          mou_category?: Database["public"]["Enums"]["mou_category"]
          parties?: Json | null
          performance_metrics?: Json | null
          reference_number?: string
          tenant_id?: string
          title_ar?: string
          title_en?: string
          type?: Database["public"]["Enums"]["mou_type"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      organizations: {
        Row: {
          code: string
          committees: Json | null
          created_at: string
          created_by: string
          deleted_at: string | null
          headquarters_country: string
          id: string
          is_deleted: boolean
          last_modified_by: string
          membership: Json
          name_ar: string
          name_en: string
          parent_org_id: string | null
          reporting_requirements: Json | null
          tenant_id: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          version: number
          website: string | null
        }
        Insert: {
          code: string
          committees?: Json | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          headquarters_country: string
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          membership?: Json
          name_ar: string
          name_en: string
          parent_org_id?: string | null
          reporting_requirements?: Json | null
          tenant_id: string
          type: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          version?: number
          website?: string | null
        }
        Update: {
          code?: string
          committees?: Json | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          headquarters_country?: string
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          membership?: Json
          name_ar?: string
          name_en?: string
          parent_org_id?: string | null
          reporting_requirements?: Json | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          version?: number
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          language_preference: string | null
          last_login_at: string | null
          mfa_enabled: boolean | null
          role: string
          timezone: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          role?: string
          timezone?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          language_preference?: string | null
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          role?: string
          timezone?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type: "meeting" | "mission" | "conference" | "workshop" | "phone_call" | "email_exchange"
      attendee_role: "host" | "participant" | "observer" | "speaker"
      attendee_type: "country" | "organization" | "contact"
      classification_level: "public" | "internal" | "confidential" | "secret"
      commitment_status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"
      commitment_type: "deliverable" | "payment" | "report" | "participation" | "data_submission"
      document_language: "ar" | "en" | "bilingual"
      document_type: "agreement" | "report" | "presentation" | "correspondence" | "position_paper" | "minutes" | "brief" | "other"
      event_type: "meeting" | "conference" | "workshop" | "ceremony" | "visit" | "other"
      forum_frequency: "annual" | "biennial" | "quarterly" | "one_time" | "ad_hoc"
      forum_type: "conference" | "workshop" | "summit" | "committee_meeting" | "bilateral"
      health_status: "healthy" | "monitor" | "at_risk" | "critical"
      intelligence_category: "statistical_method" | "technology" | "partnership" | "regulation" | "event" | "other"
      intelligence_type: "trend" | "opportunity" | "risk" | "best_practice" | "news"
      mou_category: "data_exchange" | "capacity_building" | "strategic" | "technical"
      mou_state: "draft" | "negotiation" | "pending_approval" | "signed" | "active" | "suspended" | "expired" | "terminated"
      mou_type: "bilateral" | "multilateral" | "framework" | "technical"
      organization_type: "government" | "international" | "ngo" | "private" | "academic" | "research"
      priority_level: "critical" | "high" | "medium" | "low"
      relationship_status: "active" | "developing" | "dormant"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      urgent_priority: "urgent" | "high" | "medium" | "low"
      user_role: "super_admin" | "admin" | "manager" | "analyst" | "viewer"
      visibility_level: "public" | "internal" | "restricted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never