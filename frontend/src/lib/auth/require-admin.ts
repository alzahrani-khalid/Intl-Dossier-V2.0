/**
 * Shared admin route guard for TanStack Router `beforeLoad`.
 *
 * Authorization reads ONLY from `public.users.role` — the single, service-role-written
 * source of truth. `user_metadata` / `app_metadata` are client-writable via
 * `supabase.auth.updateUser()` (a privilege-escalation vector) and are never consulted
 * here. Accepts exactly `admin` — the single set every admin Edge Function enforces
 * (`role !== 'admin'` → 403). Widening this guard only grants the admin UI to roles the
 * backend rejects on the first action.
 *
 * Throws `Error('Admin access required')` (matching the prior inline guards) when the
 * authenticated user is not an admin, so the route error boundary keeps rendering the
 * same access-denied state everywhere.
 */
import { supabase } from '@/lib/supabase'

const ADMIN_ROLES = new Set(['admin'])

export async function requireAdmin(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const userId = session?.user?.id
  if (!userId) {
    throw new Error('Admin access required')
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single()

  if (!ADMIN_ROLES.has(profile?.role ?? 'viewer')) {
    throw new Error('Admin access required')
  }
}
