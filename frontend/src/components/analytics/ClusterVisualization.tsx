import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

type Props = {
 points: number[][]
 labels: number[]
}

export default function ClusterVisualization({ points, labels }: Props) {
 const data = points.map((p, i) => ({ x: p[0], y: p[1], cluster: labels[i] }))
 const clusters = Array.from(new Set(labels))
 const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
 return (
 <ScatterChart width={480} height={360} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
 <CartesianGrid />
 <XAxis type="number" dataKey="x" name="X" />
 <YAxis type="number" dataKey="y" name="Y" />
 <Tooltip cursor={{ strokeDasharray: '3 3' }} />
 <Legend />
 {clusters.map((c, i) => (
 <Scatter key={c} name={`Cluster ${c}`} data={data.filter(d => d.cluster === c)} fill={colors[i % colors.length]} />
 ))}
 </ScatterChart>
 )
}

