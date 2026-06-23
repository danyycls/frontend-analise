// @ts-nocheck
import { useState, useMemo } from 'react';
import './AnaliseDetalhada.css';

function fLabel(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function isPrim(v) {
  return v === null || v === undefined || typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string';
}

function fVal(v) {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Nao';
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return v.toLocaleString('pt-BR');
    return v.toFixed(2);
  }
  return String(v) || '-';
}

const SKIP_KEYS = new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'extra', '_doc_origem', '_descricao', '_nome_entity']);
const ID_KEYS = new Set([
  'sq_candidato', 'sq_despesa', 'sq_receita', 'sq_prestador_contas',
  'cpf_cnpj', 'cpf',
]);

function isIdKey(k) {
  return ID_KEYS.has(k) || k.endsWith('_id');
}

function Campo({ k, v, onIdClick }) {
  const isId = isIdKey(k) && v != null && v !== '';
  return (
    <div className="ad-campo">
      <span className="ad-campo-rotulo">{fLabel(k)}:</span>
      {isId ? (
        <span className="ad-campo-valor ad-id-link" onClick={() => onIdClick?.(k, v)}>
          {fVal(v)}
        </span>
      ) : (
        <span className="ad-campo-valor">{fVal(v)}</span>
      )}
    </div>
  );
}

export function ObjCard({ data, titulo, open = false, hideToggle, onIdClick }) {
  const [aberto, setAberto] = useState(open);
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([k]) => !SKIP_KEYS.has(k));
  if (entries.length === 0) return null;
  const prims = entries.filter(([, v]) => isPrim(v));
  const objs = entries.filter(([, v]) => !isPrim(v) && v != null && typeof v === 'object');
  const totalArrayItems = objs.reduce((acc, [, v]) => acc + (Array.isArray(v) ? v.length : 0), 0);

  function toggle() { if (!hideToggle) setAberto(!aberto); }

  return (
    <div className="ad-obj-card">
      {titulo && (
        <div className="ad-obj-card-header" onClick={toggle}>
          <span className="ad-obj-card-title">{titulo}</span>
          {totalArrayItems > 0 && <span className="ad-s-cnt">{totalArrayItems}</span>}
          {!hideToggle && <span className="ad-obj-card-toggle">{aberto ? '−' : '+'}</span>}
        </div>
      )}
      {(!titulo || aberto) && (
        <>
          {prims.length > 0 && (
            <div className="ad-campos-grid">
              {prims.map(([k, v]) => (<Campo key={k} k={k} v={v} onIdClick={onIdClick} />))}
            </div>
          )}
          {objs.map(([k, v]) => {
            if (Array.isArray(v)) {
              if (v.length === 0) return null;
              return (
                <div key={k} className="ad-array-section">
                  <h5 className="ad-array-title">{fLabel(k)} ({v.length})</h5>
                  <div className="ad-array-items">
                    {v.map((item, i) => (
                      <ObjCard key={i} data={item} titulo={`Item ${i + 1}`} open={false} onIdClick={onIdClick} />
                    ))}
                  </div>
                </div>
              );
            }
            return <ObjCard key={k} data={v} titulo={fLabel(k)} open onIdClick={onIdClick} />;
          })}
        </>
      )}
    </div>
  );
}

