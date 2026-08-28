import { useTranslation } from 'react-i18next'
import { DOSSIER_CARD_TYPES } from '@/fixture/decoy-domain'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  let translate: (key: string, fallback: string) => string
  translate = useTranslation('graph').t
  translate = useTranslation('graph').t
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return translate(key, runtimeType)
}
