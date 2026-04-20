/**
 * Button — re-exports from heroui-button.tsx
 *
 * Maintains shadcn-compatible named exports so the 250+ existing consumers
 * (import { Button } from '@/components/ui/button') keep working unchanged.
 * See CLAUDE.md §HeroUI v3 Drop-In Replacement Pattern.
 */

export { HeroUIButton as Button, buttonVariants } from './heroui-button'
export type { ButtonProps } from './heroui-button'
