/**
 * DocumentEmptyState Component
 * Large drag-drop upload area with file type icons and size limits
 * Shows recent document templates relevant to entity type with one-click attachment
 * Mobile-first responsive design with RTL support
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Plus,
  Sparkles,
  ChevronRight,
  Globe,
  Users,
  Clipboard,
  BookOpen,
  FileSignature,
  Target,
  AlertCircle,
} from 'lucide-react'
import type { DocumentTemplate, DocumentTemplateCategory } from '@/types/document-template.types'
import type { DossierType } from '@/types/dossier'

// File type configurations
const FILE_TYPES = [
  {
    extension: 'PDF',
    icon: FileText,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    mimeTypes: ['application/pdf'],
  },
  {
    extension: 'DOCX',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ],
  },
  {
    extension: 'XLSX',
    icon: FileSpreadsheet,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  },
  {
    extension: 'PNG/JPG',
    icon: FileImage,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  },
]

// Template category icons
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

// Template category colors
const categoryColors: Record<DocumentTemplateCategory, string> = {
  country_profile: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  policy_brief: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  engagement_report: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  meeting_notes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  position_paper: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  mou_summary: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  strategic_analysis: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
}

// Map entity types to relevant template categories
const entityTemplateMap: Record<DossierType | string, DocumentTemplateCategory[]> = {
  country: ['country_profile', 'policy_brief', 'engagement_report', 'strategic_analysis'],
  organization: ['engagement_report', 'mou_summary', 'meeting_notes', 'position_paper'],
  forum: ['meeting_notes', 'position_paper', 'engagement_report', 'strategic_analysis'],
  theme: ['policy_brief', 'strategic_analysis', 'position_paper'],
  engagement: ['meeting_notes', 'engagement_report'],
  dossier: ['country_profile', 'policy_brief', 'engagement_report', 'meeting_notes'],
}

interface DocumentEmptyStateProps {
  /** Entity type for template suggestions */
  entityType: string
  /** Entity ID for linking documents */
  entityId: string
  /** Entity name for display */
  entityName?: string
  /** Called when files are dropped/selected */
  onFilesSelected: (files: File[]) => void
  /** Called when a template is selected */
  onTemplateSelect?: (template: DocumentTemplate) => void
  /** Available templates for this entity type */
  templates?: DocumentTemplate[]
  /** Maximum file size in MB */
  maxFileSizeMB?: number
  /** Maximum total size in MB */
  maxTotalSizeMB?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Additional CSS classes */
  className?: string
}

