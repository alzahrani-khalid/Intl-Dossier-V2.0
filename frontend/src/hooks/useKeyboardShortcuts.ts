/**
 * Keyboard Shortcuts System
 * Feature: Comprehensive keyboard shortcuts for common actions
 *
 * Provides:
 * - Global keyboard shortcut registration
 * - Platform-aware modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
 * - Shortcut conflict detection
 * - Context-aware shortcuts (disabled when in inputs)
 * - RTL-aware display of shortcut keys
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

// Platform detection
export const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta'

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string
  /** The key to press (lowercase, e.g., 'k', 'enter', 'escape') */
  key: string
  /** Modifier keys required */
  modifiers?: ModifierKey[]
  /** Description for display in the shortcut palette */
  description: string
  /** Category for grouping shortcuts */
  category: 'navigation' | 'actions' | 'editing' | 'view' | 'help'
  /** Action to execute when shortcut is triggered */
  action: () => void
  /** Whether to allow this shortcut when focused on an input/textarea */
  allowInInput?: boolean
  /** Whether the shortcut is currently enabled */
  enabled?: boolean
  /** Priority for conflict resolution (higher wins) */
  priority?: number
}

export interface ShortcutRegistration {
  shortcut: KeyboardShortcut
  unregister: () => void
}

// Singleton registry for all shortcuts
class ShortcutRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private listeners: Set<() => void> = new Set()

  private getKeyId(key: string, modifiers: ModifierKey[] = []): string {
    const sortedMods = [...modifiers].sort()
    return `${sortedMods.join('+')}${sortedMods.length ? '+' : ''}${key.toLowerCase()}`
  }

  register(shortcut: KeyboardShortcut): () => void {
    const keyId = this.getKeyId(shortcut.key, shortcut.modifiers)
    const existing = this.shortcuts.get(keyId)

    // Handle conflicts based on priority
    if (existing) {
      const existingPriority = existing.priority ?? 0
      const newPriority = shortcut.priority ?? 0

      if (newPriority <= existingPriority) {
        console.warn(
          `Keyboard shortcut conflict: "${shortcut.id}" conflicts with "${existing.id}" for key "${keyId}". ` +
            `Existing shortcut has higher or equal priority.`,
        )
      }
    }

    // Store with full ID for lookup
    this.shortcuts.set(keyId, shortcut)
    this.notifyListeners()

    return () => {
      if (this.shortcuts.get(keyId)?.id === shortcut.id) {
        this.shortcuts.delete(keyId)
        this.notifyListeners()
      }
    }
  }

  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  getByCategory(category: KeyboardShortcut['category']): KeyboardShortcut[] {
    return this.getAll().filter((s) => s.category === category)
  }

  find(key: string, modifiers: ModifierKey[]): KeyboardShortcut | undefined {
    const keyId = this.getKeyId(key, modifiers)
    return this.shortcuts.get(keyId)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }
}

// Global singleton instance
const shortcutRegistry = new ShortcutRegistry()

/**
 * Get the display string for a shortcut
 */
export function formatShortcut(
  key: string,
  modifiers: ModifierKey[] = [],
  isRTL: boolean = false,
): string {
  const modSymbols: Record<ModifierKey, string> = {
    meta: isMac ? '⌘' : 'Win',
    ctrl: isMac ? '⌃' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
  }

  const keySymbols: Record<string, string> = {
    enter: '↵',
    escape: 'Esc',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: isRTL ? '→' : '←',
    arrowright: isRTL ? '←' : '→',
    backspace: '⌫',
    delete: '⌦',
    tab: '⇥',
    space: '␣',
    '/': '/',
    '?': '?',
  }

  const modParts = modifiers.map((m) => modSymbols[m])
  const keyPart = keySymbols[key.toLowerCase()] || key.toUpperCase()

  const parts = [...modParts, keyPart]
  return isRTL ? parts.reverse().join('') : parts.join('')
}

