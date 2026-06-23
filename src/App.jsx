import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import Formulario from './components/Formulario';
import FormularioPublicacao from './components/FormularioPublicacao';
import Progresso from './components/Progresso';
import Resultados from './components/Resultados';

import LigacaoPolitica from './components/LigacaoPolitica';
import RelacoesPoliticas from './components/RelacoesPoliticas';
import BuscaCargo from './components/BuscaCargo';
import BuscaPartido from './components/BuscaPartido';
import BuscaDoador from './components/BuscaDoador';
import BuscaFornecedor from './components/BuscaFornecedor';
import AnaliseDetalhada, { ObjCard } from './components/AnaliseDetalhada';
import { JanelaPopup, ContratoDetalhes } from './components/Resultados';
import EntityPopup from './components/EntityPopup';
import AnaliseDeputados from './components/AnaliseDeputados';
import AnaliseSenadores from './components/AnaliseSenadores';
import AnaliseTCU from './components/AnaliseTCU';
import PortalOrgaos from './components/PortalOrgaos';
import PortalPessoas from './components/PortalPessoas';
import PortalCartoes from './components/PortalCartoes';
import PortalServidores from './components/PortalServidores';
import PortalDespesas from './components/PortalDespesas';
import PortalEmendas from './components/PortalEmendas';
import WikiPesquisa from './components/WikiPesquisa';
import MapaBrasil from './components/MapaBrasil';
import ConhecendoEstado from './components/ConhecendoEstado';
import API_BASE_URL from './config';
import './App.css';

let uid = 0;
let lpUid = 0;
let adUid = 0;
let rpUid = 0;
let ptUid = 0;

