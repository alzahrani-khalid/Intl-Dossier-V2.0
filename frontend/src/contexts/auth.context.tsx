import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useAuthStore, type AuthState } from '../store/authStore'

export type AuthContextValue = Pick<
 AuthState,
 'user' | 'isAuthenticated' | 'isLoading' | 'error' | 'login' | 'logout' | 'checkAuth' | 'clearError'
>

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
 const {
 user,
 isAuthenticated,
 isLoading,
 error,
 login,
 logout,
 checkAuth,
 clearError,
 } = useAuthStore()

 useEffect(() => {
 void checkAuth()
 }, [checkAuth])

 const value = useMemo(
 () => ({ user, isAuthenticated, isLoading, error, login, logout, checkAuth, clearError }),
 [user, isAuthenticated, isLoading, error, login, logout, checkAuth, clearError]
 )

 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
 const context = useContext(AuthContext)
 if (!context) {
 throw new Error('useAuth must be used within an AuthProvider')
 }
 return context
}
