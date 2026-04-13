import { createFileRoute } from '@tanstack/react-router'
import { IntakeForm } from '../../../components/intake-form/IntakeForm'

export const Route = createFileRoute('/_protected/intake/new')({
  component: NewIntakeTicket,
})

function NewIntakeTicket() {
  return (
    <div className="container mx-auto py-6 sm:py-8">
      <IntakeForm />
    </div>
  )
}
