/**
 * ContactList Component
 * Part of: 027-contact-directory implementation
 *
 * Virtualized contact list for performance with 10,000+ contacts.
 * Mobile-first, RTL-ready with grid layout.
 */

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { ContactCard } from './ContactCard'
import { Loader2, Users } from 'lucide-react'
import type { ContactResponse } from '@/services/contact-api'
import { useDirection } from '@/hooks/useDirection'

interface ContactListProps {
  contacts: ContactResponse[]
  tags?: Array<{ id: string; name: string; color?: string }>
  onContactClick?: (contact: ContactResponse) => void
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  className?: string
}

const EMPTY_TAGS: Array<{ id: string; name: string; color?: string }> = []

export function ContactList({
  contacts,
  tags = EMPTY_TAGS,
  onContactClick,
  isLoading = false,
  isEmpty = false,
  emptyMessage,
  className = '',
}: ContactListProps) {
  const { t } = useTranslation('contacts')
  const { isRTL } = useDirection()
const parentRef = useRef<HTMLDivElement>(null)

  // Virtual scrolling for large lists
  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated card height in pixels
    overscan: 5, // Number of items to render outside viewport
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('contactDirectory.list.loading_contacts')}
        </p>
      </div>
    )
  }

  // Empty state
  if (isEmpty || contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="rounded-full bg-muted p-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-medium">
            {emptyMessage || t('contactDirectory.list.no_contacts_found')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('contactDirectory.list.try_different_filters')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const contact = contacts[virtualRow.index]
          if (!contact) return null
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                [isRTL ? 'right' : 'left']: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-4 sm:px-6 lg:px-8 pb-4"
            >
              <ContactCard
                contact={contact as any}
                tags={tags}
                onClick={() => onContactClick?.(contact)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}


