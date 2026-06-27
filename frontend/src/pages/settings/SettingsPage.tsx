import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { switchLanguage } from '@/i18n'
import { useMode } from '@/design-system/hooks/useMode'
import {
  applySettingsTogglesToCategoryPrefs,
  type CategoryPreference,
  type SettingsNotificationToggles,
} from '@/hooks/useNotificationCenter'
import {
  SettingsLayout,
  SettingsSectionWrapper,
  SettingsSectionSkeleton,
  ProfileSettingsSection,
  GeneralSettingsSection,
  AppearanceSettingsSection,
  NotificationsSettingsSection,
  SecuritySettingsSection,
  AccessibilitySettingsSection,
  DataPrivacySettingsSection,
} from '@/components/settings'
import { EmailDigestSettings } from '@/components/email/EmailDigestSettings'
import { BotIntegrationsSettings } from '@/components/settings/BotIntegrationsSettings'
import { SettingsSectionId, defaultUserSettings } from '@/types/settings.types'

/**
 * Settings form schema
 */
const settingsSchema = z.object({
  // Profile
  display_name: z.string().min(1).max(100),
  job_title: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(200).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),

  // General
  language_preference: z.enum(['en', 'ar']),
  timezone: z.string(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  start_of_week: z.enum(['sunday', 'monday', 'saturday']),

  // Appearance
  color_mode: z.enum(['light', 'dark', 'system']),
  theme: z.enum(['chancery', 'situation', 'ministerial', 'bureau']),
  // WR-07: 42-03 R-03 renamed the third density value from 'spacious' to 'dense'.
  // The DesignProvider migration shim only reads localStorage, so persisting
  // 'spacious' to the DB would survive the migration forever.
  display_density: z.enum(['compact', 'comfortable', 'dense']),

  // Notifications
  notifications_push: z.boolean(),
  notifications_email: z.boolean(),
  notifications_mou_expiry: z.boolean(),
  notifications_event_reminders: z.boolean(),
  notifications_report_generation: z.boolean(),
  notifications_assignment_updates: z.boolean(),
  notifications_commitment_deadlines: z.boolean(),
  notifications_mentions: z.boolean(),

  // Accessibility
  high_contrast: z.boolean(),
  large_text: z.boolean(),
  reduce_motion: z.boolean(),
  keyboard_only: z.boolean(),
  focus_indicators: z.enum(['default', 'enhanced', 'none']),
  screen_reader: z.boolean(),

  // Security
  mfa_enabled: z.boolean(),
  session_timeout: z.number().min(5).max(480),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

/**
 * Local-only settings (D-4). These have NO column in `public.users`:
 * accessibility prefs, bio, date_format, start_of_week, session_timeout.
 * Server-side persistence for them is a separate, out-of-scope decision, so
 * they are kept in localStorage (durable per-browser) rather than upserted to
 * phantom columns. Appearance is handled separately by DesignProvider.
 */
const LOCAL_SETTINGS_KEY = 'id.settings.local'

type LocalSettingsSubset = Pick<
  SettingsFormValues,
  | 'bio'
  | 'date_format'
  | 'start_of_week'
  | 'session_timeout'
  | 'high_contrast'
  | 'large_text'
  | 'reduce_motion'
  | 'keyboard_only'
  | 'focus_indicators'
  | 'screen_reader'
>

function writeLocalSettings(values: LocalSettingsSubset): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(values))
  } catch {
    // localStorage unavailable (private mode / quota) — non-fatal.
  }
}

/**
 * Main Settings Page component
 * Provides a comprehensive settings management interface with multiple sections
 */
