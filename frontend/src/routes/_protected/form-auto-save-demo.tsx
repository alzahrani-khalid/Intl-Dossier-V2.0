import { createFileRoute } from '@tanstack/react-router'
import { FormAutoSaveDemoPage } from '@/pages/form-auto-save-demo/FormAutoSaveDemoPage'

export const Route = createFileRoute('/_protected/form-auto-save-demo')({
  component: FormAutoSaveDemoPage,
})
