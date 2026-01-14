/**
 * Duplicate Candidates List Component
 * Feature: entity-duplicate-detection
 *
 * Displays a filterable list of duplicate candidates with pagination
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, Search, Filter, Users, Building2, ScanSearch } from 'lucide-react'
import { DuplicateCandidateCard } from './DuplicateCandidateCard'
import {
  useDuplicateCandidates,
  useDuplicateScan,
  useDismissDuplicate,
} from '@/hooks/useDuplicateDetection'
import type {
  DuplicateCandidateListItem,
  DuplicateEntityType,
  ConfidenceLevel,
} from '@/types/duplicate-detection.types'

interface DuplicateCandidatesListProps {
  onMerge: (candidate: DuplicateCandidateListItem) => void
  onViewDetails: (candidate: DuplicateCandidateListItem) => void
}

export function DuplicateCandidatesList({ onMerge, onViewDetails }: DuplicateCandidatesListProps) {
  const { t, i18n } = useTranslation('duplicate-detection')
  const isRTL = i18n.language === 'ar'

  // Filters state
  const [entityType, setEntityType] = useState<DuplicateEntityType | 'all'>('all')
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel | 'all'>('all')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Fetch candidates
  const { data, isLoading, isError, refetch, isFetching } = useDuplicateCandidates({
    entity_type: entityType === 'all' ? undefined : entityType,
    confidence_level: confidenceLevel === 'all' ? undefined : confidenceLevel,
    status: 'pending',
    limit: pageSize,
    offset: page * pageSize,
  })

  // Mutations
  const scanMutation = useDuplicateScan()
  const dismissMutation = useDismissDuplicate()

  const handleScan = useCallback(
    async (type: DuplicateEntityType) => {
      await scanMutation.mutateAsync({ entity_type: type })
      refetch()
    },
    [scanMutation, refetch],
  )

  const handleDismiss = useCallback(
    async (candidate: DuplicateCandidateListItem) => {
      await dismissMutation.mutateAsync({ candidateId: candidate.id })
    },
    [dismissMutation],
  )

  const candidates = data?.data || []
  const totalCount = data?.pagination?.total || 0
  const hasMore = data?.pagination?.has_more || false

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('duplicate_candidates', 'Duplicate Candidates')}
          </h2>
          <p className="text-muted-foreground">
            {t('duplicate_candidates_desc', 'Review and manage potential duplicate entities')}
          </p>
        </div>
        <Badge variant="outline" className="self-start sm:self-auto">
          {totalCount} {t('pending', 'pending')}
        </Badge>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Entity Type Filter */}
          <Select
            value={entityType}
            onValueChange={(value) => {
              setEntityType(value as DuplicateEntityType | 'all')
              setPage(0)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 me-2" />
              <SelectValue placeholder={t('entity_type', 'Entity Type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_types', 'All Types')}</SelectItem>
              <SelectItem value="person">
                <div className="flex items-center">
                  <Users className="h-4 w-4 me-2" />
                  {t('persons', 'Persons')}
                </div>
              </SelectItem>
              <SelectItem value="organization">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 me-2" />
                  {t('organizations', 'Organizations')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Confidence Level Filter */}
          <Select
            value={confidenceLevel}
            onValueChange={(value) => {
              setConfidenceLevel(value as ConfidenceLevel | 'all')
              setPage(0)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('confidence_level', 'Confidence Level')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_levels', 'All Levels')}</SelectItem>
              <SelectItem value="high">{t('high_confidence', 'High Confidence')}</SelectItem>
              <SelectItem value="medium">{t('medium_confidence', 'Medium Confidence')}</SelectItem>
              <SelectItem value="low">{t('low_confidence', 'Low Confidence')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {/* Scan Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScan('person')}
            disabled={scanMutation.isPending}
          >
            <ScanSearch className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('scan_persons', 'Scan Persons')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleScan('organization')}
            disabled={scanMutation.isPending}
          >
            <ScanSearch className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('scan_orgs', 'Scan Orgs')}
          </Button>
          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {scanMutation.isPending && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{t('scanning', 'Scanning for duplicates...')}</span>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanMutation.isSuccess && scanMutation.data && (
        <div className="rounded-lg border bg-green-50 p-4 text-green-800">
          {t('scan_complete', 'Scan complete.')} {scanMutation.data.candidates_found}{' '}
          {t('new_candidates_found', 'new candidates found.')}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{t('error_loading', 'Error loading duplicate candidates')}</span>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            {t('retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && candidates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{t('no_duplicates', 'No Duplicate Candidates')}</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {t(
              'no_duplicates_desc',
              'No potential duplicates found. Run a scan to check for new duplicates.',
            )}
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleScan('person')}
              disabled={scanMutation.isPending}
            >
              <Users className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('scan_persons', 'Scan Persons')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleScan('organization')}
              disabled={scanMutation.isPending}
            >
              <Building2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('scan_orgs', 'Scan Organizations')}
            </Button>
          </div>
        </div>
      )}

      {/* Candidates Grid */}
      {!isLoading && !isError && candidates.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((candidate) => (
              <DuplicateCandidateCard
                key={candidate.id}
                candidate={candidate}
                onMerge={onMerge}
                onDismiss={handleDismiss}
                onViewDetails={onViewDetails}
                isLoading={dismissMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('showing', 'Showing')} {page * pageSize + 1}-
              {Math.min((page + 1) * pageSize, totalCount)} {t('of', 'of')} {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                {t('previous', 'Previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
              >
                {t('next', 'Next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DuplicateCandidatesList
