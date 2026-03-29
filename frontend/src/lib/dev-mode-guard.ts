import { redirect } from '@tanstack/react-router'

/**
 * Route-level guard that restricts access to demo/development pages.
 * In production (VITE_DEV_MODE not set), redirects to /dashboard.
 * In development, always allows access (uses Vite's built-in DEV flag as fallback).
 *
 * Usage: Add as `beforeLoad` in any demo route's createFileRoute config.
 */
export function devModeGuard(): void {
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV
  if (!isDevMode) {
    throw redirect({ to: '/dashboard' })
  }
}
