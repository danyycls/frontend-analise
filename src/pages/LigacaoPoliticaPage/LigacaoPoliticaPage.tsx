// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import {
  setSubTabAtiva, addSubTab, removeSubTab, reorderSubTabs,
  setLigPoliticaAberta, addLigPoliticaCache, updateLigPoliticaCache,
  removeLigPoliticaCache, setLpResultados, setLpDataCache,
  setAdTabAtiva, addAdAnalise, removeAdAnalise, setSubTabs,
} from '@/app/store/slices/ligacaoPoliticaSlice';
import LigacaoPolitica from '@/features/ligacao-politica/ui/LigacaoPolitica';
import { JanelaPopup, ContratoDetalhes } from '@/features/ligacao-politica/ui/Resultados';
import EntityPopup from '@/features/ligacao-politica/ui/EntityPopup';
import { api } from '@/shared/api/client';
import { fmtDoc } from '@/shared/lib/formatters';
import { ENDPOINTS } from '@/shared/api/endpoints';

let lpUid = 0;
let adUid = 0;

const KEY_TO_TIPO = {
  sq_candidato: 'candidato',
  sq_despesa: 'despesa',
  sq_receita: 'receita',
  sq_prestador_contas: 'prestador_contas',
  cpf_cnpj: 'fornecedor',
  cpf: 'candidato',
  cpf_cnpj_doador: 'doador',
};

