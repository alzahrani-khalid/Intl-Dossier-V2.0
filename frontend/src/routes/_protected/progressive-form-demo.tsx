import { createFileRoute } from '@tanstack/react-router'
import { ProgressiveFormDemoPage } from '@/pages/progressive-form-demo'

export const Route = createFileRoute('/_protected/progressive-form-demo')({
  component: ProgressiveFormDemoPage,
})
