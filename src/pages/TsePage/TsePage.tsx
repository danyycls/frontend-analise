// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import {
  setTopAba, setMetodoAtiva, addSubTab,
  removeSubTab, reorderSubTabs, setMetodoState,
} from '@/app/store/slices/tseSlice';
import RelacoesPoliticas from '@/features/tse/ui/RelacoesPoliticas';
import BuscaCargo from '@/features/tse/ui/BuscaCargo';
import BuscaPartido from '@/features/tse/ui/BuscaPartido';
import BuscaDoador from '@/features/tse/ui/BuscaDoador';
import BuscaFornecedor from '@/features/tse/ui/BuscaFornecedor';
import { fmtDoc } from '@/shared/lib/formatters';
import { useDiscoveryReporter } from '@/shared/lib/entity-discovery';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

let rpUid = 0;

const RP_METODOS = [
  { key: 'empresas', label: 'TSE - Empresas', desc: 'Consulta despesas e receitas eleitorais declaradas ao TSE filtrando pelo CNPJ de uma empresa. Exibe valores, datas e candidatos envolvidos.', Component: RelacoesPoliticas },
  { key: 'cargo', label: 'Políticos por Cargo', desc: 'Busca candidatos a cargos eletivos filtrando por cargo, UF e situação (eleitos/não eleitos). Exibe nome, partido e votação.', Component: BuscaCargo },
  { key: 'partido', label: 'Políticos por Partido', desc: 'Busca candidatos filiados a um partido político, com opção de filtrar por UF e situação (eleitos/não eleitos).', Component: BuscaPartido },
  { key: 'doador', label: 'Relação de Doadores', desc: 'Consulta doações de campanha recebidas por candidatos e partidos, filtrando pelo CPF/CNPJ do doador. Exibe valor, data e origem.', Component: BuscaDoador },
  { key: 'fornecedor', label: 'Relação de Fornecedores', desc: 'Consulta despesas de campanha pagas a fornecedores, filtrando pelo CPF/CNPJ. Exibe valor, data e descrição.', Component: BuscaFornecedor },
];

