import type { ReactNode } from 'react';
import { getTagColor } from './tagColors';
import type { AnomaliaDocumento } from './AnomaliaCard';

interface Props {
  item: AnomaliaDocumento;
  onClose: () => void;
}

const VINCULO_TIPO_MAPA: Record<string, string> = {
  'fornecedor': 'Fornecedor de Campanha',
  'doador': 'Doador Eleitoral',
  'receita_candidato': 'Doação a Candidato',
  'receita_orgao_partidario': 'Doação a Partido',
  'tcu_contas_irregulares': 'Contas Irregulares (TCU)',
  'tcu_inabilitado': 'Inabilitado (TCU)',
  'tcu_inidoneo': 'Inidôneo (TCU)',
  'servidor_publico': 'Servidor Público Federal',
  'pessoa_publica': 'Pessoa Politicamente Exposta',
  'dispensa_valor_limite': 'Dispensa acima do limite',
};

function fmtTipo(tipo: string): string {
  return VINCULO_TIPO_MAPA[tipo] || tipo;
}

function renderNested(val: unknown, depth: number = 0): ReactNode {
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-muted)' }}>-</span>;
  if (typeof val === 'string') return <span style={{ wordBreak: 'break-all' }}>{val}</span>;
  if (typeof val === 'number' || typeof val === 'boolean') return <span>{String(val)}</span>;

  if (Array.isArray(val)) {
    const items = val as unknown[];
    if (items.length === 0) return <span style={{ color: 'var(--text-muted)' }}>vazio</span>;
    return (
      <details style={{ marginTop: 4 }}>
        <summary style={{
          cursor: 'pointer',
          fontSize: '0.65rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent)',
          padding: '3px 6px',
          borderRadius: 4,
          background: 'var(--bg-elevated)',
          marginBottom: 4,
          userSelect: 'none',
        }}>
          {items.length} item(ns)
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
          {items.map((item: any, idx: number) => (
            <div key={idx} style={{
              padding: '6px 8px',
              background: 'var(--bg)',
              borderRadius: 4,
              border: '1px solid var(--card-border)',
              fontSize: '0.7rem',
            }}>
              {renderNested(item, depth + 1)}
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {entries.map(([k, v]) => {
          if (Array.isArray(v)) {
            const arr = v as unknown[];
            return (
              <div key={k} style={{ marginTop: 4 }}>
                <details open={arr.length <= 3}>
                  <summary style={{
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '2px 4px',
                    borderRadius: 4,
                    background: 'var(--bg-elevated)',
                    userSelect: 'none',
                  }}>
                    {k} ({arr.length})
                  </summary>
                  <div style={{ paddingLeft: 8, paddingTop: 4 }}>
                    {renderNested(v, depth + 1)}
                  </div>
                </details>
              </div>
            );
          }
          return (
            <div key={k} style={{ marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
              {renderNested(v, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  }

  return <span>{String(val)}</span>;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: '0.65rem',
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: 'var(--accent)',
      marginBottom: 8,
      paddingBottom: 4,
      borderBottom: '1px solid var(--card-border)',
    }}>
      {label}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value || '-'}</span>
    </div>
  );
}

export default function AnomaliaDetailModal({ item, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 12,
          maxWidth: 720,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', margin: 0 }}>
            Detalhes da Anomalia
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '1.2rem', padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Documentos e Vínculos */}
        <SectionHeader label={`Documentos e Vínculos`} />
        {(item.documentos_vinculos || []).length === 0 ? (
          <>
            <FieldRow label="Documento" value={item.documento_rastrear} />
            <FieldRow label="Nome" value={item.nome} />
            <FieldRow label="Origem" value={item.origem} />
          </>
        ) : (
          (item.documentos_vinculos || []).map((doc: any, di: number) => {
            const totalVinc = (doc.vinculos || []).length;
            return (
              <div key={di} style={{
                padding: '8px 12px',
                marginBottom: 10,
                background: 'var(--bg)',
                borderRadius: 6,
                border: '1px solid var(--card-border)',
              }}>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: doc.origem === 'principal' ? 'var(--accent)' : 'var(--text-secondary)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  {doc.origem === 'principal'
                    ? '📄 Documento Principal (Empresa)'
                    : doc.origem === 'regra'
                      ? '⚖️ Regra de Contratação'
                      : '👤 Documento Sócio'}
                  {doc.parcial && (
                    <span style={{
                      padding: '1px 8px',
                      borderRadius: 8,
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      background: '#f59e0b22',
                      color: '#f59e0b',
                      border: '1px solid #f59e0b66',
                    }}>
                      PARCIAL
                    </span>
                  )}
                  {totalVinc > 0 && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 'auto' }}>
                      {totalVinc} vínculo(s)
                    </span>
                  )}
                </div>
                <FieldRow label="Documento" value={doc.documento_normalizado || doc.documento_input} />
                {doc.nome && <FieldRow label="Nome" value={doc.nome} />}
                {doc.documento_input && doc.documento_normalizado && doc.documento_input !== doc.documento_normalizado && (
                  <FieldRow label="Documento Original" value={doc.documento_input} />
                )}
                {(doc.vinculos || []).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {(doc.vinculos || []).map((v: any, vi: number) => (
                      <div key={vi} style={{
                        border: '1px solid var(--card-border)',
                        borderRadius: 8,
                        marginBottom: 6,
                        overflow: 'hidden',
                      }}>
                        <details style={{ padding: 0 }}>
                          <summary style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--bg-elevated)',
                            userSelect: 'none',
                          }}>
                            {fmtTipo(v.tipo)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— {v.descricao || 'sem descrição'}</span>
                          </summary>
                          <div style={{ padding: '10px 12px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                            {v.detalhes && renderDetalhes(v.detalhes)}
                            {!v.detalhes && <span style={{ color: 'var(--text-muted)' }}>Sem detalhes adicionais</span>}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
                {totalVinc === 0 && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    Nenhum vínculo encontrado.
                  </p>
                )}
              </div>
            );
          })
        )}
        <FieldRow label="N° Controle PNCP" value={item.numero_controle_pncp} />

        <div style={{ height: 16 }} />

        {/* Órgão */}
        <SectionHeader label="Órgão" />
        <FieldRow label="CNPJ" value={item.orgao_cnpj} />
        <FieldRow label="Nome" value={item.orgao_nome} />

        <div style={{ height: 8 }} />

        {/* Publicação */}
        <SectionHeader label="Publicação" />
        <FieldRow label="Data Publicação PNCP" value={item.data_publicacao_pncp || '-'} />

        <div style={{ height: 8 }} />

        {/* Valores */}
        <SectionHeader label="Valores" />
        <FieldRow label="Valor Total Estimado" value={item.valor_total_estimado != null ? `R$ ${item.valor_total_estimado.toFixed(2)}` : '-'} />
        <FieldRow label="Valor Total Homologado" value={item.valor_total_homologado != null ? `R$ ${item.valor_total_homologado.toFixed(2)}` : '-'} />

        <div style={{ height: 8 }} />

        {/* Amparo Legal */}
        {item.amparo_legal && (
          <>
            <SectionHeader label="Amparo Legal" />
            <FieldRow label="Código" value={item.amparo_legal.codigo || '-'} />
            <FieldRow label="Nome" value={item.amparo_legal.nome || '-'} />
            <FieldRow label="Descrição" value={item.amparo_legal.descricao || '-'} />
            <div style={{ height: 8 }} />
          </>
        )}

        {/* Orgão Entidade */}
        {item.orgao_entidade && (
          <>
            <SectionHeader label="Orgão Entidade" />
            <FieldRow label="CNPJ" value={item.orgao_entidade.cnpj || '-'} />
            <FieldRow label="Razão Social" value={item.orgao_entidade.razao_social || '-'} />
            <FieldRow label="Esfera ID" value={item.orgao_entidade.esfera_id || '-'} />
            <FieldRow label="Poder ID" value={item.orgao_entidade.poder_id || '-'} />
            <div style={{ height: 8 }} />
          </>
        )}

        {/* Localização */}
        <SectionHeader label="Localização" />
        <FieldRow label="UF" value={item.uf} />
        <FieldRow label="Município" value={item.municipio} />

        <div style={{ height: 16 }} />

        {/* Classificação */}
        <SectionHeader label="Classificação" />
        <FieldRow label="Título" value={item.titulo} />
        <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>Tags</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(item.tags || []).map(tag => {
              const cor = getTagColor(tag);
              return (
                <span key={tag} style={{
                  padding: '2px 10px', borderRadius: 12, fontSize: '0.65rem',
                  fontWeight: 600, fontFamily: 'var(--font-mono)',
                  background: cor + '22', color: cor,
                  border: `1px solid ${cor}66`,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Metadados */}
        <SectionHeader label="Metadados" />
        <FieldRow label="Job ID" value={item.job_id} />
        <FieldRow label="Criado em" value={item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'} />
      </div>
    </div>
  );
}

function renderDetalhes(d: Record<string, unknown>) {
  const sections: { key: string; label: string }[] = [];

  if (d.fornecedor) sections.push({ key: 'fornecedor', label: 'Fornecedor' });
  if (d.doador) sections.push({ key: 'doador', label: 'Doador' });
  if (d.receitas_candidato) sections.push({ key: 'receitas_candidato', label: 'Receitas de Candidato' });
  if (d.receitas_orgao_partidario) sections.push({ key: 'receitas_orgao_partidario', label: 'Receitas de Órgão Partidário' });
  if (d.contas_irregulares) sections.push({ key: 'contas_irregulares', label: 'Contas Irregulares (TCU)' });
  if (d.inabilitados) sections.push({ key: 'inabilitados', label: 'Inabilitados (TCU)' });
  if (d.inidoneos) sections.push({ key: 'inidoneos', label: 'Inidôneos (TCU)' });
  if (d.servidores_publicos) sections.push({ key: 'servidores_publicos', label: 'Servidores Públicos' });
  if (d.pessoas_publicas) sections.push({ key: 'pessoas_publicas', label: 'Pessoas Politicamente Expostas' });
  if (d.dispensa_valor_limite) sections.push({ key: 'dispensa_valor_limite', label: 'Dispensa acima do limite' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sections.map(s => {
        const val = d[s.key];
        return (
          <div key={s.key}>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </div>
            {renderNested(val)}
          </div>
        );
      })}
    </div>
  );
}
