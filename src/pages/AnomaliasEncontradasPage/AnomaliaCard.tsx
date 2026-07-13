import { useEffect, useRef } from 'react';
import { getTagColor } from './tagColors';
import './AnomaliaCard.css';

export type AnomaliaDocumento = Record<string, any>;

interface Props {
  item: AnomaliaDocumento;
  onSelect: (item: AnomaliaDocumento) => void;
}

const CAMPOS_ESPERADOS_CARD = [
  'descricao', 'tag', 'nome', 'fornecedor_documento',
  'numero_controle_pncp', 'uf', 'municipio', 'categoria', 'tipo', 'gravidade',
];

export default function AnomaliaCard({ item, onSelect }: Props) {
  const loggedRef = useRef(false);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    const camposPresentes = new Set(Object.keys(item));
    const ausentes = CAMPOS_ESPERADOS_CARD.filter(c => !camposPresentes.has(c));
    if (ausentes.length > 0) {
      console.warn('[AnomaliaCard] campos ausentes no item:', ausentes.join(', '), '| presentes:', Object.keys(item).join(', '));
    }
  }, [item]);

  const titulo = item.descricao || item.nome || item.fornecedor_documento || '-';
  const tituloLongo = titulo.length > 100;

  return (
    <div className="tool-card anomalia-card" onClick={() => onSelect(item)}>
      <div
        className="anomalia-card-title"
        style={{ fontSize: tituloLongo ? '0.75rem' : '0.9rem' }}
      >
        {titulo}
      </div>

      <div className="anomalia-card-tags">
        {item.tag ? (
          <span
            className="anomalia-card-tag"
            style={{
              background: getTagColor(item.tag) + '22',
              color: getTagColor(item.tag),
              border: `1px solid ${getTagColor(item.tag)}66`,
            }}
          >
            {item.tag}
          </span>
        ) : (
          <span className="anomalia-card-muted">sem tag</span>
        )}
      </div>

      <div className="anomalia-card-divider" />

      <div className="anomalia-card-meta">
        {item.numero_controle_pncp && (
          <div className="anomalia-card-meta-full">
            <span className="anomalia-card-muted">📄 </span>
            {item.numero_controle_pncp}
          </div>
        )}
        {item.nome && (
          <div>
            <span className="anomalia-card-muted">👤 </span>
            {item.nome}
          </div>
        )}
        <div>
          <span className="anomalia-card-muted">📍 </span>
          {item.uf || '-'}{item.municipio ? ` - ${item.municipio}` : ''}
        </div>
        <div>
          <span className="anomalia-card-muted">🏷 </span>
          {item.categoria || item.tipo || '-'}
        </div>
      </div>

      <div className="anomalia-card-date">
        ⚠ {item.gravidade || '-'}
      </div>
    </div>
  );
}
