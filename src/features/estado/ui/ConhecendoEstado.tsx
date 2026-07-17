import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { WS_BASE_URL, P2_WS_BASE_URL } from '@/shared/config';
import { api, apiP2 } from '@/shared/api/client';
import DetalheMunicipio from './DetalheMunicipio';
import RecursosMunicipioDetalhe from './RecursosMunicipioDetalhe';
import ErrorBoundary from '@/shared/ui/ErrorBoundary/ErrorBoundary';
import { PieChart, aggregateBy, topN, CHART_COLORS, fmtMoneyCompact, CHART_SIZE_MD, CHART_SIZE_LG } from './chart-utils';
import DeputadoDetailView from '@/features/analise/ui/DeputadoDetailView';
import SenadorDetailView from '@/features/analise/ui/SenadorDetailView';
import { JanelaPopup, ContratoDetalhes } from '../../ligacao-politica/ui/Resultados';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';
import { usePaginacao } from '@/shared/lib/hooks/usePaginacao';
import { Paginacao } from '@/shared/ui';
import { fmtNum, fmtDoc, fmtMoney, fmtMesAno, fmtData } from '@/shared/lib/formatters';
import PageNav from '@/shared/ui/PageNav/PageNav';
import { FinCard } from './FinCard';
import { ContadoresBar } from './ContadoresBar';
import { SearchAutocomplete } from './SearchAutocomplete';
import { TabelaCandidatos } from './TabelaCandidatos';
import { useGridItensPorPagina } from './useGridItensPorPagina';
import './ConhecendoEstado.css';
import '../../analise/ui/AnaliseDeputados.css';

const ITENS_POR_PAGINA = 10;
const DEP_GRID_ROWS = 4;
const DEP_COL_MIN = 220;
const DEP_GRID_GAP = 12;

const PAGE_SECTIONS = [
  { id: 'estado-inicio', label: 'Início' },
  { id: 'estado-candidatos', label: 'Candidatos' },
  { id: 'estado-financas', label: 'Finanças' },
  { id: 'estado-licitacoes', label: 'Licitações' },
  { id: 'estado-municipios', label: 'Municípios' },
];



