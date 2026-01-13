/**
 * TeamInvitationDialog Component
 * Feature: Collaborative Empty States
 *
 * Dialog for sending team collaboration invitations with message templates
 * Mobile-first responsive design with full RTL support
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, User, Users, Send, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useInvitationTemplates,
  useSendInvitation,
  formatTemplateBody,
  getEntityTypeDisplayName,
  type InvitationTemplate,
  type SuggestedUser,
} from '@/hooks/useTeamCollaboration'

export interface TeamInvitationDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void
  /** Entity type for the invitation (dossier, document, etc.) */
  entityType: string
  /** Optional specific entity ID */
  entityId?: string
  /** Suggested users to show */
  suggestedUsers?: SuggestedUser[]
  /** Current user's name for template formatting */
  inviterName?: string
}

/**
 * Dialog component for sending team collaboration invitations
 *
 * Features:
 * - Mobile-first responsive design
 * - RTL support with logical properties
 * - Message template selection with preview
 * - Suggested users list
 * - Custom message support
 */
export function TeamInvitationDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  suggestedUsers = [],
  inviterName = 'Team Member',
}: TeamInvitationDialogProps) {
  const { t, i18n } = useTranslation('empty-states')
  const isRTL = i18n.language === 'ar'

  // State
  const [email, setEmail] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // Queries & Mutations
  const { data: templates = [], isLoading: templatesLoading } = useInvitationTemplates({
    entityType,
    enabled: open,
  })
  const { mutate: sendInvitation, isPending: sending } = useSendInvitation()

  // Get selected template
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId)
  }, [templates, selectedTemplateId])

  // Set default template when templates load
  useMemo(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find((t) => t.is_default)
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
      }
    }
  }, [templates, selectedTemplateId])

  // Format preview message
  const previewMessage = useMemo(() => {
    if (!selectedTemplate) return ''

    const templateBody = isRTL ? selectedTemplate.body_ar : selectedTemplate.body_en
    return formatTemplateBody(templateBody, {
      inviter_name: inviterName,
      invitee_name: selectedUserId
        ? suggestedUsers.find((u) => u.user_id === selectedUserId)?.full_name || ''
        : email.split('@')[0] || 'Colleague',
      custom_message: customMessage,
    })
  }, [selectedTemplate, isRTL, inviterName, selectedUserId, suggestedUsers, email, customMessage])

  // Entity type display name
  const entityDisplayName = getEntityTypeDisplayName(entityType, isRTL ? 'ar' : 'en')

  // Handle user selection from suggestions
  const handleUserSelect = (user: SuggestedUser) => {
    setSelectedUserId(user.user_id)
    setEmail(user.email)
  }

  // Handle send invitation
  const handleSend = () => {
    if (!email) return

    sendInvitation(
      {
        inviteeEmail: email,
        entityType,
        entityId,
        templateId: selectedTemplateId || undefined,
        customMessage: customMessage || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setEmail('')
          setCustomMessage('')
          setSelectedUserId(null)
          onOpenChange(false)
        },
      },
    )
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('sm:max-w-lg max-h-[90vh] overflow-y-auto', 'px-4 sm:px-6')}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-start">
            {t('collaboration.dialog.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-start">
            {t('collaboration.dialog.subtitle', { entityType: entityDisplayName })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Suggested Users */}
          {suggestedUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('collaboration.invite.suggestedUsers')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {suggestedUsers.map((user) => (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                      'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary',
                      'min-h-11 min-w-11', // Touch-friendly
                      selectedUserId === user.user_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border',
                    )}
                  >
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[100px] sm:max-w-[150px]">
                      {user.full_name}
                    </span>
                    {user.department && (
                      <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                        {user.department}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {t('collaboration.invite.emailLabel')}
            </Label>
            <div className="relative">
              <Mail
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                  isRTL ? 'end-3' : 'start-3',
                )}
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSelectedUserId(null)
                }}
                placeholder={t('collaboration.invite.emailPlaceholder')}
                className={cn('min-h-11', isRTL ? 'pe-10' : 'ps-10')}
              />
            </div>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template" className="text-sm font-medium">
              {t('collaboration.invite.selectTemplate')}
            </Label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={templatesLoading}
            >
              <SelectTrigger id="template" className="min-h-11">
                <SelectValue placeholder={t('collaboration.invite.selectTemplate')} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{isRTL ? template.name_ar : template.name_en}</span>
                      {template.is_default && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage" className="text-sm font-medium">
              {t('collaboration.invite.customMessage')}
            </Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('collaboration.invite.customMessagePlaceholder')}
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {/* Preview Toggle */}
          {selectedTemplate && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="min-h-9 gap-2"
              >
                <Eye className="h-4 w-4" />
                {t('collaboration.invite.preview')}
              </Button>

              {showPreview && (
                <div className="p-4 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap">
                  {previewMessage}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11 w-full sm:w-auto"
            disabled={sending}
          >
            {t('collaboration.dialog.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={!email || sending}
            className="min-h-11 w-full sm:w-auto gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('collaboration.invite.sending')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('collaboration.dialog.send')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TeamInvitationDialog
