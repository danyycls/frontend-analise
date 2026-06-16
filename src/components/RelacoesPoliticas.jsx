import { useState, useCallback, useRef, useEffect } from 'react';
import API_BASE_URL from '../config';
import './RelacoesPoliticas.css';

function fmtDoc(d) {
  if (!d) return '';
  const s = d.replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return d;
}

function fmtVal(v) {
  if (v == null) return '-';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d) {
  if (!d) return '-';
  return d;
}

function RPResultView({ data, onIdClick }) {
  return (
    <>
      <div className="rp-sumario">
        <div className="rp-sumario-item">
          <span className="rp-sumario-valor">{data.total_despesas}</span>
          <span className="rp-sumario-label">Despesas</span>
        </div>
        <div className="rp-sumario-item">
          <span className="rp-sumario-valor">{data.total_receitas}</span>
          <span className="rp-sumario-label">Receitas</span>
        </div>
      </div>

      {data.fornecedor && (
        <div className="rp-entity-card clickable" onClick={() => onIdClick?.('cpf_cnpj', data.fornecedor.cpf_cnpj)}>
          <span className="rp-entity-tag tag-fornecedor">Fornecedor</span>
          <span className="rp-entity-name">{data.fornecedor.nome || data.fornecedor.cpf_cnpj}</span>
          <span className="rp-entity-doc">{fmtDoc(data.fornecedor.cpf_cnpj)}</span>
        </div>
      )}

      {data.doador && (
        <div className="rp-entity-card clickable" onClick={() => onIdClick?.('cpf_cnpj_doador', data.doador.cpf_cnpj)}>
          <span className="rp-entity-tag tag-doador">Doador</span>
          <span className="rp-entity-name">{data.doador.nome || data.doador.cpf_cnpj}</span>
          <span className="rp-entity-doc">{fmtDoc(data.doador.cpf_cnpj)}</span>
        </div>
      )}

      {data.despesas.length > 0 && (
        <div className="rp-lista">
          <h3 className="rp-lista-title">Despesas ({data.despesas.length})</h3>
          <div className="rp-cards">
            {data.despesas.map((d, i) => (
              <div key={i} className="rp-card rp-card-despesa">
                <div className="rp-card-topo">
                  <span className="rp-card-tag tag-despesa">Despesa</span>
                  <span className="rp-card-tipo">{d.tipo === 'candidato' ? 'Candidato' : 'Partido'}</span>
                  <span className="rp-card-valor">{fmtVal(d.valor)}</span>
                </div>
                <div className="rp-card-body">
                  <div className="rp-card-field">
                    <span className="rp-card-label">SQ</span>
                    <span
                      className="rp-card-value rp-id-link"
                      onClick={() => onIdClick?.('sq_despesa', String(d.sq_despesa))}
                    >{d.sq_despesa}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Data</span>
                    <span className="rp-card-value">{fmtDate(d.data_despesa)}</span>
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
                      <span
                        className="rp-card-value rp-id-link"
                        onClick={() => onIdClick?.('sq_candidato', String(d.candidato.sq_candidato))}
                      >{d.candidato.sq_candidato}</span>
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

      {data.receitas.length > 0 && (
        <div className="rp-lista">
          <h3 className="rp-lista-title">Receitas ({data.receitas.length})</h3>
          <div className="rp-cards">
            {data.receitas.map((r, i) => (
              <div key={i} className="rp-card rp-card-receita">
                <div className="rp-card-topo">
                  <span className="rp-card-tag tag-receita">Receita</span>
                  <span className="rp-card-tipo">{r.tipo === 'candidato' ? 'Candidato' : 'Partido'}</span>
                  <span className="rp-card-valor">{fmtVal(r.valor)}</span>
                </div>
                <div className="rp-card-body">
                  <div className="rp-card-field">
                    <span className="rp-card-label">SQ</span>
                    <span
                      className="rp-card-value rp-id-link"
                      onClick={() => onIdClick?.('sq_receita', String(r.sq_receita))}
                    >{r.sq_receita}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Data</span>
                    <span className="rp-card-value">{fmtDate(r.data_receita)}</span>
                  </div>
                  <div className="rp-card-field rp-card-field-full">
                    <span className="rp-card-label">Descrição</span>
                    <span className="rp-card-value">{r.descricao || '-'}</span>
                  </div>
                  <div className="rp-card-field">
                    <span className="rp-card-label">Origem</span>
                    <span className="rp-card-value">{r.origem_receita_descricao || '-'}</span>
                  </div>
                  {r.candidato && (
                    <div className="rp-card-field">
                      <span className="rp-card-label">Candidato</span>
                      <span
                        className="rp-card-value rp-id-link"
                        onClick={() => onIdClick?.('sq_candidato', String(r.candidato.sq_candidato))}
                      >{r.candidato.sq_candidato}</span>
                    </div>
                  )}
                  {r.partido && (
                    <div className="rp-card-field">
                      <span className="rp-card-label">Partido</span>
                      <span className="rp-card-value">{r.partido.sigla} - {r.partido.nome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.despesas.length === 0 && data.receitas.length === 0 && (
        <p className="rp-empty">Nenhuma despesa ou receita encontrada para este CNPJ.</p>
      )}
    </>
  );
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
}) {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarSalvas, setMostrarSalvas] = useState(savedList && savedList.length > 0);
  const [rpSalvo, setRpSalvo] = useState({});
  const abortRef = useRef(null);

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
      const resp = await fetch(`${API_BASE_URL}/busca/relacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: digits }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.erro || resp.statusText);
      }
      const json = await resp.json();
      if (controller.signal.aborted) return;
      onRPSearchComplete?.('empresas', digits, json);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    }
    if (!controller.signal.aborted) {
      setLoading(false);
      abortRef.current = null;
    }
  }, [cnpj, onRPSearchComplete]);

  function handleKeyDown(e) {
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
                  onSave({ method: resultItem.method, cnpj: documento, data: resultItem.data, timestamp: new Date().toISOString() });
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
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>

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
                    <span className="rp-saved-cnpj">{fmtDoc(item.cnpj)}</span>
                    <span className="rp-saved-data">
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="rp-saved-card-body">
                    <span className="rp-saved-stat">Despesas: {item.data.total_despesas}</span>
                    <span className="rp-saved-stat">Receitas: {item.data.total_receitas}</span>
                  </div>
                  <div className="rp-saved-card-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => onRPAbrirSalvo?.(item)}
                    >
                      Abrir
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onApagar(item.id)}
                    >
                      Excluir
                    </button>
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
