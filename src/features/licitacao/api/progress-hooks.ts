import { useEffect, useState, useRef, useCallback } from 'react';
import { WS_BASE_URL } from '@/shared/config';

export interface ProgressLog {
  type: string;
  msg: string;
  cnpj?: string;
}

export interface ProgressState {
  processed: number;
  success: number;
  errors: number;
  log: ProgressLog[];
  concluido: boolean;
  cancelado: boolean;
  pct: number;
}

export type AnaliseType = 'orgao' | 'publicacao' | 'uf-municipio';

const MAX_WS_RETRIES = 3;

export function useAnaliseProgress(
  jobId: string | null,
  tipo: AnaliseType,
  total: number,
  onCancelar?: () => void
) {
  const channel = tipo === 'publicacao' || tipo === 'uf-municipio' ? 'uf_municipio_analise' : 'orgao_analise';

  const [processed, setProcessed] = useState(0);
  const [success, setSuccess] = useState(0);
  const [errors, setErrors] = useState(0);
  const [log, setLog] = useState<ProgressLog[]>([]);
  const [concluido, setConcluido] = useState(false);
  const [cancelado, setCancelado] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  const connectWebSocket = useCallback(() => {
    if (!jobId) return;
    const ws = new WebSocket(`${WS_BASE_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      ws.send(JSON.stringify({ channel, job_id: jobId }));
    };

    ws.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        switch (ev.type) {
          case 'started':
          case 'related':
            setLog((prev) => [...prev, { type: ev.type, msg: ev.Total ? `Consultando…` : 'Consultando…', cnpj: ev.cnpj }]);
            break;
          case 'success':
            setLog((prev) => [
              ...prev,
              { type: 'success', msg: `${ev.Orgao || ''} — ${ev.TotalContratos || ev.totalContratos || 0} contratos`, cnpj: ev.cnpj },
            ]);
            break;
          case 'error':
            setLog((prev) => [...prev, { type: 'error', msg: ev.Message || ev.message || 'Erro', cnpj: ev.cnpj }]);
            break;
          case 'progress':
            setProcessed(ev.Processed ?? ev.processed ?? 0);
            setSuccess(ev.Success ?? ev.success ?? 0);
            setErrors(ev.Errors ?? ev.errors ?? 0);
            break;
          case 'results':
            setResults(ev.results || []);
            break;
          case 'completed':
            setLog((prev) => [...prev, { type: 'completed', msg: 'Processamento concluído' }]);
            break;
          case 'done':
            ws.close();
            wsRef.current = null;
            if (mountedRef.current) {
              setConcluido(true);
            }
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      if (retryCountRef.current < MAX_WS_RETRIES && mountedRef.current) {
        retryCountRef.current++;
        ws.close();
        wsRef.current = null;
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        setTimeout(() => {
          if (mountedRef.current && !cancelado && !concluido) {
            connectWebSocket();
          }
        }, delay);
      } else {
        ws.close();
        wsRef.current = null;
        if (mountedRef.current) {
          setLog((prev) => [...prev, { type: 'error', msg: 'WebSocket indisponível após tentativas' }]);
        }
      }
    };
  }, [jobId, channel, cancelado, concluido]);

  useEffect(() => {
    mountedRef.current = true;
    if (!jobId) return;
    setCancelado(false);
    setConcluido(false);
    setResults(null);
    retryCountRef.current = 0;

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [jobId, channel]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelar = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setCancelado(true);
    onCancelar?.();
  };

  return {
    processed,
    success,
    errors,
    log,
    concluido,
    cancelado,
    pct,
    results,
    cancelar,
  };
}
