import { useTranslation as canonicalUseTranslation } from 'react-i18next'
import { useTranslation as selectedUseTranslation } from '@/fixture/decoy-i18n'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t: translate } = canonicalUseTranslation('graph')
  {
    const { t: translate } = selectedUseTranslation('graph')
    const key = DOSSIER_CARD_TYPES.includes(runtimeType)
      ? `type.${runtimeType}`
      : 'type.unknown'
    return translate(key, runtimeType)
  }
}
