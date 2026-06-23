import type { NodeType, RelationType } from '@/domain'

export type {
  NodeType,
  RelationType,
} from '@/domain'

export interface InvestigationEntity {
  id: string
  type: NodeType
  label: string
  document?: string
  source: 'tse' | 'portal' | 'pncp' | 'camara' | 'senado' | 'tcu' | 'manual'
  originalData: Record<string, unknown>
  addedAt: string
  context?: string
}

export interface InvestigationSnapshot {
  id: string
  name: string
  entityIds: string[]
  filters: InvestigationFilters
  createdAt: string
}

export interface InvestigationFilters {
  nodeTypes: NodeType[]
  sources: string[]
  relationTypes: RelationType[]
  minWeight: number
}

export const DEFAULT_FILTERS: InvestigationFilters = {
  nodeTypes: [],
  sources: [],
  relationTypes: [],
  minWeight: 0.3,
}
