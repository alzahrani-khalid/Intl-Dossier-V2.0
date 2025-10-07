import { useNavigate, useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useNavigation() {
  const navigate = useNavigate()
  const router = useRouter()

  const goTo = useCallback(
    (to: string, options?: { replace?: boolean; state?: any }) => {
      navigate({ to, replace: options?.replace })
    },
    [navigate]
  )

  const goBack = useCallback(() => {
    router.history.back()
  }, [router.history])

  const goForward = useCallback(() => {
    router.history.forward()
  }, [router.history])

  const canGoBack = router.history.length > 1

  return {
    goTo,
    goBack,
    goForward,
    canGoBack,
    currentPath: router.state.location.pathname,
  }
}

