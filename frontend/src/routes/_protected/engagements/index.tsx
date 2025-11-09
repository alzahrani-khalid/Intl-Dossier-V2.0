import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useEngagements } from '@/hooks/useEngagements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
 Calendar,
 MapPin,
 Plus,
 Search,
 ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export const Route = createFileRoute('/_protected/engagements/')({
 component: EngagementsPage,
});

function EngagementsPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const locale = isRTL ? ar : enUS;
 const [searchQuery, setSearchQuery] = useState('');

 const { data: engagementsData, isLoading, error } = useEngagements({
 limit: 50,
 });

 const engagements = engagementsData?.items || [];

 // Filter engagements by search query
 const filteredEngagements = engagements.filter((engagement) => {
 const name = isRTL ? engagement.name_ar : engagement.name_en;
 return name.toLowerCase().includes(searchQuery.toLowerCase());
 });

 const engagementTypeMap: Record<string, string> = {
 meeting: t('engagements.types.meeting'),
 consultation: t('engagements.types.consultation'),
 coordination: t('engagements.types.coordination'),
 workshop: t('engagements.types.workshop'),
 conference: t('engagements.types.conference'),
 site_visit: t('engagements.types.siteVisit'),
 other: t('engagements.types.other'),
 };

 return (
 <div
 className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${
 isRTL ? 'rtl' : 'ltr'
 }`}
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 {/* Header */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold text-start">
 {t('engagements.title')}
 </h1>
 <p className="text-sm sm:text-base text-muted-foreground mt-1 text-start">
 {t('engagements.listDescription', 'Manage all international engagements')}
 </p>
 </div>
 <Button className="gap-2 w-full sm:w-auto">
 <Plus className="h-4 w-4" />
 {t('engagements.create', 'Create Engagement')}
 </Button>
 </div>

 {/* Search */}
 <Card>
 <CardContent className="pt-6">
 <div className="relative">
 <Search
 className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
 isRTL ? 'end-3' : 'start-3'
 }`}
 />
 <Input
 type="search"
 placeholder={t('engagements.searchPlaceholder', 'Search engagements...')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className={`w-full ${isRTL ? 'pe-10 ps-4' : 'ps-10 pe-4'} text-start`}
 />
 </div>
 </CardContent>
 </Card>

 {/* Engagements List */}
 {isLoading ? (
 <div className="space-y-4">
 {[...Array(5)].map((_, i) => (
 <Skeleton key={i} className="h-32 w-full" />
 ))}
 </div>
 ) : error ? (
 <Card className="border-destructive">
 <CardHeader>
 <CardTitle className="text-destructive text-start">
 {t('common.error')}
 </CardTitle>
 <CardDescription className="text-start">
 {t('engagements.loadError')}
 </CardDescription>
 </CardHeader>
 </Card>
 ) : filteredEngagements.length === 0 ? (
 <Card>
 <CardContent className="py-12 text-center">
 <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
 <p className="text-muted-foreground">
 {searchQuery
 ? t('engagements.noResults', 'No engagements found')
 : t('engagements.noEngagements', 'No engagements yet')}
 </p>
 </CardContent>
 </Card>
 ) : (
 <div className="grid gap-4">
 {filteredEngagements.map((engagement) => (
 <Card
 key={engagement.id}
 className="hover:shadow-md transition-shadow"
 >
 <CardContent className="p-4 sm:p-6">
 <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
 <div className="flex-1 space-y-2 w-full">
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
 <h3 className="text-lg font-semibold text-start">
 {isRTL ? engagement.name_ar : engagement.name_en}
 </h3>
 <Badge variant="secondary" className="w-fit">
 {engagementTypeMap[engagement.engagement_type] ||
 engagement.engagement_type}
 </Badge>
 </div>

 {(isRTL ? engagement.description_ar : engagement.description_en) && (
 <p className="text-sm text-muted-foreground line-clamp-2 text-start">
 {isRTL ? engagement.description_ar : engagement.description_en}
 </p>
 )}

 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
 <div className="flex items-center gap-2">
 <Calendar className="h-4 w-4" />
 <span>
 {format(
 new Date(engagement.created_at),
 'PPP',
 { locale }
 )}
 </span>
 </div>
 {(isRTL ? engagement.location_ar : engagement.location_en) && (
 <div className="flex items-center gap-2">
 <MapPin className="h-4 w-4" />
 <span>{isRTL ? engagement.location_ar : engagement.location_en}</span>
 </div>
 )}
 </div>
 </div>

 <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
 <Link
 to="/engagements/$engagementId"
 params={{ engagementId: engagement.id }}
 className="gap-2"
 >
 {t('common.view', 'View')}
 <ChevronRight
 className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`}
 />
 </Link>
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
