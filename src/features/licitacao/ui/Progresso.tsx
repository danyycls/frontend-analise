import { useEffect, useRef } from 'react';
import { useAnaliseProgress, useBatchResults } from '../api/progress-hooks';
import { fmtDoc, fmtValor } from '@/shared/lib/formatters';
import { API_BASE_URL } from '@/shared/config';

interface ProgressoProps {
  jobId: string;
  total: number;
  meta: Record<string, unknown>;
  onFinalizar: (resultados: unknown[], meta: unknown, paginasErro: unknown) => void;
  onCancelar: () => void;
  streamPath: string;
  batchPath: string;
}

export default function Progresso({ jobId, total, meta, onFinalizar, onCancelar, streamPath, batchPath }: ProgressoProps) {
  const tipo = streamPath?.includes('publicacao') ? 'publicacao' : 'orgao';
  const logRef = useRef<HTMLDivElement>(null);

  const {
    processed,
    success,
    errors,
    log,
    concluido,
    cancelado,
    pct,
    cancelar,
    batchEnabled,
    batchPath: resolvedBatchPath,
  } = useAnaliseProgress(jobId, tipo, total, onCancelar);

  const batchPathOverride = batchPath || '/orgao/analise/batch';

  useBatchResults(jobId, batchEnabled && !cancelado, resolvedBatchPath);

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

  async function carregarResultados() {
    try {
      const resp = await fetch(`${API_BASE_URL}${resolvedBatchPath}/${jobId}`);
      const data = await resp.json();
      if (data.status === 'completed' && data.results) {
        onFinalizar(data.results, meta, data.paginasErro || []);
      }
    } catch (_) {}
  }

  return (
    <div className="progresso-card">
      <div className="progresso-topo">
        <h2>Progresso da Análise</h2>
        {!concluido && !cancelado && (
          <button className="btn btn-sm btn-outline-danger" onClick={cancelar}>
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
            {entry.cnpj && <span className="progresso-cnpj">{fmtDoc(entry.cnpj)} </span>}
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
