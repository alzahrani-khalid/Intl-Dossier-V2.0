/**
 * TemplateCard Component
 * Displays a document template card with category icon, description, and selection
 * Mobile-first responsive design with RTL support
 */

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Globe,
  FileText,
  Users,
  Clipboard,
  BookOpen,
  FileSignature,
  Target,
  Plus,
  Check,
  Lock,
} from 'lucide-react'
import type { DocumentTemplate, DocumentTemplateCategory } from '@/types/document-template.types'

interface TemplateCardProps {
  template: DocumentTemplate
  onSelect: (template: DocumentTemplate) => void
  isSelected?: boolean
  disabled?: boolean
}

// Icon mapping for categories
const categoryIcons: Record<
  DocumentTemplateCategory,
  React.ComponentType<{ className?: string }>
> = {
  country_profile: Globe,
  policy_brief: FileText,
  engagement_report: Users,
  meeting_notes: Clipboard,
  position_paper: BookOpen,
  mou_summary: FileSignature,
  strategic_analysis: Target,
  custom: Plus,
}

// Color mapping for categories
const categoryColors: Record<DocumentTemplateCategory, string> = {
  country_profile: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  policy_brief: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  engagement_report: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  meeting_notes: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  position_paper: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  mou_summary: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  strategic_analysis: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
}

export function TemplateCard({ template, onSelect, isSelected, disabled }: TemplateCardProps) {
  const { t, i18n } = useTranslation('document-templates')
  const isRTL = i18n.language === 'ar'

  const Icon = categoryIcons[template.category] || FileText
  const colorClass = categoryColors[template.category] || categoryColors.custom

  const name = isRTL ? template.name_ar : template.name_en
  const description = isRTL ? template.description_ar : template.description_en

  const handleSelect = () => {
    if (!disabled) {
      onSelect(template)
    }
  }

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/50',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
        isSelected && 'border-primary border-2 shadow-md',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSelect()
        }
      }}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-pressed={isSelected}
      aria-disabled={disabled}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 end-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div
            className={cn(
              'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg',
              colorClass,
            )}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg line-clamp-1">{name}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {template.is_system_template && (
                <Badge variant="secondary" className="text-xs">
                  {t('templates.systemTemplate')}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {t(`categories.${template.category}`)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {description && (
          <CardDescription className="text-sm line-clamp-2 mb-3">{description}</CardDescription>
        )}

        {/* Target entity types */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.target_entity_types.slice(0, 3).map((type) => (
            <Badge key={type} variant="outline" className="text-xs">
              {t(`entityTypes.${type}`, type)}
            </Badge>
          ))}
          {template.target_entity_types.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.target_entity_types.length - 3}
            </Badge>
          )}
        </div>

        {/* Classification indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>{t(`classification.${template.default_classification}`)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default TemplateCard
