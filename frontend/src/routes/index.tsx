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
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 font-display text-5xl text-base-900">
            GASTAT International Dossier System
          </h1>
          <p className="mb-8 font-text text-xl text-base-600">
            Welcome to the International Relations Management Platform
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate({ to: '/login' })}
              className="rounded-lg bg-primary-600 px-8 py-3 font-text text-primary-50 transition-colors hover:bg-primary-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}