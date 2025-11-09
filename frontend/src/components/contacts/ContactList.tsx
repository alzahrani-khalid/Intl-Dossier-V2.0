/**
 * ContactList Component
 * Part of: 027-contact-directory implementation
 *
 * Virtualized contact list for performance with 10,000+ contacts.
 * Mobile-first, RTL-ready with grid layout.
 */

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { ContactCard } from './ContactCard';
import { Loader2, Users, Building2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import type { ContactResponse } from '@/services/contact-api';

interface ContactListProps {
 contacts: ContactResponse[];
 tags?: Array<{ id: string; name: string; color?: string }>;
 onContactClick?: (contact: ContactResponse) => void;
 isLoading?: boolean;
 isEmpty?: boolean;
 emptyMessage?: string;
 className?: string;
}

export function ContactList({
 contacts,
 tags = [],
 onContactClick,
 isLoading = false,
 isEmpty = false,
 emptyMessage,
 className = '',
}: ContactListProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';
 const parentRef = useRef<HTMLDivElement>(null);

 // Virtual scrolling for large lists
 const rowVirtualizer = useVirtualizer({
 count: contacts.length,
 getScrollElement: () => parentRef.current,
 estimateSize: () => 180, // Estimated card height in pixels
 overscan: 5, // Number of items to render outside viewport
 });

 // Loading state
 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-12 gap-4">
 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
 <p className="text-sm text-muted-foreground">{t('contactDirectory.list.loading_contacts')}</p>
 </div>
 );
 }

 // Empty state
 if (isEmpty || contacts.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 gap-4">
 <div className="rounded-full bg-muted p-4">
 <Users className="h-8 w-8 text-muted-foreground" />
 </div>
 <div className="text-center space-y-1">
 <p className="font-medium">{emptyMessage || t('contactDirectory.list.no_contacts_found')}</p>
 <p className="text-sm text-muted-foreground">{t('contactDirectory.list.try_different_filters')}</p>
 </div>
 </div>
 );
 }

 return (
 <div
 ref={parentRef}
 className={`overflow-auto ${className}`}
 style={{ height: '100%' }}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div
 style={{
 height: `${rowVirtualizer.getTotalSize()}px`,
 width: '100%',
 position: 'relative',
 }}
 >
 {rowVirtualizer.getVirtualItems().map((virtualRow) => {
 const contact = contacts[virtualRow.index];
 return (
 <div
 key={virtualRow.key}
 style={{
 position: 'absolute',
 top: 0,
 [isRTL ? 'right' : 'left']: 0,
 width: '100%',
 height: `${virtualRow.size}px`,
 transform: `translateY(${virtualRow.start}px)`,
 }}
 className="px-4 sm:px-6 lg:px-8 pb-4"
 >
 <ContactCard
 contact={contact}
 tags={tags}
 onClick={() => onContactClick?.(contact)}
 />
 </div>
 );
 })}
 </div>
 </div>
 );
}

/**
 * Grid variant of ContactList (non-virtualized, better for smaller lists)
 */
export function ContactListGrid({
 contacts,
 tags = [],
 onContactClick,
 isLoading = false,
 isEmpty = false,
 emptyMessage,
 className = '',
}: ContactListProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 // Loading state
 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-12 gap-4">
 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
 <p className="text-sm text-muted-foreground">{t('contactDirectory.list.loading_contacts')}</p>
 </div>
 );
 }

 // Empty state
 if (isEmpty || contacts.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 gap-4">
 <div className="rounded-full bg-muted p-4">
 <Users className="h-8 w-8 text-muted-foreground" />
 </div>
 <div className="text-center space-y-1">
 <p className="font-medium">{emptyMessage || t('contactDirectory.list.no_contacts_found')}</p>
 <p className="text-sm text-muted-foreground">{t('contactDirectory.list.try_different_filters')}</p>
 </div>
 </div>
 );
 }

 return (
 <div
 className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {contacts.map((contact) => (
 <ContactCard
 key={contact.id}
 contact={contact}
 tags={tags}
 onClick={() => onContactClick?.(contact)}
 />
 ))}
 </div>
 );
}

/**
 * Grouped variant of ContactList - Groups contacts by organization
 */
export function ContactListGrouped({
 contacts,
 tags = [],
 onContactClick,
 isLoading = false,
 isEmpty = false,
 emptyMessage,
 className = '',
}: ContactListProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 // Group contacts by organization
 const groupedContacts = useMemo(() => {
 const groups = new Map<string, ContactResponse[]>();

 contacts.forEach((contact) => {
 const orgId = contact.organization?.id || 'no-organization';
 const orgName = contact.organization?.name || t('contactDirectory.organizations.no_organization');

 if (!groups.has(orgId)) {
 groups.set(orgId, []);
 }
 groups.get(orgId)!.push(contact);
 });

 // Convert to array and sort by organization name
 return Array.from(groups.entries())
 .map(([orgId, orgContacts]) => ({
 id: orgId,
 name: orgContacts[0]?.organization?.name || t('contactDirectory.organizations.no_organization'),
 contacts: orgContacts,
 }))
 .sort((a, b) => {
 // "No Organization" always at the end
 if (a.id === 'no-organization') return 1;
 if (b.id === 'no-organization') return -1;
 return a.name.localeCompare(b.name);
 });
 }, [contacts, t]);

 // Loading state
 if (isLoading) {
 return (
 <div className="flex flex-col items-center justify-center py-12 gap-4">
 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
 <p className="text-sm text-muted-foreground">{t('contactDirectory.list.loading_contacts')}</p>
 </div>
 );
 }

 // Empty state
 if (isEmpty || contacts.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center py-12 gap-4">
 <div className="rounded-full bg-muted p-4">
 <Users className="h-8 w-8 text-muted-foreground" />
 </div>
 <div className="text-center space-y-1">
 <p className="font-medium">{emptyMessage || t('contactDirectory.list.no_contacts_found')}</p>
 <p className="text-sm text-muted-foreground">{t('contactDirectory.list.try_different_filters')}</p>
 </div>
 </div>
 );
 }

 return (
 <div className={`space-y-6 ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
 {groupedContacts.map((group) => (
 <Collapsible key={group.id} defaultOpen className="space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2">
 <Building2 className="h-5 w-5 text-muted-foreground" />
 <h3 className="text-lg font-semibold">{group.name}</h3>
 </div>
 <Badge variant="secondary" className="text-xs">
 {t('contactDirectory.organizations.contact_count', { count: group.contacts.length })}
 </Badge>
 </div>
 <CollapsibleTrigger asChild>
 <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
 <ChevronDown className="h-4 w-4 transition-transform duration-200" />
 <span className="sr-only">Toggle</span>
 </Button>
 </CollapsibleTrigger>
 </div>

 <CollapsibleContent className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {group.contacts.map((contact) => (
 <ContactCard
 key={contact.id}
 contact={contact}
 tags={tags}
 onClick={() => onContactClick?.(contact)}
 />
 ))}
 </div>
 </CollapsibleContent>
 </Collapsible>
 ))}
 </div>
 );
}
