import { useTranslation } from '@/fixture/decoy-i18n'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  let translate: (key: string, fallback: string) => string
  translate = useTranslation('graph').t
  translate = useTranslation('graph').t
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return translate(key, runtimeType)
}
