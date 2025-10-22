import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="from-base-50 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-base-900 mb-6 text-5xl">
            GASTAT International Dossier System
          </h1>
          <p className="font-text text-base-600 mb-8 text-xl">
            Welcome to the International Relations Management Platform
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate({ to: '/login' })}
              className="font-text rounded-lg bg-primary-600 px-8 py-3 text-primary-50 transition-colors hover:bg-primary-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}