import { type ReactElement } from 'react'
import { DashboardGrid } from './widgets/DashboardGrid'
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
    <div className="dash-root">
      <KpiStrip />
      <DashboardGrid
        left={[<WeekAhead key="wa" />, <OverdueCommitments key="oc" />, <Digest key="dg" />]}
        right={[
          <SlaHealth key="sh" />,
          <VipVisits key="vv" />,
          <MyTasks key="mt" />,
          <RecentDossiers key="rd" />,
          <ForumsStrip key="fs" />,
        ]}
      />
    </div>
  )
}
