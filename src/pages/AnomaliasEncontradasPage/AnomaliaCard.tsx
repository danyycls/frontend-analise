import { getTagColor } from './tagColors';
import './AnomaliaCard.css';

export interface AnomaliaDocumento {
  id?: string;
  job_id: string;
  documento_rastrear: string;
  nome: string;
  origem: string;
  numero_controle_pncp: string;
  orgao_cnpj: string;
  orgao_nome: string;
  uf: string;
  municipio: string;
  data_publicacao_pncp?: string;
  valor_total_estimado?: number;
  valor_total_homologado?: number;
  amparo_legal?: { codigo?: string; nome?: string; descricao?: string };
  orgao_entidade?: { cnpj?: string; razao_social?: string; esfera_id?: string; poder_id?: string };
  titulo: string;
  tags: string[];
  documentos_vinculos: any[];
  created_at: string;
}

interface Props {
  item: AnomaliaDocumento;
  onSelect: (item: AnomaliaDocumento) => void;
}

export default function AnomaliaCard({ item, onSelect }: Props) {
  const tituloLongo = item.titulo && item.titulo.length > 100;

  return (
    <div className="tool-card anomalia-card" onClick={() => onSelect(item)}>
      <div
        className="anomalia-card-title"
        style={{ fontSize: tituloLongo ? '0.75rem' : '0.9rem' }}
      >
        {item.titulo || item.nome || item.documento_rastrear}
      </div>

      <div className="anomalia-card-tags">
        {(item.tags || []).map(tag => {
          const cor = getTagColor(tag);
          return (
            <span
              key={tag}
              className="anomalia-card-tag"
              style={{
                background: cor + '22',
                color: cor,
                border: `1px solid ${cor}66`,
              }}
            >
              {tag}
            </span>
          );
        })}
      </div>

      <div className="anomalia-card-divider" />

      <div className="anomalia-card-meta">
        {item.numero_controle_pncp && (
          <div className="anomalia-card-meta-full">
            <span className="anomalia-card-muted">📄 </span>
            {item.numero_controle_pncp}
          </div>
        )}
        {item.orgao_nome && (
          <div>
            <span className="anomalia-card-muted">🏛 </span>
            {item.orgao_nome}
          </div>
        )}
        <div>
          <span className="anomalia-card-muted">📍 </span>
          {item.uf || '-'}{item.municipio ? ` - ${item.municipio}` : ''}
        </div>
        <div>
          <span className="anomalia-card-muted">🔗 </span>
          {(() => {
            const docs = item.documentos_vinculos || [];
            const total = docs.reduce((sum, d) => sum + (d.vinculos?.length || 0), 0);
            return `${total} vínculo(s)`;
          })()}
        </div>
      </div>

      <div className="anomalia-card-date">
        🕐 {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'}
      </div>
    </div>
  );
}
