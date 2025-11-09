import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, FileText, Briefcase, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type WorkItemType = 'dossier' | 'position' | 'ticket';

interface WorkItem {
 type: WorkItemType;
 id: string;
 title: string;
}

interface WorkItemLinkerProps {
 selectedItems: WorkItem[];
 onItemsChange: (items: WorkItem[]) => void;
 disabled?: boolean;
}

export function WorkItemLinker({
 selectedItems,
 onItemsChange,
 disabled = false,
}: WorkItemLinkerProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const [isOpen, setIsOpen] = useState(false);
 const [selectedType, setSelectedType] = useState<WorkItemType>('dossier');
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState<WorkItem[]>([]);

 // Mock search function - replace with actual API call
 const handleSearch = async (query: string, type: WorkItemType) => {
 // TODO: Replace with actual API call
 const mockResults: WorkItem[] = [
 { type: 'dossier', id: '1', title: 'Australia Population Data Initiative' },
 { type: 'dossier', id: '2', title: 'Canada Trade Agreement Review' },
 { type: 'position', id: '3', title: 'Senior Analyst Position' },
 { type: 'ticket', id: '4', title: 'Intake #25' },
 ].filter(
 (item) =>
 item.type === type &&
 item.title.toLowerCase().includes(query.toLowerCase())
 );

 setSearchResults(mockResults);
 };

 const handleAddItem = (item: WorkItem) => {
 if (!selectedItems.find((i) => i.id === item.id && i.type === item.type)) {
 onItemsChange([...selectedItems, item]);
 }
 setSearchQuery('');
 setSearchResults([]);
 };

 const handleRemoveItem = (itemId: string, itemType: WorkItemType) => {
 onItemsChange(
 selectedItems.filter((i) => !(i.id === itemId && i.type === itemType))
 );
 };

 const getIcon = (type: WorkItemType) => {
 switch (type) {
 case 'dossier':
 return <FileText className="size-4" />;
 case 'position':
 return <Briefcase className="size-4" />;
 case 'ticket':
 return <Ticket className="size-4" />;
 }
 };

 return (
 <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
 <Label className="text-sm sm:text-base">{t('tasks.linkedItems')}</Label>

 {/* Selected items display */}
 <div className="flex flex-wrap gap-2">
 {selectedItems.map((item) => (
 <div
 key={`${item.type}-${item.id}`}
 className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
 >
 {getIcon(item.type)}
 <span className="text-start">{item.title}</span>
 <Button
 variant="ghost"
 size="icon"
 className="h-5 w-5"
 onClick={() => handleRemoveItem(item.id, item.type)}
 disabled={disabled}
 >
 <X className="size-3" />
 <span className="sr-only">{t('common.remove')}</span>
 </Button>
 </div>
 ))}

 {selectedItems.length === 0 && (
 <p className="text-sm text-muted-foreground text-start">
 {t('tasks.noLinkedItems')}
 </p>
 )}
 </div>

 {/* Add item dialog */}
 <Dialog open={isOpen} onOpenChange={setIsOpen}>
 <DialogTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="w-full sm:w-auto"
 disabled={disabled}
 >
 <Plus className={`size-4 ${isRTL ? 'ms-2' : 'me-2'}`} />
 {t('tasks.addWorkItem')}
 </Button>
 </DialogTrigger>

 <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl">
 <DialogHeader>
 <DialogTitle className="text-start text-lg sm:text-xl">
 {t('tasks.linkWorkItems')}
 </DialogTitle>
 <DialogDescription className="text-start text-sm sm:text-base">
 {t('tasks.linkWorkItemsDescription')}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
 {/* Type selector */}
 <div className="space-y-2">
 <Label className="text-sm sm:text-base">{t('tasks.itemType')}</Label>
 <Select
 value={selectedType}
 onValueChange={(value) => setSelectedType(value as WorkItemType)}
 >
 <SelectTrigger className="w-full">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="dossier">
 <div className="flex items-center gap-2">
 <FileText className="size-4" />
 <span>{t('tasks.dossier')}</span>
 </div>
 </SelectItem>
 <SelectItem value="position">
 <div className="flex items-center gap-2">
 <Briefcase className="size-4" />
 <span>{t('tasks.position')}</span>
 </div>
 </SelectItem>
 <SelectItem value="ticket">
 <div className="flex items-center gap-2">
 <Ticket className="size-4" />
 <span>{t('tasks.ticket')}</span>
 </div>
 </SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Search input */}
 <div className="space-y-2">
 <Label className="text-sm sm:text-base">{t('tasks.search')}</Label>
 <Input
 type="text"
 placeholder={t('tasks.searchPlaceholder')}
 value={searchQuery}
 onChange={(e) => {
 setSearchQuery(e.target.value);
 if (e.target.value.length >= 2) {
 handleSearch(e.target.value, selectedType);
 } else {
 setSearchResults([]);
 }
 }}
 className="text-start"
 />
 </div>

 {/* Search results */}
 {searchResults.length > 0 && (
 <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
 {searchResults.map((result) => (
 <Button
 key={`${result.type}-${result.id}`}
 variant="ghost"
 className="h-auto w-full justify-start px-3 py-2 text-start"
 onClick={() => handleAddItem(result)}
 >
 <div className="flex items-center gap-2">
 {getIcon(result.type)}
 <span>{result.title}</span>
 </div>
 </Button>
 ))}
 </div>
 )}

 {searchQuery.length >= 2 && searchResults.length === 0 && (
 <p className="text-sm text-muted-foreground text-start">
 {t('tasks.noResults')}
 </p>
 )}
 </div>

 <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
 <Button
 variant="outline"
 onClick={() => setIsOpen(false)}
 className="w-full sm:w-auto"
 >
 {t('common.close')}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
