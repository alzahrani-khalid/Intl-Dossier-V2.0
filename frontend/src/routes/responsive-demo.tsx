import { createFileRoute } from '@tanstack/react-router'
import { DemoPage } from './_protected/responsive-demo'

// Public mirror of the demo page (no auth required)
export const Route = createFileRoute('/responsive-demo')({ component: DemoPage })
