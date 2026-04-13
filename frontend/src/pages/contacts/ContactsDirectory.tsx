/**
 * ContactsDirectory Page
 * Part of: 027-contact-directory implementation
 *
 * Main contact directory page with search, filters, and list.
 * Mobile-first, RTL-ready with virtualized list for 10k+ contacts.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ContactSearch } from '@/components/contacts/ContactSearch'
import { ContactList } from '@/components/contacts/ContactList'
import { Plus, Download, FileText, CreditCard, Check, Users } from 'lucide-react'
import {
  useSearchPersonDossiers,
  type PersonSearchParams,
  type PersonMetadata,
} from '@/hooks/usePersonDossiers'
import { exportAllContacts, exportSelectedContacts } from '@/services/export-api'
import { useToast } from '@/hooks/useToast'
import type { ContactResponse, ContactSearchParams } from '@/services/contact-api'
import { p } from '@/lib/navigation'
import { useDirection } from '@/hooks/useDirection'

export function ContactsDirectory() {
  const { t } = useTranslation('contacts')
  const { isRTL } = useDirection()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [searchParams, setSearchParams] = useState<PersonSearchParams>({})
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Fetch person dossiers with search/filter params
  const { data: dossierResults, isLoading } = useSearchPersonDossiers(searchParams)

  // Transform person dossiers to contact format for display
  const searchResults = useMemo(() => {
    if (!dossierResults?.data) return null

    const contacts: ContactResponse[] = dossierResults.data.map((dossier) => {
      const meta = (dossier.metadata || {}) as PersonMetadata
      return {
        id: dossier.id,
        first_name: dossier.name_en,
        last_name: '',
        organization_id: meta.organization_id || null,
        organization: meta.organization_name_en
          ? { id: meta.organization_id || '', name: meta.organization_name_en }
          : null,
        position_title: meta.title_en || null,
        email_addresses: meta.email || [],
        phone_numbers: meta.phone || [],
        tags: dossier.tags || [],
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
      }
    })

    return {
      contacts,
      total: dossierResults.total || 0,
      organizations: [], // TODO: Extract from dossiers
      tags: [], // TODO: Extract unique tags
    }
  }, [dossierResults])

  const handleCreateContact = () => {
    navigate({ to: '/contacts/create' })
  }

  const handleContactClick = (contactId: string) => {
    navigate({ to: '/contacts/$contactId', params: p({ contactId }) })
  }

  // Map ContactSearchParams to PersonSearchParams
  const handleSearchParamsChange = (params: ContactSearchParams) => {
    const personParams: PersonSearchParams = {
      search: params.query,
      organization_id: params.organization_id,
      tags: params.tags,
    }
    setSearchParams(personParams)
  }

  const handleExportAll = async (format: 'csv' | 'vcard') => {
    try {
      setIsExporting(true)

      // Apply current filters to export
      await exportAllContacts(format, searchParams.organization_id, searchParams.tags)

      toast({
        title: t('contactDirectory.export.success'),
        description: t('contactDirectory.export.successDescription', {
          count: searchResults?.total || 0,
          format: format.toUpperCase(),
        }),
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: t('contactDirectory.export.error'),
        description: t('contactDirectory.export.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSelected = async (format: 'csv' | 'vcard') => {
    if (selectedContacts.length === 0) {
      toast({
        title: t('contactDirectory.export.noSelection'),
        description: t('contactDirectory.export.noSelectionDescription'),
        variant: 'destructive',
      })
      return
    }

    try {
      setIsExporting(true)

      await exportSelectedContacts(selectedContacts, format)

      toast({
        title: t('contactDirectory.export.success'),
        description: t('contactDirectory.export.successDescription', {
          count: selectedContacts.length,
          format: format.toUpperCase(),
        }),
      })

      // Clear selection after export
      setSelectedContacts([])
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: t('contactDirectory.export.error'),
        description: t('contactDirectory.export.errorDescription'),
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b">
        <div className="py-4 sm:py-6">
          <PageHeader
            icon={<Users className="h-6 w-6" />}
            title={t('contactDirectory.title')}
            subtitle={t('contactDirectory.subtitle')}
            className="pb-0"
            actions={
              <>
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isExporting || (searchResults?.total || 0) === 0}
                      className="px-4"
                    >
                      <Download className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('contactDirectory.buttons.export')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="min-w-[200px]">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {t('contactDirectory.export.exportAll')}
                    </div>
                    <DropdownMenuItem
                      onClick={() => handleExportAll('csv')}
                      disabled={isExporting}
                      className=""
                    >
                      <FileText className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('contactDirectory.export.csv')}
                      <span className="ms-auto text-xs text-muted-foreground">
                        Excel {t('contactDirectory.export.compatible')}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportAll('vcard')}
                      disabled={isExporting}
                      className=""
                    >
                      <CreditCard className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                      {t('contactDirectory.export.vcard')}
                      <span className="ms-auto text-xs text-muted-foreground">
                        Outlook {t('contactDirectory.export.compatible')}
                      </span>
                    </DropdownMenuItem>

                    {selectedContacts.length > 0 && (
                      <>
                        <div className="my-2 border-t" />
                        <div className="px-2 py-1.5 text-sm font-medium">
                          {t('contactDirectory.export.exportSelected', {
                            count: selectedContacts.length,
                          })}
                        </div>
                        <DropdownMenuItem
                          onClick={() => handleExportSelected('csv')}
                          disabled={isExporting}
                          className=""
                        >
                          <Check className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                          {t('contactDirectory.export.selectedCsv')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportSelected('vcard')}
                          disabled={isExporting}
                          className=""
                        >
                          <Check className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                          {t('contactDirectory.export.selectedVCard')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Create Contact Button */}
                <Button onClick={handleCreateContact} className="px-4 sm:px-6">
                  <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
                  {t('contactDirectory.buttons.createContact')}
                </Button>
              </>
            }
          />

          {/* Search & Filters */}
          <div className="mt-6">
            <ContactSearch
              onSearch={handleSearchParamsChange}
              organizations={searchResults?.organizations || []}
              tags={searchResults?.tags || []}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 py-6">
        <ContactList
          contacts={searchResults?.contacts || []}
          tags={searchResults?.tags || []}
          onContactClick={(contact) => handleContactClick(contact.id)}
          isLoading={isLoading}
          isEmpty={searchResults?.total === 0}
          className="h-[calc(100vh-400px)] min-h-[400px]"
        />

        {/* Results Summary */}
        {searchResults && searchResults.total > 0 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {t('contactDirectory.messages.showingResults', {
              showing: searchResults.contacts.length,
              total: searchResults.total,
            })}
          </div>
        )}
      </div>
    </div>
  )
}
