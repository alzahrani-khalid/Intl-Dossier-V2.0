/**
 * ContactDetails Page
 * Part of: 027-contact-directory implementation
 *
 * Contact detail view with full information and edit/archive actions.
 * Mobile-first, RTL-ready.
 */

import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Edit,
  Archive,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Tag,
  Calendar,
  Loader2,
  Network,
  Plus,
} from 'lucide-react'
import { usePersonDossier, useArchivePersonDossier } from '@/hooks/usePersonDossiers'
import { useRelationships } from '@/hooks/useContactRelationships'
import { ContactForm } from '@/components/contacts/ContactForm'
import { RelationshipGraph } from '@/components/relationships/RelationshipGraph'
import { RelationshipForm } from '@/components/relationships/RelationshipForm'
import { InteractionTimeline } from '@/components/contacts/InteractionTimeline'
import { InteractionNoteForm } from '@/components/contacts/InteractionNoteForm'
import { format } from 'date-fns'
import type { InteractionNoteResponse } from '@/services/interaction-api'

export function ContactDetails() {
  const { t, i18n } = useTranslation('contacts')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()
  const { contactId } = useParams({ from: '/contacts/$contactId' })

  const [isEditing, setIsEditing] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showNetworkDialog, setShowNetworkDialog] = useState(false)
  const [showAddRelationDialog, setShowAddRelationDialog] = useState(false)
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<InteractionNoteResponse | undefined>(undefined)

  // Fetch contact
  const { data: contact, isLoading } = useContact(contactId)

  // Fetch relationships
  const { data: relationships = [], isLoading: isLoadingRelationships } =
    useRelationships(contactId)

  // Archive mutation
  const archiveMutation = useArchiveContact()

  const handleBack = () => {
    navigate({ to: '/contacts' })
  }

  const handleArchive = () => {
    archiveMutation.mutate(contactId, {
      onSuccess: () => {
        setShowArchiveDialog(false)
        navigate({ to: '/contacts' })
      },
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t('contactDirectory.list.loading_contacts')}
          </p>
        </div>
      </div>
    )
  }

  // Not found
  if (!contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {t('contactDirectory.messages.noContacts')}
          </h2>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('contactDirectory.buttons.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <Button variant="ghost" onClick={handleBack} className="self-start">
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
            {t('contactDirectory.buttons.back')}
          </Button>

          {!isEditing && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNetworkDialog(true)}
                className="h-11 sm:h-10"
              >
                <Network className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('contactDirectory.relationships.view_network')}
              </Button>

              <Button variant="outline" onClick={() => setIsEditing(true)} className="h-11 sm:h-10">
                <Edit className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('contactDirectory.buttons.edit')}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(true)}
                className="h-11 sm:h-10"
              >
                <Archive className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                {t('contactDirectory.buttons.archive')}
              </Button>
            </div>
          )}
        </div>

        {/* Edit Form or Details */}
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('contactDirectory.buttons.edit')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm
                defaultValues={contact}
                onSubmit={() => setIsEditing(false)}
                onCancel={() => setIsEditing(false)}
                mode="edit"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-2xl text-start">{contact.full_name}</CardTitle>
                    {contact.position && (
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-start">{contact.position}</span>
                      </div>
                    )}
                  </div>

                  {contact.organization && (
                    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
                      <Building2 className="h-4 w-4" />
                      {contact.organization.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Email Addresses */}
                {contact.email_addresses && contact.email_addresses.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-start">
                      {t('contactDirectory.labels.email')}
                    </h3>
                    <div className="space-y-2">
                      {contact.email_addresses.map((email, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${email}`}
                            className="text-primary hover:underline text-start"
                          >
                            {email}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone Numbers */}
                {contact.phone_numbers && contact.phone_numbers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-start">
                      {t('contactDirectory.labels.phone')}
                    </h3>
                    <div className="space-y-2">
                      {contact.phone_numbers.map((phone, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${phone}`}
                            className="text-primary hover:underline"
                            dir="ltr"
                          >
                            {phone}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-start">
                      {t('contactDirectory.labels.tags')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline">
                          <Tag className="h-3 w-3 me-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {contact.notes && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-start">
                      {t('contactDirectory.labels.notes')}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap text-start">
                      {contact.notes}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {t('contactDirectory.labels.createdAt')}:{' '}
                      {format(new Date(contact.created_at), 'PPP')}
                    </span>
                  </div>
                  {contact.updated_at !== contact.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t('contactDirectory.labels.updatedAt')}:{' '}
                        {format(new Date(contact.updated_at), 'PPP')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>
                      {t('contactDirectory.labels.sourceType')}:{' '}
                      {t(`contactDirectory.sourceTypes.${contact.source_type}`)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interaction History Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-start">
                    {t('contactDirectory.interactions.title')}
                  </CardTitle>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAddNoteDialog(true)}
                    className="h-11 sm:h-10 w-full sm:w-auto"
                  >
                    <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                    {t('contactDirectory.interactions.add_note')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <InteractionTimeline
                  contactId={contactId}
                  onEditNote={(note) => {
                    setEditingNote(note)
                    setShowAddNoteDialog(true)
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Network Dialog */}
        <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{t('contactDirectory.relationships.title')}</DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowNetworkDialog(false)
                    setShowAddRelationDialog(true)
                  }}
                  className="h-9"
                >
                  <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('contactDirectory.relationships.add_relationship')}
                </Button>
              </div>
              <DialogDescription>
                {t('contactDirectory.relationships.relationship_count', {
                  count: relationships.length,
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <RelationshipGraph
                contactId={contactId}
                relationships={relationships}
                contacts={[
                  contact,
                  ...relationships.map((r) => r.from_contact || r.to_contact).filter(Boolean),
                ]}
                isLoading={isLoadingRelationships}
                height={500}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Relationship Dialog */}
        <Dialog open={showAddRelationDialog} onOpenChange={setShowAddRelationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('contactDirectory.relationships.add_relationship')}</DialogTitle>
              <DialogDescription>
                Create a new relationship for {contact.full_name}
              </DialogDescription>
            </DialogHeader>
            <RelationshipForm
              fromContactId={contactId}
              onSuccess={() => setShowAddRelationDialog(false)}
              onCancel={() => setShowAddRelationDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Add/Edit Note Dialog */}
        <InteractionNoteForm
          contactId={contactId}
          note={editingNote}
          open={showAddNoteDialog}
          onOpenChange={(open) => {
            setShowAddNoteDialog(open)
            if (!open) {
              setEditingNote(undefined)
            }
          }}
        />

        {/* Archive Confirmation Dialog */}
        <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('contactDirectory.buttons.archive')}</DialogTitle>
              <DialogDescription>
                {t('contactDirectory.messages.archiveConfirm', { name: contact.full_name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(false)}
                disabled={archiveMutation.isPending}
              >
                {t('contactDirectory.form.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending && (
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ms-2' : 'me-2'}`} />
                )}
                {t('contactDirectory.buttons.archive')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
