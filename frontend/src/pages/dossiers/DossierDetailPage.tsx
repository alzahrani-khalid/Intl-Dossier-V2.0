/**
 * DossierDetailPage Component
 * Part of: 026-unified-dossier-architecture implementation (User Story 1 - T057)
 *
 * Detail view for a single dossier with extension data display and action buttons.
 * Mobile-first, RTL-compatible, with tabs for future expansion (relationships, documents, calendar).
 *
 * Features:
 * - Responsive layout (320px mobile → desktop)
 * - RTL support via logical properties
 * - Type-specific extension data display
 * - Action buttons (edit, delete, back)
 * - Loading states and error handling
 * - Touch-friendly UI (44x44px min)
 * - Accessibility compliant (WCAG AA)
 * - Tab navigation for related data
 */

import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, Link } from '@tanstack/react-router'
import { useDossier, useDeleteDossier, useDossiers } from '@/hooks/useDossier'
import { useRelationshipsForDossier, useDeleteRelationship } from '@/hooks/useRelationships'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Building2,
  Users,
  Calendar,
  Target,
  Briefcase,
  User,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { RelationshipList } from '@/components/relationships/RelationshipList'
import { UnifiedCalendar } from '@/components/Calendar/UnifiedCalendar'
import { DocumentList } from '@/components/Dossier/DocumentList'
import { DocumentLinkForm } from '@/components/Dossier/DocumentLinkForm'
import { PersonCardCompact } from '@/components/Dossier/PersonCard'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DossierDetailPage() {
  const { id } = useParams({ strict: false })
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('details')
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)

  const { data: dossier, isLoading, isError, error } = useDossier(id as string)
  const { data: relationshipsData, isLoading: isLoadingRelationships } = useRelationshipsForDossier(
    id as string,
  )
  const deleteMutation = useDeleteDossier()
  const deleteRelationshipMutation = useDeleteRelationship()

  // T129: Query for person dossiers linked to this organization (for Key Contacts section)
  const { data: keyContacts, isLoading: isLoadingContacts } = useDossiers({
    type: 'person',
    status: 'active',
    organization_id: dossier?.type === 'organization' ? id : undefined,
  })

  const handleBack = () => {
    navigate({ to: '/dossiers' })
  }

  const handleEdit = () => {
    navigate({ to: `/dossiers/${id}/edit` })
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id as string)
      toast.success(t('detail.deleteSuccess'))
      navigate({ to: '/dossiers' })
    } catch (error) {
      toast.error(t('detail.deleteError'))
    }
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    try {
      await deleteRelationshipMutation.mutateAsync(relationshipId)
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  const handleAddRelationship = () => {
    // TODO: Implement relationship form dialog
    toast.info('Add relationship functionality coming soon')
  }

  const handleLinkDocument = async (
    documentId: string,
    documentType: 'position' | 'mou' | 'brief',
  ) => {
    // TODO: Implement document linking via API
    toast.success(t('document.linkSuccess'))
    setIsDocumentDialogOpen(false)
  }

  const handleRemoveDocument = async (
    documentId: string,
    documentType: 'position' | 'mou' | 'brief',
  ) => {
    // TODO: Implement document unlinking via API
    toast.success(t('document.removeSuccess'))
  }

  const handleViewDocument = (documentId: string, documentType: 'position' | 'mou' | 'brief') => {
    // TODO: Navigate to document detail page
    toast.info(`View ${documentType}: ${documentId}`)
  }

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-64 sm:h-96 rounded-lg" />
      </div>
    )
  }

  if (isError || !dossier) {
    return (
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('detail.errorTitle')}</AlertTitle>
          <AlertDescription>{error?.message || t('detail.errorMessage')}</AlertDescription>
        </Alert>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowLeft className={cn('h-4 w-4', isRTL ? 'ms-2 rotate-180' : 'me-2')} />
          {t('detail.back')}
        </Button>
      </div>
    )
  }

  const displayName = isRTL ? dossier.name_ar : dossier.name_en
  const displayDescription = isRTL ? dossier.description_ar : dossier.description_en

  return (
    <div
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <Button onClick={handleBack} variant="ghost" size="sm" className="self-start">
          <ArrowLeft className={cn('h-4 w-4', isRTL ? 'ms-2 rotate-180' : 'me-2')} />
          {t('detail.back')}
        </Button>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button onClick={handleEdit} variant="outline" className="w-full sm:w-auto">
            <Edit className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
            {t('detail.edit')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('detail.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('detail.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('detail.deleteConfirmMessage', { name: displayName })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('detail.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground"
                >
                  {t('detail.confirmDelete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {t(`type.${dossier.type}`)}
                </Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {t(`status.${dossier.status}`)}
                </Badge>
                {dossier.sensitivity_level > 0 && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {t(`sensitivityLevel.${dossier.sensitivity_level}`)}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl text-start">
                {displayName}
              </CardTitle>
              {displayDescription && (
                <CardDescription className="text-sm sm:text-base mt-2 text-start">
                  {displayDescription}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground text-start">
                {t('detail.created')}
              </p>
              <p className="text-sm sm:text-base font-medium text-start">
                {new Date(dossier.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground text-start">
                {t('detail.updated')}
              </p>
              <p className="text-sm sm:text-base font-medium text-start">
                {new Date(dossier.updated_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Tags */}
          {dossier.tags && dossier.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2 text-start">
                {t('detail.tags')}
              </p>
              <div className="flex flex-wrap gap-2">
                {dossier.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs sm:text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>

        <Separator />

        {/* Tabs for Additional Information */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue="details"
          className="p-4 sm:p-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              {t('detail.tabs.details')}
            </TabsTrigger>
            <TabsTrigger value="relationships" className="text-xs sm:text-sm">
              {t('detail.tabs.relationships')}
              {relationshipsData && relationshipsData.data && relationshipsData.data.length > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {relationshipsData.data.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">
              {t('detail.tabs.documents')}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm" disabled>
              {t('detail.tabs.calendar')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4 sm:mt-6">
            {/* Extension Data Display */}
            {dossier.extension ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl text-start">
                    {t(`detail.${dossier.type}Details`)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Display extension data based on type */}
                  <pre className="text-xs sm:text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(dossier.extension, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-start">
                {t('detail.noExtensionData')}
              </p>
            )}

            {/* T129: Key Contacts Section (for organization dossiers) */}
            {dossier.type === 'organization' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg sm:text-xl text-start">
                        {t('detail.keyContacts')}
                      </CardTitle>
                      <CardDescription className="text-start mt-1">
                        {keyContacts?.length || 0} {t('detail.contactsCount')}
                      </CardDescription>
                    </div>
                    <Link to="/dossiers/create" search={{ type: 'person', organization_id: id }}>
                      <Button variant="outline" size="sm" className="min-h-9">
                        <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                        <span className="hidden sm:inline">{t('detail.addContact')}</span>
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingContacts ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : keyContacts && keyContacts.length > 0 ? (
                    <div className="space-y-2">
                      {keyContacts.map((contact) => (
                        <PersonCardCompact
                          key={contact.id}
                          dossier={contact as any}
                          onClick={(contactId) => {
                            navigate({ to: `/dossiers/${contactId}` })
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
                      <p className="text-sm text-muted-foreground">{t('detail.noKeyContacts')}</p>
                      <Link to="/dossiers/create" search={{ type: 'person', organization_id: id }}>
                        <Button variant="outline" className="mt-4">
                          <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                          {t('detail.addFirstContact')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4 mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-start">
                  {t('detail.tabs.relationships')}
                </h3>
                <p className="text-sm text-muted-foreground text-start mt-1">
                  {relationshipsData?.data?.length || 0} {t('relationship.title')}
                </p>
              </div>
              <Button onClick={handleAddRelationship} className="w-full sm:w-auto">
                <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                {t('relationship.form.title')}
              </Button>
            </div>
            <RelationshipList
              dossierId={id as string}
              relationships={relationshipsData?.data || []}
              onDelete={handleDeleteRelationship}
              isLoading={isLoadingRelationships}
              showActions={true}
            />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-start">
                  {t('detail.tabs.documents')}
                </h3>
                <p className="text-sm text-muted-foreground text-start mt-1">
                  {t('document.linkedDocumentsCount', { count: 0 })}
                </p>
              </div>
              <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
                    {t('document.linkDocument')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t('document.linkDocument')}</DialogTitle>
                  </DialogHeader>
                  <DocumentLinkForm
                    dossierId={id as string}
                    onSubmit={handleLinkDocument}
                    onCancel={() => setIsDocumentDialogOpen(false)}
                    availableDocuments={[
                      // TODO: Fetch available documents from API
                      { id: '1', title: 'Sample Position Document', type: 'position' },
                      { id: '2', title: 'Sample MOU', type: 'mou' },
                      { id: '3', title: 'Intelligence Brief', type: 'brief' },
                    ]}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <DocumentList
              documents={
                [
                  // TODO: Fetch linked documents from API
                ]
              }
              onRemoveDocument={handleRemoveDocument}
              onViewDocument={handleViewDocument}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-start">
                  {t('detail.tabs.calendarEvents')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: '/calendar' })}
                  className="min-h-9"
                >
                  {t('detail.viewFullCalendar')}
                </Button>
              </div>
              <UnifiedCalendar
                events={[]} // TODO: Connect to useCalendarEvents with linkedItemId filter
                onEventClick={(event) => {
                  // TODO: Open event detail dialog
                  toast.info(`Event: ${event.title}`)
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
