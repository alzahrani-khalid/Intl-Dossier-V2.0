/**
 * UserDetailPage — admin-only detail view for a single user at /users/:id.
 *
 * Read half: profile fields (email, username, names, role, status, MFA, last
 * login, department) via the house direct-select pattern against public.users
 * under RLS. Write half (role change + status flip) is added on top of this read.
 *
 * Phase 86 — FEAT-03 (D-10 detail half). Admin-gated by the parent /users layout
 * (beforeLoad: requireAdmin); the page receives userId as a prop from the $id
 * route. The list page's ilike search block is deliberately NOT copied here —
 * that PostgREST filter-string interpolation class is SEC-01.
 *
 * @module pages/users/UserDetailPage
 */

import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, Loader2, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDayFirstYear } from '@/lib/format-date'
import { supabase } from '@/lib/supabase'

const PLACEHOLDER = '—'

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

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserDetailRow>({
    queryKey: ['users', 'detail', userId],
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
  const roleLabel = user.role !== null ? t(`roles.${user.role}`) : PLACEHOLDER
  const isActive = user.is_active === true

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
    </div>
  )
}

export default UserDetailPage
