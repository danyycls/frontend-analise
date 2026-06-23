// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '@/shared/config';
import SecaoGeralDeputado from '@/entities/deputado/ui/DeputadoSecaoGeral';
import TabelaDespesasDeputado from '@/entities/deputado/ui/DeputadoDespesas';
import CardGridOrgaosDeputado from '@/entities/deputado/ui/DeputadoOrgaos';
import './AnaliseDeputados.css';

const SECOES_ESTATICAS = [
  { key: 'frente', label: 'Frente Parlamentar' },
  { key: 'historico', label: 'Histórico' },
  { key: 'mandatos', label: 'Mandatos Externos' },
];

function SectionFrente({ dados }) {
  if (!Array.isArray(dados) || dados.length === 0) return <p className="ad-empty">Nenhuma frente parlamentar encontrada.</p>;
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
  if (!Array.isArray(dados) || dados.length === 0) return <p className="ad-empty">Nenhum histórico encontrado.</p>;
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
  if (!Array.isArray(dados) || dados.length === 0) return <p className="ad-empty">Nenhum mandato externo encontrado.</p>;
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

export default function DeputadoDetailView({ deputadoId, onFechar }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [subSecao, setSubSecao] = useState('geral');
  const [queryTabs, setQueryTabs] = useState([]);
  const [queryTabAtiva, setQueryTabAtiva] = useState(null);
  const queryTabsRef = useRef(queryTabs);
  queryTabsRef.current = queryTabs;

  useEffect(() => {
    if (!deputadoId) return;
    setLoading(true);
    setErro(null);
    fetch(`${API_BASE_URL}/deputados/${deputadoId}/completo`)
      .then(r => {
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      })
      .then(data => {
        setDados(data);
        setLoading(false);
      })
      .catch(e => {
        setErro(e.message);
        setLoading(false);
      });
  }, [deputadoId]);

  const novaFormTab = useCallback((tipo) => {
    setSubSecao(tipo);
    const currentTabs = queryTabsRef.current;
    const existingForm = currentTabs.find(t => t.isForm && t.tipo === tipo);
    if (existingForm) {
      setQueryTabAtiva(existingForm.id);
      return;
    }
    const tabId = `${tipo}-form-${Date.now()}`;
    setQueryTabs(prev => [
      ...prev,
      { id: tabId, tipo, isForm: true, label: tipo === 'despesas' ? 'Nova Despesas' : 'Novo Órgãos' },
    ]);
    setQueryTabAtiva(tabId);
  }, []);

  const fecharQueryTab = useCallback((tabId) => {
    setQueryTabs(prev => prev.filter(t => t.id !== tabId));
    setQueryTabAtiva(prev => prev === tabId ? null : prev);
  }, []);

  const buscarQuery = useCallback(async (formTabId, params) => {
    const tabs = queryTabsRef.current;
    const tab = tabs.find(t => t.id === formTabId);
    if (!tab || !tab.isForm) return;
    const tipo = tab.tipo;

    const filtroStr = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    const label = `${tipo === 'despesas' ? 'Despesas' : 'Órgãos'}${filtroStr ? ` (${filtroStr})` : ''}`;
    const resultTabId = `${tipo}-${Date.now()}`;

    setQueryTabs(prev => [
      ...prev,
      { id: resultTabId, tipo, label, params, dados: null, loading: true },
    ]);
    setQueryTabAtiva(resultTabId);

    try {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v))
      ).toString();
      const resp = await fetch(`${API_BASE_URL}/deputados/${deputadoId}/${tipo}?${qs}`);
      const json = await resp.json();
      setQueryTabs(prev =>
        prev.map(t =>
          t.id === resultTabId ? { ...t, dados: json.dados || [], loading: false } : t
        ),
      );
    } catch (err) {
      setQueryTabs(prev =>
        prev.map(t =>
          t.id === resultTabId ? { ...t, dados: [], loading: false, erro: err.message } : t
        ),
      );
    }
  }, [deputadoId]);

  const renderSecaoEstatica = (secao) => {
    if (!dados) return null;
    if (secao === 'frente') return <SectionFrente dados={dados.frentes} />;
    if (secao === 'historico') return <SectionHistorico dados={dados.historico} />;
    if (secao === 'mandatos') return <SectionMandatos dados={dados.mandatosExternos} />;
    return null;
  };

  if (loading) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <h3>Carregando...</h3>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <div className="estado-detalhe-loading"><div className="spinner" /> Carregando dados do deputado...</div>
    </div>
  );

  if (erro) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <h3>Erro</h3>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <p style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>Erro ao carregar detalhes: {erro}</p>
    </div>
  );

  const dep = dados?.deputado ?? dados;
  if (!dep) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <h3>Deputado não encontrado</h3>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Dados do deputado não disponíveis</p>
    </div>
  );

  const u = dep.ultimoStatus || {};

  return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          {u.urlFoto && <img className="ad-dep-foto" src={u.urlFoto} alt={dep.nomeCivil || u.nome} onError={(e) => { e.target.style.display = 'none'; }} />}
          <div>
            <h3>{dep.nomeCivil || u.nome || '-'}</h3>
            <div className="ad-dep-tags">
              <span className="tag tag-candidato">{u.siglaPartido || '-'}</span>
              <span className="tag tag-partido">{u.siglaUf || '-'}</span>
              <span className="tag tag-accent">{u.situacao || '-'}</span>
            </div>
          </div>
        </div>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>

      <div className="ad-secao-btns">
        <button className={`ad-secao-btn ${subSecao === 'geral' ? 'ativo' : ''}`} onClick={() => setSubSecao('geral')}>Informações Gerais</button>
        <button className={`ad-secao-btn ${subSecao === 'despesas' ? 'ativo' : ''}`} onClick={() => novaFormTab('despesas')}>Despesas</button>
        <button className={`ad-secao-btn ${subSecao === 'orgaos' ? 'ativo' : ''}`} onClick={() => novaFormTab('orgaos')}>Órgãos</button>
        {SECOES_ESTATICAS.map(s => {
          const chave = s.key === 'frente' ? 'frentes' : s.key === 'mandatos' ? 'mandatosExternos' : s.key;
          const qtde = Array.isArray(dados[chave]) ? dados[chave].length : 0;
          return (
            <button key={s.key} className={`ad-secao-btn ${subSecao === s.key ? 'ativo' : ''}`} onClick={() => setSubSecao(s.key)}>
              {s.label} {qtde > 0 && <span className="ad-secao-badge">{qtde}</span>}
            </button>
          );
        })}
      </div>

      {subSecao === 'geral' ? (
        <SecaoGeralDeputado deputado={dep} />
      ) : subSecao === 'despesas' || subSecao === 'orgaos' ? (
        <>
          <div className="ad-query-sub-tabs">
            {queryTabs.filter(qt => qt.tipo === subSecao).map(qt => (
              <button
                key={qt.id}
                className={`ad-query-sub-tab ${queryTabAtiva === qt.id ? 'ativo' : ''}`}
                onClick={() => setQueryTabAtiva(qt.id)}
              >
                {qt.isForm ? <span className="ad-query-form-label-icon">+</span> : null}
                {qt.label}
                {!qt.isForm && qt.dados && !qt.loading && (
                  <span className="ad-secao-badge">{qt.dados.length}</span>
                )}
                {!qt.isForm && qt.loading && (
                  <span className="ad-secao-badge ad-secao-badge-loading">...</span>
                )}
                <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); fecharQueryTab(qt.id); }}>×</span>
              </button>
            ))}
          </div>

          {queryTabs.filter(qt => qt.tipo === subSecao).map(qt => {
            if (queryTabAtiva !== qt.id) return null;

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
                    loading={queryTabs.some(t => t.loading)}
                    onBuscar={(params) => buscarQuery(qt.id, params)}
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
                  <TabelaDespesasDeputado dados={qt.dados} />
                ) : (
                  <CardGridOrgaosDeputado dados={qt.dados} />
                )}
                {qt.erro && <p className="ad-error">Erro: {qt.erro}</p>}
              </div>
            );
          })}
        </>
      ) : (
        renderSecaoEstatica(subSecao)
      )}
    </div>
  );
}
