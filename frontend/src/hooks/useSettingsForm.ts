import { useCallback, useEffect } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { switchLanguage } from '@/i18n'
import { useTheme } from '@/hooks/use-theme'
import { defaultUserSettings } from '@/types/settings.types'

/**
 * Combined settings schema
 */
const userSettingsSchema = z.object({
  // Profile
  display_name: z.string().min(1).max(100),
  job_title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(200).optional(),
  avatar_url: z.string().url().optional().nullable(),

  // General
  language_preference: z.enum(['en', 'ar']),
  timezone: z.string(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  start_of_week: z.enum(['sunday', 'monday', 'saturday']),

  // Appearance
  color_mode: z.enum(['light', 'dark', 'system']),
  theme: z.enum(['canvas', 'ocean', 'sunset']),
  display_density: z.enum(['compact', 'comfortable', 'spacious']),

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

type FormValues = z.infer<typeof userSettingsSchema>

interface UseSettingsFormReturn {
  form: UseFormReturn<FormValues>
  isLoading: boolean
  isSaving: boolean
  hasChanges: boolean
  saveSettings: () => void
  resetForm: () => void
  updateField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void
}

/**
 * Hook for managing settings form state and persistence
 */
export function useSettingsForm(): UseSettingsFormReturn {
  const { t } = useTranslation('settings')
  const { user } = useAuthStore()
  const { setColorMode } = useTheme()
  const queryClient = useQueryClient()

  // Fetch current settings from Supabase
  const { data: settings, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single()

      if (error) throw error

      // Map database fields to form fields
      return {
        // Profile
        display_name: data.display_name || data.email?.split('@')[0] || '',
        job_title: data.job_title || undefined,
        department: data.department || undefined,
        phone: data.phone || undefined,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || null,

        // General
        language_preference: data.language_preference || 'en',
        timezone: data.timezone || 'UTC',
        date_format: data.date_format || 'DD/MM/YYYY',
        start_of_week: data.start_of_week || 'sunday',

        // Appearance
        color_mode: data.color_mode || 'system',
        theme: data.theme || 'canvas',
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
      } as FormValues
    },
    enabled: !!user?.id,
  })

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: defaultUserSettings as FormValues,
    values: settings,
  })

  // Track if form has unsaved changes
  const hasChanges = form.formState.isDirty

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({
          // Profile
          display_name: values.display_name,
          job_title: values.job_title,
          department: values.department,
          phone: values.phone,
          bio: values.bio,
          avatar_url: values.avatar_url,

          // General
          language_preference: values.language_preference,
          timezone: values.timezone,
          date_format: values.date_format,
          start_of_week: values.start_of_week,

          // Appearance
          color_mode: values.color_mode,
          theme: values.theme,
          display_density: values.display_density,

          // Notifications
          notifications_push: values.notifications_push,
          notifications_email: values.notifications_email,
          notifications_mou_expiry: values.notifications_mou_expiry,
          notifications_event_reminders: values.notifications_event_reminders,
          notifications_report_generation: values.notifications_report_generation,
          notifications_assignment_updates: values.notifications_assignment_updates,
          notifications_commitment_deadlines: values.notifications_commitment_deadlines,
          notifications_mentions: values.notifications_mentions,

          // Accessibility
          high_contrast: values.high_contrast,
          large_text: values.large_text,
          reduce_motion: values.reduce_motion,
          keyboard_only: values.keyboard_only,
          focus_indicators: values.focus_indicators,
          screen_reader: values.screen_reader,

          // Security
          mfa_enabled: values.mfa_enabled,
          session_timeout: values.session_timeout,

          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      return values
    },
    onSuccess: async (values) => {
      // Apply language change
      if (values.language_preference !== settings?.language_preference) {
        await switchLanguage(values.language_preference)
      }

      // Apply theme changes
      if (values.color_mode !== settings?.color_mode) {
        // Map 'system' to the actual system preference
        const effectiveMode =
          values.color_mode === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : values.color_mode
        setColorMode(effectiveMode as 'light' | 'dark')
      }

      // Apply accessibility settings
      applyAccessibilitySettings(values)

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })

      // Reset form dirty state
      form.reset(values)

      toast.success(t('savedSuccessfully'))
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  // Apply accessibility settings to document
  const applyAccessibilitySettings = useCallback((values: FormValues) => {
    const root = document.documentElement

    // High contrast
    if (values.high_contrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Large text
    if (values.large_text) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    // Reduce motion
    if (values.reduce_motion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Focus indicators
    root.dataset.focusIndicators = values.focus_indicators
  }, [])

  // Apply accessibility settings on load
  useEffect(() => {
    if (settings) {
      applyAccessibilitySettings(settings)
    }
  }, [settings, applyAccessibilitySettings])

  // Save handler
  const saveSettings = useCallback(() => {
    form.handleSubmit((values) => {
      saveMutation.mutate(values)
    })()
  }, [form, saveMutation])

  // Reset handler
  const resetForm = useCallback(() => {
    if (settings) {
      form.reset(settings)
    }
  }, [form, settings])

  // Update single field
  const updateField = useCallback(
    <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValue(field, value as any, { shouldDirty: true })
    },
    [form],
  )

  return {
    form,
    isLoading,
    isSaving: saveMutation.isPending,
    hasChanges,
    saveSettings,
    resetForm,
    updateField,
  }
}

