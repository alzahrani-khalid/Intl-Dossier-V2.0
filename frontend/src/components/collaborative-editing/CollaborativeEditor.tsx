/**
 * CollaborativeEditor Component
 *
 * Main component for real-time collaborative editing with:
 * - Active editor presence display
 * - Track changes with authorship
 * - Suggestions panel with accept/reject workflow
 * - Inline comments with threading
 * - Settings for enabling/disabling features
 * Mobile-first with RTL support.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  Users,
  MessageSquare,
  History,
  Lightbulb,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useCollaborativeEditing,
  type ActiveEditor,
  type SuggestionWithAuthor,
  type TrackChangeWithAuthor,
  type InlineCommentWithAuthor,
} from '@/hooks/useCollaborativeEditing'
import { ActiveEditorAvatars, ActiveEditorBadge } from './ActiveEditorAvatars'
import { SuggestionPanel } from './SuggestionPanel'
import { TrackChangesOverlay } from './TrackChangesOverlay'
import { InlineCommentMarker, CommentIndicator } from './InlineCommentMarker'
import type { CollaborativeEditorProps } from '@/types/collaborative-editing.types'

export function CollaborativeEditor({
  documentId,
  documentVersionId,
  initialContent = '',
  readOnly = false,
  className,
  onContentChange,
  onSave,
}: CollaborativeEditorProps) {
  const { t, i18n } = useTranslation('collaborative-editing')
  const isRTL = i18n.language === 'ar'

  const [content, setContent] = useState(initialContent)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'changes' | 'comments'>('suggestions')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    session,
    activeEditors,
    suggestions,
    trackChanges,
    inlineComments,
    summary,
    isConnected,
    isLoading,
    error,
    resolveSuggestion,
    acceptChange,
    rejectChange,
    acceptAllChanges,
    rejectAllChanges,
    createInlineComment,
    resolveInlineComment,
    toggleTrackChanges,
    toggleSuggestions,
    lockDocument,
    unlockDocument,
  } = useCollaborativeEditing({
    documentId,
    documentVersionId,
    autoJoin: !readOnly,
  })

  // Computed values
  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => s.status === 'pending'),
    [suggestions],
  )

  const pendingChanges = useMemo(
    () => trackChanges.filter((c) => c.isAccepted === null),
    [trackChanges],
  )

  const openComments = useMemo(
    () => inlineComments.filter((c) => c.status === 'open'),
    [inlineComments],
  )

  const totalPending = pendingSuggestions.length + pendingChanges.length + openComments.length

  // Handlers
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setContent(newContent)
      onContentChange?.(newContent)
    },
    [onContentChange],
  )

  const handleSave = useCallback(async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      await onSave(content)
    } finally {
      setIsSaving(false)
    }
  }, [content, onSave])

  const handleAcceptSuggestion = useCallback(
    async (suggestionId: string, comment?: string) => {
      await resolveSuggestion(suggestionId, true, comment)
    },
    [resolveSuggestion],
  )

  const handleRejectSuggestion = useCallback(
    async (suggestionId: string, comment?: string) => {
      await resolveSuggestion(suggestionId, false, comment)
    },
    [resolveSuggestion],
  )

  return (
    <div className={cn('flex flex-col h-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3 border-b bg-muted/30">
        {/* Left side - Active editors */}
        <div className="flex items-center gap-3">
          <ActiveEditorAvatars editors={activeEditors} maxVisible={4} size="sm" />
          {isConnected ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {t('status.connected')}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {t('status.disconnected')}
            </Badge>
          )}

          {summary?.isLocked && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <Lock className="h-3 w-3" />
              {t('status.locked')}
            </Badge>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Pending items indicator */}
          {totalPending > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setIsPanelOpen(true)}
                  >
                    <Badge variant="secondary" className="h-5 px-1.5">
                      {totalPending}
                    </Badge>
                    {t('toolbar.pendingItems')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-sm">
                    <p>{t('suggestions.pendingCount', { count: pendingSuggestions.length })}</p>
                    <p>{t('trackChanges.pendingCount', { count: pendingChanges.length })}</p>
                    <p>{t('comments.openCount', { count: openComments.length })}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Save button */}
          {onSave && !readOnly && (
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1">
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t('toolbar.save')}</span>
            </Button>
          )}

          {/* Settings sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? 'left' : 'right'}>
              <SheetHeader>
                <SheetTitle>{t('settings.title')}</SheetTitle>
                <SheetDescription>{t('settings.description')}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                {/* Track Changes toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="track-changes">{t('settings.trackChanges')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.trackChangesDescription')}
                    </p>
                  </div>
                  <Switch
                    id="track-changes"
                    checked={summary?.trackChangesEnabled ?? true}
                    onCheckedChange={toggleTrackChanges}
                    disabled={readOnly}
                  />
                </div>

                <Separator />

                {/* Suggestions toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="suggestions">{t('settings.suggestions')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.suggestionsDescription')}
                    </p>
                  </div>
                  <Switch
                    id="suggestions"
                    checked={summary?.suggestionsEnabled ?? true}
                    onCheckedChange={toggleSuggestions}
                    disabled={readOnly}
                  />
                </div>

                <Separator />

                {/* Lock document */}
                <div className="space-y-3">
                  <Label>{t('settings.documentLock')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.documentLockDescription')}
                  </p>
                  {summary?.isLocked ? (
                    <Button
                      variant="outline"
                      onClick={() => unlockDocument()}
                      className="w-full gap-2"
                    >
                      <Unlock className="h-4 w-4" />
                      {t('settings.unlockDocument')}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => lockDocument()}
                      className="w-full gap-2"
                      disabled={readOnly}
                    >
                      <Lock className="h-4 w-4" />
                      {t('settings.lockDocument')}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Panel toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            {isPanelOpen ? (
              isRTL ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : isRTL ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor area */}
        <div className={cn('flex-1 flex flex-col', isPanelOpen && 'hidden sm:flex')}>
          <ScrollArea className="flex-1">
            <div className="p-4 sm:p-6">
              <Textarea
                value={content}
                onChange={handleContentChange}
                disabled={readOnly || summary?.isLocked}
                placeholder={t('editor.placeholder')}
                className={cn(
                  'min-h-[400px] sm:min-h-[500px] resize-none border-none shadow-none focus-visible:ring-0',
                  'text-base sm:text-lg leading-relaxed',
                )}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Side panel */}
        {isPanelOpen && (
          <div
            className={cn(
              'w-full sm:w-96 border-s bg-background flex flex-col',
              'absolute sm:relative inset-0 sm:inset-auto z-10',
            )}
          >
            {/* Mobile close button */}
            <div className="flex sm:hidden items-center justify-between p-2 border-b">
              <span className="font-medium">{t('panel.title')}</span>
              <Button variant="ghost" size="icon" onClick={() => setIsPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-3 mx-2 mt-2">
                <TabsTrigger value="suggestions" className="gap-1 text-xs sm:text-sm">
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('tabs.suggestions')}</span>
                  {pendingSuggestions.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      {pendingSuggestions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="changes" className="gap-1 text-xs sm:text-sm">
                  <History className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('tabs.changes')}</span>
                  {pendingChanges.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      {pendingChanges.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-1 text-xs sm:text-sm">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('tabs.comments')}</span>
                  {openComments.length > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-xs">
                      {openComments.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="flex-1 mt-0 p-2">
                <SuggestionPanel
                  suggestions={suggestions}
                  onAccept={handleAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                  canResolve={!readOnly}
                  isLoading={isLoading}
                  className="h-full"
                />
              </TabsContent>

              <TabsContent value="changes" className="flex-1 mt-0 p-2">
                <ScrollArea className="h-full">
                  <TrackChangesOverlay
                    changes={trackChanges}
                    onAccept={acceptChange}
                    onReject={rejectChange}
                    onAcceptAll={acceptAllChanges}
                    onRejectAll={rejectAllChanges}
                    canResolve={!readOnly}
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent value="comments" className="flex-1 mt-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {inlineComments.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                          <p>{t('comments.empty')}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      inlineComments
                        .filter((c) => !c.parentId) // Only root comments
                        .map((comment) => (
                          <Card key={comment.id} className="overflow-hidden">
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium"
                                    style={{
                                      backgroundColor: '#' + comment.authorId.slice(0, 6),
                                      color: '#fff',
                                    }}
                                  >
                                    {comment.author?.name?.slice(0, 2).toUpperCase() ||
                                      comment.author?.email?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <CardTitle className="text-sm">
                                      {comment.author?.name || comment.author?.email}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {comment.highlightedText?.slice(0, 30)}
                                      {(comment.highlightedText?.length || 0) > 30 && '...'}
                                    </CardDescription>
                                  </div>
                                </div>
                                <Badge
                                  variant={comment.status === 'open' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {t(`comments.status.${comment.status}`)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <p className="text-sm">{comment.content}</p>
                              {comment.replyCount > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {t('comments.replyCount', { count: comment.replyCount })}
                                </p>
                              )}
                              {comment.status === 'open' && !readOnly && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveInlineComment(comment.id, 'resolved')}
                                    className="text-xs"
                                  >
                                    {t('comments.resolve')}
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

export default CollaborativeEditor
