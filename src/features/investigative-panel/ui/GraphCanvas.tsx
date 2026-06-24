import { useEffect, useRef, useCallback } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import type { GraphData, GraphNode } from '@/domain'
import { NODE_COLORS, RELATION_META, ANOMALY_EDGE_COLOR } from '@/domain'
import GraphLegend from './GraphLegend'

interface GraphCanvasProps {
  graphData: GraphData | null
  selectedNodeId: string | null
  hoveredNodeId: string | null
  anomalousNodeIds: string[]
  anomalousEdgeIds: string[]
  lpConnectedNodeIds: string[]
  highlightAnomalies: boolean
  showOnlyAnomalies: boolean
  showOnlyLp: boolean
  onNodeClick: (nodeId: string) => void
  onNodeHover: (nodeId: string | null) => void
  onNodeDoubleClick?: (nodeId: string) => void
}

const NODE_SIZE_BY_TYPE: Record<string, number> = {
  pessoa_fisica: 6,
  empresa: 8,
  orgao_publico: 10,
  candidato: 7,
  deputado: 8,
  senador: 8,
  contrato: 5,
  servidor_publico: 8,
  fornecedor: 8,
  doador: 6,
  socio: 6,
  consulta: 11,
  ligacao_politica: 11,
}

const DIMMED_COLOR = '#555555'
const DIMMED_EDGE_COLOR = '#333333'

