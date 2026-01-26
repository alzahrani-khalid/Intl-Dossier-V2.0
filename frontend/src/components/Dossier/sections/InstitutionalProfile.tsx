/**
 * InstitutionalProfile Section Component
 *
 * Displays organization extension fields: org_code, org_type, established_date,
 * website, email, phone, address, headquarters, logo, parent organization reference.
 *
 * Mobile-first layout with responsive grid for key-value pairs.
 * RTL-compatible with logical properties and text alignment.
 *
 * @feature 028-type-specific-dossier-pages
 * @module Organization Dossier Phase 1
 */

import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Building2, Calendar, Globe, Hash, Network, Mail, Phone, MapPin, Flag } from 'lucide-react'
import type { OrganizationDossier } from '@/lib/dossier-type-guards'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase-client'

interface InstitutionalProfileProps {
  dossier: OrganizationDossier
}

export function InstitutionalProfile({ dossier }: InstitutionalProfileProps) {
  const { t, i18n } = useTranslation('dossier')
  const isRTL = i18n.language === 'ar'
  const extension = dossier.extension ?? {}

  // Fetch headquarters country name if headquarters_country_id exists
  const { data: headquartersCountry } = useQuery({
    queryKey: ['country', extension.headquarters_country_id],
    queryFn: async () => {
      if (!extension.headquarters_country_id) return null

      const { data, error } = await supabase
        .from('dossiers')
        .select('name_en, name_ar')
        .eq('id', extension.headquarters_country_id)
        .single()

      if (error) return null
      return data
    },
    enabled: !!extension.headquarters_country_id,
  })

  // No early return - show basic dossier info even without extension data

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.notAvailable')
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  }

  // Organization type label from i18n
  const getOrgTypeLabel = (orgType?: string) => {
    if (!orgType) return t('common.notAvailable')
    return t(`sections.organization.orgType.${orgType}`, orgType)
  }

  // Get address based on language
  const getAddress = () => {
    if (isRTL && extension.address_ar) return extension.address_ar
    if (extension.address_en) return extension.address_en
    if (extension.address_ar) return extension.address_ar
    return null
  }

  // Get headquarters country name based on language
  const getHeadquartersName = () => {
    if (!headquartersCountry) return null
    return isRTL ? headquartersCountry.name_ar : headquartersCountry.name_en
  }

  interface ProfileFieldProps {
    icon: typeof Building2
    label: string
    value: string | number | null | undefined
    link?: string
    linkType?: 'url' | 'email' | 'phone'
  }

  function ProfileField({ icon: Icon, label, value, link, linkType }: ProfileFieldProps) {
    const displayValue = value || t('common.notAvailable')

    const renderLink = () => {
      if (!link || !value) return displayValue

      let href = link
      if (linkType === 'email') {
        href = `mailto:${link}`
      } else if (linkType === 'phone') {
        href = `tel:${link}`
      }

      return (
        <a
          href={href}
          target={linkType === 'url' ? '_blank' : undefined}
          rel={linkType === 'url' ? 'noopener noreferrer' : undefined}
          className="text-primary hover:underline"
        >
          {displayValue}
        </a>
      )
    }

    return (
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <dt className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{label}</dt>
          <dd className="text-sm sm:text-base font-medium break-words">{renderLink()}</dd>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Organization Name Header - Always shown */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
          {extension.logo_url ? (
            <AvatarImage src={extension.logo_url} alt={dossier.name_en || 'Organization'} />
          ) : null}
          <AvatarFallback className="text-lg sm:text-xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold truncate">
            {isRTL ? dossier.name_ar || dossier.name_en : dossier.name_en || dossier.name_ar}
          </h3>
          {extension.org_code && (
            <p className="text-sm text-muted-foreground">{extension.org_code}</p>
          )}
          {dossier.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{dossier.description}</p>
          )}
        </div>
      </div>

      {/* Organization Code and Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={Hash}
          label={t('sections.organization.fields.orgCode')}
          value={extension.org_code}
        />
        <ProfileField
          icon={Building2}
          label={t('sections.organization.fields.orgType')}
          value={getOrgTypeLabel(extension.org_type)}
        />
      </div>

      {/* Established Date and Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={Calendar}
          label={t('sections.organization.fields.establishedDate')}
          value={formatDate(extension.established_date)}
        />
        <ProfileField
          icon={Globe}
          label={t('sections.organization.fields.website')}
          value={extension.website}
          link={extension.website}
          linkType="url"
        />
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={Mail}
          label={t('sections.organization.fields.email')}
          value={extension.email}
          link={extension.email}
          linkType="email"
        />
        <ProfileField
          icon={Phone}
          label={t('sections.organization.fields.phone')}
          value={extension.phone}
          link={extension.phone}
          linkType="phone"
        />
      </div>

      {/* Address and Headquarters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <ProfileField
          icon={MapPin}
          label={t('sections.organization.fields.address')}
          value={getAddress()}
        />
        <ProfileField
          icon={Flag}
          label={t('sections.organization.fields.headquarters')}
          value={getHeadquartersName()}
        />
      </div>

      {/* Parent Organization */}
      {extension.parent_org_id && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <ProfileField
            icon={Network}
            label={t('sections.organization.fields.parentOrganization')}
            value={extension.parent_org_id}
          />
        </div>
      )}
    </div>
  )
}
