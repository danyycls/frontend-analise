import { useState, useCallback, useRef } from 'react';
import API_BASE_URL from '../config';
import './RelacoesPoliticas.css';
import './BuscaCargo.css';

function fmtDoc(d) {
  if (!d) return '';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

function fmtVal(v) {
  if (v == null) return '-';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d) {
  if (!d) return '-';
  return d;
}

export default function BuscaDoador({
  onFechar, onIdClick, resultItem, onRPSearchComplete, onSave,
}) {
  const [documento, setDocumento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const handleBuscar = useCallback(async () => {
    const digits = documento.replace(/\D/g, '');
    if (digits.length < 3) { setError('Informe um CPF ou CNPJ'); return; }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/busca/doadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento: digits }),
        signal: controller.signal,
      });
      if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).erro || 'Erro na busca');
      const json = await resp.json();
      if (controller.signal.aborted) return;
      onRPSearchComplete?.('doador', digits, json);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    }
    if (!controller.signal.aborted) {
      setLoading(false);
      abortRef.current = null;
    }
  }, [documento, onRPSearchComplete]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleBuscar();
  }

  const digits = documento.replace(/\D/g, '');

  if (resultItem) {
    const data = resultItem.data;
    const receitas = data?.receitas || [];
    const doador = data?.doador;
    return (
      <div className="rp-section">
        <div className="rp-topo">
          <h2>Relação de Doadores</h2>
          <span className="rp-desc">{resultItem.searchParams ? fmtDoc(resultItem.searchParams) : ''}</span>
          <div className="rp-topo-actions">
            <button className="btn btn-sm" onClick={onFechar}>Voltar</button>
          </div>
        </div>
        <div className="rp-result">
          {doador && (
            <div className="rp-entity-card clickable" onClick={() => onIdClick?.('cpf_cnpj_doador', doador.cpf_cnpj)}>
              <span className="rp-entity-tag tag-doador">Doador</span>
              <span className="rp-entity-name">{doador.nome}</span>
              <span className="rp-entity-doc">{fmtDoc(doador.cpf_cnpj)}</span>
            </div>
          )}
          <div className="rp-sumario">
            <div className="rp-sumario-item">
              <span className="rp-sumario-valor">{data.total_receitas || receitas.length}</span>
              <span className="rp-sumario-label">Receitas</span>
            </div>
          </div>
          {receitas.length > 0 && (
            <div className="rp-lista">
              <h3 className="rp-lista-title">Receitas ({receitas.length})</h3>
              <div className="rp-cards">
                {receitas.map((r, i) => (
                  <div key={i} className="rp-card rp-card-receita">
                    <div className="rp-card-topo">
                      <span className="rp-card-tag tag-receita">Receita</span>
                      <span className="rp-card-tipo">{r.tipo === 'candidato' ? 'Candidato' : 'Partido'}</span>
                      <span className="rp-card-valor">{fmtVal(r.valor)}</span>
                    </div>
                    <div className="rp-card-body">
                      <div className="rp-card-field">
                        <span className="rp-card-label">SQ</span>
                        <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_receita', String(r.sq_receita))}>{r.sq_receita}</span>
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
                          <span className="rp-card-value rp-id-link" onClick={() => onIdClick?.('sq_candidato', String(r.candidato.sq_candidato))}>{r.candidato.sq_candidato}</span>
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
          {receitas.length === 0 && <p className="rp-empty">Nenhuma receita encontrada para este doador.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rp-section">
      <div className="rp-topo">
        <h2>Relação de Doadores</h2>
        <span className="rp-desc">Buscar doador por CPF/CNPJ</span>
        <div className="rp-topo-actions">
          <button className="btn btn-sm" onClick={onFechar}>Fechar</button>
        </div>
      </div>
      <div className="rp-search-box">
        <label className="rp-search-label rp-search-label-required">CPF/CNPJ do doador</label>
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
          <button className="btn btn-sm" onClick={handleBuscar} disabled={loading || digits.length < 3}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {error && <p className="rp-error">{error}</p>}
      </div>
    </div>
  );
}
