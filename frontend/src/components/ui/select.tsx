import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

import { cn, getDocDir } from '@/lib/utils'

function Select({ dir, ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" dir={dir ?? getDocDir()} {...props} />
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  ref?: React.Ref<HTMLButtonElement>
  size?: 'default' | 'sm'
}) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'id-select-trigger flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--ink)]',
        'outline-none focus-visible:border-[var(--accent)] focus-visible:ring-0',
        'aria-invalid:border-[var(--danger)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[size=default]:min-h-11 data-[size=default]:sm:min-h-9 data-[size=sm]:min-h-11 data-[size=sm]:sm:min-h-8',
        '*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2',
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
        'placeholder:text-[var(--ink-faint)]',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectScrollUpButton({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      data-slot="select-scroll-up-button"
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      data-slot="select-scroll-down-button"
      className={cn('flex cursor-default items-center justify-center py-1', className)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        data-slot="select-content"
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink)] shadow-[var(--shadow)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      data-slot="select-label"
      className={cn('label py-1.5 ps-8 pe-2', className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-[var(--radius-sm)] py-1.5 ps-8 pe-2 text-[13px] outline-hidden focus:bg-[var(--line-soft)] focus:text-[var(--ink)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      data-slot="select-separator"
      className={cn('-mx-1 my-1 h-px bg-[var(--line)]', className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
