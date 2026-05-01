import { type ReactElement } from 'react'
import { DashboardGrid } from './widgets/DashboardGrid'
import { DashboardHero } from './components/DashboardHero'
import { KpiStrip, WeekAhead, OverdueCommitments, SlaHealth, VipVisits, MyTasks } from './widgets'
import './widgets/dashboard.css'

export function Dashboard(): ReactElement {
  return (
    <div className="page dash-root">
      <DashboardHero />
      <KpiStrip />
      <DashboardGrid
        left={[<WeekAhead key="wa" />, <OverdueCommitments key="oc" />]}
        right={[<SlaHealth key="sh" />, <VipVisits key="vv" />, <MyTasks key="mt" />]}
      />
    </div>
  )
}
