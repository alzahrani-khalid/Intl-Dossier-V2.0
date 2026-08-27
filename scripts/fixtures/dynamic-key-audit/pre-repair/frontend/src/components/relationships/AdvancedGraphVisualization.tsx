import { DOSSIER_CARD_TYPES } from '@/lib/dossier-type-guards'
import { graphNodeColors as SEMANTIC_NODE_COLORS } from '@/lib/semantic-colors'
const NODE_COLORS = SEMANTIC_NODE_COLORS
const { t } = useTranslation('graph')
function ClusterNode({ data }) {
// @audit-line 413
  return t(data.clusterType, data.clusterType)
}
// @audit-line 1542
t(`type.${type}`, type)
// @audit-line 1560
t(`relationship.${type}`, type.replace(/_/g, ' '))
// @audit-line 1645
t(`type.${type}`, type)
// @audit-line 1853
Object.entries(NODE_COLORS).slice(0, 6).map(([type]) => t(`type.${type}`, type))
