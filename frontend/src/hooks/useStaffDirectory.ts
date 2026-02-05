/**
 * useStaffDirectory Hooks
 *
 * TanStack Query hooks for staff directory and topic assignments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  StaffContact,
  StaffContactWithDepartment,
  CreateStaffContactRequest,
  UpdateStaffContactRequest,
  StaffFilters,
  Department,
  StaffTopicAssignment,
  CreateTopicAssignmentRequest,
  UpdateTopicAssignmentRequest,
  TopicAssignmentFilters,
  TopicContactResponse,
} from '@/types/contacts.types'

// Query keys
export const staffKeys = {
  all: ['staff-directory'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (filters?: Partial<StaffFilters>) => [...staffKeys.lists(), filters] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
  departments: () => [...staffKeys.all, 'departments'] as const,
  department: (id: string) => [...staffKeys.departments(), id] as const,
  departmentStaff: (deptId: string) => [...staffKeys.all, 'department-staff', deptId] as const,
  assignments: (staffId: string) => [...staffKeys.all, 'assignments', staffId] as const,
  topicContacts: (type: string, refId: string) =>
    [...staffKeys.all, 'topic-contacts', type, refId] as const,
}

// ============================================================================
// Staff Directory Hooks
// ============================================================================

/**
 * Fetch staff directory
 */
