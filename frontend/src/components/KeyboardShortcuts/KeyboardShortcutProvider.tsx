/**
 * KeyboardShortcutProvider
 *
 * Global context provider for keyboard shortcuts.
 * Sets up the global keyboard listener and provides shortcut management
 * throughout the application.
 */

import React, { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGlobalKeyboardHandler,
  useNavigationShortcuts,
  useKeyboardShortcuts,
  shortcutRegistry,
  type KeyboardShortcut,
  type ModifierKey,
  formatShortcut,
  isMac,
} from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutContextValue {
  /** Whether the command palette is open */
  isCommandPaletteOpen: boolean
  /** Open the command palette */
  openCommandPalette: () => void
  /** Close the command palette */
  closeCommandPalette: () => void
  /** Toggle the command palette */
  toggleCommandPalette: () => void
  /** Get all registered shortcuts */
  getAllShortcuts: () => KeyboardShortcut[]
  /** Get shortcuts by category */
  getShortcutsByCategory: (category: KeyboardShortcut['category']) => KeyboardShortcut[]
  /** Format a shortcut for display */
  formatShortcut: (key: string, modifiers?: ModifierKey[]) => string
  /** Whether the current platform is Mac */
  isMac: boolean
  /** Whether the current language is RTL */
  isRTL: boolean
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null)

interface KeyboardShortcutProviderProps {
  children: React.ReactNode
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Set up the global keyboard handler
  useGlobalKeyboardHandler()

  // Register navigation shortcuts
  useNavigationShortcuts()

  const { register, getAllShortcuts, getShortcutsByCategory } = useKeyboardShortcuts()

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false)
  }, [])

  const toggleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen((prev) => !prev)
  }, [])

  // Register the command palette shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const unregister = register({
      id: 'command-palette',
      key: 'k',
      modifiers: isMac ? ['meta'] : ['ctrl'],
      description: 'Open Command Palette',
      category: 'help',
      action: toggleCommandPalette,
      allowInInput: true,
      priority: 100,
    })

    return unregister
  }, [register, toggleCommandPalette])

  // Register help shortcut (?)
  useEffect(() => {
    const unregister = register({
      id: 'show-shortcuts',
      key: '?',
      modifiers: ['shift'],
      description: 'Show Keyboard Shortcuts',
      category: 'help',
      action: openCommandPalette,
      priority: 99,
    })

    return unregister
  }, [register, openCommandPalette])

  // Register Escape to close command palette
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCommandPaletteOpen) {
        event.preventDefault()
        closeCommandPalette()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isCommandPaletteOpen, closeCommandPalette])

  const format = useCallback(
    (key: string, modifiers?: ModifierKey[]) => {
      return formatShortcut(key, modifiers, isRTL)
    },
    [isRTL],
  )

  const value = useMemo<KeyboardShortcutContextValue>(
    () => ({
      isCommandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
      getAllShortcuts,
      getShortcutsByCategory,
      formatShortcut: format,
      isMac,
      isRTL,
    }),
    [
      isCommandPaletteOpen,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
      getAllShortcuts,
      getShortcutsByCategory,
      format,
      isRTL,
    ],
  )

  return (
    <KeyboardShortcutContext.Provider value={value}>{children}</KeyboardShortcutContext.Provider>
  )
}

export function useKeyboardShortcutContext(): KeyboardShortcutContextValue {
  const context = useContext(KeyboardShortcutContext)
  if (!context) {
    throw new Error('useKeyboardShortcutContext must be used within a KeyboardShortcutProvider')
  }
  return context
}

/**
 * Hook to check if keyboard shortcut context is available
 */
export function useOptionalKeyboardShortcutContext(): KeyboardShortcutContextValue | null {
  return useContext(KeyboardShortcutContext)
}