/**
 * Convert a keyboard event to modifier array
 */
function getModifiersFromEvent(event: KeyboardEvent): ModifierKey[] {
  const modifiers: ModifierKey[] = []
  if (event.ctrlKey) modifiers.push('ctrl')
  if (event.altKey) modifiers.push('alt')
  if (event.shiftKey) modifiers.push('shift')
  if (event.metaKey) modifiers.push('meta')
  return modifiers
}

/**
 * Check if the current focus is on an input element
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement
  if (!activeElement) return false

  const tagName = activeElement.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true
  }

  // Check for role="textbox" or similar
  const role = activeElement.getAttribute('role')
  if (role === 'textbox' || role === 'combobox') {
    return true
  }

  return false
}

/**
 * Hook to register and manage keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('keyboard-shortcuts')
  const isRTL = i18n.language === 'ar'

  /**
   * Register a single shortcut
   */
  const register = useCallback((shortcut: KeyboardShortcut): (() => void) => {
    return shortcutRegistry.register(shortcut)
  }, [])

  /**
   * Register multiple shortcuts at once
   */
  const registerMany = useCallback((shortcuts: KeyboardShortcut[]): (() => void) => {
    const unregisters = shortcuts.map((s) => shortcutRegistry.register(s))
    return () => unregisters.forEach((u) => u())
  }, [])

  /**
   * Get all registered shortcuts
   */
  const getAllShortcuts = useCallback((): KeyboardShortcut[] => {
    return shortcutRegistry.getAll()
  }, [])

  /**
   * Get shortcuts by category
   */
  const getShortcutsByCategory = useCallback(
    (category: KeyboardShortcut['category']): KeyboardShortcut[] => {
      return shortcutRegistry.getByCategory(category)
    },
    [],
  )

  /**
   * Format a shortcut for display
   */
  const format = useCallback(
    (key: string, modifiers: ModifierKey[] = []): string => {
      return formatShortcut(key, modifiers, isRTL)
    },
    [isRTL],
  )

  /**
   * Navigate to a route (helper for navigation shortcuts)
   */
  const navigateTo = useCallback(
    (path: string) => {
      navigate({ to: path })
    },
    [navigate],
  )

  return {
    register,
    registerMany,
    getAllShortcuts,
    getShortcutsByCategory,
    format,
    navigateTo,
    isRTL,
    isMac,
  }
}

/**
 * Hook to register shortcuts and attach the global keyboard listener
 */
export function useGlobalKeyboardHandler() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if the key is undefined or just a modifier
      if (!event.key || ['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        return
      }

      const modifiers = getModifiersFromEvent(event)
      const key = event.key.toLowerCase()
      const shortcut = shortcutRegistry.find(key, modifiers)

      if (!shortcut) return
      if (shortcut.enabled === false) return

      // Check if we're in an input
      if (isInputFocused() && !shortcut.allowInInput) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      shortcut.action()
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [])
}

/**
 * Hook to subscribe to shortcut registry changes
 */
export function useShortcutRegistrySubscription(callback: () => void) {
  useEffect(() => {
    return shortcutRegistry.subscribe(callback)
  }, [callback])
}

/**
 * Pre-defined navigation shortcuts
 */
