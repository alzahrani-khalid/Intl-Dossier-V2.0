import { AuthError, User, Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// Types
export interface AuthUser {
  id: string
  email: string
  fullName?: string
  role: 'admin' | 'editor' | 'viewer'
  languagePreference: 'en' | 'ar'
  timezone: string
  avatarUrl?: string
  mfaEnabled: boolean
  lastLoginAt?: Date
  isActive: boolean
}

export interface MFAConfig {
  enabled: boolean
  secret?: string
  backupCodes?: string[]
  recoveryCodes?: string[]
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  mfaConfig: MFAConfig | null
  requiresMFA: boolean
  mfaChallengeId?: string
}

export interface AuthActions {
  // Authentication
  signUp: (email: string, password: string, fullName: string, languagePreference?: 'en' | 'ar') => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  
  // MFA
  enableMFA: () => Promise<{ secret: string; qrCode: string; backupCodes: string[] }>
  disableMFA: (password: string) => Promise<void>
  verifyMFA: (code: string) => Promise<void>
  generateBackupCodes: () => Promise<string[]>
  verifyBackupCode: (code: string) => Promise<void>
  
  // Profile
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  
  // Session management
  refreshSession: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  
  // Admin functions
  createUser: (userData: Partial<AuthUser> & { email: string; password: string }) => Promise<void>
  updateUserRole: (userId: string, role: AuthUser['role']) => Promise<void>
  deactivateUser: (userId: string) => Promise<void>
}

// Auth store
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      mfaConfig: null,
      requiresMFA: false,
      mfaChallengeId: undefined,

      signUp: async (email, password, fullName, languagePreference = 'en') => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                language_preference: languagePreference,
                role: 'viewer' // Default role
              }
            }
          })

          if (error) throw error

          if (data.user && !data.session) {
            // Email confirmation required
            set({ 
              isLoading: false,
              error: 'Please check your email to confirm your account'
            })
          } else if (data.user && data.session) {
            // Auto-confirmed
            await get().checkAuth()
          }
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Sign up failed',
            isLoading: false
          })
          throw error
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null, requiresMFA: false })
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            if (error.message.includes('MFA')) {
              set({ requiresMFA: true, mfaChallengeId: error.message })
            }
            throw error
          }

          if (data.user && data.session) {
            await get().checkAuth()
          }
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Sign in failed',
            isLoading: false
          })
          throw error
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error

          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            mfaConfig: null,
            requiresMFA: false,
            mfaChallengeId: undefined
          })
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Sign out failed',
            isLoading: false
          })
          throw error
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })
          
          if (error) throw error

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Password reset failed',
            isLoading: false
          })
          throw error
        }
      },

      updatePassword: async (newPassword) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          })
          
          if (error) throw error

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Password update failed',
            isLoading: false
          })
          throw error
        }
      },

      enableMFA: async () => {
        set({ isLoading: true, error: null })
        
        try {
          // This would typically call a backend endpoint to generate MFA secret
          const response = await fetch('/api/auth/mfa/enable', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to enable MFA')
          }

          const data = await response.json()
          
          set({
            mfaConfig: {
              enabled: false, // Will be enabled after verification
              secret: data.secret,
              backupCodes: data.backupCodes
            },
            isLoading: false
          })

          return {
            secret: data.secret,
            qrCode: data.qrCode,
            backupCodes: data.backupCodes
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to enable MFA',
            isLoading: false
          })
          throw error
        }
      },

      disableMFA: async (password) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/mfa/disable', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to disable MFA')
          }

          set({
            mfaConfig: { enabled: false },
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to disable MFA',
            isLoading: false
          })
          throw error
        }
      },

      verifyMFA: async (code) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/mfa/verify', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              code,
              challengeId: get().mfaChallengeId 
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Invalid MFA code')
          }

          set({
            requiresMFA: false,
            mfaChallengeId: undefined,
            isLoading: false
          })

          await get().checkAuth()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'MFA verification failed',
            isLoading: false
          })
          throw error
        }
      },

      generateBackupCodes: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/mfa/backup-codes', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to generate backup codes')
          }

          const data = await response.json()
          
          set({
            mfaConfig: {
              ...get().mfaConfig!,
              backupCodes: data.backupCodes
            },
            isLoading: false
          })

          return data.backupCodes
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to generate backup codes',
            isLoading: false
          })
          throw error
        }
      },

      verifyBackupCode: async (code) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/mfa/verify-backup', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Invalid backup code')
          }

          set({
            requiresMFA: false,
            mfaChallengeId: undefined,
            isLoading: false
          })

          await get().checkAuth()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Backup code verification failed',
            isLoading: false
          })
          throw error
        }
      },

      updateProfile: async (updates) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.updateUser({
            data: updates
          })
          
          if (error) throw error

          // Update local state
          const currentUser = get().user
          if (currentUser) {
            set({
              user: { ...currentUser, ...updates },
              isLoading: false
            })
          }
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Profile update failed',
            isLoading: false
          })
          throw error
        }
      },

      uploadAvatar: async (file) => {
        set({ isLoading: true, error: null })
        
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${get().user?.id}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

          await get().updateProfile({ avatarUrl: publicUrl })
          
          set({ isLoading: false })
          return publicUrl
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Avatar upload failed',
            isLoading: false
          })
          throw error
        }
      },

      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) throw error

          if (data.session) {
            set({ session: data.session })
          }
        } catch (error) {
          console.error('Session refresh failed:', error)
        }
      },

      checkAuth: async () => {
        set({ isLoading: true })
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) throw error

          if (session?.user) {
            // Fetch user profile from database
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profileError) {
              console.error('Profile fetch error:', profileError)
            }

            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email!,
              fullName: profile?.full_name || session.user.user_metadata?.full_name,
              role: profile?.role || 'viewer',
              languagePreference: profile?.language_preference || 'en',
              timezone: profile?.timezone || 'UTC',
              avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
              mfaEnabled: profile?.mfa_enabled || false,
              lastLoginAt: profile?.last_login_at ? new Date(profile.last_login_at) : undefined,
              isActive: profile?.is_active !== false
            }

            set({
              user: authUser,
              session,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              mfaConfig: {
                enabled: authUser.mfaEnabled,
                backupCodes: profile?.backup_codes || []
              }
            })
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              mfaConfig: null
            })
          }
        } catch (error) {
          set({
            error: error instanceof AuthError ? error.message : 'Auth check failed',
            isLoading: false,
            isAuthenticated: false
          })
        }
      },

      clearError: () => set({ error: null }),

      // Admin functions
      createUser: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to create user')
          }

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'User creation failed',
            isLoading: false
          })
          throw error
        }
      },

      updateUserRole: async (userId, role) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to update user role')
          }

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Role update failed',
            isLoading: false
          })
          throw error
        }
      },

      deactivateUser: async (userId) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${get().session?.access_token}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to deactivate user')
          }

          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'User deactivation failed',
            isLoading: false
          })
          throw error
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        mfaConfig: state.mfaConfig
      }),
    }
  )
)

// Auth event listeners
supabase.auth.onAuthStateChange(async (event, session) => {
  const { checkAuth } = useAuthStore.getState()
  
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    await checkAuth()
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      mfaConfig: null,
      requiresMFA: false,
      mfaChallengeId: undefined
    })
  }
})

// Export utilities
export const getCurrentUser = () => useAuthStore.getState().user
export const isAuthenticated = () => useAuthStore.getState().isAuthenticated
export const getSession = () => useAuthStore.getState().session
export const hasRole = (role: AuthUser['role']) => {
  const user = getCurrentUser()
  return user?.role === role
}
export const hasAnyRole = (roles: AuthUser['role'][]) => {
  const user = getCurrentUser()
  return user ? roles.includes(user.role) : false
}

// Export Supabase client
export { supabase }

export default useAuthStore

