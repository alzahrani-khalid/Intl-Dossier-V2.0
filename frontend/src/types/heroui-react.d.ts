/**
 * HeroUI v3 React Type Declarations (Stub)
 *
 * Provides type declarations for @heroui/react until the package is installed.
 * This allows the codebase to compile without the actual package being present.
 *
 * Components used across the codebase:
 * - heroui-forms.tsx: TextField, Input, TextArea, Label, Description, FieldError, Select, Checkbox, Switch
 * - heroui-modal.tsx: Modal, Button, useOverlayState
 * - theme-toggle.tsx: Button, Dropdown
 */

declare module '@heroui/react' {
  import type { FC, ReactNode } from 'react'

  // ============================================================================
  // Form Components
  // ============================================================================

  export const TextField: FC<{
    name?: string
    type?: string
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    isRequired?: boolean
    isDisabled?: boolean
    isReadOnly?: boolean
    isInvalid?: boolean
    className?: string
    children?: ReactNode
  }>

  export const Input: FC<{
    placeholder?: string
    className?: string
    [key: string]: any
  }>

  export const TextArea: FC<{
    placeholder?: string
    rows?: number
    className?: string
    [key: string]: any
  }>

  export const Label: FC<{
    className?: string
    children?: ReactNode
  }>

  export const Description: FC<{
    className?: string
    children?: ReactNode
  }>

  export const FieldError: FC<{
    children?: ReactNode
  }>

  export const Select: FC<{
    [key: string]: any
  }>

  // ============================================================================
  // Checkbox Component (Compound)
  // ============================================================================

  type CheckboxComponent = FC<{
    name?: string
    isSelected?: boolean
    defaultSelected?: boolean
    onChange?: (isSelected: boolean) => void
    isRequired?: boolean
    isDisabled?: boolean
    isIndeterminate?: boolean
    className?: string
    children?: ReactNode
  }> & {
    Control: FC<{
      className?: string
      children?: ReactNode
    }>
    Indicator: FC<{
      className?: string
    }>
  }

  export const Checkbox: CheckboxComponent

  // ============================================================================
  // Switch Component (Compound)
  // ============================================================================

  type SwitchComponent = FC<{
    name?: string
    isSelected?: boolean
    defaultSelected?: boolean
    onChange?: (isSelected: boolean) => void
    isDisabled?: boolean
    className?: string
    children?: ReactNode
  }> & {
    Control: FC<{
      children?: ReactNode
    }>
    Thumb: FC<Record<string, never>>
  }

  export const Switch: SwitchComponent

  // ============================================================================
  // Modal Component (Compound)
  // ============================================================================

  type ModalComponent = FC<{
    children?: ReactNode
  }> & {
    Backdrop: FC<{
      variant?: 'opaque' | 'blur' | 'transparent'
      isDismissable?: boolean
      isKeyboardDismissDisabled?: boolean
      children?: ReactNode
    }>
    Container: FC<{
      size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover' | 'full'
      placement?: 'auto' | 'center' | 'top' | 'bottom'
      children?: ReactNode
    }>
    Dialog: FC<{
      className?: string
      children?: ReactNode
    }>
    CloseTrigger: FC<Record<string, never>>
    Header: FC<{
      className?: string
      children?: ReactNode
    }>
    Heading: FC<{
      className?: string
      children?: ReactNode
    }>
    Body: FC<{
      className?: string
      children?: ReactNode
    }>
    Footer: FC<{
      className?: string
      children?: ReactNode
    }>
  }

  export const Modal: ModalComponent

  // ============================================================================
  // Button Component
  // ============================================================================

  export const Button: FC<{
    children?: ReactNode
    className?: string
    variant?: string
    size?: string
    isIconOnly?: boolean
    isDisabled?: boolean
    onPress?: () => void
    slot?: string
    'aria-label'?: string
    [key: string]: any
  }>

  // ============================================================================
  // Dropdown Component (Compound)
  // ============================================================================

  type DropdownItemComponent = FC<{
    key?: string
    id?: string
    textValue?: string
    className?: string
    children?: ReactNode
  }>

  type DropdownMenuComponent = FC<{
    'aria-label'?: string
    selectionMode?: 'single' | 'multiple' | 'none'
    selectedKeys?: Set<string>
    onAction?: (key: string | number) => void
    children?: ReactNode
  }>

  type DropdownComponent = FC<{
    children?: ReactNode
  }> & {
    Trigger: FC<{
      children?: ReactNode
    }>
    Popover: FC<{
      placement?: string
      children?: ReactNode
    }>
    Menu: DropdownMenuComponent
    Item: DropdownItemComponent
  }

  export const Dropdown: DropdownComponent

  // ============================================================================
  // Tooltip Component (Compound)
  // ============================================================================

  type TooltipComponent = FC<{
    delay?: number
    children?: ReactNode
  }> & {
    Trigger: FC<{
      children?: ReactNode
    }>
    Content: FC<{
      placement?: string
      children?: ReactNode
    }>
  }

  export const Tooltip: TooltipComponent

  // ============================================================================
  // Hooks
  // ============================================================================

  export function useOverlayState(): {
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
    onOpenChange: (isOpen: boolean) => void
  }
}