export function useNavigationShortcuts() {
  const { register, navigateTo } = useKeyboardShortcuts()
  const { t } = useTranslation('keyboard-shortcuts')

  useEffect(() => {
    const unregisters: (() => void)[] = []

    // Go to Dashboard: G then D (using g+d as a chord)
    unregisters.push(
      register({
        id: 'go-dashboard',
        key: 'd',
        modifiers: ['alt'],
        description: t('shortcuts.goToDashboard', 'Go to Dashboard'),
        category: 'navigation',
        action: () => navigateTo('/dashboard'),
      }),
    )

    // Go to My Work: Alt+W
    unregisters.push(
      register({
        id: 'go-my-work',
        key: 'w',
        modifiers: ['alt'],
        description: t('shortcuts.goToMyWork', 'Go to My Work'),
        category: 'navigation',
        action: () => navigateTo('/my-work'),
      }),
    )

    // Go to Dossiers: Alt+O
    unregisters.push(
      register({
        id: 'go-dossiers',
        key: 'o',
        modifiers: ['alt'],
        description: t('shortcuts.goToDossiers', 'Go to Dossiers'),
        category: 'navigation',
        action: () => navigateTo('/dossiers'),
      }),
    )

    // Go to Calendar: Alt+C
    unregisters.push(
      register({
        id: 'go-calendar',
        key: 'c',
        modifiers: ['alt'],
        description: t('shortcuts.goToCalendar', 'Go to Calendar'),
        category: 'navigation',
        action: () => navigateTo('/calendar'),
      }),
    )

    // Go to Tasks: Alt+T
    unregisters.push(
      register({
        id: 'go-tasks',
        key: 't',
        modifiers: ['alt'],
        description: t('shortcuts.goToTasks', 'Go to Tasks'),
        category: 'navigation',
        action: () => navigateTo('/tasks'),
      }),
    )

    // Go to Analytics: Alt+A
    unregisters.push(
      register({
        id: 'go-analytics',
        key: 'a',
        modifiers: ['alt'],
        description: t('shortcuts.goToAnalytics', 'Go to Analytics'),
        category: 'navigation',
        action: () => navigateTo('/analytics'),
      }),
    )

    // Go to Settings: Alt+S
    unregisters.push(
      register({
        id: 'go-settings',
        key: 's',
        modifiers: ['alt'],
        description: t('shortcuts.goToSettings', 'Go to Settings'),
        category: 'navigation',
        action: () => navigateTo('/settings'),
      }),
    )

    // Go Back: Alt+Left Arrow
    unregisters.push(
      register({
        id: 'go-back',
        key: 'arrowleft',
        modifiers: ['alt'],
        description: t('shortcuts.goBack', 'Go Back'),
        category: 'navigation',
        action: () => window.history.back(),
      }),
    )

    // Go Forward: Alt+Right Arrow
    unregisters.push(
      register({
        id: 'go-forward',
        key: 'arrowright',
        modifiers: ['alt'],
        description: t('shortcuts.goForward', 'Go Forward'),
        category: 'navigation',
        action: () => window.history.forward(),
      }),
    )

    return () => unregisters.forEach((u) => u())
  }, [register, navigateTo, t])
}

/**
 * Pre-defined action shortcuts for common operations
 */
export function useActionShortcuts(callbacks: {
  onNewTask?: () => void
  onSave?: () => void
  onDelete?: () => void
  onEdit?: () => void
  onRefresh?: () => void
}) {
  const { register } = useKeyboardShortcuts()
  const { t } = useTranslation('keyboard-shortcuts')

  useEffect(() => {
    const unregisters: (() => void)[] = []

    // New Task: Ctrl/Cmd+N
    if (callbacks.onNewTask) {
      unregisters.push(
        register({
          id: 'new-task',
          key: 'n',
          modifiers: isMac ? ['meta'] : ['ctrl'],
          description: t('shortcuts.newTask', 'Create New Task'),
          category: 'actions',
          action: callbacks.onNewTask,
        }),
      )
    }

    // Save: Ctrl/Cmd+S
    if (callbacks.onSave) {
      unregisters.push(
        register({
          id: 'save',
          key: 's',
          modifiers: isMac ? ['meta'] : ['ctrl'],
          description: t('shortcuts.save', 'Save'),
          category: 'actions',
          action: callbacks.onSave,
          allowInInput: true,
        }),
      )
    }

    // Delete: Delete or Backspace
    if (callbacks.onDelete) {
      unregisters.push(
        register({
          id: 'delete',
          key: 'delete',
          description: t('shortcuts.delete', 'Delete'),
          category: 'actions',
          action: callbacks.onDelete,
        }),
      )
    }

    // Edit: E
    if (callbacks.onEdit) {
      unregisters.push(
        register({
          id: 'edit',
          key: 'e',
          description: t('shortcuts.edit', 'Edit'),
          category: 'actions',
          action: callbacks.onEdit,
        }),
      )
    }

    // Refresh: Ctrl/Cmd+R
    if (callbacks.onRefresh) {
      unregisters.push(
        register({
          id: 'refresh',
          key: 'r',
          modifiers: isMac ? ['meta'] : ['ctrl'],
          description: t('shortcuts.refresh', 'Refresh'),
          category: 'actions',
          action: callbacks.onRefresh,
        }),
      )
    }

    return () => unregisters.forEach((u) => u())
  }, [register, t, callbacks])
}

