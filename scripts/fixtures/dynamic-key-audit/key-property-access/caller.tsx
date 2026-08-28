import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const translator = useTranslation('graph')
  const key = `type.${runtimeType}`
  return translator.t(key, runtimeType)
}
