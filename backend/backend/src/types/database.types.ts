Using workdir /Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0
Connecting to db 5432
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
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          datetime_range: unknown
          description_ar: string | null
          description_en: string | null
          dossier_id: string
          duration_minutes: number | null
          end_time: string | null
          event_type: string
          id: string
          is_all_day: boolean | null
          is_private: boolean | null
          is_recurring: boolean | null
          location_city_ar: string | null
          location_city_en: string | null
          location_country_id: string | null
          location_type: string | null
          meeting_link: string | null
          metadata: Json | null
          recurrence_parent_id: string | null
          recurrence_rule: string | null
          reminder_minutes: number[] | null
          start_time: string | null
          status: string
          title_ar: string
          title_en: string
          updated_at: string
          updated_by: string | null
          venue_ar: string | null
          venue_en: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          datetime_range: unknown
          description_ar?: string | null
          description_en?: string | null
          dossier_id: string
          duration_minutes?: number | null
          end_time?: string | null
          event_type: string
          id?: string
          is_all_day?: boolean | null
          is_private?: boolean | null
          is_recurring?: boolean | null
          location_city_ar?: string | null
          location_city_en?: string | null
          location_country_id?: string | null
          location_type?: string | null
          meeting_link?: string | null
          metadata?: Json | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number[] | null
          start_time?: string | null
          status?: string
          title_ar: string
          title_en: string
          updated_at?: string
          updated_by?: string | null
          venue_ar?: string | null
          venue_en?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          datetime_range?: unknown
          description_ar?: string | null
          description_en?: string | null
          dossier_id?: string
          duration_minutes?: number | null
          end_time?: string | null
          event_type?: string
          id?: string
          is_all_day?: boolean | null
          is_private?: boolean | null
          is_recurring?: boolean | null
          location_city_ar?: string | null
          location_city_en?: string | null
          location_country_id?: string | null
          location_type?: string | null
          meeting_link?: string | null
          metadata?: Json | null
          recurrence_parent_id?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number[] | null
          start_time?: string | null
          status?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          updated_by?: string | null
          venue_ar?: string | null
          venue_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_location_country_id_fkey"
            columns: ["location_country_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_recurrence_parent_id_fkey"
            columns: ["recurrence_parent_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          area_sq_km: number | null
          capital_ar: string | null
          capital_en: string | null
          currency_code: string | null
          flag_url: string | null
          id: string
          internet_tld: string | null
          iso_code_2: string
          iso_code_3: string
          map_url: string | null
          phone_code: string | null
          population: number | null
          region: string | null
          subregion: string | null
        }
        Insert: {
          area_sq_km?: number | null
          capital_ar?: string | null
          capital_en?: string | null
          currency_code?: string | null
          flag_url?: string | null
          id: string
          internet_tld?: string | null
          iso_code_2: string
          iso_code_3: string
          map_url?: string | null
          phone_code?: string | null
          population?: number | null
          region?: string | null
          subregion?: string | null
        }
        Update: {
          area_sq_km?: number | null
          capital_ar?: string | null
          capital_en?: string | null
          currency_code?: string | null
          flag_url?: string | null
          id?: string
          internet_tld?: string | null
          iso_code_2?: string
          iso_code_3?: string
          map_url?: string | null
          phone_code?: string | null
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
      dossier_relationships: {
        Row: {
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          end_date: string | null
          id: string
          is_bidirectional: boolean | null
          metadata: Json | null
          relationship_label_ar: string | null
          relationship_label_en: string | null
          relationship_type: string
          source_dossier_id: string
          start_date: string | null
          status: string
          strength: number | null
          target_dossier_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          end_date?: string | null
          id?: string
          is_bidirectional?: boolean | null
          metadata?: Json | null
          relationship_label_ar?: string | null
          relationship_label_en?: string | null
          relationship_type: string
          source_dossier_id: string
          start_date?: string | null
          status?: string
          strength?: number | null
          target_dossier_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          end_date?: string | null
          id?: string
          is_bidirectional?: boolean | null
          metadata?: Json | null
          relationship_label_ar?: string | null
          relationship_label_en?: string | null
          relationship_type?: string
          source_dossier_id?: string
          start_date?: string | null
          status?: string
          strength?: number | null
          target_dossier_id?: string
          updated_at?: string
          updated_by?: string | null
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
      dossiers: {
        Row: {
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          metadata: Json | null
          name_ar: string
          name_en: string
          search_vector: unknown | null
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
          metadata?: Json | null
          name_ar: string
          name_en: string
          search_vector?: unknown | null
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
          metadata?: Json | null
          name_ar?: string
          name_en?: string
          search_vector?: unknown | null
          sensitivity_level?: number
          status?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      engagements: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          duration_minutes: number | null
          engagement_status: string
          engagement_type: string
          has_after_action: boolean | null
          id: string
          lead_org_id: string | null
          location_city_ar: string | null
          location_city_en: string | null
          location_country_id: string | null
          location_type: string | null
          meeting_link: string | null
          outcome_summary_ar: string | null
          outcome_summary_en: string | null
          parent_forum_id: string | null
          scheduled_date: string | null
          venue_ar: string | null
          venue_en: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          duration_minutes?: number | null
          engagement_status?: string
          engagement_type: string
          has_after_action?: boolean | null
          id: string
          lead_org_id?: string | null
          location_city_ar?: string | null
          location_city_en?: string | null
          location_country_id?: string | null
          location_type?: string | null
          meeting_link?: string | null
          outcome_summary_ar?: string | null
          outcome_summary_en?: string | null
          parent_forum_id?: string | null
          scheduled_date?: string | null
          venue_ar?: string | null
          venue_en?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          duration_minutes?: number | null
          engagement_status?: string
          engagement_type?: string
          has_after_action?: boolean | null
          id?: string
          lead_org_id?: string | null
          location_city_ar?: string | null
          location_city_en?: string | null
          location_country_id?: string | null
          location_type?: string | null
          meeting_link?: string | null
          outcome_summary_ar?: string | null
          outcome_summary_en?: string | null
          parent_forum_id?: string | null
          scheduled_date?: string | null
          venue_ar?: string | null
          venue_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagements_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_location_country_id_fkey"
            columns: ["location_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagements_parent_forum_id_fkey"
            columns: ["parent_forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          participant_dossier_id: string
          participant_type: string
          participation_status: string
          response_note: string | null
          rsvp_date: string | null
          rsvp_response: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          participant_dossier_id: string
          participant_type: string
          participation_status?: string
          response_note?: string | null
          rsvp_date?: string | null
          rsvp_response?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          participant_dossier_id?: string
          participant_type?: string
          participation_status?: string
          response_note?: string | null
          rsvp_date?: string | null
          rsvp_response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_participant_dossier_id_fkey"
            columns: ["participant_dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          end_date: string | null
          forum_type: string
          frequency: string | null
          id: string
          is_virtual: boolean | null
          lead_org_id: string | null
          location_city_ar: string | null
          location_city_en: string | null
          location_country_id: string | null
          member_count: number | null
          observer_count: number | null
          secretariat_org_id: string | null
          start_date: string | null
          venue_ar: string | null
          venue_en: string | null
        }
        Insert: {
          end_date?: string | null
          forum_type: string
          frequency?: string | null
          id: string
          is_virtual?: boolean | null
          lead_org_id?: string | null
          location_city_ar?: string | null
          location_city_en?: string | null
          location_country_id?: string | null
          member_count?: number | null
          observer_count?: number | null
          secretariat_org_id?: string | null
          start_date?: string | null
          venue_ar?: string | null
          venue_en?: string | null
        }
        Update: {
          end_date?: string | null
          forum_type?: string
          frequency?: string | null
          id?: string
          is_virtual?: boolean | null
          lead_org_id?: string | null
          location_city_ar?: string | null
          location_city_en?: string | null
          location_country_id?: string | null
          member_count?: number | null
          observer_count?: number | null
          secretariat_org_id?: string | null
          start_date?: string | null
          venue_ar?: string | null
          venue_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forums_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forums_lead_org_id_fkey"
            columns: ["lead_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forums_location_country_id_fkey"
            columns: ["location_country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forums_secretariat_org_id_fkey"
            columns: ["secretariat_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          acronym: string | null
          address_ar: string | null
          address_en: string | null
          dissolved_date: string | null
          email: string | null
          founded_date: string | null
          headquarters_city_ar: string | null
          headquarters_city_en: string | null
          headquarters_country_id: string | null
          id: string
          is_verified: boolean | null
          org_code: string | null
          org_type: string
          parent_org_id: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          acronym?: string | null
          address_ar?: string | null
          address_en?: string | null
          dissolved_date?: string | null
          email?: string | null
          founded_date?: string | null
          headquarters_city_ar?: string | null
          headquarters_city_en?: string | null
          headquarters_country_id?: string | null
          id: string
          is_verified?: boolean | null
          org_code?: string | null
          org_type: string
          parent_org_id?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          acronym?: string | null
          address_ar?: string | null
          address_en?: string | null
          dissolved_date?: string | null
          email?: string | null
          founded_date?: string | null
          headquarters_city_ar?: string | null
          headquarters_city_en?: string | null
          headquarters_country_id?: string | null
          id?: string
          is_verified?: boolean | null
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
      persons: {
        Row: {
          appointed_date: string | null
          biography_ar: string | null
          biography_en: string | null
          current_position_ar: string | null
          current_position_en: string | null
          date_of_birth: string | null
          email: string | null
          first_name_ar: string
          first_name_en: string
          full_name_ar: string | null
          full_name_en: string | null
          id: string
          is_vip: boolean | null
          last_name_ar: string
          last_name_en: string
          nationality_country_id: string | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          term_end_date: string | null
          title: string | null
          vip_level: number | null
        }
        Insert: {
          appointed_date?: string | null
          biography_ar?: string | null
          biography_en?: string | null
          current_position_ar?: string | null
          current_position_en?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name_ar: string
          first_name_en: string
          full_name_ar?: string | null
          full_name_en?: string | null
          id: string
          is_vip?: boolean | null
          last_name_ar: string
          last_name_en: string
          nationality_country_id?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          term_end_date?: string | null
          title?: string | null
          vip_level?: number | null
        }
        Update: {
          appointed_date?: string | null
          biography_ar?: string | null
          biography_en?: string | null
          current_position_ar?: string | null
          current_position_en?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name_ar?: string
          first_name_en?: string
          full_name_ar?: string | null
          full_name_en?: string | null
          id?: string
          is_vip?: boolean | null
          last_name_ar?: string
          last_name_en?: string
          nationality_country_id?: string | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          term_end_date?: string | null
          title?: string | null
          vip_level?: number | null
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
      themes: {
        Row: {
          end_date: string | null
          id: string
          is_active: boolean | null
          keywords_ar: string[] | null
          keywords_en: string[] | null
          parent_theme_id: string | null
          priority_level: number | null
          start_date: string | null
          theme_type: string
        }
        Insert: {
          end_date?: string | null
          id: string
          is_active?: boolean | null
          keywords_ar?: string[] | null
          keywords_en?: string[] | null
          parent_theme_id?: string | null
          priority_level?: number | null
          start_date?: string | null
          theme_type: string
        }
        Update: {
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          keywords_ar?: string[] | null
          keywords_en?: string[] | null
          parent_theme_id?: string | null
          priority_level?: number | null
          start_date?: string | null
          theme_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "themes_parent_theme_id_fkey"
            columns: ["parent_theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          color_mode: string
          created_at: string
          id: string
          language: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color_mode?: string
          created_at?: string
          id?: string
          language?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color_mode?: string
          created_at?: string
          id?: string
          language?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      working_groups: {
        Row: {
          deliverables_ar: string | null
          deliverables_en: string | null
          dissolved_date: string | null
          established_date: string | null
          id: string
          last_meeting_date: string | null
          lead_org_id: string | null
          mandate_ar: string | null
          mandate_en: string | null
          meeting_frequency: string | null
          member_count: number | null
          next_meeting_date: string | null
          secretariat_org_id: string | null
          wg_status: string
          wg_type: string
        }
        Insert: {
          deliverables_ar?: string | null
          deliverables_en?: string | null
          dissolved_date?: string | null
          established_date?: string | null
          id: string
          last_meeting_date?: string | null
          lead_org_id?: string | null
          mandate_ar?: string | null
          mandate_en?: string | null
          meeting_frequency?: string | null
          member_count?: number | null
          next_meeting_date?: string | null
          secretariat_org_id?: string | null
          wg_status?: string
          wg_type: string
        }
        Update: {
          deliverables_ar?: string | null
          deliverables_en?: string | null
          dissolved_date?: string | null
          established_date?: string | null
          id?: string
          last_meeting_date?: string | null
          lead_org_id?: string | null
          mandate_ar?: string | null
          mandate_en?: string | null
          meeting_frequency?: string | null
          member_count?: number | null
          next_meeting_date?: string | null
          secretariat_org_id?: string | null
          wg_status?: string
          wg_type?: string
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
          {
            foreignKeyName: "working_groups_secretariat_org_id_fkey"
            columns: ["secretariat_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clearance_level: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

A new version of Supabase CLI is available: v2.53.6 (currently installed v2.47.2)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
