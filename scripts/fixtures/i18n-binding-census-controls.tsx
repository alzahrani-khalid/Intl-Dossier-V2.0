// Controlled fixture for `i18n-binding-census.mjs <root> --self-check`. Nine planted
// POSITIVE forms — each a pre-flatten route (effective namespace = common.json, key
// resolved inside the nested `common` subtree) that the census MUST flag — and three
// NEGATIVE look-alikes it MUST NOT. Outside frontend/src so the real census skips it.
import { useTranslation } from 'react-i18next'

export function KeyPrefixForm() {
  const { t } = useTranslation('assignments')
  // POSITIVE 1: key prefix `translation:` routes to common.json
  return <p>{t('translation:common.loading')}</p>
}

export function DoublePrefixForm() {
  const { t } = useTranslation()
  // POSITIVE 2: double prefix `common:common.*`
  return <p>{t('common:common.cancel')}</p>
}

export function NsOptionTranslationForm() {
  const { t } = useTranslation('calendar')
  // POSITIVE 3: options-object ns override
  return <p>{t('common.saving', { ns: 'translation' })}</p>
}

export function NsOptionCommonForm() {
  const { t } = useTranslation('elected-officials')
  // POSITIVE 4: options-object ns 'common' + defaultValue
  return <p>{t('common.previous', { ns: 'common', defaultValue: 'Previous' })}</p>
}

export function HookBindingForm() {
  const { t } = useTranslation('common')
  // POSITIVE 5: hook bound to the common namespace
  return <p>{t('common.search')}</p>
}

export function ScopedAliasForm() {
  const { t: tc } = useTranslation('translation')
  // POSITIVE 6: aliased binding
  return <p>{tc('common.error')}</p>
}

export function MultilineForm() {
  const { t } = useTranslation()
  // POSITIVE 7: multiline call on the default namespace
  return (
    <p>
      {t(
        'common.loading',
        { defaultValue: 'Loading…' },
      )}
    </p>
  )
}

export function ArrayBindingForm() {
  const { t } = useTranslation(['common', 'auth'])
  // POSITIVE 8: array binding, common first
  return <p>{t('common.all')}</p>
}

export function ArrayOrderFallbackForm() {
  const { t } = useTranslation(['positions', 'translation'])
  // POSITIVE 9: first element lacks the key; i18next searches the array in order, so
  // the second element (a common.json alias) still routes this call
  return <p>{t('common.close')}</p>
}

export function RepointedNegative() {
  const { t } = useTranslation('common')
  // NEGATIVE 1: already repointed colon form
  return <p>{t('common:loading')}</p>
}

export function AbsentKeyNegative() {
  const { t } = useTranslation('common')
  // NEGATIVE 2: absent-root key — never resolved inside the nested subtree
  return <p>{t('common.previousPage', 'Previous page')}</p>
}

export function ForeignNamespaceNegative() {
  const { t } = useTranslation('auth')
  // NEGATIVE 3: same dot key, non-common namespace
  return <p>{t('common.cancel')}</p>
}
