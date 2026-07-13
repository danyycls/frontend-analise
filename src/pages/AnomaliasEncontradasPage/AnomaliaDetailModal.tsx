import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { getTagColor } from './tagColors';
import type { AnomaliaDocumento } from './AnomaliaCard';

interface Props {
  item: AnomaliaDocumento;
  onClose: () => void;
}

const CAMPOS_ESPERADOS_MODAL = [
  'descricao', 'tipo', 'categoria', 'gravidade', 'tag',
  'nome', 'fornecedor_documento', 'documento_ref',
  'uf', 'municipio',
  'numero_controle_pncp',
  'objeto_contrato', 'data_vigencia_inicio', 'data_vigencia_fim',
  'orgao_cnpj', 'orgao_nome',
  'detalhes',
];

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

function renderNested(val: unknown, depth: number = 0): ReactNode {
  if (val === null || val === undefined) return null;

  // Detectar BSON null (objeto com Subtype/Data vazio)
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
          const rendered = renderNested(v, depth + 1);
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

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: 1, color: 'var(--accent)',
      marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid var(--card-border)',
    }}>
      {label}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function Section(props: { label: string; children: ReactNode }) {
  const hasContent = props.children
    ? (Array.isArray(props.children) ? props.children.some(c => c != null) : true)
    : false;
  if (!hasContent) return null;
  return (
    <>
      <SectionHeader label={props.label} />
      {props.children}
      <div style={{ height: 8 }} />
    </>
  );
}

export default function AnomaliaDetailModal({ item, onClose }: Props) {
  const loggedRef = useRef(false);

  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;

    const camposPresentes = new Set(Object.keys(item));
    const ausentes = CAMPOS_ESPERADOS_MODAL.filter(c => !camposPresentes.has(c));
    if (ausentes.length > 0) {
      console.warn('[AnomaliaDetailModal] campos ausentes no item:', ausentes.join(', '), '| presentes:', Object.keys(item).join(', '));
    }
  }, [item]);

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

        <Section label="Descrição">
          <FieldRow label="Descrição" value={item.descricao} />
          <FieldRow label="Tipo" value={item.tipo} />
          <FieldRow label="Categoria" value={item.categoria} />
          <FieldRow label="Gravidade" value={item.gravidade} />
          {item.tag && (
            <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 140, flexShrink: 0 }}>Tag</span>
              <span style={{
                padding: '2px 10px', borderRadius: 12, fontSize: '0.65rem',
                fontWeight: 600, fontFamily: 'var(--font-mono)',
                background: getTagColor(item.tag) + '22',
                color: getTagColor(item.tag),
                border: `1px solid ${getTagColor(item.tag)}66`,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {item.tag}
              </span>
            </div>
          )}
        </Section>

        <Section label="Fornecedor">
          <FieldRow label="Nome" value={item.nome} />
          <FieldRow label="Documento" value={item.fornecedor_documento} />
          <FieldRow label="Documento Ref" value={item.documento_ref} />
          <FieldRow label="Origem" value={item.origem_documento} />
        </Section>

        <Section label="Empresa">
          <FieldRow label="Nome" value={item.nome_empresa} />
          <FieldRow label="Nome Origem" value={item.nome_origem} />
        </Section>

        <Section label="Contrato">
          <FieldRow label="Objeto" value={item.objeto_contrato} />
          <FieldRow label="Vigência Início" value={item.data_vigencia_inicio} />
          <FieldRow label="Vigência Fim" value={item.data_vigencia_fim} />
        </Section>

        <Section label="Órgão">
          <FieldRow label="CNPJ" value={item.orgao_cnpj} />
          <FieldRow label="Nome" value={item.orgao_nome} />
        </Section>

        <Section label="Localização">
          <FieldRow label="UF" value={item.uf} />
          <FieldRow label="Município" value={item.municipio} />
        </Section>

        {(item.socios?.length ?? 0) > 0 && (
          <Section label="Sócios">
            {item.socios.map((s: any, i: number) => (
              <div key={i} style={{
                padding: '6px 10px',
                background: 'var(--bg)',
                borderRadius: 6,
                border: '1px solid var(--card-border)',
                marginBottom: 4,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                gap: 16,
              }}>
                <span style={{ color: 'var(--text-primary)' }}>{s.nome}</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.documento}</span>
              </div>
            ))}
          </Section>
        )}

        <Section label="Referência">
          <FieldRow label="N° Controle PNCP" value={item.numero_controle_pncp} />
          <FieldRow label="Código IBGE" value={item.codigo_ibge ? String(item.codigo_ibge) : undefined} />
          <FieldRow label="Exercício" value={item.exercicio ? String(item.exercicio) : undefined} />
        </Section>

        {item.detalhes && (
          <Section label="Detalhes">
            {renderNested(item.detalhes)}
          </Section>
        )}
      </div>
    </div>
  );
}
