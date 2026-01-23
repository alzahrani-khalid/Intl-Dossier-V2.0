import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle } from 'lucide-react'
import type { Database } from '@/types/database'

type ChecklistItem = Database['public']['Tables']['assignment_checklist_items']['Row']

interface ChecklistItemRowProps {
  item: ChecklistItem
  onToggle: (itemId: string, completed: boolean) => void
  disabled?: boolean
  completedByName?: string
}

export function ChecklistItemRow({
  item,
  onToggle,
  disabled = false,
  completedByName,
}: ChecklistItemRowProps): React.JSX.Element {
  const { t, i18n } = useTranslation('assignments')
  const isRTL = i18n.language === 'ar'

  const formatTimestamp = (timestamp: string): string => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp))
  }

  const handleToggle = (): void => {
    if (!disabled) {
      onToggle(item.id, !item.completed)
    }
  }

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`flex items-start gap-3 rounded p-2 transition-colors hover:bg-accent/50 ${
        item.completed ? 'opacity-70' : ''
      }`}
    >
      {/* Sequence Number */}
      <span className="mt-1 w-6 text-end font-mono text-xs text-muted-foreground">
        {item.sequence}
      </span>

      {/* Checkbox */}
      <button onClick={handleToggle} disabled={disabled} className="mt-0.5">
        {item.completed ? (
          <CheckCircle2 className="size-5 text-primary" />
        ) : (
          <Circle className="size-5 text-muted-foreground" />
        )}
      </button>

      {/* Item Content */}
      <div className="flex-1 space-y-1">
        <p
          className={`text-sm leading-relaxed ${
            item.completed ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {item.text}
        </p>

        {/* Completion Info */}
        {item.completed && item.completed_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t('checklist.completedBy', {
                name: completedByName || t('checklist.unknownUser'),
              })}
            </span>
            <span>•</span>
            <span>{formatTimestamp(item.completed_at)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
