import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  let translate: (key: string, fallback: string) => string
  translate = useTranslation('graph').t
  translate = useTranslation('graph').t
  const key = `type.${runtimeType}`
  return translate(key, runtimeType)
}