function truncate(s, max) {
  if (!s || typeof s !== 'string') return s;
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function fData(d) {
  if (!d) return '-';
  const m = String(d).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return String(d);
}

function ArrayTable({ items, label, onIdClick }) {
  const [pagina, setPagina] = useState(0);
  const [sel, setSel] = useState(null);
  const porPag = 50;
  const totalPag = Math.ceil(items.length / porPag);
  const start = pagina * porPag;
  const page = items.slice(start, start + porPag);

  function fmtCreated(v) {
    if (!v) return '-';
    const d = new Date(v);
    return d.toLocaleString('pt-BR');
  }

  const first = items[0];
  const firstKeys = first ? Object.keys(first) : [];

  function hasAnyKey(keys) {
    return keys.some(k => firstKeys.includes(k));
  }

  let columns = [];
  if (hasAnyKey(['origem_despesa_descricao', 'sq_despesa', 'descricao', 'valor'])) {
    columns = [
      { key: 'sq_despesa', label: 'Id', fmt: (v) => String(v) },
      { key: 'origem_despesa_descricao', label: 'Origem' },
      { key: 'descricao', label: 'Descricao', fmt: (v) => truncate(v, 50) },
      { key: 'valor', label: 'Valor', fmt: (v) => fVal(v) },
      { key: 'created_at', label: 'Created At', fmt: fmtCreated },
    ];
  } else if (first?.despesa && typeof first.despesa === 'object') {
    columns = [
      { key: 'despesa.sq_despesa', label: 'Id', fmt: (v) => String(v) },
      { key: 'despesa.origem_despesa_descricao', label: 'Origem' },
      { key: 'despesa.descricao', label: 'Descricao', fmt: (v) => truncate(v, 50) },
      { key: 'despesa.valor', label: 'Valor', fmt: (v) => fVal(v) },
      { key: 'despesa.created_at', label: 'Created At', fmt: fmtCreated },
    ];
  } else if (first?.partido && typeof first.partido === 'object') {
    columns = [
      { key: 'despesa.sq_despesa', label: 'Id', fmt: (v) => String(v) },
      { key: 'despesa.descricao', label: 'Descricao', fmt: (v) => truncate(v, 50) },
      { key: 'despesa.valor', label: 'Valor', fmt: (v) => fVal(v) },
      { key: 'despesa.created_at', label: 'Created At', fmt: fmtCreated },
    ];
  } else if (firstKeys.includes('partido_id') && firstKeys.includes('sq_despesa')) {
    columns = [
      { key: 'sq_despesa', label: 'Id', fmt: (v) => String(v) },
      { key: 'descricao', label: 'Descricao', fmt: (v) => truncate(v, 50) },
      { key: 'valor', label: 'Valor', fmt: (v) => fVal(v) },
      { key: 'created_at', label: 'Created At', fmt: fmtCreated },
    ];
  } else if (hasAnyKey(['sq_receita', 'data_receita'])) {
    columns = [
      { key: 'sq_receita', label: 'SQ Receita', fmt: (v) => String(v) },
      { key: 'descricao', label: 'Descricao', fmt: (v) => truncate(v, 50) },
      { key: 'valor', label: 'Valor', fmt: (v) => fVal(v) },
      { key: 'data_receita', label: 'Data', fmt: (v) => fData(v) },
    ];
  } else {
    const sample = Object.entries(first).filter(([, v]) => isPrim(v)).slice(0, 6);
    columns = sample.map(([k]) => ({ key: k, label: fLabel(k), fmt: (v) => truncate(String(v), 30) }));
  }

  function getVal(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = cur[p.replace(/\?$/, '')];
    }
    return cur;
  }

  return (
    <div className="ad-array-table-wrap">
      {sel !== null && (
        <div className="ad-array-table-detail">
          <ObjCard data={items[sel]} titulo={`${label} #${sel + 1}`} open onIdClick={onIdClick} />
        </div>
      )}
      <div className="ad-array-table-scroll">
        <table className="ad-array-table">
          <thead>
            <tr>
              <th className="ad-at-col-num">#</th>
              {columns.map((c) => <th key={c.key} className="ad-at-col">{c.label}</th>)}
              <th className="ad-at-col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {page.map((item, i) => {
              const idx = start + i;
              return (
                <tr key={idx} className={sel === idx ? 'ativo' : ''}
                    onClick={() => setSel(sel === idx ? null : idx)}>
                  <td className="ad-at-col-num">{idx + 1}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="ad-at-col">
                      <span className="ad-at-val">{c.fmt ? c.fmt(getVal(item, c.key)) : getVal(item, c.key) ?? '-'}</span>
                    </td>
                  ))}
                  <td className="ad-at-col-actions">
                    <span className="ad-at-expand">{sel === idx ? '−' : '+'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPag > 1 && (
        <div className="ad-array-pag">
          <button disabled={pagina === 0} onClick={() => { setPagina(p => p - 1); setSel(null); }}>◀</button>
          <span>{pagina + 1} / {totalPag}</span>
          <button disabled={pagina >= totalPag - 1} onClick={() => { setPagina(p => p + 1); setSel(null); }}>▶</button>
          <span className="ad-array-pag-total">{items.length} itens</span>
        </div>
      )}
    </div>
  );
}

