/**
 * ConvertedTicketBanner
 *
 * Read-only banner displayed on intake ticket detail pages
 * when a ticket has been promoted to an engagement.
 * Shows a success indicator and a link to the new engagement.
 *
 * RTL-safe: uses logical border/padding properties.
 * All text from lifecycle i18n namespace.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'

// ============================================================================
// Props
// ============================================================================

interface ConvertedTicketBannerProps {
  convertedToId: string
}

// ============================================================================
// Component
// ============================================================================

export function ConvertedTicketBanner({
  convertedToId,
}: ConvertedTicketBannerProps): React.JSX.Element {
  const { t, i18n } = useTranslation('lifecycle')
  const isRTL = i18n.language === 'ar'

  return (
    <div
      className="flex items-center gap-3 rounded-e-md border-s-4 border-primary bg-primary/10 p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="status"
    >
      <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm font-medium text-foreground text-start">
        {t('converted.banner')}
      </p>
      <Link
        to={`/dossiers/engagements/${convertedToId}`}
        className="min-h-11 inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t('converted.link')}
      </Link>
    </div>
  )
}

export default ConvertedTicketBanner
