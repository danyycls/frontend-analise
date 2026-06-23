import { useState, useEffect, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { CandidateCard } from './CandidateCard';
import type { TseResultItem, CandidatosResult, CargoOption, OpcoesResult } from '../model/types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<OpcoesResult<CargoOption>>(ENDPOINTS.TSE_CARGOS)
      .then(json => setCargos(json.opcoes || []))
      .catch(err => setError(err.message));
  }, []);

  async function handleBuscar() {
    if (!cargoNome) { setError('Selecione um cargo'); return; }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { cargo_nome: cargoNome };
      if (eleito) body.eleito = eleito;
      if (uf) body.sg_uf = uf;
      const json = await api.post<CandidatosResult>(ENDPOINTS.TSE_CANDIDATOS, body);
      onRPSearchComplete?.('cargo', { filtro: { cargoNome, eleito, uf } }, json);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
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
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
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
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading || !cargoNome}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
    </div>
  );
}
