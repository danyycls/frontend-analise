import type { GraphData, GraphNode, GraphEdge } from './types'
import type { CrossReference } from '../cross-reference/types'
import type { EntityDocument } from '../cross-reference/types'

export function buildGraph(
  entities: EntityDocument[],
  references: CrossReference[]
): GraphData {
  const nodes: GraphNode[] = entities.map((e) => ({
    id: e.id,
    type: e.type,
    label: e.label,
    metadata: {
      document: e.document,
      source: e.source,
      ...e.originalData,
    } as Record<string, unknown>,
  }))

  const nodeIds = new Set(nodes.map((n) => n.id))

  const edges: GraphEdge[] = references
    .filter((r) => nodeIds.has(r.sourceId) && nodeIds.has(r.targetId))
    .map((r) => ({
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: r.type,
      label: r.evidence.slice(0, 60),
      weight: r.confidence,
    }))

  return { nodes, edges }
}
