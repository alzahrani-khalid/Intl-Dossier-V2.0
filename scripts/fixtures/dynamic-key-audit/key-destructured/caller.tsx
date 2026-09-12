import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  const plain = t('type.unknown', runtimeType)
  const { t: tQs } = useTranslation('graph')
  const key = `type.${runtimeType}`
  return `${plain}${tQs(key, runtimeType)}`
}
