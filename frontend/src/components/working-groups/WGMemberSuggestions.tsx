/**
 * Working Group Member Suggestions Component
 * Feature: working-group-member-suggestions
 *
 * Displays AI-powered member suggestions when a working group has no members.
 * Allows bulk member addition with role assignment wizard.
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
  History,
  Lightbulb,
  Flag,
  FileText,
  Crown,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  UserCircle,
  ArrowRight,
  ArrowLeft,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  useWGMemberSuggestions,
  useBulkAddWGMembers,
  useRejectWGSuggestion,
} from '@/hooks/useWGMemberSuggestions'
import {
  WG_SUGGESTION_TYPE_LABELS,
  MEMBER_ROLE_LABELS,
  getWGConfidenceLabel,
  getRoleBadgeColor,
  type WGMemberSuggestion,
  type WGSuggestionType,
  type MemberRole,
  type SuggestedEntityType,
} from '@/types/wg-member-suggestion.types'

// Icon mapping for suggestion types
const SUGGESTION_TYPE_ICON_MAP: Record<
  WGSuggestionType,
  React.ComponentType<{ className?: string }>
> = {
  parent_forum_member: Users,
  related_engagement: Calendar,
  past_collaboration: History,
  lead_org_affiliate: Building2,
  topic_expertise: Lightbulb,
  country_representation: Flag,
  organizational_mandate: FileText,
  role_seniority: Crown,
}

interface WGMemberSuggestionsProps {
  workingGroupId: string
  workingGroupName: string
  onClose?: () => void
  onMembersAdded?: () => void
  className?: string
}

interface SelectedMember {
  suggestion: WGMemberSuggestion
  role: MemberRole
  notes: string
}

/**
 * Main Working Group Member Suggestions Component
 */
