import { type ReactElement } from 'react'
import { DashboardGrid } from './widgets/DashboardGrid'
import { DashboardHero } from './components/DashboardHero'
import {
  KpiStrip,
  WeekAhead,
  OverdueCommitments,
  Digest,
  SlaHealth,
  VipVisits,
  MyTasks,
  RecentDossiers,
  ForumsStrip,
} from './widgets'
import './widgets/dashboard.css'

export function Dashboard(): ReactElement {
  return (
    <div className="page dash-root">
      <DashboardHero />
      <KpiStrip />
      <DashboardGrid
        left={[
          <WeekAhead key="wa" />,
          <RecentDossiers key="rd" />,
          <OverdueCommitments key="oc" />,
        ]}
        right={[
          <SlaHealth key="sh" />,
          <Digest key="dg" />,
          <ForumsStrip key="fs" />,
          <VipVisits key="vv" />,
          <MyTasks key="mt" />,
        ]}
      />
    </div>
  )
}
