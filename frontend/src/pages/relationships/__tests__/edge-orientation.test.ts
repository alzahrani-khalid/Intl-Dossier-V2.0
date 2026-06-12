import { describe, expect, it } from 'vitest'
import { buildGraphEdges } from '@/lib/graph-edge-orientation'

describe('buildGraphEdges', () => {
  it('keeps outgoing hops in path order', () => {
    const rows = [
      {
        path: ['A', 'B'],
        relationship_path: ['member_of'],
        direction_path: ['outgoing'],
      },
    ]

    const edges = buildGraphEdges(rows)

    expect(edges).toEqual([
      {
        source_id: 'A',
        target_id: 'B',
        relationship_type: 'member_of',
      },
    ])
  })

  it('swaps incoming hops so the arrow points at the focused dossier', () => {
    const rows = [
      {
        path: ['A', 'B'],
        relationship_path: ['member_of'],
        direction_path: ['incoming'],
      },
    ]

    const edges = buildGraphEdges(rows)

    expect(edges).toEqual([
      {
        source_id: 'B',
        target_id: 'A',
        relationship_type: 'member_of',
      },
    ])
  })

  it('orients mixed multi-hop paths per hop direction', () => {
    const rows = [
      {
        path: ['A', 'B', 'C'],
        relationship_path: ['member_of', 'cooperates_with'],
        direction_path: ['outgoing', 'incoming'],
      },
    ]

    const edges = buildGraphEdges(rows)

    expect(edges).toEqual([
      {
        source_id: 'A',
        target_id: 'B',
        relationship_type: 'member_of',
      },
      {
        source_id: 'C',
        target_id: 'B',
        relationship_type: 'cooperates_with',
      },
    ])
  })

  it('treats missing direction_path as all-outgoing for legacy RPC deploy windows', () => {
    const rows = [
      {
        path: ['A', 'B', 'C'],
        relationship_path: ['member_of', 'cooperates_with'],
      },
    ]

    const edges = buildGraphEdges(rows)

    expect(edges).toEqual([
      {
        source_id: 'A',
        target_id: 'B',
        relationship_type: 'member_of',
      },
      {
        source_id: 'B',
        target_id: 'C',
        relationship_type: 'cooperates_with',
      },
    ])
  })

  it('deduplicates identical source-target-type edges across rows', () => {
    const rows = [
      {
        path: ['A', 'B'],
        relationship_path: ['member_of'],
        direction_path: ['outgoing'],
      },
      {
        path: ['A', 'B'],
        relationship_path: ['member_of'],
        direction_path: ['outgoing'],
      },
      {
        path: ['A', 'B'],
        relationship_path: ['cooperates_with'],
        direction_path: ['outgoing'],
      },
    ]

    const edges = buildGraphEdges(rows)

    expect(edges).toEqual([
      {
        source_id: 'A',
        target_id: 'B',
        relationship_type: 'member_of',
      },
      {
        source_id: 'A',
        target_id: 'B',
        relationship_type: 'cooperates_with',
      },
    ])
  })
})
