import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  removeEntitiesByBatch,
  setLpLoading,
  setLpError,
  setLpEdges,
  clearLpData,
  setAnomalyIds,
  setInspectionDoc,
  setLpConnectedIds,
  setPoliticallyConnectedIds,
  updateEntityData,
} from '@/app/store/slices/investigationSlice'
import { setSubTabAtiva, setLpDataCache } from '@/app/store/slices/ligacaoPoliticaSlice'
import { setAbaAtiva } from '@/app/store/slices/navigationSlice'
import {
  buildGraph,
  findCrossReferences,
  type NodeType,
  type GraphEdge,
} from '@/domain'
import type { EntityDocument } from '@/domain'
import type { InvestigationFilters } from '@/entities/investigation'
import { useDiscoverySubscriber } from '@/shared/lib/entity-discovery'
import { apiP2 } from '@/shared/api/client'
import { ENDPOINTS } from '@/shared/api/endpoints'
import GraphCanvas from './GraphCanvas'
import SidebarEntities from './SidebarEntities'
import SidebarFilters from './SidebarFilters'
import SidebarHistory from './SidebarHistory'
import NodeDetailPanel from './NodeDetailPanel'
import AddEntityDialog from './AddEntityDialog'
import ContractDetailPopup from './ContractDetailPopup'
import { processLpResults } from '../lib/processLpResults'

