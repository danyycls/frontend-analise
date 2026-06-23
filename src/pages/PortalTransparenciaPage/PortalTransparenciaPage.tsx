// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import { setPtTopAba, setPtMetodoAtiva, addPtSubTab, removePtSubTab, setPtMetodoState } from '@/app/store/slices/portalSlice';
import PortalOrgaos from '@/features/portal-transparencia/ui/PortalOrgaos';
import PortalPessoas from '@/features/portal-transparencia/ui/PortalPessoas';
import PortalCartoes from '@/features/portal-transparencia/ui/PortalCartoes';
import PortalServidores from '@/features/portal-transparencia/ui/PortalServidores';
import PortalDespesas from '@/features/portal-transparencia/ui/PortalDespesas';
import PortalEmendas from '@/features/portal-transparencia/ui/PortalEmendas';

let ptUid = 0;

const PT_METODOS = [
  { key: 'orgaos', label: 'Órgãos', desc: 'Consulta de órgãos públicos federais por código ou nome', Component: PortalOrgaos },
  { key: 'pessoas', label: 'Pessoas', desc: 'Busca de pessoas físicas com vínculos públicos por CPF ou nome', Component: PortalPessoas },
  { key: 'cartoes', label: 'Cartões', desc: 'Gastos com cartões corporativos por órgão ou portador', Component: PortalCartoes },
  { key: 'servidores', label: 'Servidores', desc: 'Servidores públicos federais por CPF, nome ou órgão', Component: PortalServidores },
  { key: 'despesas', label: 'Despesas', desc: 'Despesas do governo federal por órgão, ano ou favorecido', Component: PortalDespesas },
  { key: 'emendas', label: 'Emendas', desc: 'Emendas parlamentares por código, autor ou ano', Component: PortalEmendas },
];

export default function PortalTransparenciaPage() {
  const dispatch = useAppDispatch();
  const ptTopAba = useAppSelector((s) => s.portal.ptTopAba);
  const ptMetodoState = useAppSelector((s) => s.portal.ptMetodoState);
  const [ptDataCache, setPtDataCache] = useState({});
  const ptDataCacheRef = useRef(ptDataCache);
  useEffect(() => { ptDataCacheRef.current = ptDataCache; }, [ptDataCache]);

  const handleIdClick = () => {};

  const handlePTSearchComplete = useCallback((method, searchParams, data) => {
    const id = ++ptUid;
    setPtDataCache(prev => ({ ...prev, [id]: { searchParams, data, id, method, timestamp: new Date().toISOString() } }));
    dispatch(addPtSubTab({ method, id }));
    dispatch(setPtMetodoAtiva({ method, ativa: `pt-${id}` }));
    dispatch(setPtTopAba(method));
    dispatch(setAbaAtiva('portal'));
  }, [dispatch]);

  const handleFecharPTSubTab = useCallback((method, key) => {
    const id = Number(key.replace('pt-', ''));
    dispatch(removePtSubTab({ method, id }));
  }, [dispatch]);

  const handleAbrirMetodoPT = useCallback((method) => {
    dispatch(setPtTopAba(method));
    dispatch(setAbaAtiva('portal'));
  }, [dispatch]);

  return (
    <div className="tab-page">
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">Portal Transparência</h2>
          <p className="tab-desc">Consulte dados do Portal da Transparência do Governo Federal.</p>
        </div>

        <div className="lp-sub-tabs">
          <button className={`lp-sub-tab ${ptTopAba === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setPtTopAba('geral'))}>Geral</button>
          {PT_METODOS.map(m => (
            <button key={m.key} className={`lp-sub-tab ${ptTopAba === m.key ? 'ativo' : ''}`} onClick={() => dispatch(setPtTopAba(m.key))}>
              {m.label}
              <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); dispatch(setPtTopAba('geral')); }}>×</span>
            </button>
          ))}
        </div>

        <div style={{ display: ptTopAba === 'geral' ? '' : 'none' }}>
          <div className="rp-metodo-grid">
            {PT_METODOS.map(m => (
              <button key={m.key} className="rp-metodo-btn" onClick={() => handleAbrirMetodoPT(m.key)}>
                <strong>{m.label}</strong>
                <span className="rp-metodo-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {PT_METODOS.map(m => {
          const methodState = ptMetodoState[m.key];
          if (!methodState) return null;
          const Comp = m.Component;
          return (
            <div key={m.key} style={{ display: ptTopAba === m.key ? '' : 'none' }}>
              <div className="lp-sub-tabs">
                <button className={`lp-sub-tab ${methodState.ativa === 'geral' ? 'ativo' : ''}`}
                  onClick={() => dispatch(setPtMetodoAtiva({ method: m.key, ativa: 'geral' }))}>Geral</button>
                {methodState.subs.map((id, idx) => {
                  const item = ptDataCache[id];
                  let label = `#${id}`;
                  if (item) {
                    const params = item.searchParams;
                    if (m.key === 'orgaos') label = params?.codigo || params?.nome || `#${id}`;
                    else if (m.key === 'pessoas') label = params?.documento || params?.nome || `#${id}`;
                    else if (m.key === 'cartoes') label = params?.codigoOrgao || params?.cpfPortador || `#${id}`;
                    else if (m.key === 'servidores') label = params?.cpf || params?.nome || `#${id}`;
                    else if (m.key === 'despesas') label = params?.ano || params?.nomeFavorecido || `#${id}`;
                    else if (m.key === 'emendas') label = params?.codigoEmenda || params?.nomeAutor || `#${id}`;
                  }
                  const key = `pt-${id}`;
                  return (
                    <button key={key} className={`lp-sub-tab ${methodState.ativa === key ? 'ativo' : ''}`}
                      onClick={() => dispatch(setPtMetodoAtiva({ method: m.key, ativa: key }))}>
                      {label}
                      <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); handleFecharPTSubTab(m.key, key); }}>×</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: methodState.ativa === 'geral' ? '' : 'none' }}>
                <Comp onFechar={() => dispatch(setPtTopAba('geral'))} onIdClick={handleIdClick} onPTSearchComplete={handlePTSearchComplete} />
              </div>
              {methodState.subs.map(id => {
                const key = `pt-${id}`;
                const item = ptDataCache[id];
                return (
                  <div key={key} style={{ display: methodState.ativa === key ? '' : 'none' }}>
                    <Comp onFechar={() => dispatch(setPtMetodoAtiva({ method: m.key, ativa: 'geral' }))} onIdClick={handleIdClick} resultItem={item || null} />
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
