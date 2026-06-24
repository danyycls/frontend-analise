import { useMemo } from 'react'
import type { InvestigationEntity, InvestigationFilters } from '@/entities/investigation'
import type { NodeType, RelationType } from '@/domain'
import type { DiscoveredEntity } from '@/shared/lib/entity-discovery'

interface BatchInfo {
  batchId: string
  batchLabel: string
  count: number
}

interface SidebarEntitiesProps {
  entities: InvestigationEntity[]
  discoveries: DiscoveredEntity[]
  selectedNodeId: string | null
  anomalousNodeIds: string[]
  politicallyConnectedNodeIds: string[]
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onAddDiscovery: (discoveryId: string) => void
  onDismissDiscovery: (discoveryId: string) => void
  onAddEntityClick: () => void
  onRemoveBatch?: (batchId: string) => void
  onLigacaoPolitica?: () => void
  lpLoading?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  pessoa_fisica: 'PF',
  empresa: 'PJ',
  orgao_publico: 'ORG',
  candidato: 'CAND',
  deputado: 'DEP',
  senador: 'SEN',
  servidor_publico: 'SERV',
  contrato: 'CTR',
  fornecedor: 'FPNCP',
  doador: 'DOA',
  socio: 'SOC',
  consulta: 'CONS',
  ligacao_politica: 'LP',
}

const TYPE_COLORS: Record<string, string> = {
  pessoa_fisica: '#4A90D9',
  empresa: '#27AE60',
  orgao_publico: '#E67E22',
  candidato: '#8E44AD',
  deputado: '#E91E63',
  senador: '#C2185B',
  servidor_publico: '#7D3C98',
  contrato: '#7F8C8D',
  fornecedor: '#F39C12',
  doador: '#D35400',
  socio: '#3498DB',
  consulta: '#95A5A6',
  ligacao_politica: '#1ABC9C',
}

export default function SidebarEntities({
  entities,
  discoveries,
  selectedNodeId,
  anomalousNodeIds,
  politicallyConnectedNodeIds,
  onSelect,
  onRemove,
  onAddDiscovery,
  onDismissDiscovery,
  onAddEntityClick,
  onRemoveBatch,
  onLigacaoPolitica,
  lpLoading,
}: SidebarEntitiesProps) {
  const anomalousSet = useMemo(() => new Set(anomalousNodeIds), [anomalousNodeIds])
  const politicallyConnectedSet = useMemo(() => new Set(politicallyConnectedNodeIds), [politicallyConnectedNodeIds])

  const visibleEntities = useMemo(
    () => entities.filter((e) => e.type === 'consulta' || e.type === 'ligacao_politica' || anomalousSet.has(e.id)),
    [entities, anomalousSet]
  )

  const batches = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>()
    entities.forEach((e) => {
      if (e.batchId && e.batchLabel) {
        const existing = map.get(e.batchId)
        if (existing) {
          existing.count++
        } else {
          map.set(e.batchId, { label: e.batchLabel, count: 1 })
        }
      }
    })
    return Array.from(map.entries()).map(([batchId, info]) => ({
      batchId,
      batchLabel: info.label,
      count: info.count,
    }))
  }, [entities])

  const hasDocuments = useMemo(() => {
    return entities.some((e) => e.document && e.document.length >= 3)
  }, [entities])

  return (
    <div style={{ padding: 12, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#AAA' }}>
          ENTIDADES ({visibleEntities.length})
        </span>
        <button
          className="btn btn-sm"
          onClick={onAddEntityClick}
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          + Adicionar
        </button>
      </div>

      {visibleEntities.length === 0 && (
        <div style={{ fontSize: 12, color: '#555', padding: '8px 0' }}>
          Nenhuma entidade no grafo
        </div>
      )}

      {visibleEntities.map((entity) => (
        <div
          key={entity.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            marginBottom: 4,
            borderRadius: 4,
            background: selectedNodeId === entity.id ? '#2a2a4e' : '#1a1a2e',
            cursor: 'pointer',
            border: selectedNodeId === entity.id ? '1px solid #4A90D9' : '1px solid transparent',
          }}
          onClick={() => onSelect(entity.id)}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: TYPE_COLORS[entity.type] || '#666',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: 12, color: '#CCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={entity.label}
            >
              {entity.label}
            </div>
            <div style={{ fontSize: 10, color: '#666' }}>
              {TYPE_LABELS[entity.type] || entity.type} · {entity.source.toUpperCase()}
              {entity.type === 'fornecedor' && politicallyConnectedSet.has(entity.id) && (
                <span style={{ color: '#1ABC9C', marginLeft: 4 }}>· Prest. Serv. Político</span>
              )}
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(entity.id)
            }}
            style={{ fontSize: 10, padding: '1px 5px' }}
          >
            ×
          </button>
        </div>
      ))}

      {batches.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#AAA', marginTop: 16, marginBottom: 8 }}>
            CONSULTAS ADICIONADAS ({batches.length})
          </div>
          {batches.map((batch) => (
            <div
              key={batch.batchId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 4,
                background: '#1a1a2e',
                border: '1px solid #2a2a4e',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 12, color: '#CCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={batch.batchLabel}
                >
                  {batch.batchLabel}
                </div>
                <div style={{ fontSize: 10, color: '#666' }}>
                  {batch.count} entidade{batch.count !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onRemoveBatch?.(batch.batchId)}
                style={{ fontSize: 10, padding: '2px 6px' }}
                title="Remover consulta do painel"
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}

      {discoveries.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#AAA', marginTop: 16, marginBottom: 8 }}>
            DESCOBERTAS ({discoveries.length})
          </div>
          {discoveries.map((d) => (
            <div
              key={`${d.id}_${d.source}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 4,
                background: '#1a1a2e',
                border: '1px solid #2a2a4e',
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  backgroundColor: TYPE_COLORS[d.type] || '#666',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 12, color: '#CCC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={d.label}
                >
                  {d.label}
                </div>
                <div style={{ fontSize: 10, color: '#666' }}>
                  {TYPE_LABELS[d.type] || d.type} · {d.source.toUpperCase()}
                  {d.context && ` · ${d.context}`}
                </div>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => onAddDiscovery(d.id)}
                style={{ fontSize: 10, padding: '2px 6px' }}
                title="Adicionar ao grafo"
              >
                +
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onDismissDiscovery(d.id)}
                style={{ fontSize: 10, padding: '2px 4px' }}
                title="Ignorar"
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}

      {entities.length > 0 && hasDocuments && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #2a2a3e' }}>
          <button
            className="btn btn-accent"
            onClick={onLigacaoPolitica}
            disabled={lpLoading}
            style={{ width: '100%', fontSize: 12, padding: '8px 12px' }}
          >
            {lpLoading ? 'Analisando...' : 'Ligação Política'}
          </button>
          {lpLoading && (
            <div style={{ textAlign: 'center', padding: 8, color: '#888', fontSize: 11 }}>
              Consultando vínculos políticos...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