export function DocumentEmptyState({
  entityType,
  entityId: _entityId, // Used for future linking
  entityName,
  onFilesSelected,
  onTemplateSelect,
  templates = [],
  maxFileSizeMB = 25,
  maxTotalSizeMB = 100,
  maxFiles = 10,
  className,
}: DocumentEmptyStateProps) {
  const { t, i18n } = useTranslation('document-templates')
  const { t: tCommon } = useTranslation('common')
  const isRTL = i18n.language === 'ar'

  const [dragError, setDragError] = useState<string | null>(null)

  // Get accepted MIME types from FILE_TYPES
  const acceptedMimeTypes = FILE_TYPES.flatMap((ft) => ft.mimeTypes)
  const accept = acceptedMimeTypes.reduce(
    (acc, mime) => {
      acc[mime] = []
      return acc
    },
    {} as Record<string, string[]>,
  )

  const onDrop = useCallback(
    (
      acceptedFiles: File[],
      fileRejections: Array<{ file: File; errors: Array<{ code: string }> }>,
    ) => {
      setDragError(null)

      if (fileRejections.length > 0) {
        const errors = fileRejections[0]?.errors || []
        if (errors.some((e) => e.code === 'file-too-large')) {
          setDragError(t('validation.fileTooLarge', { max: maxFileSizeMB }))
        } else if (errors.some((e) => e.code === 'file-invalid-type')) {
          setDragError(t('validation.invalidFileType'))
        } else if (errors.some((e) => e.code === 'too-many-files')) {
          setDragError(tCommon('errors.tooManyFiles', { max: maxFiles }))
        }
        return
      }

      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles)
      }
    },
    [onFilesSelected, maxFileSizeMB, maxFiles, t, tCommon],
  )

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onDrop: onDrop as any,
    accept,
    maxSize: maxFileSizeMB * 1024 * 1024,
    maxFiles,
    multiple: true,
  })

  // Get suggested templates based on entity type
  const suggestedCategories = entityTemplateMap[entityType] || entityTemplateMap.dossier || []
  const suggestedTemplates = templates
    .filter((tmpl) => suggestedCategories.includes(tmpl.category))
    .slice(0, 4)

  // Mock templates if none provided (for demo purposes)
  const displayTemplates =
    suggestedTemplates.length > 0
      ? suggestedTemplates
      : (suggestedCategories || []).slice(0, 4).map((category, index) => ({
          id: `mock-${index}`,
          name_en: t(`categories.${category}`),
          name_ar: t(`categories.${category}`),
          category,
          icon: category,
          color: categoryColors[category],
          target_entity_types: [entityType],
          status: 'published' as const,
          is_system_template: true,
          version: 1,
          default_classification: 'internal' as const,
          output_format: 'docx' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

  return (
    <div className={cn('space-y-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Main Drag & Drop Area */}
      <Card
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer overflow-hidden transition-all duration-300',
          'border-2 border-dashed',
          isDragActive && 'border-primary bg-primary/5',
          isDragAccept && 'border-green-500 bg-green-50 dark:bg-green-950/20',
          isDragReject && 'border-red-500 bg-red-50 dark:bg-red-950/20',
          !isDragActive && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
        )}
      >
        <input {...getInputProps()} />

        <CardContent className="flex flex-col items-center justify-center py-12 px-4 sm:py-16 sm:px-8 lg:py-20">
          {/* Animated Upload Icon */}
          <motion.div
            animate={{
              y: isDragActive ? -8 : 0,
              scale: isDragActive ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full',
              'bg-primary/10 dark:bg-primary/20',
            )}
          >
            <Upload
              className={cn(
                'h-8 w-8 sm:h-10 sm:w-10',
                isDragActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </motion.div>

          {/* Title & Description */}
          <h3 className="mb-2 text-center text-lg font-semibold sm:text-xl">
            {isDragActive
              ? isRTL
                ? 'أفلت الملفات هنا'
                : 'Drop files here'
              : isRTL
                ? 'اسحب وأفلت الملفات'
                : 'Drag & drop files'}
          </h3>

          <p className="mb-6 max-w-md text-center text-sm text-muted-foreground sm:text-base">
            {isRTL
              ? 'اسحب الملفات إلى هنا أو انقر للتصفح. يمكنك رفع عدة ملفات في وقت واحد.'
              : 'Drag files here or click to browse. You can upload multiple files at once.'}
          </p>

          {/* Error Message */}
          <AnimatePresence>
            {dragError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{dragError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Type Icons */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {FILE_TYPES.map((fileType) => (
              <motion.div
                key={fileType.extension}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-2 sm:p-3',
                  fileType.bgColor,
                )}
              >
                <fileType.icon className={cn('h-6 w-6 sm:h-7 sm:w-7', fileType.color)} />
                <span className="text-xs font-medium text-muted-foreground">
                  {fileType.extension}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Size Limits */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
            <Badge variant="outline" className="font-normal">
              {isRTL
                ? `الحد الأقصى للملف: ${maxFileSizeMB} ميجابايت`
                : `Max file: ${maxFileSizeMB}MB`}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {isRTL
                ? `الحد الأقصى الإجمالي: ${maxTotalSizeMB} ميجابايت`
                : `Max total: ${maxTotalSizeMB}MB`}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {isRTL ? `حتى ${maxFiles} ملفات` : `Up to ${maxFiles} files`}
            </Badge>
          </div>

          {/* Browse Button */}
          <Button className="mt-6 min-h-11 min-w-11" size="lg">
            <Upload className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {isRTL ? 'تصفح الملفات' : 'Browse Files'}
          </Button>
        </CardContent>
      </Card>

      {/* Template Suggestions Section */}
      {displayTemplates.length > 0 && onTemplateSelect && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base sm:text-lg">
                {isRTL ? 'قوالب مقترحة' : 'Suggested Templates'}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              {isRTL
                ? `قوالب مستندات مناسبة لـ ${entityName || entityType}`
                : `Document templates relevant to ${entityName || entityType}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {displayTemplates.map((template) => {
                const Icon = categoryIcons[template.category] || File
                const colorClass = categoryColors[template.category] || categoryColors.custom
                const name = isRTL ? template.name_ar : template.name_en

                return (
                  <motion.button
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTemplateSelect(template)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-start',
                      'transition-colors hover:bg-muted/50 hover:border-primary/50',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        colorClass,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? 'انقر للاستخدام' : 'Click to use'}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground',
                        isRTL && 'rotate-180',
                      )}
                    />
                  </motion.button>
                )
              })}
            </div>

            {/* View All Templates Link */}
            <Separator className="my-4" />
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Navigate to template selection
                  if (onTemplateSelect && displayTemplates[0]) {
                    onTemplateSelect(displayTemplates[0])
                  }
                }}
              >
                {isRTL ? 'عرض جميع القوالب' : 'View all templates'}
                <ChevronRight className={cn('h-4 w-4', isRTL ? 'me-1 rotate-180' : 'ms-1')} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DocumentEmptyState
