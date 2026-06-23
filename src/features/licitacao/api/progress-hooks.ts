import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
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

type AnaliseType = 'orgao' | 'publicacao';

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

  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  useEffect(() => {
    if (!jobId) return;
    setCancelado(false);
    setConcluido(false);
    setBatchEnabled(false);

    const ws = new WebSocket(`${WS_BASE_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ channel, job_id: jobId }));
    };

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
              { type: 'success', msg: `${ev.orgao || ''} — ${ev.totalContratos} contratos`, cnpj: ev.cnpj },
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
            setBatchEnabled(true);
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
  }, [jobId, channel]);

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
    cancelar,
    batchEnabled,
  };
}

export function useBatchResults(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['licitacao', 'batch', jobId],
    queryFn: () => api.get<any>(`/orgao/analise/batch/${jobId}`),
    enabled: !!jobId && enabled,
    staleTime: 0,
  });
}
