/**
 * Keyboard Shortcuts System
 * @module hooks/useKeyboardShortcuts
 *
 * Comprehensive keyboard shortcut management with platform awareness and i18n support.
 *
 * @description
 * This module provides a complete keyboard shortcut system with:
 * - Global shortcut registration with conflict detection
 * - Platform-aware modifier keys (⌘ on Mac, Ctrl on Windows/Linux)
 * - Context-aware shortcuts (disabled when focus is in inputs)
 * - RTL-aware display formatting for Arabic interface
 * - Categorized shortcuts for organization
 * - Priority-based conflict resolution
 * - Pre-built navigation and action shortcut sets
 *
 * Architecture:
 * - Singleton `ShortcutRegistry` for centralized management
 * - Hook-based registration with automatic cleanup
 * - Event capture for reliable interception
 * - Translation support for shortcut descriptions
 *
 * @example
 * // Register custom shortcuts
 * function MyComponent() {
 *   const { register } = useKeyboardShortcuts();
 *
 *   useEffect(() => {
 *     const unregister = register({
 *       id: 'save-document',
 *       key: 's',
 *       modifiers: isMac ? ['meta'] : ['ctrl'],
 *       description: 'Save Document',
 *       category: 'actions',
 *       action: handleSave
 *     });
 *
 *     return unregister;
 *   }, [register, handleSave]);
 * }
 *
 * @example
 * // Use pre-built navigation shortcuts
 * function App() {
 *   useGlobalKeyboardHandler();
 *   useNavigationShortcuts();
 *
 *   return <YourApp />;
 * }
 *
 * @example
 * // Custom action shortcuts
 * function Editor() {
 *   useActionShortcuts({
 *     onSave: handleSave,
 *     onDelete: handleDelete,
 *     onRefresh: handleRefresh
 *   });
 * }
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
 * Format a keyboard shortcut for display
 *
 * @description
 * Converts a key combination into a human-readable string with platform-specific
 * modifier symbols. Automatically handles RTL layouts by reversing the order of
 * key parts. Uses Unicode symbols for better visual appearance.
 *
 * @param key - The key to press (lowercase, e.g., 's', 'enter', 'arrowup')
 * @param modifiers - Array of modifier keys (ctrl, alt, shift, meta)
 * @param isRTL - Whether to format for RTL display (reverses key order)
 * @returns Formatted shortcut string (e.g., '⌘S' on Mac, 'Ctrl+S' on Windows)
 *
 * @example
 * // Format save shortcut
 * formatShortcut('s', ['meta']); // Returns '⌘S' on Mac, 'Win+S' on Windows
 *
 * @example
 * // Format with multiple modifiers
 * formatShortcut('k', ['ctrl', 'shift']); // Returns 'Ctrl+⇧K' or '⌃⇧K' on Mac
 *
 * @example
 * // RTL formatting
 * formatShortcut('s', ['ctrl'], true); // Returns 'S+Ctrl' (reversed)
 *
 * @example
 * // Special keys
 * formatShortcut('enter'); // Returns '↵'
 * formatShortcut('escape'); // Returns 'Esc'
 * formatShortcut('arrowup'); // Returns '↑'
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
 *
 * @description
 * Primary hook for interacting with the keyboard shortcut system. Provides
 * utilities for registering shortcuts, querying the registry, and formatting
 * shortcut displays. Includes platform detection and RTL support.
 *
 * @returns Keyboard shortcut utilities object containing:
 * - `register`: Function to register a single shortcut (returns unregister function)
 * - `registerMany`: Function to register multiple shortcuts at once
 * - `getAllShortcuts`: Function to get all registered shortcuts
 * - `getShortcutsByCategory`: Function to get shortcuts filtered by category
 * - `format`: Function to format shortcut for display (RTL-aware)
 * - `navigateTo`: Helper function to navigate to a route
 * - `isRTL`: Boolean indicating if current language is RTL
 * - `isMac`: Boolean indicating if platform is macOS
 *
 * @example
 * // Register a custom shortcut
 * function MyComponent() {
 *   const { register } = useKeyboardShortcuts();
 *
 *   useEffect(() => {
 *     const unregister = register({
 *       id: 'my-action',
 *       key: 'a',
 *       modifiers: ['ctrl'],
 *       description: 'Perform Action',
 *       category: 'actions',
 *       action: () => console.log('Action triggered!'),
 *       priority: 10
 *     });
 *
 *     return unregister; // Cleanup on unmount
 *   }, [register]);
 * }
 *
 * @example
 * // Display all shortcuts in a palette
 * function ShortcutPalette() {
 *   const { getAllShortcuts, format } = useKeyboardShortcuts();
 *   const shortcuts = getAllShortcuts();
 *
 *   return (
 *     <div>
 *       {shortcuts.map(shortcut => (
 *         <div key={shortcut.id}>
 *           <span>{shortcut.description}</span>
 *           <kbd>{format(shortcut.key, shortcut.modifiers)}</kbd>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Get shortcuts by category for help menu
 * const { getShortcutsByCategory } = useKeyboardShortcuts();
 * const navShortcuts = getShortcutsByCategory('navigation');
 * const actionShortcuts = getShortcutsByCategory('actions');
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
 * Hook to attach the global keyboard event listener
 *
 * @description
 * Attaches a global keydown event listener that intercepts keyboard events
 * and triggers registered shortcuts. This hook should be called once at the
 * app root level. It automatically:
 * - Detects modifier keys from keyboard events
 * - Checks if shortcuts are enabled
 * - Respects input focus context (skips shortcuts in input fields unless allowInInput)
 * - Prevents default browser behavior for registered shortcuts
 * - Handles event capture for reliable interception
 *
 * @example
 * // Use in app root
 * function App() {
 *   useGlobalKeyboardHandler();
 *
 *   return <RouterProvider />;
 * }
 *
 * @example
 * // Combine with navigation shortcuts
 * function App() {
 *   useGlobalKeyboardHandler();
 *   useNavigationShortcuts();
 *
 *   return <YourApp />;
 * }
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
 *
 * @description
 * Subscribes to changes in the shortcut registry. Useful for building dynamic
 * shortcut palettes or help menus that update when shortcuts are registered
 * or unregistered.
 *
 * @param callback - Function to call when the registry changes
 *
 * @example
 * // Update UI when shortcuts change
 * function ShortcutList() {
 *   const [shortcuts, setShortcuts] = useState([]);
 *   const { getAllShortcuts } = useKeyboardShortcuts();
 *
 *   useShortcutRegistrySubscription(() => {
 *     setShortcuts(getAllShortcuts());
 *   });
 *
 *   return <div>{shortcuts.length} shortcuts registered</div>;
 * }
 */
