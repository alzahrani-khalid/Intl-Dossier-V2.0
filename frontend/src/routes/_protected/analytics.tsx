import { createFileRoute } from '@tanstack/react-router'
import ClusterVisualization from '@/components/analytics/ClusterVisualization'

function AnalyticsPage() {
  const points = [
    [1, 1, 0],
    [2, 2, 0],
    [8, 8, 0],
  ]
  const labels = [0, 0, 1]
  const pts2d = points.map(([x, y]) => [x, y])
  return (
    <div style={{ padding: 16 }}>
      <h2>Clustering</h2>
      <ClusterVisualization points={pts2d as any} labels={labels} />
    </div>
  )
}

export const Route = createFileRoute('/_protected/analytics')({
  component: AnalyticsPage,
})

