import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
let TYPES = DOSSIER_CARD_TYPES
TYPES = ['country'] as const
export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')

  const key = TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  // @audit-line 7
  return t(key, runtimeType)
}
