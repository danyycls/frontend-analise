import { useEffect, useRef, useCallback } from 'react'
import Graph from 'graphology'
import Sigma from 'sigma'
import type { GraphData, GraphNode } from '@/domain'
import { NODE_COLORS, RELATION_META } from '@/domain'

interface GraphCanvasProps {
  graphData: GraphData | null
  selectedNodeId: string | null
  hoveredNodeId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeHover: (nodeId: string | null) => void
  onNodeDoubleClick?: (nodeId: string) => void
}

const NODE_SIZE_BY_TYPE: Record<string, number> = {
  pessoa_fisica: 8,
  empresa: 10,
  orgao_publico: 12,
  candidato: 9,
  deputado: 10,
  senador: 10,
  partido: 11,
  contrato: 6,
  tcu_record: 8,
}

const DIMMED_COLOR = '#555555'
const DIMMED_EDGE_COLOR = '#333333'

export default function GraphCanvas({
  graphData,
  selectedNodeId,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  onNodeDoubleClick,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sigmaRef = useRef<Sigma | null>(null)
  const graphRef = useRef<Graph | null>(null)
  const dataRef = useRef<GraphData | null>(null)

  const highlightNode = useCallback((nodeId: string | null) => {
    const sigma = sigmaRef.current
    const graph = graphRef.current
    if (!sigma || !graph) return

    if (!nodeId) {
      graph.forEachNode((n) => {
        const origColor = graph.getNodeAttribute(n, '_origColor')
        if (origColor) {
          graph.setNodeAttribute(n, 'color', origColor)
        }
        graph.setNodeAttribute(n, 'highlighted', false)
      })
      graph.forEachEdge((e) => {
        const origColor = graph.getEdgeAttribute(e, '_origColor')
        if (origColor) {
          graph.setEdgeAttribute(e, 'color', origColor)
        }
        graph.setEdgeAttribute(e, 'hidden', false)
      })
    } else {
      const neighbors = new Set<string>()
      neighbors.add(nodeId)
      graph.forEachEdge(nodeId, (_edge, _attrs, source, target) => {
        if (source !== nodeId) neighbors.add(source)
        if (target !== nodeId) neighbors.add(target)
      })

      graph.forEachNode((n) => {
        const currentColor = graph.getNodeAttribute(n, 'color')
        graph.setNodeAttribute(n, '_origColor', currentColor)

        if (!neighbors.has(n)) {
          graph.setNodeAttribute(n, 'color', DIMMED_COLOR)
        }
        graph.setNodeAttribute(n, 'highlighted', n === nodeId)
      })

      graph.forEachEdge((e, _attrs, source, target) => {
        const currentColor = graph.getEdgeAttribute(e, 'color')
        graph.setEdgeAttribute(e, '_origColor', currentColor)

        const isHighlighted = source === nodeId || target === nodeId
        graph.setEdgeAttribute(e, 'hidden', !isHighlighted)
        if (!isHighlighted) {
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

    const graph = new Graph({ multi: true, allowSelfLoops: false })
    graphRef.current = graph

    for (const n of graphData.nodes) {
      graph.addNode(n.id, {
        label: n.label,
        nodeType: n.type,
        color: NODE_COLORS[n.type] ?? NODE_COLORS.pessoa_fisica,
        size: NODE_SIZE_BY_TYPE[n.type] ?? 8,
        _origColor: NODE_COLORS[n.type] ?? NODE_COLORS.pessoa_fisica,
        highlighted: false,
        ...n.metadata,
      })
    }

    for (const e of graphData.edges) {
      if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) continue
      const meta = RELATION_META[e.type]
      const edgeColor = meta?.color ?? '#666'
      graph.addEdge(e.source, e.target, {
        label: e.label.slice(0, 40),
        relationType: e.type,
        color: edgeColor,
        _origColor: edgeColor,
        size: meta?.width ?? 2,
        type: meta?.dash ? 'dashed' : 'line',
        weight: e.weight ?? 1,
        hidden: false,
      })
    }

    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelFont: 'monospace',
      labelSize: 12,
      labelColor: { color: '#CCCCCC' },
      defaultEdgeType: 'line',
      labelDensity: 0.2,
      labelGridCellSize: 80,
      labelRenderedSizeThreshold: 8,
      minCameraRatio: 0.005,
      maxCameraRatio: 10,
    })

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
  }, [selectedNodeId, hoveredNodeId, highlightNode])

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
