import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuthStore } from '../store/authStore'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (!isAuthenticated) {
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