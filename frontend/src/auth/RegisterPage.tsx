import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Globe, Loader2 } from 'lucide-react'
import { supabase } from '../store/authStore'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: 'user',
          },
        },
      })

      if (error) {
        throw error
      }

      if (authData.user) {
        toast.success('Account created successfully! Please check your email to verify your account.')
        navigate({ to: '/login' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-50 to-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-base-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <h1 className="text-2xl font-display font-display text-base-900 dark:text-base-50 text-center mb-2">
            Create Your Account
          </h1>
          <p className="text-base-600 dark:text-base-400 font-text text-center mb-6">
            Join GASTAT International Dossier System
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-700 dark:text-base-300 mb-2 font-text">
                Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-base-300 dark:border-base-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-base-800 dark:text-base-50 font-text"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-text">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-base-700 dark:text-base-300 mb-2 font-text">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="user@gastat.sa"
                className="w-full px-4 py-2 border border-base-300 dark:border-base-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-base-800 dark:text-base-50 font-text"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-text">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-base-700 dark:text-base-300 mb-2 font-text">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-2 border border-base-300 dark:border-base-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-base-800 dark:text-base-50 font-text"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-text">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-base-700 dark:text-base-300 mb-2 font-text">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="w-full px-4 py-2 border border-base-300 dark:border-base-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-base-800 dark:text-base-50 font-text"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1 font-text">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-primary-50 py-3 px-4 rounded-lg font-text font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>

            <div className="text-center text-sm text-base-600 dark:text-base-400 font-text">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-700 hover:underline font-text"
                onClick={(e) => {
                  e.preventDefault()
                  navigate({ to: '/login' })
                }}
              >
                Sign In
              </a>
            </div>
          </form>
        </div>

        <div className="text-center mt-6 text-sm text-base-600 dark:text-base-400 font-text">
          © 2025 GASTAT - General Authority for Statistics
        </div>
      </div>
    </div>
  )
}