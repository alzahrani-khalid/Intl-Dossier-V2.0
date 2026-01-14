/**
 * ShareSearchDialog Component
 * Feature: saved-searches-feature
 * Description: Dialog for sharing saved searches with team members
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User,
  Users,
  Building,
  Globe,
  X,
  Trash2,
  UserPlus,
  Link2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useShareSavedSearch, useDeleteShare, useSavedSearch } from '@/hooks/useSavedSearches'
import type {
  SavedSearch,
  SavedSearchShare,
  ShareType,
  SharePermission,
} from '@/types/saved-search.types'
import { SHARE_PERMISSION_OPTIONS } from '@/types/saved-search.types'

// Share type icons
const shareTypeIcons: Record<ShareType, React.ComponentType<{ className?: string }>> = {
  user: User,
  team: Users,
  organization: Building,
  public: Globe,
}

// Share type labels
const shareTypeLabels: Record<ShareType, { en: string; ar: string }> = {
  user: { en: 'Specific User', ar: 'مستخدم محدد' },
  team: { en: 'Team', ar: 'فريق' },
  organization: { en: 'Organization', ar: 'المنظمة' },
  public: { en: 'Public', ar: 'عام' },
}

interface ShareSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: SavedSearch
}

export function ShareSearchDialog({ open, onOpenChange, search }: ShareSearchDialogProps) {
  const { t, i18n } = useTranslation('saved-searches')
  const isRTL = i18n.language === 'ar'

  // Form state
  const [shareType, setShareType] = useState<ShareType>('user')
  const [userId, setUserId] = useState('')
  const [permission, setPermission] = useState<SharePermission>('view')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Get updated search data with shares
  const { data: searchData } = useSavedSearch(search.id)
  const shares = searchData?.data?.shares || []

  // Mutations
  const shareMutation = useShareSavedSearch()
  const deleteShareMutation = useDeleteShare()

  const handleShare = async () => {
    if (shareType === 'user' && !userId.trim()) return

    try {
      await shareMutation.mutateAsync({
        id: search.id,
        data: {
          share_type: shareType,
          shared_with_user_id: shareType === 'user' ? userId : undefined,
          permission,
          message: message || undefined,
        },
      })
      // Reset form
      setUserId('')
      setMessage('')
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    try {
      await deleteShareMutation.mutateAsync({
        searchId: search.id,
        shareId,
      })
    } catch (error) {
      console.error('Delete share error:', error)
    }
  }

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/search/saved/${search.id}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getPermissionBadge = (perm: SharePermission) => {
    const option = SHARE_PERMISSION_OPTIONS.find((o) => o.value === perm)
    const variants: Record<SharePermission, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      view: 'secondary',
      edit: 'default',
      admin: 'destructive',
    }
    return <Badge variant={variants[perm]}>{isRTL ? option?.label_ar : option?.label_en}</Badge>
  }

  const ShareTypeIcon = shareTypeIcons[shareType]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('share.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Search being shared */}
          <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 p-3">
            <p className="text-sm font-medium">{isRTL ? search.name_ar : search.name_en}</p>
            {(search.description_en || search.description_ar) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isRTL ? search.description_ar : search.description_en}
              </p>
            )}
          </div>

          <Separator />

          {/* New share form */}
          <div className="flex flex-col gap-3">
            <Label className="font-medium">{t('share.addNew')}</Label>

            {/* Share type */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-gray-500">{t('share.shareWith')}</Label>
              <Select value={shareType} onValueChange={(v) => setShareType(v as ShareType)}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <ShareTypeIcon className="h-4 w-4" />
                      <span>
                        {isRTL ? shareTypeLabels[shareType].ar : shareTypeLabels[shareType].en}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(shareTypeLabels) as ShareType[]).map((type) => {
                    const Icon = shareTypeIcons[type]
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{isRTL ? shareTypeLabels[type].ar : shareTypeLabels[type].en}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* User ID (for user shares) */}
            {shareType === 'user' && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-gray-500">{t('share.userId')}</Label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={t('share.userIdPlaceholder')}
                />
              </div>
            )}

            {/* Permission */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-gray-500">{t('share.permission')}</Label>
              <Select value={permission} onValueChange={(v) => setPermission(v as SharePermission)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHARE_PERMISSION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{isRTL ? option.label_ar : option.label_en}</span>
                        <span className="text-xs text-gray-500">
                          {isRTL ? option.description_ar : option.description_en}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-gray-500">{t('share.message')}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('share.messagePlaceholder')}
                rows={2}
              />
            </div>

            {/* Share button */}
            <Button
              onClick={handleShare}
              disabled={shareMutation.isPending || (shareType === 'user' && !userId.trim())}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 me-2" />
              {shareMutation.isPending ? t('share.sharing') : t('share.shareButton')}
            </Button>
          </div>

          <Separator />

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <Input
              value={`${window.location.origin}/search/saved/${search.id}`}
              readOnly
              className="flex-1 text-xs"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Separator />

          {/* Existing shares */}
          <div className="flex flex-col gap-2">
            <Label className="font-medium">{t('share.currentShares')}</Label>

            {shares.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <AlertCircle className="h-4 w-4" />
                {t('share.noShares')}
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="flex flex-col gap-2">
                  {shares.map((share: SavedSearchShare) => {
                    const TypeIcon = shareTypeIcons[share.share_type]
                    return (
                      <div key={share.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <TypeIcon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {share.shared_with_user?.name ||
                              share.shared_with_team?.name ||
                              (isRTL
                                ? shareTypeLabels[share.share_type].ar
                                : shareTypeLabels[share.share_type].en)}
                          </p>
                          {share.shared_with_user?.email && (
                            <p className="text-xs text-gray-500 truncate">
                              {share.shared_with_user.email}
                            </p>
                          )}
                        </div>

                        {getPermissionBadge(share.permission)}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteShare(share.id)}
                          disabled={deleteShareMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('share.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ShareSearchDialog
