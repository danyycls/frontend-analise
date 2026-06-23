import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  InvestigationEntity,
  InvestigationSnapshot,
  InvestigationFilters,
} from '@/entities/investigation'
import { DEFAULT_FILTERS } from '@/entities/investigation'
import type { GraphData, NodeType } from '@/domain'
import type { DiscoveredEntity } from '@/shared/lib/entity-discovery'

interface InvestigationState {
  entities: Record<string, InvestigationEntity>
  entityOrder: string[]

  discoveries: DiscoveredEntity[]

  graphData: GraphData | null

  selectedNodeId: string | null
  hoveredNodeId: string | null

  filters: InvestigationFilters

  snapshots: InvestigationSnapshot[]
  currentSnapshotIndex: number
}

const initialState: InvestigationState = {
  entities: {},
  entityOrder: [],
  discoveries: [],
  graphData: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  filters: { ...DEFAULT_FILTERS },
  snapshots: [],
  currentSnapshotIndex: -1,
}

let entityCounter = 0
function nextId(): string {
  entityCounter++
  return `ent_${Date.now()}_${entityCounter}`
}

const investigationSlice = createSlice({
  name: 'investigation',
  initialState,
  reducers: {
    addEntity(state, action: PayloadAction<Omit<InvestigationEntity, 'id' | 'addedAt'>>) {
      const id = nextId()
      const entity: InvestigationEntity = {
        ...action.payload,
        id,
        addedAt: new Date().toISOString(),
      }
      state.entities[id] = entity
      if (!state.entityOrder.includes(id)) {
        state.entityOrder.push(id)
      }
    },

    removeEntity(state, action: PayloadAction<string>) {
      const id = action.payload
      delete state.entities[id]
      state.entityOrder = state.entityOrder.filter((eid) => eid !== id)
      if (state.selectedNodeId === id) {
        state.selectedNodeId = null
      }
      state.discoveries = state.discoveries.filter((d) => d.id !== id)
    },

    entityDiscovered(state, action: PayloadAction<DiscoveredEntity>) {
      const existing = state.discoveries.find(
        (d) => d.id === action.payload.id && d.source === action.payload.source
      )
      if (!existing) {
        state.discoveries.push(action.payload)
      }
    },

    addDiscoveryToGraph(state, action: PayloadAction<string>) {
      const discoveryId = action.payload
      const discovery = state.discoveries.find((d) => d.id === discoveryId)
      if (!discovery) return

      const alreadyAdded = state.entityOrder.some(
        (eid) => state.entities[eid]?.id === discovery.id
      )
      if (!alreadyAdded) {
        const id = nextId()
        const entity: InvestigationEntity = {
          id,
          type: discovery.type,
          label: discovery.label,
          document: discovery.document,
          source: discovery.source,
          originalData: discovery.originalData,
          addedAt: new Date().toISOString(),
          context: discovery.context,
        }
        state.entities[id] = entity
        state.entityOrder.push(id)
      }

      state.discoveries = state.discoveries.filter((d) => d.id !== discoveryId)
    },

    dismissDiscovery(state, action: PayloadAction<string>) {
      state.discoveries = state.discoveries.filter((d) => d.id !== action.payload)
    },

    clearDiscoveries(state) {
      state.discoveries = []
    },

    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload
    },

    hoverNode(state, action: PayloadAction<string | null>) {
      state.hoveredNodeId = action.payload
    },

    setGraphData(state, action: PayloadAction<GraphData | null>) {
      state.graphData = action.payload
    },

    setFilters(state, action: PayloadAction<Partial<InvestigationFilters>>) {
      state.filters = { ...state.filters, ...action.payload }
    },

    saveSnapshot(state, action: PayloadAction<string>) {
      const snapshot: InvestigationSnapshot = {
        id: `snap_${Date.now()}`,
        name: action.payload,
        entityIds: [...state.entityOrder],
        filters: { ...state.filters },
        createdAt: new Date().toISOString(),
      }

      if (state.currentSnapshotIndex < state.snapshots.length - 1) {
        state.snapshots = state.snapshots.slice(0, state.currentSnapshotIndex + 1)
      }

      state.snapshots.push(snapshot)
      state.currentSnapshotIndex = state.snapshots.length - 1
    },

    undo(state) {
      if (state.snapshots.length === 0) return

      if (state.currentSnapshotIndex === -1) {
        const latest = state.snapshots[state.snapshots.length - 1]
        state.currentSnapshotIndex = state.snapshots.length - 1
        state.entityOrder = [...latest.entityIds]
        state.filters = { ...latest.filters }
        return
      }

      if (state.currentSnapshotIndex > 0) {
        state.currentSnapshotIndex--
        const snap = state.snapshots[state.currentSnapshotIndex]
        state.entityOrder = [...snap.entityIds]
        state.filters = { ...snap.filters }
        state.entities = {}
        snap.entityIds.forEach((eid, i) => {
          state.entityOrder[i] = eid
        })
      }
    },

    redo(state) {
      if (
        state.snapshots.length === 0 ||
        state.currentSnapshotIndex >= state.snapshots.length - 1
      ) {
        return
      }

      state.currentSnapshotIndex++
      const snap = state.snapshots[state.currentSnapshotIndex]
      state.entityOrder = [...snap.entityIds]
      state.filters = { ...snap.filters }
    },

    restoreSnapshot(state, action: PayloadAction<string>) {
      const snap = state.snapshots.find((s) => s.id === action.payload)
      if (!snap) return
      state.entityOrder = [...snap.entityIds]
      state.filters = { ...snap.filters }
      state.currentSnapshotIndex = state.snapshots.indexOf(snap)
    },

    deleteSnapshot(state, action: PayloadAction<string>) {
      const idx = state.snapshots.findIndex((s) => s.id === action.payload)
      if (idx === -1) return
      state.snapshots.splice(idx, 1)
      if (state.currentSnapshotIndex >= state.snapshots.length) {
        state.currentSnapshotIndex = state.snapshots.length - 1
      }
    },

    clearInvestigation(state) {
      state.entities = {}
      state.entityOrder = []
      state.discoveries = []
      state.graphData = null
      state.selectedNodeId = null
      state.hoveredNodeId = null
      state.filters = { ...DEFAULT_FILTERS }
      state.snapshots = []
      state.currentSnapshotIndex = -1
    },

    addEntities(state, action: PayloadAction<Omit<InvestigationEntity, 'id' | 'addedAt'>[]>) {
      for (const e of action.payload) {
        const id = nextId()
        const entity: InvestigationEntity = {
          ...e,
          id,
          addedAt: new Date().toISOString(),
        }
        state.entities[id] = entity
        if (!state.entityOrder.includes(id)) {
          state.entityOrder.push(id)
        }
      }
    },

    updateEntityData(
      state,
      action: PayloadAction<{ id: string; data: Record<string, unknown> }>
    ) {
      const { id, data } = action.payload
      if (state.entities[id]) {
        state.entities[id].originalData = {
          ...state.entities[id].originalData,
          ...data,
        }
      }
    },
  },
})

export const {
  addEntity,
  removeEntity,
  entityDiscovered,
  addDiscoveryToGraph,
  dismissDiscovery,
  clearDiscoveries,
  selectNode,
  hoverNode,
  setGraphData,
  setFilters,
  saveSnapshot,
  undo,
  redo,
  restoreSnapshot,
  deleteSnapshot,
  clearInvestigation,
  addEntities,
  updateEntityData,
} = investigationSlice.actions

export default investigationSlice.reducer
