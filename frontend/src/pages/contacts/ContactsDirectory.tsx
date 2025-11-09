/**
 * ContactsDirectory Page
 * Part of: 027-contact-directory implementation
 *
 * Main contact directory page with search, filters, and list.
 * Mobile-first, RTL-ready with virtualized list for 10k+ contacts.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContactSearch } from '@/components/contacts/ContactSearch';
import { ContactList } from '@/components/contacts/ContactList';
import { Plus, Download, FileText, CreditCard, Check } from 'lucide-react';
import { useSearchPersonDossiers, type PersonSearchParams } from '@/hooks/usePersonDossiers';
import { exportAllContacts, exportSelectedContacts } from '@/services/export-api';
import { useToast } from '@/hooks/use-toast';

export function ContactsDirectory() {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';
 const navigate = useNavigate();
 const { toast } = useToast();

 const [searchParams, setSearchParams] = useState<PersonSearchParams>({});
 const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
 const [isExporting, setIsExporting] = useState(false);

 // Fetch person dossiers with search/filter params
 const { data: dossierResults, isLoading } = useSearchPersonDossiers(searchParams);

 // Transform person dossiers to contact format for display
 const searchResults = useMemo(() => {
 if (!dossierResults?.data) return null;

 return {
 contacts: dossierResults.data.map(dossier => ({
 id: dossier.id,
 full_name: dossier.name_en,
 organization_id: dossier.metadata?.organization_id,
 organization_name: dossier.metadata?.organization_name_en,
 position: dossier.metadata?.title_en,
 email_addresses: dossier.metadata?.email || [],
 phone_numbers: dossier.metadata?.phone || [],
 tags: dossier.tags,
 source_type: dossier.metadata?.source_type || 'manual',
 created_at: dossier.created_at,
 updated_at: dossier.updated_at,
 })),
 total: dossierResults.total || 0,
 organizations: [], // TODO: Extract from dossiers
 tags: [], // TODO: Extract unique tags
 };
 }, [dossierResults]);

 const handleCreateContact = () => {
 navigate({ to: '/contacts/create' });
 };

 const handleContactClick = (contactId: string) => {
 navigate({ to: `/contacts/$contactId`, params: { contactId } });
 };

 const handleExportAll = async (format: 'csv' | 'vcard') => {
 try {
 setIsExporting(true);

 // Apply current filters to export
 await exportAllContacts(
 format,
 searchParams.organization_id,
 searchParams.tags
 );

 toast({
 title: t('contactDirectory.export.success'),
 description: t('contactDirectory.export.successDescription', {
 count: searchResults?.total || 0,
 format: format.toUpperCase()
 }),
 });
 } catch (error) {
 console.error('Export error:', error);
 toast({
 title: t('contactDirectory.export.error'),
 description: t('contactDirectory.export.errorDescription'),
 variant: 'destructive',
 });
 } finally {
 setIsExporting(false);
 }
 };

 const handleExportSelected = async (format: 'csv' | 'vcard') => {
 if (selectedContacts.length === 0) {
 toast({
 title: t('contactDirectory.export.noSelection'),
 description: t('contactDirectory.export.noSelectionDescription'),
 variant: 'destructive',
 });
 return;
 }

 try {
 setIsExporting(true);

 await exportSelectedContacts(selectedContacts, format);

 toast({
 title: t('contactDirectory.export.success'),
 description: t('contactDirectory.export.successDescription', {
 count: selectedContacts.length,
 format: format.toUpperCase()
 }),
 });

 // Clear selection after export
 setSelectedContacts([]);
 } catch (error) {
 console.error('Export error:', error);
 toast({
 title: t('contactDirectory.export.error'),
 description: t('contactDirectory.export.errorDescription'),
 variant: 'destructive',
 });
 } finally {
 setIsExporting(false);
 }
 };

 return (
 <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Header */}
 <div className="border-b bg-background">
 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-start">
 {t('contactDirectory.title')}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground mt-1 text-start">
 {t('contactDirectory.subtitle')}
 </p>
 </div>

 <div className="flex gap-2 sm:gap-3">
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
 {/* Export All Section */}
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

 {/* Export Selected Section (if any selected) */}
 {selectedContacts.length > 0 && (
 <>
 <div className="my-2 border-t" />
 <div className="px-2 py-1.5 text-sm font-medium">
 {t('contactDirectory.export.exportSelected', {
 count: selectedContacts.length
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
 <Button
 onClick={handleCreateContact}
 className="px-4 sm:px-6"
 >
 <Plus className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('contactDirectory.buttons.createContact')}
 </Button>
 </div>
 </div>

 {/* Search & Filters */}
 <div className="mt-6">
 <ContactSearch
 onSearch={setSearchParams}
 organizations={searchResults?.organizations || []}
 tags={searchResults?.tags || []}
 defaultParams={searchParams}
 isLoading={isLoading}
 />
 </div>
 </div>
 </div>

 {/* Contact List */}
 <div className="flex-1 container mx-auto py-6">
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
 );
}
