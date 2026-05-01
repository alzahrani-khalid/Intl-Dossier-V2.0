import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'

import { cn, getDocDir } from '@/lib/utils'

function DropdownMenu({ dir, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return (
    <DropdownMenuPrimitive.Root data-slot="dropdown-menu" dir={dir ?? getDocDir()} {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  ref?: React.Ref<HTMLDivElement>
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] text-[var(--ink)] outline-hidden focus:bg-[var(--line-soft)] data-[state=open]:bg-[var(--line-soft)] [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        inset && 'ps-8',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ms-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-raised)] p-1 text-[var(--ink)] shadow-[var(--shadow)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-raised)] p-1 text-[var(--ink)] shadow-[var(--shadow)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  ref?: React.Ref<HTMLDivElement>
  inset?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] outline-hidden transition-colors focus:bg-[var(--line-soft)] focus:text-[var(--ink)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        'data-[variant=destructive]:text-[var(--danger)] data-[variant=destructive]:focus:bg-[var(--danger-soft)] data-[variant=destructive]:*:[svg]:!text-[var(--danger)]',
        inset && 'ps-8',
        className,
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-[var(--radius-sm)] py-1.5 ps-8 pe-2 text-[13px] outline-hidden transition-colors focus:bg-[var(--line-soft)] focus:text-[var(--ink)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute start-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-[var(--radius-sm)] py-1.5 ps-8 pe-2 text-[13px] outline-hidden transition-colors focus:bg-[var(--line-soft)] focus:text-[var(--ink)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      <span className="absolute start-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  ref?: React.Ref<HTMLDivElement>
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn('label px-2 py-1.5 data-[inset]:ps-8', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-[var(--line)]', className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'ms-auto font-mono text-[11px] tracking-widest text-[var(--ink-faint)]',
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
