import { createFileRoute } from '@tanstack/react-router'
import { devModeGuard } from '@/lib/dev-mode-guard'
import { FormAutoSaveDemoPage } from '@/pages/form-auto-save-demo/FormAutoSaveDemoPage'

export const Route = createFileRoute('/_protected/form-auto-save-demo')({
  beforeLoad: devModeGuard,
  component: FormAutoSaveDemoPage,
})
