// Controlled fixture for `i18n-binding-census.mjs <root> --self-check`.
// Nine positive pre-flatten routes exercise the supported static binding forms.
// The named controls then prove ordered scalar/object shadowing, per-locale
// outcomes, and exclusion of each blind syntax population.
import { useTranslation } from 'react-i18next'

export function KeyPrefixForm({ t }: { t: (key: string) => string }) {
  // POSITIVE 1: an explicit prefix wins even though the t binding is invisible.
  return <p>{t('translation:common.loading')}</p>
}

export function DoublePrefixForm() {
  const { t } = useTranslation()
  // POSITIVE 2: double prefix `common:common.*`.
  return <p>{t('common:common.cancel')}</p>
}

export function NsOptionTranslationForm() {
  const { t } = useTranslation('calendar')
  // POSITIVE 3: options-object namespace override.
  return <p>{t('common.saving', { ns: 'translation' })}</p>
}

export function NsOptionCommonForm() {
  const { t } = useTranslation('elected-officials')
  // POSITIVE 4: common alias plus a preserved second option.
  return <p>{t('common.previous', { ns: 'common', defaultValue: 'Previous' })}</p>
}

export function HookBindingForm() {
  const { t } = useTranslation('common')
  // POSITIVE 5: hook bound to the common resource.
  return <p>{t('common.search')}</p>
}

export function ScopedAliasForm() {
  const { t: tc } = useTranslation('translation')
  // POSITIVE 6: scoped hook alias.
  return <p>{tc('common.error')}</p>
}

export function MultilineForm() {
  const { t } = useTranslation()
  // POSITIVE 7: multiline default-namespace call.
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
  // POSITIVE 8: common is the first defining namespace.
  return <p>{t('common.all')}</p>
}

export function ControlLaterCommon() {
  const { t } = useTranslation(['positions', 'translation'])
  // POSITIVE 9 / later-common: positions lacks the path, so translation wins.
  return <p>{t('common.close')}</p>
}

export function RepointedNegative() {
  const { t } = useTranslation('common')
  return <p>{t('common:loading')}</p>
}

export function AbsentKeyNegative() {
  const { t } = useTranslation('common')
  return <p>{t('common.previousPage', 'Previous page')}</p>
}

export function ForeignNamespaceNegative() {
  const { t } = useTranslation('auth')
  return <p>{t('common.cancel')}</p>
}

export function ControlScalarShadow() {
  const { t } = useTranslation(['sla', 'translation'])
  // sla.common.actions is a scalar in both real locale bundles and must stop lookup.
  return <p>{t('common.actions')}</p>
}

export function ControlObjectShadow() {
  const { t } = useTranslation(['census-object', 'translation'])
  // The self-check's planted earlier bundle defines this path as an object.
  return <p>{t('common.close')}</p>
}

export function ControlLocaleDivergent() {
  const { t } = useTranslation(['census-locale', 'translation'])
  // Earlier definition exists only for en; ar reaches the real translation bundle.
  return <p>{t('common.close')}</p>
}

export function ControlDynamicArray({ runtimeNamespace }: { runtimeNamespace: string }) {
  const { t } = useTranslation([runtimeNamespace, 'translation'])
  return <p>{t('common.close')}</p>
}

export function ControlPropertyAccess({ translator }: { translator: { t: (key: string) => string } }) {
  return <p>{translator.t('translation:common.close')}</p>
}

export function ControlNonLiteral({ keyName }: { keyName: string }) {
  const { t } = useTranslation('common')
  return <p>{t(keyName)}</p>
}
