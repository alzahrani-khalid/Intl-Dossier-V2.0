import { createFileRoute } from '@tanstack/react-router'
import { BotIntegrationsSettings } from '@/components/settings/BotIntegrationsSettings'

export const Route = createFileRoute('/_protected/settings/integrations')({
  component: IntegrationsSettingsPage,
})

function IntegrationsSettingsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
      <BotIntegrationsSettings />
    </div>
  )
}
