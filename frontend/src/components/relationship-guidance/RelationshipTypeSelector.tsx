/**
 * Relationship Type Selector with Guidance
 * Feature: relationship-type-guidance
 *
 * A guided selector for relationship types that:
 * - Shows visual examples of each type
 * - Groups types by category
 * - Provides plain-language descriptions
 * - Validates and prevents incorrect selections
 * - Mobile-first and RTL-compatible
 */

import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Users,
  GitBranch,
  Handshake,
  Calendar,
  Clock,
  Link,
  UserPlus,
  UserCheck,
  Eye,
  Building2,
  GitCommitVertical,
  Briefcase,
  ArrowLeftRight,
  HeartHandshake,
  Network,
  MessageSquare,
  Home,
  Award,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { DossierRelationshipType, DossierType } from '@/types/relationship.types'
import {
  RELATIONSHIP_CATEGORIES,
  type RelationshipTypeMetadata,
  getGroupedRelationshipTypes,
  getRecommendedTypes,
  validateRelationshipType,
  getRelationshipTypeMetadata,
} from '@/types/relationship-guidance.types'

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  GitBranch,
  Handshake,
  Calendar,
  Clock,
  Link,
  UserPlus,
  UserCheck,
  Eye,
  Building2,
  GitCommitVertical,
  Briefcase,
  ArrowLeftRight,
  HeartHandshake,
  Network,
  MessageSquare,
  Home,
  Award,
  ArrowRight,
  ArrowLeft,
}

// ============================================================================
// Types
// ============================================================================

interface RelationshipTypeSelectorProps {
  value: DossierRelationshipType | ''
  onChange: (value: DossierRelationshipType) => void
  sourceDossierType: DossierType
  sourceDossierName?: string
  targetDossierType?: DossierType
  targetDossierName?: string
  disabled?: boolean
  error?: string
  className?: string
}

// ============================================================================
// Subcomponents
// ============================================================================

interface TypeVisualExampleProps {
  metadata: RelationshipTypeMetadata
  sourceName?: string
  targetName?: string
  isRTL: boolean
}

function TypeVisualExample({
  metadata,
  sourceName = 'Entity A',
  targetName = 'Entity B',
  isRTL,
}: TypeVisualExampleProps) {
  const Icon = ICON_MAP[metadata.icon] || Link

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-[10px] font-medium text-primary">A</span>
        </div>
        <span className="truncate max-w-[60px]">{sourceName}</span>
      </div>
      <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
        <div className="h-px w-4 bg-border" />
        <Icon className="h-3 w-3 text-primary shrink-0" />
        <div className="h-px w-4 bg-border" />
        {!metadata.isSymmetric && (
          <ArrowRight className={cn('h-3 w-3 text-primary shrink-0', isRTL && 'rotate-180')} />
        )}
      </div>
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center">
          <span className="text-[10px] font-medium text-secondary-foreground">B</span>
        </div>
        <span className="truncate max-w-[60px]">{targetName}</span>
      </div>
    </div>
  )
}

interface TypeCardProps {
  metadata: RelationshipTypeMetadata
  isSelected: boolean
  isRecommended: boolean
  onSelect: () => void
  sourceName?: string
  targetName?: string
  isRTL: boolean
}

