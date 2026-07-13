import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useSearchMutation } from '@/shared/lib/hooks/useSearchMutation';
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

export function useEmpresasSearch() {
  return useSearchMutation<string, TseEmpresaResult>({
    mutationKey: ['tse', 'empresas'],
    mutationFn: (cnpj: string) =>
      api.post<TseEmpresaResult>(ENDPOINTS.TSE_RELACOES, { cnpj }),
    searchLabel: (cnpj) => `TSE - Empresas (CNPJ ${cnpj})`,
    searchRoute: '/tse',
    searchId: (cnpj) => `tse-empresas-${cnpj}`,
  });
}

export function useCargoSearch() {
  return useSearchMutation<Record<string, unknown>, CandidatosResult>({
    mutationKey: ['tse', 'cargos'],
    mutationFn: (body) =>
      api.post<CandidatosResult>(ENDPOINTS.TSE_CANDIDATOS, body),
    searchLabel: 'TSE - Políticos por Cargo',
    searchRoute: '/tse',
    searchId: 'tse-cargos',
  });
}

export function usePartidoSearch() {
  return useSearchMutation<Record<string, unknown>, CandidatosResult>({
    mutationKey: ['tse', 'partidos'],
    mutationFn: (body) =>
      api.post<CandidatosResult>(ENDPOINTS.TSE_CANDIDATOS, body),
    searchLabel: 'TSE - Políticos por Partido',
    searchRoute: '/tse',
    searchId: 'tse-partidos',
  });
}

export function useDoadorSearch() {
  return useSearchMutation<string, TseDoadorResult>({
    mutationKey: ['tse', 'doadores'],
    mutationFn: (documento: string) =>
      api.post<TseDoadorResult>(ENDPOINTS.TSE_DOADORES, { documento }),
    searchLabel: (doc) => `TSE - Doadores (${doc})`,
    searchRoute: '/tse',
    searchId: (doc) => `tse-doadores-${doc}`,
  });
}

export function useFornecedorSearch() {
  return useSearchMutation<string, TseFornecedorResult>({
    mutationKey: ['tse', 'fornecedores'],
    mutationFn: (documento: string) =>
      api.post<TseFornecedorResult>(ENDPOINTS.TSE_FORNECEDORES, { documento }),
    searchLabel: (doc) => `TSE - Fornecedores (${doc})`,
    searchRoute: '/tse',
    searchId: (doc) => `tse-fornecedores-${doc}`,
  });
}
