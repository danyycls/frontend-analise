import { useState } from 'react';
import type { ReactNode } from 'react';
import { getTagColor } from './tagColors';
import type { AnomaliaDocumento } from './AnomaliaCard';
import { fmtDoc, fmtValor, fmtData, fLabel } from '@/shared/lib/formatters';
import '@/features/ligacao-politica/ui/LigacaoPolitica.css';

interface Props {
  item: AnomaliaDocumento;
  onClose: () => void;
}

const VINCULO_TIPO_MAPA: Record<string, string> = {
  'fornecedor': 'Fornecedor de Campanha',
  'doador': 'Doador Eleitoral',
  'receita_candidato': 'Doação a Candidato',
  'receita_orgao_partidario': 'Doação a Partido',
  'despesa_candidato': 'Despesa de Candidato',
  'despesa_orgao_partidario': 'Despesa de Partido',
  'tcu_contas_irregulares': 'Contas Irregulares (TCU)',
  'tcu_inabilitado': 'Inabilitado (TCU)',
  'tcu_inidoneo': 'Inidôneo (TCU)',
  'servidor_publico': 'Servidor Público Federal',
  'pessoa_publica': 'Pessoa Politicamente Exposta',
};

function fmtTipo(tipo: string): string {
  return VINCULO_TIPO_MAPA[tipo] || tipo;
}

const SKIP_KEYS = new Set([
  'id', '_id', 'created_at', 'updated_at', 'deleted_at',
  'Subtype', 'Data', 'extra', '_doc_origem', '_descricao',
]);

function isPrim(v: unknown): boolean {
  return v === null || v === undefined || typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string';
}

function fmtValorAnomalia(v: unknown): string {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'string') {
    const digits = v.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 14) return fmtDoc(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return fmtData(v);
    if (!v) return '-';
    return v;
  }
  if (typeof v === 'number') {
      return fmtValor(v);
  }
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
}

function extrairCamposUteis(obj: Record<string, unknown>): { label: string; valor: string }[] {
  const campos: { label: string; valor: string }[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP_KEYS.has(k)) continue;
    if (!isPrim(v)) continue;
    const formatted = fmtValorAnomalia(v);
    if (!formatted || formatted === '-') continue;
    campos.push({ label: fLabel(k), valor: formatted });
  }
  return campos;
}

function Campo({ label, value, fullWidth }: { label: string; value?: string | null; fullWidth?: boolean }) {
  if (!value) return null;
  return (
    <div className="lp-vinc-campo" style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <span className="lp-vinc-rotulo">{label}</span>
      <span className="lp-vinc-valor">{value}</span>
    </div>
  );
}

function Secao({ label, children, defaultOpen = true }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [aberto, setAberto] = useState(defaultOpen);
  const hasContent = children
    ? (Array.isArray(children) ? children.some(c => c != null) : true)
    : false;
  if (!hasContent) return null;
  return (
    <div className="lp-vinc-secao" style={{ marginBottom: 16 }}>
      <div
        onClick={() => setAberto(!aberto)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', marginBottom: 8 }}
      >
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{aberto ? '▼' : '▶'}</span>
        <span className="lp-vinc-secao-title">{label}</span>
      </div>
      {aberto && <div style={{ paddingLeft: 4 }}>{children}</div>}
    </div>
  );
}

function GridCampos({ data, fullWidthKeys }: { data: Record<string, unknown>; fullWidthKeys?: Set<string> }) {
  const campos = extrairCamposUteis(data);
  if (campos.length === 0) return null;
  return (
    <div className="lp-vinc-grid">
      {campos.map(c => (
        <Campo key={c.label} label={c.label} value={c.valor} fullWidth={fullWidthKeys?.has(c.label)} />
      ))}
    </div>
  );
}

function SubItems({ items, max = 5 }: { items: any[]; max?: number }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="lp-vinc-sub-items">
      {items.slice(0, max).map((item, i) => (
        <div key={i} className="lp-vinc-sub-item">
          {typeof item === 'object' ? <GridCampos data={item} /> : <span>{fmtValorAnomalia(item)}</span>}
        </div>
      ))}
      {items.length > max && (
        <span className="lp-vinc-mais">+{items.length - max} mais</span>
      )}
    </div>
  );
}