function TypeCard({
  metadata,
  isSelected,
  isRecommended,
  onSelect,
  sourceName,
  targetName,
  isRTL,
}: TypeCardProps) {
  const { t } = useTranslation('relationships')
  const Icon = ICON_MAP[metadata.icon] || Link

  return (
    <CommandItem
      value={metadata.type}
      onSelect={onSelect}
      className={cn(
        'flex flex-col items-start gap-2 p-3 cursor-pointer',
        'border-b last:border-b-0',
        isSelected && 'bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted',
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{t(metadata.labelKey)}</span>
            {isRecommended && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                <Sparkles className="h-3 w-3" />
                <span>{t('guidance.recommended')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {metadata.isSymmetric && (
            <Badge variant="outline" className="text-[10px] px-1.5">
              {t('guidance.symmetric')}
            </Badge>
          )}
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground ps-10 line-clamp-2">
        {t(metadata.descriptionKey)}
      </p>

      <div className="ps-10 w-full">
        <TypeVisualExample
          metadata={metadata}
          sourceName={sourceName}
          targetName={targetName}
          isRTL={isRTL}
        />
      </div>

      {metadata.usageTipKey && (
        <div className="ps-10 flex items-start gap-1 text-xs text-blue-600 dark:text-blue-400">
          <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{t(metadata.usageTipKey)}</span>
        </div>
      )}
    </CommandItem>
  )
}

interface CategoryHeaderProps {
  category: (typeof RELATIONSHIP_CATEGORIES)[number]
  isRTL: boolean
}

function CategoryHeader({ category, isRTL }: CategoryHeaderProps) {
  const { t } = useTranslation('relationships')
  const Icon = ICON_MAP[category.icon] || Link

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{t(category.labelKey)}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side={isRTL ? 'left' : 'right'} className="max-w-[250px]">
            <p className="text-xs">{t(category.descriptionKey)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function RelationshipTypeSelector({
  value,
  onChange,
  sourceDossierType,
  sourceDossierName,
  targetDossierType,
  targetDossierName,
  disabled = false,
  error,
  className,
}: RelationshipTypeSelectorProps) {
  const { t, i18n } = useTranslation('relationships')
  const isRTL = i18n.language === 'ar'
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Get grouped types based on source/target
  const groupedTypes = useMemo(
    () => getGroupedRelationshipTypes(sourceDossierType, targetDossierType),
    [sourceDossierType, targetDossierType],
  )

  // Get recommended types
  const recommendedTypes = useMemo(
    () => getRecommendedTypes(sourceDossierType, targetDossierType),
    [sourceDossierType, targetDossierType],
  )

  // Current selection metadata
  const selectedMetadata = useMemo(
    () => (value ? getRelationshipTypeMetadata(value) : undefined),
    [value],
  )

  // Validation state
  const validation = useMemo(() => {
    if (!value) return null
    return validateRelationshipType(value, sourceDossierType, targetDossierType)
  }, [value, sourceDossierType, targetDossierType])

  // Handle selection
  const handleSelect = useCallback(
    (type: DossierRelationshipType) => {
      onChange(type)
      setOpen(false)
      setSearch('')
    },
    [onChange],
  )

  // Filter types by search
  const filterTypes = useCallback(
    (types: RelationshipTypeMetadata[]): RelationshipTypeMetadata[] => {
      if (!search) return types
      const searchLower = search.toLowerCase()
      return types.filter((m) => {
        const label = t(m.labelKey).toLowerCase()
        const description = t(m.descriptionKey).toLowerCase()
        return label.includes(searchLower) || description.includes(searchLower)
      })
    },
    [search, t],
  )

  // Get the display text for the selected type
  const selectedIcon = selectedMetadata ? ICON_MAP[selectedMetadata.icon] || Link : null
  const SelectedIconComponent = selectedIcon

  return (
    <div className={cn('flex flex-col gap-1', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'min-h-11 w-full justify-between',
              !value && 'text-muted-foreground',
              error && 'border-destructive',
              validation && !validation.isValid && 'border-amber-500',
            )}
          >
            <div className="flex items-center gap-2">
              {selectedMetadata && SelectedIconComponent && (
                <SelectedIconComponent className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {selectedMetadata ? t(selectedMetadata.labelKey) : t('form.selectType')}
              </span>
              {selectedMetadata && recommendedTypes.includes(selectedMetadata.type) && (
                <Sparkles className="h-3 w-3 text-amber-500" />
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 ms-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0 sm:w-[400px]"
          align={isRTL ? 'end' : 'start'}
          side="bottom"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('guidance.searchTypes')}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <ScrollArea className="h-[350px]">
                <CommandEmpty>{t('guidance.noTypesFound')}</CommandEmpty>

                {/* Recommended types section */}
                {recommendedTypes.length > 0 && !search && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-2 bg-amber-50 dark:bg-amber-950/30">
                      <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        {t('guidance.recommendedSection')}
                      </span>
                    </div>
                    <CommandGroup>
                      {filterTypes(
                        recommendedTypes
                          .map((type) => getRelationshipTypeMetadata(type))
                          .filter((m): m is RelationshipTypeMetadata => m !== undefined),
                      ).map((metadata) => (
                        <TypeCard
                          key={metadata.type}
                          metadata={metadata}
                          isSelected={value === metadata.type}
                          isRecommended={true}
                          onSelect={() => handleSelect(metadata.type)}
                          sourceName={sourceDossierName}
                          targetName={targetDossierName}
                          isRTL={isRTL}
                        />
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* All types by category */}
                {Array.from(groupedTypes.entries()).map(([categoryId, types], index) => {
                  const category = RELATIONSHIP_CATEGORIES.find((c) => c.id === categoryId)
                  if (!category) return null

                  const filteredTypes = filterTypes(types)
                  // Skip empty categories when searching
                  if (filteredTypes.length === 0) return null

                  // Skip types already shown in recommended section
                  const typesToShow = filteredTypes.filter(
                    (t) => search || !recommendedTypes.includes(t.type),
                  )
                  if (typesToShow.length === 0) return null

                  return (
                    <div key={categoryId}>
                      {index > 0 && <CommandSeparator />}
                      <CategoryHeader category={category} isRTL={isRTL} />
                      <CommandGroup>
                        {typesToShow.map((metadata) => (
                          <TypeCard
                            key={metadata.type}
                            metadata={metadata}
                            isSelected={value === metadata.type}
                            isRecommended={recommendedTypes.includes(metadata.type)}
                            onSelect={() => handleSelect(metadata.type)}
                            sourceName={sourceDossierName}
                            targetName={targetDossierName}
                            isRTL={isRTL}
                          />
                        ))}
                      </CommandGroup>
                    </div>
                  )
                })}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Validation warning */}
      {validation && !validation.isValid && (
        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span>{validation.warningKey && t(validation.warningKey)}</span>
            {validation.suggestedTypes && validation.suggestedTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span>{t('guidance.validation.tryInstead')}:</span>
                {validation.suggestedTypes.map((type) => {
                  const meta = getRelationshipTypeMetadata(type)
                  return meta ? (
                    <Badge
                      key={type}
                      variant="outline"
                      className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900"
                      onClick={() => handleSelect(type)}
                    >
                      {t(meta.labelKey)}
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

export default RelationshipTypeSelector
