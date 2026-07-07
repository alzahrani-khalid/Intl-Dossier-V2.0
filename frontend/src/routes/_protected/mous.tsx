import { createFileRoute } from '@tanstack/react-router'
import MoUs from '../../pages/MoUs'

export interface MousSearch {
  /** The ⌘K "Create MoU" command deep-links here to open CreateMouDialog. */
  action?: 'create'
}

export const Route = createFileRoute('/_protected/mous')({
  // Whitelist: `action` accepts exactly 'create'; anything else → undefined (T-87-07).
  validateSearch: (search: Record<string, unknown>): MousSearch =>
    search.action === 'create' ? { action: 'create' } : {},
  component: MoUs,
})
