import { createFileRoute } from '@tanstack/react-router'
import MoUs from '../../pages/MoUs'

export const Route = createFileRoute('/_protected/mous')({
  component: MoUs,
})
