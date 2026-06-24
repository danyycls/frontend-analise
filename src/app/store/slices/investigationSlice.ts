import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  InvestigationEntity,
  InvestigationSnapshot,
  InvestigationFilters,
} from '@/entities/investigation'
import { DEFAULT_FILTERS } from '@/entities/investigation'
import type { GraphData, GraphEdge, NodeType } from '@/domain'
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

  lpLoading: boolean
  lpError: string | null
  lpEdges: GraphEdge[]

  anomalousNodeIds: string[]
  anomalousEdgeIds: string[]

  lpConnectedNodeIds: string[]

  politicallyConnectedNodeIds: string[]

  inspectionDoc: string | null
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
  lpLoading: false,
  lpError: null,
  lpEdges: [],
  anomalousNodeIds: [],
  anomalousEdgeIds: [],
  lpConnectedNodeIds: [],
  politicallyConnectedNodeIds: [],
  inspectionDoc: null,
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
      state.anomalousNodeIds = []
      state.anomalousEdgeIds = []
      state.lpConnectedNodeIds = []
      state.politicallyConnectedNodeIds = []
      state.inspectionDoc = null
    },

    addEntities(state, action: PayloadAction<Array<Partial<InvestigationEntity> & Omit<InvestigationEntity, 'id' | 'addedAt'> & { id?: string }>>) {
      const existingDocs = new Set<string>()
      for (const eid of state.entityOrder) {
        const ent = state.entities[eid]
        if (ent?.document) {
          existingDocs.add(ent.document.replace(/\D/g, ''))
        }
      }

      for (const e of action.payload) {
        if (e.document) {
          const norm = e.document.replace(/\D/g, '')
          if (norm.length >= 3 && existingDocs.has(norm)) continue
          if (norm.length >= 3) existingDocs.add(norm)
        }
        const id = e.id || nextId()
        const entity: InvestigationEntity = {
          type: e.type,
          label: e.label,
          document: e.document,
          source: e.source,
          originalData: e.originalData || {},
          addedAt: new Date().toISOString(),
          context: e.context,
          batchId: e.batchId,
          batchLabel: e.batchLabel,
          id,
        }
        state.entities[id] = entity
        if (!state.entityOrder.includes(id)) {
          state.entityOrder.push(id)
        }
      }
    },

    updateEntityData(
      state,
      action: PayloadAction<{ id: string; data: Record<string, unknown>; context?: string }>
    ) {
      const { id, data, context } = action.payload
      if (state.entities[id]) {
        state.entities[id].originalData = {
          ...state.entities[id].originalData,
          ...data,
        }
        if (context !== undefined) {
          state.entities[id].context = context
        }
      }
    },

    removeEntitiesByBatch(state, action: PayloadAction<string>) {
      const batchId = action.payload
      const idsToRemove = Object.keys(state.entities).filter(
        (id) => state.entities[id].batchId === batchId
      )
      for (const id of idsToRemove) {
        delete state.entities[id]
      }
      state.entityOrder = state.entityOrder.filter(
        (eid) => !idsToRemove.includes(eid)
      )
      if (state.selectedNodeId && idsToRemove.includes(state.selectedNodeId)) {
        state.selectedNodeId = null
      }
      state.discoveries = state.discoveries.filter(
        (d) => d.id !== batchId
      )
      state.lpEdges = []
      state.lpError = null
      state.anomalousNodeIds = []
      state.anomalousEdgeIds = []
      state.lpConnectedNodeIds = []
      state.politicallyConnectedNodeIds = []
    },

    setLpLoading(state, action: PayloadAction<boolean>) {
      state.lpLoading = action.payload
    },

    setLpError(state, action: PayloadAction<string | null>) {
      state.lpError = action.payload
    },

    setLpEdges(state, action: PayloadAction<GraphEdge[]>) {
      state.lpEdges = action.payload
    },

    clearLpData(state) {
      state.lpLoading = false
      state.lpError = null
      state.lpEdges = []
    },

    setAnomalyIds(state, action: PayloadAction<{ nodeIds: string[]; edgeIds: string[] }>) {
      state.anomalousNodeIds = action.payload.nodeIds
      state.anomalousEdgeIds = action.payload.edgeIds
    },

    setLpConnectedIds(state, action: PayloadAction<string[]>) {
      state.lpConnectedNodeIds = action.payload
    },

    setPoliticallyConnectedIds(state, action: PayloadAction<string[]>) {
      state.politicallyConnectedNodeIds = action.payload
    },

    setInspectionDoc(state, action: PayloadAction<string>) {
      state.inspectionDoc = action.payload
    },

    clearInspectionDoc(state) {
      state.inspectionDoc = null
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
  removeEntitiesByBatch,
  setLpLoading,
  setLpError,
  setLpEdges,
  clearLpData,
  setAnomalyIds,
  setLpConnectedIds,
  setPoliticallyConnectedIds,
  setInspectionDoc,
  clearInspectionDoc,
} = investigationSlice.actions

export default investigationSlice.reducer
