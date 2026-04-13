import { createFileRoute } from '@tanstack/react-router'
import { EmailDigestSettings } from '@/components/email/EmailDigestSettings'

export const Route = createFileRoute('/_protected/settings/email-digest')({
  component: EmailDigestSettingsPage,
})

function EmailDigestSettingsPage() {
  return (
    <div className="container mx-auto py-6 sm:py-8 max-w-4xl">
      <EmailDigestSettings />
    </div>
  )
}
