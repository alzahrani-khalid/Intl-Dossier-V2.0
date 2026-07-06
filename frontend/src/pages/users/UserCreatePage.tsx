/**
 * UserCreatePage — admin-only full-page form to create a user account.
 *
 * Mirrors the deployed create-user edge-fn validators (email regex, username
 * ^[a-z0-9_-]{3,50}$, full_name 2-100, role admin/editor/viewer, optional
 * clearance integer 1-4) and invokes createUser(). Created users are inactive
 * pending activation (there is no /activate route yet — out of FEAT-02 scope).
 *
 * Phase 86 — FEAT-02 (D-10 create half). Route: /users/create (admin-gated by
 * the parent users layout's beforeLoad: requireAdmin).
 *
 * @module pages/users/UserCreatePage
 */

import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createUser, type CreateUserRequest } from '@/services/user-management-api'

// The exact three roles the deployed create-user fn accepts. Do NOT add the
// legacy list-filter roles (pre-existing drift, out of scope). Keep this literal
// so the schema stays greppable and the role picker cannot drift.
const ROLE_OPTIONS = ['admin', 'editor', 'viewer'] as const

// Schema mirrors the edge-fn validators. Fields stay strings for the form layer;
// clearance is validated as an optional integer 1-4 and converted at submit.
const createUserSchema = z.object({
  email: z.string().email('user-management:createForm.errors.emailInvalid'),
  username: z
    .string()
    .regex(/^[a-z0-9_-]{3,50}$/, 'user-management:createForm.errors.usernameFormat'),
  full_name: z
    .string()
    .min(2, 'user-management:createForm.errors.fullNameLength')
    .max(100, 'user-management:createForm.errors.fullNameLength'),
  role: z.enum(['admin', 'editor', 'viewer']),
  clearance: z
    .string()
    .refine(
      (v) => v === '' || /^[1-4]$/.test(v),
      'user-management:createForm.errors.clearanceRange',
    ),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

// The create-user fn returns non-2xx errors through supabase.functions.invoke as
// a FunctionsHttpError whose `.context` is the raw Response. Read the JSON body to
// recover the machine code (DUPLICATE_EMAIL / DUPLICATE_USERNAME) for field-level
// mapping — never mask it behind a generic toast.
async function extractEdgeErrorCode(error: unknown): Promise<string | null> {
  if (typeof error !== 'object' || error === null) {
    return null
  }
  const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context
  if (ctx != null && typeof ctx.json === 'function') {
    try {
      const body = (await ctx.json()) as { code?: string }
      return body?.code ?? null
    } catch {
      return null
    }
  }
  return null
}

export function UserCreatePage(): ReactElement {
  const { t } = useTranslation('user-management')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      username: '',
      full_name: '',
      role: 'viewer',
      clearance: '',
    },
  })

  const createUserMutation = useMutation({
    mutationFn: async (payload: CreateUserRequest): Promise<void> => {
      await createUser(payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const onSubmit = async (values: CreateUserFormValues): Promise<void> => {
    const clearance = values.clearance === '' ? undefined : Number(values.clearance)
    const payload: CreateUserRequest = {
      email: values.email,
      username: values.username,
      full_name: values.full_name,
      role: values.role,
      user_type: 'employee',
      ...(clearance !== undefined ? { clearance } : {}),
    }

    try {
      await createUserMutation.mutateAsync(payload)
    } catch (error) {
      const code = await extractEdgeErrorCode(error)
      if (code === 'DUPLICATE_EMAIL') {
        form.setError('email', {
          type: 'server',
          message: 'user-management:userOnboarding.duplicateEmail',
        })
        return
      }
      if (code === 'DUPLICATE_USERNAME') {
        form.setError('username', {
          type: 'server',
          message: 'user-management:userOnboarding.duplicateUsername',
        })
        return
      }
      toast.error(t('createForm.submitFailed'))
      return
    }

    toast.success(t('createForm.created'))
    form.reset()
    void navigate({ to: '/users' })
  }

  const submitting = createUserMutation.isPending

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        icon={<UserPlus className="h-6 w-6" />}
        title={t('userOnboarding.createUser')}
        subtitle={t('createForm.subtitle')}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start">{t('userProfile.email')}</FormLabel>
                <FormControl required>
                  <Input
                    {...field}
                    type="email"
                    dir="ltr"
                    autoComplete="off"
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start">{t('userProfile.username')}</FormLabel>
                <FormControl required>
                  <Input {...field} dir="ltr" autoComplete="off" className="min-h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start">{t('userProfile.fullName')}</FormLabel>
                <FormControl required>
                  <Input {...field} className="min-h-11" maxLength={100} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start">{t('userProfile.role')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl required>
                    <SelectTrigger className="min-h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clearance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start">{t('createForm.clearance')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={4}
                    dir="ltr"
                    className="min-h-11"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate({ to: '/users' })}
              disabled={submitting}
              className="min-h-11"
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} className="min-h-11">
              {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('createForm.submit')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default UserCreatePage
