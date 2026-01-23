/**
 * ContactCard Component
 * Part of: 027-contact-directory implementation
 *
 * Mobile-first, RTL-ready contact summary card.
 * Displays contact information with organization badge, position, and tags.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, Briefcase, Tag, Network } from 'lucide-react';
import { useRelationshipStats } from '@/hooks/useContactRelationships';
import type { Database } from '@/types/contact-directory.types';

type Contact = Database['public']['Tables']['cd_contacts']['Row'];
type Organization = Database['public']['Tables']['cd_organizations']['Row'];

interface ContactCardProps {
 contact: Contact & {
 organization?: Organization | null;
 };
 tags?: Array<{ id: string; name: string; color?: string }>;
 onClick?: () => void;
 className?: string;
}

export function ContactCard({ contact, tags = [], onClick, className = '' }: ContactCardProps) {
 const { t, i18n } = useTranslation('contacts');
 const isRTL = i18n.language === 'ar';

 // Get relationship stats
 const { data: relationshipStats } = useRelationshipStats(contact.id);

 // Get primary email and phone
 const primaryEmail = contact.email_addresses?.[0];
 const primaryPhone = contact.phone_numbers?.[0];

 // Get contact tags
 const contactTags = tags.filter((tag) => contact.tags?.includes(tag.id));

 return (
 <Card
 className={`cursor-pointer transition-shadow hover:shadow-md ${className}`}
 onClick={onClick}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <CardHeader className="pb-3">
 <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-start text-lg font-semibold">{contact.full_name}</h3>
 {contact.position && (
 <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
 <Briefcase className="size-3.5 shrink-0" />
 <span className="truncate text-start">{contact.position}</span>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2">
 {contact.organization && (
 <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1 text-xs">
 <Building2 className="size-3" />
 <span className="max-w-[120px] truncate sm:max-w-none">{contact.organization.name}</span>
 </Badge>
 )}
 {relationshipStats && relationshipStats.total > 0 && (
 <Badge variant="outline" className="flex items-center gap-1.5 px-2 py-1 text-xs">
 <Network className="size-3" />
 <span>{relationshipStats.total}</span>
 </Badge>
 )}
 </div>
 </div>
 </CardHeader>

 <CardContent className="space-y-3">
 {/* Contact Information */}
 <div className="space-y-2">
 {primaryEmail && (
 <div className="flex items-center gap-2 text-sm">
 <Mail className="size-4 shrink-0 text-muted-foreground" />
 <span className="truncate text-start">{primaryEmail}</span>
 </div>
 )}

 {primaryPhone && (
 <div className="flex items-center gap-2 text-sm">
 <Phone className="size-4 shrink-0 text-muted-foreground" />
 <span className={`${isRTL ? 'text-end' : 'text-start'}`} dir="ltr">
 {primaryPhone}
 </span>
 </div>
 )}
 </div>

 {/* Tags */}
 {contactTags.length > 0 && (
 <div className="flex items-start gap-2 border-t pt-2">
 <Tag className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
 <div className="flex flex-1 flex-wrap gap-1.5">
 {contactTags.map((tag) => (
 <Badge
 key={tag.id}
 variant="outline"
 className="px-2 py-0.5 text-xs"
 style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
 >
 {tag.name}
 </Badge>
 ))}
 </div>
 </div>
 )}

 {/* Additional email/phone count indicators */}
 {((contact.email_addresses?.length || 0) > 1 || (contact.phone_numbers?.length || 0) > 1) && (
 <div className="flex gap-3 pt-2 text-xs text-muted-foreground">
 {(contact.email_addresses?.length || 0) > 1 && (
 <span>
 +{contact.email_addresses!.length - 1} email{contact.email_addresses!.length - 1 > 1 ? 's' : ''}
 </span>
 )}
 {(contact.phone_numbers?.length || 0) > 1 && (
 <span>
 +{contact.phone_numbers!.length - 1} phone{contact.phone_numbers!.length - 1 > 1 ? 's' : ''}
 </span>
 )}
 </div>
 )}
 </CardContent>
 </Card>
 );
}
