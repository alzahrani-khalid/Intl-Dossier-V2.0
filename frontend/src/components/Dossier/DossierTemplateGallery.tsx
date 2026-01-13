/**
 * DossierTemplateGallery Component
 *
 * Displays a gallery of pre-configured dossier templates with thumbnail previews.
 * Users can browse templates by category and click to preview the full structure
 * before creating their first dossier.
 *
 * Features:
 * - Mobile-first responsive grid layout
 * - RTL support via logical properties
 * - Category filtering
 * - Animated hover effects
 * - Template preview dialog
 * - Touch-friendly UI (44x44px min targets)
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Map, FileText, Building2, Users, ChevronRight, Layers, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  DOSSIER_TEMPLATES,
  type DossierTemplate,
  type TemplateCategory,
} from '@/types/dossier-template.types'

// Icon mapping for templates
const templateIcons: Record<string, typeof Globe> = {
  Globe,
  Map,
  FileText,
  Building2,
  Users,
}

interface DossierTemplateGalleryProps {
  onSelectTemplate: (template: DossierTemplate) => void
  onStartFromScratch: () => void
  className?: string
}

/**
 * Template card component with hover preview
 */
function TemplateCard({
  template,
  onClick,
  isRTL,
}: {
  template: DossierTemplate
  onClick: () => void
  isRTL: boolean
}) {
  const { t } = useTranslation('dossier')
  const Icon = templateIcons[template.icon] || FileText
  const requiredCount = template.sections.filter((s) => s.required).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 overflow-hidden"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        aria-label={`${isRTL ? template.name_ar : template.name_en} - ${t('templates.card.clickToPreview')}`}
      >
        {/* Gradient header */}
        <div
          className={cn(
            'h-20 sm:h-24 relative overflow-hidden bg-gradient-to-br',
            template.thumbnail_color,
          )}
        >
          <div className="absolute inset-0 bg-black/10" />
          <Icon className="absolute end-3 bottom-3 h-10 w-10 sm:h-12 sm:w-12 text-white/30 group-hover:text-white/50 transition-colors" />
          {/* Section count badge */}
          <Badge
            variant="secondary"
            className="absolute top-3 start-3 bg-white/90 text-foreground text-xs"
          >
            {t('templates.card.sectionsCount', { count: template.sections.length })}
          </Badge>
        </div>

        <CardHeader className="p-3 sm:p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold line-clamp-1 text-start">
              {isRTL ? template.name_ar : template.name_en}
            </CardTitle>
            <ChevronRight
              className={cn(
                'h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors',
                isRTL && 'rotate-180',
              )}
            />
          </div>
          <CardDescription className="text-xs sm:text-sm line-clamp-2 text-start mt-1">
            {isRTL ? template.description_ar : template.description_en}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 pt-0">
          {/* Required sections indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            <span>
              {requiredCount} {t('templates.card.required')}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * Start from scratch card
 */
function StartFromScratchCard({ onClick, isRTL }: { onClick: () => void; isRTL: boolean }) {
  const { t } = useTranslation('dossier')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 border-dashed"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        aria-label={t('templates.gallery.startFromScratch')}
      >
        {/* Placeholder header */}
        <div className="h-20 sm:h-24 relative overflow-hidden bg-muted/50 flex items-center justify-center">
          <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
        </div>

        <CardHeader className="p-3 sm:p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold text-start">
              {t('templates.gallery.startFromScratch')}
            </CardTitle>
            <ChevronRight
              className={cn(
                'h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors',
                isRTL && 'rotate-180',
              )}
            />
          </div>
          <CardDescription className="text-xs sm:text-sm text-start mt-1">
            {t('templates.gallery.startFromScratchDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{t('create.selectTypeTitle')}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DossierTemplateGallery({
  onSelectTemplate,
  onStartFromScratch,
  className,
}: DossierTemplateGalleryProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'

  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') {
      return DOSSIER_TEMPLATES
    }
    return DOSSIER_TEMPLATES.filter((t) => t.category === selectedCategory)
  }, [selectedCategory])

  // Category options
  const categories: Array<{ value: TemplateCategory | 'all'; label: string }> = [
    { value: 'all', label: t('templates.category.all') },
    { value: 'bilateral', label: t('templates.category.bilateral') },
    { value: 'regional', label: t('templates.category.regional') },
    { value: 'thematic', label: t('templates.category.thematic') },
    { value: 'organizational', label: t('templates.category.organizational') },
  ]

  return (
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-start">
          {t('templates.gallery.title')}
        </h2>
        <p className="text-sm text-muted-foreground text-start mt-1">
          {t('templates.gallery.description')}
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as TemplateCategory | 'all')}
        className="mb-4 sm:mb-6"
      >
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 justify-start">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className="min-h-9 sm:min-h-10 px-3 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Template Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        data-testid="template-gallery-grid"
      >
        {/* Start from scratch option */}
        <StartFromScratchCard onClick={onStartFromScratch} isRTL={isRTL} />

        {/* Template cards */}
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => onSelectTemplate(template)}
              isRTL={isRTL}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t('templates.empty.title')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('templates.empty.description')}</p>
        </div>
      )}
    </div>
  )
}

export default DossierTemplateGallery
