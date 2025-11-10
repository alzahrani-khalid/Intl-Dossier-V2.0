import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Building2, Globe } from 'lucide-react'

interface ForumParticipant {
 entity_id: string
 entity_type: 'country' | 'organization'
 participation_type: string
 years_participated: number[]
 participant_name: string
}

interface ForumParticipantsDialogProps {
 forumId: string | null
 forumName: string
 open: boolean
 onOpenChange: (open: boolean) => void
}

export function ForumParticipantsDialog({
 forumId,
 forumName,
 open,
 onOpenChange,
}: ForumParticipantsDialogProps) {
 const { t, i18n } = useTranslation('forums')
 const isRTL = i18n.language === 'ar'

 const { data: participants, isLoading } = useQuery({
 queryKey: ['forum-participants', forumId],
 queryFn: async () => {
 if (!forumId) return []

 const { data, error } = await supabase
 .from('forum_participants')
 .select(`
 entity_id,
 entity_type,
 participation_type,
 years_participated
 `)
 .eq('forum_id', forumId)

 if (error) throw error

 // Fetch entity names
 const enrichedData = await Promise.all(
 data.map(async (participant) => {
 if (participant.entity_type === 'country') {
 const { data: country } = await supabase
 .from('countries')
 .select('name_en, name_ar')
 .eq('id', participant.entity_id)
 .single()

 return {
 ...participant,
 participant_name: isRTL ? country?.name_ar : country?.name_en,
 }
 } else {
 const { data: org } = await supabase
 .from('organizations')
 .select('name_en, name_ar')
 .eq('id', participant.entity_id)
 .single()

 return {
 ...participant,
 participant_name: isRTL ? org?.name_ar : org?.name_en,
 }
 }
 })
 )

 return enrichedData as ForumParticipant[]
 },
 enabled: !!forumId && open,
 })

 const countries = participants?.filter((p) => p.entity_type === 'country') || []
 const organizations = participants?.filter((p) => p.entity_type === 'organization') || []

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
 <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
 <span className="truncate">{forumName}</span>
 <span className="hidden sm:inline">-</span>
 <span className="hidden sm:inline">{t('participants')}</span>
 </DialogTitle>
 <DialogDescription className="sr-only">
 {t('participants')} {t('common:for')} {forumName}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 sm:space-y-6">
 {/* Countries Section */}
 <div>
 <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-2 sm:mb-3">
 <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
 {t('countries')} ({countries.length})
 </h3>

 {isLoading ? (
 <div className="space-y-2">
 {[...Array(3)].map((_, i) => (
 <Skeleton key={i} className="h-16 w-full" />
 ))}
 </div>
 ) : countries.length > 0 ? (
 <div className="grid gap-2 sm:gap-3">
 {countries.map((participant) => (
 <div
 key={participant.entity_id}
 className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors gap-2 sm:gap-3"
 >
 <div className="flex items-center gap-2 sm:gap-3 min-w-0">
 <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
 <div className="min-w-0">
 <p className="font-medium text-sm sm:text-base truncate">{participant.participant_name}</p>
 <p className="text-xs sm:text-sm text-muted-foreground">
 {t(`participationType.${participant.participation_type}`)}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 ms-6 sm:ms-0">
 <Badge variant="outline" className="text-xs">
 {participant.years_participated.length} {t('years')}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
 {t('noCountries')}
 </p>
 )}
 </div>

 {/* Organizations Section */}
 <div>
 <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold mb-2 sm:mb-3">
 <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
 {t('organizations')} ({organizations.length})
 </h3>

 {isLoading ? (
 <div className="space-y-2">
 {[...Array(2)].map((_, i) => (
 <Skeleton key={i} className="h-16 w-full" />
 ))}
 </div>
 ) : organizations.length > 0 ? (
 <div className="grid gap-2 sm:gap-3">
 {organizations.map((participant) => (
 <div
 key={participant.entity_id}
 className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors gap-2 sm:gap-3"
 >
 <div className="flex items-center gap-2 sm:gap-3 min-w-0">
 <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
 <div className="min-w-0">
 <p className="font-medium text-sm sm:text-base truncate">{participant.participant_name}</p>
 <p className="text-xs sm:text-sm text-muted-foreground">
 {t(`participationType.${participant.participation_type}`)}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 ms-6 sm:ms-0">
 <Badge variant="outline" className="text-xs">
 {participant.years_participated.length} {t('years')}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
 {t('noOrganizations')}
 </p>
 )}
 </div>
 </div>
 </DialogContent>
 </Dialog>
 )
}