export default function GraphCanvas({
  graphData,
  selectedNodeId,
  hoveredNodeId,
  anomalousNodeIds,
  anomalousEdgeIds,
  lpConnectedNodeIds,
  highlightAnomalies,
  showOnlyAnomalies,
  showOnlyLp,
  onNodeClick,
  onNodeHover,
  onNodeDoubleClick,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const dataRef = useRef<GraphData | null>(null)
  const showOnlyAnomaliesRef = useRef(showOnlyAnomalies)
  showOnlyAnomaliesRef.current = showOnlyAnomalies
  const showOnlyLpRef = useRef(showOnlyLp)
  showOnlyLpRef.current = showOnlyLp
  const lpConnectedRef = useRef(lpConnectedNodeIds)
  lpConnectedRef.current = lpConnectedNodeIds
  const highlightAnomaliesRef = useRef(highlightAnomalies)
  highlightAnomaliesRef.current = highlightAnomalies
  const anomalousNodeIdsRef = useRef(anomalousNodeIds)
  anomalousNodeIdsRef.current = anomalousNodeIds
  const anomalousEdgeIdsRef = useRef(anomalousEdgeIds)
  anomalousEdgeIdsRef.current = anomalousEdgeIds

  const highlightNode = useCallback((nodeId: string | null) => {
    const sigma = sigmaRef.current
    const graph = graphRef.current
    if (!sigma || !graph) return

    const onlyAnomalies = showOnlyAnomaliesRef.current
    const onlyLp = showOnlyLpRef.current
    const lpSet = new Set(lpConnectedRef.current)

    if (!nodeId) {
      graph.forEachNode((n) => {
        if (!graph.getNodeAttribute(n, 'isOrphan')) {
          const origColor = graph.getNodeAttribute(n, '_origColor')
          if (origColor) {
            graph.setNodeAttribute(n, 'color', origColor)
          }
          const origSize = graph.getNodeAttribute(n, '_origSize')
          if (origSize) {
            graph.setNodeAttribute(n, 'size', origSize)
          }
        }
        graph.setNodeAttribute(n, 'highlighted', false)
        if (onlyAnomalies) {
          graph.setNodeAttribute(n, 'hidden', !graph.getNodeAttribute(n, 'isAnomalous'))
        } else if (onlyLp) {
          graph.setNodeAttribute(n, 'hidden', !lpSet.has(n))
        } else {
          graph.setNodeAttribute(n, 'hidden', false)
        }
      })
      graph.forEachEdge((e) => {
        const origColor = graph.getEdgeAttribute(e, '_origColor')
        const origSize = graph.getEdgeAttribute(e, '_origSize')
        if (origColor) {
          graph.setEdgeAttribute(e, 'color', origColor)
        }
        if (origSize) {
          graph.setEdgeAttribute(e, 'size', origSize)
        }
        if (onlyAnomalies) {
          graph.setEdgeAttribute(e, 'hidden', !graph.getEdgeAttribute(e, 'isAnomalous'))
        } else if (onlyLp) {
          const source = graph.source(e)
          const target = graph.target(e)
          graph.setEdgeAttribute(e, 'hidden', !lpSet.has(source) && !lpSet.has(target))
        } else {
          graph.setEdgeAttribute(e, 'hidden', false)
        }
      })

      const hlAnomalies = highlightAnomaliesRef.current
      if (hlAnomalies) {
        const anomNodeSet = new Set(anomalousNodeIdsRef.current)
        const anomEdgeSet = new Set(anomalousEdgeIdsRef.current)
        graph.forEachNode((n) => {
          if (anomNodeSet.has(n)) {
            const nodeType = graph.getNodeAttribute(n, 'nodeType')
            const baseSize = NODE_SIZE_BY_TYPE[nodeType] ?? 8
            graph.setNodeAttribute(n, 'size', baseSize * 1.5)
          }
        })
        graph.forEachEdge((e) => {
          if (anomEdgeSet.has(e)) {
            graph.setEdgeAttribute(e, 'color', ANOMALY_EDGE_COLOR)
            graph.setEdgeAttribute(e, 'size', 5)
          }
        })
      }
    } else {
      const neighbors = new Set<string>()
      neighbors.add(nodeId)
      graph.forEachEdge(nodeId, (_edge, _attrs, source, target) => {
        if (source !== nodeId) neighbors.add(source)
        if (target !== nodeId) neighbors.add(target)
      })

      graph.forEachNode((n) => {
        const isAnomalous = graph.getNodeAttribute(n, 'isAnomalous')
        const isOrphan = graph.getNodeAttribute(n, 'isOrphan')
        if (!isOrphan) {
          const currentColor = graph.getNodeAttribute(n, 'color')
          graph.setNodeAttribute(n, '_origColor', currentColor)
        }

        if (neighbors.has(n) || (onlyAnomalies && isAnomalous)) {
          graph.setNodeAttribute(n, 'hidden', false)
        } else {
          if (!isOrphan) {
            graph.setNodeAttribute(n, 'color', DIMMED_COLOR)
          }
          graph.setNodeAttribute(n, 'hidden', onlyAnomalies || (onlyLp && !lpSet.has(n)))
        }
        graph.setNodeAttribute(n, 'highlighted', n === nodeId)
      })

      graph.forEachEdge((e, _attrs, source, target) => {
        const isEdgeAnomalous = graph.getEdgeAttribute(e, 'isAnomalous')
        const currentColor = graph.getEdgeAttribute(e, 'color')
        graph.setEdgeAttribute(e, '_origColor', currentColor)

        const isHighlighted = source === nodeId || target === nodeId
        const visible = isHighlighted || (onlyAnomalies && isEdgeAnomalous)
        graph.setEdgeAttribute(e, 'hidden', !visible)
        if (!visible) {
          graph.setEdgeAttribute(e, 'color', DIMMED_EDGE_COLOR)
        }
      })
    }

    sigma.refresh()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    if (!graphData || graphData.nodes.length === 0) {
      if (sigmaRef.current) {
        sigmaRef.current.kill()
        sigmaRef.current = null
      }
      graphRef.current = null
      return
    }

    dataRef.current = graphData

    if (sigmaRef.current) {
      sigmaRef.current.kill()
      sigmaRef.current = null
    }
    graphRef.current = null

    const anomalousNodeSet = new Set(anomalousNodeIds)
    const anomalousEdgeSet = new Set(anomalousEdgeIds)
    const lpNodeSet = new Set(lpConnectedNodeIds)
    const graph = new Graph({ multi: true, allowSelfLoops: false })
    graphRef.current = graph

    for (const n of graphData.nodes) {
      const isAnomalous = highlightAnomalies && anomalousNodeSet.has(n.id)
      const isLpNode = showOnlyLp && lpNodeSet.has(n.id)
      const baseSize = NODE_SIZE_BY_TYPE[n.type] ?? 8
      const nodeSize = isAnomalous ? baseSize * 1.5 : (isLpNode ? baseSize * 1.25 : baseSize)
      graph.addNode(n.id, {
        label: n.label,
        nodeType: n.type,
        color: NODE_COLORS[n.type] ?? NODE_COLORS.pessoa_fisica,
        size: nodeSize,
        _origColor: NODE_COLORS[n.type] ?? NODE_COLORS.pessoa_fisica,
        _origSize: nodeSize,
        isAnomalous,
        isLpNode,
        highlighted: false,
        ...n.metadata,
      })
    }

    for (const e of graphData.edges) {
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) continue
      if (e.source === e.target) continue
      const meta = RELATION_META[e.type]
      const isEdgeAnomalous = highlightAnomalies && anomalousEdgeSet.has(e.id)
      const edgeColor = isEdgeAnomalous ? ANOMALY_EDGE_COLOR : (meta?.color ?? '#666')
      const edgeWidth = isEdgeAnomalous ? 5 : (meta?.width ?? 2)
      graph.addEdge(e.source, e.target, {
        label: e.label.slice(0, 40),
        relationType: e.type,
        color: edgeColor,
        _origColor: edgeColor,
        size: edgeWidth,
        _origSize: edgeWidth,
        type: 'line',
        weight: e.weight ?? 1,
        hidden: false,
        isAnomalous: isEdgeAnomalous,
      })
    }

    graph.forEachNode((node) => {
      if (graph.degree(node) === 0) {
        graph.setNodeAttribute(node, 'color', DIMMED_COLOR)
        graph.setNodeAttribute(node, '_origColor', DIMMED_COLOR)
        graph.setNodeAttribute(node, 'isOrphan', true)
      } else {
        graph.setNodeAttribute(node, 'isOrphan', false)
      }
    })

    graph.forEachNode((node) => {
      if (!graph.hasNodeAttribute(node, 'x')) {
        graph.setNodeAttribute(node, 'x', Math.random() * 400)
      }
      if (!graph.hasNodeAttribute(node, 'y')) {
        graph.setNodeAttribute(node, 'y', Math.random() * 400)
      }
    })

    if (graphData.edges.length > 0) {
      try {
        forceAtlas2.assign(graph, {
          iterations: 100,
          settings: { gravity: 0.3, scalingRatio: 15 },
        })
      } catch (_) { /* fallback to random */ }
    }

    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelFont: 'monospace',
      labelSize: 12,
      labelColor: { color: '#CCCCCC' },
      defaultEdgeType: 'line',
      allowInvalidContainer: true,
      labelDensity: 0.5,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 3,
      minCameraRatio: 0.005,
      maxCameraRatio: 10,
      nodeReducer: (_node, data) => {
        const cam = sigmaRef.current?.getCamera()
        if (!cam) return data
        const ratio = Math.max(cam.ratio, 0.05)
        const zoomBoost = Math.min(3, 2 / ratio)
        return { ...data, size: data.size * Math.max(0.7, zoomBoost) }
      },
      edgeReducer: (_edge, data) => {
        const cam = sigmaRef.current?.getCamera()
        if (!cam) return data
        const ratio = Math.max(cam.ratio, 0.05)
        const edgeBoost = Math.min(2, 1.5 / ratio)
        return { ...data, size: data.size * Math.max(0.5, edgeBoost) }
      },
    })

    sigma.getCamera().animatedReset({ duration: 0 })

    sigma.on('clickNode', ({ node }) => {
      onNodeClick(node)
    })

    sigma.on('doubleClickNode', ({ node }) => {
      onNodeDoubleClick?.(node)
    })

    sigma.on('enterNode', ({ node }) => {
      onNodeHover(node)
    })

    sigma.on('leaveNode', () => {
      onNodeHover(null)
    })

    sigma.on('clickStage', () => {
      onNodeClick('')
    })

    sigmaRef.current = sigma

    return () => {
      sigma.kill()
      sigmaRef.current = null
      graphRef.current = null
    }
  }, [graphData])

  useEffect(() => {
    if (!sigmaRef.current || !graphRef.current) return

    const focusId = hoveredNodeId || selectedNodeId
    highlightNode(focusId || null)
  }, [selectedNodeId, hoveredNodeId, highlightNode, showOnlyAnomalies, showOnlyLp])

  const handleZoomIn = useCallback(() => {
    sigmaRef.current?.getCamera().animatedZoom({ duration: 300 })
  }, [])

  const handleZoomOut = useCallback(() => {
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 300 })
  }, [])

  const handleFit = useCallback(() => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 600 })
  }, [])

  const nodeCount = graphData?.nodes.length ?? 0
  const edgeCount = graphData?.edges.length ?? 0

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {graphData && graphData.nodes.length > 0 && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: '#888',
            }}
          >
            <span>{nodeCount} nós</span>
            <span>·</span>
            <span>{edgeCount} arestas</span>
          </div>
          <GraphLegend />
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              gap: 8,
            }}
          >
            <button className="btn btn-sm" onClick={handleZoomIn} title="Zoom In">+</button>
            <button className="btn btn-sm" onClick={handleZoomOut} title="Zoom Out">-</button>
            <button className="btn btn-sm" onClick={handleFit} title="Ajustar">⊡</button>
          </div>
        </>
      )}
      {(!graphData || graphData.nodes.length === 0) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: 14,
          }}
        >
          Adicione entidades ao grafo para visualizar conexões
        </div>
      )}
    </div>
  )
}