export function useShortcutRegistrySubscription(callback: () => void) {
  useEffect(() => {
    return shortcutRegistry.subscribe(callback)
  }, [callback])
}

/**
 * Pre-defined navigation shortcuts for common app routes
 *
 * @description
 * Registers a standard set of keyboard shortcuts for navigating to main
 * app sections. Uses Alt+key combinations to avoid conflicts with browser
 * shortcuts. Automatically handles i18n for shortcut descriptions.
 *
 * Registered shortcuts:
 * - Alt+D: Go to Dashboard
 * - Alt+W: Go to My Work
 * - Alt+O: Go to Dossiers
 * - Alt+C: Go to Calendar
 * - Alt+T: Go to Tasks
 * - Alt+A: Go to Analytics
 * - Alt+S: Go to Settings
 * - Alt+←: Browser back
 * - Alt+→: Browser forward
 *
 * @example
 * // Use in app root
 * function App() {
 *   useGlobalKeyboardHandler();
 *   useNavigationShortcuts();
 *
 *   return <RouterProvider />;
 * }
 *
 * @example
 * // Override specific shortcuts
 * function CustomApp() {
 *   useGlobalKeyboardHandler();
 *   // Don't use useNavigationShortcuts()
 *   // Register your own with higher priority
 *   const { register } = useKeyboardShortcuts();
 *   useEffect(() => {
 *     return register({
 *       id: 'custom-dashboard',
 *       key: 'd',
 *       modifiers: ['alt'],
 *       description: 'Custom Dashboard',
 *       category: 'navigation',
 *       action: () => navigate('/custom-dashboard'),
 *       priority: 10 // Higher priority than default
 *     });
 *   }, []);
 * }
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
 * Pre-defined action shortcuts for common CRUD operations
 *
 * @description
 * Registers standard keyboard shortcuts for common actions. Only registers
 * shortcuts for callbacks that are provided. Uses platform-aware modifiers
 * (Cmd on Mac, Ctrl on Windows/Linux) for standard actions.
 *
 * Registered shortcuts (if callback provided):
 * - Ctrl/Cmd+N: Create new task
 * - Ctrl/Cmd+S: Save (works in inputs)
 * - Delete: Delete selected item
 * - E: Edit selected item
 * - Ctrl/Cmd+R: Refresh
 *
 * @param callbacks - Object containing optional callback functions
 * @param callbacks.onNewTask - Called when Ctrl/Cmd+N is pressed
 * @param callbacks.onSave - Called when Ctrl/Cmd+S is pressed
 * @param callbacks.onDelete - Called when Delete is pressed
 * @param callbacks.onEdit - Called when E is pressed
 * @param callbacks.onRefresh - Called when Ctrl/Cmd+R is pressed
 *
 * @example
 * // Use in editor component
 * function DocumentEditor() {
 *   const { mutate: save } = useSaveDocument();
 *   const { mutate: deleteDoc } = useDeleteDocument();
 *
 *   useActionShortcuts({
 *     onSave: () => save(document),
 *     onDelete: () => deleteDoc(document.id),
 *     onRefresh: () => refetch()
 *   });
 * }
 *
 * @example
 * // Partial shortcuts (only save)
 * function FormComponent() {
 *   useActionShortcuts({
 *     onSave: handleSubmit
 *   });
 *   // Only save shortcut is registered
 * }
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
 * Pre-defined shortcuts for keyboard list navigation
 *
 * @description
 * Registers keyboard shortcuts for navigating and interacting with lists.
 * Supports both arrow keys and vim-style (j/k) navigation. Only registers
 * shortcuts for callbacks that are provided.
 *
 * Registered shortcuts (if callback provided):
 * - ↑ or K: Move up in list
 * - ↓ or J: Move down in list
 * - Enter: Select current item
 * - Space: Toggle current item (checkbox)
 * - Home: Jump to first item
 * - End: Jump to last item
 *
 * @param callbacks - Object containing optional callback functions
 * @param callbacks.onMoveUp - Called when moving up in the list
 * @param callbacks.onMoveDown - Called when moving down in the list
 * @param callbacks.onSelectItem - Called when selecting an item (Enter)
 * @param callbacks.onToggleItem - Called when toggling an item (Space)
 * @param callbacks.onFirstItem - Called when jumping to first item (Home)
 * @param callbacks.onLastItem - Called when jumping to last item (End)
 *
 * @example
 * // Full list navigation
 * function TaskList() {
 *   const [selectedIndex, setSelectedIndex] = useState(0);
 *   const [selectedItems, setSelectedItems] = useState([]);
 *
 *   useListNavigationShortcuts({
 *     onMoveUp: () => setSelectedIndex(i => Math.max(0, i - 1)),
 *     onMoveDown: () => setSelectedIndex(i => Math.min(tasks.length - 1, i + 1)),
 *     onSelectItem: () => handleSelect(tasks[selectedIndex]),
 *     onToggleItem: () => toggleSelection(tasks[selectedIndex].id),
 *     onFirstItem: () => setSelectedIndex(0),
 *     onLastItem: () => setSelectedIndex(tasks.length - 1)
 *   });
 * }
 *
 * @example
 * // Simple up/down navigation
 * function SimpleList() {
 *   const [index, setIndex] = useState(0);
 *
 *   useListNavigationShortcuts({
 *     onMoveUp: () => setIndex(i => Math.max(0, i - 1)),
 *     onMoveDown: () => setIndex(i => i + 1)
 *   });
 * }
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
