import type { InvestigationFilters } from '@/entities/investigation'
import type { NodeType, RelationType } from '@/domain'

interface SidebarFiltersProps {
  filters: InvestigationFilters
  onChange: (filters: Partial<InvestigationFilters>) => void
}

const NODE_TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'orgao_publico', label: 'Órgão Público' },
  { value: 'candidato', label: 'Candidato' },
  { value: 'deputado', label: 'Deputado' },
  { value: 'senador', label: 'Senador' },
  { value: 'partido', label: 'Partido' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'tcu_record', label: 'TCU' },
]

const SOURCE_OPTIONS = [
  { value: 'tse', label: 'TSE' },
  { value: 'portal', label: 'Portal Transp.' },
  { value: 'pncp', label: 'PNCP' },
  { value: 'camara', label: 'Câmara' },
  { value: 'senado', label: 'Senado' },
  { value: 'tcu', label: 'TCU' },
  { value: 'manual', label: 'Manual' },
]

const RELATION_TYPE_OPTIONS: { value: RelationType; label: string }[] = [
  { value: 'mesmo_documento', label: 'Mesmo Doc' },
  { value: 'socio', label: 'Sócio' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'doacao_campanha', label: 'Doação' },
  { value: 'despesa_cota', label: 'Despesa' },
  { value: 'tcu_irregular', label: 'TCU' },
  { value: 'mesmo_partido', label: 'Partido' },
  { value: 'nome_similar', label: 'Nome' },
]

function toggleItem<T>(arr: T[], item: T): T[] {
  if (arr.includes(item)) return arr.filter((x) => x !== item)
  return [...arr, item]
}

export default function SidebarFilters({ filters, onChange }: SidebarFiltersProps) {
  return (
    <div style={{ padding: 12, height: '100%', overflowY: 'auto', borderTop: '1px solid #2a2a3e' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#AAA' }}>FILTROS</span>

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
        <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>Fontes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="btn btn-sm"
              onClick={() =>
                onChange({ sources: toggleItem(filters.sources, opt.value) })
              }
              style={{
                fontSize: 10,
                padding: '2px 6px',
                opacity: filters.sources.length === 0 || filters.sources.includes(opt.value) ? 1 : 0.4,
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

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>
          Confiança mínima: {filters.minWeight.toFixed(2)}
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={filters.minWeight}
          onChange={(e) => onChange({ minWeight: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
