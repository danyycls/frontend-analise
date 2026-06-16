import { useEffect, useState, useRef } from 'react';
import API_BASE_URL, { WS_BASE_URL } from '../config';
import './Progresso.css';

function formatCNPJ(c) {
  if (!c || c.length !== 14) return c || '';
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`;
}

function formatValor(v) {
  if (v == null || isNaN(v)) return '-';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Progresso({ jobId, total, meta, onFinalizar, onCancelar, streamPath, batchPath }) {
  const baseStream = streamPath || '/orgao/analise/stream';
  const baseBatch = batchPath || '/orgao/analise/batch';
  const [processed, setProcessed] = useState(0);
  const [success, setSuccess] = useState(0);
  const [errors, setErrors] = useState(0);
  const [log, setLog] = useState([]);
  const [concluido, setConcluido] = useState(false);
  const [cancelado, setCancelado] = useState(false);
  const logRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    setCancelado(false);

    const wsUrl = `${WS_BASE_URL}${baseStream}/${jobId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        switch (ev.type) {
          case 'started':
            setLog((prev) => [...prev, { type: 'started', msg: 'Consultando…', cnpj: ev.cnpj }]);
            break;
          case 'success':
            setLog((prev) => [
              ...prev,
              { type: 'success', msg: `${ev.orgao || ''} — ${ev.totalContratos} contratos (${formatValor(ev.valorTotalContratos)})`, cnpj: ev.cnpj },
            ]);
            break;
          case 'error':
            setLog((prev) => [...prev, { type: 'error', msg: ev.message || 'Erro', cnpj: ev.cnpj }]);
            break;
          case 'progress':
            setProcessed(ev.processed);
            setSuccess(ev.success);
            setErrors(ev.errors);
            break;
          case 'completed':
            setLog((prev) => [...prev, { type: 'completed', msg: 'Processamento concluído' }]);
            break;
          case 'done':
            ws.close();
            wsRef.current = null;
            setConcluido(true);
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      ws.close();
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [jobId]);

  useEffect(() => {
    if (concluido && !cancelado) {
      carregarResultados();
    }
  }, [concluido, cancelado]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  function handleCancelar() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setCancelado(true);
    onCancelar?.();
  }

  async function carregarResultados() {
    try {
      const resp = await fetch(`${API_BASE_URL}${baseBatch}/${jobId}`);
      const data = await resp.json();
      if (data.status === 'completed' && data.results) {
        onFinalizar(data.results, meta, data.paginasErro || []);
      }
    } catch (_) {}
  }

  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="progresso-card">
      <div className="progresso-topo">
        <h2>Progresso da Análise</h2>
        {!concluido && !cancelado && (
          <button className="btn btn-sm btn-outline-danger" onClick={handleCancelar}>
            Cancelar
          </button>
        )}
      </div>

      <div className="progresso-bar">
        <div className="progresso-preenchimento" style={{ width: `${cancelado ? 0 : pct}%` }} />
      </div>

      <div className="progresso-stats">
        <div className="progresso-stat">
          <span className="progresso-stat-val">{processed}/{total}</span>
          <span className="progresso-stat-lbl">Processados</span>
        </div>
        <div className="progresso-stat">
          <span className="progresso-stat-val" style={{ color: 'var(--success)' }}>{success}</span>
          <span className="progresso-stat-lbl">Sucesso</span>
        </div>
        <div className="progresso-stat">
          <span className="progresso-stat-val" style={{ color: 'var(--error)' }}>{errors}</span>
          <span className="progresso-stat-lbl">Erros</span>
        </div>
      </div>

      <p className="progresso-status">
        {cancelado ? 'Busca cancelada.' : concluido ? `${pct}% concluído` : 'Consultando dados CNPJ'}
      </p>

      <div className="progresso-logs" ref={logRef}>
        {log.map((entry, i) => (
          <div key={i} className={`progresso-log ${entry.type === 'error' ? 'erro' : entry.type === 'success' || entry.type === 'completed' ? 'sucesso' : ''}`}>
            {entry.cnpj && <span className="progresso-cnpj">{formatCNPJ(entry.cnpj)} </span>}
            {entry.msg}
          </div>
        ))}
      </div>

      {cancelado && (
        <p className="progresso-mensagem">
          Nenhum resultado foi carregado.
        </p>
      )}

      {concluido && !cancelado && (
        <p className="progresso-mensagem accent">
          Carregando resultados…
        </p>
      )}
    </div>
  );
}
