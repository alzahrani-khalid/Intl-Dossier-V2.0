import { createFileRoute } from '@tanstack/react-router'
import { CommitmentsHelpPage } from '../../../pages/help/CommitmentsHelpPage'

export const Route = createFileRoute('/_protected/help/commitments')({
  component: CommitmentsHelpPage,
})
