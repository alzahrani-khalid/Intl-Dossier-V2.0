import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore, supabase } from '../store/authStore'
import { ChatDock } from '@/components/ai/ChatDock'
import { ChatProvider } from '@/contexts/ChatContext'
import { getDossierDetailPath } from '@/lib/dossier-routes'
import { OnboardingTourTrigger } from '@/components/guided-tours'
import { ErrorBoundary } from '@/components/error-boundary'
// Phase 41 (D-02 / 41-RESEARCH §7 Path A): validateSearch whitelists drawer params on
// the protected layout route so any deep-link to a child route can open the dossier
// quick-look drawer via ?dossier=<id>&dossierType=<type>.
const VALID_DOSSIER_TYPES = [
  'country',
  'organization',
  'forum',
  'engagement',
  'topic',
  'working_group',
  'person',
  'elected_official',
] as const

type ValidDossierType = (typeof VALID_DOSSIER_TYPES)[number]

function isValidDrawerDossierType(value: unknown): value is ValidDossierType {
  return typeof value === 'string' && (VALID_DOSSIER_TYPES as readonly string[]).includes(value)
}

export const Route = createFileRoute('/_protected')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { dossier?: string; dossierType?: ValidDossierType } => ({
    dossier:
      typeof search.dossier === 'string' && search.dossier.length > 0 ? search.dossier : undefined,
    dossierType: isValidDrawerDossierType(search.dossierType) ? search.dossierType : undefined,
  }),
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
      <AppShell>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </AppShell>
      <ErrorBoundary>
        <ChatDock onCitationClick={handleCitationClick} />
      </ErrorBoundary>
      <OnboardingTourTrigger
        autoStartDelay={1000}
        showReplayButton={true}
        replayButtonPosition="bottom-right"
      />
    </ChatProvider>
  )
}
