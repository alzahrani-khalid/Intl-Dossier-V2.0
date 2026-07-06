/**
 * UserDetailPage — admin-only detail view for a single user at /users/:id.
 *
 * Read half: profile fields (email, username, names, role, status, MFA, last
 * login, department) via the house direct-select pattern against public.users
 * under RLS. Write half: role change through the hardened `assign-role` fn
 * (branching on the dual-approval union response and SURFACING requires_approval,
 * never masking it) and status flip through `deactivate-user`/`reactivate-user`.
 *
 * Phase 86 — FEAT-03 (D-10 detail half). Admin-gated by the parent /users layout
 * (beforeLoad: requireAdmin); the page receives userId as a prop from the $id
 * route. The list page's ilike search block is deliberately NOT copied here —
 * that PostgREST filter-string interpolation class is SEC-01.
 *
 * @module pages/users/UserDetailPage
 */

import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle, Loader2, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDayFirstYear } from '@/lib/format-date'
import { supabase } from '@/lib/supabase'
import {
  assignRole,
  deactivateUser,
  reactivateUser,
  type AssignRoleResponse,
  type DeactivateUserResponse,
  type ReactivateUserResponse,
} from '@/services/user-management-api'

const PLACEHOLDER = '—'

// The exact three roles the deployed assign-role fn accepts. Locked to the fn
// contract so the picker cannot drift into the legacy list-filter role labels.
const ROLE_OPTIONS = ['admin', 'editor', 'viewer'] as const
type Role = (typeof ROLE_OPTIONS)[number]

// The column list mirrors UsersListPage's select (minus the count) so the read
// stays a plain `.eq('id', …)` builder — no user input is interpolated.
const DETAIL_COLUMNS =
  'id, email, username, full_name, name_en, name_ar, role, is_active, mfa_enabled, last_login_at, department, avatar_url'

interface UserDetailRow {
  id: string
  email: string | null
  username: string | null
  full_name: string | null
  name_en: string | null
  name_ar: string | null
  role: string | null
  is_active: boolean | null
  mfa_enabled: boolean | null
  last_login_at: string | null
  department: string | null
  avatar_url: string | null
}

export interface UserDetailPageProps {
  userId: string
}

const DETAIL_KEY = (userId: string): (string | undefined)[] => ['users', 'detail', userId]

function normalizeRole(role: string | null): Role {
  return (ROLE_OPTIONS as readonly string[]).includes(role ?? '') ? (role as Role) : 'viewer'
}

function Field({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-start text-sm text-muted-foreground">{label}</dt>
      <dd className="text-start text-sm">{children}</dd>
    </div>
  )
}

