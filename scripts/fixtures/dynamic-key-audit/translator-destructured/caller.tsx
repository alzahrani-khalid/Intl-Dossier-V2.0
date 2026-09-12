import { useTranslation } from '@/fixture/decoy-i18n'
import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('quickswitcher')
  const plain = t('type.unknown', runtimeType)
  const { t: tQs } = useTranslation('quickswitcher')
  const key = DOSSIER_CARD_TYPES.includes(runtimeType)
    ? `type.${runtimeType}`
    : 'type.unknown'
  return `${plain}${tQs(key, runtimeType)}`
}
