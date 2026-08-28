import { useTranslation as useI18n } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useI18n('graph')
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return t(key, runtimeType)
}
