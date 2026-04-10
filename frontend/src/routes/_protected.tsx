import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore, supabase } from '../store/authStore'
import { ChatDock } from '@/components/ai/ChatDock'
import { ChatProvider } from '@/contexts/ChatContext'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { OnboardingTourTrigger } from '@/components/guided-tours'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    try {
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
    } catch (error) {
      // If it's already a redirect, re-throw it
      if (error instanceof Error && 'to' in error) {
        throw error
      }
      // Any other error (network, corrupt token) → treat as unauthenticated
      useAuthStore.setState({ user: null, isAuthenticated: false })
      throw redirect({
        to: '/login',
      })
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout(): React.ReactElement {
  const navigate = useNavigate()

  const handleCitationClick = (type: string, id: string, dossierType?: string): void => {
    switch (type) {
      case 'dossier':
        navigate({ to: getDossierDetailPath(id, dossierType) })
        break
      case 'commitment':
        navigate({ to: '/commitments', search: { id } as any })
        break
      case 'engagement':
        navigate({ to: '/engagements/$engagementId', params: { engagementId: id } as any })
        break
      default:
        navigate({ to: '/search', search: { q: id } as any })
    }
  }

  return (
    <ChatProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <ChatDock onCitationClick={handleCitationClick} />
      <OnboardingTourTrigger
        autoStartDelay={1000}
        showReplayButton={true}
        replayButtonPosition="bottom-right"
      />
    </ChatProvider>
  )
}
