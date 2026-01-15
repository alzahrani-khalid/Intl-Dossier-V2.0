/**
 * AI Relationship Suggestions Component
 * Feature: ai-relationship-suggestions
 *
 * Displays AI-powered relationship suggestions when a person has no documented
 * relationships. Allows bulk relationship creation with context notes.
 *
 * Mobile-first, RTL-aware with Framer Motion animations.
 */

import * as React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Users,
  Building2,
  Calendar,
  Briefcase,
  Network,
  GitBranch,
  Lightbulb,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  UserCircle,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  useRelationshipSuggestions,
  useBulkCreateRelationships,
  useRejectSuggestion,
} from '@/hooks/useRelationshipSuggestions'
import {
  SUGGESTION_TYPE_LABELS,
  getConfidenceLabel,
  type RelationshipSuggestion,
  type SuggestionType,
} from '@/types/relationship-suggestion.types'
import { RELATIONSHIP_TYPE_LABELS, type RelationshipType } from '@/types/person.types'

// Icon mapping for suggestion types
const SUGGESTION_TYPE_ICON_MAP: Record<
  SuggestionType,
  React.ComponentType<{ className?: string }>
> = {
  co_event_attendance: Calendar,
  same_organization: Building2,
  shared_role_period: Briefcase,
  organizational_hierarchy: GitBranch,
  shared_affiliation: Users,
  mutual_connection: Network,
  expertise_match: Lightbulb,
}

interface AIRelationshipSuggestionsProps {
  personId: string
  personName: string
  onClose?: () => void
  onRelationshipsCreated?: () => void
  className?: string
}

interface SelectedSuggestion {
  suggestion: RelationshipSuggestion
  relationshipType: RelationshipType
  notes: string
}

/**
 * Main AI Relationship Suggestions Component
 */
