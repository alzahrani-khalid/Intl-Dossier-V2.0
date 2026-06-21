import { Suspense, lazy } from 'react'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore, supabase } from '../store/authStore'
import { ChatProvider } from '@/contexts/ChatContext'
import { OnboardingTourTrigger } from '@/components/guided-tours'
import { ErrorBoundary } from '@/components/error-boundary'
import { DossierDrawer } from '@/components/dossier/DossierDrawer'
import { CommitmentDrawer } from '@/components/commitments/CommitmentDrawer'

// Phase 72 (AGENT-01): the reads-only copilot drawer is DYNAMIC-IMPORTED so the
// assistant-ui + markdown weight stays out of the entry chunk (bundle ceiling,
// threat T-72-SC). It self-gates on the useCopilotDrawer open-state store and owns
// its own AG-UI runtime provider (mounted only while open), so no provider wrapper is
// needed at this mount — opening from the Topbar FAB / Cmd+K flips the store.
const CopilotDrawer = lazy(() => import('@/components/copilot/CopilotDrawer'))
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
  return (
    <ChatProvider>
      <AppShell>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </AppShell>
      <ErrorBoundary>
        <DossierDrawer />
      </ErrorBoundary>
      <ErrorBoundary>
        <CommitmentDrawer />
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <CopilotDrawer />
        </Suspense>
      </ErrorBoundary>
      <OnboardingTourTrigger
        autoStartDelay={1000}
        showReplayButton={true}
        replayButtonPosition="bottom-right"
      />
    </ChatProvider>
  )
}