export default function ConhecendoEstado() {
  const { uf } = useParams();

  const [basico, setBasico] = useState(null);
  const [candidatos, setCandidatos] = useState(null);
  const [deputados, setDeputados] = useState(null);
  const [senadores, setSenadores] = useState(null);

  const [erro, setErro] = useState(null);
  const [depDetalhe, setDepDetalhe] = useState(null);
  const [senDetalhe, setSenDetalhe] = useState(null);
  const [municipioDetalhe, setMunicipioDetalhe] = useState(null);
  const [recursosDetalhe, setRecursosDetalhe] = useState(false);

  const [finErro, setFinErro] = useState(null);
  const [finCache, setFinCache] = useState({});
  const [anosCarregados, setAnosCarregados] = useState(new Set());
  const [anoAtualCarregando, setAnoAtualCarregando] = useState(null);
  const [anosSelecionados, setAnosSelecionados] = useState([new Date().getFullYear()]);
  const [mesSelecionado, setMesSelecionado] = useState(0);
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const [collapsed, setCollapsed] = useState({ deputados: true, senadores: true, financas: false });
  const [depBuscaTexto, setDepBuscaTexto] = useState('');
  const [munNomeBusca, setMunNomeBusca] = useState('');
  const [chartPopup, setChartPopup] = useState(null);
  const [licAnoInput, setLicAnoInput] = useState('');
  const [licTrimestresSelecionados, setLicTrimestresSelecionados] = useState(new Set());
  const [licCache, setLicCache] = useState({});
  const [licChavesSelecionadas, setLicChavesSelecionadas] = useState(new Set());
  const [licEmAndamento, setLicEmAndamento] = useState(false);
  const [licProgresso, setLicProgresso] = useState({ buscados: 0, total: 0 });
  const [licErro, setLicErro] = useState(null);
  const [licitacaoPopup, setLicitacaoPopup] = useState(null);
  const licCancelRef = useRef(false);

  function toggleAno(ano) {
    setAnosSelecionados(prev => {
      if (prev.includes(ano)) return prev.filter(a => a !== ano);
      return [...prev, ano];
    });
  }

  function recarregarTudo() {
    setFinCache({});
    setAnosCarregados(new Set());
    setFinErro(null);
    setAnoAtualCarregando(null);
  }

  function toggleCollapse(secao) {
    setCollapsed(prev => ({ ...prev, [secao]: !prev[secao] }));
  }

  function toggleTrimestre(t) {
    setLicTrimestresSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function licBuscar() {
    const ano = licAnoInput.trim();
    if (!ano.match(/^\d{4}$/)) return;

    let trimestres = [...licTrimestresSelecionados];
    if (trimestres.length === 0) {
      trimestres = [1, 2, 3, 4];
      setLicTrimestresSelecionados(new Set(trimestres));
    }

    const fila = trimestres.map(t => `${ano}-${t}`).filter(k => !licCache[k]);
    if (fila.length === 0) return;

    setLicEmAndamento(true);
    setLicProgresso({ buscados: 0, total: fila.length });
    setLicErro(null);
    licCancelRef.current = false;

    processarFilaSequencial(fila);
  }

  async function processarFilaSequencial(fila) {
    for (const chave of fila) {
      if (licCancelRef.current) break;

      const [a, t] = chave.split('-');
      const mesInicio = String((t-1)*3+1).padStart(2,'0');
      const mesFim = String(t*3).padStart(2,'0');
      const dataInicial = `${a}${mesInicio}01`;
      const dataFinal = `${a}${mesFim}28`;

      try {
        const json = await api.post(`/pncp/contratos/uf/${uf}`, { data_inicial: dataInicial, data_final: dataFinal });
        const data = (json as any).data || [];

        if (licCancelRef.current) break;

        setLicCache(prev => ({ ...prev, [chave]: Array.isArray(data) ? data : [] }));
        setLicChavesSelecionadas(prev => new Set([...prev, chave]));
        setLicProgresso(prev => ({ ...prev, buscados: prev.buscados + 1 }));
      } catch (err) {
        if (licCancelRef.current) break;
        setLicErro(err.message || `Erro no trimestre ${a}-T${t}`);
        setLicProgresso(prev => ({ ...prev, buscados: prev.buscados + 1 }));
        break;
      }
    }

    setLicEmAndamento(false);
  }

  function licCancelar() {
    licCancelRef.current = true;
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

  useEffect(() => {
    if (!uf) return;
    setErro(null);

    const abort = new AbortController();

    apiP2.get(`/estado/${uf}/dados-completos`, undefined, { signal: abort.signal })
      .then(data => {
        setBasico({ nome: data.nome, uf: data.uf, populacao: data.populacao, municipios: data.municipios });
        setCandidatos({ prefeitos: data.prefeitos || [], vice_prefeitos: data.vice_prefeitos || [], vereadores: data.vereadores || [] });
        setDeputados(data.deputados || []);
        setSenadores(data.senadores || []);
      })
      .catch(() => {});

    return () => abort.abort();
  }, [uf]);

  useEffect(() => {
    if (!uf) return;
    setFinCache({});
    setAnosCarregados(new Set());
    setAnoAtualCarregando(null);
    setFinErro(null);
    setLicCache({});
    setLicChavesSelecionadas(new Set());
    setLicEmAndamento(false);
    setLicErro(null);
    setLicAnoInput('');
    setLicTrimestresSelecionados(new Set());
    licCancelRef.current = true;
  }, [uf]);

  useEffect(() => {
    if (!uf) return;

    const anosFaltantes = anosSelecionados.filter(a => !anosCarregados.has(a));
    if (anosFaltantes.length === 0) return;
    if (anoAtualCarregando !== null) return;

    setAnoAtualCarregando(anosFaltantes[0]);
    setFinErro(null);
  }, [uf, anosSelecionados, anosCarregados, anoAtualCarregando]);

  useEffect(() => {
    if (!uf || anoAtualCarregando === null) return;

    const anoParaCarregar = anoAtualCarregando;
    const dadosAno = {};

    const ws = new WebSocket(`${P2_WS_BASE_URL}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ channel: 'estado_financeiro', uf, exercicio: anoParaCarregar }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case 'despesa_pessoal':
            dadosAno.despesa_pessoal = msg.data;
            break;
          case 'despesa_categoria':
            dadosAno.despesa_categoria = msg.data?.dados || [];
            break;
          case 'gastos_por_funcao':
            dadosAno.gastos_por_funcao = msg.data?.dados || [];
            break;
          case 'receitas':
            dadosAno.receitas = msg.data?.dados || [];
            break;
          case 'recursos_federais':
            dadosAno.recursos_federais = msg.data?.dados || [];
            break;
          case 'erro':
            setFinErro(msg.data?.erro || 'Erro desconhecido');
            break;
          case 'concluido':
            setFinCache(prev => ({ ...prev, [anoParaCarregar]: dadosAno }));
            setAnosCarregados(prev => new Set([...prev, anoParaCarregar]));
            setAnoAtualCarregando(null);
            ws.close();
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      setAnoAtualCarregando(null);
    };

    return () => { ws.close(); };
  }, [uf, anoAtualCarregando]);

  const finSecoes = useMemo(() => {
    const anos = Object.keys(finCache).map(Number).sort();
    if (anos.length === 0) return {};
    const ultimoAno = anos[anos.length - 1];
    return finCache[ultimoAno] || {};
  }, [finCache]);

  const recursosFedExibicao = useMemo(() => {
    let dados = [];
    anosSelecionados.forEach(ano => {
      if (finCache[ano]?.recursos_federais) {
        dados = dados.concat(finCache[ano].recursos_federais);
      }
    });
    if (mesSelecionado !== 0) {
      dados = dados.filter(d => {
        const s = String(d.mes_ano || '');
        return parseInt(s.substring(4, 6), 10) === mesSelecionado;
      });
    }
    return dados;
  }, [finCache, anosSelecionados, mesSelecionado]);

  const recursosFedPag = usePaginacao(recursosFedExibicao, ITENS_POR_PAGINA);

  const chartData = useMemo(() => {
    if (!recursosFedExibicao.length) return null;
    return {
      tipoPessoa: aggregateBy(recursosFedExibicao, 'tipo_pessoa'),
      porOrgao: topN(aggregateBy(recursosFedExibicao, 'nome_orgao')),
      porOrgaoSuperior: topN(aggregateBy(recursosFedExibicao, 'nome_orgao_superior')),
      porMesAno: topN(aggregateBy(recursosFedExibicao, 'mes_ano'), 12),
    };
  }, [recursosFedExibicao]);

  const licExibicao = useMemo(() => {
    let dados = [];
    licChavesSelecionadas.forEach(chave => {
      if (licCache[chave]) {
        dados = dados.concat(licCache[chave]);
      }
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

  const anoExibicao = useMemo(() => {
    const anos = Object.keys(finCache).map(Number).sort();
    return anos.length > 0 ? anos[anos.length - 1] : null;
  }, [finCache]);

  const nome = basico?.nome || uf;
  const ufSigla = basico?.uf || uf;
  const populacao = basico?.populacao || 0;
  const municipios = basico?.municipios || [];

  const listaVereadores = candidatos?.vereadores || [];
  const listaPrefeitos = candidatos?.prefeitos || [];
  const listaVice = candidatos?.vice_prefeitos || [];

  const ANO_BASE = 2024;

  const prefeitos2024 = (candidatos?.prefeitos || []).filter(c => c.ano_eleicao === ANO_BASE);
  const vices2024 = (candidatos?.vice_prefeitos || []).filter(c => c.ano_eleicao === ANO_BASE);

  const SITUACOES_VEREADOR = ['ELEITO', 'ELEITO POR MÉDIA', 'ELEITO POR QP', 'SUPLENTE'];
  const vereadores2024 = (candidatos?.vereadores || []).filter(c =>
    c.ano_eleicao === ANO_BASE && SITUACOES_VEREADOR.includes(c.situacao_totalizacao_descricao)
  );

  const populacaoTotal = municipios.reduce((sum, m) => sum + (m.populacao || 0), 0);

  const listaDeputados = deputados || [];
  const listaSenadores = senadores || [];

  const depSectionRef = useRef(null);
  const depItensPorPagina = useGridItensPorPagina(depSectionRef, DEP_COL_MIN, DEP_GRID_GAP, DEP_GRID_ROWS);

  const depFiltrados = useMemo(() => {
    if (!depBuscaTexto) return listaDeputados;
    const q = depBuscaTexto.toLowerCase();
    return listaDeputados.filter(d =>
      (d.nome || '').toLowerCase().includes(q) ||
      (d.sigla_partido || '').toLowerCase().includes(q)
    );
  }, [listaDeputados, depBuscaTexto]);

  const depPag = usePaginacao(depFiltrados, depItensPorPagina);

  useEffect(() => { depPag.setPagina(0); }, [depBuscaTexto, depItensPorPagina]);

  const munFiltrados = useMemo(() => {
    if (!munNomeBusca) return municipios;
    const q = munNomeBusca.toLowerCase();
    return municipios.filter(m => (m.nome || '').toLowerCase().includes(q));
  }, [municipios, munNomeBusca]);

  const {
    despesa_pessoal: finDespesaPessoal,
    despesa_categoria: finDespesaCategoria,
    gastos_por_funcao: finGastosFuncao,
    receitas: finReceitas,
    recursos_federais: finRecursosFed,
  } = finSecoes;

  if (!basico && !candidatos && !deputados && !senadores) {
    return (
      <div className="estado-page">
        <div className="estado-loading">
          <div className="spinner" />
          Carregando dados do estado...
        </div>
      </div>
    );
  }

  if (depDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setDepDetalhe(null)}>
          <DeputadoDetailView deputadoId={depDetalhe.id} onFechar={() => setDepDetalhe(null)} />
        </ErrorBoundary>
      </div>
    );
  }

  if (senDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setSenDetalhe(null)}>
          <SenadorDetailView senadorCodigo={senDetalhe.codigo} onFechar={() => setSenDetalhe(null)} />
        </ErrorBoundary>
      </div>
    );
  }

  if (municipioDetalhe) {
    return (
      <div className="estado-page">
        <ErrorBoundary onFechar={() => setMunicipioDetalhe(null)}>
          <DetalheMunicipio
            municipio={municipioDetalhe}
            uf={uf}
            onFechar={() => setMunicipioDetalhe(null)}
          />
        </ErrorBoundary>
      </div>
    );
  }
  if (recursosDetalhe) {
    return (
      <div className="estado-page">
        <RecursosMunicipioDetalhe
          uf={uf}
          ufNome={nome}
          municipios={municipios}
          onFechar={() => setRecursosDetalhe(false)}
        />
      </div>
    );
  }

  return (
    <div className="estado-page">
      <PageNav sections={PAGE_SECTIONS} position="right" />
      <div className="estado-header" id="estado-inicio">
        <h1>Conhecendo {nome}</h1>
        <span className="uf-badge">{ufSigla}</span>
        {populacao > 0 && <span className="pop-badge">Pop: {fmtNum(populacao)} hab.</span>}
        <button className="voltar-btn" onClick={() => window.close()}>× Fechar</button>
      </div>

      <ContadoresBar
        prefeitos={prefeitos2024.length}
        vices={vices2024.length}
        vereadores={vereadores2024.length}
        deputados={listaDeputados.length}
        senadores={listaSenadores.length}
        municipios={municipios.length}
        pequenos={municipios.filter(m => m.populacao > 0 && m.populacao < 10000).length}
        populacao={populacaoTotal}
      />

      {/* ── Candidatos ── */}
      <div id="estado-candidatos">
        <div className="politicos-grid">
          <div className="estado-section" id="estado-prefeitos">
            <div className="estado-section-header" onClick={() => toggleCollapse('prefeitos')}>
              <h2>Prefeitos Eleitos <span className="count">({listaPrefeitos.length})</span><InfoBadge chave="tse_candidatos" onInfoClick={setPopupInfo} /></h2>
              <span className="estado-section-toggle">{collapsed.prefeitos ? '▶' : '▼'}</span>
            </div>
            {!collapsed.prefeitos && (
              <div className="estado-section-body estado-section-body--scroll">
                {candidatos ? (
                  listaPrefeitos.length > 0 ? (
                    <TabelaCandidatos dados={listaPrefeitos} titulo="" semSecao />
                  ) : (
                    <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum prefeito encontrado</p>
                  )
                ) : (
                  <div className="municipios-loading">Carregando prefeitos...</div>
                )}
              </div>
            )}
          </div>

          <div className="estado-section" id="estado-vice">
            <div className="estado-section-header" onClick={() => toggleCollapse('vice')}>
              <h2>Vice-Prefeitos Eleitos <span className="count">({listaVice.length})</span><InfoBadge chave="tse_candidatos" onInfoClick={setPopupInfo} /></h2>
              <span className="estado-section-toggle">{collapsed.vice ? '▶' : '▼'}</span>
            </div>
            {!collapsed.vice && (
              <div className="estado-section-body estado-section-body--scroll">
                {candidatos ? (
                  listaVice.length > 0 ? (
                    <TabelaCandidatos dados={listaVice} titulo="" semSecao />
                  ) : (
                    <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum vice-prefeito encontrado</p>
                  )
                ) : (
                  <div className="municipios-loading">Carregando vice-prefeitos...</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="estado-section politicos-grid-full" id="estado-vereadores">
          <div className="estado-section-header" onClick={() => toggleCollapse('vereadores')}>
            <h2>Vereadores Eleitos <span className="count">({listaVereadores.length})</span><InfoBadge chave="tse_candidatos" onInfoClick={setPopupInfo} /></h2>
            <span className="estado-section-toggle">{collapsed.vereadores ? '▶' : '▼'}</span>
          </div>
          {!collapsed.vereadores && (
            <div className="estado-section-body estado-section-body--scroll">
              {candidatos ? (
                listaVereadores.length > 0 ? (
                  <TabelaCandidatos dados={listaVereadores} titulo="" semSecao />
                ) : (
                  <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum vereador encontrado</p>
                )
              ) : (
                <div className="municipios-loading">Carregando vereadores...</div>
              )}
            </div>
          )}
        </div>

        <div className="politicos-grid">
          <div className="estado-section" id="estado-deputados" ref={depSectionRef}>
            <div className="estado-section-header" onClick={() => toggleCollapse('deputados')}>
              <h2>Deputados Federais <span className="count">({depFiltrados.length}/{listaDeputados.length})</span><InfoBadge chave="camara_deputados" onInfoClick={setPopupInfo} /></h2>
              <span className="estado-section-toggle">{collapsed.deputados ? '▶' : '▼'}</span>
            </div>
            {!collapsed.deputados && (
              <div className="estado-section-body">
                {listaDeputados.length > 0 ? (
                  <>
                    <SearchAutocomplete
                      dados={listaDeputados}
                      placeholder="🔍 Buscar deputado por nome ou partido..."
                      campoNome="nome"
                      campoPartido="sigla_partido"
                      onFilter={setDepBuscaTexto}
                    />
                    {depFiltrados.length > 0 ? (
                      <>
                        <div className="dep-grid">
                          {depPag.paginaDados.map(d => (
                            <div key={d.id} className="dep-card">
                              <div className="dep-card-foto-wrap">
                                <img className="dep-card-foto" src={d.url_foto} alt={d.nome} onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                              <div className="dep-card-info">
                                <strong className="dep-card-nome">{d.nome}</strong>
                                <div className="dep-card-badges">
                                  <span className="tag tag-candidato">{d.sigla_partido}</span>
                                  <span className="dep-card-uf">{d.sigla_uf}</span>
                                </div>
                                {d.nome_eleitoral && (
                                  <span className="dep-card-extra">🗳 {d.nome_eleitoral}</span>
                                )}
                              </div>
                              <button className="btn btn-sm btn-outline-accent dep-card-btn" onClick={() => setDepDetalhe(d)}>Detalhes</button>
                            </div>
                          ))}
                        </div>
                        <Paginacao pagina={depPag.pagina} totalPaginas={depPag.totalPaginas} onPagina={depPag.setPagina} />
                      </>
                    ) : (
                      <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum deputado encontrado para os filtros atuais</p>
                    )}
                  </>
                ) : deputados !== null ? (
                  <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum deputado encontrado</p>
                ) : (
                  <div className="municipios-loading">Carregando deputados...</div>
                )}
              </div>
            )}
          </div>

          <div className="estado-section" id="estado-senadores">
            <div className="estado-section-header" onClick={() => toggleCollapse('senadores')}>
              <h2>Senadores <span className="count">({listaSenadores.length})</span><InfoBadge chave="senado_federal" onInfoClick={setPopupInfo} /></h2>
              <span className="estado-section-toggle">{collapsed.senadores ? '▶' : '▼'}</span>
            </div>
            {!collapsed.senadores && (
              <div className="estado-section-body">
                {listaSenadores.length > 0 ? (
                  <div className="ad-grid">
                    {listaSenadores.map(s => (
                      <div key={s.codigo} className="ad-card-dep">
                        <img className="ad-foto" src={s.url_foto} alt={s.nome_parlamentar} onError={(e) => { e.target.style.display = 'none'; }} />
                        <div className="ad-card-dep-info">
                          <strong className="ad-card-dep-nome">{s.nome_parlamentar}</strong>
                          <span className="ad-card-dep-partido">
                            <span className="tag tag-candidato">{s.partido}</span>
                            <span className="ad-card-dep-uf">{s.uf}</span>
                          </span>
                          {s.nome_completo && (
                            <span className="ad-card-dep-extra" style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              {s.nome_completo}
                            </span>
                          )}
                        </div>
                        <button className="btn btn-sm btn-outline-accent" onClick={() => setSenDetalhe(s)}>Detalhes</button>
                      </div>
                    ))}
                  </div>
                ) : senadores !== null ? (
                  <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum senador encontrado</p>
                ) : (
                  <div className="municipios-loading">Carregando senadores...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="estado-section" id="estado-financas">
        <div className="estado-section-header" onClick={() => toggleCollapse('financas')}>
          <h2>Dados Financeiros</h2>
          <span className="estado-section-toggle">{collapsed.financas ? '▶' : '▼'}</span>
        </div>
        {!collapsed.financas && (
        <div className="estado-section-body">
          <div className="estado-toolbar" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Anos:</span>
            {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - i).reverse().map(ano => (
              <button
                key={ano}
                className={`ano-btn ${anosSelecionados.includes(ano) ? 'ativo' : ''}`}
                onClick={() => toggleAno(ano)}
              >
                {ano}{anoAtualCarregando === ano ? ' ⟳' : ''}
              </button>
            ))}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: 16 }}>Mês:</span>
            <select value={mesSelecionado} onChange={e => setMesSelecionado(Number(e.target.value))}
              style={{ padding: '6px 8px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)' }}>
              <option value={0}>Todos</option>
              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((nome, i) => (
                <option key={i+1} value={i+1}>{nome}</option>
              ))}
            </select>
            {Object.keys(finCache).length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                {Object.keys(finCache).length} ano(s) carregado(s)
              </span>
            )}
            <button className="btn btn-sm" onClick={recarregarTudo} style={{ marginLeft: 'auto' }}>Recarregar</button>
          </div>

          {finErro && (
            <div className="estado-erro" style={{ marginBottom: 12 }}>{finErro}</div>
          )}

          {finDespesaPessoal && (
            <div className="estado-subsection">
              <div className="estado-section-header" onClick={() => toggleCollapse('despesa_pessoal')}>
                <h2>Despesa com Pessoal <span className="count">(Executivo)</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="siconfi_despesa_pessoal" onInfoClick={setPopupInfo} /></h2>
                <span className="estado-section-toggle">{collapsed.despesa_pessoal ? '▶' : '▼'}</span>
              </div>
              {!collapsed.despesa_pessoal && (
                <div className="dm-cards" style={{ paddingTop: 12 }}>
                  <FinCard label="Total Despesa Pessoal" value={fmtMoney(finDespesaPessoal.valor_total)} />
                  <FinCard label="% da RCL" value={fmtNum(finDespesaPessoal.percentual_rcl) + '%'} />
                  <FinCard label="Exercício" value={finDespesaPessoal.periodo} />
                </div>
              )}
            </div>
          )}

          {finDespesaCategoria && finDespesaCategoria.length > 0 && (
            <div className="estado-subsection">
              <div className="estado-section-header" onClick={() => toggleCollapse('despesa_categoria')}>
                <h2>Despesa com Pessoal por Categoria <span className="count">({finDespesaCategoria.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="siconfi_despesa_categoria" onInfoClick={setPopupInfo} /></h2>
                <span className="estado-section-toggle">{collapsed.despesa_categoria ? '▶' : '▼'}</span>
              </div>
              {!collapsed.despesa_categoria && (
                <div className="estado-section-body--scroll" style={{ paddingTop: 12 }}>
                <table className="estado-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Qtd</th>
                      <th>Despesa Total</th>
                      <th>% Despesa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finDespesaCategoria.map((c, i) => (
                      <tr key={i}>
                        <td>{c.categoria || '-'}</td>
                        <td>{c.quantidade != null ? c.quantidade : '-'}</td>
                        <td>{fmtMoney(c.despesa_total)}</td>
                        <td>{c.percentual_despesa != null ? c.percentual_despesa.toFixed(2) + '%' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {finGastosFuncao && finGastosFuncao.length > 0 && (
            <div className="estado-subsection">
              <div className="estado-section-header" onClick={() => toggleCollapse('gastos_por_funcao')}>
                <h2>Gastos por Função <span className="count">({finGastosFuncao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="siconfi_gastos_funcao" onInfoClick={setPopupInfo} /></h2>
                <span className="estado-section-toggle">{collapsed.gastos_por_funcao ? '▶' : '▼'}</span>
              </div>
              {!collapsed.gastos_por_funcao && (
                <div className="estado-section-body--scroll" style={{ paddingTop: 12 }}>
                <table className="estado-table">
                  <thead>
                    <tr>
                      <th>Função</th>
                      <th>Empenhado</th>
                      <th>Liquidado</th>
                      <th>Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finGastosFuncao.map((g, i) => (
                      <tr key={i}>
                        <td>{g.funcao}</td>
                        <td>{fmtMoney(g.empenhado)}</td>
                        <td>{fmtMoney(g.liquidado)}</td>
                        <td>{fmtMoney(g.pago)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {finReceitas && finReceitas.length > 0 && (
            <div className="estado-subsection">
              <div className="estado-section-header" onClick={() => toggleCollapse('receitas')}>
                <h2>Receitas <span className="count">({finReceitas.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anoExibicao}</span><InfoBadge chave="siconfi_receitas" onInfoClick={setPopupInfo} /></h2>
                <span className="estado-section-toggle">{collapsed.receitas ? '▶' : '▼'}</span>
              </div>
              {!collapsed.receitas && (
                <div className="estado-section-body--scroll" style={{ paddingTop: 12 }}>
                <table className="estado-table">
                  <thead>
                    <tr>
                      <th>Conta</th>
                      <th>Coluna</th>
                      <th>Exercício</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finReceitas.map((r, i) => (
                      <tr key={i}>
                        <td>{r.conta || '-'}</td>
                        <td className="dm-obj-col">{r.coluna || '-'}</td>
                        <td>{r.exercicio || '-'}</td>
                        <td>{fmtMoney(r.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          <div className="estado-subsection">
            <div className="estado-section-header" onClick={() => toggleCollapse('recursos_federais')}>
              <h2>Recursos Federais Recebidos <span className="count">({recursosFedExibicao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{anosSelecionados.sort().join(', ')}</span><button className="btn btn-sm btn-outline-accent" style={{ marginLeft: 8 }} onClick={(e) => { e.stopPropagation(); setRecursosDetalhe(true); }}>Detalhes ▸</button><InfoBadge chave="portal_recursos" onInfoClick={setPopupInfo} /></h2>
              <span className="estado-section-toggle">{collapsed.recursos_federais ? '▶' : '▼'}</span>
            </div>
            {!collapsed.recursos_federais && recursosFedExibicao.length > 0 && (
            <div style={{ paddingTop: 12 }}>
              {chartData && (
                <div className="chart-row">
                  <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Tipo Pessoa', data: chartData.tipoPessoa })}>
                    <div className="chart-card-title">Tipo Pessoa</div>
                    <PieChart data={chartData.tipoPessoa} size={CHART_SIZE_MD} />
                  </div>
                  <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Recursos por Órgão', data: chartData.porOrgao })}>
                    <div className="chart-card-title">Por Órgão</div>
                    <PieChart data={chartData.porOrgao} size={CHART_SIZE_MD} />
                  </div>
                  <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Recursos por Órgão Superior', data: chartData.porOrgaoSuperior })}>
                    <div className="chart-card-title">Órgão Superior</div>
                    <PieChart data={chartData.porOrgaoSuperior} size={CHART_SIZE_MD} />
                  </div>
                  <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Recursos por Mês/Ano', data: chartData.porMesAno })}>
                    <div className="chart-card-title">Por Mês/Ano</div>
                    <PieChart data={chartData.porMesAno} size={CHART_SIZE_MD} />
                  </div>
                </div>
              )}
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
                  {recursosFedPag.paginaDados.map((rf, i) => (
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
              <Paginacao pagina={recursosFedPag.pagina} totalPaginas={recursosFedPag.totalPaginas} onPagina={recursosFedPag.setPagina} />
            </div>)}
            {!collapsed.recursos_federais && recursosFedExibicao.length === 0 && (
              <div className="rp-empty" style={{ padding: 20, textAlign: 'center' }}>
                {anoAtualCarregando ? 'Carregando dados...' : 'Selecione anos e meses acima para carregar os dados'}
              </div>
            )}
          </div>
        </div>)}
      </div>

      <div className="estado-section" id="estado-licitacoes">
        <div className="estado-section-header" onClick={() => toggleCollapse('licitacoes')}>
          <h2>Licitações (PNCP) <span className="count">({licExibicao.length})</span><span className="tag tag-candidato" style={{ marginLeft: 8 }}>{licChavesSelecionadas.size > 0 ? [...licChavesSelecionadas].sort().join(', ') : ''}</span><InfoBadge chave="pncp_licitacoes" onInfoClick={setPopupInfo} /></h2>
          <span className="estado-section-toggle">{collapsed.licitacoes ? '▶' : '▼'}</span>
        </div>
        {!collapsed.licitacoes && (
        <div className="estado-section-body">
          <div className="estado-toolbar" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ano:</span>
            <input
              type="text"
              placeholder="2024"
              value={licAnoInput}
              onChange={e => setLicAnoInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') licBuscar(); }}
              style={{ width: 70, padding: '6px 8px', fontSize: '0.78rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-primary)', borderRadius: 4 }}
              maxLength={4}
              disabled={licEmAndamento}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: 4 }}>Trimestre:</span>
            {[1, 2, 3, 4].map(t => (
              <button key={t} className={`ano-btn${licTrimestresSelecionados.has(t) ? ' ativo' : ''}`} onClick={() => toggleTrimestre(t)} disabled={licEmAndamento}>
                Q{t}
              </button>
            ))}
            <button className="btn btn-sm" onClick={licBuscar} disabled={licEmAndamento || !licAnoInput.trim().match(/^\d{4}$/)}>
              {licEmAndamento ? '⟳ Buscando...' : 'Buscar'}
            </button>
            {licEmAndamento && (
              <button className="btn btn-sm" onClick={licCancelar} style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                Cancelar
              </button>
            )}
            {Object.keys(licCache).length > 0 && !licEmAndamento && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                {Object.keys(licCache).length} trimestre(s) buscado(s)
              </span>
            )}
            {licErro && !licEmAndamento && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{licErro}</span>}
          </div>

          {licEmAndamento && (
            <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
              <div className="spinner-sm" />
              <span>Progresso: {licProgresso.buscados} de {licProgresso.total} trimestre(s) buscado(s)</span>
            </div>
          )}

          {Object.keys(licCache).length > 0 && (
            <div className="estado-toolbar" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chaves buscadas:</span>
              {Object.keys(licCache).sort().map(chave => (
                <span key={chave} className="ano-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.78rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                    <input type="checkbox" checked={licChavesSelecionadas.has(chave)} onChange={() => licToggleChave(chave)} style={{ margin: 0 }} />
                    {chave}
                  </label>
                  {!licEmAndamento && (
                    <button
                      onClick={() => licRemoverChave(chave)}
                      title="Remover"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {licExibicao.length > 0 ? (
            <>
              {licChartData && (
                <div className="chart-row">
                  <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Licitações por Categoria', data: licChartData })}>
                    <div className="chart-card-title">Categorias</div>
                    <PieChart data={licChartData} size={CHART_SIZE_MD} />
                  </div>
                  {licFaixaChartData && (
                    <div className="chart-card-sm chart-clickable" onClick={() => setChartPopup({ titulo: 'Licitações por Faixa de Valor', data: licFaixaChartData })}>
                      <div className="chart-card-title">Faixa de Valores</div>
                      <PieChart data={licFaixaChartData} size={CHART_SIZE_MD} />
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
                      <td style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{fmtData(c.dataVigenciaInicio)} ~ {fmtData(c.dataVigenciaFim)}</td>
                      <td style={{ fontSize: '0.7rem' }}>{fmtData(c.dataPublicacaoPncp)}</td>
                      <td>{fmtMoney(c.valorGlobal ?? c.valorTotalEstimado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Paginacao pagina={licPag.pagina} totalPaginas={licPag.totalPaginas} onPagina={licPag.setPagina} />
              <p className="dm-hint">Clique em um contrato para ver detalhes completos</p>
            </>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
              {licEmAndamento ? 'Buscando licitações...' : Object.keys(licCache).length === 0 ? 'Insira um ano, selecione os trimestres e clique em Buscar' : 'Nenhum dado encontrado para as chaves selecionadas'}
            </div>
          )}
        </div>)}
      </div>

      <div className="estado-section" id="estado-municipios">
        <div className="estado-section-header" onClick={() => toggleCollapse('municipios')}>
          <h2>Municípios <span className="count">({munFiltrados.length}/{municipios.length} no total)</span><InfoBadge chave="tse_candidatos" onInfoClick={setPopupInfo} /></h2>
          <span className="estado-section-toggle">{collapsed.municipios ? '▶' : '▼'}</span>
        </div>
        {!collapsed.municipios && (
          <div className="estado-section-body">
          {basico ? (
            <>
              <div className="search-filter-bar">
                <input
                  className="search-input"
                  type="text"
                  placeholder="🔍 Buscar município por nome..."
                  value={munNomeBusca}
                  onChange={(e) => setMunNomeBusca(e.target.value)}
                />
              </div>
              <div className="municipios-loading">
                {municipios.length > 0
                  ? `${munFiltrados.length} de ${municipios.length} municípios • do menor para o maior`
                  : 'Carregando municípios...'}
              </div>
              {munFiltrados.length > 0 ? (
                <div className="estado-cards">
                  {munFiltrados.map(m => (
                    <div key={m.id} className="estado-card">
                      <div className="municipio-nome">{m.nome}</div>
                      <div className="municipio-pop">
                        {m.populacao ? `Pop: ${fmtNum(m.populacao)} hab.` : ''}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-accent"
                        onClick={() => setMunicipioDetalhe(m)}
                      >
                        Detalhes
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Nenhum município encontrado para o filtro</p>
              )}
            </>
          ) : (
            <div className="municipios-loading">Carregando municípios...</div>
          )}
          </div>
        )}
      </div>

      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}

      {chartPopup && (
        <div className="dm-modal-overlay" onClick={() => setChartPopup(null)}>
          <div className="dm-modal chart-popup-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="dm-modal-header">
              <h3>{chartPopup.titulo}</h3>
              <button className="dm-modal-close" onClick={() => setChartPopup(null)}>×</button>
            </div>
            <div className="dm-modal-body" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <PieChart data={chartPopup.data} size={CHART_SIZE_LG} />
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
