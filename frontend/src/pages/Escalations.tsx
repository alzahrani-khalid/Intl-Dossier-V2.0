import { useTranslation } from 'react-i18next'
import { EscalationDashboard } from '../components/assignments/EscalationDashboard'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Shield } from 'lucide-react'

export function EscalationsPage() {
  const { t } = useTranslation('assignments')

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('escalations.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('escalations.description')}</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Shield className="size-4" />
        <AlertDescription>{t('escalations.info')}</AlertDescription>
      </Alert>

      {/* Dashboard */}
      <EscalationDashboard />
    </div>
  )
}
