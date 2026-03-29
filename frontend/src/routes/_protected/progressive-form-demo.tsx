import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'
import { ProgressiveFormDemoPage } from '@/pages/progressive-form-demo'

export const Route = createFileRoute('/_protected/progressive-form-demo')({
  beforeLoad: devModeGuard,
  component: ProgressiveFormDemoPage,
})