export default function InvestigativePanel() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const entitiesRecord = useAppSelector((s) => s.investigation.entities)
  const entityOrder = useAppSelector((s) => s.investigation.entityOrder)
  const discoveries = useAppSelector((s) => s.investigation.discoveries)
  const graphData = useAppSelector((s) => s.investigation.graphData)
  const selectedNodeId = useAppSelector((s) => s.investigation.selectedNodeId)
  const hoveredNodeId = useAppSelector((s) => s.investigation.hoveredNodeId)
  const filters = useAppSelector((s) => s.investigation.filters)
  const snapshots = useAppSelector((s) => s.investigation.snapshots)
  const snapshotIndex = useAppSelector((s) => s.investigation.currentSnapshotIndex)
  const lpLoading = useAppSelector((s) => s.investigation.lpLoading)
  const lpError = useAppSelector((s) => s.investigation.lpError)
  const lpEdges = useAppSelector((s) => s.investigation.lpEdges)
  const anomalousNodeIds = useAppSelector((s) => s.investigation.anomalousNodeIds)
  const anomalousEdgeIds = useAppSelector((s) => s.investigation.anomalousEdgeIds)
  const lpConnectedNodeIds = useAppSelector((s) => s.investigation.lpConnectedNodeIds)
  const politicallyConnectedNodeIds = useAppSelector((s) => s.investigation.politicallyConnectedNodeIds)
  const lpDataCache = useAppSelector((s) => s.ligacaoPolitica.lpDataCache as Record<string, any>)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [contractPopupMeta, setContractPopupMeta] = useState<Record<string, unknown> | null>(null)

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
        if (filters.contexts.length > 0 && !filters.contexts.includes(e.context || ''))
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
        context: e.context,
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

    const docToId = new Map<string, string>()
    for (const e of entityDocs) {
      if (e.document) {
        const norm = e.document.replace(/\D/g, '')
        if (norm.length >= 3) {
          docToId.set(norm, e.id)
        }
      }
    }

    const existingPairs = new Set(
      graph.edges.map((e) => `${e.source}|${e.target}|${e.type}`)
    )
    let structCounter = 0

    for (const e of entityDocs) {
      const od = e.originalData as Record<string, unknown> | undefined
      if (!od) continue

      const vinculadoDoc = od.vinculado_a as string | undefined
      if (vinculadoDoc) {
        const norm = vinculadoDoc.replace(/\D/g, '')
        const targetId = docToId.get(norm)
        if (targetId && targetId !== e.id) {
          structCounter++
          const pairKey = `${e.id}|${targetId}|socio`
          const reverseKey = `${targetId}|${e.id}|socio`
          if (!existingPairs.has(pairKey) && !existingPairs.has(reverseKey)) {
            existingPairs.add(pairKey)
            graph.edges.push({
              id: `struct_${structCounter}`,
              source: e.id,
              target: targetId,
              type: 'socio',
              label: 'Sócio',
              weight: 0.95,
            })
          }
        }
      }

      const orgaoDoc = od.orgao_documento as string | undefined
      if (orgaoDoc) {
        const norm = orgaoDoc.replace(/\D/g, '')
        const targetId = docToId.get(norm)
        if (targetId && targetId !== e.id) {
          structCounter++
          const pairKey = `${e.id}|${targetId}|mesmo_documento`
          const reverseKey = `${targetId}|${e.id}|mesmo_documento`
          if (!existingPairs.has(pairKey) && !existingPairs.has(reverseKey)) {
            existingPairs.add(pairKey)
            graph.edges.push({
              id: `struct_${structCounter}`,
              source: e.id,
              target: targetId,
              type: 'mesmo_documento',
              label: 'Venceu licitação',
              weight: 0.95,
              metadata: {
                contrato_pncp: od.contrato_pncp,
                contrato_objeto: od.contrato_objeto,
                contrato_valor: od.contrato_valor,
                orgao_label: graph.nodes.find((n) => n.id === targetId)?.label,
                fornecedor_label: e.label,
              },
            })
          }
        }
      }

      const parentId = od.parent_id as string | undefined
      if (parentId && parentId !== e.id) {
        const parentInGraph = graph.nodes.some((n) => n.id === parentId)
        if (parentInGraph) {
          structCounter++
          const pairKey = `${e.id}|${parentId}|pertence`
          if (!existingPairs.has(pairKey)) {
            existingPairs.add(pairKey)
            graph.edges.push({
              id: `struct_${structCounter}`,
              source: e.id,
              target: parentId,
              type: 'pertence',
              label: 'Pertence',
              weight: 0.99,
            })
          }
        }
      }
    }

    if (lpEdges.length > 0) {
      const existingPairs2 = new Set(
        graph.edges.map((e) => `${e.source}|${e.target}|${e.type}`)
      )
      for (const edge of lpEdges) {
        const pairKey = `${edge.source}|${edge.target}|${edge.type}`
        if (!existingPairs2.has(pairKey)) {
          existingPairs2.add(pairKey)
          graph.edges.push(edge)
        }
      }
    }

    const anomalousNids = new Set<string>()
    const anomalousEids = new Set<string>()

    if (graph.edges.length > 0) {
      const parent = new Map<string, string>()
      const find = (x: string): string => {
        const p = parent.get(x)
        if (!p || p === x) return x
        const root = find(p)
        parent.set(x, root)
        return root
      }
      const union = (a: string, b: string) => {
        const ra = find(a)
        const rb = find(b)
        if (ra !== rb) parent.set(ra, rb)
      }

      for (const n of graph.nodes) {
        parent.set(n.id, n.id)
      }
      for (const e of graph.edges) {
        if (e.type === 'mesmo_documento') {
          union(e.source, e.target)
        }
      }

      const nodeTypeMap = new Map(graph.nodes.map((n) => [n.id, n.type]))
      const nodeMetaMap = new Map(graph.nodes.map((n) => [n.id, n.metadata]))

      const adjMap = new Map<string, Set<{ target: string; type: string }>>()
      for (const e of graph.edges) {
        if (!adjMap.has(e.source)) adjMap.set(e.source, new Set())
        adjMap.get(e.source)!.add({ target: e.target, type: e.type })
        if (!adjMap.has(e.target)) adjMap.set(e.target, new Set())
        adjMap.get(e.target)!.add({ target: e.source, type: e.type })
      }

      const politicalTypes = new Set(['candidato', 'deputado', 'senador', 'servidor_publico'])

      const politicallyConnected = new Set<string>()
      for (const n of graph.nodes) {
        const nt = nodeTypeMap.get(n.id) || ''
        if (nt !== 'fornecedor' && nt !== 'doador') continue
        const adj = adjMap.get(n.id)
        if (!adj) continue
        for (const { target } of adj) {
          if (politicalTypes.has(nodeTypeMap.get(target) || '')) {
            politicallyConnected.add(n.id)
            break
          }
        }
      }

      const clusters = new Map<string, { nodeIds: Set<string>; hasSocio: boolean; hasPoliticallyConnectedSupplierOrDonor: boolean }>()
      for (const n of graph.nodes) {
        const root = find(n.id)
        if (!clusters.has(root)) {
          clusters.set(root, { nodeIds: new Set(), hasSocio: false, hasPoliticallyConnectedSupplierOrDonor: false })
        }
        clusters.get(root)!.nodeIds.add(n.id)
      }

      for (const n of graph.nodes) {
        const root = find(n.id)
        const cluster = clusters.get(root)
        if (!cluster) continue
        const nt = nodeTypeMap.get(n.id) || ''

        if (nt === 'socio') cluster.hasSocio = true

        if ((nt === 'fornecedor' || nt === 'doador') && politicallyConnected.has(n.id)) {
          cluster.hasPoliticallyConnectedSupplierOrDonor = true
        }

        const adj = adjMap.get(n.id)
        if (adj) {
          for (const { type } of adj) {
            if (type === 'socio') cluster.hasSocio = true
          }
        }
      }

      for (const n of graph.nodes) {
        const root = find(n.id)
        const cluster = clusters.get(root)
        if (!cluster) continue

        let isAnomalous = false

        if (cluster.hasSocio && cluster.hasPoliticallyConnectedSupplierOrDonor) {
          isAnomalous = true
        }

        const meta = nodeMetaMap.get(n.id) || {}
        if (meta._tcu_restriction) {
          isAnomalous = true
        }

        if (meta._has_lp_vinculo) {
          isAnomalous = true
        }

        if (isAnomalous) {
          anomalousNids.add(n.id)
        }
      }

      for (const e of graph.edges) {
        if (e.type === 'mesmo_documento' && anomalousNids.has(e.source) && anomalousNids.has(e.target)) {
          anomalousEids.add(e.id)
        }
      }
    }

    dispatch(setAnomalyIds({ nodeIds: [...anomalousNids], edgeIds: [...anomalousEids] }))

    const lpNodeIds = new Set(graph.nodes.filter((n) => n.type === 'ligacao_politica').map((n) => n.id))
    const lpConnected = new Set<string>(lpNodeIds)
    if (lpNodeIds.size > 0) {
      const adjMap = new Map<string, Set<string>>()
      for (const e of graph.edges) {
        if (!adjMap.has(e.source)) adjMap.set(e.source, new Set())
        if (!adjMap.has(e.target)) adjMap.set(e.target, new Set())
        adjMap.get(e.source)!.add(e.target)
        adjMap.get(e.target)!.add(e.source)
      }
      const queue = [...lpNodeIds]
      for (let i = 0; i < queue.length; i++) {
        const neighbors = adjMap.get(queue[i])
        if (neighbors) {
          for (const nb of neighbors) {
            if (!lpConnected.has(nb)) {
              lpConnected.add(nb)
              queue.push(nb)
            }
          }
        }
      }
    }
    dispatch(setLpConnectedIds([...lpConnected]))

    const politicoIds = new Set(graph.nodes.filter((n) => n.type === 'candidato' || n.type === 'deputado' || n.type === 'senador' || n.type === 'servidor_publico').map((n) => n.id))
    const politicallyConnected = new Set<string>()
    if (politicoIds.size > 0) {
      const adjMap2 = new Map<string, Set<string>>()
      for (const e of graph.edges) {
        if (!adjMap2.has(e.source)) adjMap2.set(e.source, new Set())
        if (!adjMap2.has(e.target)) adjMap2.set(e.target, new Set())
        adjMap2.get(e.source)!.add(e.target)
        adjMap2.get(e.target)!.add(e.source)
      }
      for (const pid of politicoIds) {
        const neighbors = adjMap2.get(pid)
        if (neighbors) {
          for (const nb of neighbors) {
            const nbType = graph.nodes.find((n) => n.id === nb)?.type
            if (nbType === 'fornecedor') {
              politicallyConnected.add(nb)
            }
          }
        }
      }
    }
    dispatch(setPoliticallyConnectedIds([...politicallyConnected]))

    dispatch(setGraphData(graph))
  }, [entityDocs, filters, lpEdges, dispatch])

  const lastDocsRef = useRef<string>('')
  const lastFiltersRef = useRef<string>('')
  const lastLpLenRef = useRef(0)

  useEffect(() => {
    const docsKey = entityDocs.map((e) => e.id).join(',')
    const filtersKey = JSON.stringify(filters)
    const lpLen = lpEdges.length
    if (docsKey !== lastDocsRef.current || filtersKey !== lastFiltersRef.current || lpLen !== lastLpLenRef.current) {
      lastDocsRef.current = docsKey
      lastFiltersRef.current = filtersKey
      lastLpLenRef.current = lpLen
      rebuildGraph()
    }
  }, [entityDocs, filters, lpEdges, rebuildGraph])

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

  const handleRemoveBatch = useCallback(
    (batchId: string) => {
      dispatch(removeEntitiesByBatch(batchId))
    },
    [dispatch]
  )

  const handleLigacaoPolitica = useCallback(async () => {
    dispatch(setLpLoading(true))
    dispatch(setLpError(null))
    dispatch(setLpEdges([]))

    const docs = entities
      .filter((e) => e.document && e.document.length >= 3)
      .map((e) => e.document!)

    const uniqueDocs = [...new Set(docs)]

    if (uniqueDocs.length === 0) {
      dispatch(setLpError('Nenhum documento (CPF/CNPJ) disponível no painel.'))
      dispatch(setLpLoading(false))
      return
    }

    const licitacoes = uniqueDocs.map((doc) => ({
      numero_controle_pncp: '',
      cpf_cnpj: doc,
      socios: [] as Array<{ nome: string; documento: string }>,
    }))

    const cached = lpDataCache?.['all']
    if (cached?.data) {
      const { politicalEntities, lpResultEdges, tcuContexts, docLinkedEntities, vinculoEntityIds } = processLpResults(
        cached.data,
        entities.map((e) => ({ id: e.id, document: e.document })),
        entityOrder,
        entitiesRecord as Record<string, { id: string; document?: string } | undefined>
      )

      if (politicalEntities.length > 0) {
        dispatch(addEntities(politicalEntities as any))
      }

      for (const tcu of tcuContexts) {
        dispatch(updateEntityData({ id: tcu.entityId, data: { _tcu_restriction: true }, context: tcu.context }))
      }

      for (const dle of docLinkedEntities) {
        dispatch(updateEntityData({ id: dle.entityId, data: { parent_id: dle.parentId }, context: dle.context }))
      }

      for (const vid of vinculoEntityIds) {
        dispatch(updateEntityData({ id: vid, data: { _has_lp_vinculo: true }, context: 'Ligação Política' }))
      }

      if (lpResultEdges.length > 0) {
        dispatch(setLpEdges(lpResultEdges))
      }

      dispatch(setLpLoading(false))
      return
    }

    try {
      const json = await apiP2.post<any>('/busca/contexto', { licitacoes })

      dispatch(setLpDataCache({
        ...lpDataCache,
        all: { data: json, licitacoes, timestamp: Date.now() },
      }))

      const { politicalEntities, lpResultEdges, tcuContexts, docLinkedEntities, vinculoEntityIds } = processLpResults(
        json,
        entities.map((e) => ({ id: e.id, document: e.document })),
        entityOrder,
        entitiesRecord as Record<string, { id: string; document?: string } | undefined>
      )

      if (politicalEntities.length > 0) {
        dispatch(addEntities(politicalEntities as any))
      }

      for (const tcu of tcuContexts) {
        dispatch(updateEntityData({ id: tcu.entityId, data: { _tcu_restriction: true }, context: tcu.context }))
      }

      for (const dle of docLinkedEntities) {
        dispatch(updateEntityData({ id: dle.entityId, data: { parent_id: dle.parentId }, context: dle.context }))
      }

      for (const vid of vinculoEntityIds) {
        dispatch(updateEntityData({ id: vid, data: { _has_lp_vinculo: true }, context: 'Ligação Política' }))
      }

      if (lpResultEdges.length > 0) {
        dispatch(setLpEdges(lpResultEdges))
      }

      dispatch(setLpLoading(false))
    } catch (err: any) {
      dispatch(setLpError(err.message || 'Erro ao buscar ligações políticas'))
      dispatch(setLpLoading(false))
    }
  }, [entities, entityOrder, entitiesRecord, lpDataCache, dispatch])

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

  const handleInspectClick = useCallback(
    (document: string) => {
      dispatch(setInspectionDoc(document))
      navigate('/ligacao-politica')
    },
    [dispatch, navigate]
  )

  const handleLpNavigate = useCallback(() => {
    dispatch(setSubTabAtiva('geral'))
    dispatch(setAbaAtiva('ligacao-politica'))
    navigate('/ligacao-politica')
  }, [dispatch, navigate])

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '1 1 0', overflow: 'auto' }}>
            <SidebarEntities
              entities={entities}
              discoveries={discoveries}
              selectedNodeId={selectedNodeId}
              anomalousNodeIds={anomalousNodeIds}
              politicallyConnectedNodeIds={politicallyConnectedNodeIds}
              onSelect={handleNodeClick}
              onRemove={(id) => dispatch(removeEntity(id))}
              onAddDiscovery={(did) => dispatch(addDiscoveryToGraph(did))}
              onDismissDiscovery={(did) => dispatch(dismissDiscovery(did))}
              onAddEntityClick={() => setAddDialogOpen(true)}
              onRemoveBatch={handleRemoveBatch}
              onLigacaoPolitica={handleLigacaoPolitica}
              lpLoading={lpLoading}
            />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <SidebarFilters filters={filters} onChange={handleFiltersChange} entities={entities} />
          </div>
          <div style={{ flex: '0 0 auto' }}>
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
        {lpError && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 10,
              padding: '8px 16px',
              background: 'rgba(231, 76, 60, 0.15)',
              border: '1px solid #E74C3C',
              borderRadius: 4,
              color: '#E74C3C',
              fontSize: 12,
              maxWidth: 400,
            }}
          >
            {lpError}
            <button
              style={{
                marginLeft: 8,
                background: 'none',
                border: 'none',
                color: '#E74C3C',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold',
              }}
              onClick={() => dispatch(setLpError(null))}
            >
              ×
            </button>
          </div>
        )}
        <GraphCanvas
          graphData={graphData}
          selectedNodeId={selectedNodeId}
          hoveredNodeId={hoveredNodeId}
          anomalousNodeIds={anomalousNodeIds}
          anomalousEdgeIds={anomalousEdgeIds}
          lpConnectedNodeIds={lpConnectedNodeIds}
          highlightAnomalies={filters.highlightAnomalies}
          showOnlyAnomalies={filters.showOnlyAnomalies}
          showOnlyLp={filters.showOnlyLp}
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
            allNodes={graphData?.nodes ?? []}
            onClose={() => {
              dispatch(selectNode(null))
              setRightPanelOpen(false)
            }}
            onRemove={(id) => dispatch(removeEntity(id))}
            onContractClick={(meta) => setContractPopupMeta(meta)}
            onInspectClick={handleInspectClick}
            onLpNavigate={handleLpNavigate}
            politicallyConnectedNodeIds={politicallyConnectedNodeIds}
          />
        </div>
      </div>

      <AddEntityDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddManual}
      />

      {contractPopupMeta && (
        <ContractDetailPopup
          metadata={contractPopupMeta}
          onClose={() => setContractPopupMeta(null)}
        />
      )}
    </div>
  )
}
