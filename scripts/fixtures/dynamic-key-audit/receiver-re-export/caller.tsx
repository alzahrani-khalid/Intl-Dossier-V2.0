import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain-export'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')

  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  // @audit-line 7
  return t(key, runtimeType)
}
