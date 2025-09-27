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
        ]
      }
      signature_signatories: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          search_vector: unknown | null
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
          search_vector?: unknown | null
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
          search_vector?: unknown | null
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
          {
            foreignKeyName: "position_conflicts_position1_id_fkey"
            columns: ["position1_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_conflicts_position2_id_fkey"
            columns: ["position2_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      // Other existing tables...
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
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "contacts_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      positions: {
        Row: {
          alignment: Json | null
          approval: Json
          category: string
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          last_modified_by: string
          rationale: string | null
          related_positions: string[] | null
          stance: Json
          tenant_id: string
          topic: string
          updated_at: string
          usage_guidelines: string | null
          version: Json
          version_number: number
        }
        Insert: {
          alignment?: Json | null
          approval?: Json
          category: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          last_modified_by: string
          rationale?: string | null
          related_positions?: string[] | null
          stance?: Json
          tenant_id: string
          topic: string
          updated_at?: string
          usage_guidelines?: string | null
          version?: Json
          version_number?: number
        }
        Update: {
          alignment?: Json | null
          approval?: Json
          category?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          last_modified_by?: string
          rationale?: string | null
          related_positions?: string[] | null
          stance?: Json
          tenant_id?: string
          topic?: string
          updated_at?: string
          usage_guidelines?: string | null
          version?: Json
          version_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_consistency_score: {
        Args: { p_thematic_area_id: string }
        Returns: number
      }
      calculate_next_scan_time: {
        Args: { frequency: string }
        Returns: string
      }
      check_circular_delegation: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      detect_position_conflicts: {
        Args: { p_consistency_id: string; p_thematic_area_id: string }
        Returns: undefined
      }
      update_scan_time: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_signature_request_status: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      activity_type: "meeting" | "mission" | "conference" | "workshop" | "phone_call" | "email_exchange"
      classification_level: "public" | "internal" | "confidential" | "secret"
      commitment_status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"
      commitment_type: "deliverable" | "payment" | "report" | "participation" | "data_submission"
      document_language: "ar" | "en" | "bilingual"
      document_type: "agreement" | "report" | "presentation" | "correspondence" | "position_paper" | "minutes" | "brief" | "other"
      mou_category: "data_exchange" | "capacity_building" | "strategic" | "technical"
      mou_state: "draft" | "negotiation" | "pending_approval" | "signed" | "active" | "suspended" | "expired" | "terminated"
      mou_type: "bilateral" | "multilateral" | "framework" | "technical"
      organization_type: "government" | "international" | "ngo" | "private" | "academic" | "research"
      priority_level: "critical" | "high" | "medium" | "low"
      relationship_status: "active" | "developing" | "dormant"
      thematic_category: "sdg" | "methodology" | "technology" | "governance" | "capacity"
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