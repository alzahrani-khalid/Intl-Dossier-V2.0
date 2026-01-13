import { createFileRoute } from '@tanstack/react-router'
import { ValidationDemoPage } from '@/pages/validation-demo/ValidationDemoPage'

export const Route = createFileRoute('/_protected/validation-demo')({
  component: ValidationDemoPage,
})
