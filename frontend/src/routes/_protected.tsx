import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { MainLayout } from '../components/Layout/MainLayout'
import { useAuthStore, supabase } from '../store/authStore'
import { ChatDock } from '@/components/ai/ChatDock'
import { ChatProvider } from '@/contexts/ChatContext'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    // Check actual Supabase session, not just localStorage
    const {
      data: { session },
    } = await supabase.auth.getSession()

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
  const navigate = useNavigate()

  // Handle citation clicks from chat to navigate to entities
  const handleCitationClick = (type: string, id: string) => {
    switch (type) {
      case 'dossier':
        navigate({ to: '/dossiers/$id', params: { id } })
        break
      case 'commitment':
        navigate({ to: '/commitments', search: { id } })
        break
      case 'engagement':
        navigate({ to: '/engagements/$engagementId', params: { engagementId: id } })
        break
      default:
        // For other types, try a general search
        navigate({ to: '/search', search: { q: id, type: undefined, includeArchived: undefined } })
    }
  }

  return (
    <ChatProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
      {/* AI Chat Dock - available on all protected pages */}
      <ChatDock onCitationClick={handleCitationClick} />
    </ChatProvider>
  )
}
