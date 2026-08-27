type AnalyticQueryType = 'forumMembership' | 'sharedCommittees' | 'engagementChain' | 'shortestPath'
const analyzeLabelKey: Record<AnalyticQueryType, string> = { forumMembership: 'quickActions.analyzeForumMembership', sharedCommittees: 'quickActions.analyzeSharedCommittees', engagementChain: 'quickActions.analyzeEngagementChains', shortestPath: 'quickActions.analyzeShortestPath' }
const { t } = useTranslation('keyboard-shortcuts')
const { t: tQs } = useTranslation('quickswitcher')
const { t: tCommon } = useTranslation('common')
const groupKey = 'dynamic'; const group = { type: 'country' }; const dossierTypeLabels = { country: { en: 'Country' } }
const page = { label: 'dynamic', id: 'page' }
getAnalyzeCommandActions().map((analyze) => t(analyzeLabelKey[analyze.queryType], 'Analyze'))
// @audit-line 1397
tQs(groupKey, dossierTypeLabels[group.type]?.en || group.type)
// @audit-line 1546
tCommon(page.label, page.id)
// @audit-line 1554
tCommon(page.label, page.id)
