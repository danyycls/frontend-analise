import { useMemo } from 'react'
import type { InvestigationFilters, InvestigationEntity } from '@/entities/investigation'
import type { NodeType, RelationType } from '@/domain'

interface SidebarFiltersProps {
  filters: InvestigationFilters
  onChange: (filters: Partial<InvestigationFilters>) => void
  entities: InvestigationEntity[]
}

const NODE_TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'orgao_publico', label: 'Órgão Público' },
  { value: 'candidato', label: 'Candidato' },
  { value: 'deputado', label: 'Deputado' },
  { value: 'senador', label: 'Senador' },
  { value: 'servidor_publico', label: 'Servidor Público' },
  { value: 'fornecedor', label: 'Fornecedor PNCP' },
  { value: 'doador', label: 'Doador' },
  { value: 'socio', label: 'Sócio' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'ligacao_politica', label: 'Ligação Política' },
  { value: 'contrato', label: 'Contrato' },
]

const RELATION_TYPE_OPTIONS: { value: RelationType; label: string }[] = [
  { value: 'mesmo_documento', label: 'Mesmo Doc' },
  { value: 'socio', label: 'Sócio' },
  { value: 'doacao_campanha', label: 'Doação' },
  { value: 'despesa_cota', label: 'Despesa' },
  { value: 'tcu_irregular', label: 'TCU' },
  { value: 'mesmo_partido', label: 'Partido' },
]

function toggleItem<T>(arr: T[], item: T): T[] {
  if (arr.includes(item)) return arr.filter((x) => x !== item)
  return [...arr, item]
}

export default function SidebarFilters({ filters, onChange, entities }: SidebarFiltersProps) {
  const contextOptions = useMemo(() => {
    const unique = new Set<string>()
    entities.forEach((e) => {
      if (e.context) unique.add(e.context)
    })
    return [...unique].sort()
  }, [entities])

  return (
    <div style={{ padding: 12, borderTop: '1px solid #2a2a3e' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#AAA' }}>FILTROS</span>

      <div style={{ marginTop: 12 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 12,
            color: '#CCC',
          }}
        >
          <input
            type="checkbox"
            checked={filters.highlightAnomalies}
            onChange={(e) => onChange({ highlightAnomalies: e.target.checked })}
            style={{ accentColor: '#E74C3C', cursor: 'pointer' }}
          />
          Destacar anomalias
        </label>
        <div style={{ fontSize: 10, color: '#666', marginTop: 2, marginLeft: 24 }}>
          Arestas em vermelho grosso, nós maiores
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 12,
            color: '#CCC',
          }}
        >
          <input
            type="checkbox"
            checked={filters.showOnlyAnomalies}
            onChange={(e) => onChange({ showOnlyAnomalies: e.target.checked })}
            style={{ accentColor: '#E74C3C', cursor: 'pointer' }}
          />
          Mostrar apenas anomalias
        </label>
        <div style={{ fontSize: 10, color: '#666', marginTop: 2, marginLeft: 24 }}>
          Oculta nós e arestas não anômalos
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 12,
            color: '#CCC',
          }}
        >
          <input
            type="checkbox"
            checked={filters.showOnlyLp}
            onChange={(e) => onChange({ showOnlyLp: e.target.checked })}
            style={{ accentColor: '#1ABC9C', cursor: 'pointer' }}
          />
          Somente Ligação Política
        </label>
        <div style={{ fontSize: 10, color: '#666', marginTop: 2, marginLeft: 24 }}>
          Oculta nós sem vínculos políticos
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>Tipos de Nó</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {NODE_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="btn btn-sm"
              onClick={() =>
                onChange({ nodeTypes: toggleItem(filters.nodeTypes, opt.value) })
              }
              style={{
                fontSize: 10,
                padding: '2px 6px',
                opacity: filters.nodeTypes.length === 0 || filters.nodeTypes.includes(opt.value) ? 1 : 0.4,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>Tipos de Relação</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {RELATION_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="btn btn-sm"
              onClick={() =>
                onChange({
                  relationTypes: toggleItem(filters.relationTypes, opt.value),
                })
              }
              style={{
                fontSize: 10,
                padding: '2px 6px',
                opacity:
                  filters.relationTypes.length === 0 ||
                  filters.relationTypes.includes(opt.value)
                    ? 1
                    : 0.4,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {contextOptions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>Contexto</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {contextOptions.map((ctx) => (
              <button
                key={ctx}
                className="btn btn-sm"
                onClick={() =>
                  onChange({ contexts: toggleItem(filters.contexts, ctx) })
                }
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  opacity:
                    filters.contexts.length === 0 ||
                    filters.contexts.includes(ctx)
                      ? 1
                      : 0.4,
                }}
              >
                {ctx}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
