const TEMPLATES = [{ labelKey: 'analyze.template.forumMembership' }, { labelKey: 'analyze.template.sharedCommittees' }, { labelKey: 'analyze.template.engagementChain' }, { labelKey: 'analyze.template.shortestPath' }] as const
const { t } = useTranslation('graph')
TEMPLATES.map((tpl) => t(tpl.labelKey, 'Template'))
