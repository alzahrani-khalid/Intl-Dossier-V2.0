import { createFileRoute } from '@tanstack/react-router'
import { HelpPage } from '../../pages/help/HelpPage'

export const Route = createFileRoute('/_protected/help')({
  component: HelpPage,
})
