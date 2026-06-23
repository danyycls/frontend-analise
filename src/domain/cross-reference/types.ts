import type { RelationType, NodeType } from '../graph/types'

export interface CrossReference {
  id: string
  sourceId: string
  targetId: string
  type: RelationType
  confidence: number
  evidence: string
  metadata: Record<string, unknown>
}

export interface EntityDocument {
  id: string
  label: string
  type: NodeType
  document?: string
  source: string
  originalData: Record<string, unknown>
}

export interface MatchResult {
  references: CrossReference[]
  stats: {
    totalComparisons: number
    matchCount: number
    byType: Record<string, number>
  }
}
