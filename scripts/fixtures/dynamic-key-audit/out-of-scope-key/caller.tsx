import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  { const key = DOSSIER_CARD_TYPES.includes(runtimeType) ? `type.${runtimeType}` : 'type.unknown'; void key }
  // @audit-line 7
  return t(key, runtimeType)
}
