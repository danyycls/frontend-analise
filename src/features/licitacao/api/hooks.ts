import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSearchMutation } from '@/shared/lib/hooks/useSearchMutation';
import { API_BASE_URL } from '@/shared/config';
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

export interface PublicacaoSearchParams {
  tipo: 'uf' | 'municipio';
  uf: string;
  codigoMunicipio: string;
  ano: string;
  trimestres: number[];
  modalidade: string;
}

export function useStartOrgaoAnalise() {
  return useMutation({
    mutationKey: ['search', 'licitacao', 'orgao-analise'],
    mutationFn: (params: StartAnaliseParams) =>
      api.post<AnaliseResponse>(ENDPOINTS.ORGAO_ANALISE_START, {
        cnpjs: params.cnpjs,
        dataInicial: params.dataInicial.replace(/-/g, ''),
        dataFinal: params.dataFinal.replace(/-/g, ''),
      }),
    meta: {
      getSearchLabel: () => 'Licitações - Análise CNPJ',
      searchRoute: '/licitacoes',
    },
  });
}

export function useStartUFMunicipioAnalise() {
  return useMutation({
    mutationKey: ['search', 'licitacao', 'uf-municipio-analise'],
    mutationFn: (params: StartPublicacaoParams) =>
      api.post<AnaliseResponse>(ENDPOINTS.UF_MUNICIPIO_ANALISE_START, {
        tipo: params.municipio ? 'municipio' : 'uf',
        uf: params.uf,
        codigo_municipio_ibge: params.municipio || '',
        data_inicial: params.dataInicial.replace(/-/g, ''),
        data_final: params.dataFinal.replace(/-/g, ''),
      }),
    meta: {
      getSearchLabel: () => 'Licitações - Análise UF/Município',
      searchRoute: '/licitacoes',
    },
  });
}

export function usePublicacaoSearch() {
  return useSearchMutation<PublicacaoSearchParams, any[]>({
    mutationKey: ['licitacao', 'publicacao'],
    mutationFn: async (params) => {
      const { tipo, uf, codigoMunicipio, ano, modalidade } = params;

      const endp =
        tipo === 'municipio' && codigoMunicipio
          ? `${API_BASE_URL}/estado/${uf}/licitacoes/municipio/${codigoMunicipio}?ano=${ano}`
          : `${API_BASE_URL}/estado/${uf}/licitacoes?ano=${ano}`;

      const res = await fetch(endp);
      if (!res.ok) throw new Error(`Erro ao buscar licitações ${ano}: ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    searchLabel: (p) => `Licitações - ${p.uf} ${p.ano}`,
    searchRoute: '/licitacoes',
    searchId: (p) => `licitacao-publicacao-${p.uf}-${p.ano}`,
  });
}
