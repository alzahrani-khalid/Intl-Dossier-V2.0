/**
 * HeroUI Switch Wrapper
 *
 * Drop-in replacement for Radix Switch with HeroUI v3 styling.
 * Renders as a plain button + span (no @heroui/react dependency)
 * for full React.HTMLAttributes compatibility.
 *
 * HeroUI v3 Switch design:
 * - Track: 20px × 40px (h-5 w-10)
 * - Thumb: 16px × 22px oval (h-4 w-[1.375rem])
 * - Positioning: margin-based (ms-0.5 default, ms-[calc(100%-1.5rem)] checked)
 * - Colors: bg-input → bg-primary (unchecked → checked)
 *
 * All 51 consumers continue to use:
 *   <Switch checked={value} onCheckedChange={handler} />
 *
 * Props mapped:
 *   checked → controlled state
 *   defaultChecked → initial uncontrolled state
 *   onCheckedChange → toggle callback
 *   disabled → disabled state
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  name?: string
  value?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      className,
      id,
      name,
      value,
      ...props
    },
    ref,
  ) => {
    const isControlled = checked !== undefined
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const isOn = isControlled ? checked : internalChecked

    const handleClick = () => {
      if (disabled) return
      const next = !isOn
      if (!isControlled) {
        setInternalChecked(next)
      }
      onCheckedChange?.(next)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isOn}
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'peer inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border border-[var(--line)] shadow-[var(--shadow-sm)]',
          'transition-colors duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOn ? 'border-[var(--accent)] bg-[var(--accent)]' : 'bg-[var(--line-soft)]',
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-[1.375rem] rounded-full bg-[var(--surface)] shadow-[var(--shadow)] ring-0',
            'transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            isOn ? 'ms-[calc(100%-1.5rem)]' : 'ms-0.5',
          )}
        />
        {name && <input type="hidden" name={name} value={isOn ? value || 'on' : ''} />}
      </button>
    )
  },
)
Switch.displayName = 'Switch'

export { Switch }