export function useStaffDirectory(filters: Partial<StaffFilters> = {}) {
  return useQuery<StaffContactWithDepartment[], Error>({
    queryKey: staffKeys.list(filters),
    queryFn: async () => {
      let query = supabase.from('staff_contacts').select('*').eq('is_active', true)

      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id)
      }
      if (filters.position_level) {
        query = query.eq('position_level', filters.position_level)
      }
      if (filters.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available)
      }
      if (filters.search) {
        query = query.or(
          `name_en.ilike.%${filters.search}%,name_ar.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
        )
      }

      query = query
        .order('department_id', { ascending: true })
        .order('position_level', { ascending: true })
        .order('name_en', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Get department names
      const deptIds = [...new Set((data || []).map((s) => s.department_id))]
      let deptNames: Record<string, { name_en?: string; name_ar?: string }> = {}

      if (deptIds.length > 0) {
        const { data: depts } = await supabase
          .from('departments')
          .select('id, name_en, name_ar')
          .in('id', deptIds)

        if (depts) {
          depts.forEach((d) => {
            deptNames[d.id] = { name_en: d.name_en, name_ar: d.name_ar }
          })
        }
      }

      // Check for active delegations
      const staffIds = (data || []).map((s) => s.id)
      let delegations: Record<string, string> = {}

      if (staffIds.length > 0) {
        const now = new Date().toISOString()
        const { data: delegatingStaff } = await supabase
          .from('staff_contacts')
          .select('id, delegates_to_id')
          .in('id', staffIds)
          .not('delegates_to_id', 'is', null)
          .lte('delegation_start', now)
          .or(`delegation_end.is.null,delegation_end.gte.${now}`)

        if (delegatingStaff) {
          delegatingStaff.forEach((d) => {
            if (d.delegates_to_id) {
              delegations[d.id] = d.delegates_to_id
            }
          })
        }
      }

      return (data || []).map((s) => ({
        ...s,
        department_name_en: deptNames[s.department_id]?.name_en,
        department_name_ar: deptNames[s.department_id]?.name_ar,
        is_delegating: !!delegations[s.id],
      })) as StaffContactWithDepartment[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetch single staff member
 */
export function useStaffContact(id: string | undefined) {
  return useQuery<StaffContactWithDepartment | null, Error>({
    queryKey: staffKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('staff_contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Get department name
      const { data: dept } = await supabase
        .from('departments')
        .select('name_en, name_ar')
        .eq('id', data.department_id)
        .single()

      // Get delegate name if delegating
      let delegates_to_name: string | undefined
      if (data.delegates_to_id) {
        const { data: delegate } = await supabase
          .from('staff_contacts')
          .select('name_en')
          .eq('id', data.delegates_to_id)
          .single()
        delegates_to_name = delegate?.name_en
      }

      return {
        ...data,
        department_name_en: dept?.name_en,
        department_name_ar: dept?.name_ar,
        delegates_to_name,
      } as StaffContactWithDepartment
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create staff contact
 */
export function useCreateStaffContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateStaffContactRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: staff, error } = await supabase
        .from('staff_contacts')
        .insert({
          ...data,
          position_level: data.position_level || 'staff',
          timezone: data.timezone || 'Asia/Riyadh',
          is_available: true,
          is_active: true,
          specializations: data.specializations || [],
          languages: data.languages || [],
          expertise_areas: data.expertise_areas || [],
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return staff as StaffContact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
      toast.success('Staff member added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add staff member')
    },
  })
}

/**
 * Update staff contact
 */
export function useUpdateStaffContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStaffContactRequest }) => {
      const { data: staff, error } = await supabase
        .from('staff_contacts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return staff as StaffContact
    },
    onSuccess: (staff) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
      queryClient.setQueryData(staffKeys.detail(staff.id), staff)
      toast.success('Staff member updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update staff member')
    },
  })
}

/**
 * Delete staff contact (soft delete)
 */
export function useDeleteStaffContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_contacts')
        .update({ is_active: false, end_date: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
      queryClient.removeQueries({ queryKey: staffKeys.detail(id) })
      toast.success('Staff member removed')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove staff member')
    },
  })
}

// ============================================================================
// Delegation Hooks
// ============================================================================

/**
 * Create delegation
 */
export function useCreateDelegation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      staffId,
      delegatesToId,
      start,
      end,
      reason,
    }: {
      staffId: string
      delegatesToId: string
      start: string
      end?: string
      reason?: string
    }) => {
      const { error } = await supabase
        .from('staff_contacts')
        .update({
          delegates_to_id: delegatesToId,
          delegation_start: start,
          delegation_end: end,
          delegation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffId)

      if (error) {
        throw new Error(error.message)
      }

      return staffId
    },
    onSuccess: (staffId) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
      toast.success('Delegation created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create delegation')
    },
  })
}

/**
 * End delegation
 */
export function useEndDelegation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('staff_contacts')
        .update({
          delegates_to_id: null,
          delegation_start: null,
          delegation_end: null,
          delegation_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffId)

      if (error) {
        throw new Error(error.message)
      }

      return staffId
    },
    onSuccess: (staffId) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.lists() })
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(staffId) })
      toast.success('Delegation ended')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to end delegation')
    },
  })
}

// ============================================================================
// Department Hooks
// ============================================================================

/**
 * Fetch all departments
 */
export function useDepartments() {
  return useQuery<Department[], Error>({
    queryKey: staffKeys.departments(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('name_en', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Fetch department with staff
 */
export function useDepartmentStaff(departmentId: string) {
  return useQuery<StaffContactWithDepartment[], Error>({
    queryKey: staffKeys.departmentStaff(departmentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_contacts')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('position_level', { ascending: true })
        .order('name_en', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Get department name
      const { data: dept } = await supabase
        .from('departments')
        .select('name_en, name_ar')
        .eq('id', departmentId)
        .single()

      return (data || []).map((s) => ({
        ...s,
        department_name_en: dept?.name_en,
        department_name_ar: dept?.name_ar,
      })) as StaffContactWithDepartment[]
    },
    enabled: !!departmentId,
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================================
// Topic Assignment Hooks
// ============================================================================

/**
 * Fetch assignments for a staff member
 */
export function useStaffAssignments(
  staffId: string,
  filters: Partial<TopicAssignmentFilters> = {},
) {
  return useQuery<StaffTopicAssignment[], Error>({
    queryKey: staffKeys.assignments(staffId),
    queryFn: async () => {
      let query = supabase
        .from('staff_topic_assignments')
        .select('*')
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false })

      if (filters.assignment_type) {
        query = query.eq('assignment_type', filters.assignment_type)
      }
      if (filters.role) {
        query = query.eq('role', filters.role)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    enabled: !!staffId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Create topic assignment
 */
export function useCreateTopicAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTopicAssignmentRequest) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: assignment, error } = await supabase
        .from('staff_topic_assignments')
        .insert({
          ...data,
          role: data.role || 'primary',
          is_active: true,
          created_by: user?.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return assignment as StaffTopicAssignment
    },
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.assignments(assignment.staff_id) })
      toast.success('Assignment created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create assignment')
    },
  })
}

/**
 * Update topic assignment
 */
export function useUpdateTopicAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      staffId,
      data,
    }: {
      id: string
      staffId: string
      data: UpdateTopicAssignmentRequest
    }) => {
      const { data: assignment, error } = await supabase
        .from('staff_topic_assignments')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return { assignment: assignment as StaffTopicAssignment, staffId }
    },
    onSuccess: ({ staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.assignments(staffId) })
      toast.success('Assignment updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update assignment')
    },
  })
}

/**
 * Delete topic assignment
 */
export function useDeleteTopicAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, staffId }: { id: string; staffId: string }) => {
      const { error } = await supabase.from('staff_topic_assignments').delete().eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      return { id, staffId }
    },
    onSuccess: ({ staffId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.assignments(staffId) })
      toast.success('Assignment removed')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove assignment')
    },
  })
}

/**
 * Find contacts for a topic/entity
 */
export function useTopicContacts(assignmentType: string, referenceId: string) {
  return useQuery<TopicContactResponse[], Error>({
    queryKey: staffKeys.topicContacts(assignmentType, referenceId),
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from('staff_topic_assignments')
        .select('*')
        .eq('assignment_type', assignmentType)
        .eq('reference_id', referenceId)
        .eq('is_active', true)
        .order('role', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      if (!assignments || assignments.length === 0) return []

      // Get staff details
      const staffIds = assignments.map((a) => a.staff_id)
      const { data: staffList } = await supabase
        .from('staff_contacts')
        .select('id, name_en, name_ar, title_en, email, phone, department_id, delegates_to_id')
        .in('id', staffIds)

      if (!staffList) return []

      // Get department names
      const deptIds = [...new Set(staffList.map((s) => s.department_id))]
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name_en')
        .in('id', deptIds)

      const deptNames: Record<string, string> = {}
      depts?.forEach((d) => {
        deptNames[d.id] = d.name_en
      })

      // Build response with delegation handling
      const results: TopicContactResponse[] = []

      for (const assignment of assignments) {
        const staff = staffList.find((s) => s.id === assignment.staff_id)
        if (!staff) continue

        let effectiveContactId = staff.id
        let effectiveContactName = staff.name_en
        let isDelegated = false

        // Check for active delegation
        if (staff.delegates_to_id) {
          const { data: delegate } = await supabase
            .from('staff_contacts')
            .select('id, name_en')
            .eq('id', staff.delegates_to_id)
            .single()

          if (delegate) {
            effectiveContactId = delegate.id
            effectiveContactName = delegate.name_en
            isDelegated = true
          }
        }

        results.push({
          staff_id: staff.id,
          name_en: staff.name_en,
          name_ar: staff.name_ar,
          title_en: staff.title_en,
          email: staff.email,
          phone: staff.phone,
          department_name_en: deptNames[staff.department_id] || '',
          role: assignment.role,
          effective_contact_id: effectiveContactId,
          effective_contact_name: effectiveContactName,
          is_delegated: isDelegated,
        })
      }

      return results
    },
    enabled: !!assignmentType && !!referenceId,
    staleTime: 1000 * 60 * 5,
  })
}
