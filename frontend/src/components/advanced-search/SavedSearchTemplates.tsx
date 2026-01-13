/**
 * SavedSearchTemplates Component
 * Feature: advanced-search-filters
 * Description: Display and manage saved search templates
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  FileText,
  FolderOpen,
  Shield,
  Calendar,
  History,
  Star,
  Trash2,
  Edit,
  Check,
  X,
  ChevronRight,
  Users,
  User,
  Globe,
  Building,
  Tag,
  File,
  Bookmark,
  Filter,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  useQuickTemplates,
  usePopularTemplates,
  useDeleteTemplate,
  getTemplateColorClasses,
} from '@/hooks/useSavedSearchTemplates'
import type { SearchTemplate, TemplateDefinition } from '@/types/advanced-search.types'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  search: Search,
  'file-text': FileText,
  'folder-open': FolderOpen,
  shield: Shield,
  calendar: Calendar,
  history: History,
  file: File,
  folder: FolderOpen,
  users: Users,
  user: User,
  globe: Globe,
  building: Building,
  tag: Tag,
  star: Star,
  bookmark: Bookmark,
  filter: Filter,
  clock: Clock,
}

interface SavedSearchTemplatesProps {
  onApply: (template: TemplateDefinition) => void
  className?: string
}

export function SavedSearchTemplates({ onApply, className }: SavedSearchTemplatesProps) {
  const { t, i18n } = useTranslation('advanced-search')
  const isRTL = i18n.language === 'ar'

  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)

  const { data: quickTemplates, isLoading: loadingQuick } = useQuickTemplates()
  const { data: popularTemplates, isLoading: loadingPopular } = usePopularTemplates()
  const deleteTemplate = useDeleteTemplate()

  const handleApply = (template: SearchTemplate) => {
    onApply(template.template_definition)
  }

  const handleDelete = async () => {
    if (deleteTemplateId) {
      await deleteTemplate.mutateAsync(deleteTemplateId)
      setDeleteTemplateId(null)
    }
  }

  const renderTemplateCard = (template: SearchTemplate) => {
    const IconComponent = iconMap[template.icon] || Search
    const colorClasses = getTemplateColorClasses(template.color)

    return (
      <button
        key={template.id}
        type="button"
        onClick={() => handleApply(template)}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border text-start w-full min-h-16 transition-all',
          colorClasses.border,
          colorClasses.bg,
          colorClasses.hover,
        )}
      >
        <div className={cn('p-2 rounded-lg shrink-0', colorClasses.bg)}>
          <IconComponent className={cn('h-4 w-4', colorClasses.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {isRTL ? template.name_ar : template.name_en}
          </h4>
          {(template.description_en || template.description_ar) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {isRTL ? template.description_ar : template.description_en}
            </p>
          )}
          {template.use_count > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('templates.useCount', { count: template.use_count })}
            </p>
          )}
        </div>

        <ChevronRight
          className={cn('h-4 w-4 text-gray-400 shrink-0 self-center', isRTL && 'rotate-180')}
        />
      </button>
    )
  }

  const renderSkeletons = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </>
  )

  return (
    <div className={cn('flex flex-col gap-6', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Quick Templates */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          {t('templates.quick')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loadingQuick ? (
            renderSkeletons(4)
          ) : quickTemplates?.data && quickTemplates.data.length > 0 ? (
            quickTemplates.data.map(renderTemplateCard)
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2">
              {t('templates.noTemplates')}
            </p>
          )}
        </div>
      </section>

      {/* Popular Templates */}
      <section>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          {t('templates.popular')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loadingPopular ? (
            renderSkeletons(4)
          ) : popularTemplates?.data && popularTemplates.data.length > 0 ? (
            popularTemplates.data.map(renderTemplateCard)
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2">
              {t('templates.noTemplates')}
            </p>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('templates.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('templates.deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('templates.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SavedSearchTemplates
