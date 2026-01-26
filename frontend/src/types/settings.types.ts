import { z } from 'zod'

/**
 * Settings Section IDs
 */
export type SettingsSectionId =
  | 'profile'
  | 'general'
  | 'appearance'
  | 'notifications'
  | 'email-digest'
  | 'integrations'
  | 'accessibility'
  | 'data-privacy'
  | 'security'

/**
 * Color modes
 */
export type ColorMode = 'light' | 'dark' | 'system'

/**
 * Theme options
 */
export type ThemeName = 'canvas' | 'ocean' | 'sunset'

/**
 * Display density options
 */
export type DisplayDensity = 'compact' | 'comfortable' | 'spacious'

/**
 * Focus indicator style options
 */
export type FocusIndicatorStyle = 'default' | 'enhanced' | 'none'

/**
 * Date format options
 */
export type DateFormatOption = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

/**
 * Start of week options
 */
export type StartOfWeek = 'sunday' | 'monday' | 'saturday'

/**
 * Profile settings schema
 */
export const profileSettingsSchema = z.object({
  display_name: z.string().min(1).max(100),
  job_title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(200).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

export type ProfileSettings = z.infer<typeof profileSettingsSchema>

/**
 * General settings schema
 */
export const generalSettingsSchema = z.object({
  language_preference: z.enum(['en', 'ar']),
  timezone: z.string(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  start_of_week: z.enum(['sunday', 'monday', 'saturday']),
})

export type GeneralSettings = z.infer<typeof generalSettingsSchema>

/**
 * Appearance settings schema
 */
export const appearanceSettingsSchema = z.object({
  color_mode: z.enum(['light', 'dark', 'system']),
  theme: z.enum(['canvas', 'ocean', 'sunset']),
  display_density: z.enum(['compact', 'comfortable', 'spacious']),
})

export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>

/**
 * Notification settings schema
 */
export const notificationSettingsSchema = z.object({
  notifications_push: z.boolean(),
  notifications_email: z.boolean(),
  notifications_mou_expiry: z.boolean(),
  notifications_event_reminders: z.boolean(),
  notifications_report_generation: z.boolean(),
  notifications_assignment_updates: z.boolean(),
  notifications_commitment_deadlines: z.boolean(),
  notifications_mentions: z.boolean(),
})

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

/**
 * Accessibility settings schema
 */
export const accessibilitySettingsSchema = z.object({
  high_contrast: z.boolean(),
  large_text: z.boolean(),
  reduce_motion: z.boolean(),
  keyboard_only: z.boolean(),
  focus_indicators: z.enum(['default', 'enhanced', 'none']),
  screen_reader: z.boolean(),
})

export type AccessibilitySettings = z.infer<typeof accessibilitySettingsSchema>

/**
 * Security settings schema
 */
export const securitySettingsSchema = z.object({
  mfa_enabled: z.boolean(),
  session_timeout: z.number().min(5).max(480),
})

export type SecuritySettings = z.infer<typeof securitySettingsSchema>

/**
 * Combined user settings type
 */
export interface UserSettings {
  // Profile
  display_name: string
  job_title?: string
  department?: string
  phone?: string
  bio?: string
  avatar_url?: string | null

  // General
  language_preference: 'en' | 'ar'
  timezone: string
  date_format: DateFormatOption
  start_of_week: StartOfWeek

  // Appearance
  color_mode: ColorMode
  theme: ThemeName
  display_density: DisplayDensity

  // Notifications
  notifications_push: boolean
  notifications_email: boolean
  notifications_mou_expiry: boolean
  notifications_event_reminders: boolean
  notifications_report_generation: boolean
  notifications_assignment_updates: boolean
  notifications_commitment_deadlines: boolean
  notifications_mentions: boolean

  // Accessibility
  high_contrast: boolean
  large_text: boolean
  reduce_motion: boolean
  keyboard_only: boolean
  focus_indicators: FocusIndicatorStyle
  screen_reader: boolean

  // Security
  mfa_enabled: boolean
  session_timeout: number
}

/**
 * Settings section navigation item
 */
export interface SettingsNavItem {
  id: SettingsSectionId
  labelKey: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

/**
 * Timezone option
 */
export interface TimezoneOption {
  value: string
  label: string
  offset: string
}

/**
 * Active session info
 */
export interface ActiveSession {
  id: string
  device: string
  browser: string
  ip_address: string
  location?: string
  last_active: string
  is_current: boolean
}

/**
 * Default settings values
 */
export const defaultUserSettings: UserSettings = {
  // Profile
  display_name: '',
  job_title: undefined,
  department: undefined,
  phone: undefined,
  bio: undefined,
  avatar_url: null,

  // General
  language_preference: 'en',
  timezone: 'UTC',
  date_format: 'DD/MM/YYYY',
  start_of_week: 'sunday',

  // Appearance
  color_mode: 'system',
  theme: 'canvas',
  display_density: 'comfortable',

  // Notifications
  notifications_push: true,
  notifications_email: true,
  notifications_mou_expiry: true,
  notifications_event_reminders: true,
  notifications_report_generation: true,
  notifications_assignment_updates: true,
  notifications_commitment_deadlines: true,
  notifications_mentions: true,

  // Accessibility
  high_contrast: false,
  large_text: false,
  reduce_motion: false,
  keyboard_only: false,
  focus_indicators: 'default',
  screen_reader: false,

  // Security
  mfa_enabled: false,
  session_timeout: 30,
}

/**
 * Timezone options list
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC', offset: '+00:00' },
  { value: 'Asia/Riyadh', label: 'Riyadh', offset: '+03:00' },
  { value: 'Asia/Dubai', label: 'Dubai', offset: '+04:00' },
  { value: 'Africa/Cairo', label: 'Cairo', offset: '+02:00' },
  { value: 'Europe/London', label: 'London', offset: '+00:00' },
  { value: 'America/New_York', label: 'New York', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
]

/**
 * Session timeout options (in minutes)
 */
export const SESSION_TIMEOUT_OPTIONS = [
  { value: 15, labelKey: 'minutes' },
  { value: 30, labelKey: 'minutes' },
  { value: 60, labelKey: 'hour' },
  { value: 120, labelKey: 'hours' },
  { value: 480, labelKey: 'hours' },
]
