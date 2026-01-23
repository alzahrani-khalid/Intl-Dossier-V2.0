import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { Globe, Loader2 } from 'lucide-react'
import { supabase } from '../store/authStore'
import toast from 'react-hot-toast'

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
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
        toast.success(
          'Account created successfully! Please check your email to verify your account.',
        )
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
    <div className="from-base-50 to-base-100 flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      <div className="w-full max-w-md">
        <div className="dark:bg-base-800 rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Globe className="size-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <h1 className="font-display text-base-900 dark:text-base-50 mb-2 text-center text-2xl">
            Create Your Account
          </h1>
          <p className="text-base-600 dark:text-base-400 font-text mb-6 text-center">
            Join GASTAT International Dossier System
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium"
              >
                Full Name{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <input
                {...register('name')}
                id="name"
                type="text"
                placeholder="John Doe"
                className="border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={errors.name ? 'true' : undefined}
              />
              {errors.name && (
                <p
                  id="name-error"
                  className="font-text mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium"
              >
                Email{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="user@gastat.sa"
                className="border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={errors.email ? 'true' : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="font-text mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium"
              >
                Password{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                className="border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={errors.password ? 'true' : undefined}
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="font-text mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-base-700 dark:text-base-300 font-text mb-2 block text-sm font-medium"
              >
                Confirm Password{' '}
                <span className="text-red-500" aria-label="required">
                  *
                </span>
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                className="border-base-300 dark:border-base-600 dark:bg-base-800 dark:text-base-50 font-text w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                aria-invalid={errors.confirmPassword ? 'true' : undefined}
              />
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="font-text mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="font-text flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 font-medium text-primary-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>

            <div className="text-base-600 dark:text-base-400 font-text text-center text-sm">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-text text-primary-600 hover:text-primary-700 hover:underline"
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

        <div className="text-base-600 dark:text-base-400 font-text mt-6 text-center text-sm">
          © 2025 GASTAT - General Authority for Statistics
        </div>
      </div>
    </div>
  )
}