function fmtDoc(d) {
  if (!d) return '';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

export default function App() {
  return (
    <Routes>
      <Route path="/estado/:uf" element={<ConhecendoEstado />} />
      <Route path="*" element={<AppInterno />} />
    </Routes>
  );
}

function AppInterno() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('podp-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('podp-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [consultas, setConsultas] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [formAberto, setFormAberto] = useState(true);
  const [tipoBusca, setTipoBusca] = useState('orgao');

  const [subTabs, setSubTabs] = useState([]);
  const [subTabAtiva, setSubTabAtiva] = useState('geral');
  const [ligPoliticaCache, setLigPoliticaCache] = useState([]);
  const [ligPoliticaAberta, setLigPoliticaAberta] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('home');
  const [pncpDestacado, setPncpDestacado] = useState(null);
  const [lpResultados, setLpResultados] = useState(null);
  const [popup, setPopup] = useState(null);
  const [lpDataCache, setLpDataCache] = useState({});

  const [adAnalises, setAdAnalises] = useState([]);
  const [adTabAtiva, setAdTabAtiva] = useState('geral');
  const [rpCache, setRpCache] = useState([]);
  const [rpTopAba, setRpTopAba] = useState('geral');
  const [ptTopAba, setPtTopAba] = useState('geral');

  const RP_METODOS = [
    { key: 'empresas', label: 'TSE - Empresas', desc: 'Despesas e receitas eleitorais de campanha por CNPJ de empresa', Component: RelacoesPoliticas },
    { key: 'cargo', label: 'Políticos por Cargo', desc: 'Busca de candidatos eleitos e suplentes por cargo e localidade', Component: BuscaCargo },
    { key: 'partido', label: 'Políticos por Partido', desc: 'Candidatos e filiados filtrados por partido político', Component: BuscaPartido },
    { key: 'doador', label: 'Relação de Doadores', desc: 'Doadores de campanha vinculados a empresas e pessoas físicas', Component: BuscaDoador },
    { key: 'fornecedor', label: 'Relação de Fornecedores', desc: 'Fornecedores de campanhas eleitorais', Component: BuscaFornecedor },
  ];

  const PT_METODOS = [
    { key: 'orgaos', label: 'Órgãos', desc: 'Consulta de órgãos públicos federais por código ou nome', Component: PortalOrgaos },
    { key: 'pessoas', label: 'Pessoas', desc: 'Busca de pessoas físicas com vínculos públicos por CPF ou nome', Component: PortalPessoas },
    { key: 'cartoes', label: 'Cartões', desc: 'Gastos com cartões corporativos por órgão ou portador', Component: PortalCartoes },
    { key: 'servidores', label: 'Servidores', desc: 'Servidores públicos federais por CPF, nome ou órgão', Component: PortalServidores },
    { key: 'despesas', label: 'Despesas', desc: 'Despesas do governo federal por órgão, ano ou favorecido', Component: PortalDespesas },
    { key: 'emendas', label: 'Emendas', desc: 'Emendas parlamentares por código, autor ou ano', Component: PortalEmendas },
  ];

  const [rpMetodoState, setRpMetodoState] = useState(
    Object.fromEntries(RP_METODOS.map(m => [m.key, { subs: [], ativa: 'geral' }]))
  );
  const [rpDataCache, setRpDataCache] = useState({});
  const [ptMetodoState, setPtMetodoState] = useState(
    Object.fromEntries(PT_METODOS.map(m => [m.key, { subs: [], ativa: 'geral' }]))
  );
  const [ptDataCache, setPtDataCache] = useState({});
  const [analiseDetalhadaLoading, setAnaliseDetalhadaLoading] = useState(false);
  const [entidadeCache, setEntidadeCache] = useState({});
  const subTabsRef = useRef(subTabs);
  const adAnalisesRef = useRef(adAnalises);
  const rpDataCacheRef = useRef(rpDataCache);
  const rpMetodoStateRef = useRef(rpMetodoState);
  const ptDataCacheRef = useRef(ptDataCache);
  const ptMetodoStateRef = useRef(ptMetodoState);
  useEffect(() => { subTabsRef.current = subTabs; }, [subTabs]);
  useEffect(() => { adAnalisesRef.current = adAnalises; }, [adAnalises]);
  useEffect(() => { rpDataCacheRef.current = rpDataCache; }, [rpDataCache]);
  useEffect(() => { rpMetodoStateRef.current = rpMetodoState; }, [rpMetodoState]);
  useEffect(() => { ptDataCacheRef.current = ptDataCache; }, [ptDataCache]);
  useEffect(() => { ptMetodoStateRef.current = ptMetodoState; }, [ptMetodoState]);

  const handleIniciar = useCallback((jobId, meta) => {
    setActiveJob({ jobId, meta });
    setFormAberto(false);
  }, []);

  const handleFinalizar = useCallback((resultados, meta, paginasErro) => {
    const nova = {
      id: ++uid,
      timestamp: new Date().toISOString(),
      meta: { ...meta, paginasErro },
      resultados,
    };
    setConsultas((prev) => [nova, ...prev]);
    setActiveJob(null);
  }, []);

  const handleApagar = useCallback((id) => {
    setConsultas((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCancelarJob = useCallback(() => {
    setActiveJob(null);
    setFormAberto(true);
  }, []);

  const handleSalvarLP = useCallback((item) => {
    const novo = { ...item, id: ++lpUid };
    setLigPoliticaCache((prev) => [novo, ...prev]);
  }, []);

  const handleEditarLP = useCallback((id, novosDados) => {
    setLigPoliticaCache((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...novosDados } : c))
    );
  }, []);

  const handleApagarLP = useCallback((id) => {
    setLigPoliticaCache((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleSalvarRP = useCallback((item) => {
    const novo = { ...item, id: ++rpUid };
    setRpCache((prev) => [novo, ...prev]);
  }, []);

  const handleApagarRP = useCallback((id) => {
    setRpCache((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleRPSearchComplete = useCallback((method, searchParams, data) => {
    const existing = Object.values(rpDataCacheRef.current).find(item => {
      if (item.method !== method) return false;
      if (method === 'empresas') return item.searchParams === searchParams;
      return false;
    });
    if (existing) {
      setRpDataCache(prev => ({ ...prev, [existing.id]: { ...existing, data, timestamp: new Date().toISOString() } }));
      setRpMetodoState(prev => {
        const m = prev[method];
        if (!m.subs.includes(existing.id)) {
          return { ...prev, [method]: { subs: [...m.subs, existing.id], ativa: `rp-${existing.id}` } };
        }
        return { ...prev, [method]: { ...m, ativa: `rp-${existing.id}` } };
      });
      setRpTopAba(method);
      setAbaAtiva('relacoes');
      return;
    }
    const id = ++rpUid;
    setRpDataCache(prev => ({ ...prev, [id]: { searchParams, data, id, method, timestamp: new Date().toISOString() } }));
    setRpMetodoState(prev => {
      if (!prev[method]) return { ...prev, [method]: { subs: [id], ativa: `rp-${id}` } };
      const m = prev[method];
      if (m.subs.includes(id)) return { ...prev, [method]: { ...m, ativa: `rp-${id}` } };
      return { ...prev, [method]: { subs: [...m.subs, id], ativa: `rp-${id}` } };
    });
    setRpTopAba(method);
    setAbaAtiva('relacoes');
  }, []);

  const handleFecharRPSubTab = useCallback((method, key) => {
    const id = Number(key.replace('rp-', ''));
    setRpMetodoState(prev => {
      const m = prev[method];
      const novaSubs = m.subs.filter(t => t !== id);
      const novaAtiva = m.ativa === key ? (novaSubs.length > 0 ? `rp-${novaSubs[novaSubs.length - 1]}` : 'geral') : m.ativa;
      return { ...prev, [method]: { subs: novaSubs, ativa: novaAtiva } };
    });
  }, []);

  const handleAbrirRPSalvo = useCallback((item) => {
    const method = item.method || 'empresas';
    const id = item.id;
    setRpDataCache(prev => ({ ...prev, [id]: item }));
    setRpMetodoState(prev => {
      if (!prev[method]) return { ...prev, [method]: { subs: [id], ativa: `rp-${id}` } };
      const m = prev[method];
      if (m.subs.includes(id)) return { ...prev, [method]: { ...m, ativa: `rp-${id}` } };
      return { ...prev, [method]: { subs: [...m.subs, id], ativa: `rp-${id}` } };
    });
    setRpTopAba(method);
    setAbaAtiva('relacoes');
  }, []);

  const handleAbrirMetodoRP = useCallback((method) => {
    setRpTopAba(method);
    setAbaAtiva('relacoes');
  }, []);

  const handlePTSearchComplete = useCallback((method, searchParams, data) => {
    const existing = Object.values(ptDataCacheRef.current).find(item => {
      if (item.method !== method) return false;
      // Simplified check - can be enhanced
      return false;
    });
    if (existing) {
      setPtDataCache(prev => ({ ...prev, [existing.id]: { ...existing, data, timestamp: new Date().toISOString() } }));
      setPtMetodoState(prev => {
        const m = prev[method];
        if (!m.subs.includes(existing.id)) {
          return { ...prev, [method]: { subs: [...m.subs, existing.id], ativa: `pt-${existing.id}` } };
        }
        return { ...prev, [method]: { ...m, ativa: `pt-${existing.id}` } };
      });
      setPtTopAba(method);
      setAbaAtiva('portal');
      return;
    }
    const id = ++ptUid;
    setPtDataCache(prev => ({ ...prev, [id]: { searchParams, data, id, method, timestamp: new Date().toISOString() } }));
    setPtMetodoState(prev => {
      if (!prev[method]) return { ...prev, [method]: { subs: [id], ativa: `pt-${id}` } };
      const m = prev[method];
      if (m.subs.includes(id)) return { ...prev, [method]: { ...m, ativa: `pt-${id}` } };
      return { ...prev, [method]: { subs: [...m.subs, id], ativa: `pt-${id}` } };
    });
    setPtTopAba(method);
    setAbaAtiva('portal');
  }, []);

  const handleFecharPTSubTab = useCallback((method, key) => {
    const id = Number(key.replace('pt-', ''));
    setPtMetodoState(prev => {
      const m = prev[method];
      const novaSubs = m.subs.filter(t => t !== id);
      const novaAtiva = m.ativa === key ? (novaSubs.length > 0 ? `pt-${novaSubs[novaSubs.length - 1]}` : 'geral') : m.ativa;
      return { ...prev, [method]: { subs: novaSubs, ativa: novaAtiva } };
    });
  }, []);

  const handleAbrirMetodoPT = useCallback((method) => {
    setPtTopAba(method);
    setAbaAtiva('portal');
  }, []);

  const tabKey = useCallback((tab) => tab.kind === 'consulta' ? `consulta-${tab.id}` : 'ad', []);

  const handleAbrirLigacaoPolitica = useCallback((consultaId) => {
    setLigPoliticaAberta(null);
    if (consultaId && consultaId !== 'all') {
      setSubTabs(prev => {
        if (prev.some(t => t.kind === 'consulta' && t.id === consultaId)) return prev;
        return [...prev, { kind: 'consulta', id: consultaId }];
      });
      setSubTabAtiva(`consulta-${consultaId}`);
    } else {
      setSubTabAtiva('geral');
    }
    setAbaAtiva('ligacao-politica');
  }, []);

  const handleFecharSubTab = useCallback((key) => {
    const current = subTabsRef.current;
    const idx = current.findIndex(t => tabKey(t) === key);
    if (idx === -1) return;
    const nova = current.filter((_, i) => i !== idx);
    let nextAtiva = subTabAtiva;
    if (subTabAtiva === key) {
      nextAtiva = nova.length > 0 ? tabKey(nova[nova.length - 1]) : 'geral';
    }
    setSubTabs(nova);
    setSubTabAtiva(nextAtiva);
  }, [subTabAtiva, tabKey]);

  const handleFecharADAnalise = useCallback((id) => {
    const idNum = Number(id);
    const remaining = adAnalisesRef.current.filter(a => a.id !== idNum);
    setAdAnalises(remaining);
    setAdTabAtiva(prev => prev === String(idNum) ? 'geral' : prev);
    if (remaining.length === 0) {
      setSubTabs(prev => prev.filter(t => t.kind !== 'ad'));
      setSubTabAtiva(prev => prev === 'ad' ? 'geral' : prev);
    }
  }, []);

  const handleAbrirSalvoLP = useCallback((id) => {
    const item = ligPoliticaCache.find((c) => c.id === id);
    if (item) {
      setLigPoliticaAberta(item);
      setAbaAtiva('ligacao-politica');
    }
  }, [ligPoliticaCache]);

  const handleLPDadosAtualizados = useCallback((data) => {
    setLpResultados(data);
  }, []);

  const handleLPResults = useCallback((consultaId, data, licitacoes) => {
    setLpDataCache(prev => ({ ...prev, [consultaId || 'all']: { data, licitacoes, timestamp: Date.now() } }));
  }, []);

  const handleAnaliseDetalhada = useCallback(async (contrato) => {
    setAnaliseDetalhadaLoading(true);
    const licitacoes = [];
    const seen = new Set();
    const mainDoc = contrato.fornecedor?.cnpj || contrato.niFornecedor || contrato.orgaoEntidade?.cnpj;
    if (mainDoc && mainDoc.length >= 3) {
      const key = `${contrato.numeroControlePNCP || ''}_${mainDoc}`;
      if (!seen.has(key)) {
        seen.add(key);
        licitacoes.push({
          numero_controle_pncp: contrato.numeroControlePNCP || '',
          cpf_cnpj: mainDoc,
          socios: (contrato.fornecedor?.qsa || []).map(s => ({
            nome: s.nome_socio || '',
            documento: s.cnpj_cpf_socio || ''
          }))
        });
      }
    }
    if (contrato.niFornecedor && contrato.niFornecedor !== mainDoc && contrato.niFornecedor.length >= 3) {
      const key = `${contrato.numeroControlePNCP || ''}_ni_${contrato.niFornecedor}`;
      if (!seen.has(key)) {
        seen.add(key);
        licitacoes.push({
          numero_controle_pncp: contrato.numeroControlePNCP || '',
          cpf_cnpj: contrato.niFornecedor,
          socios: []
        });
      }
    }
    (contrato.fornecedor?.qsa || []).forEach(s => {
      const sd = s.cnpj_cpf_socio;
      if (sd && sd.length >= 3 && sd !== mainDoc && sd !== contrato.niFornecedor && !seen.has(`${contrato.numeroControlePNCP || ''}_socio_${sd}`)) {
        seen.add(`${contrato.numeroControlePNCP || ''}_socio_${sd}`);
        licitacoes.push({
          numero_controle_pncp: contrato.numeroControlePNCP || '',
          cpf_cnpj: sd,
          socios: []
        });
      }
    });

    if (licitacoes.length === 0) {
      setAnaliseDetalhadaLoading(false);
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/busca/contexto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licitacoes }),
      });
      const json = await resp.json();
      const id = ++adUid;
      const analise = {
        id,
        licitacao: {
          numeroControlePNCP: contrato.numeroControlePNCP,
          fornecedor: contrato.fornecedor?.razaoSocial || contrato.niFornecedor || '-',
        },
        data: json,
        licitacoes,
        timestamp: new Date().toISOString(),
      };
      setAdAnalises(prev => [...prev, analise]);
      setSubTabs(prev => {
        if (prev.some(t => t.kind === 'ad')) return prev;
        return [...prev, { kind: 'ad' }];
      });
      setSubTabAtiva('ad');
      setAbaAtiva('ligacao-politica');
    } catch (err) {
      console.error('Erro na analise detalhada:', err);
    }
    setAnaliseDetalhadaLoading(false);
  }, []);

  const handleAbrirTodasAnalisesDetalhadas = useCallback(async (itens) => {
    for (const item of itens) {
      const contrato = {
        numeroControlePNCP: item.numero_controle_pncp,
        fornecedor: {
          razaoSocial: item.cpf_cnpj || '-',
          cnpj: item.cpf_cnpj,
          qsa: (item.socios || []).map(s => ({
            nome_socio: s.nome,
            cnpj_cpf_socio: s.documento
          }))
        },
        niFornecedor: null
      };
      await handleAnaliseDetalhada(contrato);
    }
  }, [handleAnaliseDetalhada]);

  const handleNavigateToLicitacao = useCallback((pncp) => {
    setPncpDestacado(pncp);
    setAbaAtiva('licitacoes');
    setTimeout(() => setPncpDestacado(null), 4000);
  }, []);

  const handleLicitacaoPopup = useCallback((pncp) => {
    for (const c of consultas) {
      for (const r of (c.resultados || [])) {
        for (const ct of (r.contratos || [])) {
          if (ct.numeroControlePNCP === pncp) {
            setPopup({ tipo: 'contrato', data: ct, titulo: `Licitação ${pncp}` });
            return;
          }
        }
      }
    }
    setPopup({ tipo: 'contrato', data: { numeroControlePNCP: pncp }, titulo: `Licitação ${pncp}` });
  }, [consultas]);

  const KEY_TO_TIPO = {
    sq_candidato: 'candidato',
    sq_despesa: 'despesa',
    sq_receita: 'receita',
    sq_prestador_contas: 'prestador_contas',
    cpf_cnpj: 'fornecedor',
    cpf: 'candidato',
    cpf_cnpj_doador: 'doador',
  };

  const handleIdClickFromAnalise = useCallback((key, value) => {
    const tipo = KEY_TO_TIPO[key];
    if (tipo) {
      setPopup({ tipo: 'entidade', chave: value, idKey: key });
    } else {
      setPopup({ tipo: 'generic', data: { [key]: value }, titulo: key });
    }
  }, []);

  const handleAtualizarEntidadeCache = useCallback((tipo, chave, dados) => {
    setEntidadeCache(prev => ({ ...prev, [`${tipo}_${chave}`]: dados }));
  }, []);

  const totalOrgaos = consultas.reduce((acc, c) => acc + (c.resultados?.length || 0), 0);

  const pncpComMatch = useMemo(() => {
    if (!lpResultados?.resultados) return new Set();
    const set = new Set();
    lpResultados.resultados.forEach(r => {
      const pncp = r.numero_controle_pncp;
      if (!pncp) return;
      const hasMatch = (r.documentos || []).some(d => (d.vinculos || []).length > 0);
      if (hasMatch) set.add(pncp);
    });
    return set;
  }, [lpResultados]);

  const lpSubTabsAtivas = subTabs.filter(t => t.kind === 'consulta');

  const getAtivaKind = () => subTabAtiva === 'geral' ? 'geral' : subTabAtiva === 'ad' ? 'ad' : 'consulta';
  const getAtivaId = () => {
    if (subTabAtiva === 'geral' || subTabAtiva === 'ad') return null;
    return Number(subTabAtiva.split('-')[1]);
  };

  const lpConsultaIdAtual = getAtivaKind() === 'consulta' ? getAtivaId() : null;
  const lpInitialData = lpDataCache[lpConsultaIdAtual] || (getAtivaKind() === 'geral' ? lpDataCache['all'] || null : null);

  const tabs = [
    { id: 'home',             label: 'Início',                  icon: '▣' },
    { id: 'conheca-estado',  label: 'Conheça seu Estado',  icon: '■' },
    { id: 'licitacoes',       label: 'Licitações',              icon: '▣' },
    { id: 'relacoes',         label: 'TSE',                      icon: '▣' },
    { id: 'portal',           label: 'Portal Transparência',     icon: '▣' },
    { id: 'deputados',        label: 'Análise de Deputados',     icon: '▣' },
    { id: 'senadores',        label: 'Análise de Senadores',     icon: '▣' },
    { id: 'tcu',              label: 'Análises TCU',             icon: '▣' },
    { id: 'wiki-pesquisa',    label: 'Entenda a Ferramenta',      icon: '▣' },
  ];

  const showLpNavBtn = lpResultados && ligPoliticaCache.length > 0;

  return (
    <div className="app">
      <aside className="app-sidebar">
        <div className="sidebar-brand" onClick={() => setAbaAtiva('home')}>
          <span className="sidebar-logo">◆</span>
          <span className="sidebar-title">PODP</span>
          <span className="sidebar-badge">// SYS.v1</span>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${abaAtiva === tab.id ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva(tab.id)}
            >
              <span className="nav-tab-icon">{tab.icon}</span>
              <span className="nav-tab-label">{tab.label}</span>
            </button>
          ))}
          {showLpNavBtn && (
            <button
              className={`nav-tab ${abaAtiva === 'ligacao-politica' ? 'ativo' : ''}`}
              onClick={() => { setSubTabAtiva('geral'); setAbaAtiva('ligacao-politica'); }}
            >
              <span className="nav-tab-icon">▣</span>
              <span className="nav-tab-label">Ligações Políticas</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </aside>

      <main className="app-main">

        {/* ─── HOME / HERO ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'home' ? '' : 'none' }}>
          <section className="hero">
            <div className="hero-bg" />
            <div className="hero-content">
              <div className="hero-badge">// PLATAFORMA DE ANÁLISE // SYS.v1</div>
              <h1 className="hero-title">
                <span className="hero-highlight">PODP - Ambiente de visualização da ferramenta</span>
              </h1>
              <div className="hero-alerta">
                ⚠ ACESSO AO TSE disponivel na interface, mas essa versao ambiente nao possui os dados populados!!! DEMAIS INTEGRACOES EM FUNCIONAMENTO
              </div>
              <div className="hero-actions">
                <button
                  className="hero-cta"
                  onClick={() => { setAbaAtiva('licitacoes'); setFormAberto(true); }}
                >
                  <span className="hero-cta-icon">▸</span>
                  INICIAR ANÁLISE
                </button>
                <button
                  className="hero-cta"
                  onClick={() => setAbaAtiva('conheca-estado')}
                >
                  <span className="hero-cta-icon">▣</span>
                  CONHEÇA SEU ESTADO
                </button>
                <button
                  className="hero-cta-secondary"
                  onClick={() => setAbaAtiva('wiki-pesquisa')}
                >
                  ▣ ENTENDA A FERRAMENTA
                </button>
              </div>
            </div>

            <div className="features" id="mode-cards">
              <div className="feature-card" onClick={() => { setAbaAtiva('licitacoes'); setFormAberto(true); }}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">Licitações</h3>
                <p className="feature-desc">Pesquise licitações e contratos públicos no PNCP por CNPJ de órgão ou por estado/município.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('conheca-estado')}>
                <div className="feature-icon">■</div>
                <h3 className="feature-title">Conheça seu Estado</h3>
                <p className="feature-desc">Explore dados de todos os estados do Brasil: prefeitos, vereadores, deputados e senadores eleitos.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('relacoes')}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">TSE</h3>
                <p className="feature-desc">Consulte dados eleitorais, doações de campanha e conexões partidárias de empresas e candidatos.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('portal')}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">Portal Transparência</h3>
                <p className="feature-desc">Acesse dados do Portal da Transparência do Governo Federal: órgãos, servidores, despesas e emendas.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('deputados')}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">Análise de Deputados</h3>
                <p className="feature-desc">Consulte dados, despesas e atividades de deputados federais registrados na Câmara.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('senadores')}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">Análise de Senadores</h3>
                <p className="feature-desc">Consulte dados, mandatos, comissões e votações de senadores no Senado Federal.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('tcu')}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">Análises TCU</h3>
                <p className="feature-desc">Consulte contas irregulares, prestadores de contas e empresas inidôneas no TCU.</p>
              </div>
              <div className="feature-card" onClick={() => setAbaAtiva('wiki-pesquisa')}>
                <div className="feature-icon">▣</div>
                <h3 className="feature-title">Entenda a Ferramenta</h3>
                <p className="feature-desc">Entenda como usar a plataforma, suas fontes de dados e como interpretar os resultados.</p>
              </div>
              {showLpNavBtn && (
                <div className="feature-card" onClick={() => { setSubTabAtiva('geral'); setAbaAtiva('ligacao-politica'); }}>
                  <div className="feature-icon">▣</div>
                  <h3 className="feature-title">Ligações Políticas</h3>
                  <p className="feature-desc">Cruzamento de dados entre fornecedores de licitações e agentes políticos.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ─── CONHEÇA SEU MUNICÍPIO / MAPA ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'conheca-estado' ? '' : 'none' }}>
          <MapaBrasil />
        </div>

    {/* ─── WIKI PESQUISA ─── */}
    <div className="tab-page" style={{ display: abaAtiva === 'wiki-pesquisa' ? '' : 'none' }}>
      <WikiPesquisa />
    </div>

        {/* ─── LICITAÇÕES ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'licitacoes' ? '' : 'none' }}>
          <div className="tab-content">
            <div className="tab-header">
              <h2 className="tab-title">Busca de Licitações</h2>
              <p className="tab-desc">Consulte contratos públicos no PNCP por órgão ou região.</p>
            </div>

            {activeJob ? (
              <Progresso
                jobId={activeJob.jobId}
                total={activeJob.meta.total}
                meta={activeJob.meta}
                onFinalizar={handleFinalizar}
                onCancelar={handleCancelarJob}
                streamPath={activeJob.meta.tipo === 'publicacao' ? '/publicacao/analise/stream' : '/orgao/analise/stream'}
                batchPath={activeJob.meta.tipo === 'publicacao' ? '/publicacao/analise/batch' : '/orgao/analise/batch'}
              />
            ) : (
              formAberto && (
                <>
                  <div className="tipo-busca-bar">
                    <button
                      className={`tipo-busca-btn ${tipoBusca === 'orgao' ? 'ativo' : ''}`}
                      onClick={() => setTipoBusca('orgao')}
                    >
                      Por CNPJ do Órgão
                    </button>
                    <button
                      className={`tipo-busca-btn ${tipoBusca === 'publicacao' ? 'ativo' : ''}`}
                      onClick={() => setTipoBusca('publicacao')}
                    >
                      Por Estado/Município
                    </button>
                  </div>
                  {tipoBusca === 'orgao' ? (
                    <Formulario onIniciar={handleIniciar} />
                  ) : (
                    <FormularioPublicacao onIniciar={handleIniciar} />
                  )}
                </>
              )
            )}

            <div className="consultas-bar">
              {!formAberto && !activeJob && (
                <button className="btn btn-sm" onClick={() => setFormAberto(true)}>
                  + Nova Consulta
                </button>
              )}
              {consultas.length > 0 && (
                <span className="consultas-count">
                  {consultas.length} consulta{consultas.length > 1 ? 's' : ''}
                  {totalOrgaos > 0 && ` · ${totalOrgaos} orgaos`}
                </span>
              )}
              {ligPoliticaCache.length > 0 && (
                <span className="consultas-count">
                  · {ligPoliticaCache.length} lig. salva{ligPoliticaCache.length > 1 ? 's' : ''}
                </span>
              )}
              {rpCache.length > 0 && (
                <span className="consultas-count">
                  · {rpCache.length} rel. salva{rpCache.length > 1 ? 's' : ''}
                </span>
              )}
              {lpResultados && (
                <button className="btn btn-sm btn-outline-accent" onClick={() => setAbaAtiva('ligacao-politica')}>
                  Analises de Ligacao Publica
                </button>
              )}
            </div>

            {consultas.map((consulta, idx) => (
              <ConsultaCard
                key={consulta.id}
                consulta={consulta}
                numero={idx + 1}
                onApagar={handleApagar}
                onLigacaoPolitica={(id) => handleAbrirLigacaoPolitica(id)}
                pncpDestacado={pncpDestacado}
                onAnaliseDetalhada={handleAnaliseDetalhada}
                pncpComMatch={pncpComMatch}
                onIdClick={handleIdClickFromAnalise}
              />
            ))}
          </div>
        </div>

        {/* ─── TSE ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'relacoes' ? '' : 'none' }}>
          <div className="tab-content">
            <div className="tab-header">
              <h2 className="tab-title">TSE</h2>
              <p className="tab-desc">Consulta de dados eleitorais, doações e conexões partidárias.</p>
            </div>

            {/* Top sub-tab bar: Geral + each search method */}
            <div className="lp-sub-tabs">
              <button
                className={`lp-sub-tab ${rpTopAba === 'geral' ? 'ativo' : ''}`}
                onClick={() => setRpTopAba('geral')}
              >
                Geral
              </button>
              {RP_METODOS.map(m => (
                <button
                  key={m.key}
                  className={`lp-sub-tab ${rpTopAba === m.key ? 'ativo' : ''}`}
                  onClick={() => setRpTopAba(m.key)}
                >
                  {m.label}
                  <span
                    className="lp-sub-tab-fechar"
                    onClick={(e) => { e.stopPropagation(); setRpTopAba('geral'); }}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>

            {/* Top Geral: method selection */}
            <div style={{ display: rpTopAba === 'geral' ? '' : 'none' }}>
              <div className="rp-metodo-grid">
                {RP_METODOS.map(m => (
                  <button
                    key={m.key}
                    className="rp-metodo-btn"
                    onClick={() => handleAbrirMetodoRP(m.key)}
                  >
                    <strong>{m.label}</strong>
                    <span className="rp-metodo-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Per-method content */}
            {RP_METODOS.map(m => {
              const methodState = rpMetodoState[m.key];
              if (!methodState) return null;
              const Comp = m.Component;
              return (
                <div key={m.key} style={{ display: rpTopAba === m.key ? '' : 'none' }}>
                  {/* Inner sub-tab bar */}
                  <div className="lp-sub-tabs">
                    <button
                      className={`lp-sub-tab ${methodState.ativa === 'geral' ? 'ativo' : ''}`}
                      onClick={() => setRpMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: 'geral' } }))}
                    >
                      Geral
                    </button>
                    {methodState.subs.map((id, idx) => {
                      const item = rpDataCache[id];
                      let label = `#${id}`;
                      if (item) {
                        if (m.key === 'empresas') {
                          label = fmtDoc(item.searchParams);
                        } else if (m.key === 'doador' || m.key === 'fornecedor') {
                          label = fmtDoc(item.searchParams);
                        } else {
                          label = item.searchParams?.filtro ? `${m.label}` : `#${id}`;
                        }
                      }
                      const key = `rp-${id}`;
                      return (
                        <button
                          key={key}
                          className={`lp-sub-tab ${methodState.ativa === key ? 'ativo' : ''}`}
                          onClick={() => setRpMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: key } }))}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', idx)}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = Number(e.dataTransfer.getData('text/plain'));
                            if (from !== idx) {
                              setRpMetodoState(prev => {
                                const ms = prev[m.key];
                                const nova = [...ms.subs];
                                const [x] = nova.splice(from, 1);
                                nova.splice(idx, 0, x);
                                return { ...prev, [m.key]: { ...ms, subs: nova } };
                              });
                            }
                          }}
                        >
                          {label}
                          <span
                            className="lp-sub-tab-fechar"
                            onClick={(e) => { e.stopPropagation(); handleFecharRPSubTab(m.key, key); }}
                          >
                            ×
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inner Geral: search form */}
                  <div style={{ display: methodState.ativa === 'geral' ? '' : 'none' }}>
                    <Comp
                      onFechar={() => setRpTopAba('geral')}
                      onSave={handleSalvarRP}
                      onApagar={handleApagarRP}
                      savedList={rpCache}
                      onIdClick={handleIdClickFromAnalise}
                      onRPSearchComplete={handleRPSearchComplete}
                      onRPAbrirSalvo={handleAbrirRPSalvo}
                    />
                  </div>

                  {/* Inner result sub-tabs */}
                  {methodState.subs.map(id => {
                    const key = `rp-${id}`;
                    const item = rpDataCache[id];
                    return (
                      <div key={key} style={{ display: methodState.ativa === key ? '' : 'none' }}>
                        <Comp
                          onFechar={() => setRpMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: 'geral' } }))}
                          onSave={handleSalvarRP}
                          onApagar={handleApagarRP}
                          savedList={rpCache}
                          onIdClick={handleIdClickFromAnalise}
                          resultItem={item || null}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── PORTAL TRANSPARÊNCIA ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'portal' ? '' : 'none' }}>
          <div className="tab-content">
            <div className="tab-header">
              <h2 className="tab-title">Portal Transparência</h2>
              <p className="tab-desc">Consulte dados do Portal da Transparência do Governo Federal.</p>
            </div>

            {/* Top sub-tab bar: Geral + each search method */}
            <div className="lp-sub-tabs">
              <button
                className={`lp-sub-tab ${ptTopAba === 'geral' ? 'ativo' : ''}`}
                onClick={() => setPtTopAba('geral')}
              >
                Geral
              </button>
              {PT_METODOS.map(m => (
                <button
                  key={m.key}
                  className={`lp-sub-tab ${ptTopAba === m.key ? 'ativo' : ''}`}
                  onClick={() => setPtTopAba(m.key)}
                >
                  {m.label}
                  <span
                    className="lp-sub-tab-fechar"
                    onClick={(e) => { e.stopPropagation(); setPtTopAba('geral'); }}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>

            {/* Top Geral: method selection */}
            <div style={{ display: ptTopAba === 'geral' ? '' : 'none' }}>
              <div className="rp-metodo-grid">
                {PT_METODOS.map(m => (
                  <button
                    key={m.key}
                    className="rp-metodo-btn"
                    onClick={() => handleAbrirMetodoPT(m.key)}
                  >
                    <strong>{m.label}</strong>
                    <span className="rp-metodo-desc">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Per-method content */}
            {PT_METODOS.map(m => {
              const methodState = ptMetodoState[m.key];
              if (!methodState) return null;
              const Comp = m.Component;
              return (
                <div key={m.key} style={{ display: ptTopAba === m.key ? '' : 'none' }}>
                  {/* Inner sub-tab bar */}
                  <div className="lp-sub-tabs">
                    <button
                      className={`lp-sub-tab ${methodState.ativa === 'geral' ? 'ativo' : ''}`}
                      onClick={() => setPtMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: 'geral' } }))}
                    >
                      Geral
                    </button>
                    {methodState.subs.map((id, idx) => {
                      const item = ptDataCache[id];
                      let label = `#${id}`;
                      if (item) {
                        const params = item.searchParams;
                        if (m.key === 'orgaos') {
                          label = params?.codigo || params?.nome || `#${id}`;
                        } else if (m.key === 'pessoas') {
                          label = params?.documento || params?.nome || `#${id}`;
                        } else if (m.key === 'cartoes') {
                          label = params?.codigoOrgao || params?.cpfPortador || `#${id}`;
                        } else if (m.key === 'servidores') {
                          label = params?.cpf || params?.nome || `#${id}`;
                        } else if (m.key === 'despesas') {
                          label = params?.ano || params?.nomeFavorecido || `#${id}`;
                        } else if (m.key === 'emendas') {
                          label = params?.codigoEmenda || params?.nomeAutor || `#${id}`;
                        }
                      }
                      const key = `pt-${id}`;
                      return (
                        <button
                          key={key}
                          className={`lp-sub-tab ${methodState.ativa === key ? 'ativo' : ''}`}
                          onClick={() => setPtMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: key } }))}
                        >
                          {label}
                          <span
                            className="lp-sub-tab-fechar"
                            onClick={(e) => { e.stopPropagation(); handleFecharPTSubTab(m.key, key); }}
                          >
                            ×
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inner Geral: search form */}
                  <div style={{ display: methodState.ativa === 'geral' ? '' : 'none' }}>
                    <Comp
                      onFechar={() => setPtTopAba('geral')}
                      onIdClick={handleIdClickFromAnalise}
                      onPTSearchComplete={handlePTSearchComplete}
                    />
                  </div>

                  {/* Inner result sub-tabs */}
                  {methodState.subs.map(id => {
                    const key = `pt-${id}`;
                    const item = ptDataCache[id];
                    return (
                      <div key={key} style={{ display: methodState.ativa === key ? '' : 'none' }}>
                        <Comp
                          onFechar={() => setPtMetodoState(prev => ({ ...prev, [m.key]: { ...prev[m.key], ativa: 'geral' } }))}
                          onIdClick={handleIdClickFromAnalise}
                          resultItem={item || null}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── DEPUTADOS ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'deputados' ? '' : 'none' }}>
          <AnaliseDeputados />
        </div>

        {/* ─── SENADORES ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'senadores' ? '' : 'none' }}>
          <AnaliseSenadores />
        </div>

        {/* ─── TCU ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'tcu' ? '' : 'none' }}>
          <div className="tab-content">
            <AnaliseTCU onIdClick={handleIdClickFromAnalise} />
          </div>
        </div>

        {/* ─── LIGAÇÃO POLÍTICA ─── */}
        <div className="tab-page" style={{ display: abaAtiva === 'ligacao-politica' ? '' : 'none' }}>
          <div className="tab-content">
            <div className="tab-header">
              <h2 className="tab-title">Ligação Política</h2>
              <p className="tab-desc">Cruzamento de dados entre fornecedores e agentes políticos.</p>
            </div>

            <div className="lp-sub-tabs">
              <button
                className={`lp-sub-tab ${subTabAtiva === 'geral' ? 'ativo' : ''}`}
                onClick={() => setSubTabAtiva('geral')}
              >
                Geral
              </button>
              {subTabs.map((tab, idx) => {
                const key = tabKey(tab);
                let label;
                if (tab.kind === 'consulta') {
                  const c = consultas.find(c => c.id === tab.id);
                  const ci = c ? consultas.indexOf(c) : -1;
                  label = ci >= 0 ? `Consulta #${ci + 1}` : `ID ${tab.id}`;
                } else {
                  const analise = adAnalises.find(a => a.id === tab.id);
                  label = analise
                    ? `${analise.licitacao.fornecedor} (${analise.licitacao.numeroControlePNCP?.slice(0, 12)}...)`
                    : `AD #${tab.id}`;
                }
                return (
                  <button
                    key={key}
                    className={`lp-sub-tab ${subTabAtiva === key ? 'ativo' : ''}`}
                    onClick={() => setSubTabAtiva(key)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', idx)}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData('text/plain'));
                      if (from !== idx) {
                        setSubTabs(prev => {
                          const nova = [...prev];
                          const [m] = nova.splice(from, 1);
                          nova.splice(idx, 0, m);
                          return nova;
                        });
                      }
                    }}
                  >
                    {label}
                    <span
                      className="lp-sub-tab-fechar"
                      onClick={(e) => { e.stopPropagation(); handleFecharSubTab(key); }}
                    >
                      ×
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Geral content */}
            <div style={{ display: subTabAtiva === 'geral' ? '' : 'none' }}>
              {ligPoliticaAberta ? (
                <LigacaoPolitica
                  consultas={consultas}
                  consultaId={null}
                  onFechar={() => { setLigPoliticaAberta(null); setAbaAtiva('licitacoes'); }}
                  onSave={handleSalvarLP}
                  onEdit={handleEditarLP}
                  onApagar={handleApagarLP}
                  cachedItem={ligPoliticaAberta}
                  cachedResult={null}
                  onResultsReady={handleLPResults}
                  onNavigateToLicitacao={handleNavigateToLicitacao}
                  onLicitacaoClick={handleLicitacaoPopup}
                  savedList={ligPoliticaCache}
                  onLoadSaved={handleAbrirSalvoLP}
                  onDadosAtualizados={handleLPDadosAtualizados}
                  onAnaliseDetalhada={handleAnaliseDetalhada}
                  onAbrirTodasAD={handleAbrirTodasAnalisesDetalhadas}
                  onIdClick={handleIdClickFromAnalise}
                />
              ) : (
                <LigacaoPolitica
                  consultas={consultas}
                  consultaId={getAtivaKind() === 'geral' ? null : lpConsultaIdAtual}
                  onFechar={() => setAbaAtiva('licitacoes')}
                  onSave={handleSalvarLP}
                  onEdit={handleEditarLP}
                  onApagar={handleApagarLP}
                  cachedItem={null}
                  cachedResult={lpInitialData}
                  onResultsReady={handleLPResults}
                  onNavigateToLicitacao={handleNavigateToLicitacao}
                  onLicitacaoClick={handleLicitacaoPopup}
                  savedList={ligPoliticaCache}
                  onLoadSaved={handleAbrirSalvoLP}
                  onDadosAtualizados={handleLPDadosAtualizados}
                  onAnaliseDetalhada={handleAnaliseDetalhada}
                  onAbrirTodasAD={handleAbrirTodasAnalisesDetalhadas}
                  onIdClick={handleIdClickFromAnalise}
                />
              )}
            </div>

            {/* Consulta sub-tab contents */}
            {lpSubTabsAtivas.map(tab => {
              const key = tabKey(tab);
              return (
                <div key={key} style={{ display: subTabAtiva === key ? '' : 'none' }}>
                  <LigacaoPolitica
                    consultas={consultas}
                    consultaId={tab.id}
                    onFechar={() => setAbaAtiva('licitacoes')}
                    onSave={handleSalvarLP}
                    onEdit={handleEditarLP}
                    onApagar={handleApagarLP}
                    cachedItem={null}
                    cachedResult={lpDataCache[tab.id] || null}
                    onResultsReady={handleLPResults}
                    onNavigateToLicitacao={handleNavigateToLicitacao}
                    onLicitacaoClick={handleLicitacaoPopup}
                    savedList={ligPoliticaCache}
                    onLoadSaved={handleAbrirSalvoLP}
                    onDadosAtualizados={handleLPDadosAtualizados}
                    onAnaliseDetalhada={handleAnaliseDetalhada}
                    onAbrirTodasAD={handleAbrirTodasAnalisesDetalhadas}
                    onIdClick={handleIdClickFromAnalise}
                  />
                </div>
              );
            })}

            {/* AD sub-tab content */}
            <div style={{ display: subTabAtiva === 'ad' ? '' : 'none' }}>
              {adAnalises.length > 0 && (
                <div>
                  <div className="lp-sub-tabs ad-internal-tabs">
                    <button
                      className={`lp-sub-tab ${adTabAtiva === 'geral' ? 'ativo' : ''}`}
                      onClick={() => setAdTabAtiva('geral')}
                    >
                      Geral
                    </button>
                    {adAnalises.map(a => (
                      <button
                        key={a.id}
                        className={`lp-sub-tab ${adTabAtiva === String(a.id) ? 'ativo' : ''}`}
                        onClick={() => setAdTabAtiva(String(a.id))}
                      >
                        {a.licitacao.fornecedor}
                        <span
                          className="lp-sub-tab-fechar"
                          onClick={(e) => { e.stopPropagation(); handleFecharADAnalise(a.id); }}
                        >
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                  {adTabAtiva === 'geral' ? (
                    <div className="ad-geral">
                      <p className="ad-geral-subtitle">
                        {adAnalises.length > 1
                          ? `Foram abertas ${adAnalises.length} análises detalhadas. Selecione uma para visualizar.`
                          : 'Uma análise detalhada foi aberta.'}
                      </p>
                      {adAnalises.map(a => (
                        <div key={a.id} className="ad-geral-card" onClick={() => setAdTabAtiva(String(a.id))}>
                          <strong>{a.licitacao.fornecedor}</strong>
                          <span>{a.licitacao.numeroControlePNCP}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    (() => {
                      const analise = adAnalises.find(a => a.id === Number(adTabAtiva));
                      return analise ? (
                        <AnaliseDetalhada
                          key={analise.id}
                          data={analise.data}
                          licitacao={analise.licitacao}
                          adId={analise.id}
                          onFechar={() => setAdTabAtiva('geral')}
                          onIdClick={handleIdClickFromAnalise}
                        />
                      ) : null;
                    })()
                  )}
                </div>
              )}
            </div>

            {analiseDetalhadaLoading && adAnalises.length === 0 && (
              <div className="lp-progresso" style={{ marginTop: 20 }}>
                <p className="lp-status">Carregando analise detalhada...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {popup && (
        popup.tipo === 'entidade' ? (
          <JanelaPopup
            titulo={`${KEY_TO_TIPO[popup.idKey] || popup.idKey.replace(/_(id)?$/, '')}: ${popup.chave}`}
            onFechar={() => setPopup(null)}
          >
            <EntityPopup
              tipo={KEY_TO_TIPO[popup.idKey] || popup.idKey.replace(/_(id)?$/, '')}
              chave={popup.chave}
              cachedData={entidadeCache[`${KEY_TO_TIPO[popup.idKey] || popup.idKey.replace(/_(id)?$/, '')}_${popup.chave}`]}
              onLoaded={(dados) => handleAtualizarEntidadeCache(KEY_TO_TIPO[popup.idKey] || popup.idKey.replace(/_(id)?$/, ''), popup.chave, dados)}
            />
          </JanelaPopup>
        ) : (
          <JanelaPopup titulo={popup.titulo} onFechar={() => setPopup(null)}>
            {popup.tipo === 'contrato'
              ? <ContratoDetalhes contrato={popup.data} />
              : <ObjCard data={popup.data} titulo={popup.titulo} open />
            }
          </JanelaPopup>
        )
      )}
    </div>
  );
}

function ConsultaCard({ consulta, numero, onApagar, onLigacaoPolitica, pncpDestacado, onAnaliseDetalhada, pncpComMatch, onIdClick }) {
  const [aberto, setAberto] = useState(true);
  const [erroPopupAberto, setErroPopupAberto] = useState(null);
  const m = consulta.meta;
  const paginasErro = m?.paginasErro;
  const temPaginasErro = paginasErro && paginasErro.length > 0;

  return (
    <div className="consulta-card">
      <div className="consulta-header" onClick={() => setAberto(!aberto)}>
        <div className="consulta-header-left">
          <span className="consulta-tag">Consulta #{numero}</span>
          <span className="consulta-data">
            {new Date(consulta.timestamp).toLocaleString('pt-BR')}
          </span>
          <span className="consulta-meta">
            {m.tipo === 'publicacao' ? (
              <>{m.label || m.uf} · {m.dataInicial} a {m.dataFinal}</>
            ) : (
              <>{m.total} CNPJ{m.total > 1 ? 's' : ''} · {m.dataInicial} a {m.dataFinal}</>
            )}
          </span>
        </div>
        <div className="consulta-header-right">
          <span className="consulta-sumario">
            {consulta.resultados?.length || 0} orgaos
          </span>
          {temPaginasErro && (
            <button
              className="btn btn-sm btn-outline-danger"
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              onClick={(e) => { e.stopPropagation(); setErroPopupAberto(consulta.id); }}
              title="Páginas com erro"
            >
              ⚠ {paginasErro.length} pág. falharam
            </button>
          )}
          <button
            className="btn-apagar"
            onClick={(e) => { e.stopPropagation(); onApagar(consulta.id); }}
            title="Apagar consulta"
          >
            ✕
          </button>
          <span className="seta">{aberto ? '▼' : '▶'}</span>
        </div>
      </div>

      {aberto && (
        <div className="consulta-body">
          <div className="consulta-body-actions">
            <button
              className="btn-ligacao-body"
              onClick={(e) => { e.stopPropagation(); onLigacaoPolitica(consulta.id); }}
            >
              Ligação Política desta consulta
            </button>
          </div>
          <Resultados
            resultados={consulta.resultados}
            consultaMeta={m}
            pncpDestacado={pncpDestacado}
            onAnaliseDetalhada={onAnaliseDetalhada}
            pncpComMatch={pncpComMatch}
            onIdClick={onIdClick}
          />

          {erroPopupAberto === consulta.id && temPaginasErro && (
            <div className="popup-overlay" onClick={() => setErroPopupAberto(null)}>
              <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                  <h3>⚠ Páginas com erro na consulta</h3>
                  <button className="btn-apagar" onClick={() => setErroPopupAberto(null)}>✕</button>
                </div>
                <div className="popup-body">
                  <p className="ad-query-form-desc">
                    Algumas páginas da API do PNCP retornaram erro durante a busca.
                    Os resultados das páginas abaixo não foram incluídos:
                  </p>
                  <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                    {paginasErro.map((p, i) => (
                      <li key={i} style={{ marginBottom: 4, fontSize: '0.85rem' }}>
                        Página {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
