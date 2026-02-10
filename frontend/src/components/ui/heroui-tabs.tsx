/**
 * HeroUI Tabs Wrapper
 *
 * Drop-in replacement for shadcn Tabs matching the shadcn-ui-kit reference styling.
 * Uses Radix UI primitives for behavior/accessibility.
 */

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn, getDocDir } from '@/lib/utils'

function HeroUITabs({
  className,
  orientation = 'horizontal',
  dir,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      dir={dir ?? getDocDir()}
      className={cn('flex gap-2', orientation === 'vertical' ? 'flex-row' : 'flex-col', className)}
      orientation={orientation}
      {...props}
    />
  )
}

function HeroUITabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function HeroUITabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium',
        'ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'h-[calc(100%-1px)]',
        'border border-transparent',
        'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30',
        'data-[state=inactive]:text-muted-foreground',
        'cursor-pointer select-none',
        className,
      )}
      {...props}
    />
  )
}

function HeroUITabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        'flex-1 outline-none',
        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  )
}

export { HeroUITabs, HeroUITabsList, HeroUITabsTrigger, HeroUITabsContent }
