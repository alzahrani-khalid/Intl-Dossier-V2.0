/**
 * Card — re-exports from heroui-card.tsx
 *
 * Maintains shadcn-compatible named exports so all existing consumers
 * (import { Card, CardHeader, ... } from "@/components/ui/card") keep working.
 */

export {
  HeroUICard as Card,
  HeroUICardHeader as CardHeader,
  HeroUICardTitle as CardTitle,
  HeroUICardDescription as CardDescription,
  HeroUICardAction as CardAction,
  HeroUICardContent as CardContent,
  HeroUICardFooter as CardFooter,
} from './heroui-card'
