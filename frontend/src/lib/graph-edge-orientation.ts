// Executable spec for the edge-building transform in supabase/functions/graph-traversal/index.ts -- keep both in lockstep.
export interface TraversalRow {
  path: string[]
  relationship_path: string[]
  direction_path?: string[]
}

export interface OrientedEdge {
  source_id: string
  target_id: string
  relationship_type: string
}

export function buildGraphEdges(rows: TraversalRow[]): OrientedEdge[] {
  const edgeKeys = new Set<string>()
  const edges: OrientedEdge[] = []

  rows.forEach((row) => {
    if (row.path.length <= 1) {
      return
    }

    for (let i = 0; i < row.path.length - 1; i += 1) {
      const relationshipType = row.relationship_path[i]

      if (!relationshipType) {
        continue
      }

      const currentId = row.path[i]
      const nextId = row.path[i + 1]

      if (currentId === undefined || nextId === undefined) {
        continue
      }

      const isIncoming = row.direction_path?.[i] === 'incoming'
      const sourceId = isIncoming ? nextId : currentId
      const targetId = isIncoming ? currentId : nextId
      const edgeKey = `${sourceId}::${targetId}::${relationshipType}`

      if (edgeKeys.has(edgeKey)) {
        continue
      }

      edgeKeys.add(edgeKey)
      edges.push({
        source_id: sourceId,
        target_id: targetId,
        relationship_type: relationshipType,
      })
    }
  })

  return edges
}
