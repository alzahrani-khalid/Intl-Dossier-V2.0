/**
 * ComplianceViolationAlert Component
 * Feature: compliance-rules-management
 *
 * Displays compliance violation alerts with severity indicators,
 * action buttons, and sign-off capabilities.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileCheck,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type {
  ComplianceViolation,
  ComplianceSeverity,
  ViolationStatus,
} from '@/types/compliance.types'
import {
  SEVERITY_COLORS,
  VIOLATION_STATUS_COLORS,
  SEVERITY_LABELS,
  VIOLATION_STATUS_LABELS,
  canSignOff,
} from '@/types/compliance.types'

interface ComplianceViolationAlertProps {
  violation: ComplianceViolation
  onSignOff?: (violation: ComplianceViolation) => void
  onAcknowledge?: (violation: ComplianceViolation) => void
  onViewDetails?: (violation: ComplianceViolation) => void
  compact?: boolean
  showActions?: boolean
}

const SeverityIcon = ({ severity }: { severity: ComplianceSeverity }) => {
  const iconClass = `h-5 w-5 ${SEVERITY_COLORS[severity].icon}`

  switch (severity) {
    case 'blocking':
      return <XCircle className={iconClass} />
    case 'critical':
      return <AlertTriangle className={iconClass} />
    case 'warning':
      return <AlertCircle className={iconClass} />
    case 'info':
    default:
      return <Info className={iconClass} />
  }
}

export function ComplianceViolationAlert({
  violation,
  onSignOff,
  onAcknowledge,
  onViewDetails,
  compact = false,
  showActions = true,
}: ComplianceViolationAlertProps) {
  const { t, i18n } = useTranslation('compliance')
  const isRTL = i18n.language === 'ar'
  const [isOpen, setIsOpen] = useState(false)

  const severityColors = SEVERITY_COLORS[violation.severity]
  const statusColors = VIOLATION_STATUS_COLORS[violation.status]

  const getName = () => {
    return isRTL
      ? violation.entity_name_ar || violation.entity_name_en
      : violation.entity_name_en || violation.entity_name_ar
  }

  const getRuleName = () => {
    if (violation.rule) {
      return isRTL ? violation.rule.name_ar : violation.rule.name_en
    }
    return violation.rule_code
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${severityColors.bg} ${severityColors.border}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 min-w-0">
          <SeverityIcon severity={violation.severity} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium truncate ${severityColors.text}`}>{getRuleName()}</p>
            <p className="text-xs text-muted-foreground truncate">{getName()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge
            variant="outline"
            className={`${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
          >
            {t(`violationStatus.${violation.status}`)}
          </Badge>
          {showActions && canSignOff(violation) && onSignOff && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSignOff(violation)}
              className="h-8"
            >
              <FileCheck className="h-4 w-4 me-1" />
              {t('violations.signOff')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={`${severityColors.border} ${severityColors.bg}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="mt-0.5">
                <SeverityIcon severity={violation.severity} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className={`text-base ${severityColors.text}`}>
                  {getRuleName()}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{getName()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant="outline"
                className={`${SEVERITY_COLORS[violation.severity].bg} ${SEVERITY_COLORS[violation.severity].text}`}
              >
                {t(`severity.${violation.severity}`)}
              </Badge>
              <Badge
                variant="outline"
                className={`${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
              >
                {t(`violationStatus.${violation.status}`)}
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="sr-only">
                    {isOpen ? t('accessibility.collapseDetails') : t('accessibility.expandDetails')}
                  </span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Violation details */}
            <div className="space-y-4 mt-4">
              {/* Meta information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{t('violations.detectedAt')}:</span>
                  <span className="font-medium text-foreground">
                    {formatDate(violation.detected_at)}
                  </span>
                </div>
                {violation.rule?.requires_signoff && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileCheck className="h-4 w-4" />
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {t('violations.requiresSignoff')}
                    </span>
                  </div>
                )}
              </div>

              {/* Violation details from JSONB */}
              {violation.violation_details &&
                Object.keys(violation.violation_details).length > 0 && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-sm font-medium mb-2">{t('violations.viewDetails')}</p>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {Object.entries(violation.violation_details).map(([key, value]) => {
                        if (key === 'rule_name' || key === 'conditions' || key === 'context')
                          return null
                        return (
                          <div key={key} className="flex gap-2">
                            <dt className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </dt>
                            <dd className="font-medium">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  </div>
                )}

              {/* Related entity */}
              {violation.related_entity_id && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('violations.relatedEntity')}:</span>
                  <span className="font-medium">
                    {isRTL
                      ? violation.related_entity_name_ar || violation.related_entity_name_en
                      : violation.related_entity_name_en || violation.related_entity_name_ar}
                  </span>
                </div>
              )}

              {/* Remediation instructions */}
              {violation.rule &&
                (isRTL
                  ? violation.rule.remediation_instructions_ar
                  : violation.rule.remediation_instructions_en) && (
                  <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {isRTL
                        ? violation.rule.remediation_instructions_ar
                        : violation.rule.remediation_instructions_en}
                    </p>
                  </div>
                )}

              {/* Actions */}
              {showActions && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {canSignOff(violation) && onSignOff && (
                    <Button onClick={() => onSignOff(violation)} size="sm">
                      <FileCheck className="h-4 w-4 me-2" />
                      {t('violations.signOff')}
                    </Button>
                  )}
                  {violation.status === 'pending' && onAcknowledge && (
                    <Button onClick={() => onAcknowledge(violation)} variant="outline" size="sm">
                      {t('violations.acknowledge')}
                    </Button>
                  )}
                  {onViewDetails && (
                    <Button onClick={() => onViewDetails(violation)} variant="ghost" size="sm">
                      {t('violations.viewDetails')}
                      <ArrowUpRight
                        className={`h-4 w-4 ${isRTL ? 'me-2' : 'ms-2'} ${isRTL ? 'rotate-[-90deg]' : ''}`}
                      />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

/**
 * Compact list of violations for sidebars or summaries
 */
interface ComplianceViolationListProps {
  violations: ComplianceViolation[]
  onSignOff?: (violation: ComplianceViolation) => void
  onAcknowledge?: (violation: ComplianceViolation) => void
  onViewDetails?: (violation: ComplianceViolation) => void
  maxItems?: number
  showEmpty?: boolean
  emptyMessage?: string
}

export function ComplianceViolationList({
  violations,
  onSignOff,
  onAcknowledge,
  onViewDetails,
  maxItems,
  showEmpty = true,
  emptyMessage,
}: ComplianceViolationListProps) {
  const { t, i18n } = useTranslation('compliance')
  const isRTL = i18n.language === 'ar'

  const displayedViolations = maxItems ? violations.slice(0, maxItems) : violations
  const hasMore = maxItems && violations.length > maxItems

  if (!violations.length && showEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{emptyMessage || t('violations.noViolations')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t('violations.noViolationsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {displayedViolations.map((violation) => (
        <ComplianceViolationAlert
          key={violation.id}
          violation={violation}
          onSignOff={onSignOff}
          onAcknowledge={onAcknowledge}
          onViewDetails={onViewDetails}
          compact
        />
      ))}
      {hasMore && (
        <p className="text-sm text-center text-muted-foreground pt-2">
          +{violations.length - maxItems} {t('violations.allViolations').toLowerCase()}
        </p>
      )}
    </div>
  )
}

export default ComplianceViolationAlert
