/** Quick-add Organization Dialog — used when creating a forum dossier. */
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type OrgType = 'government' | 'ngo' | 'private' | 'international' | 'academic'

interface QuickAddOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgName: string
  onOrgNameChange: (name: string) => void
  orgType: OrgType
  onOrgTypeChange: (type: OrgType) => void
  isCreating: boolean
  onSubmit: () => void
}

export default function QuickAddOrgDialog({
  open,
  onOpenChange,
  orgName,
  onOrgNameChange,
  orgType,
  onOrgTypeChange,
  isCreating,
  onSubmit,
}: QuickAddOrgDialogProps): ReactElement {
  const { t } = useTranslation(['dossier'])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dossier:form.forum.quickAddOrg', 'Quick Add Organization')}</DialogTitle>
          <DialogDescription>
            {t(
              'dossier:form.forum.quickAddOrgDescription',
              'Create a new organization dossier. You can add more details later.',
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="org-name-en">{t('dossier:form.nameEn')}</Label>
            <Input
              id="org-name-en"
              value={orgName}
              onChange={(e) => onOrgNameChange(e.target.value)}
              placeholder={t('dossier:form.nameEnPlaceholder')}
              className="min-h-11"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-type">{t('dossier:form.organization.type')}</Label>
            <Select value={orgType} onValueChange={(v) => onOrgTypeChange(v as OrgType)}>
              <SelectTrigger className="min-h-11">
                <SelectValue placeholder={t('dossier:form.organization.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="international">
                  {t('dossier:form.organization.types.international')}
                </SelectItem>
                <SelectItem value="government">
                  {t('dossier:form.organization.types.government')}
                </SelectItem>
                <SelectItem value="ngo">{t('dossier:form.organization.types.ngo')}</SelectItem>
                <SelectItem value="academic">
                  {t('dossier:form.organization.types.academic')}
                </SelectItem>
                <SelectItem value="private">
                  {t('dossier:form.organization.types.private')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="min-h-11"
          >
            {t('dossier:form.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!orgName.trim() || isCreating}
            className="min-h-11"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 me-2 animate-spin" />
                {t('dossier:form.creating', 'Creating...')}
              </>
            ) : (
              t('dossier:form.forum.createOrg', 'Create Organization')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
