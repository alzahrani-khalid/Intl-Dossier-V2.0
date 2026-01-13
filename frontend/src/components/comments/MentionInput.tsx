/**
 * MentionInput Component
 *
 * Textarea with @mention autocomplete support for the comments system.
 * Features:
 * - Triggers autocomplete on @ character
 * - Keyboard navigation (up/down arrows, enter to select)
 * - User search with debounce
 * - RTL support
 * - Character counter
 */

import React, { useState, useRef, useCallback, useEffect, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchUsersForMention } from '@/hooks/useComments'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { MentionUser } from '@/types/comment.types'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  autoFocus?: boolean
  className?: string
  rows?: number
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export const MentionInput = forwardRef<HTMLTextAreaElement, MentionInputProps>(
  function MentionInput(
    {
      value,
      onChange,
      placeholder,
      maxLength = 10000,
      disabled = false,
      autoFocus = false,
      className,
      rows = 3,
      onKeyDown,
    },
    ref,
  ) {
    const { t, i18n } = useTranslation('comments')
    const isRTL = i18n.language === 'ar'

    const [mentionQuery, setMentionQuery] = useState('')
    const [showMentionList, setShowMentionList] = useState(false)
    const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 })

    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const mentionListRef = useRef<HTMLDivElement>(null)

    // Combine refs
    const setRefs = useCallback(
      (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element
        if (typeof ref === 'function') {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      [ref],
    )

    // Search users for mention
    const { data: mentionUsers = [], isLoading: isSearching } = useSearchUsersForMention(
      mentionQuery,
      { enabled: showMentionList && mentionQuery.length >= 1 },
    )

    // Reset selected index when users change
    useEffect(() => {
      setSelectedIndex(0)
    }, [mentionUsers])

    // Handle text change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        const cursorPos = e.target.selectionStart

        onChange(newValue)

        // Check for @ mention trigger
        const textBeforeCursor = newValue.slice(0, cursorPos)
        const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/)

        if (atMatch) {
          setMentionQuery(atMatch[1])
          setMentionStartIndex(cursorPos - atMatch[0].length)
          setShowMentionList(true)

          // Calculate position for dropdown
          if (textareaRef.current) {
            const rect = textareaRef.current.getBoundingClientRect()
            setCursorPosition({
              top: rect.bottom + 4,
              left: isRTL ? rect.right - 200 : rect.left,
            })
          }
        } else {
          setShowMentionList(false)
          setMentionQuery('')
          setMentionStartIndex(null)
        }
      },
      [onChange, isRTL],
    )

    // Insert mention into text
    const insertMention = useCallback(
      (user: MentionUser) => {
        if (mentionStartIndex === null) return

        const username = user.username || user.email.split('@')[0]
        const beforeMention = value.slice(0, mentionStartIndex)
        const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1) // +1 for @

        const newValue = `${beforeMention}@${username} ${afterMention}`
        onChange(newValue)

        // Close dropdown
        setShowMentionList(false)
        setMentionQuery('')
        setMentionStartIndex(null)

        // Focus back on textarea
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = beforeMention.length + username.length + 2 // +2 for @ and space
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
          }
        }, 0)
      },
      [value, onChange, mentionStartIndex, mentionQuery],
    )

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentionList && mentionUsers.length > 0) {
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault()
              setSelectedIndex((prev) => (prev + 1) % mentionUsers.length)
              break
            case 'ArrowUp':
              e.preventDefault()
              setSelectedIndex((prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length)
              break
            case 'Enter':
              e.preventDefault()
              insertMention(mentionUsers[selectedIndex])
              break
            case 'Escape':
              e.preventDefault()
              setShowMentionList(false)
              break
            case 'Tab':
              if (showMentionList) {
                e.preventDefault()
                insertMention(mentionUsers[selectedIndex])
              }
              break
          }
        }

        // Call parent handler if provided
        if (!showMentionList) {
          onKeyDown?.(e)
        }
      },
      [showMentionList, mentionUsers, selectedIndex, insertMention, onKeyDown],
    )

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          mentionListRef.current &&
          !mentionListRef.current.contains(e.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(e.target as Node)
        ) {
          setShowMentionList(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const charCount = value.length
    const isOverLimit = charCount > maxLength

    return (
      <div className="relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <Textarea
          ref={setRefs}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder || t('form.placeholder', 'Write a comment... Use @ to mention someone')
          }
          disabled={disabled}
          autoFocus={autoFocus}
          rows={rows}
          className={cn(
            'resize-none',
            isOverLimit && 'border-destructive focus-visible:ring-destructive',
            className,
          )}
          data-testid="mention-input"
        />

        {/* Character counter */}
        <div
          className={cn(
            'absolute bottom-2 text-xs',
            isRTL ? 'start-2' : 'end-2',
            isOverLimit ? 'text-destructive' : 'text-muted-foreground',
          )}
          data-testid="comment-char-count"
        >
          {charCount.toLocaleString()} / {maxLength.toLocaleString()}
        </div>

        {/* Mention autocomplete dropdown */}
        {showMentionList && (
          <div
            ref={mentionListRef}
            className={cn(
              'absolute z-50 w-64 max-h-48 overflow-y-auto',
              'bg-popover border rounded-md shadow-lg',
              'mt-1',
            )}
            style={{
              top: '100%',
              [isRTL ? 'right' : 'left']: 0,
            }}
            data-testid="mention-autocomplete"
          >
            {isSearching ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {t('form.searchingUsers', 'Searching...')}
              </div>
            ) : mentionUsers.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                {mentionQuery.length < 1
                  ? t('form.typeToSearch', 'Type to search users')
                  : t('form.noUsersFound', 'No users found')}
              </div>
            ) : (
              <ul className="py-1" role="listbox">
                {mentionUsers.map((user, index) => (
                  <li
                    key={user.id}
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 cursor-pointer',
                      'hover:bg-accent',
                      index === selectedIndex && 'bg-accent',
                    )}
                    onClick={() => insertMention(user)}
                    data-testid="mention-option"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || ''} />
                      <AvatarFallback className="text-xs">
                        {(user.full_name || user.email)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {user.full_name || user.username || user.email.split('@')[0]}
                      </div>
                      {user.username && (
                        <div className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  },
)

MentionInput.displayName = 'MentionInput'

export default MentionInput
