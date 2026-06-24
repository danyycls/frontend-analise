import { useState, useCallback } from 'react'
import type { NodeType } from '@/domain'

interface AddEntityDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (entity: {
    type: NodeType
    label: string
    document?: string
    source: 'manual'
    context?: string
  }) => void
}

const TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
  { value: 'orgao_publico', label: 'Órgão Público' },
  { value: 'candidato', label: 'Candidato' },
  { value: 'deputado', label: 'Deputado' },
  { value: 'senador', label: 'Senador' },
  { value: 'servidor_publico', label: 'Servidor Público' },
  { value: 'fornecedor', label: 'Fornecedor PNCP' },
  { value: 'doador', label: 'Doador' },
  { value: 'socio', label: 'Sócio' },
  { value: 'consulta', label: 'Consulta/Licitação' },
  { value: 'ligacao_politica', label: 'Ligação Política' },
  { value: 'contrato', label: 'Contrato' },
]

export default function AddEntityDialog({
  isOpen,
  onClose,
  onAdd,
}: AddEntityDialogProps) {
  const [type, setType] = useState<NodeType>('empresa')
  const [label, setLabel] = useState('')
  const [document, setDocument] = useState('')
  const [context, setContext] = useState('')

  const handleAdd = useCallback(() => {
    if (!label.trim()) return
    onAdd({
      type,
      label: label.trim(),
      document: document.trim() || undefined,
      source: 'manual',
      context: context.trim() || undefined,
    })
    setLabel('')
    setDocument('')
    setContext('')
    onClose()
  }, [type, label, document, context, onAdd, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
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
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#1a1a2e',
          border: '1px solid #2a2a4e',
          borderRadius: 8,
          padding: 20,
          width: 380,
          maxWidth: '90vw',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: 14, color: '#CCC' }}>
          Adicionar Entidade Manual
        </h3>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>Tipo</div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NodeType)}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0d0d1a',
              border: '1px solid #2a2a4e',
              borderRadius: 4,
              color: '#CCC',
              fontSize: 13,
            }}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>Nome / Rótulo</div>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: ACME Ltda"
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0d0d1a',
              border: '1px solid #2a2a4e',
              borderRadius: 4,
              color: '#CCC',
              fontSize: 13,
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>
            CNPJ/CPF (opcional)
          </div>
          <input
            type="text"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder="XX.XXX.XXX/XXXX-XX"
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0d0d1a',
              border: '1px solid #2a2a4e',
              borderRadius: 4,
              color: '#CCC',
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>
            Contexto (opcional)
          </div>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ex: Investigação SP"
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#0d0d1a',
              border: '1px solid #2a2a4e',
              borderRadius: 4,
              color: '#CCC',
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm btn-outline-danger" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-sm"
            onClick={handleAdd}
            disabled={!label.trim()}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
