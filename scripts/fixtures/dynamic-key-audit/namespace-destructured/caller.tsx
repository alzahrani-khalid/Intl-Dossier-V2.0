import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
const namespaces = { graph: 'missing' }
const { graph: namespace } = namespaces
export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation(namespace)

  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  // @audit-line 7
  return t(key, runtimeType)
}
