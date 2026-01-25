import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setSentryUser, clearSentryUser, addBreadcrumb } from '../lib/sentry'
import { COLUMNS } from '../lib/query-columns'

// Re-export supabase for backward compatibility
export { supabase }

export interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
  avatar?: string
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
  clearError: () => void
  handleAuthStateChange: (event: AuthChangeEvent, session: Session | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, mfaCode?: string) => {
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
                name: profile?.full_name || profile?.username || data.user.email?.split('@')[0],
                role: userRole,
                avatar: profile?.avatar_url,
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
          throw error
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
          throw error
        }
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            set({
              user: {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.user_metadata?.name,
                role: session.user.user_metadata?.role,
                avatar: session.user.user_metadata?.avatar_url,
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

      clearError: () => set({ error: null }),

      handleAuthStateChange: (event: AuthChangeEvent, session: Session | null) => {
        // Handle auth state changes from Supabase (token refresh, sign out, etc.)
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          clearSentryUser()
          addBreadcrumb('Auth state changed: signed out', 'auth', 'info')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const userRole = session.user.user_metadata?.role

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
                name: session.user.user_metadata?.name,
                role: userRole,
                avatar: session.user.user_metadata?.avatar_url,
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
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().handleAuthStateChange(event, session)
})
