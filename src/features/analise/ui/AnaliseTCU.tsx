// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import { api } from '@/shared/api/client';
import { fmtDoc } from '@/shared/lib/formatters';
import { usePageMemory } from '@/shared/lib/hooks';
import { InfoBadge } from '@/shared/ui/EntityInfo/EntityInfo';
import './AnaliseTCU.css';

const API_MAP = {
  'contas-irregulares': { endpoint: '/tcu/contas-irregulares', label: 'Contas Irregulares', desc: 'Consulta pessoas físicas e jurídicas com contas julgadas irregulares pelo TCU. Filtre por nome, CPF, CNPJ, UF ou município.' },
  'fins-eleitorais':    { endpoint: '/tcu/fins-eleitorais',    label: 'Fins Eleitorais',    desc: 'Consulta contas irregulares com implicação eleitoral nos últimos 8 anos. Filtre por nome, CPF, UF ou município.' },
  'inabilitados':       { endpoint: '/tcu/inabilitados',       label: 'Inabilitados',       desc: 'Consulta pessoas inabilitadas para cargo em comissão por decisão do TCU. Filtre por nome, CPF, UF ou município.' },
  'inidoneos':          { endpoint: '/tcu/inidoneos',          label: 'Inidôneos',          desc: 'Consulta empresas e pessoas inidôneas impedidas de licitar. Filtre por nome, CPF, CNPJ, UF ou município.' },
};

const METODOS = Object.entries(API_MAP).map(([key, v]) => ({ key, ...v }));

const DESC_PLACEHOLDER = {
  'contas-irregulares': 'Consulte pessoas físicas e jurídicas que tiveram contas julgadas irregulares pelo Tribunal de Contas da União. Utilize os filtros opcionais abaixo para refinar a busca por nome, CPF, CNPJ, UF ou município. Os resultados exibem número do processo, tipo de registro, acórdão e data de trânsito em julgado.',
  'fins-eleitorais': 'Consulte registros de contas julgadas irregulares pelo TCU com implicação eleitoral nos últimos 8 anos. Utilize os filtros opcionais para refinar por nome, CPF, UF ou município. Os resultados incluem a data final do efeito eleitoral.',
  'inabilitados': 'Consulte pessoas declaradas inabilitadas pelo TCU para o exercício de cargo em comissão. Utilize os filtros opcionais para refinar por nome, CPF, UF ou município. Os resultados exibem o tipo de sanção, processo e período de inabilitação.',
  'inidoneos': 'Consulte empresas e pessoas físicas declaradas inidôneas pelo TCU, impedidas de licitar com a administração pública. Utilize os filtros opcionais para refinar por nome, CPF, CNPJ, UF ou município. Os resultados exibem o processo e a data final da sanção.',
};

