/**
 * CreateDelegationDialog Component
 * Dialog for creating a new permission delegation
 *
 * Feature: delegation-management
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { format, addDays, addMonths } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Loader2, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDelegatePermissions, useValidateDelegation } from '@/hooks/use-delegation'
import { useToast } from '@/hooks/use-toast'
import type { DelegatePermissionsRequest } from '@/services/user-management-api'

interface CreateDelegationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  users?: Array<{ id: string; email: string; full_name: string }>
}

interface FormData {
  grantee_id: string
  valid_until: Date | undefined
  reason: string
  resource_type: string
  resource_id: string
}

const RESOURCE_TYPES = [
  'dossier',
  'country',
  'organization',
  'mou',
  'forum',
  'brief',
  'intelligence_report',
  'data_library_item',
]

export function CreateDelegationDialog({
  open,
  onOpenChange,
  onSuccess,
  users = [],
}: CreateDelegationDialogProps) {
  const { t, i18n } = useTranslation('delegation')
  const { toast } = useToast()
  const isRTL = i18n.language === 'ar'
  const dateLocale = isRTL ? ar : enUS

  const [selectedGranteeId, setSelectedGranteeId] = useState<string>('')
  const [startDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [reason, setReason] = useState('')
  const [resourceType, setResourceType] = useState<string>('')
  const [resourceId, setResourceId] = useState('')

  // Mutations and queries
  const delegateMutation = useDelegatePermissions()

  const { data: validation, isLoading: isValidating } = useValidateDelegation(
    {
      grantee_id: selectedGranteeId,
      resource_type: resourceType || undefined,
      resource_id: resourceId || undefined,
    },
    { enabled: !!selectedGranteeId },
  )

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedGranteeId('')
      setEndDate(undefined)
      setReason('')
      setResourceType('')
      setResourceId('')
    }
  }, [open])

  // Calculate max end date (90 days)
  const maxEndDate = addMonths(new Date(), 3)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedGranteeId) {
      toast({
        title: t('create.validation.selectGrant'),
        variant: 'destructive',
      })
      return
    }

    if (!endDate) {
      toast({
        title: t('create.validation.selectEndDate'),
        variant: 'destructive',
      })
      return
    }

    if (reason.length < 10) {
      toast({
        title: t('create.validation.reasonMinLength'),
        variant: 'destructive',
      })
      return
    }

    const request: DelegatePermissionsRequest = {
      grantee_id: selectedGranteeId,
      valid_from: startDate.toISOString(),
      valid_until: endDate.toISOString(),
      reason,
      resource_type: resourceType || null,
      resource_id: resourceId || null,
    }

    try {
      await delegateMutation.mutateAsync(request)
      toast({
        title: t('create.success'),
        variant: 'default',
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: t('create.error'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className={`h-5 w-5 ${isRTL ? 'ms-0 me-2' : 'me-0 ms-0'}`} />
            {t('create.title')}
          </DialogTitle>
          <DialogDescription>{t('create.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Grantee Selection */}
          <div className="space-y-2">
            <Label htmlFor="grantee">{t('create.form.grantee')}</Label>
            <Select value={selectedGranteeId} onValueChange={setSelectedGranteeId}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder={t('create.form.granteePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('create.form.granteeDescription')}</p>
          </div>

          {/* Validation Status */}
          {selectedGranteeId && (
            <div className="py-2">
              {isValidating ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('validation.checking')}
                </div>
              ) : validation ? (
                validation.valid ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('validation.valid')}
                  </div>
                ) : (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('validation.invalid')}
                      {validation.issues?.map((issue, i) => (
                        <div key={i} className="mt-1 text-xs">
                          {t(`validation.issues.${issue.code}`, issue.message)}
                        </div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )
              ) : null}
            </div>
          )}

          {/* End Date */}
          <div className="space-y-2">
            <Label>{t('create.form.validUntil')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full min-h-11 justify-start text-start font-normal',
                    !endDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {endDate
                    ? format(endDate, 'PPP', { locale: dateLocale })
                    : t('create.form.validUntilPlaceholder')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align={isRTL ? 'end' : 'start'}>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < new Date() || date > maxEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              {t('create.form.validUntilDescription')}
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('create.form.reason')}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('create.form.reasonPlaceholder')}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{t('create.form.reasonDescription')}</p>
              <Badge variant={reason.length >= 10 ? 'default' : 'outline'} className="text-xs">
                {reason.length}/10
              </Badge>
            </div>
          </div>

          {/* Resource Type (Optional) */}
          <div className="space-y-2">
            <Label>{t('create.form.resourceType')}</Label>
            <Select
              value={resourceType || '__all__'}
              onValueChange={(value) => setResourceType(value === '__all__' ? '' : value)}
            >
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder={t('create.form.resourceTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('resourceTypes.all')}</SelectItem>
                {RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`resourceTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('create.form.resourceTypeDescription')}
            </p>
          </div>

          {/* Resource ID (Optional - only if resource type selected) */}
          {resourceType && (
            <div className="space-y-2">
              <Label htmlFor="resourceId">{t('create.form.resourceId')}</Label>
              <Input
                id="resourceId"
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder={t('create.form.resourceIdPlaceholder')}
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">
                {t('create.form.resourceIdDescription')}
              </p>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11"
          >
            {t('common:common.cancel')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              delegateMutation.isPending ||
              !selectedGranteeId ||
              !endDate ||
              reason.length < 10 ||
              (validation && !validation.valid)
            }
            className="min-h-11"
          >
            {delegateMutation.isPending ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('common:common.loading')}
              </>
            ) : (
              t('create.buttonText')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
