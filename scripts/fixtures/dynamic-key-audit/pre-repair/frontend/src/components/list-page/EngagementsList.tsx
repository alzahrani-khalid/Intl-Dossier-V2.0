const FILTERS = [{ labelKey: 'filter.all' }, { labelKey: 'filter.meeting' }, { labelKey: 'filter.travel' }] as const
const { t } = useTranslation('engagements')
FILTERS.map((f) => t(f.labelKey, 'All'))