export function AIRelationshipSuggestions({
  personId,
  personName,
  onClose,
  onRelationshipsCreated,
  className,
}: AIRelationshipSuggestionsProps) {
  const { t, i18n } = useTranslation('relationships')
  const isRTL = i18n.language === 'ar'

  // State
  const [selectedSuggestions, setSelectedSuggestions] = useState<Map<string, SelectedSuggestion>>(
    new Map(),
  )
  const [currentStep, setCurrentStep] = useState<'select' | 'review'>('select')

  // Queries and mutations
  const { data, isLoading, error } = useRelationshipSuggestions(personId, { limit: 15 })
  const bulkCreateMutation = useBulkCreateRelationships()
  const rejectMutation = useRejectSuggestion()

  // Handlers
  const handleSelectSuggestion = useCallback(
    (suggestion: RelationshipSuggestion, selected: boolean) => {
      setSelectedSuggestions((prev) => {
        const newMap = new Map(prev)
        if (selected) {
          newMap.set(suggestion.suggested_person_id, {
            suggestion,
            relationshipType: suggestion.suggested_relationship_type,
            notes: isRTL ? suggestion.context_notes_ar : suggestion.context_notes_en,
          })
        } else {
          newMap.delete(suggestion.suggested_person_id)
        }
        return newMap
      })
    },
    [isRTL],
  )

  const handleRejectSuggestion = useCallback(
    async (suggestion: RelationshipSuggestion) => {
      await rejectMutation.mutateAsync({
        person_id: personId,
        suggested_person_id: suggestion.suggested_person_id,
        suggestion_type: suggestion.suggestion_type,
      })
    },
    [personId, rejectMutation],
  )

  const handleUpdateRelationshipType = useCallback((personId: string, type: RelationshipType) => {
    setSelectedSuggestions((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(personId)
      if (existing) {
        newMap.set(personId, { ...existing, relationshipType: type })
      }
      return newMap
    })
  }, [])

  const handleUpdateNotes = useCallback((personId: string, notes: string) => {
    setSelectedSuggestions((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(personId)
      if (existing) {
        newMap.set(personId, { ...existing, notes })
      }
      return newMap
    })
  }, [])

  const handleCreateRelationships = useCallback(async () => {
    const relationships = Array.from(selectedSuggestions.values()).map((item) => ({
      to_person_id: item.suggestion.suggested_person_id,
      relationship_type: item.relationshipType,
      strength: 3 as const,
      notes: item.notes,
    }))

    await bulkCreateMutation.mutateAsync({
      person_id: personId,
      relationships,
    })

    onRelationshipsCreated?.()
  }, [selectedSuggestions, personId, bulkCreateMutation, onRelationshipsCreated])

  const handleSelectAll = useCallback(() => {
    if (!data?.suggestions) return

    const newMap = new Map<string, SelectedSuggestion>()
    data.suggestions.forEach((suggestion) => {
      newMap.set(suggestion.suggested_person_id, {
        suggestion,
        relationshipType: suggestion.suggested_relationship_type,
        notes: isRTL ? suggestion.context_notes_ar : suggestion.context_notes_en,
      })
    })
    setSelectedSuggestions(newMap)
  }, [data?.suggestions, isRTL])

  const handleDeselectAll = useCallback(() => {
    setSelectedSuggestions(new Map())
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('border-2 border-dashed border-primary/30', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'جاري البحث عن اتصالات محتملة...' : 'Finding potential connections...'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-2 border-dashed border-destructive/30', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <X className="h-8 w-8 text-destructive mb-4" />
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'فشل في تحميل الاقتراحات' : 'Failed to load suggestions'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // No suggestions state
  if (!data?.suggestions || data.suggestions.length === 0) {
    return (
      <Card className={cn('border-2 border-dashed border-muted', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            {isRTL ? 'لا توجد اقتراحات متاحة' : 'No Suggestions Available'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isRTL
              ? 'لم نتمكن من العثور على اتصالات محتملة بناءً على البيانات المتاحة. يمكنك إضافة علاقات يدويًا.'
              : "We couldn't find potential connections based on available data. You can add relationships manually."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {currentStep === 'select' ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          >
            <SelectionStep
              suggestions={data.suggestions}
              summary={data.summary}
              selectedSuggestions={selectedSuggestions}
              onSelect={handleSelectSuggestion}
              onReject={handleRejectSuggestion}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onNext={() => setCurrentStep('review')}
              onClose={onClose}
              isRTL={isRTL}
              personName={personName}
              isRejecting={rejectMutation.isPending}
            />
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          >
            <ReviewStep
              selectedSuggestions={selectedSuggestions}
              onUpdateType={handleUpdateRelationshipType}
              onUpdateNotes={handleUpdateNotes}
              onBack={() => setCurrentStep('select')}
              onCreate={handleCreateRelationships}
              isCreating={bulkCreateMutation.isPending}
              isRTL={isRTL}
              personName={personName}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Selection Step - Choose which suggestions to accept
 */
function SelectionStep({
  suggestions,
  summary,
  selectedSuggestions,
  onSelect,
  onReject,
  onSelectAll,
  onDeselectAll,
  onNext,
  onClose,
  isRTL,
  personName,
  isRejecting,
}: {
  suggestions: RelationshipSuggestion[]
  summary: { total_suggestions: number; high_confidence_count: number }
  selectedSuggestions: Map<string, SelectedSuggestion>
  onSelect: (suggestion: RelationshipSuggestion, selected: boolean) => void
  onReject: (suggestion: RelationshipSuggestion) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onNext: () => void
  onClose?: () => void
  isRTL: boolean
  personName: string
  isRejecting: boolean
}) {
  const { t } = useTranslation('relationships')

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">
                {isRTL ? 'اقتراحات العلاقات المدعومة بالذكاء الاصطناعي' : 'AI-Powered Suggestions'}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? `وجدنا ${summary.total_suggestions} اتصال محتمل لـ ${personName}`
                  : `Found ${summary.total_suggestions} potential connections for ${personName}`}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">
            <Users className="h-3 w-3 me-1" />
            {summary.total_suggestions} {isRTL ? 'اقتراحات' : 'suggestions'}
          </Badge>
          {summary.high_confidence_count > 0 && (
            <Badge variant="default">
              <CheckCircle2 className="h-3 w-3 me-1" />
              {summary.high_confidence_count} {isRTL ? 'مرجحة جدا' : 'high confidence'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Select all / deselect all */}
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-sm text-muted-foreground">
            {selectedSuggestions.size} {isRTL ? 'محدد' : 'selected'}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onSelectAll}>
              {isRTL ? 'تحديد الكل' : 'Select All'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              {isRTL ? 'إلغاء التحديد' : 'Deselect All'}
            </Button>
          </div>
        </div>

        {/* Suggestions list */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pe-2">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.suggested_person_id}
              suggestion={suggestion}
              isSelected={selectedSuggestions.has(suggestion.suggested_person_id)}
              onSelect={(selected) => onSelect(suggestion, selected)}
              onReject={() => onReject(suggestion)}
              isRTL={isRTL}
              index={index}
              isRejecting={isRejecting}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="min-h-11">
              {isRTL ? 'تخطي في الوقت الحالي' : 'Skip for now'}
            </Button>
          )}
          <Button onClick={onNext} disabled={selectedSuggestions.size === 0} className="min-h-11">
            {isRTL ? 'مراجعة وإنشاء' : 'Review & Create'}
            {isRTL ? (
              <ChevronLeft className="h-4 w-4 ms-2" />
            ) : (
              <ChevronRight className="h-4 w-4 ms-2" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual Suggestion Card
 */
function SuggestionCard({
  suggestion,
  isSelected,
  onSelect,
  onReject,
  isRTL,
  index,
  isRejecting,
}: {
  suggestion: RelationshipSuggestion
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onReject: () => void
  isRTL: boolean
  index: number
  isRejecting: boolean
}) {
  const SuggestionIcon = SUGGESTION_TYPE_ICON_MAP[suggestion.suggestion_type] || Users
  const confidenceLabel = getConfidenceLabel(suggestion.confidence_score)
  const typeLabel = SUGGESTION_TYPE_LABELS[suggestion.suggestion_type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'p-4 rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/50',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mt-1" />

        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          {suggestion.suggested_person_photo_url ? (
            <AvatarImage src={suggestion.suggested_person_photo_url} />
          ) : null}
          <AvatarFallback>
            <UserCircle className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold line-clamp-1">
                {isRTL ? suggestion.suggested_person_name_ar : suggestion.suggested_person_name_en}
              </h4>
              {suggestion.suggested_person_title_en && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {suggestion.suggested_person_title_en}
                </p>
              )}
            </div>

            {/* Reject button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onReject()
                    }}
                    disabled={isRejecting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRTL ? 'رفض هذا الاقتراح' : 'Dismiss this suggestion'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              <SuggestionIcon className="h-3 w-3 me-1" />
              {isRTL ? typeLabel.ar : typeLabel.en}
            </Badge>
            <Badge
              variant={
                confidenceLabel.variant === 'high'
                  ? 'default'
                  : confidenceLabel.variant === 'medium'
                    ? 'secondary'
                    : 'outline'
              }
              className="text-xs"
            >
              {isRTL ? confidenceLabel.ar : confidenceLabel.en}
            </Badge>
          </div>

          {/* Context */}
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {isRTL ? suggestion.context_notes_ar : suggestion.context_notes_en}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Review Step - Customize relationship details before creating
 */
function ReviewStep({
  selectedSuggestions,
  onUpdateType,
  onUpdateNotes,
  onBack,
  onCreate,
  isCreating,
  isRTL,
  personName,
}: {
  selectedSuggestions: Map<string, SelectedSuggestion>
  onUpdateType: (personId: string, type: RelationshipType) => void
  onUpdateNotes: (personId: string, notes: string) => void
  onBack: () => void
  onCreate: () => void
  isCreating: boolean
  isRTL: boolean
  personName: string
}) {
  const items = Array.from(selectedSuggestions.values())

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">
              {isRTL ? 'مراجعة العلاقات' : 'Review Relationships'}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? `إنشاء ${items.length} علاقات لـ ${personName}`
                : `Creating ${items.length} relationships for ${personName}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Relationship cards */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pe-2">
          {items.map((item, index) => (
            <ReviewCard
              key={item.suggestion.suggested_person_id}
              item={item}
              onUpdateType={(type) => onUpdateType(item.suggestion.suggested_person_id, type)}
              onUpdateNotes={(notes) => onUpdateNotes(item.suggestion.suggested_person_id, notes)}
              isRTL={isRTL}
              index={index}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onBack} className="min-h-11">
            {isRTL ? (
              <ChevronRight className="h-4 w-4 me-2" />
            ) : (
              <ChevronLeft className="h-4 w-4 me-2" />
            )}
            {isRTL ? 'العودة' : 'Back'}
          </Button>
          <Button onClick={onCreate} disabled={isCreating} className="min-h-11">
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {isRTL ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 me-2" />
                {isRTL ? `إنشاء ${items.length} علاقات` : `Create ${items.length} Relationships`}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual Review Card
 */
function ReviewCard({
  item,
  onUpdateType,
  onUpdateNotes,
  isRTL,
  index,
}: {
  item: SelectedSuggestion
  onUpdateType: (type: RelationshipType) => void
  onUpdateNotes: (notes: string) => void
  isRTL: boolean
  index: number
}) {
  const relationshipTypes = Object.keys(RELATIONSHIP_TYPE_LABELS) as RelationshipType[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 rounded-lg border bg-card"
    >
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {item.suggestion.suggested_person_photo_url ? (
            <AvatarImage src={item.suggestion.suggested_person_photo_url} />
          ) : null}
          <AvatarFallback>
            <UserCircle className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-sm font-semibold">
            {isRTL
              ? item.suggestion.suggested_person_name_ar
              : item.suggestion.suggested_person_name_en}
          </h4>
          {item.suggestion.suggested_person_title_en && (
            <p className="text-xs text-muted-foreground">
              {item.suggestion.suggested_person_title_en}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Relationship type selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {isRTL ? 'نوع العلاقة' : 'Relationship Type'}
          </label>
          <Select value={item.relationshipType} onValueChange={onUpdateType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {relationshipTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {isRTL ? RELATIONSHIP_TYPE_LABELS[type].ar : RELATIONSHIP_TYPE_LABELS[type].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
          </label>
          <Textarea
            value={item.notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder={isRTL ? 'أضف سياق إضافي...' : 'Add additional context...'}
            className="min-h-[60px] text-sm"
          />
        </div>
      </div>
    </motion.div>
  )
}

export default AIRelationshipSuggestions
