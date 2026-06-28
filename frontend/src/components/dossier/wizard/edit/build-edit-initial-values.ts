/**
 * Reverse-maps a loaded dossier (+ its extension row) into the form-value shape
 * the create wizard expects, so the edit surface can pre-fill every step (A-1).
 *
 * This is the inverse of each config's `filterExtensionData`. A few columns are
 * renamed at the form boundary (organization.address_* ⇄ headquarters_*,
 * established_date ⇄ founding_date; forum.organizing_body ⇄ organizing_body_id;
 * person.nationality_country_id ⇄ nationality_id) — mirror those here.
 *
 * Engagement dates + participants (A-1/A-2 follow-up): `dossiers-get` reads the
 * engagement extension from `engagements` (no date columns), while the real
 * dates live in `engagement_dossiers` and participants in
 * `engagement_participants`. Neither is on `dossier.extension`, so the caller
 * fetches them via the engagement domain hooks and passes them in as
 * `engagementExtras`; when present they override the (empty) extension values.
 *
 * Known partial-prefill gaps (documented, not silent):
 *  - honorific_selection is reverse-resolved from honorific_en (curated label →
 *    that label; any other non-empty value → "Other").
 */

import type { DossierType, DossierWithExtension } from '@/services/dossier-api'
import { getDefaultsForType, getElectedOfficialDefaults } from '../defaults'
import { CURATED_HONORIFICS, HONORIFIC_OTHER } from '../steps/honorific-map'

// elected_official is a person_subtype, not a DB dossier type — the edit wizard
// keys its config/step registry on this widened union.
export type WizardConfigKey = DossierType | 'elected_official'

// Engagement dates + participants reloaded from the live tables (engagement_dossiers
// / engagement_participants) by the caller, since dossiers-get cannot supply them.
export interface EngagementEditExtras {
  startDate?: string | null
  endDate?: string | null
  participantCountryIds: string[]
  participantOrganizationIds: string[]
  participantPersonIds: string[]
}

type ExtRecord = Record<string, unknown>

const str = (value: unknown): string => (typeof value === 'string' ? value : '')

// <input type="date"> needs a YYYY-MM-DD value; the DB columns are timestamptz
// (ISO strings). Slice the date part; pass through anything already short.
const toDateInputValue = (value: unknown): string => {
  const value_ = str(value)
  return value_.length >= 10 ? value_.slice(0, 10) : value_
}

/**
 * Resolve which wizard config/steps to render for a loaded dossier. Persons split
 * into the standard person wizard vs the elected-official variant by subtype.
 */
export function resolveWizardConfigKey(dossier: DossierWithExtension): WizardConfigKey {
  if (dossier.type === 'person') {
    const subtype = (dossier.extension as { person_subtype?: string } | undefined)?.person_subtype
    return subtype === 'elected_official' ? 'elected_official' : 'person'
  }
  return dossier.type
}

const reverseHonorificSelection = (honorificEn: unknown): string => {
  const value = str(honorificEn).trim()
  if (value === '') return ''
  return (CURATED_HONORIFICS as readonly string[]).includes(value) ? value : HONORIFIC_OTHER
}

function buildPersonExtensionValues(ext: ExtRecord): Record<string, unknown> {
  return {
    title_en: str(ext.title_en),
    title_ar: str(ext.title_ar),
    photo_url: str(ext.photo_url),
    biography_en: str(ext.biography_en),
    biography_ar: str(ext.biography_ar),
    person_subtype: ext.person_subtype ?? 'standard',
    honorific_selection: reverseHonorificSelection(ext.honorific_en),
    honorific_en: str(ext.honorific_en),
    honorific_ar: str(ext.honorific_ar),
    first_name_en: str(ext.first_name_en),
    last_name_en: str(ext.last_name_en),
    first_name_ar: str(ext.first_name_ar),
    last_name_ar: str(ext.last_name_ar),
    known_as_en: str(ext.known_as_en),
    known_as_ar: str(ext.known_as_ar),
    nationality_id: str(ext.nationality_country_id),
    date_of_birth: str(ext.date_of_birth),
    gender: ext.gender ?? undefined,
  }
}

