/**
 * SaveSearchDialog Component
 * Feature: saved-searches-feature
 * Description: Dialog for creating and editing saved searches
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  User,
  Users,
  Building,
  Globe,
  Clock,
  Sparkles,
  Filter,
  Star,
  Bell,
  FileText,
  Folder,
  Tag,
  Calendar,
  History,
  Shield,
  File,
  Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  useCreateSavedSearch,
  useUpdateSavedSearch,
  getSavedSearchColorClasses,
} from '@/hooks/useSavedSearches'
import type {
  SavedSearch,
  CreateSavedSearchRequest,
  UpdateSavedSearchRequest,
  SavedSearchCategory,
  SavedSearchDefinition,
} from '@/types/saved-search.types'
import { SAVED_SEARCH_COLORS, SAVED_SEARCH_CATEGORIES } from '@/types/saved-search.types'

// Icon options
const ICON_OPTIONS = [
  { value: 'search', label: 'Search', icon: Search },
  { value: 'filter', label: 'Filter', icon: Filter },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'bookmark', label: 'Bookmark', icon: Bookmark },
  { value: 'user', label: 'User', icon: User },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'building', label: 'Building', icon: Building },
  { value: 'globe', label: 'Globe', icon: Globe },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'file', label: 'File', icon: File },
  { value: 'file-text', label: 'Document', icon: FileText },
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'tag', label: 'Tag', icon: Tag },
  { value: 'history', label: 'History', icon: History },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'bell', label: 'Bell', icon: Bell },
]

interface SaveSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchDefinition: SavedSearchDefinition
  editingSearch?: SavedSearch | null
  onSuccess?: (search: SavedSearch) => void
}

export function SaveSearchDialog({
  open,
  onOpenChange,
  searchDefinition,
  editingSearch,
  onSuccess,
}: SaveSearchDialogProps) {
  const { t, i18n } = useTranslation('saved-searches')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [icon, setIcon] = useState('search')
  const [color, setColor] = useState('blue')
  const [category, setCategory] = useState<SavedSearchCategory>('personal')
  const [isPinned, setIsPinned] = useState(false)

  // Mutations
  const createMutation = useCreateSavedSearch()
  const updateMutation = useUpdateSavedSearch()

  // Reset form when dialog opens or editingSearch changes
  useEffect(() => {
    if (open) {
      if (editingSearch) {
        setNameEn(editingSearch.name_en)
        setNameAr(editingSearch.name_ar)
        setDescriptionEn(editingSearch.description_en || '')
        setDescriptionAr(editingSearch.description_ar || '')
        setIcon(editingSearch.icon)
        setColor(editingSearch.color)
        setCategory(editingSearch.category)
        setIsPinned(editingSearch.is_pinned)
      } else {
        setNameEn('')
        setNameAr('')
        setDescriptionEn('')
        setDescriptionAr('')
        setIcon('search')
        setColor('blue')
        setCategory('personal')
        setIsPinned(false)
      }
    }
  }, [open, editingSearch])

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameAr.trim()) return

    try {
      if (editingSearch) {
        // Update existing
        const updateData: UpdateSavedSearchRequest = {
          name_en: nameEn,
          name_ar: nameAr,
          description_en: descriptionEn || undefined,
          description_ar: descriptionAr || undefined,
          icon,
          color,
          category,
          is_pinned: isPinned,
          search_definition: searchDefinition,
        }
        const result = await updateMutation.mutateAsync({
          id: editingSearch.id,
          data: updateData,
        })
        onSuccess?.(result.data)
      } else {
        // Create new
        const createData: CreateSavedSearchRequest = {
          name_en: nameEn,
          name_ar: nameAr,
          description_en: descriptionEn || undefined,
          description_ar: descriptionAr || undefined,
          icon,
          color,
          search_definition: searchDefinition,
          category,
          is_pinned: isPinned,
        }
        const result = await createMutation.mutateAsync(createData)
        onSuccess?.(result.data)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Save search error:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const isValid = nameEn.trim() && nameAr.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {editingSearch ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Name (English) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name-en">{t('dialog.nameEn')}</Label>
            <Input
              id="name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t('dialog.nameEnPlaceholder')}
              required
            />
          </div>

          {/* Name (Arabic) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name-ar">{t('dialog.nameAr')}</Label>
            <Input
              id="name-ar"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t('dialog.nameArPlaceholder')}
              dir="rtl"
              required
            />
          </div>

          {/* Description (English) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc-en">{t('dialog.descriptionEn')}</Label>
            <Textarea
              id="desc-en"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder={t('dialog.descriptionEnPlaceholder')}
              rows={2}
            />
          </div>

          {/* Description (Arabic) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc-ar">{t('dialog.descriptionAr')}</Label>
            <Textarea
              id="desc-ar"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder={t('dialog.descriptionArPlaceholder')}
              dir="rtl"
              rows={2}
            />
          </div>

          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div className="flex flex-col gap-2">
              <Label>{t('dialog.icon')}</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComp = ICON_OPTIONS.find((o) => o.value === icon)?.icon || Search
                        return <IconComp className="h-4 w-4" />
                      })()}
                      <span>{ICON_OPTIONS.find((o) => o.value === icon)?.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-2">
              <Label>{t('dialog.color')}</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-4 w-4 rounded-full',
                          getSavedSearchColorClasses(color).bg,
                          getSavedSearchColorClasses(color).border,
                          'border',
                        )}
                      />
                      <span>
                        {isRTL
                          ? SAVED_SEARCH_COLORS.find((c) => c.value === color)?.label_ar
                          : SAVED_SEARCH_COLORS.find((c) => c.value === color)?.label_en}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SAVED_SEARCH_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full',
                            getSavedSearchColorClasses(c.value).bg,
                            getSavedSearchColorClasses(c.value).border,
                            'border',
                          )}
                        />
                        <span>{isRTL ? c.label_ar : c.label_en}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label>{t('dialog.category')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as SavedSearchCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAVED_SEARCH_CATEGORIES.filter((c) => c.value !== 'smart').map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {isRTL ? cat.label_ar : cat.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="pin-toggle">{t('dialog.pinToTop')}</Label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('dialog.pinToTopDescription')}
              </span>
            </div>
            <Switch id="pin-toggle" checked={isPinned} onCheckedChange={setIsPinned} />
          </div>

          {/* Search preview */}
          <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 p-3">
            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
              {t('dialog.searchPreview')}
            </Label>
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', getSavedSearchColorClasses(color).bg)}>
                {(() => {
                  const IconComp = ICON_OPTIONS.find((o) => o.value === icon)?.icon || Search
                  return (
                    <IconComp className={cn('h-4 w-4', getSavedSearchColorClasses(color).text)} />
                  )
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {(isRTL ? nameAr : nameEn) || t('dialog.untitled')}
                </p>
                {searchDefinition.query && (
                  <p className="text-xs text-gray-500 truncate">
                    {t('dialog.queryPrefix')}: {searchDefinition.query}
                  </p>
                )}
                {searchDefinition.entity_types && searchDefinition.entity_types.length > 0 && (
                  <p className="text-xs text-gray-500 truncate">
                    {t('dialog.entityTypes')}: {searchDefinition.entity_types.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('dialog.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? t('dialog.saving') : editingSearch ? t('dialog.save') : t('dialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SaveSearchDialog
