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
      // ... (rest of the types continue as generated)
    }
    Enums: {
      activity_type:
        | "meeting"
        | "mission"
        | "conference"
        | "workshop"
        | "phone_call"
        | "email_exchange"
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
      contact_level:
        | "minister"
        | "director"
        | "head"
        | "manager"
        | "specialist"
        | "other"
      deliverable_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "delayed"
        | "at_risk"
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
      intelligence_type:
        | "trend"
        | "opportunity"
        | "risk"
        | "best_practice"
        | "news"
      language_proficiency: "native" | "fluent" | "professional" | "basic"
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
      mou_type: "bilateral" | "multilateral" | "framework" | "technical"
      organization_type:
        | "un_agency"
        | "regional"
        | "development_bank"
        | "research"
        | "other"
      participation_level: "active" | "occasional" | "observer"
      priority_level: "critical" | "high" | "medium" | "low"
      relationship_status: "active" | "developing" | "dormant"
      relationship_type:
        | "bilateral"
        | "multilateral"
        | "membership"
        | "partnership"
      reporting_frequency: "annual" | "quarterly" | "monthly" | "ad_hoc"
      retention_category:
        | "permanent"
        | "long_term"
        | "medium_term"
        | "temporary"
      statistical_system_type: "centralized" | "decentralized" | "hybrid"
      task_status: "pending" | "in_progress" | "blocked" | "completed" | "cancelled"
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
      urgent_priority: "urgent" | "high" | "medium" | "low"
      workspace_type: "project" | "committee" | "initiative" | "temporary"
    }
  }
}