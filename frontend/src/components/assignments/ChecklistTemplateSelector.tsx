import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2 } from 'lucide-react'
import type { Database } from '@/types/database'

type ChecklistTemplate = Database['public']['Tables']['assignment_checklist_templates']['Row']

interface ChecklistTemplateSelectorProps {
  onSelect: (templateId: string) => void
  onClose: () => void
  templates?: ChecklistTemplate[]
}

export function ChecklistTemplateSelector({
  onSelect,
  onClose,
  templates = [],
}: ChecklistTemplateSelectorProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'
  const isArabic = i18n.language === 'ar'

  const getTemplateName = (template: ChecklistTemplate): string => {
    return isArabic ? template.name_ar : template.name_en
  }

  const getTemplateDescription = (template: ChecklistTemplate): string | null => {
    return isArabic ? template.description_ar : template.description_en
  }

  const getTemplateItems = (
    template: ChecklistTemplate,
  ): Array<{ text_en: string; text_ar: string; sequence: number }> => {
    return template.items_json as Array<{ text_en: string; text_ar: string; sequence: number }>
  }

  const handleSelect = (templateId: string): void => {
    onSelect(templateId)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            {t('checklist.selectTemplate')}
          </DialogTitle>
          <DialogDescription>{t('checklist.selectTemplateDescription')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {templates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('checklist.noTemplates')}
            </div>
          ) : (
            templates.map((template) => {
              const items = getTemplateItems(template)
              const itemText = isArabic
                ? items.map((item) => item.text_ar)
                : items.map((item) => item.text_en)

              return (
                <Card key={template.id} className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Template Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <h3 className="text-lg font-semibold">{getTemplateName(template)}</h3>
                          {getTemplateDescription(template) && (
                            <p className="text-sm text-muted-foreground">
                              {getTemplateDescription(template)}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {items.length} {t('checklist.items')}
                        </Badge>
                      </div>

                      {/* Work Types */}
                      {template.applicable_work_types &&
                        template.applicable_work_types.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.applicable_work_types.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {t(`workItem.type_${type}`)}
                              </Badge>
                            ))}
                          </div>
                        )}

                      {/* Preview Items */}
                      <div className="space-y-1 border-l-2 border-muted ps-4">
                        {itemText.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <span className="text-muted-foreground">{item}</span>
                          </div>
                        ))}
                        {items.length > 5 && (
                          <div className="ps-6 text-xs text-muted-foreground">
                            {t('checklist.andMore', { count: items.length - 5 })}
                          </div>
                        )}
                      </div>

                      {/* Select Button */}
                      <div className="pt-2">
                        <Button
                          onClick={() => handleSelect(template.id)}
                          className="w-full"
                          variant="outline"
                        >
                          {t('checklist.useTemplate')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
