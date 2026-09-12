const defaultItems = [{ tooltipKey: 'navigation.dashboard' }, { tooltipKey: 'navigation.dossiers' }, { tooltipKey: 'navigation.workflow' }, { tooltipKey: 'navigation.calendar' }, { tooltipKey: 'navigation.reports' }] as const
const { t } = useTranslation()
// @audit-line 187
items.map((item) => t(item.tooltipKey, item.id.charAt(0).toUpperCase() + item.id.slice(1)))
