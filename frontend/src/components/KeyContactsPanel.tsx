import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import {
 UserPlus,
 Mail,
 Phone,
 Building2,
 Calendar,
 Edit,
 Trash2,
 User,
} from 'lucide-react';
import type { KeyContact } from '../types/dossier';

interface KeyContactsPanelProps {
 dossierId: string;
 contacts?: KeyContact[];
 isLoading?: boolean;
 onAddContact?: () => void;
 onEditContact?: (contactId: string) => void;
 onDeleteContact?: (contactId: string) => void;
}

export function KeyContactsPanel({
 contacts = [],
 isLoading,
 onAddContact,
 onEditContact,
 onDeleteContact,
}: KeyContactsPanelProps) {
 const { t, i18n } = useTranslation('dossiers');

 // Loading skeleton
 if (isLoading) {
 return (
 <Card>
 <CardHeader>
 <CardTitle className="text-base">{t('keyContacts.title')}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {[...Array(3)].map((_, index) => (
 <div key={index} className="space-y-2">
 <Skeleton className="h-5 w-3/4" />
 <Skeleton className="h-4 w-1/2" />
 <Skeleton className="h-4 w-2/3" />
 </div>
 ))}
 </CardContent>
 </Card>
 );
 }

 // Empty state
 if (!contacts || contacts.length === 0) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="text-base">{t('keyContacts.title')}</CardTitle>
 {onAddContact && (
 <Button
 variant="ghost"
 size="sm"
 onClick={onAddContact}
 className="h-8 gap-1"
 aria-label={t('actions.addContact')}
 >
 <UserPlus className="size-4" />
 <span className="hidden sm:inline">{t('actions.addContact')}</span>
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <User className="mb-4 size-12 text-muted-foreground" />
 <p className="text-sm text-muted-foreground">{t('keyContacts.empty')}</p>
 {onAddContact && (
 <Button
 variant="outline"
 size="sm"
 onClick={onAddContact}
 className="mt-4 gap-2"
 >
 <UserPlus className="size-4" />
 {t('actions.addContact')}
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 );
 }

 return (
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <CardTitle className="flex items-center gap-2 text-base">
 {t('keyContacts.title')}
 <Badge variant="secondary">{contacts.length}</Badge>
 </CardTitle>
 {onAddContact && (
 <Button
 variant="ghost"
 size="sm"
 onClick={onAddContact}
 className="h-8 gap-1"
 aria-label={t('actions.addContact')}
 >
 <UserPlus className="size-4" />
 <span className="hidden sm:inline">{t('actions.addContact')}</span>
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent>
 <ul className="space-y-4" role="list">
 {contacts.map((contact) => (
 <li
 key={contact.id}
 className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
 role="listitem"
 >
 <div className="space-y-3">
 {/* Name and Actions */}
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-base font-semibold leading-tight">
 {contact.name}
 </h3>
 {contact.role && (
 <p className="truncate text-sm text-muted-foreground">
 {contact.role}
 </p>
 )}
 </div>
 <div className="flex shrink-0 gap-1">
 {onEditContact && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onEditContact(contact.id)}
 className="size-8 p-0"
 aria-label={`${t('edit')} ${contact.name}`}
 >
 <Edit className="size-4" />
 </Button>
 )}
 {onDeleteContact && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => onDeleteContact(contact.id)}
 className="size-8 p-0 text-destructive hover:text-destructive"
 aria-label={`${t('delete', { ns: 'translation' })} ${contact.name}`}
 >
 <Trash2 className="size-4" />
 </Button>
 )}
 </div>
 </div>

 {/* Organization */}
 {contact.organization && (
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Building2 className="size-4 shrink-0" />
 <span className="truncate">{contact.organization}</span>
 </div>
 )}

 {/* Contact Information */}
 <div className="space-y-2">
 {contact.email && (
 <div className="flex items-center gap-2 text-sm">
 <Mail className="size-4 shrink-0 text-muted-foreground" />
 <a
 href={`mailto:${contact.email}`}
 className="truncate text-primary hover:underline"
 aria-label={`${t('keyContacts.email')}: ${contact.email}`}
 >
 {contact.email}
 </a>
 </div>
 )}
 {contact.phone && (
 <div className="flex items-center gap-2 text-sm">
 <Phone className="size-4 shrink-0 text-muted-foreground" />
 <a
 href={`tel:${contact.phone}`}
 className="text-primary hover:underline"
 aria-label={`${t('keyContacts.phone')}: ${contact.phone}`}
 dir="ltr"
 >
 {contact.phone}
 </a>
 </div>
 )}
 </div>

 {/* Last Interaction */}
 {contact.last_interaction_date && (
 <div className="flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
 <Calendar className="size-3 shrink-0" />
 <span>
 {t('keyContacts.lastInteraction')}:{' '}
 {new Date(contact.last_interaction_date).toLocaleDateString(
 i18n.language,
 {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 }
 )}
 </span>
 </div>
 )}

 {/* Notes */}
 {contact.notes && (
 <p className="line-clamp-2 border-t pt-2 text-xs italic text-muted-foreground">
 {contact.notes}
 </p>
 )}
 </div>
 </li>
 ))}
 </ul>
 </CardContent>
 </Card>
 );
}