function DocumentoMeta({ doc, onIdClick }) {
  if (!doc) return null;
  return (
    <div className="ad-doc-meta">
      <span className="ad-info-tag"><strong>Documento:</strong> {doc.documento_input}</span>
      <span className="ad-info-tag">
        <strong>Normalizado:</strong>{' '}
        <span
          className="ad-id-link"
          onClick={() => onIdClick?.('cpf_cnpj', doc.documento_normalizado)}
        >
          {doc.documento_normalizado}
        </span>
      </span>
      <span className="ad-info-tag"><strong>Nome:</strong> {doc.nome}</span>
      <span className="ad-info-tag"><strong>Origem:</strong> {doc.origem}</span>
      {doc.parcial && <span className="ad-info-tag ad-tag-parcial">Parcial</span>}
    </div>
  );
}

function ItemListView({ items, titulo, onIdClick }) {
  if (!items || items.length === 0) return <p className="ad-empty">Nenhum item encontrado.</p>;
  return (
    <div className="ad-array-section">
      <h4 className="ad-array-title">
        {titulo}
        <span className="ad-s-cnt">{items.length}</span>
      </h4>
      <div className="ad-array-items">
        {items.map((item, i) => (
          <ObjCard key={i} data={item} titulo={`${i + 1}`} open={false} onIdClick={onIdClick} />
        ))}
      </div>
    </div>
  );
}

