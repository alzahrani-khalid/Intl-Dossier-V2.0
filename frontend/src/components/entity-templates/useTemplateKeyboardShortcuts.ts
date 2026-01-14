/**
 * useTemplateKeyboardShortcuts Hook
 * Feature: Entity Creation Templates
 *
 * Global keyboard shortcuts for template quick entry.
 * - Alt+T: Open template picker
 * - Alt+<key>: Apply specific template directly
 */

import { useEffect, useCallback, useState } from 'react'
import { useEntityTemplates, useApplyTemplate } from '@/hooks/useEntityTemplates'
import type { EntityTemplate, TemplateEntityType } from '@/types/entity-template.types'

export interface UseTemplateKeyboardShortcutsOptions {
  /** Entity type for template filtering */
  entityType?: TemplateEntityType
  /** Callback when a template is selected via shortcut */
  onTemplateSelect?: (template: EntityTemplate, values: Record<string, unknown>) => void
  /** Whether shortcuts are enabled */
  enabled?: boolean
}

export interface UseTemplateKeyboardShortcutsResult {
  /** Whether the quick entry dialog is open */
  isDialogOpen: boolean
  /** Open the quick entry dialog */
  openDialog: () => void
  /** Close the quick entry dialog */
  closeDialog: () => void
  /** Toggle the quick entry dialog */
  toggleDialog: () => void
  /** Available templates with shortcuts */
  shortcutTemplates: EntityTemplate[]
}

export function useTemplateKeyboardShortcuts(
  options: UseTemplateKeyboardShortcutsOptions = {},
): UseTemplateKeyboardShortcutsResult {
  const { entityType = 'task', onTemplateSelect, enabled = true } = options

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch templates
  const { data } = useEntityTemplates(entityType, { enabled })
  const { applyTemplate } = useApplyTemplate()

  // Get templates with keyboard shortcuts
  const shortcutTemplates = data?.templates?.filter((t) => t.keyboard_shortcut) || []

  // Build shortcut map for quick lookup
  const shortcutMap = new Map<string, EntityTemplate>()
  shortcutTemplates.forEach((template) => {
    if (template.keyboard_shortcut) {
      shortcutMap.set(template.keyboard_shortcut.toLowerCase(), template)
    }
  })

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: EntityTemplate) => {
      if (onTemplateSelect) {
        const values = applyTemplate(template)
        onTemplateSelect(template, values)
      }
    },
    [onTemplateSelect, applyTemplate],
  )

  // Dialog controls
  const openDialog = useCallback(() => setIsDialogOpen(true), [])
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])
  const toggleDialog = useCallback(() => setIsDialogOpen((prev) => !prev), [])

  // Keyboard event handler
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Alt+T: Open template picker
      if (e.altKey && e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        toggleDialog()
        return
      }

      // Alt+<key>: Direct template shortcut
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.length === 1) {
        const shortcut = `alt+${e.key.toUpperCase()}`
        const template = shortcutMap.get(shortcut)

        if (template) {
          e.preventDefault()
          handleTemplateSelect(template)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, toggleDialog, shortcutMap, handleTemplateSelect])

  return {
    isDialogOpen,
    openDialog,
    closeDialog,
    toggleDialog,
    shortcutTemplates,
  }
}

export default useTemplateKeyboardShortcuts
