import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/entity-links-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Filter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RelatedIntakesTabProps {
 entityType: string;
 entityId: string;
}

interface IntakeLink {
 id: string;
 intake_id: string;
 intake_title: string;
 intake_description: string;
 link_type: 'primary' | 'related' | 'requested' | 'mentioned' | 'assigned_to';
 created_at: string;
 linked_by_name: string;
 notes: string | null;
}

export function RelatedIntakesTab({ entityType, entityId }: RelatedIntakesTabProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [selectedLinkType, setSelectedLinkType] = useState<string | null>(null);
 const [currentPage, setCurrentPage] = useState(1);
 const PAGE_SIZE = 50;

 // Fetch related intakes with filtering and pagination
 const { data, isLoading, error } = useQuery({
 queryKey: ['entity-intakes', entityType, entityId, selectedLinkType, currentPage],
 queryFn: () => api.getEntityIntakes(entityType, entityId, {
 link_type: selectedLinkType || undefined,
 page: currentPage,
 page_size: PAGE_SIZE,
 }),
 staleTime: 30_000, // 30 seconds
 });

 const linkTypes = ['primary', 'related', 'requested', 'mentioned', 'assigned_to'];

 const handleLinkTypeFilter = (linkType: string) => {
 setSelectedLinkType(linkType === selectedLinkType ? null : linkType);
 setCurrentPage(1); // Reset to first page when filtering
 };

 const handlePageChange = (newPage: number) => {
 setCurrentPage(newPage);
 };

 if (isLoading) {
 return (
 <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-32 w-full" />
 <Skeleton className="h-32 w-full" />
 <Skeleton className="h-32 w-full" />
 </div>
 );
 }

 if (error) {
 return (
 <Alert variant="destructive" dir={isRTL ? 'rtl' : 'ltr'}>
 <AlertCircle className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 <AlertDescription>
 {t('entity.related_intakes.error', 'Failed to load related intakes. Please try again.')}
 </AlertDescription>
 </Alert>
 );
 }

 const intakes = data?.intakes || [];
 const totalCount = data?.total_count || 0;
 const totalPages = Math.ceil(totalCount / PAGE_SIZE);

 return (
 <div className="space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Filter Section */}
 <Card>
 <CardHeader>
 <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
 <Filter className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
 {t('entity.related_intakes.filters', 'Filter by Link Type')}
 </CardTitle>
 <CardDescription>
 {t('entity.related_intakes.filter_description', 'Show intakes linked as:')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-2">
 {linkTypes.map((linkType) => (
 <Button
 key={linkType}
 variant={selectedLinkType === linkType ? 'default' : 'outline'}
 size="sm"
 onClick={() => handleLinkTypeFilter(linkType)}
 className=" px-3 sm:px-4"
 >
 {t(`entity.link_type.${linkType}`, linkType)}
 </Button>
 ))}
 {selectedLinkType && (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 setSelectedLinkType(null);
 setCurrentPage(1);
 }}
 className=" px-3 sm:px-4"
 >
 {t('common.clear_filters', 'Clear Filters')}
 </Button>
 )}
 </div>
 </CardContent>
 </Card>

 {/* Results Count */}
 <div className="flex items-center justify-between px-4 sm:px-0">
 <p className="text-sm text-muted-foreground">
 {t('entity.related_intakes.count', {
 count: totalCount,
 defaultValue: '{{count}} intake(s) found',
 })}
 </p>
 {selectedLinkType && (
 <Badge variant="secondary">
 {t(`entity.link_type.${selectedLinkType}`, selectedLinkType)}
 </Badge>
 )}
 </div>

 {/* Intakes List */}
 {intakes.length === 0 ? (
 <Card>
 <CardContent className="py-8 text-center">
 <p className="text-muted-foreground">
 {t('entity.related_intakes.no_results', 'No related intakes found.')}
 </p>
 </CardContent>
 </Card>
 ) : (
 <div className="space-y-4">
 {intakes.map((intake: IntakeLink) => (
 <Card key={intake.id} className="hover:shadow-md transition-shadow">
 <CardHeader>
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
 <CardTitle className="text-base sm:text-lg">
 {intake.intake_title}
 </CardTitle>
 <Badge variant="outline" className="w-fit">
 {t(`entity.link_type.${intake.link_type}`, intake.link_type)}
 </Badge>
 </div>
 <CardDescription className="text-sm">
 {new Date(intake.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 })}
 {' • '}
 {t('entity.related_intakes.linked_by', 'Linked by')}: {intake.linked_by_name}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-2">
 <p className="text-sm text-muted-foreground line-clamp-2">
 {intake.intake_description}
 </p>
 {intake.notes && (
 <div className="pt-2 border-t">
 <p className="text-sm font-medium mb-1">
 {t('entity.related_intakes.notes', 'Notes')}:
 </p>
 <p className="text-sm text-muted-foreground italic">
 {intake.notes}
 </p>
 </div>
 )}
 <Button
 variant="link"
 size="sm"
 className="p-0 h-auto"
 onClick={() => window.location.href = `/intakes/${intake.intake_id}`}
 >
 {t('entity.related_intakes.view_intake', 'View Intake')} →
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {/* Pagination Controls */}
 {totalPages > 1 && (
 <div className="flex items-center justify-center gap-2 pt-4">
 <Button
 variant="outline"
 size="sm"
 onClick={() => handlePageChange(currentPage - 1)}
 disabled={currentPage === 1}
 className=" "
 >
 {isRTL ? '→' : '←'}
 </Button>
 <span className="text-sm text-muted-foreground px-4">
 {t('common.pagination', {
 current: currentPage,
 total: totalPages,
 defaultValue: 'Page {{current}} of {{total}}',
 })}
 </span>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handlePageChange(currentPage + 1)}
 disabled={currentPage === totalPages}
 className=" "
 >
 {isRTL ? '←' : '→'}
 </Button>
 </div>
 )}
 </div>
 );
}
