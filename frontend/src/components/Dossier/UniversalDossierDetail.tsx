/**
 * UniversalDossierDetail Component
 * Part of: 026-unified-dossier-architecture implementation
 *
 * Single detail view component that adapts to display any of the 7 dossier types:
 * country, organization, forum, engagement, theme, working_group, person
 */

import { useTranslation } from 'react-i18next'
import {
  Globe2,
  Building2,
  Users,
  Briefcase,
  Target,
  UserCog,
  User,
  Calendar,
  FileText,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  ShieldAlert,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon,
  MessageSquare,
  Languages,
  ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDossier, useDocumentLinks } from '@/hooks/useDossier'
import { useRelationshipsForDossier } from '@/hooks/useRelationships'
import { RelationshipGraph } from '@/components/dossiers/RelationshipGraph'
import { DossierActivityTimeline } from '@/components/Dossier/DossierActivityTimeline'
import { CommentList } from '@/components/comments'
import { MultiLanguageContentEditor } from '@/components/multilingual'
import { ExpirationBadge, ExpirationInlineDisplay } from '@/components/content-expiration'
import type { DossierType } from '@/services/dossier-api'
import type { CommentableEntityType } from '@/types/comment.types'
import type {
  MultiLangFieldConfig,
  TranslatableEntityType,
} from '@/types/multilingual-content.types'

// Multi-language field configurations for different dossier types
const DOSSIER_MULTILANG_FIELDS: MultiLangFieldConfig[] = [
  { fieldName: 'name', labelKey: 'multilingual.dossierFields.name', type: 'input', required: true },
  {
    fieldName: 'description',
    labelKey: 'multilingual.dossierFields.description',
    type: 'textarea',
    rows: 4,
  },
  {
    fieldName: 'summary',
    labelKey: 'multilingual.dossierFields.summary',
    type: 'textarea',
    rows: 3,
  },
]

interface UniversalDossierDetailProps {
  dossierId: string
}

const DOSSIER_TYPE_ICONS: Record<DossierType, React.ElementType> = {
  country: Globe2,
  organization: Building2,
  forum: Users,
  engagement: Briefcase,
  theme: Target,
  working_group: UserCog,
  person: User,
}

