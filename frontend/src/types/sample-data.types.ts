/**
 * Sample Data Types
 * Types for the sample data population feature
 */

export interface SampleDataTemplate {
  id: string
  slug: string
  name_en: string
  name_ar: string
  description_en: string
  description_ar: string
  icon: string
  color: string
  sort_order: number
}

export interface SampleDataInstance {
  id: string
  populated_at: string
  template: {
    slug: string
    name_en: string
    name_ar: string
    icon: string
    color: string
  }
  counts: {
    dossiers: number
    relationships: number
    events: number
    contacts: number
  }
}

export interface SampleDataStatus {
  has_sample_data: boolean
  instances: SampleDataInstance[]
}

export interface PopulateSampleDataResponse {
  success: boolean
  instance_id: string
  populated_at: string
  template: {
    slug: string
    name_en: string
    name_ar: string
  }
  counts: {
    dossiers: number
    relationships: number
    events: number
    contacts: number
  }
  message_en: string
  message_ar: string
}

export interface RemoveSampleDataResponse {
  success: boolean
  removed: {
    dossiers: number
    relationships: number
    events: number
    contacts: number
  }
  message_en: string
  message_ar: string
}

// D-58-06-A-18: 3 template-color lookups (templateColors, templateIconColors,
// templateBannerColors). Same 4-color palette across all three. D-07 collision
// (blue + purple): blue → accent, purple → secondary. emerald → success,
// red → destructive.
export const templateColors: Record<string, string> = {
  emerald: 'bg-success/10 text-success border-success/20 dark:bg-success/30 dark:border-success/80',
  purple:
    'bg-secondary/10 text-secondary-foreground border-secondary/20 dark:bg-secondary/30 dark:border-secondary/80',
  red: 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/30 dark:border-destructive/80',
  blue: 'bg-accent/10 text-accent border-accent/20 dark:bg-accent/30 dark:border-accent/80',
}

export const templateIconColors: Record<string, string> = {
  emerald: 'text-success',
  purple: 'text-secondary-foreground',
  red: 'text-destructive',
  blue: 'text-accent',
}

export const templateBannerColors: Record<string, string> = {
  emerald: 'bg-success/5 border-success/20 dark:bg-success/30 dark:border-success/80',
  purple: 'bg-secondary/5 border-secondary/20 dark:bg-secondary/30 dark:border-secondary/80',
  red: 'bg-destructive/5 border-destructive/20 dark:bg-destructive/30 dark:border-destructive/80',
  blue: 'bg-accent/5 border-accent/20 dark:bg-accent/30 dark:border-accent/80',
}
