import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import type {
  TseEmpresaResult,
  CandidatosResult,
  CargoOption,
  PartidoOption,
  OpcoesResult,
  TseDoadorResult,
  TseFornecedorResult,
} from '../model/types';

export function useTseEmpresas(cnpj: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tse', 'empresas', cnpj],
    queryFn: () => api.post<TseEmpresaResult>(ENDPOINTS.TSE_RELACOES, { cnpj }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCargos() {
  return useQuery({
    queryKey: ['tse', 'cargos'],
    queryFn: () => api.get<OpcoesResult<CargoOption>>(ENDPOINTS.TSE_CARGOS),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePartidos() {
  return useQuery({
    queryKey: ['tse', 'partidos'],
    queryFn: () => api.get<OpcoesResult<PartidoOption>>(ENDPOINTS.TSE_PARTIDOS),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCandidatos(body: Record<string, unknown>, enabled: boolean) {
  return useQuery({
    queryKey: ['tse', 'candidatos', body],
    queryFn: () => api.post<CandidatosResult>(ENDPOINTS.TSE_CANDIDATOS, body),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDoadores(documento: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tse', 'doadores', documento],
    queryFn: () => api.post<TseDoadorResult>(ENDPOINTS.TSE_DOADORES, { documento }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFornecedores(documento: string, enabled: boolean) {
  return useQuery({
    queryKey: ['tse', 'fornecedores', documento],
    queryFn: () => api.post<TseFornecedorResult>(ENDPOINTS.TSE_FORNECEDORES, { documento }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
