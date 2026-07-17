import { useCallback } from 'react'
import type { NodeType } from '@/domain'

export interface DiscoveredEntity {
  id: string
  type: NodeType
  label: string
  document?: string
  source: 'tse' | 'portal' | 'pncp' | 'camara' | 'senado' | 'tcu' | 'manual'
  originalData: Record<string, unknown>
  context?: string
}

type DiscoveryListener = (entity: DiscoveredEntity) => void

class EntityDiscoveryBus {
  private listeners: Set<DiscoveryListener> = new Set()

  subscribe(fn: DiscoveryListener): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  discover(entity: DiscoveredEntity): void {
    this.listeners.forEach((fn) => fn(entity))
  }

  discoverMany(entities: DiscoveredEntity[]): void {
    entities.forEach((e) => this.discover(e))
  }
}

export const discoveryBus = new EntityDiscoveryBus()

export function useDiscoveryReporter(): (
  entities: DiscoveredEntity | DiscoveredEntity[]
) => void {
  return useCallback(
    (entities: DiscoveredEntity | DiscoveredEntity[]) => {
      const list = Array.isArray(entities) ? entities : [entities]
      discoveryBus.discoverMany(list)
    },
    []
  )
}
