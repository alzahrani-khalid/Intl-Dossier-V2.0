// T050: PositionDossierLinker component
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePositionDossierLinks } from '@/hooks/usePositionDossierLinks';
import { useCreatePositionDossierLink } from '@/hooks/useCreatePositionDossierLink';
import { useDeletePositionDossierLink } from '@/hooks/useDeletePositionDossierLink';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Link as LinkIcon } from 'lucide-react';

interface PositionDossierLinkerProps {
 positionId: string;
}

export function PositionDossierLinker({ positionId }: PositionDossierLinkerProps) {
 const { t, i18n } = useTranslation(['positions', 'translation']);
 const isRTL = i18n.language === 'ar';

 const [isAdding, setIsAdding] = useState(false);
 const [selectedDossierId, setSelectedDossierId] = useState('');
 const [linkType, setLinkType] = useState<'primary' | 'related' | 'reference'>('related');
 const [notes, setNotes] = useState('');

 const { links, isLoading, error } = usePositionDossierLinks(positionId);
 const createLink = useCreatePositionDossierLink(positionId);
 const deleteLink = useDeletePositionDossierLink();

 const handleAddLink = async () => {
 if (!selectedDossierId) return;

 try {
 await createLink.mutateAsync({
 dossier_id: selectedDossierId,
 link_type: linkType,
 notes: notes || undefined,
 });

 // Reset form
 setSelectedDossierId('');
 setLinkType('related');
 setNotes('');
 setIsAdding(false);
 } catch (err) {
 console.error('Failed to create link:', err);
 }
 };

 const handleDeleteLink = async (dossierId: string) => {
 try {
 await deleteLink.mutateAsync({
 positionId,
 dossierId,
 });
 } catch (err) {
 console.error('Failed to delete link:', err);
 }
 };

 if (isLoading) {
 return (
 <Card className="p-8 text-center">
 <p className="text-muted-foreground">{t('common.loading')}</p>
 </Card>
 );
 }

 if (error) {
 return (
 <Card className="p-8 text-center">
 <p className="text-destructive">{t('errors.failed_to_load')}</p>
 </Card>
 );
 }

 return (
 <div className="flex flex-col gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
 {/* Header */}
 <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
 <h3 className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
 <LinkIcon className="size-5" />
 {t('position_dossier_links.title')}
 </h3>
 {!isAdding && (
 <Button
 size="sm"
 onClick={() => setIsAdding(true)}
 className="w-full sm:w-auto"
 >
 <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('position_dossier_links.add_link')}
 </Button>
 )}
 </div>

 {/* Add Link Form */}
 {isAdding && (
 <Card className="p-4">
 <div className="flex flex-col gap-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div className="flex flex-col gap-2">
 <label className="text-sm font-medium">{t('position_dossier_links.select_dossier')}</label>
 <Select value={selectedDossierId} onValueChange={setSelectedDossierId}>
 <SelectTrigger>
 <SelectValue placeholder={t('position_dossier_links.select_placeholder')} />
 </SelectTrigger>
 <SelectContent>
 {/* TODO: Fetch and display available dossiers */}
 <SelectItem value="placeholder">{t('position_dossier_links.no_dossiers')}</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="flex flex-col gap-2">
 <label className="text-sm font-medium">{t('position_dossier_links.link_type')}</label>
 <Select value={linkType} onValueChange={(v) => setLinkType(v as typeof linkType)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="primary">{t('position_dossier_links.types.primary')}</SelectItem>
 <SelectItem value="related">{t('position_dossier_links.types.related')}</SelectItem>
 <SelectItem value="reference">{t('position_dossier_links.types.reference')}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="flex flex-col gap-2">
 <label className="text-sm font-medium">{t('position_dossier_links.notes_optional')}</label>
 <Textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder={t('position_dossier_links.notes_placeholder')}
 rows={2}
 />
 </div>

 <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
 <Button
 variant="outline"
 onClick={() => {
 setIsAdding(false);
 setSelectedDossierId('');
 setNotes('');
 }}
 className="w-full sm:w-auto"
 >
 {t('common.cancel')}
 </Button>
 <Button
 onClick={handleAddLink}
 disabled={!selectedDossierId || createLink.isPending}
 className="w-full sm:w-auto"
 >
 {createLink.isPending ? t('common.saving') : t('position_dossier_links.add_link')}
 </Button>
 </div>
 </div>
 </Card>
 )}

 {/* Links List */}
 {links.length === 0 ? (
 <Card className="p-8 text-center">
 <p className="text-muted-foreground">{t('position_dossier_links.no_links')}</p>
 </Card>
 ) : (
 <div className="grid grid-cols-1 gap-2">
 {links.map((link) => (
 <Card key={link.dossier_id} className="p-4">
 <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <h4 className="truncate text-sm font-medium sm:text-base">
 {isRTL ? link.dossier?.name_ar : link.dossier?.name_en}
 </h4>
 <Badge variant="outline" className="shrink-0">
 {t(`position_dossier_links.types.${link.link_type}`)}
 </Badge>
 </div>
 {link.notes && (
 <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{link.notes}</p>
 )}
 </div>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleDeleteLink(link.dossier_id)}
 disabled={deleteLink.isPending}
 className="shrink-0"
 >
 <X className="size-4" />
 </Button>
 </div>
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
