import { useState, useEffect, type ChangeEvent } from 'react';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { CandidateCard } from './CandidateCard';
import type { TseResultItem, CandidatosResult, PartidoOption, OpcoesResult } from '../model/types';

const UFS_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface BuscaPartidoProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: TseResultItem | null;
  onRPSearchComplete?: (method: string, searchParams: unknown, data: CandidatosResult) => void;
}

export default function BuscaPartido({
  onFechar, onIdClick, resultItem, onRPSearchComplete,
}: BuscaPartidoProps) {
  const [partidos, setPartidos] = useState<PartidoOption[]>([]);
  const [partidoId, setPartidoId] = useState('');
  const [eleito, setEleito] = useState('');
  const [uf, setUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<OpcoesResult<PartidoOption>>(ENDPOINTS.TSE_PARTIDOS)
      .then(json => setPartidos(json.opcoes || []))
      .catch(err => setError(err.message));
  }, []);

  async function handleBuscar() {
    if (!partidoId) { setError('Selecione um partido'); return; }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { partido_id: partidoId };
      if (eleito) body.eleito = eleito;
      if (uf) body.sg_uf = uf;
      const json = await api.post<CandidatosResult>(ENDPOINTS.TSE_CANDIDATOS, body);
      onRPSearchComplete?.('partido', { filtro: { partidoId, eleito, uf } }, json);
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
          <h2>Políticos por Partido</h2>
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
        <h2>Políticos por Partido</h2>
        <span className="rp-desc">Buscar candidatos pelo partido político</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <div className="rp-search-row bfilter-row">
          <span className="rp-field-label required">Partido</span>
          <select value={partidoId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPartidoId(e.target.value)} className="rp-search-input">
            <option value="">Selecione um partido</option>
            {partidos.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
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
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading || !partidoId}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
    </div>
  );
}
