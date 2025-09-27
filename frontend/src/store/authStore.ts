import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
          const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, mfaCode }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || 'Login failed')
          }

          if (data.user) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email || '',
                name: data.user.name_en || data.user.name_ar,
                role: data.user.role,
                avatar: data.user.avatar_url,
              },
              isAuthenticated: true,
              isLoading: false,
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
          const response = await fetch('http://localhost:5001/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.message || 'Logout failed')
          }

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
          const { data: { session } } = await supabase.auth.getSession()

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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