export default function LigacaoPoliticaPage() {
  const dispatch = useAppDispatch();
  const consultas = useAppSelector((s) => s.consulta.consultas);
  const subTabs = useAppSelector((s) => s.ligacaoPolitica.subTabs);
  const subTabAtiva = useAppSelector((s) => s.ligacaoPolitica.subTabAtiva);
  const ligPoliticaAberta = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaAberta);
  const ligPoliticaCache = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaCache);
  const lpResultados = useAppSelector((s) => s.ligacaoPolitica.lpResultados);
  const lpDataCache = useAppSelector((s) => s.ligacaoPolitica.lpDataCache);
  const adTabAtiva = useAppSelector((s) => s.ligacaoPolitica.adTabAtiva);
  const adAnalises = useAppSelector((s) => s.ligacaoPolitica.adAnalises);

  const [popup, setPopup] = useState(null);
  const [entidadeCache, setEntidadeCache] = useState({});
  const [pncpDestacado, setPncpDestacado] = useState(null);
  const [analiseDetalhadaLoading, setAnaliseDetalhadaLoading] = useState(false);
  const subTabsRef = useRef(subTabs);
  const adAnalisesRef = useRef(adAnalises);
  useEffect(() => { subTabsRef.current = subTabs; }, [subTabs]);
  useEffect(() => { adAnalisesRef.current = adAnalises; }, [adAnalises]);

  useEffect(() => {
    if (pncpDestacado) {
      const timer = setTimeout(() => setPncpDestacado(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [pncpDestacado]);

  const tabKey = useCallback((tab) => tab.kind === 'consulta' ? `consulta-${tab.id}` : 'ad', []);

  const handleSalvarLP = useCallback((item) => {
    const novo = { ...item, id: ++lpUid };
    dispatch(addLigPoliticaCache(novo));
  }, [dispatch]);

  const handleEditarLP = useCallback((id, novosDados) => {
    dispatch(updateLigPoliticaCache({ id, data: novosDados }));
  }, [dispatch]);

  const handleApagarLP = useCallback((id) => {
    dispatch(removeLigPoliticaCache(id));
  }, [dispatch]);

  const handleAbrirSalvoLP = useCallback((id) => {
    const item = ligPoliticaCache.find((c) => c.id === id);
    if (item) {
      dispatch(setLigPoliticaAberta(item));
      dispatch(setAbaAtiva('ligacao-politica'));
    }
  }, [ligPoliticaCache, dispatch]);

  const handleLPDadosAtualizados = useCallback((data) => {
    dispatch(setLpResultados(data));
  }, [dispatch]);

  const handleLPResults = useCallback((consultaId, data, licitacoes) => {
    const key = consultaId || 'all';
    dispatch(setLpDataCache({ ...lpDataCache, [key]: { data, licitacoes, timestamp: Date.now() } }));
  }, [lpDataCache, dispatch]);

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

  const handleNavigateToLicitacao = useCallback((pncp) => {
    setPncpDestacado(pncp);
    dispatch(setAbaAtiva('licitacoes'));
  }, [dispatch]);

  const handleAnaliseDetalhada = useCallback(async (contrato) => {
    setAnaliseDetalhadaLoading(true);
    const licitacoes = [];
    const seen = new Set();
    const mainDoc = contrato.fornecedor?.cnpj || contrato.niFornecedor || contrato.orgaoEntidade?.cnpj;
    if (mainDoc && mainDoc.length >= 3) {
      const key = `${contrato.numeroControlePNCP || ''}_${mainDoc}`;
      if (!seen.has(key)) {
        seen.add(key);
        licitacoes.push({ numero_controle_pncp: contrato.numeroControlePNCP || '', cpf_cnpj: mainDoc, socios: (contrato.fornecedor?.qsa || []).map(s => ({ nome: s.nome_socio || '', documento: s.cnpj_cpf_socio || '' })) });
      }
    }
    if (contrato.niFornecedor && contrato.niFornecedor !== mainDoc && contrato.niFornecedor.length >= 3) {
      const key = `${contrato.numeroControlePNCP || ''}_ni_${contrato.niFornecedor}`;
      if (!seen.has(key)) { seen.add(key); licitacoes.push({ numero_controle_pncp: contrato.numeroControlePNCP || '', cpf_cnpj: contrato.niFornecedor, socios: [] }); }
    }
    (contrato.fornecedor?.qsa || []).forEach(s => {
      const sd = s.cnpj_cpf_socio;
      if (sd && sd.length >= 3 && sd !== mainDoc && sd !== contrato.niFornecedor && !seen.has(`${contrato.numeroControlePNCP || ''}_socio_${sd}`)) {
        seen.add(`${contrato.numeroControlePNCP || ''}_socio_${sd}`);
        licitacoes.push({ numero_controle_pncp: contrato.numeroControlePNCP || '', cpf_cnpj: sd, socios: [] });
      }
    });
    if (licitacoes.length === 0) { setAnaliseDetalhadaLoading(false); return; }
    try {
      const json = await api.post<any>(ENDPOINTS.BUSCA_CONTEXTO, { licitacoes });
      const id = ++adUid;
      const analise = { id, licitacao: { numeroControlePNCP: contrato.numeroControlePNCP, fornecedor: contrato.fornecedor?.razaoSocial || contrato.niFornecedor || '-' }, data: json, licitacoes, timestamp: new Date().toISOString() };
      dispatch(addAdAnalise(analise));
      dispatch(addSubTab({ kind: 'ad', id }));
      dispatch(setSubTabAtiva('ad'));
      dispatch(setAbaAtiva('ligacao-politica'));
    } catch (err) { console.error('Erro na analise detalhada:', err); }
    setAnaliseDetalhadaLoading(false);
  }, [dispatch]);

  const handleAbrirTodasAnalisesDetalhadas = useCallback(async (itens) => {
    for (const item of itens) {
      const contrato = { numeroControlePNCP: item.numero_controle_pncp, fornecedor: { razaoSocial: item.cpf_cnpj || '-', cnpj: item.cpf_cnpj, qsa: (item.socios || []).map(s => ({ nome_socio: s.nome, cnpj_cpf_socio: s.documento })) }, niFornecedor: null };
      await handleAnaliseDetalhada(contrato);
    }
  }, [handleAnaliseDetalhada]);

  const handleAbrirLigacaoPolitica = useCallback((consultaId) => {
    dispatch(setLigPoliticaAberta(null));
    if (consultaId && consultaId !== 'all') {
      dispatch(addSubTab({ kind: 'consulta', id: consultaId }));
      dispatch(setSubTabAtiva(`consulta-${consultaId}`));
    } else {
      dispatch(setSubTabAtiva('geral'));
    }
    dispatch(setAbaAtiva('ligacao-politica'));
  }, [dispatch]);

  const handleFecharSubTab = useCallback((key) => {
    dispatch(removeSubTab(key));
  }, [dispatch]);

  const handleFecharADAnalise = useCallback((id) => {
    dispatch(removeAdAnalise(Number(id)));
    dispatch(setAdTabAtiva('geral'));
  }, [dispatch]);

  const getAtivaKind = () => subTabAtiva === 'geral' ? 'geral' : subTabAtiva === 'ad' ? 'ad' : 'consulta';
  const getAtivaId = () => {
    if (subTabAtiva === 'geral' || subTabAtiva === 'ad') return null;
    return Number(subTabAtiva.split('-')[1]);
  };

  const lpConsultaIdAtual = getAtivaKind() === 'consulta' ? getAtivaId() : null;
  const lpInitialData = lpDataCache[lpConsultaIdAtual] || (getAtivaKind() === 'geral' ? lpDataCache['all'] || null : null);
  const lpSubTabsAtivas = subTabs.filter(t => t.kind === 'consulta');

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

  return (
    <div className="tab-page">
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">Ligação Política</h2>
          <p className="tab-desc">Cruzamento de dados entre fornecedores e agentes políticos.</p>
        </div>

        <div className="lp-sub-tabs">
          <button className={`lp-sub-tab ${subTabAtiva === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setSubTabAtiva('geral'))}>Geral</button>
          {subTabs.map((tab, idx) => {
            const key = tabKey(tab);
            let label;
            if (tab.kind === 'consulta') {
              const c = consultas.find(c => c.id === tab.id);
              const ci = c ? consultas.indexOf(c) : -1;
              label = ci >= 0 ? `Consulta #${ci + 1}` : `ID ${tab.id}`;
            } else {
              const analise = adAnalises.find(a => a.id === tab.id);
              label = analise ? `${analise.licitacao.fornecedor} (${analise.licitacao.numeroControlePNCP?.slice(0, 12)}...)` : `AD #${tab.id}`;
            }
            return (
              <button key={key} className={`lp-sub-tab ${subTabAtiva === key ? 'ativo' : ''}`}
                onClick={() => dispatch(setSubTabAtiva(key))}
                draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', idx)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (from !== idx) dispatch(reorderSubTabs({ from, to: idx })); }}>
                {label}
                <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); handleFecharSubTab(key); }}>×</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: subTabAtiva === 'geral' ? '' : 'none' }}>
          <LigacaoPolitica
            consultas={consultas}
            consultaId={getAtivaKind() === 'geral' ? null : lpConsultaIdAtual}
            onFechar={() => dispatch(setAbaAtiva('licitacoes'))}
            onSave={handleSalvarLP} onEdit={handleEditarLP} onApagar={handleApagarLP}
            cachedItem={ligPoliticaAberta}
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
        </div>

        {lpSubTabsAtivas.map(tab => {
          const key = tabKey(tab);
          return (
            <div key={key} style={{ display: subTabAtiva === key ? '' : 'none' }}>
              <LigacaoPolitica
                consultas={consultas} consultaId={tab.id}
                onFechar={() => dispatch(setAbaAtiva('licitacoes'))}
                onSave={handleSalvarLP} onEdit={handleEditarLP} onApagar={handleApagarLP}
                cachedItem={null} cachedResult={lpDataCache[tab.id] || null}
                onResultsReady={handleLPResults}
                onNavigateToLicitacao={handleNavigateToLicitacao}
                onLicitacaoClick={handleLicitacaoPopup}
                savedList={ligPoliticaCache} onLoadSaved={handleAbrirSalvoLP}
                onDadosAtualizados={handleLPDadosAtualizados}
                onAnaliseDetalhada={handleAnaliseDetalhada}
                onAbrirTodasAD={handleAbrirTodasAnalisesDetalhadas}
                onIdClick={handleIdClickFromAnalise}
              />
            </div>
          );
        })}

        <div style={{ display: subTabAtiva === 'ad' ? '' : 'none' }}>
          {adAnalises.length > 0 && (
            <div>
              <div className="lp-sub-tabs ad-internal-tabs">
                <button className={`lp-sub-tab ${adTabAtiva === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setAdTabAtiva('geral'))}>Geral</button>
                {adAnalises.map(a => (
                  <button key={a.id} className={`lp-sub-tab ${adTabAtiva === String(a.id) ? 'ativo' : ''}`} onClick={() => dispatch(setAdTabAtiva(String(a.id)))}>
                    {a.licitacao.fornecedor}
                    <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); handleFecharADAnalise(a.id); }}>×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {popup && popup.tipo === 'contrato' && (
        <JanelaPopup titulo={popup.titulo} onFechar={() => setPopup(null)}>
          <ContratoDetalhes contrato={popup.data} onIdClick={handleIdClickFromAnalise} />
        </JanelaPopup>
      )}
      {popup && popup.tipo === 'entidade' && (
        <JanelaPopup titulo={`Entidade: ${fmtDoc(popup.chave)}`} onFechar={() => setPopup(null)}>
          <EntityPopup tipo={KEY_TO_TIPO[popup.idKey]} chave={popup.chave} cache={entidadeCache} onCache={handleAtualizarEntidadeCache} />
        </JanelaPopup>
      )}
    </div>
  );
}
