
interface RelationshipData {
  country: string
  health: number
  engagement: number
  compliance: number
}

export function RelationshipHealthChart() {
  const data: RelationshipData[] = [
    { country: 'United States', health: 85, engagement: 90, compliance: 80 },
    { country: 'United Kingdom', health: 78, engagement: 75, compliance: 82 },
    { country: 'Japan', health: 92, engagement: 95, compliance: 88 },
    { country: 'Germany', health: 70, engagement: 65, compliance: 75 },
    { country: 'France', health: 82, engagement: 85, compliance: 78 },
  ]

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'bg-green-500'
    if (health >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getHealthLabel = (health: number) => {
    if (health >= 80) return 'Excellent'
    if (health >= 60) return 'Good'
    return 'Needs Attention'
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.country} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-white">
              {item.country}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {getHealthLabel(item.health)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Health Score */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Health</span>
                <span className="font-medium">{item.health}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getHealthColor(item.health)} transition-all`}
                  style={{ width: `${item.health}%` }}
                />
              </div>
            </div>

            {/* Engagement Score */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Engagement</span>
                <span className="font-medium">{item.engagement}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${item.engagement}%` }}
                />
              </div>
            </div>

            {/* Compliance Score */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">Compliance</span>
                <span className="font-medium">{item.compliance}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${item.compliance}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Excellent (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Good (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Needs Attention (&lt;60)</span>
          </div>
        </div>
      </div>
    </div>
  )
}