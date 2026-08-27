import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')
  const routes = { key: `type.${runtimeType}` }
  const { key } = routes
  // @audit-line 7
  return t(key, runtimeType)
}
