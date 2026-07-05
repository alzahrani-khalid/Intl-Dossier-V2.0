import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { LtrIsolate } from '@/components/ui/ltr-isolate'
import { useDirection } from '@/hooks/useDirection'

type Props = {
  points: number[][]
  labels: number[]
}

export default function ClusterVisualization({ points, labels }: Props) {
  const { isRTL } = useDirection()
  const data = points.map((p, i) => ({ x: p[0], y: p[1], cluster: labels[i] }))
  const clusters = Array.from(new Set(labels))
  const colors = [
    'var(--chart-1)',
    'var(--chart-5)',
    'var(--chart-3)',
    'var(--chart-8)',
    'var(--chart-7)',
  ]
  return (
    <LtrIsolate>
      <ScatterChart width={480} height={360} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="X" reversed={isRTL} />
        <YAxis type="number" dataKey="y" name="Y" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        {clusters.map((c, i) => (
          <Scatter
            key={c}
            name={`Cluster ${c}`}
            data={data.filter((d) => d.cluster === c)}
            fill={colors[i % colors.length]}
          />
        ))}
      </ScatterChart>
    </LtrIsolate>
  )
}
