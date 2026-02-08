/**
 * Context Menu Component
 *
 * Minimal context menu implementation using native browser context menu events.
 * Provides ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
 * and ContextMenuSeparator components.
 *
 * Used by SwipeableCard for long-press context menus.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Context Menu Root
// ============================================================================

interface ContextMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ContextMenuContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
  position: { x: number; y: number }
  setPosition: (pos: { x: number; y: number }) => void
}>({
  open: false,
  onOpenChange: () => {},
  position: { x: 0, y: 0 },
  setPosition: () => {},
})

function ContextMenu({ children, open: controlledOpen, onOpenChange }: ContextMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })

  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const handleOpenChange = onOpenChange || setUncontrolledOpen

  // Close on escape
  React.useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleOpenChange(false)
    }

    const handleClickOutside = () => {
      handleOpenChange(false)
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, handleOpenChange])

  return (
    <ContextMenuContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange, position, setPosition }}
    >
      {children}
    </ContextMenuContext.Provider>
  )
}

// ============================================================================
// Context Menu Trigger
// ============================================================================

interface ContextMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

function ContextMenuTrigger({ children, asChild, className }: ContextMenuTriggerProps) {
  const { onOpenChange, setPosition } = React.useContext(ContextMenuContext)

  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setPosition({ x: e.clientX, y: e.clientY })
      onOpenChange(true)
    },
    [onOpenChange, setPosition],
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onContextMenu: handleContextMenu,
    })
  }

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
    </div>
  )
}

// ============================================================================
// Context Menu Content
// ============================================================================

interface ContextMenuContentProps {
  children: React.ReactNode
  className?: string
  dir?: 'ltr' | 'rtl'
}

function ContextMenuContent({ children, className, dir }: ContextMenuContentProps) {
  const { open, position } = React.useContext(ContextMenuContext)

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className,
      )}
      style={{
        top: position.y,
        left: position.x,
      }}
      dir={dir}
      role="menu"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Context Menu Item
// ============================================================================

interface ContextMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
}

function ContextMenuItem({ children, className, onClick, disabled }: ContextMenuItemProps) {
  const { onOpenChange } = React.useContext(ContextMenuContext)

  const handleClick = () => {
    if (disabled) return
    onClick?.()
    onOpenChange(false)
  }

  return (
    <div
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      role="menuitem"
      tabIndex={-1}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Context Menu Separator
// ============================================================================

interface ContextMenuSeparatorProps {
  className?: string
}

function ContextMenuSeparator({ className }: ContextMenuSeparatorProps) {
  return <div className={cn('-mx-1 my-1 h-px bg-muted', className)} role="separator" />
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
}
