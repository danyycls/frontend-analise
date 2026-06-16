import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import API_BASE_URL from '../config';
import './AnaliseDeputados.css';

const SECOES_ESTATICAS = [
  { key: 'frente', label: 'Frente Parlamentar' },
  { key: 'historico', label: 'Histórico' },
  { key: 'mandatos', label: 'Mandatos Externos' },
];

function fmtDoc(d) {
  if (!d) return '';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

function formatValor(v) {
  if (v == null) return '-';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SectionFrente({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhuma frente parlamentar encontrada.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Frentes Parlamentares</h3>
      <div className="ad-card-grid">
        {dados.map((f, i) => (
          <div key={i} className="ad-card">
            <div className="ad-card-header">{f.titulo || '-'}</div>
            <div className="ad-card-body">
              <span className="ad-card-tag">Leg. {f.idLegislatura}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHistorico({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhum histórico encontrado.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Histórico de Mandato</h3>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Partido</th>
              <th>UF</th>
              <th>Situação</th>
              <th>Condição</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((h, i) => (
              <tr key={i}>
                <td>{h.dataHora || '-'}</td>
                <td>{h.siglaPartido || '-'}</td>
                <td>{h.siglaUf || '-'}</td>
                <td>{h.situacao || '-'}</td>
                <td>{h.condicaoEleitoral || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionMandatos({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhum mandato externo encontrado.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Mandatos Externos</h3>
      <div className="ad-card-grid">
        {dados.map((m, i) => (
          <div key={i} className="ad-card">
            <div className="ad-card-header">{m.cargo || '-'}</div>
            <div className="ad-card-body">
              <div className="ad-card-row"><span className="ad-card-label">Município:</span> {m.municipio || '-'}/{m.siglaUf || '-'}</div>
              <div className="ad-card-row"><span className="ad-card-label">Período:</span> {m.anoInicio || '-'} ~ {m.anoFim || '-'}</div>
              {m.siglaPartidoEleicao ? <div className="ad-card-row"><span className="ad-card-label">Partido:</span> {m.siglaPartidoEleicao}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecaoGeral({ deputado }) {
  if (!deputado) return null;
  const u = deputado.ultimoStatus || {};
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Informações Gerais</h3>
      <div className="ad-info-grid">
        <div className="ad-info-item">
          <span className="ad-info-label">Nome Civil</span>
          <span className="ad-info-value">{deputado.nomeCivil || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">CPF</span>
          <span className="ad-info-value">{fmtDoc(deputado.cpf)}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Data de Nascimento</span>
          <span className="ad-info-value">{deputado.dataNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Sexo</span>
          <span className="ad-info-value">{deputado.sexo || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">UF de Nascimento</span>
          <span className="ad-info-value">{deputado.ufNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Município</span>
          <span className="ad-info-value">{deputado.municipioNascimento || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Escolaridade</span>
          <span className="ad-info-value">{deputado.escolaridade || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Partido</span>
          <span className="ad-info-value">{u.siglaPartido || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">UF</span>
          <span className="ad-info-value">{u.siglaUf || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Situação</span>
          <span className="ad-info-value">{u.situacao || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Condição Eleitoral</span>
          <span className="ad-info-value">{u.condicaoEleitoral || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Email</span>
          <span className="ad-info-value">{u.email || '-'}</span>
        </div>
        <div className="ad-info-item">
          <span className="ad-info-label">Gabinete</span>
          <span className="ad-info-value">
            {u.gabinete ? `${u.gabinete.nome || ''} ${u.gabinete.predio || ''} ${u.gabinete.sala || ''}`.trim() || '-' : '-'}
          </span>
        </div>
        {deputado.urlWebsite && (
          <div className="ad-info-item ad-info-item-full">
            <span className="ad-info-label">Website</span>
            <span className="ad-info-value">
              <a href={deputado.urlWebsite} target="_blank" rel="noopener noreferrer" className="ad-link">{deputado.urlWebsite}</a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TabelaDespesas({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhuma despesa encontrada.</p>;
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Fornecedor</th>
            <th>Valor</th>
            <th>Documento</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d, i) => (
            <tr key={i}>
              <td>{d.dataDocumento || '-'}</td>
              <td>{d.tipoDespesa || d.tipoDocumento || '-'}</td>
              <td>{d.nomeFornecedor || fmtDoc(d.cnpjCpfFornecedor) || '-'}</td>
              <td>{formatValor(d.valorLiquido)}</td>
              <td>
                {d.urlDocumento ? (
                  <a href={d.urlDocumento} target="_blank" rel="noopener noreferrer" className="ad-link">Ver</a>
                ) : (
                  d.numDocumento || '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardGridOrgaos({ dados }) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhum órgão encontrado.</p>;
  return (
    <div className="ad-card-grid">
      {dados.map((o, i) => (
        <div key={i} className="ad-card">
          <div className="ad-card-header">
            {o.siglaOrgao ? <span className="ad-card-tag ad-card-tag-orgao">{o.siglaOrgao}</span> : null}
            {o.nomeOrgao || '-'}
          </div>
          <div className="ad-card-body">
            <div className="ad-card-row"><span className="ad-card-label">Título:</span> {o.titulo || '-'}</div>
            <div className="ad-card-row"><span className="ad-card-label">Período:</span> {o.dataInicio || '-'} ~ {o.dataFim || '-'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QueryForm({ campos, onBuscar, loading }) {
  const [params, setParams] = useState({});
  return (
    <div className="ad-query-form">
      <div className="ad-query-form-grid">
        {campos.map(campo => (
          <div key={campo.name} className="ad-query-form-group">
            <label className="ad-query-form-label">{campo.label}</label>
            <input
              className="ad-query-form-input"
              type={campo.type}
              placeholder={campo.placeholder}
              value={params[campo.name] || ''}
              onChange={e => setParams(prev => ({ ...prev, [campo.name]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button
        className="btn btn-accent"
        onClick={() => onBuscar(params)}
        disabled={loading}
      >
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  );
}

function GridDeputados({ deputados, detalheLoading, onDetalhes }) {
  return (
    <div className="ad-grid">
      {deputados.map(dep => (
        <div key={dep.id} className="ad-card-dep">
          <img
            className="ad-foto"
            src={dep.urlFoto}
            alt={dep.nome}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="ad-card-dep-info">
            <strong className="ad-card-dep-nome">{dep.nome}</strong>
            <span className="ad-card-dep-partido">
              <span className="tag tag-candidato">{dep.siglaPartido}</span>
              <span className="ad-card-dep-uf">{dep.siglaUf}</span>
            </span>
          </div>
          <button
            className="btn btn-sm btn-outline-accent"
            onClick={() => onDetalhes(dep)}
            disabled={detalheLoading === dep.id}
          >
            {detalheLoading === dep.id ? '...' : 'Detalhes'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AnaliseDeputados({ onFechar }) {
  const [deputados, setDeputados] = useState([]);
  const [deputadosLoading, setDeputadosLoading] = useState(false);
  const [deputadosErro, setDeputadosErro] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [subTabs, setSubTabs] = useState([]);
  const [subTabAtiva, setSubTabAtiva] = useState('lista');
  const [dadosCache, setDadosCache] = useState({});
  const [subSecao, setSubSecao] = useState({});
  const [detalheLoading, setDetalheLoading] = useState(null);
  const [queryTabs, setQueryTabs] = useState({});
  const [queryTabAtiva, setQueryTabAtiva] = useState({});

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroPartido, setFiltroPartido] = useState('');
  const [filtroUf, setFiltroUf] = useState('');

  const subTabsRef = useRef(subTabs);
  subTabsRef.current = subTabs;
  const dadosCacheRef = useRef(dadosCache);
  dadosCacheRef.current = dadosCache;
  const queryTabsRef = useRef(queryTabs);
  queryTabsRef.current = queryTabs;

  const deputadosFiltrados = useMemo(() => {
    return deputados.filter(d => {
      const nomeMatch = !filtroNome || (d.nome || '').toLowerCase().includes(filtroNome.toLowerCase());
      const partidoMatch = !filtroPartido || (d.siglaPartido || '').toLowerCase().includes(filtroPartido.toLowerCase());
      const ufMatch = !filtroUf || (d.siglaUf || '').toLowerCase() === filtroUf.toLowerCase();
      return nomeMatch && partidoMatch && ufMatch;
    });
  }, [deputados, filtroNome, filtroPartido, filtroUf]);

  const nomesUnicos = useMemo(() => {
    const s = new Set(deputados.map(d => d.nome).filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [deputados]);

  const partidosUnicos = useMemo(() => {
    const s = new Set(deputados.map(d => d.siglaPartido).filter(Boolean));
    return [...s].sort();
  }, [deputados]);

  const ufsUnicos = useMemo(() => {
    const s = new Set(deputados.map(d => d.siglaUf).filter(Boolean));
    return [...s].sort();
  }, [deputados]);

  const carregarDeputados = useCallback(async (params, append) => {
    if (!params) {
      params = { idLegislatura: '57', itens: '100', ordenarPor: 'nome', ordem: 'asc' };
    }
    setDeputadosLoading(true);
    setDeputadosErro(null);
    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const resp = await fetch(`${API_BASE_URL}/camara/deputados?${qs}`);
      const json = await resp.json();
      const novos = json.dados || [];
      setDeputados(prev => append ? [...prev, ...novos] : novos);
      setPaginaAtual(Number(params.pagina) || 1);
    } catch (err) {
      setDeputadosErro(err.message);
    }
    setDeputadosLoading(false);
  }, []);

  const [autoLoaded, setAutoLoaded] = useState(false);

  useEffect(() => {
    if (!autoLoaded) {
      setAutoLoaded(true);
      carregarDeputados();
    }
  }, [autoLoaded, carregarDeputados]);

  const abrirDetalhe = useCallback(async (dep) => {
    const id = dep.id;
    if (!subTabsRef.current.some(t => t.id === id)) {
      setSubTabs(prev => [...prev, { id, nome: dep.nome, urlFoto: dep.urlFoto, siglaPartido: dep.siglaPartido }]);
    }
    setSubTabAtiva(String(id));

    if (!dadosCacheRef.current[id]) {
      setDetalheLoading(id);
      try {
        const resp = await fetch(`${API_BASE_URL}/camara/deputados/${id}/completo`);
        const json = await resp.json();
        setDadosCache(prev => ({ ...prev, [id]: json }));
        setSubSecao(prev => ({ ...prev, [id]: 'geral' }));
      } catch (err) {
        console.error('Erro ao buscar detalhes do deputado:', err);
      }
      setDetalheLoading(null);
    }
  }, []);

  const fecharSubTab = useCallback((id) => {
    setSubTabs(prev => prev.filter(t => t.id !== id));
    setSubTabAtiva(prev => {
      if (prev !== String(id)) return prev;
      const rest = subTabsRef.current.filter(t => t.id !== id);
      return rest.length > 0 ? String(rest[rest.length - 1].id) : 'lista';
    });
  }, []);

  const alterarSubSecao = useCallback((depId, secao) => {
    setSubSecao(prev => ({ ...prev, [depId]: secao }));
  }, []);

  const novaFormTab = useCallback((depId, tipo) => {
    setSubSecao(prev => ({ ...prev, [depId]: tipo }));
    const currentTabs = queryTabsRef.current[depId] || [];
    const existingForm = currentTabs.find(t => t.isForm && t.tipo === tipo);
    if (existingForm) {
      setQueryTabAtiva(prev => ({ ...prev, [depId]: existingForm.id }));
      return;
    }
    const tabId = `${tipo}-form-${Date.now()}`;
    setQueryTabs(prev => ({
      ...prev,
      [depId]: [...(prev[depId] || []), { id: tabId, tipo, isForm: true, label: tipo === 'despesas' ? 'Nova Despesas' : 'Novo Órgãos' }],
    }));
    setQueryTabAtiva(prev => ({ ...prev, [depId]: tabId }));
  }, []);

  const fecharQueryTab = useCallback((depId, tabId) => {
    setQueryTabs(prev => {
      const tabs = (prev[depId] || []).filter(t => t.id !== tabId);
      const next = { ...prev };
      if (tabs.length === 0) delete next[depId];
      else next[depId] = tabs;
      return next;
    });
    setQueryTabAtiva(prev => {
      if (prev[depId] !== tabId) return prev;
      const next = { ...prev };
      delete next[depId];
      return next;
    });
  }, []);

  const buscarQuery = useCallback(async (depId, formTabId, params) => {
    const tabs = queryTabsRef.current[depId] || [];
    const tab = tabs.find(t => t.id === formTabId);
    if (!tab || !tab.isForm) return;
    const tipo = tab.tipo;

    const filtroStr = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    const label = `${tipo === 'despesas' ? 'Despesas' : 'Órgãos'}${filtroStr ? ` (${filtroStr})` : ''}`;
    const resultTabId = `${tipo}-${Date.now()}`;

    setQueryTabs(prev => ({
      ...prev,
      [depId]: [...(prev[depId] || []), { id: resultTabId, tipo, label, params, dados: null, loading: true }],
    }));
    setQueryTabAtiva(prev => ({ ...prev, [depId]: resultTabId }));

    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const resp = await fetch(`${API_BASE_URL}/camara/deputados/${depId}/${tipo}?${qs}`);
      const json = await resp.json();
      setQueryTabs(prev => ({
        ...prev,
        [depId]: (prev[depId] || []).map(t =>
          t.id === resultTabId ? { ...t, dados: json.dados || [], loading: false } : t
        ),
      }));
    } catch (err) {
      setQueryTabs(prev => ({
        ...prev,
        [depId]: (prev[depId] || []).map(t =>
          t.id === resultTabId ? { ...t, dados: [], loading: false, erro: err.message } : t
        ),
      }));
    }
  }, []);

  const renderSecaoEstatica = (depId, secao) => {
    const dados = dadosCache[depId];
    if (!dados) return null;
    if (secao === 'frente') return <SectionFrente dados={dados.frentes} />;
    if (secao === 'historico') return <SectionHistorico dados={dados.historico} />;
    if (secao === 'mandatos') return <SectionMandatos dados={dados.mandatosExternos} />;
    return null;
  };

  const isTabAtiva = (id) => subTabAtiva === id;

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">Análise de Deputados</h2>
        <p className="tab-desc">Consulte informações detalhadas dos deputados federais em exercício.</p>
      </div>

      <div className="lp-sub-tabs">
        <button
          className={`lp-sub-tab ${subTabAtiva === 'lista' ? 'ativo' : ''}`}
          onClick={() => setSubTabAtiva('lista')}
        >
          Lista
        </button>
        {subTabs.map(t => {
          const key = String(t.id);
          return (
            <button
              key={key}
              className={`lp-sub-tab ${subTabAtiva === key ? 'ativo' : ''}`}
              onClick={() => setSubTabAtiva(key)}
            >
              <span className="ad-subtab-nome">{t.nome}</span>
              <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); fecharSubTab(t.id); }}>×</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: isTabAtiva('lista') ? '' : 'none' }}>
        <h3 className="ad-section-title">Deputados em Exercício</h3>
        <p className="ad-query-form-desc">
          {deputados.length > 0
            ? `${deputados.length} deputados encontrados. Clique em "Detalhes" para ver informações completas.`
            : 'Carregando lista...'}
        </p>

        {deputadosLoading && deputados.length === 0 && (
          <div className="ad-loading">Carregando deputados...</div>
        )}
        {deputadosErro && <p className="ad-error">Erro: {deputadosErro}</p>}

        {deputados.length > 0 && (
          <>
            <div className="ad-query-form-grid" style={{ marginBottom: 8 }}>
              <input
                className="ad-query-form-input"
                style={{ flex: 1, maxWidth: 300 }}
                placeholder="Filtrar por nome..."
                value={filtroNome}
                onChange={e => setFiltroNome(e.target.value)}
              />
              <input
                className="ad-query-form-input"
                style={{ flex: 1, maxWidth: 120 }}
                placeholder="Filtrar por partido..."
                value={filtroPartido}
                onChange={e => setFiltroPartido(e.target.value)}
              />
              <input
                className="ad-query-form-input"
                style={{ flex: 1, maxWidth: 80 }}
                placeholder="UF"
                value={filtroUf}
                onChange={e => setFiltroUf(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                {deputadosFiltrados.length} de {deputados.length} registros
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="ad-query-form-input"
                style={{ maxWidth: 300 }}
                value={filtroNome}
                onChange={e => setFiltroNome(e.target.value)}
              >
                <option value="">Todos os nomes (texto livre)</option>
                {nomesUnicos.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                className="ad-query-form-input"
                style={{ maxWidth: 120 }}
                value={filtroPartido}
                onChange={e => setFiltroPartido(e.target.value)}
              >
                <option value="">Todos os partidos (texto livre)</option>
                {partidosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                className="ad-query-form-input"
                style={{ maxWidth: 80 }}
                value={filtroUf}
                onChange={e => setFiltroUf(e.target.value)}
              >
                <option value="">Todas as UFs</option>
                {ufsUnicos.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <GridDeputados
              deputados={deputadosFiltrados}
              detalheLoading={detalheLoading}
              onDetalhes={abrirDetalhe}
            />

            <div className="ad-grid-footer">
              <span className="ad-grid-count">{deputados.length} deputados carregados</span>
              <button
                className="btn btn-sm btn-outline-accent"
                disabled={deputadosLoading}
                onClick={() => {
                  const proxPagina = paginaAtual + 1;
                  carregarDeputados({
                    idLegislatura: '57', itens: '100',
                    ordenarPor: 'nome', ordem: 'asc',
                    pagina: String(proxPagina),
                  }, true);
                }}
              >
                {deputadosLoading ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          </>
        )}

        {!deputadosLoading && deputados.length === 0 && !deputadosErro && (
          <p className="ad-empty">Nenhum deputado encontrado.</p>
        )}
      </div>

      {subTabs.map(t => {
        const key = String(t.id);
        const dados = dadosCache[t.id];
        const carregando = detalheLoading === t.id;
        const queryTabsDoDep = queryTabs[t.id] || [];
        const queryAtiva = queryTabAtiva[t.id];

        return (
          <div key={key} style={{ display: isTabAtiva(key) ? '' : 'none' }}>
            {dados && dados.deputado && (
              <div className="ad-dep-header">
                <img
                  className="ad-dep-foto"
                  src={dados.deputado.ultimoStatus?.urlFoto || t.urlFoto}
                  alt={t.nome}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="ad-dep-header-info">
                  <h3 className="ad-dep-nome">{t.nome}</h3>
                  <div className="ad-dep-tags">
                    <span className="tag tag-candidato">{dados.deputado.ultimoStatus?.siglaPartido || t.siglaPartido}</span>
                    <span className="tag tag-accent">{dados.deputado.ultimoStatus?.siglaUf || '-'}</span>
                    <span className="tag tag-accent">{dados.deputado.ultimoStatus?.situacao || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {carregando ? (
              <div className="ad-loading">Carregando dados completos...</div>
            ) : dados ? (
              <>
                <div className="ad-secao-btns">
                  <button
                    className={`ad-secao-btn ${(subSecao[t.id] || 'geral') === 'geral' ? 'ativo' : ''}`}
                    onClick={() => alterarSubSecao(t.id, 'geral')}
                  >
                    Informações Gerais
                  </button>
                  <button
                    className={`ad-secao-btn ${(subSecao[t.id] || 'geral') === 'despesas' ? 'ativo' : ''}`}
                    onClick={() => novaFormTab(t.id, 'despesas')}
                  >
                    Despesas
                  </button>
                  <button
                    className={`ad-secao-btn ${(subSecao[t.id] || 'geral') === 'orgaos' ? 'ativo' : ''}`}
                    onClick={() => novaFormTab(t.id, 'orgaos')}
                  >
                    Órgãos
                  </button>
                  {SECOES_ESTATICAS.map(s => {
                    const chave = s.key === 'frente' ? 'frentes' : s.key === 'mandatos' ? 'mandatosExternos' : s.key;
                    const qtde = Array.isArray(dados[chave]) ? dados[chave].length : 0;
                    return (
                      <button
                        key={s.key}
                        className={`ad-secao-btn ${(subSecao[t.id] || 'geral') === s.key ? 'ativo' : ''}`}
                        onClick={() => alterarSubSecao(t.id, s.key)}
                      >
                        {s.label} {qtde > 0 && <span className="ad-secao-badge">{qtde}</span>}
                      </button>
                    );
                  })}
                </div>

                {(subSecao[t.id] || 'geral') === 'geral' ? (
                  <SecaoGeral deputado={dados.deputado} />
                ) : subSecao[t.id] === 'despesas' || subSecao[t.id] === 'orgaos' ? (
                  <>
                    <div className="ad-query-sub-tabs">
                      {queryTabsDoDep.filter(qt => qt.tipo === subSecao[t.id]).map(qt => (
                        <button
                          key={qt.id}
                          className={`ad-query-sub-tab ${queryAtiva === qt.id ? 'ativo' : ''}`}
                          onClick={() => setQueryTabAtiva(prev => ({ ...prev, [t.id]: qt.id }))}
                        >
                          {qt.isForm ? (
                            <span className="ad-query-form-label-icon">+</span>
                          ) : null}
                          {qt.label}
                          {!qt.isForm && qt.dados && !qt.loading && (
                            <span className="ad-secao-badge">{qt.dados.length}</span>
                          )}
                          {!qt.isForm && qt.loading && (
                            <span className="ad-secao-badge ad-secao-badge-loading">...</span>
                          )}
                          <span
                            className="lp-sub-tab-fechar"
                            onClick={(e) => { e.stopPropagation(); fecharQueryTab(t.id, qt.id); }}
                          >×</span>
                        </button>
                      ))}
                    </div>

                    {queryTabsDoDep.filter(qt => qt.tipo === subSecao[t.id]).map(qt => {
                      if (queryAtiva !== qt.id) return null;

                      if (qt.isForm) {
                        const campos = qt.tipo === 'despesas'
                          ? [
                              { name: 'ano', label: 'Ano', type: 'number', placeholder: 'Ex: 2024' },
                              { name: 'mes', label: 'Mês', type: 'number', placeholder: 'Ex: 1' },
                              { name: 'tipoDespesa', label: 'Tipo', type: 'text', placeholder: 'Código da despesa' },
                              { name: 'cnpjCpfFornecedor', label: 'CNPJ/CPF', type: 'text', placeholder: 'Fornecedor' },
                              { name: 'itens', label: 'Itens', type: 'number', placeholder: 'Ex: 100' },
                            ]
                          : [
                              { name: 'dataInicio', label: 'Data Início', type: 'text', placeholder: 'Ex: 2023-01-01' },
                              { name: 'dataFim', label: 'Data Fim', type: 'text', placeholder: 'Ex: 2024-12-31' },
                            ];
                        return (
                          <div key={qt.id} className="ad-query-tab-content">
                            <h3 className="ad-section-title">
                              {qt.tipo === 'despesas' ? 'Despesas Parlamentares' : 'Órgãos'}
                            </h3>
                            <p className="ad-query-form-desc">
                              Preencha os filtros desejados e clique em Buscar. Cada busca abre uma nova aba com os resultados.
                            </p>
                            <QueryForm
                              campos={campos}
                              loading={queryTabsDoDep.some(t => t.loading)}
                              onBuscar={(params) => buscarQuery(t.id, qt.id, params)}
                            />
                          </div>
                        );
                      }

                      if (qt.loading) {
                        return (
                          <div key={qt.id} className="ad-query-tab-content">
                            <div className="ad-loading">Buscando...</div>
                          </div>
                        );
                      }

                      return (
                        <div key={qt.id} className="ad-query-tab-content">
                          <h4 className="ad-section-title">{qt.label}</h4>
                          {qt.tipo === 'despesas' ? (
                            <TabelaDespesas dados={qt.dados} />
                          ) : (
                            <CardGridOrgaos dados={qt.dados} />
                          )}
                          {qt.erro && <p className="ad-error">Erro: {qt.erro}</p>}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  renderSecaoEstatica(t.id, subSecao[t.id])
                )}
              </>
            ) : (
              <p className="ad-empty">Nenhum dado disponível.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
