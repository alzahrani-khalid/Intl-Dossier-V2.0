import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// Types
export interface ReportSchedule {
  id: string
  report_id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  timezone: string
  day_of_week?: number
  day_of_month?: number
  export_format: string
  language: 'en' | 'ar' | 'both'
  recipients: string[]
  is_active: boolean
  is_shared: boolean
  next_run_at?: string
  last_run_at?: string
  last_run_status?: string
  consecutive_failures: number
  max_consecutive_failures: number
  paused_at?: string
  pause_reason?: string
  created_by: string
  created_at: string
  updated_at: string
  // Relations
  report?: {
    id: string
    name: string
    name_ar?: string
  }
}

export interface ScheduleRecipient {
  id: string
  schedule_id: string
  user_id?: string
  external_email?: string
  external_name?: string
  delivery_channels: ('email' | 'in_app' | 'slack' | 'teams')[]
  preferred_format: 'pdf' | 'excel' | 'csv' | 'json'
  preferred_language: 'en' | 'ar'
  is_active: boolean
  unsubscribed_at?: string
  created_at: string
  updated_at: string
  // Relations
  user?: {
    id: string
    full_name?: string
    email: string
  }
}

export interface DeliveryCondition {
  id: string
  schedule_id: string
  field_path: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'not_contains'
    | 'is_empty'
    | 'is_not_empty'
  value?: string
  is_required: boolean
  fail_message?: string
  fail_message_ar?: string
  evaluation_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReportExecution {
  id: string
  report_id: string
  schedule_id?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  total_recipients: number
  successful_deliveries: number
  failed_deliveries: number
  skipped_deliveries: number
  conditions_met?: boolean
  conditions_result?: Record<string, unknown>
  error_message?: string
  trigger_type: 'scheduled' | 'manual' | 'api'
  executed_by?: string
  created_at: string
  completed_at?: string
}

export interface CreateScheduleInput {
  report_id: string
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  timezone: string
  day_of_week?: number
  day_of_month?: number
  export_format: string
  language?: 'en' | 'ar' | 'both'
  recipients?: string[]
  is_active?: boolean
  is_shared?: boolean
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string
}

// Query Keys
const QUERY_KEYS = {
  schedules: ['scheduled-reports'] as const,
  schedule: (id: string) => ['scheduled-reports', id] as const,
  recipients: (scheduleId: string) => ['scheduled-reports', scheduleId, 'recipients'] as const,
  conditions: (scheduleId: string) => ['scheduled-reports', scheduleId, 'conditions'] as const,
  executions: (scheduleId: string) => ['scheduled-reports', scheduleId, 'executions'] as const,
  reports: ['custom-reports'] as const,
}

// Hook: Get all schedules
export function useScheduledReports() {
  const { user } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.schedules,
    queryFn: async () => {
      // Note: We don't join with custom_reports here due to RLS infinite recursion
      // The report name can be fetched separately if needed
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ReportSchedule[]
    },
    enabled: !!user,
  })
}

// Hook: Get single schedule
export function useScheduledReport(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.schedule(id),
    queryFn: async () => {
      // Note: We don't join with custom_reports here due to RLS infinite recursion
      const { data, error } = await supabase
        .from('report_schedules')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ReportSchedule
    },
    enabled: !!id,
  })
}

// Hook: Get recipients for a schedule
export function useScheduleRecipients(scheduleId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.recipients(scheduleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_schedule_recipients')
        .select(
          `
          *,
          user:users(id, full_name, email)
        `,
        )
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ScheduleRecipient[]
    },
    enabled: !!scheduleId,
  })
}

// Hook: Get conditions for a schedule
export function useScheduleConditions(scheduleId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.conditions(scheduleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_delivery_conditions')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('evaluation_order', { ascending: true })

      if (error) throw error
      return data as DeliveryCondition[]
    },
    enabled: !!scheduleId,
  })
}

// Hook: Get execution history for a schedule
export function useScheduleExecutions(scheduleId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.executions(scheduleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_executions')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as ReportExecution[]
    },
    enabled: !!scheduleId,
  })
}

// Hook: Get available reports for scheduling
export function useAvailableReports() {
  const { user } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.reports,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_reports')
        .select('id, name, name_ar, description, description_ar')
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

// Hook: Create schedule
export function useCreateSchedule() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as ReportSchedule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules })
    },
  })
}

// Hook: Update schedule
export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateScheduleInput) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ReportSchedule
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule(data.id) })
    },
  })
}

// Hook: Delete schedule
export function useDeleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('report_schedules').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules })
    },
  })
}

// Hook: Toggle schedule active status
export function useToggleScheduleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('report_schedules')
        .update({
          is_active,
          paused_at: is_active ? null : new Date().toISOString(),
          pause_reason: is_active ? null : 'Manually paused',
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ReportSchedule
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedules })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule(data.id) })
    },
  })
}

// Hook: Run schedule now (manual trigger)
export function useRunScheduleNow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { data, error } = await supabase.functions.invoke('scheduled-report-processor', {
        body: {
          schedule_id: scheduleId,
          trigger_type: 'manual',
        },
      })

      if (error) throw error
      return data
    },
    onSuccess: (_, scheduleId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule(scheduleId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.executions(scheduleId) })
    },
  })
}

// Hook: Add recipient
export function useAddRecipient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<ScheduleRecipient, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('report_schedule_recipients')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as ScheduleRecipient
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recipients(data.schedule_id) })
    },
  })
}

// Hook: Update recipient
export function useUpdateRecipient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ScheduleRecipient> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_schedule_recipients')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ScheduleRecipient
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recipients(data.schedule_id) })
    },
  })
}

// Hook: Remove recipient
export function useRemoveRecipient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, scheduleId }: { id: string; scheduleId: string }) => {
      const { error } = await supabase.from('report_schedule_recipients').delete().eq('id', id)

      if (error) throw error
      return scheduleId
    },
    onSuccess: (scheduleId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recipients(scheduleId) })
    },
  })
}

// Hook: Add condition
export function useAddCondition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<DeliveryCondition, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('report_delivery_conditions')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as DeliveryCondition
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conditions(data.schedule_id) })
    },
  })
}

// Hook: Update condition
export function useUpdateCondition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DeliveryCondition> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_delivery_conditions')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DeliveryCondition
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conditions(data.schedule_id) })
    },
  })
}

// Hook: Remove condition
export function useRemoveCondition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, scheduleId }: { id: string; scheduleId: string }) => {
      const { error } = await supabase.from('report_delivery_conditions').delete().eq('id', id)

      if (error) throw error
      return scheduleId
    },
    onSuccess: (scheduleId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conditions(scheduleId) })
    },
  })
}
