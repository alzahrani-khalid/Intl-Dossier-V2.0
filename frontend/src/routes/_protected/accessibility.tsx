import { createFileRoute } from '@tanstack/react-router'
import AccessibilitySettings from '@/components/settings/AccessibilitySettings'

export const Route = createFileRoute('/_protected/accessibility')({
 component: AccessibilitySettings,
})