export function SettingsPage() {
  const { t } = useTranslation('settings')
  const { user } = useAuthStore()
  const { setMode: setColorMode } = useMode()
  const queryClient = useQueryClient()

  // Active section state
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('profile')

  // Fetch current user settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      // Row doesn't exist yet — return defaults, form will create on first save
      if (data === null) {
        return defaultUserSettings as SettingsFormValues
      }

      // Map database fields to form fields with defaults
      return {
        // Profile
        display_name: data.display_name || data.email?.split('@')[0] || '',
        job_title: data.job_title || null,
        department: data.department || null,
        phone: data.phone || null,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,

        // General
        language_preference: data.language_preference || 'en',
        timezone: data.timezone || 'UTC',
        date_format: data.date_format || 'DD/MM/YYYY',
        start_of_week: data.start_of_week || 'sunday',

        // Appearance
        color_mode: data.color_mode || 'system',
        theme: data.theme || 'chancery',
        display_density: data.display_density || 'comfortable',

        // Notifications
        notifications_push: data.notifications_push ?? true,
        notifications_email: data.notifications_email ?? true,
        notifications_mou_expiry: data.notifications_mou_expiry ?? true,
        notifications_event_reminders: data.notifications_event_reminders ?? true,
        notifications_report_generation: data.notifications_report_generation ?? true,
        notifications_assignment_updates: data.notifications_assignment_updates ?? true,
        notifications_commitment_deadlines: data.notifications_commitment_deadlines ?? true,
        notifications_mentions: data.notifications_mentions ?? true,

        // Accessibility
        high_contrast: data.high_contrast ?? false,
        large_text: data.large_text ?? false,
        reduce_motion: data.reduce_motion ?? false,
        keyboard_only: data.keyboard_only ?? false,
        focus_indicators: data.focus_indicators || 'default',
        screen_reader: data.screen_reader ?? false,

        // Security
        mfa_enabled: data.mfa_enabled ?? false,
        session_timeout: data.session_timeout ?? 30,
      } as SettingsFormValues
    },
    enabled: !!user?.id,
  })

  // Initialize form with fetched settings
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultUserSettings as SettingsFormValues,
    values: settings,
  })

  const hasChanges = form.formState.isDirty

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!user?.id) throw new Error('Not authenticated')

      // 1) Persist ONLY real `users` columns (profile + general). The prior
      //    upsert sent ~23 columns absent from the table, so PostgREST rejected
      //    the whole write (PGRST204) and every Save silently no-oped.
      //    `mfa_enabled` is intentionally NOT written here (D-6 — no enablement
      //    without a verified secret). Appearance is owned by DesignProvider.
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        full_name: values.display_name,
        job_title_en: values.job_title ?? null,
        department: values.department ?? null,
        phone: values.phone ?? null,
        avatar_url: values.avatar_url ?? null,
        language_preference: values.language_preference,
        timezone: values.timezone,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // 2) Route the 8 notification toggles to the shared
      //    `notification_category_preferences` table (the surface the
      //    Notifications page uses) via the D-30 bridge. Read-modify-write so
      //    channels a user set on the Notifications page are preserved.
      const toggles: SettingsNotificationToggles = {
        notifications_push: values.notifications_push,
        notifications_email: values.notifications_email,
        notifications_mou_expiry: values.notifications_mou_expiry,
        notifications_event_reminders: values.notifications_event_reminders,
        notifications_report_generation: values.notifications_report_generation,
        notifications_assignment_updates: values.notifications_assignment_updates,
        notifications_commitment_deadlines: values.notifications_commitment_deadlines,
        notifications_mentions: values.notifications_mentions,
      }
      const { data: existingPrefs, error: prefsReadError } = await supabase
        .from('notification_category_preferences')
        .select('*')
        .eq('user_id', user.id)
      if (prefsReadError && prefsReadError.code !== 'PGRST116') throw prefsReadError

      const prefRows = applySettingsTogglesToCategoryPrefs(
        toggles,
        existingPrefs as CategoryPreference[] | null,
      )
      for (const pref of prefRows) {
        const { error: prefError } = await supabase
          .from('notification_category_preferences')
          .upsert(
            {
              user_id: user.id,
              category: pref.category,
              email_enabled: pref.email_enabled,
              push_enabled: pref.push_enabled,
              in_app_enabled: pref.in_app_enabled,
              sms_enabled: pref.sms_enabled,
              sound_enabled: pref.sound_enabled,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,category' },
          )
        if (prefError) throw prefError
      }

      // 3) Persist local-only prefs (no server column exists for these).
      writeLocalSettings({
        bio: values.bio ?? null,
        date_format: values.date_format,
        start_of_week: values.start_of_week,
        session_timeout: values.session_timeout,
        high_contrast: values.high_contrast,
        large_text: values.large_text,
        reduce_motion: values.reduce_motion,
        keyboard_only: values.keyboard_only,
        focus_indicators: values.focus_indicators,
        screen_reader: values.screen_reader,
      })

      return values
    },
    onSuccess: async (values) => {
      // Apply language change if needed
      if (values.language_preference !== settings?.language_preference) {
        await switchLanguage(values.language_preference)
      }

      // Apply color mode change — DesignProvider tracks only 'light' | 'dark',
      // so resolve 'system' against the user's OS preference here.
      if (values.color_mode !== settings?.color_mode) {
        const resolved: 'light' | 'dark' =
          values.color_mode === 'system'
            ? typeof window !== 'undefined' &&
              window.matchMedia?.('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : values.color_mode
        setColorMode(resolved)
      }

      // Apply accessibility settings
      applyAccessibilitySettings(values)

      // Invalidate and reset form (also refresh the Notifications page cache so
      // both surfaces agree on the category preferences just written).
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      form.reset(values)

      toast.success(t('savedSuccessfully'))
    },
    onError: (error: unknown) => {
      const detail = error instanceof Error ? error.message : null
      console.error(error)
      toast.error(t('saveError'), {
        description: detail ?? undefined,
      })
    },
  })

  // Apply accessibility settings to document
  const applyAccessibilitySettings = useCallback((values: SettingsFormValues) => {
    const root = document.documentElement

    // High contrast
    root.classList.toggle('high-contrast', values.high_contrast)

    // Large text
    root.classList.toggle('large-text', values.large_text)

    // Reduce motion
    root.classList.toggle('reduce-motion', values.reduce_motion)

    // Focus indicators
    root.dataset.focusIndicators = values.focus_indicators
  }, [])

  // Handle save
  const handleSave = useCallback(() => {
    void form.handleSubmit((values) => {
      saveMutation.mutate(values)
    })()
  }, [form, saveMutation])

  // Handle section change
  const handleSectionChange = useCallback((section: SettingsSectionId) => {
    setActiveSection(section)
  }, [])

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      isLoading={isLoading}
      hasChanges={hasChanges}
      isSaving={saveMutation.isPending}
      onSave={handleSave}
    >
      {isLoading ? (
        <SettingsSectionSkeleton />
      ) : (
        <>
          {/* Profile Section */}
          <SettingsSectionWrapper sectionId="profile" activeSection={activeSection}>
            <ProfileSettingsSection form={form} email={user?.email} />
          </SettingsSectionWrapper>

          {/* General Section */}
          <SettingsSectionWrapper sectionId="general" activeSection={activeSection}>
            <GeneralSettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Appearance Section */}
          <SettingsSectionWrapper sectionId="appearance" activeSection={activeSection}>
            <AppearanceSettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Notifications Section */}
          <SettingsSectionWrapper sectionId="notifications" activeSection={activeSection}>
            <NotificationsSettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Email Digest Section - Using existing component */}
          <SettingsSectionWrapper sectionId="email-digest" activeSection={activeSection}>
            <EmailDigestSettings />
          </SettingsSectionWrapper>

          {/* Integrations Section - Using existing component */}
          <SettingsSectionWrapper sectionId="integrations" activeSection={activeSection}>
            <BotIntegrationsSettings />
          </SettingsSectionWrapper>

          {/* Accessibility Section */}
          <SettingsSectionWrapper sectionId="accessibility" activeSection={activeSection}>
            <AccessibilitySettingsSection form={form} />
          </SettingsSectionWrapper>

          {/* Data & Privacy Section */}
          <SettingsSectionWrapper sectionId="data-privacy" activeSection={activeSection}>
            <DataPrivacySettingsSection />
          </SettingsSectionWrapper>

          {/* Security Section */}
          <SettingsSectionWrapper sectionId="security" activeSection={activeSection}>
            <SecuritySettingsSection form={form} />
          </SettingsSectionWrapper>
        </>
      )}
    </SettingsLayout>
  )
}
