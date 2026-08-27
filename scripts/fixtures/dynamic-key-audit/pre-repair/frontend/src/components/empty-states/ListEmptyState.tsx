export type EntityType='document'|'dossier'|'engagement'|'commitment'|'organization'|'country'|'forum'|'event'|'task'|'person'|'position'|'mou'|'topic'|'working_group'|'elected_official'|'work_item'|'generic'
interface ListEmptyStateProps{entityType:EntityType}
const entityConfig:Record<EntityType,{translationKey:EntityType}>={
document:{translationKey:'document'},
dossier:{translationKey:'dossier'},
engagement:{translationKey:'engagement'},
commitment:{translationKey:'commitment'},
organization:{translationKey:'organization'},
country:{translationKey:'country'},
forum:{translationKey:'forum'},
event:{translationKey:'event'},
task:{translationKey:'task'},
person:{translationKey:'person'},
position:{translationKey:'position'},
mou:{translationKey:'mou'},
topic:{translationKey:'topic'},
working_group:{translationKey:'working_group'},
elected_official:{translationKey:'elected_official'},
work_item:{translationKey:'work_item'},
generic:{translationKey:'generic'},
}
export function ListEmptyState({entityType}:ListEmptyStateProps){
const {t}=useTranslation('empty-states')
const config=entityConfig[entityType]
const translationKey=config.translationKey
t(`list.${translationKey}.firstTitle`,'firstTitle')
t(`list.${translationKey}.title`,'title')
t(`list.${translationKey}.firstDescription`,'firstDescription')
t(`list.${translationKey}.description`,'description')
t(`list.${translationKey}.hint`,'hint')
t(`list.${translationKey}.cta`,'cta')
t(`list.${translationKey}.createFirst`,'createFirst')
t(`list.${translationKey}.create`,'create')
t(`list.${translationKey}.import`,'import')
}
