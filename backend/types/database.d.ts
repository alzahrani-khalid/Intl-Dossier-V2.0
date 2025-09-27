// Minimal Supabase types placeholder to satisfy compile-time imports from services.
// Replace with generated types (e.g., supabase gen types) when available.

export type Json = any;

export interface Database {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Views: Record<string, { Row: any }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
  };
}

declare module '../../types/database' {
  export type Json = any;
  export interface Database {
    public: {
      Tables: Record<string, { Row: any; Insert: any; Update: any }>;
      Views: Record<string, { Row: any }>;
      Functions: Record<string, unknown>;
      Enums: Record<string, string>;
    };
  }
}