export function UniversalDossierDetail({ dossierId }: UniversalDossierDetailProps) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.dir() === 'rtl'

  // Fetch dossier data
  const { data: dossier, isLoading, isError, error } = useDossier(dossierId)

  // Fetch relationships for this specific dossier (bidirectional)
  const { data: relationshipsData, isLoading: isLoadingRelationships } =
    useRelationshipsForDossier(dossierId)
  const relationships = relationshipsData?.data || []

  // Fetch linked documents
  const { data: documents, isLoading: isLoadingDocuments } = useDocumentLinks(dossierId)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (isError || !dossier) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-4">
        <ShieldAlert className="size-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            {t('dossier.error.title', 'Failed to load dossier')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {error?.message || t('dossier.error.message', 'An error occurred while fetching data')}
          </p>
        </div>
      </div>
    )
  }

  const Icon = DOSSIER_TYPE_ICONS[dossier.type]
  const extension = dossier.extension_data || {}

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {dossier.name_en}
              </h1>
              <Badge variant="outline" className="text-xs">
                {t(`dossier.type.${dossier.type}`, dossier.type)}
              </Badge>
            </div>
            <p className="mt-1 text-lg text-muted-foreground">{dossier.name_ar}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                className={
                  dossier.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {t(`dossier.status.${dossier.status}`, dossier.status)}
              </Badge>
              <Badge variant="secondary">
                {t('dossier.sensitivity.level', { level: dossier.sensitivity_level })}
              </Badge>
              {dossier.freshness_status && (
                <ExpirationBadge
                  status={dossier.freshness_status}
                  expiresAt={dossier.expires_at}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ExpirationInlineDisplay entityType="dossier" entityId={dossierId} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <Edit className="size-4" />
              {t('common.edit', 'Edit')}
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-destructive">
              <Trash2 className="size-4" />
              {t('common.delete', 'Delete')}
            </Button>
          </div>
        </div>
      </header>

      {/* Description */}
      {(dossier.description_en || dossier.description_ar) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dossier.description', 'Description')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dossier.description_en && (
              <p className="text-sm text-foreground">{dossier.description_en}</p>
            )}
            {dossier.description_ar && (
              <p className="text-sm text-muted-foreground">{dossier.description_ar}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type-Specific Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dossier.details', 'Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Country-specific fields */}
            {dossier.type === 'country' && (
              <>
                {extension.iso2 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('country.iso2', 'ISO 2')}
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-foreground">{extension.iso2}</dd>
                  </div>
                )}
                {extension.iso3 && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('country.iso3', 'ISO 3')}
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-foreground">{extension.iso3}</dd>
                  </div>
                )}
                {extension.region && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('country.region', 'Region')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.region}</dd>
                  </div>
                )}
                {extension.capital_en && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('country.capital', 'Capital')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {extension.capital_en}
                      {extension.capital_ar && (
                        <span className="ms-2 text-muted-foreground">({extension.capital_ar})</span>
                      )}
                    </dd>
                  </div>
                )}
              </>
            )}

            {/* Organization-specific fields */}
            {dossier.type === 'organization' && (
              <>
                {extension.acronym && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('organization.acronym', 'Acronym')}
                    </dt>
                    <dd className="mt-1 font-mono text-sm text-foreground">{extension.acronym}</dd>
                  </div>
                )}
                {extension.org_type && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('organization.type', 'Type')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {t(`organization.orgType.${extension.org_type}`, extension.org_type)}
                    </dd>
                  </div>
                )}
                {extension.website && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('organization.website', 'Website')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      <a
                        href={extension.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {extension.website}
                        <ExternalLink className="size-3" />
                      </a>
                    </dd>
                  </div>
                )}
                {extension.headquarters && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      <MapPin className="me-1 inline size-3" />
                      {t('organization.headquarters', 'Headquarters')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.headquarters}</dd>
                  </div>
                )}
              </>
            )}

            {/* Forum-specific fields */}
            {dossier.type === 'forum' && (
              <>
                {extension.forum_type && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('forum.type', 'Forum type')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {t(`forum.forumType.${extension.forum_type}`, extension.forum_type)}
                    </dd>
                  </div>
                )}
                {extension.frequency && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('forum.frequency', 'Meeting frequency')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.frequency}</dd>
                  </div>
                )}
                {extension.member_count !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('forum.memberCount', 'Members')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.member_count}</dd>
                  </div>
                )}
              </>
            )}

            {/* Theme-specific fields */}
            {dossier.type === 'theme' && (
              <>
                {extension.scope && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('theme.scope', 'Scope')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {t(`theme.scopeType.${extension.scope}`, extension.scope)}
                    </dd>
                  </div>
                )}
                {extension.priority && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('theme.priority', 'Priority')}
                    </dt>
                    <dd className="mt-1">
                      <Badge
                        className={
                          extension.priority === 'high'
                            ? 'bg-destructive/10 text-destructive'
                            : extension.priority === 'medium'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-muted text-muted-foreground'
                        }
                      >
                        {t(`theme.priorityLevel.${extension.priority}`, extension.priority)}
                      </Badge>
                    </dd>
                  </div>
                )}
              </>
            )}

            {/* Working Group-specific fields */}
            {dossier.type === 'working_group' && (
              <>
                {extension.chair_name && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('workingGroup.chair', 'Chair')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.chair_name}</dd>
                  </div>
                )}
                {extension.member_count !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('workingGroup.memberCount', 'Members')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.member_count}</dd>
                  </div>
                )}
                {extension.mandate_en && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('workingGroup.mandate', 'Mandate')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.mandate_en}</dd>
                  </div>
                )}
              </>
            )}

            {/* Person-specific fields */}
            {dossier.type === 'person' && (
              <>
                {extension.title_en && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('person.title', 'Title')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {extension.title_en}
                      {extension.title_ar && (
                        <span className="ms-2 text-muted-foreground">({extension.title_ar})</span>
                      )}
                    </dd>
                  </div>
                )}
                {extension.role && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('person.role', 'Role')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {t(`person.roleType.${extension.role}`, extension.role)}
                    </dd>
                  </div>
                )}
                {extension.email && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      <Mail className="me-1 inline size-3" />
                      {t('person.email', 'Email')}
                    </dt>
                    <dd className="mt-1 text-sm">
                      <a
                        href={`mailto:${extension.email}`}
                        className="text-primary hover:underline"
                      >
                        {extension.email}
                      </a>
                    </dd>
                  </div>
                )}
                {extension.phone && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      <Phone className="me-1 inline size-3" />
                      {t('person.phone', 'Phone')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.phone}</dd>
                  </div>
                )}
                {extension.organization_name && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      <Building2 className="me-1 inline size-3" />
                      {t('person.organization', 'Organization')}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{extension.organization_name}</dd>
                  </div>
                )}
              </>
            )}

            {/* Common metadata */}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('dossier.createdAt', 'Created')}
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {new Date(dossier.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                {t('dossier.updatedAt', 'Last updated')}
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {new Date(dossier.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {/* Tags */}
          {dossier.tags && dossier.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                {t('dossier.tags', 'Tags')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {dossier.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed content */}
      <Tabs defaultValue="relationships" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="relationships" className="gap-2">
            <LinkIcon className="size-4" />
            {t('dossier.tabs.relationships', 'Relationships')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <ListTodo className="size-4" />
            {t('dossier.tabs.activity', 'Activity')}
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="size-4" />
            {t('dossier.tabs.documents', 'Documents')}
            {documents && documents.length > 0 && (
              <Badge variant="secondary" className="ms-1 text-xs">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="size-4" />
            {t('dossier.tabs.timeline', 'Timeline')}
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="size-4" />
            {t('dossier.tabs.comments', 'Comments')}
          </TabsTrigger>
          <TabsTrigger value="languages" className="gap-2">
            <Languages className="size-4" />
            {t('dossier.tabs.languages', 'Languages')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relationships" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dossier.relationships.title', 'Related dossiers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRelationships ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : relationships && relationships.length > 0 ? (
                <RelationshipGraph dossierId={dossierId} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('dossier.relationships.empty', 'No relationships found')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <DossierActivityTimeline dossierId={dossierId} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dossier.documents.title', 'Linked documents')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents && documents.length > 0 ? (
                <ul className="divide-y divide-border">
                  {documents.map((doc) => (
                    <li key={doc.id} className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {t(`document.type.${doc.type}`, doc.type)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink className="size-3" />
                          {t('common.view', 'View')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('dossier.documents.empty', 'No documents linked')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dossier.timeline.title', 'Event timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('dossier.timeline.comingSoon', 'Timeline view coming soon')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <CommentList
                entityType={dossier.type as CommentableEntityType}
                entityId={dossierId}
                showReplies={true}
                maxDepth={3}
                defaultVisibility="public"
                title={null}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="mt-4">
          <MultiLanguageContentEditor
            entityType={'dossier' as TranslatableEntityType}
            entityId={dossierId}
            fields={DOSSIER_MULTILANG_FIELDS}
            showTranslateButtons={true}
            showCompletenessIndicator={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
