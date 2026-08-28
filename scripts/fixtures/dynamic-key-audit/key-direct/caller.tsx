import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const key = `type.${runtimeType}`
  return useTranslation('graph').t(key, runtimeType)
}
