import { useState, useEffect, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { CandidateCard } from './CandidateCard';
import { useCargoSearch } from '../api/hooks';
import type { TseResultItem, CandidatosResult, CargoOption, OpcoesResult } from '../model/types';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

const UFS_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface BuscaCargoProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: TseResultItem | null;
  onRPSearchComplete?: (method: string, searchParams: unknown, data: CandidatosResult) => void;
}

export default function BuscaCargo({
  onFechar, onIdClick, resultItem, onRPSearchComplete,
}: BuscaCargoProps) {
  const [cargos, setCargos] = useState<CargoOption[]>([]);
  const [cargoNome, setCargoNome] = useState('');
  const [eleito, setEleito] = useState('');
  const [uf, setUf] = useState('');
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const cargoSearch = useCargoSearch();

  useEffect(() => {
    api.get<OpcoesResult<CargoOption>>(ENDPOINTS.TSE_CARGOS)
      .then(json => setCargos(json.opcoes || []))
      .catch(() => {});
  }, []);

  function handleBuscar() {
    if (!cargoNome) return;
    const body: Record<string, unknown> = { cargo_nome: cargoNome };
    if (eleito) body.eleito = eleito;
    if (uf) body.sg_uf = uf;
    cargoSearch.mutate(body, {
      onSuccess: (data) => {
        onRPSearchComplete?.('cargo', { filtro: { cargoNome, eleito, uf } }, data);
      },
    });
  }

  if (resultItem) {
    const data = resultItem.data as CandidatosResult;
    const candidatos = data?.candidatos || [];
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Políticos por Cargo</h2>
          <span className="rp-desc">{candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}</span>
          <div className="rp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <div className="rp-result">
          <div className="bcard-grid">
            {candidatos.map(c => <CandidateCard key={c.sq_candidato} c={c} onIdClick={onIdClick} />)}
          </div>
          {candidatos.length === 0 && <p className="rp-empty">Nenhum candidato encontrado.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Políticos por Cargo</h2>
        <span className="rp-desc">Buscar candidatos pelo cargo político</span>
        <InfoBadge chave="tse_cargo" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Selecione um cargo eletivo e filtre por UF e situação (eleitos/não eleitos) para encontrar candidatos. Os resultados exibem nome, partido, cargo, UF e situação de cada candidato nas eleições.
      </p>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <span className="rp-field-label required">Cargo</span>
          <select value={cargoNome} onChange={(e: ChangeEvent<HTMLSelectElement>) => setCargoNome(e.target.value)} className="rp-search-input">
            <option value="">Selecione um cargo</option>
            {cargos.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
          <span className="rp-field-label optional">Situação</span>
          <select value={eleito} onChange={(e: ChangeEvent<HTMLSelectElement>) => setEleito(e.target.value)} className="rp-search-input">
            <option value="">Todos</option>
            <option value="ELEITO">Eleitos</option>
            <option value="NAO_ELEITO">Não Eleitos</option>
          </select>
          <span className="rp-field-label optional">UF</span>
          <select value={uf} onChange={(e: ChangeEvent<HTMLSelectElement>) => setUf(e.target.value)} className="rp-search-input">
            <option value="">Todas as UF</option>
            {UFS_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button className="btn btn-sm" onClick={handleBuscar} disabled={cargoSearch.isPending || !cargoNome}>
            {cargoSearch.isPending ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {cargoSearch.error && <p className="rp-error">{(cargoSearch.error as Error).message}</p>}
      </div>
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
