import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import type { AnaliseResponse } from '@/entities/licitacao/types';
import { ENDPOINTS } from '@/shared/api/endpoints';

interface StartAnaliseParams {
  cnpjs: string[];
  dataInicial: string;
  dataFinal: string;
}

interface StartPublicacaoParams {
  uf: string;
  municipio?: string;
  dataInicial: string;
  dataFinal: string;
}

export function useStartOrgaoAnalise() {
  return useMutation({
    mutationFn: (params: StartAnaliseParams) =>
      api.post<AnaliseResponse>(ENDPOINTS.ORGAO_ANALISE_START, {
        cnpjs: params.cnpjs,
        dataInicial: params.dataInicial.replace(/-/g, ''),
        dataFinal: params.dataFinal.replace(/-/g, ''),
      }),
  });
}

export function useStartPublicacaoAnalise() {
  return useMutation({
    mutationFn: (params: StartPublicacaoParams) =>
      api.post<AnaliseResponse>(ENDPOINTS.PUBLICACAO_ANALISE_START, {
        uf: params.uf,
        municipio: params.municipio,
        dataInicial: params.dataInicial.replace(/-/g, ''),
        dataFinal: params.dataFinal.replace(/-/g, ''),
      }),
  });
}