/**
 * Pre-defined list navigation shortcuts
 */
export function useListNavigationShortcuts(callbacks: {
  onMoveUp?: () => void
  onMoveDown?: () => void
  onSelectItem?: () => void
  onToggleItem?: () => void
  onFirstItem?: () => void
  onLastItem?: () => void
}) {
  const { register } = useKeyboardShortcuts()
  const { t } = useTranslation('keyboard-shortcuts')

  useEffect(() => {
    const unregisters: (() => void)[] = []

    // Move Up: Arrow Up or K
    if (callbacks.onMoveUp) {
      unregisters.push(
        register({
          id: 'list-move-up',
          key: 'arrowup',
          description: t('shortcuts.moveUp', 'Move Up'),
          category: 'navigation',
          action: callbacks.onMoveUp,
          priority: 1,
        }),
      )
      unregisters.push(
        register({
          id: 'list-move-up-k',
          key: 'k',
          description: t('shortcuts.moveUp', 'Move Up'),
          category: 'navigation',
          action: callbacks.onMoveUp,
          priority: 0,
        }),
      )
    }

    // Move Down: Arrow Down or J
    if (callbacks.onMoveDown) {
      unregisters.push(
        register({
          id: 'list-move-down',
          key: 'arrowdown',
          description: t('shortcuts.moveDown', 'Move Down'),
          category: 'navigation',
          action: callbacks.onMoveDown,
          priority: 1,
        }),
      )
      unregisters.push(
        register({
          id: 'list-move-down-j',
          key: 'j',
          description: t('shortcuts.moveDown', 'Move Down'),
          category: 'navigation',
          action: callbacks.onMoveDown,
          priority: 0,
        }),
      )
    }

    // Select Item: Enter
    if (callbacks.onSelectItem) {
      unregisters.push(
        register({
          id: 'list-select',
          key: 'enter',
          description: t('shortcuts.select', 'Select'),
          category: 'actions',
          action: callbacks.onSelectItem,
        }),
      )
    }

    // Toggle Item: Space
    if (callbacks.onToggleItem) {
      unregisters.push(
        register({
          id: 'list-toggle',
          key: ' ',
          description: t('shortcuts.toggle', 'Toggle'),
          category: 'actions',
          action: callbacks.onToggleItem,
        }),
      )
    }

    // First Item: Home or G then G
    if (callbacks.onFirstItem) {
      unregisters.push(
        register({
          id: 'list-first',
          key: 'home',
          description: t('shortcuts.first', 'First Item'),
          category: 'navigation',
          action: callbacks.onFirstItem,
        }),
      )
    }

    // Last Item: End or G then Shift+G
    if (callbacks.onLastItem) {
      unregisters.push(
        register({
          id: 'list-last',
          key: 'end',
          description: t('shortcuts.last', 'Last Item'),
          category: 'navigation',
          action: callbacks.onLastItem,
        }),
      )
    }

    return () => unregisters.forEach((u) => u())
  }, [register, t, callbacks])
}

export { shortcutRegistry }
