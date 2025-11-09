/**
 * InstitutionalProfile Section Component
 *
 * Displays organization extension fields: org_code, org_type, established_date,
 * website_url, head_count, parent organization reference.
 *
 * Mobile-first layout with responsive grid for key-value pairs.
 * RTL-compatible with logical properties and text alignment.
 */

import { useTranslation } from 'react-i18next';
import { Building2, Users, Calendar, Globe, Hash, Network } from 'lucide-react';
import type { OrganizationDossier } from '@/lib/dossier-type-guards';
import { cn } from '@/lib/utils';

interface InstitutionalProfileProps {
  dossier: OrganizationDossier;
}

export function InstitutionalProfile({ dossier }: InstitutionalProfileProps) {
  const { t, i18n } = useTranslation('dossier');
  const isRTL = i18n.language === 'ar';
  const { extension } = dossier;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.notAvailable');
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Organization type label
  const getOrgTypeLabel = (orgType: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      government: { en: 'Government', ar: 'حكومية' },
      ngo: { en: 'NGO', ar: 'منظمة غير حكومية' },
      international: { en: 'International', ar: 'دولية' },
      private: { en: 'Private Sector', ar: 'قطاع خاص' },
    };
    return labels[orgType]?.[isRTL ? 'ar' : 'en'] || orgType;
  };

  interface ProfileFieldProps {
    icon: typeof Building2;
    label: string;
    value: string | number | null | undefined;
    link?: string;
  }

  function ProfileField({ icon: Icon, label, value, link }: ProfileFieldProps) {
    const displayValue = value || t('common.notAvailable');

    return (
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <dt className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
            {label}
          </dt>
          <dd className="text-sm sm:text-base font-medium break-words">
            {link && value ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {displayValue}
              </a>
            ) : (
              displayValue
            )}
          </dd>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Organization Code and Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={Hash}
          label="Organization Code"
          value={extension.org_code}
        />
        <ProfileField
          icon={Building2}
          label="Organization Type"
          value={getOrgTypeLabel(extension.org_type)}
        />
      </div>

      {/* Established Date and Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={Calendar}
          label="Established Date"
          value={formatDate(extension.established_date)}
        />
        <ProfileField
          icon={Globe}
          label="Website"
          value={extension.website_url}
          link={extension.website_url}
        />
      </div>

      {/* Headcount and Parent Organization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={Users}
          label="Headcount"
          value={extension.head_count}
        />
        {extension.parent_org_id && (
          <ProfileField
            icon={Network}
            label="Parent Organization"
            value={extension.parent_org_id}
          />
        )}
      </div>
    </div>
  );
}
