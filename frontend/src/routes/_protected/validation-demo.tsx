import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'
import { ValidationDemoPage } from '@/pages/validation-demo/ValidationDemoPage'

export const Route = createFileRoute('/_protected/validation-demo')({
  beforeLoad: devModeGuard,
  component: ValidationDemoPage,
})
