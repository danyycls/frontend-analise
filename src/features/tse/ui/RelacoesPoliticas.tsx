import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { api } from '@/shared/api/client';
import { fmtDoc } from '@/shared/lib/formatters';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { RPResultView } from './RPResultView';
import type { TseResultItem, TseSavedItem } from '../model/types';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

interface RelacoesPoliticasProps {
  onFechar: () => void;
  onSave?: (item: TseSavedItem) => void;
  onApagar?: (id: number) => void;
  savedList?: TseSavedItem[];
  onIdClick?: (key: string, value: string) => void;
  resultItem?: TseResultItem | null;
  onRPSearchComplete?: (method: string, searchParams: string, data: unknown) => void;
  onRPAbrirSalvo?: (item: TseSavedItem) => void;
}

export default function RelacoesPoliticas({
  onFechar,
  onSave,
  onApagar,
  savedList,
  onIdClick,
  resultItem,
  onRPSearchComplete,
  onRPAbrirSalvo,
}: RelacoesPoliticasProps) {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarSalvas, setMostrarSalvas] = useState(savedList && savedList.length > 0);
  const [rpSalvo, setRpSalvo] = useState<Record<number, boolean>>({});
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (savedList && savedList.length > 0) {
      setMostrarSalvas(true);
    }
  }, [savedList]);

  const handleBuscar = useCallback(async () => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) {
      setError('Informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const json = await api.post(ENDPOINTS.TSE_RELACOES, { cnpj: digits });
      if (controller.signal.aborted) return;
      onRPSearchComplete?.('empresas', digits, json);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    }
    if (!controller.signal.aborted) {
      setLoading(false);
      abortRef.current = null;
    }
  }, [cnpj, onRPSearchComplete]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleBuscar();
  }

  const cnpjAtual = cnpj.replace(/\D/g, '');

  if (resultItem) {
    const documento = resultItem.searchParams || '';
    const isSalvo = rpSalvo[resultItem.id] || false;
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>TSE</h2>
          <span className="rp-desc">CNPJ: {fmtDoc(documento)}</span>
          <div className="rp-topo-actions">
            <button
              className="btn btn-sm"
              onClick={() => {
                if (!isSalvo && onSave) {
                  onSave({ method: resultItem.method, cnpj: documento, data: resultItem.data, timestamp: new Date().toISOString(), id: resultItem.id });
                  setRpSalvo(prev => ({ ...prev, [resultItem.id]: true }));
                }
              }}
              disabled={isSalvo}
            >
              {isSalvo ? 'Salvo!' : 'Salvar'}
            </button>
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <RPResultView data={resultItem.data} onIdClick={onIdClick} />
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>TSE</h2>
        <span className="rp-desc">Busca de despesas e receitas eleitorais por CNPJ de empresa</span>
        <InfoBadge chave="tse_empresas" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>

      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Informe o CNPJ da empresa para consultar todas as despesas e receitas eleitorais declaradas ao TSE nas campanhas em que ela atuou como doadora ou fornecedora. Os resultados exibem valores, datas, origens e os candidatos ou partidos envolvidos em cada transação.
      </p>
      <div className="rp-search-box">
        <label className="rp-search-label rp-search-label-required">CNPJ da empresa</label>
        <div className="rp-search-row">
          <input
            type="text"
            className="rp-search-input"
            placeholder="00.000.000/0000-00"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={18}
          />
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading || cnpjAtual.length !== 14}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>

      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
      {savedList && savedList.length > 0 && (
        <div className="rp-saved-section">
          <button
            className="rp-saved-toggle"
            onClick={() => setMostrarSalvas(!mostrarSalvas)}
          >
            {mostrarSalvas ? '▼' : '▶'} Análises Salvas ({savedList.length})
          </button>
          {mostrarSalvas && (
            <div className="rp-saved-list">
              {savedList.map((item) => (
                <div key={item.id} className="rp-saved-card">
                  <div className="rp-saved-card-topo">
                    <span className="rp-saved-cnpj">{fmtDoc(item.cnpj || '')}</span>
                    <span className="rp-saved-data">
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="rp-saved-card-body">
                    <span className="rp-saved-stat">Despesas: {(item.data as any).total_despesas}</span>
                    <span className="rp-saved-stat">Receitas: {(item.data as any).total_receitas}</span>
                  </div>
                  <div className="rp-saved-card-actions">
                    <button className="btn btn-sm" onClick={() => onRPAbrirSalvo?.(item)}>Abrir</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onApagar?.(item.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