export function UserDetailPage({ userId }: UserDetailPageProps): ReactElement {
  const { t } = useTranslation('user-management')
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<Role | ''>('')

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserDetailRow>({
    queryKey: DETAIL_KEY(userId),
    queryFn: async (): Promise<UserDetailRow> => {
      const { data, error } = await supabase
        .from('users')
        .select(DETAIL_COLUMNS)
        .eq('id', userId)
        .is('deleted_by', null)
        .single()
      if (error) {
        throw error
      }
      return data as unknown as UserDetailRow
    },
  })

  // Invalidate list variants (['users', <filters…>]) without clobbering this
  // detail cache — the detail is updated authoritatively from the fn response.
  const invalidateLists = (): void => {
    void queryClient.invalidateQueries({
      predicate: (q): boolean => q.queryKey[0] === 'users' && q.queryKey[1] !== 'detail',
    })
  }

  const patchDetail = (patch: Partial<UserDetailRow>): void => {
    queryClient.setQueryData<UserDetailRow>(DETAIL_KEY(userId), (old) =>
      old !== undefined ? { ...old, ...patch } : old,
    )
  }

  const assignRoleMutation = useMutation({
    mutationFn: (newRole: Role): Promise<AssignRoleResponse> =>
      assignRole({ user_id: userId, new_role: newRole }),
    onSuccess: (result: AssignRoleResponse): void => {
      // Dual-approval branch: the change did NOT apply server-side. Surface it —
      // never mask the response, never update the local role (T-86-13).
      if ('requires_approval' in result) {
        toast.info(t('roles.roleRequiresApproval'))
        return
      }
      patchDetail({ role: result.new_role })
      invalidateLists()
      const sessions = result.sessions_terminated
      toast.success(
        t('roles.roleAssigned'),
        sessions > 0
          ? { description: t('roles.sessionsTerminatedCount', { count: sessions }) }
          : undefined,
      )
    },
    onError: (): void => {
      toast.error(t('errors.saveFailed'))
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (): Promise<DeactivateUserResponse> => deactivateUser({ userId }),
    onSuccess: (result: DeactivateUserResponse): void => {
      patchDetail({ is_active: false })
      invalidateLists()
      const o = result.orphanedItems
      const parts: string[] = []
      if (o !== undefined) {
        if (o.dossiers > 0)
          parts.push(t('userDeactivation.orphanedDossiers', { count: o.dossiers }))
        if (o.assignments > 0)
          parts.push(t('userDeactivation.orphanedAssignments', { count: o.assignments }))
        if (o.approvals > 0)
          parts.push(t('userDeactivation.orphanedApprovals', { count: o.approvals }))
      }
      const description = parts.length > 0 ? parts.join(' · ') : undefined
      toast.success(
        t('userDeactivation.deactivated'),
        description !== undefined ? { description } : undefined,
      )
    },
    onError: (): void => {
      toast.error(t('errors.saveFailed'))
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: (): Promise<ReactivateUserResponse> => reactivateUser({ userId }),
    onSuccess: (): void => {
      patchDetail({ is_active: true })
      invalidateLists()
      toast.success(t('userDeactivation.reactivated'))
    },
    onError: (): void => {
      toast.error(t('errors.saveFailed'))
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-muted-foreground">{t('translation:loading', 'Loading...')}</p>
      </div>
    )
  }

  if (isError || user === undefined) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 py-12 text-center"
      >
        <AlertCircle className="h-10 w-10 text-danger" />
        <p className="font-medium text-danger">{t('errors.loadFailed')}</p>
      </div>
    )
  }

  const displayName =
    user.name_en ?? user.name_ar ?? user.full_name ?? user.email ?? user.username ?? user.id
  const currentRole = normalizeRole(user.role)
  const roleValue: Role = selectedRole !== '' ? selectedRole : currentRole
  const roleLabel = user.role !== null ? t(`roles.${user.role}`) : PLACEHOLDER
  const isActive = user.is_active === true
  const roleUnchanged = roleValue === currentRole
  const roleBusy = assignRoleMutation.isPending

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        icon={<UserCog className="h-6 w-6" />}
        title={displayName}
        subtitle={user.email ?? undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('userDetail.overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('userProfile.email')}>{user.email ?? PLACEHOLDER}</Field>
            <Field label={t('userProfile.username')}>{user.username ?? PLACEHOLDER}</Field>
            <Field label={t('userProfile.fullName')}>{displayName}</Field>
            <Field label={t('userProfile.department')}>{user.department ?? PLACEHOLDER}</Field>
            <Field label={t('userProfile.role')}>
              <Badge variant="outline">{roleLabel}</Badge>
            </Field>
            <Field label={t('userProfile.status')}>
              <Badge variant={isActive ? 'success' : 'secondary'}>
                {t(`userStatus.${isActive ? 'active' : 'inactive'}`)}
              </Badge>
            </Field>
            <Field label={t('userProfile.mfaEnabled')}>
              {user.mfa_enabled === true ? (
                <CheckCircle
                  className="h-4 w-4 text-ok"
                  role="img"
                  aria-label={t('userProfile.mfaEnabled')}
                />
              ) : (
                <span className="text-muted-foreground">{PLACEHOLDER}</span>
              )}
            </Field>
            <Field label={t('userProfile.lastLoginAt')}>
              {user.last_login_at !== null ? formatDayFirstYear(user.last_login_at) : PLACEHOLDER}
            </Field>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('roles.assignRole')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select value={roleValue} onValueChange={(v) => setSelectedRole(v as Role)}>
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`roles.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="min-h-11"
              disabled={roleUnchanged || roleBusy}
              onClick={() => assignRoleMutation.mutate(roleValue)}
            >
              {roleBusy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('roles.assignRole')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('userProfile.status')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="min-h-11"
                  disabled={deactivateMutation.isPending}
                >
                  {t('userDeactivation.deactivate')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('userDeactivation.deactivate')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('userDeactivation.confirmDeactivation')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deactivateMutation.mutate()}>
                    {t('actions.deactivate')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              className="min-h-11"
              disabled={reactivateMutation.isPending}
              onClick={() => reactivateMutation.mutate()}
            >
              {t('userDeactivation.reactivate')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserDetailPage
