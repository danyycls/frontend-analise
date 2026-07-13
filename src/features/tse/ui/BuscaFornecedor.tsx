import { useState, useCallback, type KeyboardEvent } from 'react';
import { fmtDoc, fmtVal } from '@/shared/lib/formatters';
import { useFornecedorSearch } from '../api/hooks';
import type { TseResultItem, TseFornecedorResult, TseDespesa } from '../model/types';
import { InfoBadge, PopupInfo, useEntityInfo } from '@/shared/ui/EntityInfo/EntityInfo';

interface BuscaFornecedorProps {
  onFechar: () => void;
  onIdClick?: (key: string, value: string) => void;
  resultItem?: TseResultItem | null;
  onRPSearchComplete?: (method: string, searchParams: string, data: TseFornecedorResult) => void;
}

export default function BuscaFornecedor({
  onFechar, onIdClick, resultItem, onRPSearchComplete,
}: BuscaFornecedorProps) {
  const [documento, setDocumento] = useState('');
  const { popupInfo, setPopupInfo } = useEntityInfo();
  const fornecedorSearch = useFornecedorSearch();

  const handleBuscar = useCallback(() => {
    const digits = documento.replace(/\D/g, '');
    if (digits.length < 3) return;
    fornecedorSearch.mutate(digits, {
      onSuccess: (data) => {
        onRPSearchComplete?.('fornecedor', digits, data);
      },
    });
  }, [documento, onRPSearchComplete, fornecedorSearch]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleBuscar();
  }

  const digits = documento.replace(/\D/g, '');

  if (resultItem) {
    const data = resultItem.data as TseFornecedorResult;
    const despesas: TseDespesa[] = data?.despesas || [];
    const fornecedor = data?.fornecedor;
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Relação de Fornecedores</h2>
          <span className="rp-desc">{resultItem.searchParams ? fmtDoc(resultItem.searchParams) : ''}</span>
          <div className="rp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <div className="rp-result">
          {fornecedor && (
            <div className="rp-entity-card clickable" onClick={() => onIdClick?.('cpf_cnpj', fornecedor.cpf_cnpj)}>
              <span className="rp-entity-tag tag-fornecedor">Fornecedor</span>
              <span className="rp-entity-name">{fornecedor.nome}</span>
              <span className="rp-entity-doc">{fmtDoc(fornecedor.cpf_cnpj)}</span>
            </div>
          )}
          <div className="rp-sumario">
            <div className="rp-sumario-item">
              <span className="rp-sumario-valor">{data?.total_despesas || despesas.length}</span>
              <span className="rp-sumario-label">Despesas</span>
            </div>
          </div>
          {despesas.length > 0 && (
            <div className="rp-lista">
              <h3 className="rp-lista-title">Despesas ({despesas.length})</h3>
              <div className="rp-cards">
                {despesas.map((d, i) => (
                  <div key={i} className="rp-card rp-card-despesa">
                    <div className="rp-card-topo">
                      <span className="rp-card-tag tag-despesa">Despesa</span>
                      <span className="rp-card-tipo">{d.tipo === 'candidato' ? 'Candidato' : 'Partido'}</span>
                      <span className="rp-card-valor">{fmtVal(d.valor)}</span>
                    </div>
                    <div className="rp-card-body">
                      <div className="rp-card-field">
                        <span className="rp-card-label">SQ</span>
                        <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_despesa', String(d.sq_despesa))}>{d.sq_despesa}</span>
                      </div>
                      <div className="rp-card-field">
                        <span className="rp-card-label">Data</span>
                        <span className="rp-card-value">{d.data_despesa || '-'}</span>
                      </div>
                      <div className="rp-card-field rp-card-field-full">
                        <span className="rp-card-label">Descrição</span>
                        <span className="rp-card-value">{d.descricao || '-'}</span>
                      </div>
                      <div className="rp-card-field">
                        <span className="rp-card-label">Origem</span>
                        <span className="rp-card-value">{d.origem_despesa_descricao || '-'}</span>
                      </div>
                      {d.candidato && (
                        <div className="rp-card-field">
                          <span className="rp-card-label">Candidato</span>
                          <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_candidato', String(d.candidato!.sq_candidato))}>{d.candidato.sq_candidato}</span>
                        </div>
                      )}
                      {d.partido && (
                        <div className="rp-card-field">
                          <span className="rp-card-label">Partido</span>
                          <span className="rp-card-value">{d.partido.sigla} - {d.partido.nome}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {despesas.length === 0 && <p className="rp-empty">Nenhuma despesa encontrada para este fornecedor.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Relação de Fornecedores</h2>
        <span className="rp-desc">Buscar fornecedor por CPF/CNPJ</span>
        <InfoBadge chave="tse_fornecedor" onInfoClick={setPopupInfo} />
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <p className="ad-query-form-desc" style={{ marginBottom: 12 }}>
        Informe o CPF ou CNPJ de um fornecedor para consultar todas as despesas de campanha pagas a ele por candidatos e partidos. Os resultados exibem valor, data, descrição da despesa e o candidato ou partido contratante.
      </p>
      <div className="rp-search-box">
        <label className="rp-search-label rp-search-label-required">CPF/CNPJ do fornecedor</label>
        <div className="rp-search-row">
          <input
            type="text"
            className="rp-search-input"
            placeholder="00.000.000/0000-00"
            value={documento}
            onChange={e => setDocumento(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={18}
          />
          <button className="btn btn-sm" onClick={handleBuscar} disabled={fornecedorSearch.isPending || digits.length < 3}>
            {fornecedorSearch.isPending ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {fornecedorSearch.error && <p className="rp-error">{(fornecedorSearch.error as Error).message}</p>}
      </div>
      {popupInfo && <PopupInfo chave={popupInfo} onFechar={() => setPopupInfo(null)} />}
    </div>
  );
}
