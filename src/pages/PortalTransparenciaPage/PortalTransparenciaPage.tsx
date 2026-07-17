// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import { setTopAba, setMetodoAtiva, addSubTab, removeSubTab, setMetodoState } from '@/app/store/slices/portalSlice';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';
import PortalOrgaos from '@/features/portal-transparencia/ui/PortalOrgaos';
import PortalPessoas from '@/features/portal-transparencia/ui/PortalPessoas';
import PortalCartoes from '@/features/portal-transparencia/ui/PortalCartoes';
import PortalServidores from '@/features/portal-transparencia/ui/PortalServidores';
import PortalDespesas from '@/features/portal-transparencia/ui/PortalDespesas';
import PortalEmendas from '@/features/portal-transparencia/ui/PortalEmendas';

let ptUid = 0;

const PT_METODOS = [
  { key: 'orgaos', label: 'Órgãos', desc: 'Consulta órgãos públicos federais cadastrados no SIAPE/SIAFI por código ou nome. Exibe código, nome, sigla e CNPJ.', Component: PortalOrgaos },
  { key: 'pessoas', label: 'Pessoas', desc: 'Busca pessoas físicas ou jurídicas com vínculos na administração pública federal por CPF, CNPJ ou nome.', Component: PortalPessoas },
  { key: 'cartoes', label: 'Cartões', desc: 'Consulta gastos com cartões de pagamento do governo federal por órgão, portador ou período.', Component: PortalCartoes },
  { key: 'servidores', label: 'Servidores', desc: 'Busca servidores públicos federais ativos e inativos por CPF, nome ou órgão. Exibe cargo, lotação e remuneração.', Component: PortalServidores },
  { key: 'despesas', label: 'Despesas', desc: 'Consulta despesas governamentais executadas pela administração federal por órgão, ano, UF ou favorecido.', Component: PortalDespesas },
  { key: 'emendas', label: 'Emendas', desc: 'Consulta emendas parlamentares ao orçamento federal por código, autor, ano ou tipo.', Component: PortalEmendas },
];

export default function PortalTransparenciaPage() {
  const dispatch = useAppDispatch();
  const topAba = useAppSelector((s) => s.portal.topAba);
  const metodoState = useAppSelector((s) => s.portal.metodoState);
  const [ptDataCache, setPtDataCache] = useState({});
  const ptDataCacheRef = useRef(ptDataCache);
  useEffect(() => { ptDataCacheRef.current = ptDataCache; }, [ptDataCache]);

  const handleIdClick = () => {};
  const { popupInfo, setPopupInfo } = useEntityInfo();

  const handlePTSearchComplete = useCallback((method, searchParams, data) => {
    const id = ++ptUid;
    setPtDataCache(prev => ({ ...prev, [id]: { searchParams, data, id, method, timestamp: new Date().toISOString() } }));
    dispatch(addSubTab({ method, id }));
    dispatch(setMetodoAtiva({ method, ativa: `pt-${id}` }));
    dispatch(setTopAba(method));
    dispatch(setAbaAtiva('portal'));
  }, [dispatch]);

  const handleFecharPTSubTab = useCallback((method, key) => {
    const id = Number(key.replace('pt-', ''));
    dispatch(removeSubTab({ method, id }));
  }, [dispatch]);

  const handleAbrirMetodoPT = useCallback((method) => {
    dispatch(setTopAba(method));
    dispatch(setAbaAtiva('portal'));
  }, [dispatch]);

  return (
    <div className="tab-page">
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">Portal Transparência</h2>
          <p className="tab-desc">Dados oficiais do Portal da Transparência: consulta de órgãos públicos, pessoas com vínculos públicos, servidores federais, despesas governamentais, cartões corporativos e emendas parlamentares.</p>
        </div>

        <div className="lp-sub-tabs">
          <button className={`lp-sub-tab ${topAba === 'geral' ? 'ativo' : ''}`} onClick={() => dispatch(setTopAba('geral'))}>Geral</button>
          {PT_METODOS.map(m => (
            <button key={m.key} className={`lp-sub-tab ${topAba === m.key ? 'ativo' : ''}`} onClick={() => dispatch(setTopAba(m.key))}>
              {m.label}
              <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); dispatch(setTopAba('geral')); }}>×</span>
            </button>
          ))}
        </div>

        <div style={{ display: topAba === 'geral' ? '' : 'none' }}>
          <div className="rp-metodo-grid">
            {PT_METODOS.map(m => (
              <button key={m.key} className="rp-metodo-btn" onClick={() => handleAbrirMetodoPT(m.key)}>
                <strong>{m.label}</strong>
                <InfoBadge chave={`portal_${m.key}`} onInfoClick={setPopupInfo} />
                <span className="rp-metodo-desc">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {PT_METODOS.map(m => {
          const methodState = metodoState[m.key];
          if (!methodState) return null;
          const Comp = m.Component;
          return (
            <div key={m.key} style={{ display: topAba === m.key ? '' : 'none' }}>
              <div className="lp-sub-tabs">
                <button className={`lp-sub-tab ${methodState.ativa === 'geral' ? 'ativo' : ''}`}
                  onClick={() => dispatch(setMetodoAtiva({ method: m.key, ativa: 'geral' }))}>Geral</button>
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
                      onClick={() => dispatch(setMetodoAtiva({ method: m.key, ativa: key }))}>
                      {label}
                      <span className="lp-sub-tab-fechar" onClick={(e) => { e.stopPropagation(); handleFecharPTSubTab(m.key, key); }}>×</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: methodState.ativa === 'geral' ? '' : 'none' }}>
                <Comp onFechar={() => dispatch(setTopAba('geral'))} onIdClick={handleIdClick} onPTSearchComplete={handlePTSearchComplete} />
              </div>
              {methodState.subs.map(id => {
                const key = `pt-${id}`;
                const item = ptDataCache[id];
                return (
                  <div key={key} style={{ display: methodState.ativa === key ? '' : 'none' }}>
                    <Comp onFechar={() => dispatch(setMetodoAtiva({ method: m.key, ativa: 'geral' }))} onIdClick={handleIdClick} resultItem={item || null} />
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
