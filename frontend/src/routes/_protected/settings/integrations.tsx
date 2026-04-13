import { createFileRoute } from '@tanstack/react-router'
import { BotIntegrationsSettings } from '@/components/settings/BotIntegrationsSettings'

export const Route = createFileRoute('/_protected/settings/integrations')({
  component: IntegrationsSettingsPage,
})

function IntegrationsSettingsPage() {
  return (
    <div className="container mx-auto py-6 sm:py-8 max-w-4xl">
      <BotIntegrationsSettings />
    </div>
  )
}