function buildExtensionValues(
  key: WizardConfigKey,
  ext: ExtRecord,
  engagementExtras?: EngagementEditExtras,
): Record<string, unknown> {
  switch (key) {
    case 'country':
      return {
        iso_code_2: str(ext.iso_code_2),
        iso_code_3: str(ext.iso_code_3),
        capital_en: str(ext.capital_en),
        capital_ar: str(ext.capital_ar),
        region: str(ext.region),
      }
    case 'organization':
      return {
        org_type: ext.org_type ?? '',
        org_code: str(ext.org_code),
        website: str(ext.website),
        headquarters_en: str(ext.address_en),
        headquarters_ar: str(ext.address_ar),
        founding_date: str(ext.established_date),
      }
    case 'forum':
      return {
        organizing_body_id: str(ext.organizing_body) || str(ext.organizing_body_id),
      }
    case 'topic':
      return {
        theme_category: ext.theme_category ?? '',
      }
    case 'working_group':
      return {
        wg_status: ext.wg_status ?? undefined,
        established_date: str(ext.established_date),
        mandate_en: str(ext.mandate_en),
        mandate_ar: str(ext.mandate_ar),
        parent_body_id: str(ext.parent_body_id),
      }
    case 'engagement':
      return {
        engagement_type: ext.engagement_type ?? '',
        engagement_category: ext.engagement_category ?? '',
        location_en: str(ext.location_en),
        location_ar: str(ext.location_ar),
        // Dates + participants come from engagement_dossiers /
        // engagement_participants via engagementExtras (see file header); the
        // ext fallback covers the case where the caller did not supply them.
        start_date: toDateInputValue(engagementExtras?.startDate ?? ext.start_date),
        end_date: toDateInputValue(engagementExtras?.endDate ?? ext.end_date),
        participant_country_ids: engagementExtras?.participantCountryIds ?? [],
        participant_organization_ids: engagementExtras?.participantOrganizationIds ?? [],
        participant_person_ids: engagementExtras?.participantPersonIds ?? [],
      }
    case 'person':
      return buildPersonExtensionValues(ext)
    case 'elected_official':
      return {
        ...buildPersonExtensionValues(ext),
        office_name_en: str(ext.office_name_en),
        office_name_ar: str(ext.office_name_ar),
        office_type: str(ext.office_type),
        district_en: str(ext.district_en),
        district_ar: str(ext.district_ar),
        party_en: str(ext.party_en),
        party_ar: str(ext.party_ar),
        term_start: str(ext.term_start),
        term_end: str(ext.term_end),
        country_id: str(ext.country_id),
        organization_id: str(ext.organization_id),
        is_current_term: ext.is_current_term ?? true,
      }
    default:
      return {}
  }
}

/**
 * Reverse-map a loaded dossier into create-wizard form values. Seeds from the
 * type defaults first (so every registered field renders a controlled input),
 * then overlays the base dossier fields and the reverse-mapped extension fields.
 */
export function buildEditInitialValues(
  dossier: DossierWithExtension,
  engagementExtras?: EngagementEditExtras,
): {
  configKey: WizardConfigKey
  initialValues: Record<string, unknown>
} {
  const configKey = resolveWizardConfigKey(dossier)
  const defaults =
    configKey === 'elected_official'
      ? (getElectedOfficialDefaults() as unknown as Record<string, unknown>)
      : getDefaultsForType<Record<string, unknown>>(dossier.type)

  const base = {
    name_en: dossier.name_en ?? '',
    name_ar: dossier.name_ar ?? '',
    abbreviation: dossier.abbreviation ?? '',
    description_en: dossier.description_en ?? '',
    description_ar: dossier.description_ar ?? '',
    status: dossier.status ?? 'active',
    sensitivity_level: dossier.sensitivity_level ?? 1,
    tags: dossier.tags ?? [],
  }

  const ext = (dossier.extension ?? {}) as ExtRecord

  return {
    configKey,
    initialValues: {
      ...defaults,
      ...base,
      ...buildExtensionValues(configKey, ext, engagementExtras),
    },
  }
}
