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
    <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-display font-display text-base-900 mb-6">
            GASTAT International Dossier System
          </h1>
          <p className="text-xl font-text font-text text-base-600 mb-8">
            Welcome to the International Relations Management Platform
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate({ to: '/login' })}
              className="px-8 py-3 bg-primary-600 text-primary-50 rounded-lg hover:bg-primary-700 transition-colors font-text"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}