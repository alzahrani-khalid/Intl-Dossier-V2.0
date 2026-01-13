/**
 * SavedViewsManager Component
 *
 * UI component for managing saved views, including creating, editing,
 * deleting, pinning, and setting default views.
 *
 * Mobile-first, RTL-compatible design following project guidelines.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Check,
  Edit2,
  Pin,
  PinOff,
  Plus,
  Save,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SavedView, ViewConfig } from '@/types/view-preferences.types'

interface SavedViewsManagerProps {
  savedViews: SavedView[]
  currentViewConfig: ViewConfig
  hasUnsavedChanges: boolean
  isLoading?: boolean
  onApplyView: (viewConfig: ViewConfig) => void
  onCreateView: (input: {
    name: string
    description?: string
    is_default?: boolean
    is_pinned?: boolean
    view_config: ViewConfig
  }) => Promise<SavedView>
  onUpdateView: (input: {
    id: string
    name?: string
    description?: string
    is_default?: boolean
    is_pinned?: boolean
    view_config?: ViewConfig
  }) => Promise<SavedView>
  onDeleteView: (id: string) => Promise<void>
  onSetDefault: (id: string | null) => Promise<void>
  onTogglePinned: (id: string) => Promise<void>
  onSaveCurrentAsDefault: () => Promise<void>
}

export function SavedViewsManager({
  savedViews,
  currentViewConfig,
  hasUnsavedChanges,
  isLoading,
  onApplyView,
  onCreateView,
  onUpdateView,
  onDeleteView,
  onSetDefault,
  onTogglePinned,
  onSaveCurrentAsDefault,
}: SavedViewsManagerProps) {
  const { t, i18n } = useTranslation('view-preferences')
  const isRTL = i18n.language === 'ar'

  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedView, setSelectedView] = useState<SavedView | null>(null)

  // Form state
  const [viewName, setViewName] = useState('')
  const [viewDescription, setViewDescription] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [pinView, setPinView] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Get current applied view
  const currentView = savedViews.find(
    (v) => JSON.stringify(v.view_config) === JSON.stringify(currentViewConfig),
  )
  const defaultView = savedViews.find((v) => v.is_default)
  const pinnedViews = savedViews.filter((v) => v.is_pinned)

  // Reset form
  const resetForm = useCallback(() => {
    setViewName('')
    setViewDescription('')
    setSetAsDefault(false)
    setPinView(false)
    setSelectedView(null)
  }, [])

  // Open save dialog
  const handleOpenSaveDialog = useCallback(() => {
    resetForm()
    setSaveDialogOpen(true)
  }, [resetForm])

  // Open edit dialog
  const handleOpenEditDialog = useCallback((view: SavedView) => {
    setSelectedView(view)
    setViewName(view.name)
    setViewDescription(view.description || '')
    setSetAsDefault(view.is_default)
    setPinView(view.is_pinned)
    setEditDialogOpen(true)
  }, [])

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((view: SavedView) => {
    setSelectedView(view)
    setDeleteDialogOpen(true)
  }, [])

  // Save new view
  const handleSaveView = useCallback(async () => {
    if (!viewName.trim()) return

    setIsSaving(true)
    try {
      await onCreateView({
        name: viewName.trim(),
        description: viewDescription.trim() || undefined,
        is_default: setAsDefault,
        is_pinned: pinView,
        view_config: currentViewConfig,
      })
      setSaveDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving view:', error)
    } finally {
      setIsSaving(false)
    }
  }, [viewName, viewDescription, setAsDefault, pinView, currentViewConfig, onCreateView, resetForm])

  // Update existing view
  const handleUpdateView = useCallback(async () => {
    if (!selectedView || !viewName.trim()) return

    setIsSaving(true)
    try {
      await onUpdateView({
        id: selectedView.id,
        name: viewName.trim(),
        description: viewDescription.trim() || undefined,
        is_default: setAsDefault,
        is_pinned: pinView,
      })
      setEditDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error updating view:', error)
    } finally {
      setIsSaving(false)
    }
  }, [selectedView, viewName, viewDescription, setAsDefault, pinView, onUpdateView, resetForm])

  // Delete view
  const handleDeleteView = useCallback(async () => {
    if (!selectedView) return

    setIsSaving(true)
    try {
      await onDeleteView(selectedView.id)
      setDeleteDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error deleting view:', error)
    } finally {
      setIsSaving(false)
    }
  }, [selectedView, onDeleteView, resetForm])

  // Update current view with latest config
  const handleUpdateCurrentView = useCallback(async () => {
    if (!currentView) return

    setIsSaving(true)
    try {
      await onUpdateView({
        id: currentView.id,
        view_config: currentViewConfig,
      })
    } catch (error) {
      console.error('Error updating view:', error)
    } finally {
      setIsSaving(false)
    }
  }, [currentView, currentViewConfig, onUpdateView])

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Quick pinned views */}
      {pinnedViews.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {pinnedViews.slice(0, 3).map((view) => (
            <Button
              key={view.id}
              variant={currentView?.id === view.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onApplyView(view.view_config)}
              className={cn('h-8 px-3 text-xs', 'rounded-lg', 'transition-all duration-150')}
            >
              {view.is_default && <Star className={cn('h-3 w-3', isRTL ? 'ms-1.5' : 'me-1.5')} />}
              {view.name}
            </Button>
          ))}
        </div>
      )}

      {/* Views dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 px-3',
              'rounded-xl',
              'bg-white/40 border border-black/5',
              'hover:bg-white/60 hover:border-black/10',
              'shadow-sm hover:shadow-md',
              'transition-all duration-150',
            )}
            disabled={isLoading}
          >
            <Bookmark className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            <span className="hidden sm:inline">{t('savedViews', 'Saved Views')}</span>
            <span className="sm:hidden">{t('views', 'Views')}</span>
            {savedViews.length > 0 && (
              <Badge variant="secondary" className={cn('text-xs', isRTL ? 'me-2' : 'ms-2')}>
                {savedViews.length}
              </Badge>
            )}
            <ChevronDown className={cn('h-4 w-4', isRTL ? 'me-1' : 'ms-1')} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-72 sm:w-80">
          {/* Current state actions */}
          {hasUnsavedChanges && (
            <>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {t('unsavedChanges', 'You have unsaved changes')}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 h-8 text-xs"
                    onClick={handleOpenSaveDialog}
                  >
                    <Plus className={cn('h-3 w-3', isRTL ? 'ms-1' : 'me-1')} />
                    {t('saveAsNew', 'Save as New')}
                  </Button>
                  {currentView && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={handleUpdateCurrentView}
                      disabled={isSaving}
                    >
                      <Save className={cn('h-3 w-3', isRTL ? 'ms-1' : 'me-1')} />
                      {t('update', 'Update')}
                    </Button>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Saved views list */}
          {savedViews.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <BookmarkCheck className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('noSavedViews', 'No saved views yet')}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {t(
                  'noSavedViewsHint',
                  'Save your current filters and sort settings for quick access',
                )}
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 cursor-pointer',
                    currentView?.id === view.id && 'bg-accent',
                  )}
                  onSelect={(e) => {
                    e.preventDefault()
                    onApplyView(view.view_config)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {currentView?.id === view.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{view.name}</span>
                        {view.is_default && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
                        {view.is_pinned && <Pin className="h-3 w-3 text-blue-500 shrink-0" />}
                      </div>
                      {view.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {view.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        onTogglePinned(view.id)
                      }}
                      title={view.is_pinned ? t('unpin', 'Unpin') : t('pin', 'Pin')}
                    >
                      {view.is_pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!view.is_default) {
                          onSetDefault(view.id)
                        }
                      }}
                      disabled={view.is_default}
                      title={
                        view.is_default
                          ? t('isDefault', 'Default view')
                          : t('setDefault', 'Set as default')
                      }
                    >
                      {view.is_default ? (
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      ) : (
                        <StarOff className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenEditDialog(view)
                      }}
                      title={t('edit', 'Edit')}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDeleteDialog(view)
                      }}
                      title={t('delete', 'Delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}

          <DropdownMenuSeparator />

          {/* Save current view button */}
          <div className="p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9"
              onClick={handleOpenSaveDialog}
            >
              <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
              {t('saveCurrentView', 'Save Current View')}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save View Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('saveView', 'Save View')}</DialogTitle>
            <DialogDescription>
              {t(
                'saveViewDescription',
                'Save your current filters and settings as a named view for quick access.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="view-name" className="text-sm font-medium">
                {t('viewName', 'View Name')} *
              </label>
              <Input
                id="view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder={t('viewNamePlaceholder', 'e.g., Active Countries')}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="view-description" className="text-sm font-medium">
                {t('description', 'Description')}
              </label>
              <Textarea
                id="view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder', 'Optional description...')}
                rows={2}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{t('setAsDefault', 'Set as default')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinView}
                  onChange={(e) => setPinView(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{t('pinToQuickAccess', 'Pin to quick access')}</span>
              </label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSaveView}
              disabled={!viewName.trim() || isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? t('saving', 'Saving...') : t('save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit View Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('editView', 'Edit View')}</DialogTitle>
            <DialogDescription>
              {t('editViewDescription', 'Update the name and settings for this saved view.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-view-name" className="text-sm font-medium">
                {t('viewName', 'View Name')} *
              </label>
              <Input
                id="edit-view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-view-description" className="text-sm font-medium">
                {t('description', 'Description')}
              </label>
              <Textarea
                id="edit-view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{t('setAsDefault', 'Set as default')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinView}
                  onChange={(e) => setPinView(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">{t('pinToQuickAccess', 'Pin to quick access')}</span>
              </label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {t('cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleUpdateView}
              disabled={!viewName.trim() || isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? t('saving', 'Saving...') : t('saveChanges', 'Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteView', 'Delete View')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'deleteViewConfirmation',
                'Are you sure you want to delete "{{name}}"? This action cannot be undone.',
                {
                  name: selectedView?.name,
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {t('cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteView}
              disabled={isSaving}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
            >
              {isSaving ? t('deleting', 'Deleting...') : t('delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SavedViewsManager