export function WGMemberSuggestions({
  workingGroupId,
  workingGroupName,
  onClose,
  onMembersAdded,
  className,
}: WGMemberSuggestionsProps) {
  const { t, i18n } = useTranslation('working-groups')
  const isRTL = i18n.language === 'ar'

  // State
  const [selectedMembers, setSelectedMembers] = useState<Map<string, SelectedMember>>(new Map())
  const [currentStep, setCurrentStep] = useState<'select' | 'assign-roles' | 'review'>('select')
  const [activeTab, setActiveTab] = useState<'all' | 'organizations' | 'persons'>('all')

  // Queries and mutations
  const { data, isLoading, error } = useWGMemberSuggestions(workingGroupId, { limit: 20 })
  const bulkAddMutation = useBulkAddWGMembers()
  const rejectMutation = useRejectWGSuggestion()

  // Filter suggestions based on active tab
  const filteredSuggestions = useMemo(() => {
    if (!data?.suggestions) return []
    if (activeTab === 'all') return data.suggestions
    if (activeTab === 'organizations') {
      return data.suggestions.filter((s) => s.suggested_entity_type === 'organization')
    }
    return data.suggestions.filter((s) => s.suggested_entity_type === 'person')
  }, [data?.suggestions, activeTab])

  // Handlers
  const getKey = (suggestion: WGMemberSuggestion) =>
    suggestion.suggested_entity_type === 'organization'
      ? `org_${suggestion.suggested_organization_id}`
      : `person_${suggestion.suggested_person_id}`

  const handleSelectMember = useCallback(
    (suggestion: WGMemberSuggestion, selected: boolean) => {
      setSelectedMembers((prev) => {
        const newMap = new Map(prev)
        const key = getKey(suggestion)
        if (selected) {
          newMap.set(key, {
            suggestion,
            role: suggestion.suggested_role,
            notes: isRTL ? suggestion.context_notes_ar : suggestion.context_notes_en,
          })
        } else {
          newMap.delete(key)
        }
        return newMap
      })
    },
    [isRTL],
  )

  const handleRejectSuggestion = useCallback(
    async (suggestion: WGMemberSuggestion) => {
      await rejectMutation.mutateAsync({
        working_group_id: workingGroupId,
        entity_type: suggestion.suggested_entity_type,
        organization_id: suggestion.suggested_organization_id || undefined,
        person_id: suggestion.suggested_person_id || undefined,
        suggestion_type: suggestion.suggestion_type,
      })
    },
    [workingGroupId, rejectMutation],
  )

  const handleUpdateRole = useCallback((key: string, role: MemberRole) => {
    setSelectedMembers((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(key)
      if (existing) {
        newMap.set(key, { ...existing, role })
      }
      return newMap
    })
  }, [])

  const handleUpdateNotes = useCallback((key: string, notes: string) => {
    setSelectedMembers((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(key)
      if (existing) {
        newMap.set(key, { ...existing, notes })
      }
      return newMap
    })
  }, [])

  const handleAddMembers = useCallback(async () => {
    const members = Array.from(selectedMembers.values()).map((item) => ({
      entity_type: item.suggestion.suggested_entity_type,
      organization_id: item.suggestion.suggested_organization_id || undefined,
      person_id: item.suggestion.suggested_person_id || undefined,
      role: item.role,
      notes: item.notes,
    }))

    await bulkAddMutation.mutateAsync({
      working_group_id: workingGroupId,
      members,
    })

    onMembersAdded?.()
  }, [selectedMembers, workingGroupId, bulkAddMutation, onMembersAdded])

  const handleSelectAll = useCallback(() => {
    if (!filteredSuggestions) return
    const newMap = new Map<string, SelectedMember>()
    filteredSuggestions.forEach((suggestion) => {
      const key = getKey(suggestion)
      newMap.set(key, {
        suggestion,
        role: suggestion.suggested_role,
        notes: isRTL ? suggestion.context_notes_ar : suggestion.context_notes_en,
      })
    })
    setSelectedMembers(newMap)
  }, [filteredSuggestions, isRTL])

  const handleDeselectAll = useCallback(() => {
    setSelectedMembers(new Map())
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('border-2 border-dashed border-primary/30', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'جاري البحث عن أعضاء محتملين...' : 'Finding potential members...'}
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
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            {isRTL ? 'لا توجد اقتراحات متاحة' : 'No Suggestions Available'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isRTL
              ? 'لم نتمكن من العثور على أعضاء محتملين بناءً على البيانات المتاحة. يمكنك إضافة أعضاء يدويًا.'
              : "We couldn't find potential members based on available data. You can add members manually."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className} dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        {currentStep === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          >
            <SelectionStep
              suggestions={filteredSuggestions}
              summary={data.summary}
              selectedMembers={selectedMembers}
              onSelect={handleSelectMember}
              onReject={handleRejectSuggestion}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onNext={() => setCurrentStep('assign-roles')}
              onClose={onClose}
              isRTL={isRTL}
              workingGroupName={workingGroupName}
              isRejecting={rejectMutation.isPending}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              orgCount={data.summary.organization_suggestions}
              personCount={data.summary.person_suggestions}
            />
          </motion.div>
        )}

        {currentStep === 'assign-roles' && (
          <motion.div
            key="assign-roles"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          >
            <RoleAssignmentStep
              selectedMembers={selectedMembers}
              onUpdateRole={handleUpdateRole}
              onUpdateNotes={handleUpdateNotes}
              onBack={() => setCurrentStep('select')}
              onNext={() => setCurrentStep('review')}
              isRTL={isRTL}
              workingGroupName={workingGroupName}
            />
          </motion.div>
        )}

        {currentStep === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          >
            <ReviewStep
              selectedMembers={selectedMembers}
              onBack={() => setCurrentStep('assign-roles')}
              onAdd={handleAddMembers}
              isAdding={bulkAddMutation.isPending}
              isRTL={isRTL}
              workingGroupName={workingGroupName}
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
  selectedMembers,
  onSelect,
  onReject,
  onSelectAll,
  onDeselectAll,
  onNext,
  onClose,
  isRTL,
  workingGroupName,
  isRejecting,
  activeTab,
  onTabChange,
  orgCount,
  personCount,
}: {
  suggestions: WGMemberSuggestion[]
  summary: { total_suggestions: number; high_confidence_count: number }
  selectedMembers: Map<string, SelectedMember>
  onSelect: (suggestion: WGMemberSuggestion, selected: boolean) => void
  onReject: (suggestion: WGMemberSuggestion) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onNext: () => void
  onClose?: () => void
  isRTL: boolean
  workingGroupName: string
  isRejecting: boolean
  activeTab: string
  onTabChange: (tab: 'all' | 'organizations' | 'persons') => void
  orgCount: number
  personCount: number
}) {
  const getKey = (s: WGMemberSuggestion) =>
    s.suggested_entity_type === 'organization'
      ? `org_${s.suggested_organization_id}`
      : `person_${s.suggested_person_id}`

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
                {isRTL ? 'اقتراحات الأعضاء الذكية' : 'Smart Member Suggestions'}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? `وجدنا ${summary.total_suggestions} عضو محتمل لـ ${workingGroupName}`
                  : `Found ${summary.total_suggestions} potential members for ${workingGroupName}`}
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
              <Sparkles className="h-3 w-3 me-1" />
              {summary.high_confidence_count} {isRTL ? 'موصى به بشدة' : 'highly recommended'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity type tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange(v as 'all' | 'organizations' | 'persons')}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              {isRTL ? 'الكل' : 'All'} ({orgCount + personCount})
            </TabsTrigger>
            <TabsTrigger value="organizations">
              <Building2 className="h-4 w-4 me-1" />
              {isRTL ? 'منظمات' : 'Orgs'} ({orgCount})
            </TabsTrigger>
            <TabsTrigger value="persons">
              <UserCircle className="h-4 w-4 me-1" />
              {isRTL ? 'أشخاص' : 'People'} ({personCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Select all / deselect all */}
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-sm text-muted-foreground">
            {selectedMembers.size} {isRTL ? 'محدد' : 'selected'}
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
              key={getKey(suggestion)}
              suggestion={suggestion}
              isSelected={selectedMembers.has(getKey(suggestion))}
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
          <Button onClick={onNext} disabled={selectedMembers.size === 0} className="min-h-11">
            {isRTL ? 'تعيين الأدوار' : 'Assign Roles'}
            {isRTL ? (
              <ArrowLeft className="h-4 w-4 ms-2" />
            ) : (
              <ArrowRight className="h-4 w-4 ms-2" />
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
  suggestion: WGMemberSuggestion
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onReject: () => void
  isRTL: boolean
  index: number
  isRejecting: boolean
}) {
  const SuggestionIcon = SUGGESTION_TYPE_ICON_MAP[suggestion.suggestion_type] || Users
  const confidenceLabel = getWGConfidenceLabel(suggestion.confidence_score)
  const typeLabel = WG_SUGGESTION_TYPE_LABELS[suggestion.suggestion_type]
  const roleLabel = MEMBER_ROLE_LABELS[suggestion.suggested_role]
  const isOrg = suggestion.suggested_entity_type === 'organization'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
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

        {/* Avatar/Icon */}
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
            isOrg ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600',
          )}
        >
          {isOrg ? <Building2 className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold line-clamp-1">
                {isRTL ? suggestion.suggested_name_ar : suggestion.suggested_name_en}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isOrg ? (isRTL ? 'منظمة' : 'Organization') : isRTL ? 'شخص' : 'Person'}
              </p>
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
            <Badge className={cn('text-xs', getRoleBadgeColor(suggestion.suggested_role))}>
              {isRTL ? roleLabel.ar : roleLabel.en}
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
 * Role Assignment Step - Assign roles to selected members
 */
function RoleAssignmentStep({
  selectedMembers,
  onUpdateRole,
  onUpdateNotes,
  onBack,
  onNext,
  isRTL,
  workingGroupName,
}: {
  selectedMembers: Map<string, SelectedMember>
  onUpdateRole: (key: string, role: MemberRole) => void
  onUpdateNotes: (key: string, notes: string) => void
  onBack: () => void
  onNext: () => void
  isRTL: boolean
  workingGroupName: string
}) {
  const items = Array.from(selectedMembers.entries())
  const memberRoles = Object.keys(MEMBER_ROLE_LABELS) as MemberRole[]

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">
              {isRTL ? 'تعيين الأدوار' : 'Assign Roles'}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? `تعيين أدوار لـ ${items.length} أعضاء في ${workingGroupName}`
                : `Assign roles for ${items.length} members in ${workingGroupName}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member role cards */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pe-2">
          {items.map(([key, item], index) => {
            const isOrg = item.suggestion.suggested_entity_type === 'organization'
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                      isOrg ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600',
                    )}
                  >
                    {isOrg ? <Building2 className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">
                      {isRTL
                        ? item.suggestion.suggested_name_ar
                        : item.suggestion.suggested_name_en}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isOrg ? (isRTL ? 'منظمة' : 'Organization') : isRTL ? 'شخص' : 'Person'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Role selector */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {isRTL ? 'الدور' : 'Role'}
                    </label>
                    <Select
                      value={item.role}
                      onValueChange={(v) => onUpdateRole(key, v as MemberRole)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {memberRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {isRTL ? MEMBER_ROLE_LABELS[role].ar : MEMBER_ROLE_LABELS[role].en}
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
                      onChange={(e) => onUpdateNotes(key, e.target.value)}
                      placeholder={isRTL ? 'أضف ملاحظات...' : 'Add notes...'}
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
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
          <Button onClick={onNext} className="min-h-11">
            {isRTL ? 'مراجعة' : 'Review'}
            {isRTL ? (
              <ArrowLeft className="h-4 w-4 ms-2" />
            ) : (
              <ArrowRight className="h-4 w-4 ms-2" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Review Step - Final review before adding members
 */
function ReviewStep({
  selectedMembers,
  onBack,
  onAdd,
  isAdding,
  isRTL,
  workingGroupName,
}: {
  selectedMembers: Map<string, SelectedMember>
  onBack: () => void
  onAdd: () => void
  isAdding: boolean
  isRTL: boolean
  workingGroupName: string
}) {
  const items = Array.from(selectedMembers.values())
  const orgCount = items.filter((i) => i.suggestion.suggested_entity_type === 'organization').length
  const personCount = items.length - orgCount

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">
              {isRTL ? 'مراجعة الأعضاء' : 'Review Members'}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? `إضافة ${items.length} أعضاء إلى ${workingGroupName}`
                : `Adding ${items.length} members to ${workingGroupName}`}
            </CardDescription>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-wrap gap-2 mt-4">
          {orgCount > 0 && (
            <Badge variant="secondary">
              <Building2 className="h-3 w-3 me-1" />
              {orgCount} {isRTL ? 'منظمات' : 'organizations'}
            </Badge>
          )}
          {personCount > 0 && (
            <Badge variant="secondary">
              <UserCircle className="h-3 w-3 me-1" />
              {personCount} {isRTL ? 'أشخاص' : 'people'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Member summary list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pe-2">
          {items.map((item, index) => {
            const isOrg = item.suggestion.suggested_entity_type === 'organization'
            const roleLabel = MEMBER_ROLE_LABELS[item.role]

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      isOrg ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600',
                    )}
                  >
                    {isOrg ? <Building2 className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium">
                    {isRTL ? item.suggestion.suggested_name_ar : item.suggestion.suggested_name_en}
                  </span>
                </div>
                <Badge className={cn('text-xs', getRoleBadgeColor(item.role))}>
                  {isRTL ? roleLabel.ar : roleLabel.en}
                </Badge>
              </motion.div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onBack} disabled={isAdding} className="min-h-11">
            {isRTL ? (
              <ChevronRight className="h-4 w-4 me-2" />
            ) : (
              <ChevronLeft className="h-4 w-4 me-2" />
            )}
            {isRTL ? 'العودة' : 'Back'}
          </Button>
          <Button onClick={onAdd} disabled={isAdding} className="min-h-11">
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {isRTL ? 'جاري الإضافة...' : 'Adding...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 me-2" />
                {isRTL ? `إضافة ${items.length} أعضاء` : `Add ${items.length} Members`}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default WGMemberSuggestions
