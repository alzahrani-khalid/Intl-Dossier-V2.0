import { describe, it, expect } from 'vitest'
import { renderWithProviders as render } from '@tests/utils/render'
import ClusterVisualization from '@/components/analytics/ClusterVisualization'

describe('ClusterVisualization', () => {
  it('renders chart', () => {
    const { container } = render(
      <ClusterVisualization
        points={[
          [1, 2],
          [3, 4],
          [5, 6],
        ]}
        labels={[0, 1, 0]}
      />,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
