import { createFileRoute, redirect } from '@tanstack/react-router'

// Phase 39 (39-09): legacy /my-work/board route superseded by /kanban WorkBoard.
// This file is preserved as a redirect to keep deep links + bookmarks alive.
export const Route = createFileRoute('/_protected/my-work/board')({
  beforeLoad: (): never => {
    throw redirect({ to: '/kanban' })
  },
})