export default function TsePage() {
  const dispatch = useAppDispatch();
  const topAba = useAppSelector((s) => s.tse.topAba);
  const metodoState = useAppSelector((s) => s.tse.metodoState);
  const [rpDataCache, setRpDataCache] = useState({});
  const [rpCache, setRpCache] = useState([]);
  const rpDataCacheRef = useRef(rpDataCache);
  const metodoStateRef = useRef(metodoState);
  const reportDiscovery = useDiscoveryReporter();
  const { popupInfo, setPopupInfo } = useEntityInfo();

  useEffect(() => { rpDataCacheRef.current = rpDataCache; }, [rpDataCache]);
  useEffect(() => { metodoStateRef.current = metodoState; }, [metodoState]);

  const handleSalvarRP = useCallback((item) => {
    const novo = { ...item, id: ++rpUid };
    setRpCache((prev) => [novo, ...prev]);
  }, []);

  const handleApagarRP = useCallback((id) => {
    setRpCache((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleIdClick = () => {};

  const handleRPSearchComplete = useCallback((method, searchParams, data) => {
    const id = ++rpUid;
    setRpDataCache(prev => ({ ...prev, [id]: { searchParams, data, id, method, timestamp: new Date().toISOString() } }));
    dispatch(addSubTab({ method, id }));
    dispatch(setMetodoAtiva({ method, ativa: `rp-${id}` }));
    dispatch(setTopAba(method));
    dispatch(setAbaAtiva('relacoes'));

    const discoveries: any[] = [];
    const doc = searchParams?.replace?.(/\D/g, '') || '';
    if (doc && doc.length >= 3) {
      discoveries.push({
        id: doc,
        type: doc.length <= 11 ? 'pessoa_fisica' : 'empresa',
        label: doc.length > 11 ? 'Empresa' : 'Pessoa Física',
        document: doc,
        source: 'tse',
        originalData: { method },
        context: `TSE Busca: ${method}`,
      });
    }
    reportDiscovery(discoveries);
  }, [dispatch, reportDiscovery]);

  const handleFecharRPSubTab = useCallback((method, key) => {
    const id = Number(key.replace('rp-', ''));
    dispatch(removeSubTab({ method, id }));
  }, [dispatch]);

  const handleAbrirRPSalvo = useCallback((item) => {
    const method = item.method || 'empresas';
    const id = item.id;
    setRpDataCache(prev => ({ ...prev, [id]: item }));
    if (!metodoStateRef.current[method]?.subs.includes(id)) {
      dispatch(addSubTab({ method, id }));
    }
    dispatch(setMetodoAtiva({ method, ativa: `rp-${id}` }));
    dispatch(setTopAba(method));
    dispatch(setAbaAtiva('relacoes'));
  }, [dispatch]);

  const handleAbrirMetodoRP = useCallback((method) => {
    dispatch(setTopAba(method));
    dispatch(setAbaAtiva('relacoes'));
  }, [dispatch]);

  return (
    <div className="tab-page">
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">TSE</h2>
          <p className="tab-desc">Dados oficiais do TSE: despesas e receitas eleitorais por empresa, candidatos eleitos e suplentes por cargo ou partido, doadores e fornecedores de campanha.</p>
        </div>

        <div className="lp-sub-tabs">
          <button className={`lp-sub-tab ${topAba === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setTopAba('geral'))}>
            Geral
          </button>
          {RP_METODOS.map(m => (
            <button key={m.key} className={`lp-sub-tab ${topAba === m.key ? 'ativo' : ''}`} onClick={() => dispatch(setTopAba(m.key))}>
              {m.label}
              <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); dispatch(setTopAba('geral')); }}>×</span>
            </button>
          ))}
        </div>

        <div style={{ display: topAba === 'geral' ? '' : 'none' }}>
          <div className="rp-metodo-grid">
            {RP_METODOS.map(m => (
              <button key={m.key} className="rp-metodo-btn" onClick={() => handleAbrirMetodoRP(m.key)}>
                <strong>{m.label}</strong>
                <InfoBadge chave={`tse_${m.key}`} onInfoClick={setPopupInfo} />
                <span className="rp-metodo-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {RP_METODOS.map(m => {
          const methodState = metodoState[m.key];
          if (!methodState) return null;
          const Comp = m.Component;
          return (
            <div key={m.key} style={{ display: topAba === m.key ? '' : 'none' }}>
              <div className="lp-sub-tabs">
                <button className={`lp-sub-tab ${methodState.ativa === 'geral' ? 'ativo' : ''}`}
                  onClick={() => dispatch(setMetodoAtiva({ method: m.key, ativa: 'geral' }))}>Geral</button>
                {methodState.subs.map((id, idx) => {
                  const item = rpDataCache[id];
                  let label = `#${id}`;
                  if (item) {
                    if (m.key === 'empresas') label = fmtDoc(item.searchParams);
                    else if (m.key === 'doador' || m.key === 'fornecedor') label = fmtDoc(item.searchParams);
                    else label = item.searchParams?.filtro ? `${m.label}` : `#${id}`;
                  }
                  const key = `rp-${id}`;
                  return (
                    <button key={key} className={`lp-sub-tab ${methodState.ativa === key ? 'ativo' : ''}`}
                      onClick={() => dispatch(setMetodoAtiva({ method: m.key, ativa: key }))}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', idx)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = Number(e.dataTransfer.getData('text/plain'));
                        if (from !== idx) dispatch(reorderSubTabs({ method: m.key, from, to: idx }));
                      }}>
                      {label}
                      <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); handleFecharRPSubTab(m.key, key); }}>×</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: methodState.ativa === 'geral' ? '' : 'none' }}>
                <Comp onFechar={() => dispatch(setTopAba('geral'))} onSave={handleSalvarRP} onApagar={handleApagarRP}
                  savedList={rpCache} onIdClick={handleIdClick} onRPSearchComplete={handleRPSearchComplete} onRPAbrirSalvo={handleAbrirRPSalvo} />
              </div>
              {methodState.subs.map(id => {
                const key = `rp-${id}`;
                const item = rpDataCache[id];
                return (
                  <div key={key} style={{ display: methodState.ativa === key ? '' : 'none' }}>
                    <Comp onFechar={() => dispatch(setMetodoAtiva({ method: m.key, ativa: 'geral' }))}
                      onSave={handleSalvarRP} onApagar={handleApagarRP} savedList={rpCache}
                      onIdClick={handleIdClick} resultItem={item || null} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
