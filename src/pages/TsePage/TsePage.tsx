// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import {
  setRpTopAba, setRpMetodoAtiva, addRpSubTab,
  removeRpSubTab, reorderRpSubTabs, setRpMetodoState,
} from '@/app/store/slices/tseSlice';
import RelacoesPoliticas from '@/features/tse/ui/RelacoesPoliticas';
import BuscaCargo from '@/features/tse/ui/BuscaCargo';
import BuscaPartido from '@/features/tse/ui/BuscaPartido';
import BuscaDoador from '@/features/tse/ui/BuscaDoador';
import BuscaFornecedor from '@/features/tse/ui/BuscaFornecedor';
import { fmtDoc } from '@/shared/lib/formatters';

let rpUid = 0;

const RP_METODOS = [
  { key: 'empresas', label: 'TSE - Empresas', desc: 'Despesas e receitas eleitorais de campanha por CNPJ de empresa', Component: RelacoesPoliticas },
  { key: 'cargo', label: 'Políticos por Cargo', desc: 'Busca de candidatos eleitos e suplentes por cargo e localidade', Component: BuscaCargo },
  { key: 'partido', label: 'Políticos por Partido', desc: 'Candidatos e filiados filtrados por partido político', Component: BuscaPartido },
  { key: 'doador', label: 'Relação de Doadores', desc: 'Doadores de campanha vinculados a empresas e pessoas físicas', Component: BuscaDoador },
  { key: 'fornecedor', label: 'Relação de Fornecedores', desc: 'Fornecedores de campanhas eleitorais', Component: BuscaFornecedor },
];

export default function TsePage() {
  const dispatch = useAppDispatch();
  const rpTopAba = useAppSelector((s) => s.tse.rpTopAba);
  const rpMetodoState = useAppSelector((s) => s.tse.rpMetodoState);
  const [rpDataCache, setRpDataCache] = useState({});
  const [rpCache, setRpCache] = useState([]);
  const rpDataCacheRef = useRef(rpDataCache);
  const rpMetodoStateRef = useRef(rpMetodoState);

  useEffect(() => { rpDataCacheRef.current = rpDataCache; }, [rpDataCache]);
  useEffect(() => { rpMetodoStateRef.current = rpMetodoState; }, [rpMetodoState]);

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
    dispatch(addRpSubTab({ method, id }));
    dispatch(setRpMetodoAtiva({ method, ativa: `rp-${id}` }));
    dispatch(setRpTopAba(method));
    dispatch(setAbaAtiva('relacoes'));
  }, [dispatch]);

  const handleFecharRPSubTab = useCallback((method, key) => {
    const id = Number(key.replace('rp-', ''));
    dispatch(removeRpSubTab({ method, id }));
  }, [dispatch]);

  const handleAbrirRPSalvo = useCallback((item) => {
    const method = item.method || 'empresas';
    const id = item.id;
    setRpDataCache(prev => ({ ...prev, [id]: item }));
    if (!rpMetodoStateRef.current[method]?.subs.includes(id)) {
      dispatch(addRpSubTab({ method, id }));
    }
    dispatch(setRpMetodoAtiva({ method, ativa: `rp-${id}` }));
    dispatch(setRpTopAba(method));
    dispatch(setAbaAtiva('relacoes'));
  }, [dispatch]);

  const handleAbrirMetodoRP = useCallback((method) => {
    dispatch(setRpTopAba(method));
    dispatch(setAbaAtiva('relacoes'));
  }, [dispatch]);

  return (
    <div className="tab-page">
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">TSE</h2>
          <p className="tab-desc">Consulta de dados eleitorais, doações e conexões partidárias.</p>
        </div>

        <div className="lp-sub-tabs">
          <button className={`lp-sub-tab ${rpTopAba === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setRpTopAba('geral'))}>
            Geral
          </button>
          {RP_METODOS.map(m => (
            <button key={m.key} className={`lp-sub-tab ${rpTopAba === m.key ? 'ativo' : ''}`} onClick={() => dispatch(setRpTopAba(m.key))}>
              {m.label}
              <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); dispatch(setRpTopAba('geral')); }}>×</span>
            </button>
          ))}
        </div>

        <div style={{ display: rpTopAba === 'geral' ? '' : 'none' }}>
          <div className="rp-metodo-grid">
            {RP_METODOS.map(m => (
              <button key={m.key} className="rp-metodo-btn" onClick={() => handleAbrirMetodoRP(m.key)}>
                <strong>{m.label}</strong>
                <span className="rp-metodo-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {RP_METODOS.map(m => {
          const methodState = rpMetodoState[m.key];
          if (!methodState) return null;
          const Comp = m.Component;
          return (
            <div key={m.key} style={{ display: rpTopAba === m.key ? '' : 'none' }}>
              <div className="lp-sub-tabs">
                <button className={`lp-sub-tab ${methodState.ativa === 'geral' ? 'ativo' : ''}`}
                  onClick={() => dispatch(setRpMetodoAtiva({ method: m.key, ativa: 'geral' }))}>Geral</button>
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
                      onClick={() => dispatch(setRpMetodoAtiva({ method: m.key, ativa: key }))}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', idx)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = Number(e.dataTransfer.getData('text/plain'));
                        if (from !== idx) dispatch(reorderRpSubTabs({ method: m.key, from, to: idx }));
                      }}>
                      {label}
                      <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); handleFecharRPSubTab(m.key, key); }}>×</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: methodState.ativa === 'geral' ? '' : 'none' }}>
                <Comp onFechar={() => dispatch(setRpTopAba('geral'))} onSave={handleSalvarRP} onApagar={handleApagarRP}
                  savedList={rpCache} onIdClick={handleIdClick} onRPSearchComplete={handleRPSearchComplete} onRPAbrirSalvo={handleAbrirRPSalvo} />
              </div>
              {methodState.subs.map(id => {
                const key = `rp-${id}`;
                const item = rpDataCache[id];
                return (
                  <div key={key} style={{ display: methodState.ativa === key ? '' : 'none' }}>
                    <Comp onFechar={() => dispatch(setRpMetodoAtiva({ method: m.key, ativa: 'geral' }))}
                      onSave={handleSalvarRP} onApagar={handleApagarRP} savedList={rpCache}
                      onIdClick={handleIdClick} resultItem={item || null} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
