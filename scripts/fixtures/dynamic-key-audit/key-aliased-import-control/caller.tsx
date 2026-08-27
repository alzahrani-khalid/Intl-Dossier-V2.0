import { useTranslation } from 'react-i18next'
import { routeKey as key } from '@/fixture/canonical-key'

export function Fixture({ runtimeType }: { runtimeType: string }) {
  const { t } = useTranslation('graph')

  // @audit-line 7
  return t(key, runtimeType)
}
