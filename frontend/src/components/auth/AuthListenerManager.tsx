import { useEffect } from 'react'
import { subscribeToAuthChanges } from '@/store/authStore'

/**
 * App-level component that manages the Supabase auth state listener.
 * Must be rendered once at the top level (App.tsx) to ensure proper
 * cleanup on unmount — fixes D-01 memory leak and B-02 lock contention.
 */
export function AuthListenerManager(): null {
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges()
    return unsubscribe
  }, [])
  return null
}
