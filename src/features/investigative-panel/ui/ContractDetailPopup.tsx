function fmtValor(v: unknown): string {
  if (v == null) return '-'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDoc(d: string | undefined): string {
  if (!d) return '-'
  const s = d.replace(/\D/g, '')
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return d
}

interface ContractDetailPopupProps {
  metadata: Record<string, unknown>
  onClose: () => void
}

export default function ContractDetailPopup({ metadata, onClose }: ContractDetailPopupProps) {
  const pncp = String(metadata.contrato_pncp || '-')
  const objeto = String(metadata.contrato_objeto || '-')
  const valor = fmtValor(metadata.contrato_valor)
  const orgao = String(metadata.orgao_label || '-')
  const fornecedor = String(metadata.fornecedor_label || '-')

  const fields: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'PNCP', value: pncp, mono: true },
    { label: 'Órgão', value: orgao },
    { label: 'Fornecedor PNCP', value: fornecedor },
    { label: 'Objeto', value: objeto },
    { label: 'Valor', value: valor },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#1a1a2e',
          border: '1px solid #2a2a4e',
          borderRadius: 8,
          padding: 20,
          width: 420,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: '#CCC' }}>
            Detalhes do Contrato
          </h3>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={onClose}
            style={{ fontSize: 11, padding: '2px 8px' }}
          >
            ×
          </button>
        </div>

        {fields.map(({ label, value, mono }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>{label}</div>
            <div
              style={{
                fontSize: 13,
                color: '#CCC',
                fontFamily: mono ? 'monospace' : undefined,
                wordBreak: 'break-word',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
