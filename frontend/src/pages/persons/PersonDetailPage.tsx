/**
 * Person Detail Page
 * Feature: persons-entity-management
 *
 * Detailed view of a person dossier with:
 * - Profile information
 * - Career history (roles)
 * - Organization affiliations
 * - Relationship network
 * - Engagement history
 *
 * Mobile-first design with RTL support.
 */

import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Briefcase,
  Users,
  Calendar,
  Mail,
  Phone,
  Globe,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { usePerson, useArchivePerson } from '@/hooks/usePersons'
import { usePersonNavigation } from '@/hooks/useEntityNavigation'
import type {
  ImportanceLevel,
  PersonRole,
  PersonAffiliation,
  PersonRelationshipWithPerson,
} from '@/types/person.types'
import {
  IMPORTANCE_LEVEL_LABELS,
  AFFILIATION_TYPE_LABELS,
  RELATIONSHIP_TYPE_LABELS,
} from '@/types/person.types'

export function PersonDetailPage() {
  const { personId } = useParams({ from: '/_protected/persons/$personId' })
  const { t, i18n } = useTranslation('persons')
  const isRTL = i18n.language === 'ar'
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    roles: true,
    affiliations: true,
    relationships: true,
  })

  // Fetch person data
  const { data: personData, isLoading, isError, error } = usePerson(personId)
  const archivePerson = useArchivePerson()

  // Track this person in navigation history
  usePersonNavigation(personId, personData?.person, { skip: isLoading })

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Navigation handlers
  const handleBack = () => {
    navigate({ to: '/persons' })
  }

  const handleEdit = () => {
    navigate({ to: '/persons/$personId/edit', params: { personId } })
  }

  const handleArchive = async () => {
    await archivePerson.mutateAsync(personId)
    navigate({ to: '/persons' })
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Get importance badge color
  const getImportanceColor = (level: ImportanceLevel) => {
    switch (level) {
      case 5:
        return 'bg-red-500/10 text-red-600 border-red-200'
      case 4:
        return 'bg-orange-500/10 text-orange-600 border-orange-200'
      case 3:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
      case 2:
        return 'bg-blue-500/10 text-blue-600 border-blue-200'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200'
    }
  }

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError || !personData) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('error.notFound', 'Person not found')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message ||
              t('error.notFoundDescription', 'The person you are looking for does not exist')}
          </p>
        </div>
        <Button onClick={handleBack}>
          <ArrowLeft className="me-2 size-4" />
          {t('actions.backToList', 'Back to List')}
        </Button>
      </div>
    )
  }

  const person = personData.person
  const name = isRTL ? person.name_ar : person.name_en
  const title = isRTL ? person.title_ar : person.title_en
  const biography = isRTL ? person.biography_ar : person.biography_en

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container mx-auto p-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack} className="size-10">
                <ArrowLeft className={`size-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={person.photo_url || ''} alt={name} />
                  <AvatarFallback className="bg-primary/10 font-medium text-primary">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl">{name}</h1>
                  {title && <p className="text-sm text-muted-foreground">{title}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="size-4 sm:me-2" />
                <span className="hidden sm:inline">{t('actions.edit', 'Edit')}</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('archive.title', 'Archive Person?')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        'archive.description',
                        'This will archive the person and hide them from the list. This action can be undone.',
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('actions.cancel', 'Cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleArchive}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {archivePerson.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
                      {t('actions.archive', 'Archive')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">
              {t('tabs.overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="career" className="flex-1 sm:flex-none">
              {t('tabs.career', 'Career')}
            </TabsTrigger>
            <TabsTrigger value="network" className="flex-1 sm:flex-none">
              {t('tabs.network', 'Network')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Profile Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">{t('sections.profile', 'Profile')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Photo */}
                  <div className="flex justify-center">
                    <Avatar className="size-24 sm:size-32">
                      <AvatarImage src={person.photo_url || ''} alt={name} />
                      <AvatarFallback className="bg-primary/10 text-2xl font-medium text-primary">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Importance Level */}
                  <div className="flex justify-center">
                    <Badge
                      variant="outline"
                      className={getImportanceColor(person.importance_level as ImportanceLevel)}
                    >
                      <Star className="me-1 size-3" />
                      {isRTL
                        ? IMPORTANCE_LEVEL_LABELS[person.importance_level as ImportanceLevel]?.ar
                        : IMPORTANCE_LEVEL_LABELS[person.importance_level as ImportanceLevel]?.en}
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 border-t pt-4">
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Mail className="size-4 text-muted-foreground" />
                        <span className="truncate">{person.email}</span>
                      </a>
                    )}
                    {person.phone && (
                      <a
                        href={`tel:${person.phone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Phone className="size-4 text-muted-foreground" />
                        <span dir="ltr">{person.phone}</span>
                      </a>
                    )}
                    {person.linkedin_url && (
                      <a
                        href={person.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Globe className="size-4 text-muted-foreground" />
                        <span>LinkedIn</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>

                  {/* Languages */}
                  {person.languages && person.languages.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 text-sm font-medium">
                        {t('profile.languages', 'Languages')}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {person.languages.map((lang, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expertise */}
                  {person.expertise_areas && person.expertise_areas.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="mb-2 text-sm font-medium">
                        {t('profile.expertise', 'Expertise')}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {person.expertise_areas.map((area, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Biography & Current Role */}
              <div className="space-y-6 lg:col-span-2">
                {/* Current Role */}
                {personData.current_role && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Briefcase className="size-5 text-primary" />
                        {t('sections.currentRole', 'Current Position')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="size-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {isRTL
                              ? personData.current_role.role_title_ar ||
                                personData.current_role.role_title_en
                              : personData.current_role.role_title_en}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isRTL
                              ? personData.current_role.organization_name_ar ||
                                personData.current_role.organization_name_en
                              : personData.current_role.organization_name_en}
                          </p>
                          {personData.current_role.start_date && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t('role.since', 'Since {{date}}', {
                                date: formatDate(personData.current_role.start_date),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Biography */}
                {biography && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('sections.biography', 'Biography')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {biography}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Briefcase className="mx-auto mb-2 size-6 text-primary" />
                      <p className="text-2xl font-bold">{personData.roles?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">{t('stats.roles', 'Roles')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Building2 className="mx-auto mb-2 size-6 text-primary" />
                      <p className="text-2xl font-bold">{personData.affiliations?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('stats.affiliations', 'Affiliations')}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="mx-auto mb-2 size-6 text-primary" />
                      <p className="text-2xl font-bold">{personData.relationships?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('stats.connections', 'Connections')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Career Tab */}
          <TabsContent value="career" className="space-y-6">
            {/* Roles Section */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('roles')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="size-5 text-primary" />
                    {t('sections.careerHistory', 'Career History')}
                    <Badge variant="secondary" className="ms-2">
                      {personData.roles?.length || 0}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="icon">
                    {expandedSections.roles ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedSections.roles && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0">
                      {personData.roles && personData.roles.length > 0 ? (
                        <div className="space-y-4">
                          {personData.roles.map((role: PersonRole, idx: number) => (
                            <div
                              key={role.id}
                              className={`flex gap-4 ${idx < personData.roles.length - 1 ? 'border-b pb-4' : ''}`}
                            >
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="size-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">
                                      {isRTL
                                        ? role.role_title_ar || role.role_title_en
                                        : role.role_title_en}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {isRTL
                                        ? role.organization_name_ar || role.organization_name_en
                                        : role.organization_name_en}
                                    </p>
                                  </div>
                                  {role.is_current && (
                                    <Badge variant="default">{t('role.current', 'Current')}</Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatDate(role.start_date)} -{' '}
                                  {role.end_date
                                    ? formatDate(role.end_date)
                                    : t('role.present', 'Present')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          {t('empty.roles', 'No career history recorded')}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Plus className="me-2 size-4" />
                        {t('actions.addRole', 'Add Role')}
                      </Button>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Affiliations Section */}
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('affiliations')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="size-5 text-primary" />
                    {t('sections.affiliations', 'Organization Affiliations')}
                    <Badge variant="secondary" className="ms-2">
                      {personData.affiliations?.length || 0}
                    </Badge>
                  </CardTitle>
                  <Button variant="ghost" size="icon">
                    {expandedSections.affiliations ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <AnimatePresence>
                {expandedSections.affiliations && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0">
                      {personData.affiliations && personData.affiliations.length > 0 ? (
                        <div className="space-y-3">
                          {personData.affiliations.map((affiliation: PersonAffiliation) => (
                            <div
                              key={affiliation.id}
                              className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {isRTL
                                    ? affiliation.organization_name_ar ||
                                      affiliation.organization_name_en
                                    : affiliation.organization_name_en}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {isRTL
                                    ? AFFILIATION_TYPE_LABELS[affiliation.affiliation_type]?.ar
                                    : AFFILIATION_TYPE_LABELS[affiliation.affiliation_type]?.en}
                                </p>
                              </div>
                              {affiliation.is_active && (
                                <Badge variant="secondary">
                                  {t('affiliation.active', 'Active')}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          {t('empty.affiliations', 'No affiliations recorded')}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        <Plus className="me-2 size-4" />
                        {t('actions.addAffiliation', 'Add Affiliation')}
                      </Button>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            {/* Relationships Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="size-5 text-primary" />
                  {t('sections.relationships', 'Professional Network')}
                  <Badge variant="secondary" className="ms-2">
                    {personData.relationships?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {personData.relationships && personData.relationships.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {personData.relationships.map((rel: PersonRelationshipWithPerson) => (
                      <Card
                        key={rel.relationship.id}
                        className="cursor-pointer transition-shadow hover:shadow-md"
                        onClick={() =>
                          navigate({
                            to: '/persons/$personId',
                            params: { personId: rel.related_person.id },
                          })
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                              <AvatarImage src={rel.related_person.photo_url || ''} />
                              <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                {getInitials(
                                  isRTL ? rel.related_person.name_ar : rel.related_person.name_en,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {isRTL ? rel.related_person.name_ar : rel.related_person.name_en}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isRTL
                                  ? RELATIONSHIP_TYPE_LABELS[rel.relationship.relationship_type]?.ar
                                  : RELATIONSHIP_TYPE_LABELS[rel.relationship.relationship_type]
                                      ?.en}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('empty.relationships', 'No connections recorded')}
                  </p>
                )}
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  <Plus className="me-2 size-4" />
                  {t('actions.addConnection', 'Add Connection')}
                </Button>
              </CardContent>
            </Card>

            {/* Engagements Section */}
            {personData.recent_engagements && personData.recent_engagements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="size-5 text-primary" />
                    {t('sections.engagements', 'Recent Engagements')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {personData.recent_engagements.map((eng: any) => (
                      <div
                        key={eng.link.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {isRTL ? eng.engagement.name_ar : eng.engagement.name_en}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {eng.engagement.engagement_type} - {eng.link.role}
                          </p>
                        </div>
                        {eng.link.attended && (
                          <Badge variant="secondary">{t('engagement.attended', 'Attended')}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default PersonDetailPage
