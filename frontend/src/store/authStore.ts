import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setSentryUser, clearSentryUser, addBreadcrumb } from '../lib/sentry'
import { COLUMNS } from '../lib/query-columns'
// Plain module import — verified acyclic: query-client.ts imports only
// @tanstack/react-query, sonner and ./query-tiers. It is NOT part of the router
// cycle described at the SIGNED_OUT branch below.
import { queryClient } from '../lib/query-client'

// Re-export supabase for backward compatibility
export { supabase }

export interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
  avatar?: string
  jobTitleEn?: string
  jobTitleAr?: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string, mfaCode?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
  handleAuthStateChange: (event: AuthChangeEvent, session: Session | null) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, _mfaCode?: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            throw error
          }

          if (data.user) {
            // Fetch user profile from database
            const { data: profile } = await supabase
              .from('users')
              .select(COLUMNS.USERS.PROFILE)
              .eq('id', data.user.id)
              .single()

            const userRole = profile?.role || 'viewer'

            set({
              user: {
                id: data.user.id,
                email: data.user.email || '',
                name: profile?.full_name || data.user.email?.split('@')[0],
                role: userRole,
                avatar: profile?.avatar_url,
                jobTitleEn: profile?.job_title_en ?? undefined,
                jobTitleAr: profile?.job_title_ar ?? undefined,
              },
              isAuthenticated: true,
              isLoading: false,
            })

            // Set Sentry user context
            setSentryUser({
              id: data.user.id,
              email: data.user.email || '',
              role: userRole,
              tenant: profile?.default_organization_id || undefined,
            })

            addBreadcrumb('User logged in', 'auth', 'info', {
              userId: data.user.id,
              role: userRole,
            })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          })
          // Re-throw so the caller's navigation gates on success (a swallowed
          // error previously let LoginPage navigate to /dashboard on failure).
          throw error instanceof Error ? error : new Error('Login failed')
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          const { error } = await supabase.auth.signOut()

          if (error) {
            throw error
          }

          // Clear Sentry user context
          clearSentryUser()
          addBreadcrumb('User logged out', 'auth', 'info')

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false,
          })
        }
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select(COLUMNS.USERS.PROFILE)
              .eq('id', session.user.id)
              .single()

            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.full_name || session.user.user_metadata?.name,
                // Authorization role comes ONLY from public.users.role (service-role-written
                // truth). Never fall back to client-writable auth metadata (privilege
                // escalation). name/avatar metadata fallbacks are display-only and stay.
                role: profile?.role ?? 'viewer',
                avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                jobTitleEn: profile?.job_title_en ?? undefined,
                jobTitleAr: profile?.job_title_ar ?? undefined,
              },
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Auth check failed',
            isLoading: false,
            isAuthenticated: false,
          })
        }
      },

      resetPassword: async (email: string): Promise<void> => {
        set({ isLoading: true, error: null })
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          })

          if (error) {
            throw error
          }

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Password reset failed',
            isLoading: false,
          })
          throw error instanceof Error ? error : new Error('Password reset failed')
        }
      },

      clearError: () => set({ error: null }),

      handleAuthStateChange: async (event: AuthChangeEvent, session: Session | null) => {
        // Handle auth state changes from Supabase (token refresh, sign out, etc.)
        if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
          clearSentryUser()
          addBreadcrumb('Auth state changed: signed out', 'auth', 'info')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })

          // This branch is the SINGLE OWNER of post-sign-out teardown and navigation
          // (D-29). Every sign-out surface soft-navigates, so without the clear() the
          // previous user's rows stay resident for gcTime (10 min) and are served
          // without refetch for staleTime (5 min) — on a clearance-gated product on a
          // shared workstation. Bounded to the IN-MEMORY cache (D-30): persisted
          // localStorage residue is a pre-existing leak filed as CLIENTSEC-01.
          queryClient.clear()

          // The LAZY import is REQUIRED — do NOT simplify it to a module-level
          // `import { router } from '@/router'`. That would newly introduce the cycle
          // authStore -> router -> routeTree.gen -> routes/_protected.tsx -> authStore,
          // and this repo has already shipped a production white-screen from a module
          // cycle. Plain '/login', no redirectTo (D-12).
          void import('@/router').then(({ router }) => router.navigate({ to: '/login' }))
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select(COLUMNS.USERS.PROFILE)
              .eq('id', session.user.id)
              .single()

            // Authorization role comes ONLY from public.users.role; never fall back to
            // client-writable auth metadata (privilege escalation).
            const userRole = profile?.role ?? 'viewer'

            // Update Sentry user context on auth state change
            setSentryUser({
              id: session.user.id,
              email: session.user.email || '',
              role: userRole,
            })

            addBreadcrumb(`Auth state changed: ${event}`, 'auth', 'info', {
              userId: session.user.id,
            })

            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.full_name || session.user.user_metadata?.name,
                role: userRole,
                avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                jobTitleEn: profile?.job_title_en ?? undefined,
                jobTitleAr: profile?.job_title_ar ?? undefined,
              },
              isAuthenticated: true,
              isLoading: false,
            })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

/**
 * Subscribe to Supabase auth state changes.
 * Returns an unsubscribe function for cleanup.
 * Used by AuthListenerManager to tie the listener to the React lifecycle.
 */
export function subscribeToAuthChanges(): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    useAuthStore.getState().handleAuthStateChange(event, session)
  })
  return () => subscription.unsubscribe()
}
