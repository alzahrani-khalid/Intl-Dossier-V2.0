import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Loader2 } from 'lucide-react'
import { useContributors } from '@/hooks/use-contributors'
import type { TaskContributorInsert } from '@/types/database.types'

interface AddContributorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  onSuccess?: () => void
}

// Contributor roles with translations
const CONTRIBUTOR_ROLES = ['helper', 'reviewer', 'advisor', 'observer', 'supervisor'] as const

type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number]

/**
 * Dialog for adding contributors to a task
 * Features:
 * - User search (placeholder - replace with actual API)
 * - Role selection
 * - Optional notes
 * - Mobile-first responsive layout
 * - RTL compatible
 *
 * @example
 * <AddContributorDialog
 * open={isOpen}
 * onOpenChange={setIsOpen}
 * taskId={taskId}
 * onSuccess={() => toast.success('Contributor added')}
 * />
 */
export function AddContributorDialog({
  open,
  onOpenChange,
  taskId,
  onSuccess,
}: AddContributorDialogProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<ContributorRole>('helper')
  const [notes, setNotes] = useState('')

  const { addContributor } = useContributors(taskId)

  // Placeholder user search results - replace with actual API
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    // TODO: Replace with actual user search API call
    setTimeout(() => {
      setSearchResults([
        { id: '1', name: 'Ahmed Ali', email: 'ahmed@example.com' },
        { id: '2', name: 'Sara Mohammed', email: 'sara@example.com' },
        { id: '3', name: 'Khalid Fahad', email: 'khalid@example.com' },
      ])
      setIsSearching(false)
    }, 500)
  }

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedRole) {
      return
    }

    const contributorData: TaskContributorInsert = {
      task_id: taskId,
      user_id: selectedUserId,
      role: selectedRole,
      notes: notes || null,
    }

    try {
      await addContributor.mutateAsync(contributorData)
      onSuccess?.()
      handleClose()
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Failed to add contributor:', error)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedUserId('')
    setSelectedRole('helper')
    setNotes('')
    setSearchResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-full sm:max-w-[540px] md:max-w-[640px]"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="text-start text-xl sm:text-2xl">
            {t('tasks.addContributor', 'Add Contributor')}
          </DialogTitle>
          <DialogDescription className="text-start">
            {t('tasks.addContributorDescription', 'Add a team member who contributed to this task')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* User Search */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-search" className="text-start">
              {t('tasks.searchUser', 'Search User')}
            </Label>
            <div className="relative">
              <Search
                className={`absolute top-3 ${isRTL ? 'end-3' : 'start-3'} size-4 text-muted-foreground`}
              />
              <Input
                id="user-search"
                type="text"
                placeholder={t('tasks.searchUserPlaceholder', 'Type name or email...')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`${isRTL ? 'pe-10 ps-3' : 'ps-10 pe-3'} h-11`}
              />
              {isSearching && (
                <Loader2
                  className={`absolute top-3 ${isRTL ? 'start-3' : 'end-3'} size-4 animate-spin`}
                />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.id)
                      setSearchQuery(user.name)
                      setSearchResults([])
                    }}
                    className={`flex items-center gap-3 p-3 hover:bg-accent transition-colors text-start ${
                      selectedUserId === user.id ? 'bg-accent' : ''
                    }`}
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={`/avatars/${user.id}.png`} />
                      <AvatarFallback className="text-sm">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="role-select" className="text-start">
              {t('tasks.contributorRole', 'Role')}
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as ContributorRole)}
            >
              <SelectTrigger id="role-select" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRIBUTOR_ROLES.map((role) => (
                  <SelectItem key={role} value={role} className="text-start">
                    <span className="capitalize">{t(`tasks.contributorRole.${role}`, role)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground text-start">
              {t(`tasks.roleDescription.${selectedRole}`, getRoleDescription(selectedRole))}
            </p>
          </div>

          {/* Optional Notes */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-start">
              {t('tasks.contributorNotes', 'Notes')}{' '}
              <span className="text-muted-foreground">({t('common.optional', 'Optional')})</span>
            </Label>
            <Textarea
              id="notes"
              placeholder={t('tasks.contributorNotesPlaceholder', 'Describe their contribution...')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-11 min-w-full sm:min-w-[100px]"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || !selectedRole || addContributor.isPending}
            className="h-11 min-w-full sm:min-w-[100px]"
          >
            {addContributor.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            {t('tasks.add', 'Add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Get role description for helper text
 */
function getRoleDescription(role: ContributorRole): string {
  const descriptions: Record<ContributorRole, string> = {
    helper: 'Assisted with task execution',
    reviewer: 'Reviewed task outputs or quality',
    advisor: 'Provided expert guidance or consultation',
    observer: 'Monitored progress (e.g., for training/knowledge transfer)',
    supervisor: 'Provided oversight or approval',
  }
  return descriptions[role]
}