function fmtDoc(d) {
  if (!d) return '-';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

function TCUListView({ items, onIdClick }) {
  if (!items || items.length === 0) return <p className="ad-empty">Nenhum registro TCU encontrado.</p>;

  const grupos = {};
  items.forEach(item => {
    const tipo = item._tcu_tipo || 'TCU';
    if (!grupos[tipo]) grupos[tipo] = [];
    grupos[tipo].push(item);
  });

  return (
    <div className="ad-tcu-section">
      {Object.entries(grupos).map(([tipo, lista]) => (
        <div key={tipo} className="ad-array-section">
          <h4 className="ad-array-title">
            {tipo}
            <span className="ad-s-cnt">{lista.length}</span>
          </h4>
          <div className="tcu-cards">
            {lista.map((item, i) => (
              <div key={i} className="tcu-card">
                <div className="tcu-card-topo">
                  <span className="tcu-card-tipo">TCU</span>
                  <span className="tcu-card-nome">{item.nome || '-'}</span>
                  {item.numeroRegistro && (
                    <span className="tcu-card-doc">{fmtDoc(item.numeroRegistro)}</span>
                  )}
                </div>
                <div className="tcu-card-corpo">
                  <div className="tcu-card-grid">
                    <div className="tcu-card-campo">
                      <span className="tcu-card-label">Processo</span>
                      <span className="tcu-card-value">{item.numeroProcessoFormatado || '-'}</span>
                    </div>
                    {item.tipoRegistro && (
                      <div className="tcu-card-campo">
                        <span className="tcu-card-label">Tipo</span>
                        <span className="tcu-card-value">{item.tipoRegistro}</span>
                      </div>
                    )}
                    <div className="tcu-card-campo">
                      <span className="tcu-card-label">Município</span>
                      <span className="tcu-card-value">{item.municipio || '-'}</span>
                    </div>
                    <div className="tcu-card-campo">
                      <span className="tcu-card-label">UF</span>
                      <span className="tcu-card-value">{item.uf || '-'}</span>
                    </div>
                    <div className="tcu-card-campo">
                      <span className="tcu-card-label">Trânsito Julgado</span>
                      <span className="tcu-card-value">{item.dataTransitoEmJulgado || '-'}</span>
                    </div>
                    {item.numeroAcordaoFormatado && (
                      <div className="tcu-card-campo">
                        <span className="tcu-card-label">Acórdão</span>
                        <span className="tcu-card-value">{item.numeroAcordaoFormatado}</span>
                      </div>
                    )}
                    {item.dataAcordao && (
                      <div className="tcu-card-campo">
                        <span className="tcu-card-label">Data Acórdão</span>
                        <span className="tcu-card-value">{item.dataAcordao}</span>
                      </div>
                    )}
                    {item.dataFinalSancao && (
                      <div className="tcu-card-campo">
                        <span className="tcu-card-label">Fim Sanção</span>
                        <span className="tcu-card-value">{item.dataFinalSancao}</span>
                      </div>
                    )}
                    {item.dataFinalFinsEleitorais && (
                      <div className="tcu-card-campo">
                        <span className="tcu-card-label">Fim Efeito Eleitoral</span>
                        <span className="tcu-card-value">{item.dataFinalFinsEleitorais}</span>
                      </div>
                    )}
                  </div>
                  {(item.linkDeliberacoesProcesso || item.linkAcompanhamentoProcesso) && (
                    <div className="tcu-card-links">
                      {item.linkDeliberacoesProcesso && (
                        <a href={item.linkDeliberacoesProcesso} target="_blank" rel="noopener noreferrer" className="tcu-card-link">
                          Ver Deliberações
                        </a>
                      )}
                      {item.linkAcompanhamentoProcesso && (
                        <a href={item.linkAcompanhamentoProcesso} target="_blank" rel="noopener noreferrer" className="tcu-card-link">
                          Acompanhar Processo
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const SUB_LABELS = {
  servicos_candidatos: 'serviços prestados a candidatos',
  servicos_partidos: 'serviços prestados a partidos',
  doacoes_candidatos: 'doações feitas a candidatos',
  doacoes_partidos: 'doações feitas a partidos',
  tcu: 'TCU',
};

const CATEGORIAS = ['servicos_candidatos', 'servicos_partidos', 'doacoes_candidatos', 'doacoes_partidos', 'tcu'];

export default function AnaliseDetalhada({
  data, licitacao, adId, onFechar, onIdClick,
}) {
  const [selectedSecIdx, setSelectedSecIdx] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);

  const sections = useMemo(() => {
    const secs = [];
    if (!data?.resultados) return secs;

    data.resultados.forEach(r => {
      (r.documentos || []).forEach(doc => {
        const docMeta = {
          documento_input: doc.documento_input,
          documento_normalizado: doc.documento_normalizado,
          nome: doc.nome,
          parcial: doc.parcial,
          origem: doc.origem,
        };

        let servicosCand = [];
        let servicosPart = [];
        let doacoesCand = [];
        let doacoesPart = [];
        let tcuItems = [];

        (doc.vinculos || []).forEach(v => {
          if (v.tipo === 'fornecedor' && v.detalhes?.fornecedor) {
            const f = v.detalhes.fornecedor;
            if (f.despesas_candidato) {
              servicosCand = servicosCand.concat(
                f.despesas_candidato.map(dc => ({ ...dc, _origem_vinculo: v.descricao }))
              );
            }
            if (f.despesas_orgao_partidario) {
              servicosPart = servicosPart.concat(
                f.despesas_orgao_partidario.map(dp => ({ ...dp, _origem_vinculo: v.descricao }))
              );
            }
          }
          if (v.tipo === 'receita_candidato' && v.detalhes?.receitas_candidato) {
            doacoesCand = doacoesCand.concat(
              v.detalhes.receitas_candidato.map(r => ({ ...r, _origem_vinculo: v.descricao }))
            );
          }
          if (v.tipo === 'receita_orgao_partidario' && v.detalhes?.receitas_orgao_partidario) {
            doacoesPart = doacoesPart.concat(
              v.detalhes.receitas_orgao_partidario.map(r => ({ ...r, _origem_vinculo: v.descricao }))
            );
          }
          if (v.tipo === 'tcu_contas_irregulares' && v.detalhes?.contas_irregulares) {
            tcuItems = tcuItems.concat(
              v.detalhes.contas_irregulares.map(item => ({ ...item, _tcu_tipo: 'Contas Irregulares', _origem_vinculo: v.descricao }))
            );
          }
          if (v.tipo === 'tcu_inabilitado' && v.detalhes?.inabilitados) {
            tcuItems = tcuItems.concat(
              v.detalhes.inabilitados.map(item => ({ ...item, _tcu_tipo: 'Inabilitado', _origem_vinculo: v.descricao }))
            );
          }
          if (v.tipo === 'tcu_inidoneo' && v.detalhes?.inidoneos) {
            tcuItems = tcuItems.concat(
              v.detalhes.inidoneos.map(item => ({ ...item, _tcu_tipo: 'Inidôneo', _origem_vinculo: v.descricao }))
            );
          }
        });

        secs.push({
          key: `doc_${secs.length}`,
          docMeta,
          items: { servicos_candidatos: servicosCand, servicos_partidos: servicosPart, doacoes_candidatos: doacoesCand, doacoes_partidos: doacoesPart, tcu: tcuItems },
          hasAny: servicosCand.length > 0 || servicosPart.length > 0 || doacoesCand.length > 0 || doacoesPart.length > 0 || tcuItems.length > 0,
        });
      });
    });

    return secs;
  }, [data]);

  const grupos = useMemo(() => {
    const principal = { label: 'Empresa contratada', docs: [] };
    const socios = { label: 'Sócio(s) da empresa', docs: [] };

    sections.forEach((sec, idx) => {
      if (sec.docMeta.origem === 'principal') {
        principal.docs.push({ secIdx: idx, sec });
      } else {
        socios.docs.push({ secIdx: idx, sec });
      }
    });

    const result = [];
    if (principal.docs.length > 0) result.push(principal);
    if (socios.docs.length > 0) result.push(socios);
    return result;
  }, [sections]);

  const totalVinculos = sections.reduce((acc, s) => {
    let cnt = 0;
    Object.values(s.items).forEach(arr => cnt += arr.length);
    return acc + cnt;
  }, 0);

  function handleToggleSection(secIdx, tipo) {
    if (selectedSecIdx === secIdx && selectedTipo === tipo) {
      setSelectedSecIdx(null);
      setSelectedTipo(null);
    } else {
      setSelectedSecIdx(secIdx);
      setSelectedTipo(tipo);
    }
  }

  const activeItems = selectedSecIdx !== null && selectedTipo !== null
    ? sections[selectedSecIdx]?.items[selectedTipo] || []
    : [];
  const activeSec = selectedSecIdx !== null ? sections[selectedSecIdx] : null;

  if (totalVinculos === 0) {
    return (
      <div className="ad-section">
        <div className="ad-topo">
          <h2>Análise Detalhada</h2>
          <span className="ad-info">{licitacao?.numeroControlePNCP} · {licitacao?.fornecedor}</span>
          <div className="lp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <p className="ad-empty">Nenhum vínculo político encontrado nesta licitação.</p>
      </div>
    );
  }

  return (
    <div className="ad-section">
      <div className="ad-topo">
        <h2>Análise Detalhada</h2>
        <span className="ad-info">{licitacao?.fornecedor} · {licitacao?.numeroControlePNCP}</span>
        <div className="lp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
        </div>
      </div>

      <p className="ad-subtitle">
        Análise detalhada da ligação política da empresa <strong>{licitacao?.fornecedor}</strong> com os candidatos e partidos da eleição de 2024
      </p>

      <div className="ad-docs-list">
        {grupos.map((grp, gi) => (
          <div key={gi} className="ad-doc-group-section">
            <h3 className="ad-doc-group-title">{grp.label}</h3>
            {grp.docs.map(({ secIdx, sec }) => {
              const isSelected = selectedSecIdx === secIdx;
              return (
                <div key={secIdx} className={`ad-doc-card ${isSelected ? 'selected' : ''}`}>
                  <div className="ad-doc-card-header">
                    <div className="ad-doc-card-meta">
                      <span className="ad-doc-card-name">{sec.docMeta.nome || sec.docMeta.documento_input || 'Documento'}</span>
                      <span className="ad-doc-card-doc">{sec.docMeta.documento_normalizado}</span>
                      {sec.docMeta.parcial && <span className="lp-res-parcial">parcial</span>}
                      <span className="ad-doc-card-origem">{sec.docMeta.origem === 'socio' ? 'Sócio' : 'Principal'}</span>
                    </div>
                    <span className="ad-doc-card-total">{totalVinculos} vinculo{totalVinculos !== 1 ? 's' : ''}</span>
                  </div>
                  {isSelected && (
                    <div className="ad-doc-card-meta-expanded">
                      <DocumentoMeta doc={sec.docMeta} onIdClick={onIdClick} />
                    </div>
                  )}
                  <div className="ad-doc-card-actions">
                    {CATEGORIAS.map(tipo => {
                      const qtd = sec.items[tipo].length;
                      const isActive = isSelected && selectedTipo === tipo;
                      return (
                        <button
                          key={tipo}
                          className={`ad-s-btn ${isActive ? 'ativo' : ''}`}
                          onClick={() => handleToggleSection(secIdx, tipo)}
                          disabled={qtd === 0}
                        >
                          {SUB_LABELS[tipo]}
                          {qtd > 0 && <span className="ad-s-cnt">{qtd}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {isSelected && (
                    <div className="ad-doc-card-content">
                      {selectedTipo && (
                        <div className="ad-entity-view">
                          <h3 className="ad-view-title">{SUB_LABELS[selectedTipo]}</h3>
                          {selectedTipo === 'tcu' ? (
                            <TCUListView items={activeItems} onIdClick={onIdClick} />
                          ) : (
                            <ItemListView items={activeItems} titulo={SUB_LABELS[selectedTipo]} onIdClick={onIdClick} />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
