import { createFileRoute } from '@tanstack/react-router'
import { BriefsPage } from '@/pages/Briefs/BriefsPage'

export const Route = createFileRoute('/_protected/briefs')({
  component: BriefsPage,
})