function TCUResultView({ data, tipo }) {
  if (!data || data.length === 0) {
    return <p className="tcu-empty">Nenhum resultado encontrado.</p>;
  }

  const isSancoes = tipo === 'inabilitados' || tipo === 'inidoneos';

  return (
    <div className="tcu-result-lista">
      <div className="tcu-result-sumario">
        <span className="tcu-result-count">{data.length} registro{data.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="tcu-cards">
        {data.map((item, i) => (
          <div key={i} className="tcu-card">
            <div className="tcu-card-topo">
              <span className="tcu-card-tipo">{isSancoes ? 'Sanção' : 'CADIRREG'}</span>
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
  );
}

export default function AnaliseTCU({ onIdClick, onInfoClick }) {
  const [topAba, setTopAba] = usePageMemory('tcu-topAba', 'geral');
  const [metodoState, setMetodoState] = usePageMemory('tcu-metodoState',
    Object.fromEntries(METODOS.map(m => [m.key, { subs: [], ativa: 'geral' }]))
  );
  const [dataCache, setDataCache] = usePageMemory('tcu-dataCache', {});
  const [savedList, setSavedList] = usePageMemory('tcu-savedList', []);
  const [ultimoFiltro, setUltimoFiltro] = usePageMemory('tcu-ultimoFiltro', {});

  let uid = useRef(0);

  const handleSearch = useCallback(async (method, filter) => {
    const info = API_MAP[method];
    if (!info) return;

    setUltimoFiltro(prev => ({ ...prev, [method]: filter }));

    try {
      const json = await api.post<any>(info.endpoint, filter);
      const id = ++uid.current;
      setDataCache(prev => ({ ...prev, [id]: { data: json, method, filter, timestamp: Date.now() } }));
      setMetodoState(prev => {
        const m = prev[method];
        if (m.subs.includes(id)) return { ...prev, [method]: { ...m, ativa: `tcu-${id}` } };
        return { ...prev, [method]: { subs: [...m.subs, id], ativa: `tcu-${id}` } };
      });
    } catch (err) {
      const id = `err_${++uid.current}`;
      setDataCache(prev => ({ ...prev, [id]: { error: err.message, method, filter, timestamp: Date.now() } }));
      setMetodoState(prev => {
        const m = prev[method];
        if (m.subs.includes(id)) return { ...prev, [method]: { ...m, ativa: `tcu-${id}` } };
        return { ...prev, [method]: { subs: [...m.subs, id], ativa: `tcu-${id}` } };
      });
    }
  }, []);

  const handleFecharSubTab = useCallback((method, key) => {
    const id = key.replace('tcu-', '');
    setMetodoState(prev => {
      const m = prev[method];
      const novaSubs = m.subs.filter(t => String(t) !== id);
      const novaAtiva = m.ativa === key ? (novaSubs.length > 0 ? `tcu-${novaSubs[novaSubs.length - 1]}` : 'geral') : m.ativa;
      return { ...prev, [method]: { subs: novaSubs, ativa: novaAtiva } };
    });
  }, []);

  const handleSalvar = useCallback((item) => {
    setSavedList(prev => [item, ...prev]);
  }, []);

  const handleAbrirSalvo = useCallback((item) => {
    const id = item.id || ++uid.current;
    setDataCache(prev => ({ ...prev, [id]: item }));
    setMetodoState(prev => {
      const m = prev[item.method];
      if (!m) return prev;
      if (m.subs.includes(id)) return { ...prev, [item.method]: { ...m, ativa: `tcu-${id}` } };
      return { ...prev, [item.method]: { subs: [...m.subs, id], ativa: `tcu-${id}` } };
    });
    setTopAba(item.method);
  }, []);

  return (
    <div className="tcu-section">
      <div className="tcu-topo">
        <h2>Análises TCU</h2>
        <span className="tcu-desc">Cadastros oficiais do TCU: contas julgadas irregulares, registros com implicação eleitoral, pessoas inabilitadas para cargo em comissão e empresas inidôneas impedidas de licitar.</span>
      </div>

      <div className="tcu-sub-tabs">
        <button
          className={`tcu-sub-tab ${topAba === 'geral' ? 'ativo' : ''}`}
          onClick={() => setTopAba('geral')}
        >
          Geral
        </button>
        {METODOS.map(m => (
          <button
            key={m.key}
            className={`tcu-sub-tab ${topAba === m.key ? 'ativo' : ''}`}
            onClick={() => setTopAba(m.key)}
          >
            {m.label}
            <span
              className="tcu-sub-tab-fechar"
              onClick={(e) => { e.stopPropagation(); setTopAba('geral'); }}
            >×</span>
          </button>
        ))}
      </div>

      <div style={{ display: topAba === 'geral' ? '' : 'none' }}>
        <div className="tcu-metodo-grid">
          {METODOS.map(m => (
            <button
              key={m.key}
              className="tcu-metodo-btn"
              onClick={() => setTopAba(m.key)}
            >
              <strong>{m.label}</strong>
              <InfoBadge chave={`tcu_${m.key}`} onInfoClick={onInfoClick} />
              <span className="tcu-metodo-desc">{m.desc}</span>
            </button>
          ))}
        </div>
        {savedList.length > 0 && (
          <div className="tcu-saved-section">
            <div className="tcu-saved-list">
              <span className="tcu-saved-title">Salvas ({savedList.length})</span>
              {savedList.map((item, i) => (
                <div key={i} className="tcu-saved-card">
                  <span className="tcu-saved-label">{API_MAP[item.method]?.label || item.method}</span>
                  <span className="tcu-saved-meta">
                    {item.data?.length || 0} registros · {new Date(item.timestamp).toLocaleString('pt-BR')}
                  </span>
                  <div className="tcu-saved-actions">
                    <button className="btn btn-sm" onClick={() => handleAbrirSalvo(item)}>Abrir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {METODOS.map(m => {
        const state = metodoState[m.key];
        if (!state) return null;
        return (
          <div key={m.key} style={{ display: topAba === m.key ? '' : 'none' }}>
            <div className="tcu-search-box">
              <span className="tcu-search-label">Filtros (opcional — vazio busca todos)</span>
              <InfoBadge chave={`tcu_${m.key}`} onInfoClick={onInfoClick} />
              <div className="tcu-search-fields">
                <input
                  className="tcu-search-input"
                  placeholder="Parte do nome"
                  value={ultimoFiltro[m.key]?.parteNome || ''}
                  onChange={e => setUltimoFiltro(prev => ({
                    ...prev,
                    [m.key]: { ...prev[m.key], parteNome: e.target.value }
                  }))}
                />
                <input
                  className="tcu-search-input tcu-search-input-mono"
                  placeholder="CPF"
                  value={ultimoFiltro[m.key]?.cpf || ''}
                  onChange={e => setUltimoFiltro(prev => ({
                    ...prev,
                    [m.key]: { ...prev[m.key], cpf: e.target.value }
                  }))}
                />
                {(m.key === 'contas-irregulares' || m.key === 'inidoneos') && (
                  <input
                    className="tcu-search-input tcu-search-input-mono"
                    placeholder="CNPJ"
                    value={ultimoFiltro[m.key]?.cnpj || ''}
                    onChange={e => setUltimoFiltro(prev => ({
                      ...prev,
                      [m.key]: { ...prev[m.key], cnpj: e.target.value }
                    }))}
                  />
                )}
                <input
                  className="tcu-search-input"
                  placeholder="UF"
                  value={ultimoFiltro[m.key]?.uf || ''}
                  onChange={e => setUltimoFiltro(prev => ({
                    ...prev,
                    [m.key]: { ...prev[m.key], uf: e.target.value }
                  }))}
                />
                <input
                  className="tcu-search-input"
                  placeholder="Município"
                  value={ultimoFiltro[m.key]?.municipio || ''}
                  onChange={e => setUltimoFiltro(prev => ({
                    ...prev,
                    [m.key]: { ...prev[m.key], municipio: e.target.value }
                  }))}
                />
                <button className="btn btn-sm" onClick={() => {
                  const filter = ultimoFiltro[m.key] || {};
                  const clean = {};
                  for (const [k, v] of Object.entries(filter)) {
                    if (v && v.trim()) clean[k] = v.trim();
                  }
                  handleSearch(m.key, clean);
                }}>
                  Buscar
                </button>
              </div>
            </div>

            <div className="tcu-inner-sub-tabs">
              <button
                className={`tcu-sub-tab ${state.ativa === 'geral' ? 'ativo' : ''}`}
                onClick={() => setMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: 'geral' } }))}
              >
                Geral
              </button>
              {state.subs.map((id) => {
                const key = `tcu-${id}`;
                const item = dataCache[id];
                const label = item ? `#${id}` : `#${id}`;
                return (
                  <button
                    key={key}
                    className={`tcu-sub-tab ${state.ativa === key ? 'ativo' : ''}`}
                    onClick={() => setMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: key } }))}
                  >
                    {label}
                    <span
                      className="tcu-sub-tab-fechar"
                      onClick={(e) => { e.stopPropagation(); handleFecharSubTab(m.key, key); }}
                    >×</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: state.ativa === 'geral' ? '' : 'none' }}>
              <div className="tcu-search-placeholder">
                <p>{DESC_PLACEHOLDER[m.key] || 'Preencha os filtros e clique em <strong>Buscar</strong>.'}</p>
              </div>
            </div>

            {state.subs.map(id => {
              const key = `tcu-${id}`;
              const item = dataCache[id];
              return (
                <div key={key} style={{ display: state.ativa === key ? '' : 'none' }}>
                  {item?.error ? (
                    <div className="tcu-error-box">
                      <p>Erro: {item.error}</p>
                    </div>
                  ) : item?.data ? (
                    <div className="tcu-result-area">
                      <div className="tcu-result-actions">
                        <button className="btn btn-sm" onClick={() => handleSalvar({
                          id, method: m.key, data: item.data, filter: item.filter, timestamp: new Date().toISOString()
                        })}>Salvar</button>
                      </div>
                      <TCUResultView data={item.data} tipo={m.key} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
