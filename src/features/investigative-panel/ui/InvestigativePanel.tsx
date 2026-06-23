import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import {
  addEntities,
  removeEntity,
  selectNode,
  hoverNode,
  setGraphData,
  addDiscoveryToGraph,
  dismissDiscovery,
  saveSnapshot,
  undo,
  redo,
  restoreSnapshot,
  deleteSnapshot,
  clearInvestigation,
  setFilters,
} from '@/app/store/slices/investigationSlice'
import {
  buildGraph,
  findCrossReferences,
  type NodeType,
} from '@/domain'
import type { EntityDocument } from '@/domain'
import type { InvestigationFilters } from '@/entities/investigation'
import { useDiscoverySubscriber } from '@/shared/lib/entity-discovery'
import GraphCanvas from './GraphCanvas'
import SidebarEntities from './SidebarEntities'
import SidebarFilters from './SidebarFilters'
import SidebarHistory from './SidebarHistory'
import NodeDetailPanel from './NodeDetailPanel'
import AddEntityDialog from './AddEntityDialog'

export default function InvestigativePanel() {
  const dispatch = useAppDispatch()

  const entitiesRecord = useAppSelector((s) => s.investigation.entities)
  const entityOrder = useAppSelector((s) => s.investigation.entityOrder)
  const discoveries = useAppSelector((s) => s.investigation.discoveries)
  const graphData = useAppSelector((s) => s.investigation.graphData)
  const selectedNodeId = useAppSelector((s) => s.investigation.selectedNodeId)
  const hoveredNodeId = useAppSelector((s) => s.investigation.hoveredNodeId)
  const filters = useAppSelector((s) => s.investigation.filters)
  const snapshots = useAppSelector((s) => s.investigation.snapshots)
  const snapshotIndex = useAppSelector((s) => s.investigation.currentSnapshotIndex)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)

  useDiscoverySubscriber()

  const entities = useMemo(
    () => entityOrder.map((id) => entitiesRecord[id]).filter(Boolean),
    [entitiesRecord, entityOrder]
  )

  const entityDocs: EntityDocument[] = useMemo(() => {
    return entities
      .filter((e) => {
        if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(e.type))
          return false
        if (filters.sources.length > 0 && !filters.sources.includes(e.source))
          return false
        return true
      })
      .map((e) => ({
        id: e.id,
        label: e.label,
        type: e.type,
        document: e.document,
        source: e.source,
        originalData: e.originalData || {},
      }))
  }, [entities, filters])

  const rebuildGraph = useCallback(() => {
    const matches = findCrossReferences(entityDocs)
    const filteredRefs = matches.references.filter((r) => {
      if (
        filters.relationTypes.length > 0 &&
        !filters.relationTypes.includes(r.type)
      )
        return false
      if (r.confidence < filters.minWeight) return false
      return true
    })
    const graph = buildGraph(entityDocs, filteredRefs)
    dispatch(setGraphData(graph))
  }, [entityDocs, filters, dispatch])

  const lastDocsRef = useRef<string>('')
  const lastFiltersRef = useRef<string>('')

  useEffect(() => {
    const docsKey = entityDocs.map((e) => e.id).join(',')
    const filtersKey = JSON.stringify(filters)
    if (docsKey !== lastDocsRef.current || filtersKey !== lastFiltersRef.current) {
      lastDocsRef.current = docsKey
      lastFiltersRef.current = filtersKey
      rebuildGraph()
    }
  }, [entityDocs, filters, rebuildGraph])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (nodeId) {
        dispatch(selectNode(nodeId))
        setRightPanelOpen(true)
      } else {
        dispatch(selectNode(null))
      }
    },
    [dispatch]
  )

  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      dispatch(hoverNode(nodeId))
    },
    [dispatch]
  )

  const selectedEntity = useMemo(
    () => (selectedNodeId ? entities.find((e) => e.id === selectedNodeId) : null),
    [selectedNodeId, entities]
  )

  const selectedNode = useMemo(
    () =>
      selectedNodeId
        ? graphData?.nodes.find((n) => n.id === selectedNodeId)
        : null,
    [selectedNodeId, graphData]
  )

  const handleAddManual = useCallback(
    (entity: {
      type: NodeType
      label: string
      document?: string
      source: 'manual'
      context?: string
    }) => {
      dispatch(
        addEntities([
          {
            type: entity.type,
            label: entity.label,
            document: entity.document,
            source: entity.source,
            originalData: {},
            context: entity.context,
          },
        ])
      )
    },
    [dispatch]
  )

  const handleFiltersChange = useCallback(
    (partial: Partial<InvestigationFilters>) => {
      dispatch(setFilters(partial))
    },
    [dispatch]
  )

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 300px',
        gridTemplateRows: '1fr',
        height: 'calc(100vh - 48px)',
        overflow: 'hidden',
        gap: 0,
      }}
    >
      <div
        style={{
          background: '#0d0d1a',
          borderRight: '1px solid #2a2a3e',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: '1 1 auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: '1 1 50%', overflow: 'hidden' }}>
            <SidebarEntities
              entities={entities}
              discoveries={discoveries}
              selectedNodeId={selectedNodeId}
              onSelect={handleNodeClick}
              onRemove={(id) => dispatch(removeEntity(id))}
              onAddDiscovery={(did) => dispatch(addDiscoveryToGraph(did))}
              onDismissDiscovery={(did) => dispatch(dismissDiscovery(did))}
              onAddEntityClick={() => setAddDialogOpen(true)}
            />
          </div>
          <div style={{ flex: '0 0 auto', overflow: 'hidden' }}>
            <SidebarFilters filters={filters} onChange={handleFiltersChange} />
          </div>
          <div style={{ flex: '0 0 auto', overflow: 'hidden' }}>
            <SidebarHistory
              snapshots={snapshots}
              currentIndex={snapshotIndex}
              canUndo={snapshots.length > 0 && snapshotIndex >= 0}
              canRedo={snapshots.length > 0 && snapshotIndex < snapshots.length - 1}
              onUndo={() => dispatch(undo())}
              onRedo={() => dispatch(redo())}
              onSave={(name) => dispatch(saveSnapshot(name))}
              onRestore={(id) => dispatch(restoreSnapshot(id))}
              onDelete={(id) => dispatch(deleteSnapshot(id))}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#0a0a15',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <GraphCanvas
          graphData={graphData}
          selectedNodeId={selectedNodeId}
          hoveredNodeId={hoveredNodeId}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
        />
      </div>

      <div
        style={{
          background: '#0d0d1a',
          borderLeft: '1px solid #2a2a3e',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <NodeDetailPanel
            entity={selectedEntity}
            node={selectedNode}
            graphEdges={graphData?.edges ?? []}
            onClose={() => {
              dispatch(selectNode(null))
              setRightPanelOpen(false)
            }}
            onRemove={(id) => dispatch(removeEntity(id))}
          />
        </div>
      </div>

      <AddEntityDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddManual}
      />
    </div>
  )
}
