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

export type TemplateSlug =
  | 'trade-relations'
  | 'cultural-exchange'
  | 'security-cooperation'
  | 'diplomatic-relations'

// Color mapping for templates
export const templateColors: Record<string, string> = {
  emerald:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  purple:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
}

export const templateIconColors: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  purple: 'text-purple-600 dark:text-purple-400',
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
}

export const templateBannerColors: Record<string, string> = {
  emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800',
  purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950/50 dark:border-purple-800',
  red: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800',
}
