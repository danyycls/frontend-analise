import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  InvestigationEntity,
} from '@/entities/investigation'
import type { NodeType } from '@/domain'

interface InvestigationState {
  entities: Record<string, InvestigationEntity>
  entityOrder: string[]
  inspectionDoc: string | null
}

const initialState: InvestigationState = {
  entities: {},
  entityOrder: [],
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

    clearInspectionDoc(state) {
      state.inspectionDoc = null
    },
  },
})

export const {
  addEntity,
  removeEntity,
  addEntities,
  updateEntityData,
  clearInspectionDoc,
} = investigationSlice.actions

export default investigationSlice.reducer
