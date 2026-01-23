import { createFileRoute } from '@tanstack/react-router'
import { EmailDigestSettings } from '@/components/email/EmailDigestSettings'

export const Route = createFileRoute('/_protected/settings/email-digest')({
  component: EmailDigestSettingsPage,
})

function EmailDigestSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <EmailDigestSettings />
    </div>
  )
}
