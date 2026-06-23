import type { InvestigationEntity } from '@/entities/investigation'
import type { GraphNode, GraphEdge } from '@/domain'
import { RELATION_META, NODE_COLORS } from '@/domain'

interface NodeDetailPanelProps {
  entity: InvestigationEntity | null
  node: GraphNode | null
  graphEdges: GraphEdge[]
  onClose: () => void
  onRemove: (id: string) => void
}

function fmtDoc(d: string | undefined): string {
  if (!d) return '-'
  const s = d.replace(/\D/g, '')
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return d
}

export default function NodeDetailPanel({
  entity,
  node,
  graphEdges,
  onClose,
  onRemove,
}: NodeDetailPanelProps) {
  if (!entity && !node) {
    return (
      <div style={{ padding: 16, color: '#666', fontSize: 13 }}>
        Selecione um nó para ver detalhes
      </div>
    )
  }

  const connectedEdges = graphEdges.filter(
    (e) => e.source === node?.id || e.target === node?.id
  )

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, color: '#E0E0E0' }}>
          {entity?.label || node?.label || 'Nó'}
        </h3>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={onClose}
          style={{ fontSize: 11, padding: '2px 8px' }}
        >
          ×
        </button>
      </div>

      {node && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            padding: '4px 8px',
            borderRadius: 4,
            background: '#1a1a2e',
            fontSize: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: NODE_COLORS[node.type] || '#666',
            }}
          />
          <span style={{ color: '#AAA' }}>{node.type.replace(/_/g, ' ')}</span>
        </div>
      )}

      {entity?.document && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>Documento</div>
          <div style={{ fontSize: 13, color: '#CCC', fontFamily: 'monospace' }}>
            {fmtDoc(entity.document)}
          </div>
        </div>
      )}

      {entity?.source && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>Fonte</div>
          <div style={{ fontSize: 13, color: '#CCC' }}>{entity.source.toUpperCase()}</div>
        </div>
      )}

      {entity?.addedAt && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>Adicionado em</div>
          <div style={{ fontSize: 12, color: '#AAA' }}>
            {new Date(entity.addedAt).toLocaleString('pt-BR')}
          </div>
        </div>
      )}

      {entity?.context && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>Contexto</div>
          <div style={{ fontSize: 12, color: '#AAA' }}>{entity.context}</div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 6 }}>
          Conexões ({connectedEdges.length})
        </div>
        {connectedEdges.length === 0 && (
          <div style={{ fontSize: 12, color: '#555' }}>Nenhuma conexão</div>
        )}
        {connectedEdges.map((edge) => {
          const meta = RELATION_META[edge.type]
          const otherId = edge.source === node?.id ? edge.target : edge.source
          return (
            <div
              key={edge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 4,
                background: '#1a1a2e',
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: meta?.color || '#666',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: '#CCC' }}>{meta?.label || edge.type}</span>
            </div>
          )
        })}
      </div>

      {entity && (
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => onRemove(entity.id)}
          style={{ fontSize: 11, width: '100%' }}
        >
          Remover do Grafo
        </button>
      )}
    </div>
  )
}
