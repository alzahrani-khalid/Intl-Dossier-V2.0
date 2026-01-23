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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-50 to-base-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-base-800">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <Globe className="size-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <h1 className="mb-2 text-center font-display text-2xl text-base-900 dark:text-base-50">
            Create Your Account
          </h1>
          <p className="mb-6 text-center font-text text-base-600 dark:text-base-400">
            Join GASTAT International Dossier System
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block font-text text-sm font-medium text-base-700 dark:text-base-300"
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
                className="w-full rounded-lg border border-base-300 px-4 py-2 font-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-base-600 dark:bg-base-800 dark:text-base-50"
                disabled={isLoading}
                aria-describedby={errors.name ? 'name-error' : undefined}
                aria-invalid={errors.name ? 'true' : undefined}
              />
              {errors.name && (
                <p
                  id="name-error"
                  className="mt-1 font-text text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-text text-sm font-medium text-base-700 dark:text-base-300"
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
                className="w-full rounded-lg border border-base-300 px-4 py-2 font-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-base-600 dark:bg-base-800 dark:text-base-50"
                disabled={isLoading}
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={errors.email ? 'true' : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 font-text text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-text text-sm font-medium text-base-700 dark:text-base-300"
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
                className="w-full rounded-lg border border-base-300 px-4 py-2 font-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-base-600 dark:bg-base-800 dark:text-base-50"
                disabled={isLoading}
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={errors.password ? 'true' : undefined}
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1 font-text text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block font-text text-sm font-medium text-base-700 dark:text-base-300"
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
                className="w-full rounded-lg border border-base-300 px-4 py-2 font-text focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-base-600 dark:bg-base-800 dark:text-base-50"
                disabled={isLoading}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                aria-invalid={errors.confirmPassword ? 'true' : undefined}
              />
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="mt-1 font-text text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 font-text font-medium text-primary-50 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="text-center font-text text-sm text-base-600 dark:text-base-400">
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

        <div className="mt-6 text-center font-text text-sm text-base-600 dark:text-base-400">
          © 2025 GASTAT - General Authority for Statistics
        </div>
      </div>
    </div>
  )
}