/**
 * Hook for profile settings section
 */
export function useProfileSettings() {
  const { form, ...rest } = useSettingsForm()

  const profileValues = {
    display_name: form.watch('display_name'),
    job_title: form.watch('job_title'),
    department: form.watch('department'),
    phone: form.watch('phone'),
    bio: form.watch('bio'),
    avatar_url: form.watch('avatar_url'),
  }

  return { form, profileValues, ...rest }
}

/**
 * Hook for general settings section
 */
export function useGeneralSettings() {
  const { form, ...rest } = useSettingsForm()

  const generalValues = {
    language_preference: form.watch('language_preference'),
    timezone: form.watch('timezone'),
    date_format: form.watch('date_format'),
    start_of_week: form.watch('start_of_week'),
  }

  return { form, generalValues, ...rest }
}

/**
 * Hook for appearance settings section
 */
export function useAppearanceSettings() {
  const { form, ...rest } = useSettingsForm()

  const appearanceValues = {
    color_mode: form.watch('color_mode'),
    theme: form.watch('theme'),
    display_density: form.watch('display_density'),
  }

  return { form, appearanceValues, ...rest }
}

/**
 * Hook for notification settings section
 */
export function useNotificationSettings() {
  const { form, ...rest } = useSettingsForm()

  const notificationValues = {
    notifications_push: form.watch('notifications_push'),
    notifications_email: form.watch('notifications_email'),
    notifications_mou_expiry: form.watch('notifications_mou_expiry'),
    notifications_event_reminders: form.watch('notifications_event_reminders'),
    notifications_report_generation: form.watch('notifications_report_generation'),
    notifications_assignment_updates: form.watch('notifications_assignment_updates'),
    notifications_commitment_deadlines: form.watch('notifications_commitment_deadlines'),
    notifications_mentions: form.watch('notifications_mentions'),
  }

  return { form, notificationValues, ...rest }
}

/**
 * Hook for accessibility settings section
 */
export function useAccessibilitySettings() {
  const { form, ...rest } = useSettingsForm()

  const accessibilityValues = {
    high_contrast: form.watch('high_contrast'),
    large_text: form.watch('large_text'),
    reduce_motion: form.watch('reduce_motion'),
    keyboard_only: form.watch('keyboard_only'),
    focus_indicators: form.watch('focus_indicators'),
    screen_reader: form.watch('screen_reader'),
  }

  return { form, accessibilityValues, ...rest }
}

/**
 * Hook for security settings section
 */
export function useSecuritySettings() {
  const { form, ...rest } = useSettingsForm()

  const securityValues = {
    mfa_enabled: form.watch('mfa_enabled'),
    session_timeout: form.watch('session_timeout'),
  }

  return { form, securityValues, ...rest }
}
