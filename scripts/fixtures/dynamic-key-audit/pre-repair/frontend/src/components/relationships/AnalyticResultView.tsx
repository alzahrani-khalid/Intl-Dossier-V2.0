type TFn = (key: string, fallback: string) => string
const { t } = useTranslation('graph')
function countLine(t: TFn, key: string, fallback: string) { return t(key, fallback) }
function renderCountLine() { return [countLine(t, 'analyze.count.membership', '{{count}}'), countLine(t, 'analyze.count.intersection', '{{count}}'), countLine(t, 'analyze.count.chain', '{{count}}'), countLine(t, 'analyze.count.path', '{{count}}')] }
// @audit-line 261
t(`type.${node.type}`, node.type)
// @audit-line 300
t(`type.${node.type}`, node.type)
