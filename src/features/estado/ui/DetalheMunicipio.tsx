// @ts-nocheck
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WS_BASE_URL } from '@/shared/config';
import { ContratoDetalhes, JanelaPopup } from '../../ligacao-politica/ui/Resultados';
import { PieChart } from './chart-utils';

function fmtMoney(v) {
  if (!v && v !== 0) return '-';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '-';
  const m = String(d).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return d;
}

const ITENS_POR_PAGINA = 10;

function usePaginacao(dados, itensPorPagina = ITENS_POR_PAGINA) {
  const [pagina, setPagina] = useState(0);
  const arr = dados || [];
  const totalPaginas = Math.max(1, Math.ceil(arr.length / itensPorPagina));
  const inicio = pagina * itensPorPagina;
  const paginaDados = arr.slice(inicio, inicio + itensPorPagina);
  return { pagina, setPagina, totalPaginas, paginaDados };
}

function Paginacao({ pagina, totalPaginas, onPagina }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="dm-paginacao">
      <button className="pagina-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>◀</button>
      <span className="pagina-info">{pagina + 1} / {totalPaginas}</span>
      <button className="pagina-btn" disabled={pagina >= totalPaginas - 1} onClick={() => onPagina(pagina + 1)}>▶</button>
    </div>
  );
}

const PAGE_SECTIONS = [
  { id: 'municipio-licitacoes', label: 'Licitações' },
  { id: 'municipio-recursos', label: 'Recursos' },
];

