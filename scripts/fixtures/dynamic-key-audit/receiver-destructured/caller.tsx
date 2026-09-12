import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  const plain = t('type.unknown', runtimeType)
  const { t: tQs } = useTranslation('graph')
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return `${plain}${tQs(key, runtimeType)}`
}
