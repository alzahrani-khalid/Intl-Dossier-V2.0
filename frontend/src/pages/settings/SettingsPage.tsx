import { useState, useCallback, useEffect } from 'react'
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
  mapCategoryPrefsToSettingsToggles,
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

function readLocalSettings(): Partial<LocalSettingsSubset> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as Partial<LocalSettingsSubset>) : {}
  } catch {
    return {}
  }
}

/**
 * Main Settings Page component
 * Provides a comprehensive settings management interface with multiple sections
 */
export function SettingsPage() {
  const { t, i18n } = useTranslation('settings')
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

      // Read only the real `users` columns (D-5). The prior code selected '*'
      // and read columns that do not exist (display_name, notifications_*, …) as
      // undefined, then fabricated values (display_name from the email, every
      // toggle `?? true`). Read the genuine stored values instead.
      const { data, error } = await supabase
        .from('users')
        .select(
          'full_name, job_title_en, department, phone, avatar_url, language_preference, timezone, mfa_enabled',
        )
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      // Notification toggles come from the shared category-preference table.
      const { data: catRows, error: catError } = await supabase
        .from('notification_category_preferences')
        .select('*')
        .eq('user_id', user.id)
      if (catError && catError.code !== 'PGRST116') throw catError
      const toggles = mapCategoryPrefsToSettingsToggles(catRows as CategoryPreference[] | null)

      // Local-only prefs (no server column exists — see writeLocalSettings).
      const local = readLocalSettings()

      return {
        ...defaultUserSettings,
        ...local,
        // Real `users` columns — genuine stored values, no fabrication:
        display_name: data?.full_name ?? '',
        job_title: data?.job_title_en ?? null,
        department: data?.department ?? null,
        phone: data?.phone ?? null,
        avatar_url: data?.avatar_url ?? null,
        language_preference:
          (data?.language_preference as 'en' | 'ar' | null) ??
          (i18n.language === 'ar' ? 'ar' : 'en'),
        timezone: data?.timezone ?? 'UTC',
        mfa_enabled: data?.mfa_enabled ?? false,
        // Notification toggles from the category-preference table:
        ...toggles,
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

  // Apply the persisted accessibility prefs to the document on load (D-5) so the
  // localStorage-backed toggles take effect on reload, not only after a save.
  useEffect(() => {
    if (settings) applyAccessibilitySettings(settings)
  }, [settings, applyAccessibilitySettings])

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