function renderNested(val: unknown): ReactNode {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && !Array.isArray(val) && 'Subtype' in (val as any) && 'Data' in (val as any)) {
    return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>sem detalhes</span>;
  }
  if (typeof val === 'string') {
    if (!val) return null;
    return <span style={{ wordBreak: 'break-all' }}>{val}</span>;
  }
  if (typeof val === 'number' || typeof val === 'boolean') return <span>{String(val)}</span>;

  if (Array.isArray(val)) {
    const items = val as unknown[];
    if (items.length === 0) return null;
    return (
      <details style={{ marginTop: 4 }}>
        <summary style={{ cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)', padding: '3px 6px', borderRadius: 4, background: 'var(--bg-elevated)', marginBottom: 4, userSelect: 'none' }}>
          {items.length} item(ns)
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
          {items.map((item: any, idx: number) => (
            <div key={idx} style={{ padding: '6px 8px', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--card-border)', fontSize: '0.7rem' }}>
              {renderNested(item)}
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>).filter(([, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string' && !v) return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });
    if (entries.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {entries.map(([k, v]) => {
          if (Array.isArray(v)) {
            const arr = v as unknown[];
            if (arr.length === 0) return null;
            return (
              <div key={k} style={{ marginTop: 4 }}>
                <details open={arr.length <= 3}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '2px 4px', borderRadius: 4, background: 'var(--bg-elevated)', userSelect: 'none' }}>
                    {k} ({arr.length})
                  </summary>
                  <div style={{ paddingLeft: 8, paddingTop: 4 }}>{renderNested(v)}</div>
                </details>
              </div>
            );
          }
          const rendered = renderNested(v);
          if (!rendered) return null;
          return (
            <div key={k} style={{ marginBottom: 2 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
              {rendered}
            </div>
          );
        })}
      </div>
    );
  }

  const s = String(val);
  if (!s) return null;
  return <span>{s}</span>;
}

export default function AnomaliaDetailModal({ item, onClose }: Props) {
  const [rawAberto, setRawAberto] = useState(false);

  const dispensa = item.detalhes?.dispensa_valor_limite as Record<string, unknown> | undefined;

  const detalhesUteis = item.detalhes && !dispensa
    ? extrairCamposUteis(item.detalhes as Record<string, unknown>)
    : [];

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
          maxWidth: 800,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', margin: 0 }}>
              Detalhes da Anomalia
            </h2>
            {item.tag && (
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: '0.65rem',
                fontWeight: 600, fontFamily: 'var(--font-mono)', width: 'fit-content',
                background: getTagColor(item.tag) + '22',
                color: getTagColor(item.tag),
                border: `1px solid ${getTagColor(item.tag)}66`,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {item.tag}
              </span>
            )}
          </div>
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

        <Secao label="Descrição">
          <div className="lp-vinc-grid">
            <Campo label="Descrição" value={item.descricao} fullWidth />
            <Campo label="Tipo" value={fmtTipo(item.tipo)} />
            <Campo label="Categoria" value={item.categoria} />
            <Campo label="Gravidade" value={item.gravidade} />
          </div>
        </Secao>

        {(item.nome || item.fornecedor_documento || item.documento_ref || item.origem_documento) && (
          <Secao label="Fornecedor">
            <div className="lp-vinc-grid">
              <Campo label="Nome" value={item.nome} />
              <Campo label="Documento" value={item.fornecedor_documento ? fmtDoc(item.fornecedor_documento) : undefined} />
              <Campo label="Documento Ref" value={item.documento_ref ? fmtDoc(item.documento_ref) : undefined} />
              <Campo label="Origem" value={item.origem_documento} />
            </div>
          </Secao>
        )}

        {(item.nome_empresa || item.nome_origem || (item.socios?.length ?? 0) > 0) && (
          <Secao label="Empresa">
            <div className="lp-vinc-grid">
              <Campo label="Nome" value={item.nome_empresa} />
              <Campo label="Nome Origem" value={item.nome_origem} />
            </div>
            {(item.socios?.length ?? 0) > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                  Sócios ({item.socios.length})
                </span>
                <div className="lp-vinc-sub-items">
                  {item.socios.map((s: any, i: number) => (
                    <div key={i} className="lp-vinc-sub-item" style={{ display: 'flex', gap: 16 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{s.nome}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{s.documento ? fmtDoc(s.documento) : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Secao>
        )}

        <Secao label="Referência" defaultOpen={false}>
          {(item.objeto_contrato || item.data_vigencia_inicio || item.data_vigencia_fim) && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Contrato
              </span>
              <div className="lp-vinc-grid">
                <Campo label="Objeto" value={item.objeto_contrato} fullWidth />
                <Campo label="Vigência Início" value={item.data_vigencia_inicio ? fmtData(item.data_vigencia_inicio) : undefined} />
                <Campo label="Vigência Fim" value={item.data_vigencia_fim ? fmtData(item.data_vigencia_fim) : undefined} />
              </div>
            </div>
          )}
          {(item.orgao_cnpj || item.orgao_nome) && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Órgão
              </span>
              <div className="lp-vinc-grid">
                <Campo label="Nome" value={item.orgao_nome} />
                <Campo label="CNPJ" value={item.orgao_cnpj ? fmtDoc(item.orgao_cnpj) : undefined} />
              </div>
            </div>
          )}
          {(item.uf || item.municipio) && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Localização
              </span>
              <div className="lp-vinc-grid">
                <Campo label="UF" value={item.uf} />
                <Campo label="Município" value={item.municipio} />
              </div>
            </div>
          )}
          <div className="lp-vinc-grid">
            <Campo label="N° Controle PNCP" value={item.numero_controle_pncp} />
            <Campo label="Código IBGE" value={item.codigo_ibge ? String(item.codigo_ibge) : undefined} />
            <Campo label="Exercício" value={item.exercicio ? String(item.exercicio) : undefined} />
          </div>
        </Secao>

        {dispensa && (
          <Secao label="Anormalidade — Dispensa de Licitação">
            <div className="lp-vinc-grid">
              <Campo label="Modalidade" value={dispensa.modalidade as string} />
              <Campo label="Categoria" value={dispensa.categoria as string} />
              <Campo label="Valor Global" value={dispensa.valor_global != null ? fmtValor(Number(dispensa.valor_global)) : undefined} />
              <Campo label="Limite Legal" value={dispensa.limite != null ? fmtValor(Number(dispensa.limite)) : undefined} />
              <Campo label="Excedente" value={dispensa.excedente != null ? fmtValor(Number(dispensa.excedente)) : undefined} />
            </div>
            {dispensa.regra && (
              <div style={{ marginTop: 8, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', padding: '6px 8px', background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--card-border)' }}>
                {dispensa.regra as string}
              </div>
            )}
          </Secao>
        )}

        {detalhesUteis.length > 0 && (
          <Secao label="Detalhes da Fonte">
            <div className="lp-vinc-grid">
              {detalhesUteis.map(c => (
                <Campo key={c.label} label={c.label} value={c.valor} />
              ))}
            </div>
          </Secao>
        )}

        {item.detalhes && (
          <div className="lp-vinc-secao" style={{ marginBottom: 8, opacity: 0.6 }}>
            <div
              onClick={() => setRawAberto(!rawAberto)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', marginBottom: 4 }}
            >
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{rawAberto ? '▼' : '▶'}</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                Dados Brutos
              </span>
            </div>
            {rawAberto && (
              <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--card-border)', fontSize: '0.7rem', maxHeight: 300, overflow: 'auto' }}>
                {renderNested(item.detalhes)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