function PageNav() {
  const [active, setActive] = useState('municipio-licitacoes');

  useEffect(() => {
    const ids = PAGE_SECTIONS.map((s) => s.id);
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <nav className="estado-page-nav">
      {PAGE_SECTIONS.map((section) => (
        <button
          key={section.id}
          className={`page-nav-item ${active === section.id ? 'active' : ''}`}
          onClick={() => scrollTo(section.id)}
        >
          <span className="page-nav-dot" />
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function DetalheMunicipio({ municipio, uf, onFechar }) {
  const [licAnoInput, setLicAnoInput] = useState('');
  const [licCache, setLicCache] = useState({});
  const [licChavesSelecionadas, setLicChavesSelecionadas] = useState(new Set());
  const [licEmAndamento, setLicEmAndamento] = useState(false);
  const [licProgresso, setLicProgresso] = useState({ buscados: 0, total: 0 });
  const [licErro, setLicErro] = useState(null);
  const [licitacaoPopup, setLicitacaoPopup] = useState(null);
  const [chartPopup, setChartPopup] = useState(null);
  const licCancelRef = useRef(false);
  const wsRef = useRef(null);

  function licBuscar() {
    const ano = licAnoInput.trim();
    if (!ano.match(/^\d{4}$/)) return;

    const chave = ano;
    if (licCache[chave]) return;
    if (licEmAndamento) return;

    const fila = [chave];

    setLicEmAndamento(true);
    setLicProgresso({ buscados: 0, total: fila.length });
    setLicErro(null);
    licCancelRef.current = false;

    processarFilaWS(fila);
  }

  async function processarFilaWS(fila) {
    for (const ano of fila) {
      if (licCancelRef.current) break;

      try {
        const data = await buscaAnoWS(ano);

        if (licCancelRef.current) break;

        setLicCache(prev => ({ ...prev, [ano]: Array.isArray(data) ? data : [] }));
        setLicChavesSelecionadas(prev => new Set([...prev, ano]));
        setLicProgresso(prev => ({ ...prev, buscados: prev.buscados + 1 }));
      } catch (err) {
        if (licCancelRef.current) break;
        setLicErro(err?.message || err || 'Erro ao buscar');
        setLicProgresso(prev => ({ ...prev, buscados: prev.buscados + 1 }));
      }
    }

    setLicEmAndamento(false);
    wsRef.current = null;
  }

  function buscaAnoWS(ano) {
    return new Promise((resolve, reject) => {
      if (licCancelRef.current) return reject('cancelado');

      const ws = new WebSocket(`${WS_BASE_URL}/ws`);
      wsRef.current = ws;
      const contratos = [];

      const timeout = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        reject('Timeout ao buscar dados do município');
      }, 120000);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          channel: 'municipio_detalhes',
          codigo_ibge: municipio.id,
          exercicio: parseInt(ano),
        }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'contratos') {
            contratos.push(...(msg.data?.dados || []));
          } else if (msg.type === 'concluido') {
            clearTimeout(timeout);
            ws.close();
            resolve(contratos);
          } else if (msg.type === 'erro') {
            clearTimeout(timeout);
            ws.close();
            reject(msg.data?.erro || 'Erro desconhecido');
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject('Erro na conexão WebSocket');
      };

      ws.onclose = (e) => {
        clearTimeout(timeout);
        if (!e.wasClean && !licCancelRef.current) {
          reject('Conexão WebSocket fechada inesperadamente');
        }
      };
    });
  }

  function licCancelar() {
    licCancelRef.current = true;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }
    setLicEmAndamento(false);
  }

  function licRemoverChave(chave) {
    setLicCache(prev => {
      const next = { ...prev };
      delete next[chave];
      return next;
    });
    setLicChavesSelecionadas(prev => {
      const next = new Set(prev);
      next.delete(chave);
      return next;
    });
  }

  function licToggleChave(chave) {
    setLicChavesSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });
  }

  const licExibicao = useMemo(() => {
    let dados = [];
    licChavesSelecionadas.forEach(chave => {
      if (licCache[chave]) dados = dados.concat(licCache[chave]);
    });
    return dados;
  }, [licCache, licChavesSelecionadas]);

  const licPag = usePaginacao(licExibicao, ITENS_POR_PAGINA);

  const licChartData = useMemo(() => {
    if (!licExibicao.length) return null;
    const data = licExibicao.map(c => ({
      nome: c.categoriaProcesso?.nome || c.modalidadeNome || 'Sem categoria',
      valor: c.valorGlobal ?? c.valorTotalEstimado ?? 0,
    }));
    const grouped = new Map();
    data.forEach(d => {
      grouped.set(d.nome, (grouped.get(d.nome) || 0) + d.valor);
    });
    return Array.from(grouped.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [licExibicao]);

  const licFaixaChartData = useMemo(() => {
    if (!licExibicao.length) return null;
    const faixas = {
      'Até R$ 5 mil': 0,
      'R$ 5 mil - R$ 20 mil': 0,
      'R$ 20 mil - R$ 50 mil': 0,
      'R$ 50 mil - R$ 100 mil': 0,
      'Acima de R$ 100 mil': 0,
    };
    licExibicao.forEach(c => {
      const v = c.valorGlobal ?? c.valorTotalEstimado ?? 0;
      if (v < 5000) faixas['Até R$ 5 mil'] += v;
      else if (v < 20000) faixas['R$ 5 mil - R$ 20 mil'] += v;
      else if (v < 50000) faixas['R$ 20 mil - R$ 50 mil'] += v;
      else if (v < 100000) faixas['R$ 50 mil - R$ 100 mil'] += v;
      else faixas['Acima de R$ 100 mil'] += v;
    });
    return Object.entries(faixas)
      .filter(([_, v]) => v > 0)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [licExibicao]);

  const cacheKeys = Object.keys(licCache).sort();

  return (
    <div className="estado-page">
      <PageNav />

      <div className="estado-header" id="municipio-licitacoes">
        <h1 style={{ textTransform: 'none', fontSize: '1.2rem' }}>
          {municipio.nome}{municipio.nome !== municipio.nomeFormatado ? ` (${municipio.nomeFormatado})` : ''}
        </h1>
        {uf && <span className="uf-badge">{uf}</span>}
        {municipio.populacao > 0 && (
          <span className="pop-badge">Pop: {Number(municipio.populacao).toLocaleString('pt-BR')} hab.</span>
        )}
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>

      <div className="bcard" style={{ marginBottom: 20 }}>
        <div className="bcard-topo">
          <span className="bcard-tag tag-accent">INFO</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Fonte: PNCP — Portal Nacional de Contratações Públicas
          </span>
        </div>
        <div className="bcard-body">
          <div className="bcard-field">
            <span className="bcard-label">Município consultado</span>
            <span className="bcard-value">{municipio.nome} ({uf})</span>
          </div>
          <div className="bcard-field">
            <span className="bcard-label">Código IBGE</span>
            <span className="bcard-value">{municipio.id}</span>
          </div>
          <div className="bcard-field">
            <span className="bcard-label">Tipo de busca</span>
            <span className="bcard-value">Município</span>
          </div>
          <div className="bcard-field">
            <span className="bcard-label">Campos</span>
            <span className="bcard-value">Contrato, Tipo, Categoria, Fornecedor, Objeto, Vigência, Data Publ., Valor</span>
          </div>
        </div>
      </div>

      <div className="estado-section" style={{ padding: '12px', marginBottom: 8, background: 'var(--card-bg)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ano:</span>
        <input
          type="text"
          placeholder="2024"
          value={licAnoInput}
          onChange={e => setLicAnoInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') licBuscar(); }}
          maxLength={4}
          style={{ width: 70, padding: '6px 8px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', borderRadius: 4 }}
          disabled={licEmAndamento}
        />
        <button className="btn btn-sm" onClick={licBuscar} disabled={licEmAndamento}>
          {licEmAndamento ? '⟳ Buscando...' : 'Buscar'}
        </button>
        {licEmAndamento && (
          <button className="btn btn-sm" onClick={licCancelar} style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', color: 'var(--error)' }}>
            Cancelar
          </button>
        )}
        {cacheKeys.length > 0 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>
            {cacheKeys.length} ano(s) buscado(s)
          </span>
        )}
        {licErro && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{licErro}</span>}
      </div>

      {licEmAndamento && (
        <div style={{ padding: '8px 12px', marginBottom: 8, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
          <div className="spinner-sm" />
          <span>Progresso: {licProgresso.buscados} de {licProgresso.total} ano(s) buscado(s)</span>
        </div>
      )}

      {cacheKeys.length > 0 && (
        <div className="estado-section" style={{ padding: '8px 12px', marginBottom: 8, background: 'var(--card-bg)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Anos buscados:</span>
          {cacheKeys.map(chave => (
            <span key={chave} className="ano-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.78rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                <input type="checkbox" checked={licChavesSelecionadas.has(chave)} onChange={() => licToggleChave(chave)} style={{ margin: 0 }} />
                {chave}
              </label>
              {!licEmAndamento && (
                <button
                  onClick={() => licRemoverChave(chave)}
                  title="Remover ano"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="estado-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Licitações (PNCP) <span className="count">({licExibicao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{licChavesSelecionadas.size > 0 ? [...licChavesSelecionadas].sort().join(', ') : ''}</span></h2>
        </div>

        {licExibicao.length > 0 && (
          <>
            {licChartData && (
              <div className="chart-row">
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Licitações por Categoria', data: licChartData })}>
                  <div className="chart-card-title">Categorias</div>
                  <PieChart data={licChartData} size={240} />
                </div>
                {licFaixaChartData && (
                  <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Licitações por Faixa de Valor', data: licFaixaChartData })}>
                    <div className="chart-card-title">Faixa de Valores</div>
                    <PieChart data={licFaixaChartData} size={240} />
                  </div>
                )}
              </div>
            )}

            <table className="estado-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Fornecedor</th>
                  <th>Objeto</th>
                  <th>Vigência</th>
                  <th>Data Publ.</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {licPag.paginaDados.map((c, i) => (
                  <tr
                    key={c.numeroControlePNCP || i}
                    className="dm-row-click"
                    onClick={() => setLicitacaoPopup(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {(c.numeroControlePNCP || '').slice(-12)}
                    </td>
                    <td>{c.tipoContrato?.nome || c.modalidadeNome || '-'}</td>
                    <td>{c.categoriaProcesso?.nome || c.modalidadeNome || '-'}</td>
                    <td>{c.fornecedor?.razaoSocial || c.nomeRazaoSocialFornecedor || '-'}</td>
                    <td className="dm-obj-col">{(c.objetoContrato || '').substring(0, 60)}{(c.objetoContrato || '').length > 60 ? '…' : ''}</td>
                    <td style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{fmtDate(c.dataVigenciaInicio)} ~ {fmtDate(c.dataVigenciaFim)}</td>
                    <td style={{ fontSize: '0.7rem' }}>{fmtDate(c.dataPublicacaoPncp)}</td>
                    <td>{fmtMoney(c.valorGlobal ?? c.valorTotalEstimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginacao pagina={licPag.pagina} totalPaginas={licPag.totalPaginas} onPagina={licPag.setPagina} />
            <p className="dm-hint">Clique em um contrato para ver detalhes completos</p>
          </>
        )}
        {licExibicao.length === 0 && !licEmAndamento && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
            {cacheKeys.length === 0
              ? 'Insira um ano e clique em Buscar para carregar os dados'
              : 'Selecione ao menos um ano na lista de anos buscados'}
          </div>
        )}
      </div>

      <div className="estado-section" id="municipio-recursos">
        <h2 style={{ margin: 0 }}>Recursos Financeiros</h2>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
          Em breve detalhes de recursos financeiros por município.
        </div>
      </div>

      {chartPopup && (
        <div className="dm-modal-overlay" onClick={() => setChartPopup(null)}>
          <div className="dm-modal chart-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="dm-modal-header">
              <h3>{chartPopup.titulo}</h3>
              <button className="dm-modal-close" onClick={() => setChartPopup(null)}>×</button>
            </div>
            <div className="dm-modal-body" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <PieChart data={chartPopup.data} size={420} />
            </div>
          </div>
        </div>
      )}

      {licitacaoPopup && (
        <JanelaPopup titulo={`Licitação ${(licitacaoPopup.numeroControlePNCP || '').slice(-12)}`} onFechar={() => setLicitacaoPopup(null)}>
          <ContratoDetalhes contrato={licitacaoPopup} onIdClick={() => {}} />
        </JanelaPopup>
      )}
    </div>
  );
}
