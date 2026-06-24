import { NODE_COLORS, RELATION_META, ANOMALY_EDGE_COLOR } from '@/domain'

const NODE_LABELS: Array<{ type: string; label: string }> = [
  { type: 'socio', label: 'Sócio' },
  { type: 'fornecedor', label: 'Fornecedor PNCP' },
  { type: 'doador', label: 'Doador' },
  { type: 'empresa', label: 'Empresa' },
  { type: 'candidato', label: 'Candidato' },
  { type: 'deputado', label: 'Deputado' },
  { type: 'senador', label: 'Senador' },
  { type: 'servidor_publico', label: 'Servidor Público' },
  { type: 'orgao_publico', label: 'Órgão Público' },
  { type: 'pessoa_fisica', label: 'Pessoa Física' },
  { type: 'contrato', label: 'Contrato' },
  { type: 'consulta', label: 'Consulta' },
  { type: 'ligacao_politica', label: 'Ligação Política' },
]

const REL_LABELS: Array<{ type: string; label: string; color: string }> = [
  { type: 'socio', label: 'Sócio', color: RELATION_META.socio.color },
  { type: 'doacao_campanha', label: 'Doação Campanha', color: RELATION_META.doacao_campanha.color },
  { type: 'tcu_irregular', label: 'TCU Irregular', color: RELATION_META.tcu_irregular.color },
  { type: 'mesmo_partido', label: 'Mesmo Partido', color: RELATION_META.mesmo_partido.color },
  { type: 'pertence', label: 'Pertence', color: RELATION_META.pertence.color },
]

export default function GraphLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 50,
        left: 10,
        background: 'rgba(13, 13, 26, 0.9)',
        border: '1px solid #2a2a3e',
        borderRadius: 6,
        padding: '10px 12px',
        fontSize: 10,
        color: '#AAA',
        maxHeight: 'calc(100% - 120px)',
        overflowY: 'auto',
        zIndex: 5,
        minWidth: 200,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#CCC', fontSize: 11 }}>
        LEGENDA
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ color: '#888', marginBottom: 3, fontSize: 9 }}>NÓS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
          {NODE_LABELS.map(({ type, label }) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: NODE_COLORS[type] || '#666',
                  flexShrink: 0,
                }}
              />
              <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ color: '#888', marginBottom: 3, fontSize: 9 }}>ARESTAS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
          {REL_LABELS.map(({ type, label, color }) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 12,
                  height: 2,
                  backgroundColor: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 12,
                height: 3,
                backgroundColor: ANOMALY_EDGE_COLOR,
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: 'nowrap', color: ANOMALY_EDGE_COLOR }}>ANOMALIA</span>
          </div>
        </div>
      </div>
    </div>
  )
}
