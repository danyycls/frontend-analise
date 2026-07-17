import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { api } from '@/shared/api/client';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import {
  addSearchStart,
  removeSearch,
  setActiveSearch,
  updateSearchProgress,
  appendDados,
  addErro,
  finishSearch,
  removeYearFromSearch,
} from '@/app/store/slices/recursosMunicipioSlice';
import { PieChart, aggregateBy, topN, fmtMoneyCompact, CHART_SIZE_SM, CHART_SIZE_LG } from './chart-utils';
import { usePaginacao } from '@/shared/lib/hooks/usePaginacao';
import { Paginacao } from '@/shared/ui';
import { fmtMoney, fmtMesAno } from '@/shared/lib/formatters';
import { DraggableChartPopup } from './DraggableChartPopup';

export default function RecursosMunicipioDetalhe({ uf, ufNome, municipios, onFechar }) {
  const dispatch = useAppDispatch();
  const searches = useAppSelector(s => s.recursosMunicipio.searches);
  const activeSearchId = useAppSelector(s => s.recursosMunicipio.activeSearchId);

  const activeEntry = activeSearchId ? searches[activeSearchId] : null;

  const [anosInput, setAnosInput] = useState(activeEntry?.anos?.join(', ') || '');
  const [selectedIBGEs, setSelectedIBGEs] = useState(activeEntry?.codigosIBGE || []);
  const [munFilterText, setMunFilterText] = useState('');
  const [chartYear, setChartYear] = useState('todos');
  const [chartPopup, setChartPopup] = useState(null);

  const anosValidos = useMemo(() => {
    return anosInput
      .split(',')
      .map(s => s.trim())
      .filter(a => /^\d{4}$/.test(a))
      .map(Number)
      .sort();
  }, [anosInput]);

  const searchEntries = useMemo(() => {
    return Object.values(searches).sort((a, b) => b.id.localeCompare(a.id));
  }, [searches]);

  const anosBuscados = useMemo(() => {
    const anos = new Set();
    (activeEntry?.dados || []).forEach(d => {
      const a = Math.floor(Number(d.mes_ano) / 100);
      anos.add(a);
    });
    return [...anos].sort();
  }, [activeEntry?.dados]);

  const dados = activeEntry?.dados || [];
  const busy = activeEntry?.busy ?? false;
  const progresso = activeEntry?.progresso || { atual: 0, total: 0, ano: null, status: 'idle' };
  const erros = activeEntry?.erros || [];
  const concluido = activeEntry?.concluido ?? false;
  const totalRegistros = activeEntry?.totalRegistros ?? 0;

  const chartData = useMemo(() => {
    let source = dados;
    if (chartYear !== 'todos') {
      const anoNum = Number(chartYear);
      source = dados.filter(d => Math.floor(Number(d.mes_ano) / 100) === anoNum);
    }
    if (!source.length) return null;
    return {
      tipoPessoa: aggregateBy(source, 'tipo_pessoa'),
      porOrgao: topN(aggregateBy(source, 'nome_orgao')),
      porOrgaoSuperior: topN(aggregateBy(source, 'nome_orgao_superior')),
      porMesAno: topN(aggregateBy(source, 'mes_ano'), 12),
    };
  }, [dados, chartYear]);

  const pag = usePaginacao(dados, 10);

  const toggleIBGE = (codigo) => {
    setSelectedIBGEs(prev => {
      if (prev.includes(codigo)) return prev.filter(c => c !== codigo);
      return [...prev, codigo];
    });
  };

  const labelMunicipios = useMemo(() => {
    if (selectedIBGEs.length === 0) return 'Estado todo';
    const sel = selectedIBGEs
      .map(c => municipios.find(m => String(m.id) === c))
      .filter(Boolean)
      .map(m => m.nome);
    return sel.length > 3 ? `${sel.slice(0, 3).join(', ')} +${sel.length - 3}` : sel.join(', ');
  }, [selectedIBGEs, municipios]);

  const munFiltrados = useMemo(() => {
    if (!munFilterText) return municipios;
    return municipios.filter(m => (m.nome || '').toLowerCase().includes(munFilterText.toLowerCase()));
  }, [municipios, munFilterText]);

  const buscar = async () => {
    if (anosValidos.length === 0) return;

    const label = `${ufNome}${selectedIBGEs.length > 0 ? ': ' + labelMunicipios : ''}`;
    const id = `busca-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    dispatch(addSearchStart({ id, label, codigosIBGE: selectedIBGEs, anos: anosValidos }));

    for (let i = 0; i < anosValidos.length; i++) {
      const ano = anosValidos[i];
      dispatch(updateSearchProgress({ id, progresso: { atual: i + 1, total: anosValidos.length, ano, status: 'buscando' } }));

      try {
        const codigos = selectedIBGEs.length > 0 ? selectedIBGEs : [''];
        for (const codigo of codigos) {
          const data = await api.get('/portal-transparencia/despesas/recursos-recebidos', {
            uf,
            mesAnoInicio: `${ano}-01`,
            mesAnoFim: `${ano}-12`,
            codigoIBGE: codigo || undefined,
          });
          const novos = Array.isArray(data) ? data : [];
          dispatch(appendDados({ id, novos }));
        }
        dispatch(updateSearchProgress({ id, progresso: { atual: i + 1, total: anosValidos.length, ano, status: 'concluido' } }));
      } catch (e) {
        dispatch(addErro({ id, erro: { ano, msg: e.message } }));
        dispatch(updateSearchProgress({ id, progresso: { atual: i + 1, total: anosValidos.length, ano, status: 'erro' } }));
      }
    }

    dispatch(finishSearch({ id }));
  };

  const handleRemoveYear = (ano) => {
    if (!activeSearchId) return;
    dispatch(removeYearFromSearch({ id: activeSearchId, ano }));
  };

  const handleRemoveSearch = (e, id) => {
    e.stopPropagation();
    dispatch(removeSearch(id));
  };

  const handleSelectSearch = (id) => {
    dispatch(setActiveSearch(id));
    const entry = searches[id];
    if (entry) {
      setAnosInput(entry.anos.join(', '));
      setSelectedIBGEs(entry.codigosIBGE);
    }
  };

  const municipioSelecionado = selectedIBGEs.length === 1
    ? municipios.find(m => String(m.id) === selectedIBGEs[0])
    : null;

  return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          <div>
            <h3>Recursos Federais — {ufNome}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              <span className="tag tag-partido">{uf}</span>
              {activeEntry && (
                <>
                  <span className="tag tag-candidato">{activeEntry.label}</span>
                  <span className="tag tag-candidato" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-glow)' }}>
                    {totalRegistros} registros
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
        </div>
      </div>

      {/* Info card */}
      <div className="bcard" style={{ marginBottom: 20 }}>
        <div className="bcard-topo">
          <span className="bcard-tag tag-accent">INFO</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fonte: Portal da Transparência — Transferências a Entes</span>
        </div>
        <div className="bcard-body">
          <div className="bcard-field">
            <span className="bcard-label">Ente consultado</span>
            <span className="bcard-value">{activeEntry ? activeEntry.label : `${ufNome} (${uf})`}</span>
          </div>
          <div className="bcard-field">
            <span className="bcard-label">Tipo de busca</span>
            <span className="bcard-value">{selectedIBGEs.length > 0 ? 'Município(s)' : 'Estado (UF)'}</span>
          </div>
          <div className="bcard-field">
            <span className="bcard-label">Descrição</span>
            <span className="bcard-value" style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>Transferências federais recebidas</span>
          </div>
          <div className="bcard-field">
            <span className="bcard-label">Campos</span>
            <span className="bcard-value" style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>Tipo, Favorecido, UG, Órgão, Órgão Superior, Mês/Ano, Valor</span>
          </div>
        </div>
      </div>

      {/* Search History Tabs */}
      {searchEntries.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {searchEntries.map(entry => (
            <button
              key={entry.id}
              className={`ano-btn ${activeSearchId === entry.id ? 'ativo' : ''}`}
              onClick={() => handleSelectSearch(entry.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.label}
              </span>
              <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>({entry.totalRegistros})</span>
              <span
                onClick={(e) => handleRemoveSearch(e, entry.id)}
                style={{ marginLeft: 2, cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem', lineHeight: 1 }}
              >×</span>
            </button>
          ))}
        </div>
      )}

      {/* Municipality multi-select */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Municípios selecionados: <span style={{ color: 'var(--accent-secondary)' }}>{labelMunicipios}</span>
        </div>
        <input
          className="search-input"
          type="text"
          placeholder="Filtrar municípios..."
          value={munFilterText}
          onChange={e => setMunFilterText(e.target.value)}
          style={{ marginBottom: 8, maxWidth: 300 }}
        />
        <div style={{ maxHeight: 180, overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', padding: '4px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', borderBottom: '1px solid var(--card-border)' }}>
            <input
              type="checkbox"
              checked={selectedIBGEs.length === 0}
              onChange={() => setSelectedIBGEs([])}
            />
            <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Estado todo ({ufNome})</span>
          </label>
          {munFiltrados.map(m => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={selectedIBGEs.includes(String(m.id))}
                onChange={() => toggleIBGE(String(m.id))}
              />
              <span>{m.nome}{m.populacao ? ` (${Number(m.populacao).toLocaleString('pt-BR')} hab.)` : ''}</span>
            </label>
          ))}
          {munFiltrados.length === 0 && (
            <div style={{ padding: 8, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>Nenhum município encontrado</div>
          )}
        </div>
      </div>

      <div className="section-divider" style={{ margin: '24px 0' }} />

      {/* Year input + Buscar */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="recursos-year-input"
          type="text"
          placeholder="Ex: 2024, 2025, 2026"
          value={anosInput}
          onChange={e => setAnosInput(e.target.value)}
          disabled={busy}
        />
        <button
          className="btn btn-sm"
          onClick={buscar}
          disabled={busy || anosValidos.length === 0}
        >
          {busy ? 'Buscando...' : 'Buscar'}
        </button>
        {anosValidos.length > 0 && !busy && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-secondary)' }}>
            {anosValidos.length} ano(s): {anosValidos.join(', ')}
          </span>
        )}
        {anosInput && anosValidos.length === 0 && !busy && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--error)' }}>
            Formato inválido. Use AAAA, AAAA
          </span>
        )}
      </div>

      {/* Progress */}
      {busy && progresso.total > 0 && (
        <div className="dm-progresso" style={{ marginBottom: 16 }}>
          <div className="dm-progresso-header">
            <div className="spinner-sm" />
            <span>Buscando ano {progresso.ano}... ({progresso.atual} de {progresso.total})</span>
          </div>
          <div className="dm-etapas">
            {anosValidos.map((ano, i) => {
              let cls = 'dm-etapa';
              if (i < progresso.atual - 1) cls += ' dm-etapa-concluido';
              else if (i === progresso.atual - 1 && progresso.status !== 'erro') cls += ' dm-etapa-buscando';
              else if (i > progresso.atual - 1) cls += ' dm-etapa-aguardando';

              const erro = erros.find(e => e.ano === ano);
              if (erro) cls += ' dm-etapa-erro';

              let icon = '○';
              let statusText = 'Aguardando';
              if (i < progresso.atual - 1) { icon = '✓'; statusText = 'Concluído'; }
              else if (i === progresso.atual - 1) {
                if (erro) { icon = '✕'; statusText = erro.msg.substring(0, 30); }
                else { icon = '⟳'; statusText = 'Buscando...'; }
              }

              return (
                <div key={ano} className={cls}>
                  <span className="dm-etapa-icon">{icon}</span>
                  <span className="dm-etapa-label">{ano}</span>
                  <span className="dm-etapa-status">{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed years with remove button */}
      {!busy && concluido && activeEntry && activeEntry.anos.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
            Busca concluída — {activeEntry.anos.length} ano(s) ({totalRegistros} registros)
          </span>
          {activeEntry.anos.map(ano => (
            <span key={ano} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--accent-secondary-subtle)', border: '1px solid var(--accent-secondary-glow)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-secondary)' }}>
              {ano}
              <button
                onClick={() => handleRemoveYear(ano)}
                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.7rem', padding: 0, lineHeight: 1 }}
              >×</button>
            </span>
          ))}
          {erros.length > 0 && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--error)' }}>
              ({erros.length} erro(s))
            </span>
          )}
        </div>
      )}

      {erros.length > 0 && !busy && (
        <div className="estado-erro" style={{ marginBottom: 16 }}>
          {erros.map((e, i) => (
            <div key={i}>Erro ao buscar ano {e.ano}: {e.msg}</div>
          ))}
        </div>
      )}

      <div className="recursos-detalhe-layout">
        <div className="recursos-detalhe-left">
          {dados.length > 0 && (
            <>
              <table className="estado-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Favorecido</th>
                    <th>UG</th>
                    <th>Órgão</th>
                    <th>Órgão Superior</th>
                    <th>Mês/Ano</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pag.paginaDados.map((rf, i) => (
                    <tr key={i}>
                      <td>{rf.tipo_pessoa || '-'}</td>
                      <td>{rf.nome_pessoa || '-'}</td>
                      <td>{rf.nome_ug || '-'}</td>
                      <td>{rf.nome_orgao || '-'}</td>
                      <td>{rf.nome_orgao_superior || '-'}</td>
                      <td>{fmtMesAno(rf.mes_ano)}</td>
                      <td>{fmtMoney(rf.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Paginacao pagina={pag.pagina} totalPaginas={pag.totalPaginas} onPagina={pag.setPagina} />
            </>
          )}
          {dados.length === 0 && activeEntry && !busy && (
            <div className="rp-empty">Nenhum registro encontrado para os anos informados</div>
          )}
          {!activeEntry && (
            <div className="rp-empty">Selecione municípios, insira anos e clique em Buscar</div>
          )}
        </div>

        <div className="recursos-detalhe-right">
          {chartData && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>Visualizar por ano:</label>
                <select
                  value={chartYear}
                  onChange={e => setChartYear(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}
                >
                  <option value="todos">Todos os anos</option>
                  {anosBuscados.map(a => (
                    <option key={a} value={String(a)}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="recursos-charts-grid">
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Tipo Pessoa', data: chartData.tipoPessoa })}>
                  <div className="chart-card-title">Tipo Pessoa</div>
                  <PieChart data={chartData.tipoPessoa} size={CHART_SIZE_SM} />
                </div>
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Por Órgão', data: chartData.porOrgao })}>
                  <div className="chart-card-title">Por Órgão</div>
                  <PieChart data={chartData.porOrgao} size={CHART_SIZE_SM} />
                </div>
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Órgão Superior', data: chartData.porOrgaoSuperior })}>
                  <div className="chart-card-title">Órgão Superior</div>
                  <PieChart data={chartData.porOrgaoSuperior} size={CHART_SIZE_SM} />
                </div>
                <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Por Mês/Ano', data: chartData.porMesAno })}>
                  <div className="chart-card-title">Por Mês/Ano</div>
                  <PieChart data={chartData.porMesAno} size={CHART_SIZE_SM} />
                </div>
              </div>
            </>
          )}
          {!chartData && activeEntry && totalRegistros > 0 && (
            <p className="chart-empty">Sem dados para gráficos no período selecionado</p>
          )}
          {!activeEntry && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <p className="chart-empty" style={{ textAlign: 'center' }}>Os gráficos aparecerão aqui<br/>após a busca</p>
            </div>
          )}
        </div>
      </div>

      {chartPopup && (
        <DraggableChartPopup titulo={chartPopup.titulo} data={chartPopup.data} onFechar={() => setChartPopup(null)} />
      )}
    </div>
  );
}
