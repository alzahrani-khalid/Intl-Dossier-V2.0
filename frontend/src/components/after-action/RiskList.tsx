import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Risk {
 id?: string;
 description: string;
 severity: 'low' | 'medium' | 'high' | 'critical';
 likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
 mitigation_strategy?: string;
 owner?: string;
 ai_confidence?: number;
}

interface RiskListProps {
 risks: Risk[];
 onChange: (risks: Risk[]) => void;
 readOnly?: boolean;
}

const severities: Risk['severity'][] = ['low', 'medium', 'high', 'critical'];
const likelihoods: Risk['likelihood'][] = ['unlikely', 'possible', 'likely', 'certain'];

const severityColors = {
 low: 'bg-blue-500',
 medium: 'bg-yellow-500',
 high: 'bg-orange-500',
 critical: 'bg-red-500',
};

export function RiskList({ risks, onChange, readOnly = false }: RiskListProps) {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';

 const addRisk = () => {
 onChange([
 ...risks,
 {
 description: '',
 severity: 'medium',
 likelihood: 'possible',
 },
 ]);
 };

 const removeRisk = (index: number) => {
 onChange(risks.filter((_, i) => i !== index));
 };

 const updateRisk = (index: number, field: keyof Risk, value: any) => {
 const updated = [...risks];
 updated[index] = { ...updated[index], [field]: value };
 onChange(updated);
 };

 return (
 <div className="space-y-4">
 <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
 <h3 className="text-lg font-semibold flex items-center gap-2">
 <AlertTriangle className="h-5 w-5" />
 {t('afterActions.risks.title')}
 </h3>
 {!readOnly && (
 <Button type="button" variant="outline" size="sm" onClick={addRisk}>
 <Plus className={cn('h-4 w-4', isRTL ? 'ms-2' : 'me-2')} />
 {t('afterActions.risks.add')}
 </Button>
 )}
 </div>

 {risks.length === 0 && (
 <p className="text-sm text-muted-foreground">{t('afterActions.risks.empty')}</p>
 )}

 {risks.map((risk, index) => (
 <Card key={index} className="border-l-4" style={{ borderLeftColor: `var(--${severityColors[risk.severity]})` }}>
 <CardHeader>
 <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
 <CardTitle className="text-base">
 {t('afterActions.risks.item', { number: index + 1 })}
 </CardTitle>
 <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
 <Badge className={severityColors[risk.severity]}>
 {t(`afterActions.risks.severities.${risk.severity}`)}
 </Badge>
 {risk.ai_confidence !== undefined && (
 <Badge
 variant={risk.ai_confidence >= 0.8 ? 'default' : risk.ai_confidence >= 0.5 ? 'secondary' : 'destructive'}
 >
 {t('afterActions.confidence', { value: Math.round(risk.ai_confidence * 100) })}
 </Badge>
 )}
 {!readOnly && (
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => removeRisk(index)}
 >
 <Trash2 className="h-4 w-4 text-destructive" />
 </Button>
 )}
 </div>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <div>
 <Label htmlFor={`risk-description-${index}`}>
 {t('afterActions.risks.description')} *
 </Label>
 <Textarea
 id={`risk-description-${index}`}
 value={risk.description}
 onChange={(e) => updateRisk(index, 'description', e.target.value)}
 placeholder={t('afterActions.risks.descriptionPlaceholder')}
 rows={2}
 maxLength={2000}
 disabled={readOnly}
 dir={isRTL ? 'rtl' : 'ltr'}
 required
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <Label htmlFor={`severity-${index}`}>{t('afterActions.risks.severity')} *</Label>
 <Select
 value={risk.severity}
 onValueChange={(value) => updateRisk(index, 'severity', value)}
 disabled={readOnly}
 >
 <SelectTrigger id={`severity-${index}`} dir={isRTL ? 'rtl' : 'ltr'}>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {severities.map((severity) => (
 <SelectItem key={severity} value={severity}>
 {t(`afterActions.risks.severities.${severity}`)}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor={`likelihood-${index}`}>{t('afterActions.risks.likelihood')} *</Label>
 <Select
 value={risk.likelihood}
 onValueChange={(value) => updateRisk(index, 'likelihood', value)}
 disabled={readOnly}
 >
 <SelectTrigger id={`likelihood-${index}`} dir={isRTL ? 'rtl' : 'ltr'}>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {likelihoods.map((likelihood) => (
 <SelectItem key={likelihood} value={likelihood}>
 {t(`afterActions.risks.likelihoods.${likelihood}`)}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div>
 <Label htmlFor={`mitigation-${index}`}>
 {t('afterActions.risks.mitigationStrategy')}
 </Label>
 <Textarea
 id={`mitigation-${index}`}
 value={risk.mitigation_strategy || ''}
 onChange={(e) => updateRisk(index, 'mitigation_strategy', e.target.value)}
 placeholder={t('afterActions.risks.mitigationPlaceholder')}
 rows={2}
 disabled={readOnly}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </div>

 <div>
 <Label htmlFor={`risk-owner-${index}`}>{t('afterActions.risks.owner')}</Label>
 <Input
 id={`risk-owner-${index}`}
 value={risk.owner || ''}
 onChange={(e) => updateRisk(index, 'owner', e.target.value)}
 placeholder={t('afterActions.risks.ownerPlaceholder')}
 maxLength={200}
 disabled={readOnly}
 dir={isRTL ? 'rtl' : 'ltr'}
 />
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 );
}
