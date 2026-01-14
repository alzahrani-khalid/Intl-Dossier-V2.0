/**
 * Duplicate Candidate Card Component
 * Feature: entity-duplicate-detection
 *
 * Displays a duplicate candidate pair with similarity scores and actions
 */

import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Merge,
  User,
  Building2,
  X,
  Mail,
  Phone,
  FileText,
} from 'lucide-react'
import type { DuplicateCandidateListItem, ConfidenceLevel } from '@/types/duplicate-detection.types'
import { getConfidenceLevelColor, CONFIDENCE_LEVEL_LABELS } from '@/types/duplicate-detection.types'

interface DuplicateCandidateCardProps {
  candidate: DuplicateCandidateListItem
  onMerge: (candidate: DuplicateCandidateListItem) => void
  onDismiss: (candidate: DuplicateCandidateListItem) => void
  onViewDetails: (candidate: DuplicateCandidateListItem) => void
  isLoading?: boolean
}

export function DuplicateCandidateCard({
  candidate,
  onMerge,
  onDismiss,
  onViewDetails,
  isLoading = false,
}: DuplicateCandidateCardProps) {
  const { t, i18n } = useTranslation('duplicate-detection')
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const scorePercentage = Math.round(candidate.overall_score * 100)

  const getConfidenceIcon = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  const getEntityIcon = () => {
    return candidate.entity_type === 'person' ? (
      <User className="h-5 w-5 text-muted-foreground" />
    ) : (
      <Building2 className="h-5 w-5 text-muted-foreground" />
    )
  }

  const matchingFields = candidate.match_details?.matching_fields || []

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow hover:shadow-md',
        isLoading && 'opacity-50 pointer-events-none',
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Confidence indicator bar */}
      <div
        className={cn(
          'absolute top-0 start-0 end-0 h-1',
          candidate.confidence_level === 'high' && 'bg-red-500',
          candidate.confidence_level === 'medium' && 'bg-yellow-500',
          candidate.confidence_level === 'low' && 'bg-blue-500',
        )}
      />

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {getEntityIcon()}
            <Badge
              variant="outline"
              className={cn('text-xs', getConfidenceLevelColor(candidate.confidence_level))}
            >
              {getConfidenceIcon(candidate.confidence_level)}
              <span className="ms-1">
                {isRTL
                  ? CONFIDENCE_LEVEL_LABELS[candidate.confidence_level].ar
                  : CONFIDENCE_LEVEL_LABELS[candidate.confidence_level].en}
              </span>
            </Badge>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-end">
                  <div className="text-2xl font-bold">{scorePercentage}%</div>
                  <div className="text-xs text-muted-foreground">
                    {t('similarity_score', 'Similarity')}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t('similarity_tooltip', 'Overall similarity score based on multiple factors')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity comparison */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Source entity */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">{t('entity_1', 'Entity 1')}</div>
            <div className="font-medium truncate">
              {isRTL ? candidate.source_name_ar : candidate.source_name_en}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {isRTL ? candidate.source_name_en : candidate.source_name_ar}
            </div>
          </div>

          {/* Target entity */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">{t('entity_2', 'Entity 2')}</div>
            <div className="font-medium truncate">
              {isRTL ? candidate.target_name_ar : candidate.target_name_en}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {isRTL ? candidate.target_name_en : candidate.target_name_ar}
            </div>
          </div>
        </div>

        {/* Similarity breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">{t('matching_factors', 'Matching Factors')}</div>
          <div className="flex flex-wrap gap-1">
            {matchingFields.map((field) => (
              <Badge key={field} variant="secondary" className="text-xs">
                {field === 'name_en' && <FileText className="h-3 w-3 me-1" />}
                {field === 'name_ar' && <FileText className="h-3 w-3 me-1" />}
                {field === 'email' && <Mail className="h-3 w-3 me-1" />}
                {field === 'phone' && <Phone className="h-3 w-3 me-1" />}
                {field === 'organization' && <Building2 className="h-3 w-3 me-1" />}
                {t(`field_${field}`, field.replace('_', ' '))}
              </Badge>
            ))}
            {matchingFields.length === 0 && (
              <span className="text-xs text-muted-foreground">
                {t('no_strong_matches', 'No strong field matches')}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar for similarity */}
        <div className="space-y-1">
          <Progress value={scorePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('low_similarity', 'Low')}</span>
            <span>{t('high_similarity', 'High')}</span>
          </div>
        </div>

        {/* Detection time */}
        <div className="text-xs text-muted-foreground">
          {t('detected', 'Detected')}{' '}
          {formatDistanceToNow(new Date(candidate.detected_at), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onViewDetails(candidate)}
        >
          <Eye className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('view_details', 'View Details')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onDismiss(candidate)}
          disabled={isLoading}
        >
          <X className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('not_duplicate', 'Not Duplicate')}
        </Button>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => onMerge(candidate)}
          disabled={isLoading}
        >
          <Merge className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
          {t('merge', 'Merge')}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default DuplicateCandidateCard
