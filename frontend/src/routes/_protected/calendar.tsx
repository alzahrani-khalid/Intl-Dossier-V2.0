/**
 * Calendar LAYOUT
 *
 * Phase 96 DEAD-07: this file used to render the calendar page body directly and
 * had no <Outlet/>, so `calendar/new.tsx` was registered but never reachable in
 * render — the same DEAD-08 class Phase 95 fixed on `legislation.tsx`, same fix.
 * It is now a layout; the page body lives in `calendar/index.tsx`.
 *
 * This route declares no `validateSearch`/`beforeLoad`/loader, so nothing else
 * moves here (the legislation analog keeps those ON the layout when they exist).
 */

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/calendar')({
  component: () => <Outlet />,
})
