import { useCallback } from 'react'
import type { InvestigationEntity, InvestigationFilters } from '@/entities/investigation'
import type { NodeType, RelationType } from '@/domain'
import type { DiscoveredEntity } from '@/shared/lib/entity-discovery'

interface SidebarEntitiesProps {
  entities: InvestigationEntity[]
  discoveries: DiscoveredEntity[]
  selectedNodeId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onAddDiscovery: (discoveryId: string) => void
  onDismissDiscovery: (discoveryId: string) => void
  onAddEntityClick: () => void
}

const TYPE_LABELS: Record<string, string> = {
  pessoa_fisica: 'PF',
  empresa: 'PJ',
  orgao_publico: 'ORG',
  candidato: 'CAND',
  deputado: 'DEP',
  senador: 'SEN',
  partido: 'PART',
  contrato: 'CTR',
  tcu_record: 'TCU',
}

const TYPE_COLORS: Record<string, string> = {
  pessoa_fisica: '#4A90D9',
  empresa: '#27AE60',
  orgao_publico: '#E67E22',
  candidato: '#8E44AD',
  deputado: '#E91E63',
  senador: '#C2185B',
  partido: '#F1C40F',
  contrato: '#7F8C8D',
  tcu_record: '#E74C3C',
}

export default function SidebarEntities({
  entities,
  discoveries,
  selectedNodeId,
  onSelect,
  onRemove,
  onAddDiscovery,
  onDismissDiscovery,
  onAddEntityClick,
}: SidebarEntitiesProps) {
  return (
    <div style={{ padding: 12, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#AAA' }}>
          ENTIDADES ({entities.length})
        </span>
        <button
          className="btn btn-sm"
          onClick={onAddEntityClick}
          style={{ fontSize: 11, padding: '4px 10px' }}
        >
          + Adicionar
        </button>
      </div>

      {entities.length === 0 && (
        <div style={{ fontSize: 12, color: '#555', padding: '8px 0' }}>
          Nenhuma entidade no grafo
        </div>
      )}

      {entities.map((entity) => (
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
    </div>
  )
}
