// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import { addEntities as addInvEntities, updateEntityData } from '@/app/store/slices/investigationSlice';
import {
  setSubTabAtiva, addSubTab, removeSubTab, reorderSubTabs,
  setLigPoliticaAberta, addLigPoliticaCache, updateLigPoliticaCache,
  removeLigPoliticaCache, setLpResultados, setLpDataCache,
  setSubTabs,
  setLpFromPanel,
} from '@/app/store/slices/ligacaoPoliticaSlice';
import LigacaoPolitica from '@/features/ligacao-politica/ui/LigacaoPolitica';
import { processLpResults } from '@/features/investigative-panel/lib/processLpResults';
import { JanelaPopup, ContratoDetalhes } from '@/features/ligacao-politica/ui/Resultados';
import EntityPopup from '@/features/ligacao-politica/ui/EntityPopup';
import PageNav from '@/shared/ui/PageNav/PageNav';
import { fmtDoc } from '@/shared/lib/formatters';
import { useDiscoveryReporter } from '@/shared/lib/entity-discovery';

let lpUid = 0;

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
  const navigate = useNavigate();
  const consultas = useAppSelector((s) => s.consulta.consultas);
  const subTabs = useAppSelector((s) => s.ligacaoPolitica.subTabs);
  const subTabAtiva = useAppSelector((s) => s.ligacaoPolitica.subTabAtiva);
  const ligPoliticaAberta = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaAberta);
  const ligPoliticaCache = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaCache);
  const lpResultados = useAppSelector((s) => s.ligacaoPolitica.lpResultados);
  const lpDataCache = useAppSelector((s) => s.ligacaoPolitica.lpDataCache);
  const lpFromPanel = useAppSelector((s) => s.ligacaoPolitica.lpFromPanel);
  const invEntities = useAppSelector((s) => s.investigation.entities as Record<string, any>);
  const invEntityOrder = useAppSelector((s) => s.investigation.entityOrder as string[]);

  const [popup, setPopup] = useState(null);
  const [entidadeCache, setEntidadeCache] = useState({});
  const [pncpDestacado, setPncpDestacado] = useState(null);
  const subTabsRef = useRef(subTabs);
  const reportDiscovery = useDiscoveryReporter();
  useEffect(() => { subTabsRef.current = subTabs; }, [subTabs]);

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
    if (data?.resultados) {
      const discoveries: any[] = [];
      const seen = new Set();
      data.resultados.forEach((item: any) => {
        const doc = item.cpf_cnpj;
        if (doc && doc.length >= 3 && !seen.has(doc)) {
          seen.add(doc);
          discoveries.push({
            id: doc,
            type: doc.length <= 11 ? 'pessoa_fisica' : 'empresa',
            label: doc.length > 11 ? 'Empresa' : doc,
            document: doc,
            source: 'pncp',
            originalData: {},
            context: 'Ligação Política',
          });
        }
      });
      reportDiscovery(discoveries);

      if (lpFromPanel) {
        const panelEnts = invEntityOrder.map((id: string) => ({
          id,
          document: (invEntities[id] as any)?.document,
        }));
        const { politicalEntities, lpResultEdges, docLinkedEntities } = processLpResults(
          data,
          panelEnts,
          invEntityOrder,
          invEntities as Record<string, { id: string; document?: string } | undefined>
        );
        if (politicalEntities.length > 0) {
          dispatch(addInvEntities(politicalEntities as any));
        }
        for (const dle of docLinkedEntities) {
          dispatch(updateEntityData({ id: dle.entityId, data: { parent_id: dle.parentId }, context: dle.context }));
        }
        dispatch(setLpFromPanel(false));
      }
    }
  }, [dispatch, reportDiscovery, lpFromPanel, invEntities, invEntityOrder]);

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
    navigate('/licitacoes');
  }, [dispatch, navigate]);

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

  const getAtivaKind = () => subTabAtiva === 'geral' ? 'geral' : 'consulta';
  const getAtivaId = () => {
    if (subTabAtiva === 'geral') return null;
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

  const lpSections = [
    { id: 'lp-header', label: 'Início' },
    { id: 'lp-content', label: 'Análise' },
  ];

  return (
    <div className="tab-page">
      <PageNav position="left" sections={lpSections} />
      <div className="licitacoes-page">
        <div className="licitacoes-header" id="lp-header">
          <div className="licitacoes-badge">// LIGAÇÃO POLÍTICA //</div>
          <h1 className="licitacoes-title">
            Cruzamento de Dados<br />
            <span style={{ color: 'var(--accent)', fontSize: 'inherit' }}>Fornecedores e Agentes Políticos</span>
          </h1>
          <p className="licitacoes-subtitle">Analise vínculos entre fornecedores de licitações e políticos, partidos, servidores públicos e mais.</p>
        </div>

        <div id="lp-content">
        <div className="lp-sub-tabs">
          <button className={`lp-sub-tab ${subTabAtiva === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setSubTabAtiva('geral'))}>Geral</button>
          {subTabs.map((tab, idx) => {
            const key = tabKey(tab);
            let label;
            if (tab.kind === 'consulta') {
              const c = consultas.find(c => c.id === tab.id);
              const ci = c ? consultas.indexOf(c) : -1;
              label = ci >= 0 ? `Consulta #${ci + 1}` : `ID ${tab.id}`;
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
            onFechar={() => { dispatch(setAbaAtiva('licitacoes')); navigate('/licitacoes'); }}
            onSave={handleSalvarLP} onEdit={handleEditarLP} onApagar={handleApagarLP}
            cachedItem={ligPoliticaAberta}
            cachedResult={lpInitialData}
            onResultsReady={handleLPResults}
            onNavigateToLicitacao={handleNavigateToLicitacao}
            onLicitacaoClick={handleLicitacaoPopup}
            savedList={ligPoliticaCache}
            onLoadSaved={handleAbrirSalvoLP}
            onDadosAtualizados={handleLPDadosAtualizados}
            onIdClick={handleIdClickFromAnalise}
          />
        </div>

        {lpSubTabsAtivas.map(tab => {
          const key = tabKey(tab);
          return (
            <div key={key} style={{ display: subTabAtiva === key ? '' : 'none' }}>
              <LigacaoPolitica
                consultas={consultas} consultaId={tab.id}
                onFechar={() => { dispatch(setAbaAtiva('licitacoes')); navigate('/licitacoes'); }}
                onSave={handleSalvarLP} onEdit={handleEditarLP} onApagar={handleApagarLP}
                cachedItem={null} cachedResult={lpDataCache[tab.id] || null}
                onResultsReady={handleLPResults}
                onNavigateToLicitacao={handleNavigateToLicitacao}
                onLicitacaoClick={handleLicitacaoPopup}
                savedList={ligPoliticaCache} onLoadSaved={handleAbrirSalvoLP}
                onDadosAtualizados={handleLPDadosAtualizados}
                onIdClick={handleIdClickFromAnalise}
              />
            </div>
          );
        })}
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
