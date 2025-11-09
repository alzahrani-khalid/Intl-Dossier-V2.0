/**
 * KeyContacts Section Component
 *
 * Displays person dossiers related to organization via dossier_relationships table.
 * Card grid layout with person details, mobile-first responsive, RTL support.
 *
 * Future: Will fetch actual relationships from API (Polish Phase).
 */

import { useTranslation } from 'react-i18next';
import { Users, UserCircle } from 'lucide-react';
import type { OrganizationDossier } from '@/lib/dossier-type-guards';

interface KeyContactsProps {
  dossier: OrganizationDossier;
}

export function KeyContacts({ dossier }: KeyContactsProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';

  // Placeholder - will fetch from dossier_relationships table in future
  const contacts: any[] = [];

  if (contacts.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
          <Users className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
        </div>
        <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
          No Key Contacts
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Person dossier relationships will populate this section. Integration pending.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <UserCircle className="h-10 w-10 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{contact.name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {contact.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
