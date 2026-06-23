import type { InvestigationSnapshot } from '@/entities/investigation'

interface SidebarHistoryProps {
  snapshots: InvestigationSnapshot[]
  currentIndex: number
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: (name: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

export default function SidebarHistory({
  snapshots,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onRestore,
  onDelete,
}: SidebarHistoryProps) {
  const handleSave = () => {
    const name = prompt('Nome do snapshot:')
    if (name) onSave(name)
  }

  return (
    <div
      style={{
        padding: 12,
        height: '100%',
        overflowY: 'auto',
        borderTop: '1px solid #2a2a3e',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: '#AAA' }}>
        HISTÓRICO
      </span>

      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <button
          className="btn btn-sm"
          onClick={onUndo}
          disabled={!canUndo}
          style={{ fontSize: 10, padding: '3px 8px', flex: 1 }}
        >
          ◄ Undo
        </button>
        <button
          className="btn btn-sm"
          onClick={onRedo}
          disabled={!canRedo}
          style={{ fontSize: 10, padding: '3px 8px', flex: 1 }}
        >
          Redo ►
        </button>
        <button
          className="btn btn-sm"
          onClick={handleSave}
          style={{ fontSize: 10, padding: '3px 8px', flex: 1 }}
        >
          Salvar
        </button>
      </div>

      {snapshots.length === 0 && (
        <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>
          Nenhum snapshot salvo
        </div>
      )}

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {snapshots.map((snap, idx) => (
          <div
            key={snap.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              borderRadius: 4,
              background: idx === currentIndex ? '#2a2a4e' : '#1a1a2e',
              border: idx === currentIndex ? '1px solid #4A90D9' : '1px solid transparent',
              fontSize: 11,
            }}
          >
            <div
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => onRestore(snap.id)}
            >
              <div style={{ color: '#CCC' }}>{snap.name}</div>
              <div style={{ color: '#666', fontSize: 10 }}>
                {snap.entityIds.length} entidades ·{' '}
                {new Date(snap.createdAt).toLocaleTimeString('pt-BR')}
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDelete(snap.id)}
              style={{ fontSize: 9, padding: '1px 4px' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
