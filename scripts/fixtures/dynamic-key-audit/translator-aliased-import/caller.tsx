import { useTranslation as useI18n } from '@/fixture/decoy-i18n'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useI18n('graph')
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return t(key, runtimeType)
}
