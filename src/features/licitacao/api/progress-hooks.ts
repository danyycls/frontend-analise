import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { WS_BASE_URL, API_BASE_URL } from '@/shared/config';

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

type AnaliseType = 'orgao' | 'publicacao';

const MAX_WS_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;

export function useAnaliseProgress(
  jobId: string | null,
  tipo: AnaliseType,
  total: number,
  onCancelar?: () => void
) {
  const channel = tipo === 'publicacao' ? 'publicacao_analise' : 'orgao_analise';
  const batchPath = tipo === 'publicacao' ? '/publicacao/analise/batch' : '/orgao/analise/batch';

  const [processed, setProcessed] = useState(0);
  const [success, setSuccess] = useState(0);
  const [errors, setErrors] = useState(0);
  const [log, setLog] = useState<ProgressLog[]>([]);
  const [concluido, setConcluido] = useState(false);
  const [cancelado, setCancelado] = useState(false);
  const [batchEnabled, setBatchEnabled] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      if (!jobId) return;
      try {
        const resp = await fetch(`${API_BASE_URL}${batchPath}/${jobId}`);
        const data = await resp.json();
        if (data.status === 'completed') {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (mountedRef.current) {
            setConcluido(true);
            setBatchEnabled(true);
          }
        }
      } catch (_) {}
    }, POLL_INTERVAL_MS);
  }, [jobId, batchPath]);

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
          case 'completed':
            setLog((prev) => [...prev, { type: 'completed', msg: 'Processamento concluído' }]);
            break;
          case 'done':
            ws.close();
            wsRef.current = null;
            if (mountedRef.current) {
              setConcluido(true);
              setBatchEnabled(true);
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
          setLog((prev) => [...prev, { type: 'error', msg: 'WebSocket indisponível — tentando polling…' }]);
          startPolling();
        }
      }
    };
  }, [jobId, channel, cancelado, concluido, startPolling]);

  useEffect(() => {
    mountedRef.current = true;
    if (!jobId) return;
    setCancelado(false);
    setConcluido(false);
    setBatchEnabled(false);
    retryCountRef.current = 0;

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobId, channel]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelar = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
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
    cancelar,
    batchEnabled,
    batchPath,
  };
}

export function useBatchResults(jobId: string | null, enabled: boolean, batchPath: string = '/orgao/analise/batch') {
  return useQuery({
    queryKey: ['licitacao', 'batch', jobId],
    queryFn: () => api.get<any>(`${batchPath}/${jobId}`),
    enabled: !!jobId && enabled,
    staleTime: 0,
  });
}
