import { createFileRoute } from '@tanstack/react-router'
import { BotIntegrationsSettings } from '@/components/settings/BotIntegrationsSettings'

export const Route = createFileRoute('/_protected/settings/integrations')({
  component: IntegrationsSettingsPage,
})

function IntegrationsSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <BotIntegrationsSettings />
    </div>
  )
}
