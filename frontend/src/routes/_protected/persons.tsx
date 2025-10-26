import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Legacy /persons route - redirects to unified /contacts route
 * Part of: Enhanced Unified Dossier Architecture
 *
 * Persons are now managed through the unified dossiers table (type='person')
 * accessible via the Contact Directory at /contacts
 */
export const Route = createFileRoute('/_protected/persons')({
  beforeLoad: () => {
    throw redirect({
      to: '/contacts',
      replace: true,
    })
  },
})
