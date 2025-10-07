import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuthStore, supabase } from '../store/authStore'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    // Check actual Supabase session, not just localStorage
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Clear stale auth state and redirect to login
      useAuthStore.setState({ user: null, isAuthenticated: false })
      throw redirect({
        to: '/login',
      })
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  )
}